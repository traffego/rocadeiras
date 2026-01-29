import { useState } from 'react'
import {
    PlusCircle,
    MoreHorizontal,
    Pencil,
    Trash2,
    UserCheck,
    UserX,
    Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'

export default function Technicians() {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingTechnician, setEditingTechnician] = useState(null)
    const [name, setName] = useState('')

    const queryClient = useQueryClient()

    // Fetch Technicians
    const { data: technicians = [], isLoading } = useQuery({
        queryKey: ['technicians'],
        queryFn: api.technicians.list
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: api.technicians.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['technicians'])
            setDialogOpen(false)
            toast.success("Técnico cadastrado!")
        },
        onError: (e) => toast.error(e.message)
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.technicians.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['technicians'])
            setDialogOpen(false)
            toast.success("Técnico atualizado!")
        },
        onError: (e) => toast.error(e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: api.technicians.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['technicians'])
            toast.success("Técnico removido!")
        },
        onError: (e) => toast.error(e.message)
    })

    const openNewDialog = () => {
        setEditingTechnician(null)
        setName('')
        setDialogOpen(true)
    }

    const openEditDialog = (tech) => {
        setEditingTechnician(tech)
        setName(tech.name)
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        if (editingTechnician) {
            updateMutation.mutate({ id: editingTechnician.id, data: { name } })
        } else {
            createMutation.mutate({ name })
        }
    }

    const toggleStatus = (tech) => {
        updateMutation.mutate({ id: tech.id, data: { active: !tech.active } })
    }

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir?')) {
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
                    <h1 className="text-2xl font-bold">Técnicos</h1>
                    <p className="text-muted-foreground">
                        {technicians.filter(t => t.active).length} técnicos ativos
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Técnico
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingTechnician ? 'Editar Técnico' : 'Novo Técnico'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingTechnician
                                    ? 'Atualize os dados do técnico'
                                    : 'Informe o nome do técnico'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nome do técnico"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={!name || isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingTechnician ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {technicians.map(tech => (
                    <Card key={tech.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`
                    flex h-10 w-10 items-center justify-center rounded-full
                    ${tech.active ? 'bg-primary/10' : 'bg-muted'}
                  `}>
                                        {tech.active ? (
                                            <UserCheck className="h-5 w-5 text-primary" />
                                        ) : (
                                            <UserX className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{tech.name}</CardTitle>
                                        <Badge variant={tech.active ? "default" : "secondary"}>
                                            {tech.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEditDialog(tech)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toggleStatus(tech)}>
                                            {tech.active ? (
                                                <>
                                                    <UserX className="mr-2 h-4 w-4" />
                                                    Desativar
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                    Ativar
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tech.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
