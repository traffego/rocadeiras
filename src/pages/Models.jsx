import { useState } from 'react'
import {
    PlusCircle,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Box
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

const EMPTY_FORM = { name: '' }

export default function Models() {
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingModel, setEditingModel] = useState(null)
    const [formData, setFormData] = useState(EMPTY_FORM)

    const queryClient = useQueryClient()

    const { data: models = [], isLoading } = useQuery({
        queryKey: ['models'],
        queryFn: api.models.list
    })

    const createMutation = useMutation({
        mutationFn: api.models.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['models'])
            setDialogOpen(false)
            setFormData(EMPTY_FORM)
            toast.success('Modelo cadastrado!')
        },
        onError: (e) => toast.error('Erro: ' + e.message)
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.models.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['models'])
            setDialogOpen(false)
            toast.success('Modelo atualizado!')
        },
        onError: (e) => toast.error('Erro: ' + e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: api.models.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['models'])
            toast.success('Modelo removido!')
        },
        onError: (e) => toast.error('Erro: ' + e.message)
    })

    const filtered = models.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
    )

    const openNewDialog = () => {
        setEditingModel(null)
        setFormData(EMPTY_FORM)
        setDialogOpen(true)
    }

    const openEditDialog = (model) => {
        setEditingModel(model)
        setFormData({ name: model.name })
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        if (editingModel) updateMutation.mutate({ id: editingModel.id, data: formData })
        else createMutation.mutate(formData)
    }

    const handleDelete = (id) => {
        if (confirm('Excluir este modelo? As combinações de equipamentos vinculadas também serão removidas.')) deleteMutation.mutate(id)
    }

    const isSaving = createMutation.isPending || updateMutation.isPending
    const isFormValid = formData.name.trim()

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Modelos</h1>
                    <p className="text-muted-foreground">{models.length} modelos cadastrados</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Modelo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingModel ? 'Editar Modelo' : 'Novo Modelo'}</DialogTitle>
                            <DialogDescription>
                                {editingModel ? 'Atualize o nome do modelo' : 'Informe o nome do modelo'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="model-name">Nome *</Label>
                                <Input
                                    id="model-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    placeholder="Ex: FS 55"
                                    onKeyDown={(e) => e.key === 'Enter' && isFormValid && handleSubmit()}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={!isFormValid || isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingModel ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Box className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        Nenhum modelo encontrado.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((model) => (
                        <Card key={model.id} className="group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-sm truncate">{model.name}</span>
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
                                            <DropdownMenuItem onClick={() => openEditDialog(model)}>
                                                <Pencil className="mr-2 h-4 w-4" />Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(model.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />Excluir
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
