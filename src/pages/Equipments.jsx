import { useState } from 'react'
import {
    PlusCircle,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Cpu,
    CheckSquare,
    Square,
    X,
    Tag,
    Layers
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

// Cores por slug (mantidas no frontend pois não há campo color no DB)
const TYPE_COLORS = {
    brush_cutter: 'bg-green-500',
    chainsaw: 'bg-orange-500',
    sprayer: 'bg-blue-500',
}

const EMPTY_FORM = { type_id: '', brand_id: '', model: '' }

export default function Equipments() {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEquipment, setEditingEquipment] = useState(null)
    const [formData, setFormData] = useState(EMPTY_FORM)

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
    const [bulkField, setBulkField] = useState(null)
    const [bulkValue, setBulkValue] = useState('')

    const queryClient = useQueryClient()

    const { data: equipments = [], isLoading } = useQuery({
        queryKey: ['equipments'],
        queryFn: api.equipments.list
    })

    const { data: brands = [] } = useQuery({
        queryKey: ['brands'],
        queryFn: api.brands.list
    })

    const { data: equipmentTypes = [] } = useQuery({
        queryKey: ['equipmentTypes'],
        queryFn: api.equipmentTypes.list
    })

    const createMutation = useMutation({
        mutationFn: api.equipments.create,
        onSuccess: () => { queryClient.invalidateQueries(['equipments']); setDialogOpen(false); toast.success('Equipamento cadastrado!') },
        onError: (e) => toast.error('Erro: ' + e.message)
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.equipments.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries(['equipments']); setDialogOpen(false); toast.success('Equipamento atualizado!') },
        onError: (e) => toast.error('Erro: ' + e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: api.equipments.delete,
        onSuccess: () => { queryClient.invalidateQueries(['equipments']); toast.success('Equipamento removido!') },
        onError: (e) => toast.error('Erro: ' + e.message)
    })

    const bulkUpdateMutation = useMutation({
        mutationFn: ({ ids, updates }) => api.equipments.bulkUpdate(ids, updates),
        onSuccess: () => {
            queryClient.invalidateQueries(['equipments'])
            setBulkDialogOpen(false)
            setBulkValue('')
            const count = selectedIds.size
            setSelectedIds(new Set())
            toast.success(`${count} equipamento(s) atualizado(s)!`)
        },
        onError: (e) => toast.error('Erro: ' + e.message)
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => api.equipments.bulkDelete(ids),
        onSuccess: () => { queryClient.invalidateQueries(['equipments']); setSelectedIds(new Set()); toast.success('Equipamentos removidos!') },
        onError: (e) => toast.error('Erro: ' + e.message)
    })

    const filtered = equipments.filter(e => {
        const brandName = e.brand?.name || ''
        const typeName = e.equipment_type?.name || ''
        const typeSlug = e.equipment_type?.slug || ''
        const matchesType = typeFilter === 'all' || typeSlug === typeFilter
        const matchesSearch =
            brandName.toLowerCase().includes(search.toLowerCase()) ||
            e.model.toLowerCase().includes(search.toLowerCase()) ||
            typeName.toLowerCase().includes(search.toLowerCase())
        return matchesType && matchesSearch
    })

    const isSelectionMode = selectedIds.size > 0
    const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.has(e.id))

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (allFilteredSelected) setSelectedIds(new Set())
        else setSelectedIds(new Set(filtered.map(e => e.id)))
    }

    const openNewDialog = () => { setEditingEquipment(null); setFormData(EMPTY_FORM); setDialogOpen(true) }

    const openEditDialog = (eq) => {
        setEditingEquipment(eq)
        setFormData({ type_id: eq.equipment_type?.id || '', brand_id: eq.brand?.id || '', model: eq.model })
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        if (editingEquipment) updateMutation.mutate({ id: editingEquipment.id, data: formData })
        else createMutation.mutate(formData)
    }

    const handleDelete = (id) => {
        if (confirm('Excluir este equipamento?')) deleteMutation.mutate(id)
    }

    const openBulkDialog = (field) => { setBulkField(field); setBulkValue(''); setBulkDialogOpen(true) }

    const handleBulkUpdate = () => {
        const updates = bulkField === 'type' ? { type_id: bulkValue } : { brand_id: bulkValue }
        bulkUpdateMutation.mutate({ ids: [...selectedIds], updates })
    }

    const handleBulkDelete = () => {
        if (confirm(`Excluir ${selectedIds.size} equipamento(s)?`)) bulkDeleteMutation.mutate([...selectedIds])
    }

    const isSaving = createMutation.isPending || updateMutation.isPending
    const isFormValid = formData.type_id && formData.brand_id && formData.model.trim()
    const isBulkSaving = bulkUpdateMutation.isPending || bulkDeleteMutation.isPending

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Equipamentos</h1>
                    <p className="text-muted-foreground">{equipments.length} modelos cadastrados</p>
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
                            <DialogTitle>{editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
                            <DialogDescription>
                                {editingEquipment ? 'Atualize os dados do equipamento' : 'Preencha os dados para cadastrar um novo modelo'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Tipo *</Label>
                                <Select value={formData.type_id} onValueChange={(v) => setFormData(prev => ({ ...prev, type_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                                    <SelectContent>
                                        {equipmentTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Marca *</Label>
                                <Select value={formData.brand_id} onValueChange={(v) => setFormData(prev => ({ ...prev, brand_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a marca..." /></SelectTrigger>
                                    <SelectContent>
                                        {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
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
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
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
                <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant={typeFilter === 'all' ? 'default' : 'outline'} onClick={() => setTypeFilter('all')}>
                        Todos
                    </Button>
                    {equipmentTypes.map(t => (
                        <Button
                            key={t.id}
                            size="sm"
                            variant={typeFilter === t.slug ? 'default' : 'outline'}
                            onClick={() => setTypeFilter(t.slug)}
                        >
                            {t.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Select-all bar */}
            {isSelectionMode && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <button onClick={toggleSelectAll} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                        {allFilteredSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                        {allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                    <span>•</span>
                    <span>{selectedIds.size} selecionado(s)</span>
                </div>
            )}

            {/* Cards */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Cpu className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        Nenhum equipamento encontrado.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((eq) => {
                        const isSelected = selectedIds.has(eq.id)
                        const slug = eq.equipment_type?.slug || ''
                        return (
                            <Card
                                key={eq.id}
                                onClick={() => toggleSelect(eq.id)}
                                className={`group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {isSelected
                                                ? <CheckSquare className="h-4 w-4 text-primary" />
                                                : <Square className={`h-4 w-4 text-muted-foreground ${isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Badge className={`${TYPE_COLORS[slug] || 'bg-gray-500'} text-white text-xs mb-2`}>
                                                {eq.equipment_type?.name || 'Sem tipo'}
                                            </Badge>
                                            <p className="font-semibold text-sm leading-tight truncate">{eq.brand?.name}</p>
                                            <p className="text-muted-foreground text-sm truncate">{eq.model}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(eq) }}>
                                                    <Pencil className="mr-2 h-4 w-4" />Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(eq.id) }}>
                                                    <Trash2 className="mr-2 h-4 w-4" />Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Bulk Action Bar */}
            {isSelectionMode && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-border shadow-xl rounded-xl px-4 py-3">
                    <span className="text-sm font-medium pr-2 border-r border-border mr-1">{selectedIds.size} selecionado(s)</span>
                    <Button size="sm" variant="outline" onClick={() => openBulkDialog('brand')} disabled={isBulkSaving}>
                        <Tag className="mr-1.5 h-3.5 w-3.5" />Mudar Marca
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openBulkDialog('type')} disabled={isBulkSaving}>
                        <Layers className="mr-1.5 h-3.5 w-3.5" />Mudar Tipo
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleBulkDelete} disabled={isBulkSaving}>
                        {isBulkSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                        Excluir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} disabled={isBulkSaving}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Bulk Edit Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{bulkField === 'type' ? 'Mudar Tipo' : 'Mudar Marca'} em Massa</DialogTitle>
                        <DialogDescription>
                            Alterar {bulkField === 'type' ? 'o tipo' : 'a marca'} de {selectedIds.size} equipamento(s).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {bulkField === 'type' ? (
                            <div className="space-y-2">
                                <Label>Novo Tipo</Label>
                                <Select value={bulkValue} onValueChange={setBulkValue}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                                    <SelectContent>
                                        {equipmentTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Nova Marca</Label>
                                <Select value={bulkValue} onValueChange={setBulkValue}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a marca..." /></SelectTrigger>
                                    <SelectContent>
                                        {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleBulkUpdate} disabled={!bulkValue || bulkUpdateMutation.isPending}>
                            {bulkUpdateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Aplicar em {selectedIds.size} equipamento(s)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
