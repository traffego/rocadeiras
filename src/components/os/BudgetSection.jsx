import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import {
    Plus,
    Trash2,
    DollarSign,
    Loader2,
    CheckCircle2,
    XCircle,
    FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function BudgetSection({ orderId }) {
    const queryClient = useQueryClient()
    const [newItem, setNewItem] = useState({ description: '', price: '', code: '' })
    const [isAdding, setIsAdding] = useState(false)

    // Fetch Budget
    const { data: budget, isLoading } = useQuery({
        queryKey: ['budget', orderId],
        queryFn: () => api.budgets.getByOrderId(orderId)
    })

    // Mutations
    const createBudgetMutation = useMutation({
        mutationFn: () => api.budgets.create({ service_order_id: orderId, status: 'pending', labor_cost: 0 }),
        onSuccess: () => queryClient.invalidateQueries(['budget', orderId])
    })

    const updateBudgetMutation = useMutation({
        mutationFn: (updates) => api.budgets.update(budget.id, updates),
        onSuccess: () => queryClient.invalidateQueries(['budget', orderId])
    })

    const addItemMutation = useMutation({
        mutationFn: (item) => api.budgets.addItem({ ...item, budget_id: budget.id }),
        onSuccess: () => {
            queryClient.invalidateQueries(['budget', orderId])
            setNewItem({ description: '', price: '', code: '' })
            setIsAdding(false)
            toast.success("Item adicionado")
        }
    })

    const removeItemMutation = useMutation({
        mutationFn: api.budgets.removeItem,
        onSuccess: () => {
            queryClient.invalidateQueries(['budget', orderId])
            toast.success("Item removido")
        }
    })

    if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>

    if (!budget) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                        <CardTitle>Nenhum orçamento gerado</CardTitle>
                        <CardDescription>Clique no botão abaixo para iniciar o orçamento desta OS</CardDescription>
                    </div>
                    <Button onClick={() => createBudgetMutation.mutate()} disabled={createBudgetMutation.isPending}>
                        {createBudgetMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Gerar Orçamento
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const itemsTotal = budget.items?.reduce((acc, item) => acc + Number(item.price), 0) || 0
    const total = itemsTotal + Number(budget.labor_cost)

    const handleAddItem = (e) => {
        e.preventDefault()
        if (!newItem.description || !newItem.price) return
        addItemMutation.mutate({
            description: newItem.description,
            price: Number(newItem.price),
            code: newItem.code
        })
    }

    const updateLabor = (val) => {
        updateBudgetMutation.mutate({ labor_cost: Number(val) })
    }

    const updateStatus = (status) => {
        updateBudgetMutation.mutate({ status })
        toast.success(`Orçamento ${status === 'approved' ? 'Aprovado' : 'Reprovado'}!`)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Orçamento</CardTitle>
                    <CardDescription>Peças, serviços e mão de obra</CardDescription>
                </div>
                <Badge variant={budget.status === 'approved' ? 'default' : budget.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {budget.status === 'approved' ? 'Aprovado' : budget.status === 'rejected' ? 'Reprovado' : 'Pendente'}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Items List */}
                <div className="space-y-4">
                    <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Itens e Peças</div>
                    <div className="space-y-2">
                        {budget.items?.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.description}</span>
                                        {item.code && <Badge variant="outline" className="text-[10px]">{item.code}</Badge>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold whitespace-nowrap">
                                        R$ {Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive"
                                        onClick={() => removeItemMutation.mutate(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {isAdding ? (
                            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-4 gap-2 border p-3 rounded-lg bg-card">
                                <Input
                                    placeholder="Descrição"
                                    className="sm:col-span-2"
                                    value={newItem.description}
                                    onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                                    autoFocus
                                />
                                <Input
                                    placeholder="Valor (R$)"
                                    type="number"
                                    step="0.01"
                                    value={newItem.price}
                                    onChange={e => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                                />
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" className="flex-1" disabled={addItemMutation.isPending}>
                                        {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        ) : budget.status === 'pending' && (
                            <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Item/Peça
                            </Button>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Labor and Total */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground">Mão de Obra</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground px-2">R$</span>
                            <Input
                                type="number"
                                step="0.01"
                                className="w-32 text-right font-bold"
                                value={budget.labor_cost}
                                onChange={e => updateLabor(e.target.value)}
                                disabled={budget.status !== 'pending'}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <span className="font-bold text-lg">Total do Orçamento</span>
                        </div>
                        <span className="text-2xl font-black text-primary">
                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Status Controls */}
                {budget.status === 'pending' && (
                    <div className="flex gap-4 pt-2">
                        <Button
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => updateStatus('approved')}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Aprovar Orçamento
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => updateStatus('rejected')}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reprovar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
