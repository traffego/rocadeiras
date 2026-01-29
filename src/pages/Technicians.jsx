import { useState } from 'react'
import {
    PlusCircle,
    MoreHorizontal,
    Pencil,
    Trash2,
    UserCheck,
    UserX
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// Mock de técnicos
const tecnicosMock = [
    { id: '1', nome: 'Carlos Ferreira', ativo: true },
    { id: '2', nome: 'Roberto Lima', ativo: true },
    { id: '3', nome: 'José Santos', ativo: false },
]

export default function Technicians() {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingTecnico, setEditingTecnico] = useState(null)
    const [nome, setNome] = useState('')

    const openNewDialog = () => {
        setEditingTecnico(null)
        setNome('')
        setDialogOpen(true)
    }

    const openEditDialog = (tecnico) => {
        setEditingTecnico(tecnico)
        setNome(tecnico.nome)
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        console.log('Salvando técnico:', nome)
        // TODO: Salvar no Supabase
        setDialogOpen(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Técnicos</h1>
                    <p className="text-muted-foreground">
                        {tecnicosMock.filter(t => t.ativo).length} técnicos ativos
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
                                {editingTecnico ? 'Editar Técnico' : 'Novo Técnico'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingTecnico
                                    ? 'Atualize os dados do técnico'
                                    : 'Informe o nome do técnico'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="dialog-nome">Nome *</Label>
                                <Input
                                    id="dialog-nome"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Nome do técnico"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={!nome}>
                                {editingTecnico ? 'Salvar' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Lista de técnicos */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tecnicosMock.map(tecnico => (
                    <Card key={tecnico.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`
                    flex h-10 w-10 items-center justify-center rounded-full
                    ${tecnico.ativo ? 'bg-primary/10' : 'bg-muted'}
                  `}>
                                        {tecnico.ativo ? (
                                            <UserCheck className="h-5 w-5 text-primary" />
                                        ) : (
                                            <UserX className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{tecnico.nome}</CardTitle>
                                        <Badge variant={tecnico.ativo ? "default" : "secondary"}>
                                            {tecnico.ativo ? 'Ativo' : 'Inativo'}
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
                                        <DropdownMenuItem onClick={() => openEditDialog(tecnico)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            {tecnico.ativo ? (
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
                                        <DropdownMenuItem className="text-destructive">
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
