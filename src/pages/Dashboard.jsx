import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
    PlusCircle,
    Search,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Filter,
    Loader2
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const statusConfig = {
    received: { label: 'Recebida', color: 'bg-gray-500' },
    analysis: { label: 'Análise', color: 'bg-blue-500' },
    budget: { label: 'Orçamento', color: 'bg-yellow-500' },
    washing: { label: 'Lavagem', color: 'bg-cyan-500' },
    assembly: { label: 'Montagem', color: 'bg-purple-500' },
    testing: { label: 'Teste', color: 'bg-green-500' },
    pickup: { label: 'Entrega', color: 'bg-emerald-500' },
    finished: { label: 'Finalizada', color: 'bg-gray-400' },
}

export default function Dashboard() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: api.orders.list
    })

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                (order.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (order.order_number?.toString() || '').includes(search) ||
                (order.equipment_model || '').toLowerCase().includes(search.toLowerCase())

            const matchesStatus = statusFilter === 'all' || order.current_status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [search, statusFilter, orders])

    const stats = {
        total: orders.length,
        inProgress: orders.filter(o => o.current_status !== 'finished' && o.current_status !== 'pickup').length,
        finished: orders.filter(o => o.current_status === 'finished').length,
        waitingBudget: orders.filter(o => o.current_status === 'budget').length
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Visão geral da oficina
                    </p>
                </div>
                <Link to="/os/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova OS
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de OS
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Registradas no sistema
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Em Andamento
                        </CardTitle>
                        <Clock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                        <p className="text-xs text-muted-foreground">
                            Máquinas na oficina
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Aguardando Orçamento
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.waitingBudget}</div>
                        <p className="text-xs text-muted-foreground">
                            Precisam de aprovação
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Finalizadas
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.finished}</div>
                        <p className="text-xs text-muted-foreground">
                            Prontas para entrega
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por cliente, OS ou modelo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Orders List */}
            <div className="grid gap-4">
                {filteredOrders.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Nenhuma OS encontrada.
                        </CardContent>
                    </Card>
                ) : (
                    filteredOrders.map(order => (
                        <Link key={order.id} to={`/os/${order.id}`}>
                            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">#{order.order_number || '---'}</span>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="font-medium">{order.customer?.name || 'Cliente'}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {order.equipment_brand} {order.equipment_model}
                                                {order.equipment_type === 'brush_cutter' && ' (Roçadeira)'}
                                                {order.equipment_type === 'chainsaw' && ' (Motosserra)'}
                                                {order.equipment_type === 'sprayer' && ' (Pulverizador)'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden md:block">
                                                <div className="text-sm font-medium">Entrada</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {order.entry_date ? new Date(order.entry_date).toLocaleDateString('pt-BR') : '---'}
                                                </div>
                                            </div>

                                            <Badge className={`${statusConfig[order.current_status]?.color || 'bg-gray-500'}`}>
                                                {statusConfig[order.current_status]?.label || order.current_status}
                                            </Badge>

                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )))}
            </div>
        </div>
    )
}
