import { useState } from 'react'
import {
    PlusCircle,
    Search,
    Phone,
    MoreHorizontal,
    Pencil,
    Trash2,
    ClipboardList,
    Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from "sonner"

export default function Customers() {
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        cpf: '',
        address: ''
    })

    const queryClient = useQueryClient()

    // Fetch Customers
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: api.customers.list
    })

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: api.customers.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['customers'])
            setDialogOpen(false)
            toast.success("Cliente cadastrado com sucesso!")
        },
        onError: (error) => toast.error("Erro ao cadastrar: " + error.message)
    })

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.customers.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers'])
            setDialogOpen(false)
            toast.success("Cliente atualizado!")
        },
        onError: (error) => toast.error("Erro ao atualizar: " + error.message)
    })

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: api.customers.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['customers'])
            toast.success("Cliente removido!")
        },
        onError: (error) => toast.error("Erro ao remover: " + error.message)
    })

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.whatsapp.includes(search)
    )

    const openNewDialog = () => {
        setEditingCustomer(null)
        setFormData({ name: '', whatsapp: '', cpf: '', address: '' })
        setDialogOpen(true)
    }

    const openEditDialog = (customer) => {
        setEditingCustomer(customer)
        setFormData({
            name: customer.name,
            whatsapp: customer.whatsapp,
            cpf: customer.cpf || '',
            address: customer.address || ''
        })
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            deleteMutation.mutate(id)
        }
    }

    const handleWhatsAppClick = (whatsapp) => {
        const number = whatsapp.replace(/\D/g, '')
        window.open(`https://wa.me/55${number}`, '_blank')
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
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <p className="text-muted-foreground">
                        {customers.length} clientes cadastrados
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCustomer
                                    ? 'Atualize os dados do cliente'
                                    : 'Preencha os dados para cadastrar um novo cliente'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Nome completo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">WhatsApp *</Label>
                                <Input
                                    id="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF (opcional)</Label>
                                <Input
                                    id="cpf"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço (opcional)</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Rua, número, bairro"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={!formData.name || !formData.whatsapp || isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingCustomer ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou WhatsApp..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCustomers.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Nenhum cliente encontrado.
                        </CardContent>
                    </Card>
                ) : (
                    filteredCustomers.map(customer => (
                        <Card key={customer.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(customer.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-green-600 hover:text-green-700"
                                    onClick={() => handleWhatsAppClick(customer.whatsapp)}
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    {customer.whatsapp}
                                </Button>

                                {customer.address && (
                                    <p className="text-sm text-muted-foreground">
                                        {customer.address}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                                    <ClipboardList className="h-4 w-4" />
                                    Visualizar Histórico
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
