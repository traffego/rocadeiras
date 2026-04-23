import { useState } from 'react'
import {
    PlusCircle,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Cpu
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const TYPE_LABELS = {
    brush_cutter: 'Roçadeira',
    chainsaw: 'Motosserra',
    sprayer: 'Pulverizador',
}

const TYPE_COLORS = {
    brush_cutter: 'bg-green-500',
    chainsaw: 'bg-orange-500',
    sprayer: 'bg-blue-500',
}

const EMPTY_FORM = { type: '', brand: '', model: '' }

export default function Equipments() {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEquipment, setEditingEquipment] = useState(null)
    const [formData, setFormData] = useState(EMPTY_FORM)

    const queryClient = useQueryClient()

    const { data: equipments = [], isLoading } = useQuery({
        queryKey: ['equipments'],
        queryFn: api.equipments.list
    })

    const createMutation = useMutation({
        mutationFn: api.equipments.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['equipments'])
            setDialogOpen(false)
            toast.success('Equipamento cadastrado com sucesso!')
        },
        onError: (e) => toast.error('Erro ao cadastrar: ' + e.message)
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.equipments.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['equipments'])
            setDialogOpen(false)
            toast.success('Equipamento atualizado!')
        },
        onError: (e) => toast.error('Erro ao atualizar: ' + e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: api.equipments.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['equipments'])
            toast.success('Equipamento removido!')
        },
        onError: (e) => toast.error('Erro ao remover: ' + e.message)
    })

    const filtered = equipments.filter(e => {
        const matchesType = typeFilter === 'all' || e.type === typeFilter
        const matchesSearch =
            e.brand.toLowerCase().includes(search.toLowerCase()) ||
            e.model.toLowerCase().includes(search.toLowerCase()) ||
            (TYPE_LABELS[e.type] || '').toLowerCase().includes(search.toLowerCase())
        return matchesType && matchesSearch
    })

    const openNewDialog = () => {
        setEditingEquipment(null)
        setFormData(EMPTY_FORM)
        setDialogOpen(true)
    }

    const openEditDialog = (eq) => {
        setEditingEquipment(eq)
        setFormData({ type: eq.type, brand: eq.brand, model: eq.model })
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        if (editingEquipment) {
            updateMutation.mutate({ id: editingEquipment.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este equipamento?')) {
            deleteMutation.mutate(id)
        }
    }

    const isSaving = createMutation.isPending || updateMutation.isPending
    const isFormValid = formData.type && formData.brand.trim() && formData.model.trim()

    // Group filtered results by brand for display
    const grouped = filtered.reduce((acc, eq) => {
        const key = eq.brand
        if (!acc[key]) acc[key] = []
        acc[key].push(eq)
        return acc
    }, {})

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Equipamentos</h1>
                    <p className="text-muted-foreground">
                        {equipments.length} modelos cadastrados
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Equipamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingEquipment
                                    ? 'Atualize os dados do equipamento'
                                    : 'Preencha os dados para cadastrar um novo modelo'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Tipo *</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="brush_cutter">Roçadeira</SelectItem>
                                        <SelectItem value="chainsaw">Motosserra</SelectItem>
                                        <SelectItem value="sprayer">Pulverizador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brand">Marca *</Label>
                                <Input
                                    id="brand"
                                    value={formData.brand}
                                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                                    placeholder="Ex: Stihl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">Modelo *</Label>
                                <Input
                                    id="model"
                                    value={formData.model}
                                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                    placeholder="Ex: FS 55"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={!isFormValid || isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingEquipment ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por tipo, marca ou modelo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'brush_cutter', 'chainsaw', 'sprayer'].map(type => (
                        <Button
                            key={type}
                            size="sm"
                            variant={typeFilter === type ? 'default' : 'outline'}
                            onClick={() => setTypeFilter(type)}
                        >
                            {type === 'all' ? 'Todos' : TYPE_LABELS[type]}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Cpu className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        Nenhum equipamento encontrado.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([brand, items]) => (
                        <div key={brand}>
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                                {brand}
                            </h2>
                            <Card>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {items.map((eq, idx) => (
                                                <tr
                                                    key={eq.id}
                                                    className={`flex items-center justify-between px-4 py-3 ${idx !== items.length - 1 ? 'border-b border-border' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={`${TYPE_COLORS[eq.type]} text-white text-xs`}>
                                                            {TYPE_LABELS[eq.type]}
                                                        </Badge>
                                                        <span className="font-medium">{eq.model}</span>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditDialog(eq)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleDelete(eq.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
