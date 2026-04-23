import { useState } from 'react'
import {
    PlusCircle,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Tag
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

export default function Brands() {
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingBrand, setEditingBrand] = useState(null)
    const [formName, setFormName] = useState('')

    const queryClient = useQueryClient()

    const { data: brands = [], isLoading } = useQuery({
        queryKey: ['brands'],
        queryFn: api.brands.list
    })

    const createMutation = useMutation({
        mutationFn: api.brands.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['brands'])
            setDialogOpen(false)
            toast.success('Marca cadastrada com sucesso!')
        },
        onError: (e) => toast.error('Erro ao cadastrar: ' + e.message)
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.brands.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['brands'])
            queryClient.invalidateQueries(['equipments'])
            setDialogOpen(false)
            toast.success('Marca atualizada!')
        },
        onError: (e) => toast.error('Erro ao atualizar: ' + e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: api.brands.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['brands'])
            queryClient.invalidateQueries(['equipments'])
            toast.success('Marca removida!')
        },
        onError: (e) => toast.error('Erro ao remover: ' + e.message)
    })

    const filtered = brands.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    )

    const openNewDialog = () => {
        setEditingBrand(null)
        setFormName('')
        setDialogOpen(true)
    }

    const openEditDialog = (brand) => {
        setEditingBrand(brand)
        setFormName(brand.name)
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        if (editingBrand) {
            updateMutation.mutate({ id: editingBrand.id, data: { name: formName } })
        } else {
            createMutation.mutate({ name: formName })
        }
    }

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir esta marca? Equipamentos vinculados perderão a referência.')) {
            deleteMutation.mutate(id)
        }
    }

    const isSaving = createMutation.isPending || updateMutation.isPending

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Marcas</h1>
                    <p className="text-muted-foreground">
                        {brands.length} marcas cadastradas
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Marca
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingBrand ? 'Editar Marca' : 'Nova Marca'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingBrand
                                    ? 'Atualize o nome da marca'
                                    : 'Preencha o nome para cadastrar uma nova marca'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand-name">Nome *</Label>
                                <Input
                                    id="brand-name"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Ex: Stihl"
                                    onKeyDown={(e) => e.key === 'Enter' && formName.trim() && handleSubmit()}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={!formName.trim() || isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingBrand ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar marca..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Cards Grid */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        Nenhuma marca encontrada.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((brand) => (
                        <Card key={brand.id} className="group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="font-semibold text-sm truncate">{brand.name}</span>
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
                                            <DropdownMenuItem onClick={() => openEditDialog(brand)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDelete(brand.id)}
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
