import { useState } from 'react'
import {
    PlusCircle,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Layers
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { toast } from 'sonner'

export default function EquipmentTypes() {
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingType, setEditingType] = useState(null)
    const [formData, setFormData] = useState({ name: '' })

    const queryClient = useQueryClient()

    const { data: types = [], isLoading } = useQuery({
        queryKey: ['equipmentTypes'],
        queryFn: api.equipmentTypes.list
    })

    const createMutation = useMutation({
        mutationFn: api.equipmentTypes.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['equipmentTypes'])
            setDialogOpen(false)
            toast.success('Tipo cadastrado com sucesso!')
        },
        onError: (e) => toast.error('Erro ao cadastrar: ' + e.message)
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.equipmentTypes.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['equipmentTypes'])
            queryClient.invalidateQueries(['equipments'])
            setDialogOpen(false)
            toast.success('Tipo atualizado!')
        },
        onError: (e) => toast.error('Erro ao atualizar: ' + e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: api.equipmentTypes.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['equipmentTypes'])
            queryClient.invalidateQueries(['equipments'])
            toast.success('Tipo removido!')
        },
        onError: (e) => toast.error('Erro ao remover: ' + e.message)
    })

    const filtered = types.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    )

    const openNewDialog = () => {
        setEditingType(null)
        setFormData({ name: '' })
        setDialogOpen(true)
    }

    const openEditDialog = (type) => {
        setEditingType(type)
        setFormData({ name: type.name })
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        if (editingType) {
            updateMutation.mutate({ id: editingType.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este tipo?')) {
            deleteMutation.mutate(id)
        }
    }

    const isSaving = createMutation.isPending || updateMutation.isPending
    const isFormValid = formData.name.trim()

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Tipos de Equipamento</h1>
                    <p className="text-muted-foreground">{types.length} tipos cadastrados</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Tipo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingType ? 'Editar Tipo' : 'Novo Tipo'}</DialogTitle>
                            <DialogDescription>
                                {editingType ? 'Atualize os dados do tipo' : 'Preencha os dados para cadastrar um novo tipo'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="type-name">Nome *</Label>
                                <Input
                                    id="type-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ex: Roçadeira"
                                />
                            </div>

                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={!isFormValid || isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingType ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar tipo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        Nenhum tipo encontrado.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((type) => (
                        <Card key={type.id} className="group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-sm truncate">{type.name}</span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(type)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDelete(type.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
