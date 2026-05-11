import { useState, useMemo } from 'react'
import { formatDateTime, formatTime, formatDateLong } from '@/lib/date'
import { Link } from 'react-router-dom'
import {
    History,
    Search,
    Filter,
    ExternalLink,
    Loader2,
    Calendar,
    ChevronDown,
    X
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ACTION_LABELS = {
    created:   { label: 'Cadastrou',  color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    moved:     { label: 'Moveu',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    accepted:  { label: 'Aceitou',    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    finalized: { label: 'Finalizou',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
}

const PHASE_LABELS = {
    received:  'Recebida',
    analysis:  'Análise',
    budget:    'Orçamento',
    washing:   'Lavagem',
    assembly:  'Montagem',
    testing:   'Teste',
    pickup:    'Entrega',
    finished:  'Finalizada',
}

const fmtDate = (iso) => formatDateTime(iso)

const buildMessage = (log) => {
    const num = log.service_orders?.order_number?.toString().padStart(4, '0') || '????'
    const phase = PHASE_LABELS[log.phase] || log.phase || ''
    switch (log.action) {
        case 'created':   return `OS #${num} cadastrada`
        case 'moved':     return `OS #${num} → [${phase}]`
        case 'accepted':  return `OS #${num} aceita em [${phase}]`
        case 'finalized': return `OS #${num} finalizada`
        default:          return `OS #${num} — ${log.action}`
    }
}

export default function ActivityLogPage() {
    const [search, setSearch] = useState('')
    const [filterAction, setFilterAction] = useState('')
    const [filterFrom, setFilterFrom] = useState('')
    const [filterTo, setFilterTo] = useState('')

    const { data: logs = [], isLoading, refetch } = useQuery({
        queryKey: ['os_logs_all'],
        queryFn: () => api.osLogs.getAll()
    })

    // Client-side filtering
    const filtered = useMemo(() => {
        return logs.filter(log => {
            if (filterAction && log.action !== filterAction) return false
            if (filterFrom && new Date(log.created_at) < new Date(filterFrom)) return false
            if (filterTo) {
                const to = new Date(filterTo)
                to.setHours(23, 59, 59)
                if (new Date(log.created_at) > to) return false
            }
            if (search) {
                const s = search.toLowerCase()
                const num = log.service_orders?.order_number?.toString() || ''
                return (
                    log.user_name.toLowerCase().includes(s) ||
                    num.includes(s) ||
                    (PHASE_LABELS[log.phase] || '').toLowerCase().includes(s)
                )
            }
            return true
        })
    }, [logs, search, filterAction, filterFrom, filterTo])

    const hasFilters = search || filterAction || filterFrom || filterTo
    const clearFilters = () => {
        setSearch('')
        setFilterAction('')
        setFilterFrom('')
        setFilterTo('')
    }

    // Group by day
    const grouped = useMemo(() => {
        const groups = {}
        filtered.forEach(log => {
            const day = formatDateLong(log.created_at)
            if (!groups[day]) groups[day] = []
            groups[day].push(log)
        })
        return Object.entries(groups)
    }, [filtered])

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <History className="h-6 w-6" />
                        Log de Atividades
                    </h1>
                    <p className="text-muted-foreground">{filtered.length} registro(s) encontrado(s)</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Atualizar
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Usuário, OS, fase..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Action filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <select
                                value={filterAction}
                                onChange={e => setFilterAction(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">Todas as ações</option>
                                <option value="created">Cadastrou</option>
                                <option value="moved">Moveu</option>
                                <option value="accepted">Aceitou</option>
                                <option value="finalized">Finalizou</option>
                            </select>
                        </div>

                        {/* Date from */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="date"
                                value={filterFrom}
                                onChange={e => setFilterFrom(e.target.value)}
                                className="pl-9"
                                title="De"
                            />
                        </div>

                        {/* Date to */}
                        <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="date"
                                    value={filterTo}
                                    onChange={e => setFilterTo(e.target.value)}
                                    className="pl-9"
                                    title="Até"
                                />
                            </div>
                            {hasFilters && (
                                <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Log timeline */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        Nenhum registro encontrado.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {grouped.map(([day, dayLogs]) => (
                        <div key={day}>
                            {/* Day separator */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{day}</span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <Card>
                                <CardContent className="p-0 divide-y">
                                    {dayLogs.map(log => {
                                        const cfg = ACTION_LABELS[log.action] || ACTION_LABELS.created
                                        const num = log.service_orders?.order_number?.toString().padStart(4, '0')
                                        return (
                                            <div key={log.id} className="flex items-start gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                                                {/* Badge ação */}
                                                <span className={`mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>

                                                {/* Mensagem */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">{buildMessage(log)}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {formatTime(log.created_at)}
                                                    </p>
                                                </div>

                                                {/* Usuário */}
                                                <div className="flex-shrink-0 text-right min-w-[140px]">
                                                    <p className="text-sm font-semibold leading-tight">{log.user_name}</p>
                                                    {log.user_username && (
                                                        <p className="text-xs text-muted-foreground">@{log.user_username}</p>
                                                    )}
                                                    {log.user_role && (
                                                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            {log.user_role}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Link OS */}
                                                {log.service_order_id && (
                                                    <Link
                                                        to={`/os/${log.service_order_id}`}
                                                        className="mt-0.5 text-muted-foreground hover:text-foreground flex-shrink-0"
                                                        title={`Abrir OS #${num}`}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
