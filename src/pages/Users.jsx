import { useState } from 'react'
import {
    PlusCircle, Search, MoreHorizontal, Pencil, Trash2,
    Loader2, Users, Shield, Eye, EyeOff
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'

const ROLES = ['admin', 'gerente', 'mecanico', 'tecnico', 'vendedor']

const emptyForm = { name: '', username: '', role: 'tecnico', password: '', confirmPassword: '' }

export default function UsersPage() {
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [showPass, setShowPass] = useState(false)

    const queryClient = useQueryClient()

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['app_users'],
        queryFn: api.users.list
    })

    const createMutation = useMutation({
        mutationFn: api.users.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['app_users'])
            setDialogOpen(false)
            toast.success('Usuário criado com sucesso!')
        },
        onError: (e) => toast.error('Erro ao criar usuário: ' + e.message)
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.users.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['app_users'])
            setDialogOpen(false)
            toast.success('Usuário atualizado!')
        },
        onError: (e) => toast.error('Erro ao atualizar: ' + e.message)
    })

    const deleteMutation = useMutation({
        mutationFn: api.users.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['app_users'])
            toast.success('Usuário removido!')
        },
        onError: (e) => toast.error('Erro ao remover: ' + e.message)
    })

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    )

    const openNew = () => {
        setEditingUser(null)
        setForm(emptyForm)
        setShowPass(false)
        setDialogOpen(true)
    }

    const openEdit = (u) => {
        setEditingUser(u)
        setForm({ name: u.name, username: u.username, role: u.role, password: '', confirmPassword: '' })
        setShowPass(false)
        setDialogOpen(true)
    }

    const handleSubmit = () => {
        if (!form.name.trim() || !form.username.trim()) {
            toast.error('Nome e usuário são obrigatórios')
            return
        }
        if (!editingUser && !form.password) {
            toast.error('Senha é obrigatória para novo usuário')
            return
        }
        if (form.password && form.password !== form.confirmPassword) {
            toast.error('As senhas não coincidem')
            return
        }

        if (editingUser) {
            updateMutation.mutate({
                id: editingUser.id,
                data: {
                    name: form.name,
                    username: form.username,
                    role: form.role,
                    password: form.password || null
                }
            })
        } else {
            createMutation.mutate({
                name: form.name,
                username: form.username,
                role: form.role,
                password: form.password
            })
        }
    }

    const handleDelete = (u) => {
        if (u.role === 'admin') {
            toast.error('Não é possível excluir o administrador')
            return
        }
        if (confirm(`Excluir usuário "${u.name}"?`)) {
            deleteMutation.mutate(u.id)
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
                    <h1 className="text-2xl font-bold">Usuários do Sistema</h1>
                    <p className="text-muted-foreground">{users.length} usuário(s) cadastrado(s)</p>
                </div>
                <Button onClick={openNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Usuário
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou usuário..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            Nenhum usuário encontrado.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {/* Header */}
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <span>Nome / Usuário</span>
                                <span className="text-center">Função</span>
                                <span className="text-center">Status</span>
                                <span />
                            </div>
                            {filtered.map((u) => (
                                <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-4 items-center hover:bg-muted/30 transition-colors group">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Shield className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{u.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_COLORS[u.role]}`}>
                                        {ROLE_LABELS[u.role]}
                                    </span>

                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.active !== false
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-500'}`}>
                                        {u.active !== false ? 'Ativo' : 'Inativo'}
                                    </span>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(u)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDelete(u)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'Atualize os dados. Deixe a senha em branco para não alterar.'
                                : 'Preencha os dados do novo usuário do sistema.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="user-name">Nome completo *</Label>
                            <Input
                                id="user-name"
                                value={form.name}
                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ex: João da Silva"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-username">Usuário (login) *</Label>
                                <Input
                                    id="user-username"
                                    value={form.username}
                                    onChange={(e) => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                                    placeholder="joao.silva"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-role">Função *</Label>
                                <select
                                    id="user-role"
                                    value={form.role}
                                    onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {ROLES.map(r => (
                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user-password">
                                {editingUser ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="user-password"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {form.password && (
                            <div className="space-y-2">
                                <Label htmlFor="user-confirm">Confirmar senha *</Label>
                                <Input
                                    id="user-confirm"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className={form.password && form.confirmPassword && form.password !== form.confirmPassword ? 'border-destructive' : ''}
                                />
                                {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                                    <p className="text-xs text-destructive">As senhas não coincidem</p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingUser ? 'Salvar' : 'Criar Usuário'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
