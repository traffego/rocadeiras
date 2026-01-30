import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import {
    Search,
    Filter,
    ChevronRight,
    Loader2,
    Eye,
    PlusCircle,
    Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const equipmentTypeLabel = {
    brush_cutter: 'Roçadeira',
    chainsaw: 'Motosserra',
    sprayer: 'Pulverizador'
}

export default function Orders() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Fetch orders and columns for status labels
    const { data: orders = [], isLoading: loadingOrders } = useQuery({
        queryKey: ['orders'],
        queryFn: api.orders.list
    })

    const { data: columns = [], isLoading: loadingColumns } = useQuery({
        queryKey: ['kanban_columns'],
        queryFn: api.kanban.list
    })

    const statusMap = useMemo(() => {
        const map = {}
        columns.forEach(col => {
            map[col.slug] = col.title
        })
        return map
    }, [columns])

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                (order.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                order.order_number.toString().includes(search) ||
                (order.equipment_model || '').toLowerCase().includes(search.toLowerCase()) ||
                (order.equipment_brand || '').toLowerCase().includes(search.toLowerCase())

            const matchesStatus = statusFilter === 'all' || order.current_status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [search, statusFilter, orders])

    if (loadingOrders || loadingColumns) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Listagem de OS</h1>
                    <p className="text-muted-foreground">Gerencie todas as ordens de serviço</p>
                </div>
                <Link to="/os/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova OS
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente, OS, marca ou modelo..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                {columns.map(col => (
                                    <SelectItem key={col.slug} value={col.slug}>{col.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">OS</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Equipamento</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data Entrada</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Nenhuma ordem de serviço encontrada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-muted/50">
                                            <TableCell className="font-bold">#{order.order_number}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{order.customer?.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {order.equipment_brand} {order.equipment_model}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground uppercase">
                                                    {equipmentTypeLabel[order.equipment_type] || order.equipment_type}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-primary/5">
                                                    {statusMap[order.current_status] || order.current_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {new Date(order.entry_date).toLocaleDateString('pt-BR')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link to={`/os/${order.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Detalhes
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
