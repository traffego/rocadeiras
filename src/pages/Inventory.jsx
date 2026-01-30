import { useState } from 'react'
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    Loader2,
    DollarSign,
    Tag,
    Hash
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function Inventory() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPart, setEditingPart] = useState(null)
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        brand: '',
        default_price: ''
    })

    // Fetch Parts
    const { data: parts = [], isLoading } = useQuery({
        queryKey: ['parts'],
        queryFn: api.parts.list
    })

    // Mutations
    const createPartMutation = useMutation({
        mutationFn: api.parts.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['parts'])
            setIsDialogOpen(false)
            resetForm()
            toast.success("Peça cadastrada com sucesso!")
        },
        onError: (e) => toast.error("Erro ao cadastrar peça: " + e.message)
    })

    const updatePartMutation = useMutation({
        mutationFn: ({ id, updates }) => api.parts.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries(['parts'])
            setIsDialogOpen(false)
            resetForm()
            toast.success("Peça atualizada!")
        },
        onError: (e) => toast.error("Erro ao atualizar: " + e.message)
    })

    const deletePartMutation = useMutation({
        mutationFn: api.parts.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['parts'])
            toast.success("Peça removida!")
        }
    })

    const resetForm = () => {
        setFormData({ code: '', description: '', brand: '', default_price: '' })
        setEditingPart(null)
    }

    const handleEdit = (part) => {
        setEditingPart(part)
        setFormData({
            code: part.code || '',
            description: part.description || '',
            brand: part.brand || '',
            default_price: part.default_price || ''
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            ...formData,
            default_price: Number(formData.default_price)
        }

        if (editingPart) {
            updatePartMutation.mutate({ id: editingPart.id, updates: payload })
        } else {
            createPartMutation.mutate(payload)
        }
    }

    const filteredParts = parts.filter(part =>
        part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Catálogo de Peças</h1>
                    <p className="text-muted-foreground">Gerencie o inventário e preços de peças para o orçamento.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Peça
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingPart ? 'Editar Peça' : 'Cadastrar Nova Peça'}</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes da peça abaixo.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Código</Label>
                                    <Input
                                        id="code"
                                        placeholder="Ex: V001"
                                        value={formData.code}
                                        onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Marca</Label>
                                    <Input
                                        id="brand"
                                        placeholder="Ex: Stihl"
                                        value={formData.brand}
                                        onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição *</Label>
                                <Input
                                    id="description"
                                    placeholder="Ex: Vela de Ignição"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Preço Padrão (R$) *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        className="pl-9"
                                        placeholder="0,00"
                                        required
                                        value={formData.default_price}
                                        onChange={e => setFormData(prev => ({ ...prev, default_price: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={createPartMutation.isPending || updatePartMutation.isPending}>
                                    {(createPartMutation.isPending || updatePartMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingPart ? 'Salvar Alterações' : 'Cadastrar Peça'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por descrição, código ou marca..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredParts.length > 0 ? (
                                filteredParts.map(part => (
                                    <div key={part.id} className="flex flex-col p-4 rounded-xl border bg-card hover:shadow-md transition-shadow group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg">{part.description}</h3>
                                                    {part.code && <Badge variant="secondary" className="text-[10px]">{part.code}</Badge>}
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Tag className="h-3 w-3" />
                                                    {part.brand || 'Marca não informada'}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(part)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        if (confirm("Deseja realmente excluir esta peça?")) {
                                                            deletePartMutation.mutate(part.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-primary">
                                                <span className="text-sm font-medium">R$</span>
                                                <span className="text-xl font-black">
                                                    {Number(part.default_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <Package className="h-4 w-4 text-muted-foreground/30" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center space-y-2">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                                    <p className="text-lg font-medium">Nenhuma peça encontrada</p>
                                    <p className="text-muted-foreground">Tente mudar o termo da busca ou cadastre uma nova peça.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
