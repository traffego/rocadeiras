import { useState } from 'react'
import {
    PlusCircle,
    Search,
    Phone,
    MoreHorizontal,
    Pencil,
    Trash2,
    ClipboardList
} from 'lucide-react'
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

// Mock de clientes
const clientesMock = [
    { id: '1', nome: 'João Silva', whatsapp: '11999999999', cpf: '123.456.789-00', endereco: 'Rua das Flores, 123', totalOS: 5 },
    { id: '2', nome: 'Maria Santos', whatsapp: '11988888888', cpf: '', endereco: 'Av. Principal, 456', totalOS: 3 },
    { id: '3', nome: 'Pedro Oliveira', whatsapp: '11977777777', cpf: '987.654.321-00', endereco: '', totalOS: 8 },
    { id: '4', nome: 'Ana Costa', whatsapp: '11966666666', cpf: '', endereco: 'Rua Nova, 789', totalOS: 1 },
]

export default function Customers() {
    const [busca, setBusca] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCliente, setEditingCliente] = useState(null)
    const [formData, setFormData] = useState({
        nome: '',
        whatsapp: '',
        cpf: '',
        endereco: ''
    })

    const clientesFiltrados = clientesMock.filter(cliente =>
        cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
        cliente.whatsapp.includes(busca)
    )

    const openNewDialog = () => {
        setEditingCliente(null)
        setFormData({ nome: '', whatsapp: '', cpf: '', endereco: '' })
        setDialogOpen(true)
    }

    const openEditDialog = (cliente) => {
        setEditingCliente(cliente)
        setFormData({
            nome: cliente.nome,
            whatsapp: cliente.whatsapp,
            cpf: cliente.cpf,
            endereco: cliente.endereco
        })
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        console.log('Salvando cliente:', formData)
        // TODO: Salvar no Supabase
        setDialogOpen(false)
    }

    const handleWhatsAppClick = (whatsapp) => {
        const numero = whatsapp.replace(/\D/g, '')
        window.open(`https://wa.me/55${numero}`, '_blank')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <p className="text-muted-foreground">
                        {clientesMock.length} clientes cadastrados
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
                                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCliente
                                    ? 'Atualize os dados do cliente'
                                    : 'Preencha os dados para cadastrar um novo cliente'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="dialog-nome">Nome *</Label>
                                <Input
                                    id="dialog-nome"
                                    value={formData.nome}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                                    placeholder="Nome completo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dialog-whatsapp">WhatsApp *</Label>
                                <Input
                                    id="dialog-whatsapp"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dialog-cpf">CPF (opcional)</Label>
                                <Input
                                    id="dialog-cpf"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dialog-endereco">Endereço (opcional)</Label>
                                <Input
                                    id="dialog-endereco"
                                    value={formData.endereco}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                                    placeholder="Rua, número, bairro"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={!formData.nome || !formData.whatsapp}>
                                {editingCliente ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou WhatsApp..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Lista de clientes */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clientesFiltrados.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Nenhum cliente encontrado.
                        </CardContent>
                    </Card>
                ) : (
                    clientesFiltrados.map(cliente => (
                        <Card key={cliente.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(cliente)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">
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
                                    onClick={() => handleWhatsAppClick(cliente.whatsapp)}
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    {cliente.whatsapp}
                                </Button>

                                {cliente.endereco && (
                                    <p className="text-sm text-muted-foreground">
                                        {cliente.endereco}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                                    <ClipboardList className="h-4 w-4" />
                                    {cliente.totalOS} {cliente.totalOS === 1 ? 'ordem de serviço' : 'ordens de serviço'}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
