import { useState, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, GripVertical, AlertCircle, Loader2, Wrench, ZoomIn, ZoomOut } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from 'lucide-react'

// --- Internal Components ---

function SortableColumn({ column, orders, columns, onMove, onDelete, onUpdateTitle, zoom }) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: column.slug,
        data: {
            type: 'Column',
            column
        }
    })

    const style = {
        transition,
        transform: CSS.Transform.toString(transform)
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-muted/50 w-[350px] h-[500px] rounded-lg border-2 border-primary opacity-50 flex-shrink-0"
            />
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-muted/30 w-[350px] flex-shrink-0 rounded-lg flex flex-col h-full max-h-[calc(100vh-12rem)]"
        >
            {/* Column Header */}
            <div
                {...attributes}
                {...listeners}
                className="p-4 font-medium flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-muted/50 rounded-t-lg transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                        {orders.length}
                    </span>
                    <span style={{ fontSize: `calc(1rem / ${zoom})`, lineHeight: 1.2 }}>
                        {column.title}
                    </span>
                </div>

                {/* Only allow deleting if custom (not default) - for safety, or allow all with confirm? Let's just allow all for now but warn */}
                {/* <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
        </Button> */}
            </div>

            {/* Column Content (Droppable Area for tasks) */}
            <div className="flex-1 p-2 overflow-y-auto space-y-2">
                <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    {orders.map(order => (
                        <SortableTask
                            key={order.id}
                            order={order}
                            columns={columns}
                            columns={columns}
                            onMove={onMove}
                            zoom={zoom}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}

function SortableTask({ order, columns, onMove, zoom }) {
    const navigate = useNavigate()
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: order.id,
        data: {
            type: 'Task',
            order
        }
    })

    const style = {
        transition,
        transform: CSS.Transform.toString(transform)
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-background p-4 rounded-lg border-2 border-primary opacity-50 h-[100px]"
            />
        )
    }

    const equipmentTypeLabel = {
        brush_cutter: 'Roçadeira',
        chainsaw: 'Motosserra',
        sprayer: 'Pulverizador'
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => navigate(`/os/${order.id}`)} // Click opens details
            className="bg-background p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span
                        className="font-bold text-sm text-primary"
                        style={{ fontSize: `calc(0.875rem / ${zoom})`, lineHeight: 1.2 }}
                    >
                        #{order.order_number}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {new Date(order.entry_date).toLocaleDateString('pt-BR')}
                    </span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()} // Prevent card click
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Mover para...</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {columns.map(col => (
                            <DropdownMenuItem
                                key={col.slug}
                                disabled={order.current_status === col.slug}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMove(order.id, col.slug);
                                }}
                            >
                                {col.title}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <p
                className="font-medium text-sm line-clamp-1"
                style={{ fontSize: `calc(0.875rem / ${zoom})`, lineHeight: 1.2 }}
            >
                {order.customer?.name}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
                {equipmentTypeLabel[order.equipment_type] || order.equipment_type} - {order.equipment_model}
            </p>
            {order.technician?.name && (
                <div className="mt-2 pt-2 border-t flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600">
                    <Wrench className="h-3 w-3" />
                    <span className="truncate uppercase tracking-wider">{order.technician.name}</span>
                </div>
            )}
        </div>
    )
}

// --- Main Kanban Board ---

export default function Kanban() {
    const queryClient = useQueryClient()
    const [activeDragItem, setActiveDragItem] = useState(null)
    const [newColumnName, setNewColumnName] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [zoom, setZoom] = useState(1)

    // Data Fetching
    const { data: columns = [], isLoading: loadingColumns } = useQuery({
        queryKey: ['kanban_columns'],
        queryFn: api.kanban.list
    })

    const { data: orders = [], isLoading: loadingOrders } = useQuery({
        queryKey: ['orders'],
        queryFn: api.orders.list
    })

    // Mutations
    const moveColumnMutation = useMutation({
        mutationFn: async ({ slug, position }) => {
            return api.kanban.update(slug, { position })
        },
        onSuccess: () => {
            // Optimistic update effectively handled by local state reordering logic usually, 
            // but here we just invalidate to sync with server
            queryClient.invalidateQueries(['kanban_columns'])
        }
    })

    const createColumnMutation = useMutation({
        mutationFn: async (title) => {
            const slug = title.toLowerCase().trim().replace(/\s+/g, '_')
            // Get max position
            const maxPos = Math.max(...columns.map(c => c.position), 0)
            return api.kanban.create({ title, slug, position: maxPos + 10 })
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['kanban_columns'])
            setNewColumnName('')
            setIsDialogOpen(false)
            toast.success("Coluna criada!")
        },
        onError: (e) => toast.error("Erro ao criar coluna: " + e.message)
    })

    const updateOrderStatusMutation = useMutation({
        mutationFn: async ({ orderId, newStatus }) => {
            return api.orders.update(orderId, { current_status: newStatus })
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders'])
            toast.success("Status atualizado!")
        }
    })

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 } // Avoid accidental drags on click
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    )

    // Derived State
    const columnsId = useMemo(() => columns.map(col => col.slug), [columns])

    // Drag Handlers
    function onDragStart(event) {
        if (event.active.data.current?.type === 'Column') {
            setActiveDragItem(event.active.data.current.column)
            return
        }
        if (event.active.data.current?.type === 'Task') {
            setActiveDragItem(event.active.data.current.order)
            return
        }
    }

    function onDragEnd(event) {
        setActiveDragItem(null)
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Handling Column Drag
        if (active.data.current?.type === 'Column') {
            if (activeId === overId) return

            const oldIndex = columns.findIndex(col => col.slug === activeId)
            const newIndex = columns.findIndex(col => col.slug === overId)

            // Calculate new position logically roughly
            // In a real app we'd update all positions, here we just swap strictly for UI 
            // and maybe send updates. For simplicity let's just reorder locally for now or invalid queries?
            // Reordering columns properly requires updating positions in DB.
            return
        }

        // Handling Task Drag
        if (active.data.current?.type === 'Task') {
            const activeOrder = active.data.current.order
            const overType = over.data.current?.type

            // Dropped over a column
            if (overType === 'Column') {
                const newStatus = over.data.current.column.slug
                if (activeOrder.current_status !== newStatus) {
                    updateOrderStatusMutation.mutate({
                        orderId: activeOrder.id,
                        newStatus
                    })
                }
            }
            // Dropped over another task
            else if (overType === 'Task') {
                const overOrder = over.data.current.order
                const newStatus = overOrder.current_status
                if (activeOrder.current_status !== newStatus) {
                    updateOrderStatusMutation.mutate({
                        orderId: activeOrder.id,
                        newStatus
                    })
                }
            }
        }
    }

    if (loadingColumns || loadingOrders) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 px-2">
                <h1 className="text-3xl font-bold">Quadro Kanban</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Coluna
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Nova Coluna</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2 mt-4">
                            <Input
                                placeholder="Ex: Aguardando Peças"
                                value={newColumnName}
                                onChange={e => setNewColumnName(e.target.value)}
                            />
                            <Button onClick={() => createColumnMutation.mutate(newColumnName)}>
                                Criar
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex justify-end gap-2 px-2 mb-2">
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                        disabled={zoom <= 0.5}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium w-8 text-center">{Math.round(zoom * 100)}%</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                        disabled={zoom >= 1.5}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            >
                <div
                    className="flex gap-4 overflow-x-auto h-full pb-4 px-2 items-start"
                    style={{ zoom: zoom }}
                >
                    <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                        {columns.map(col => (
                            <SortableColumn
                                key={col.slug}
                                column={col}
                                orders={orders.filter(o => o.current_status === col.slug)}
                                columns={columns}
                                columns={columns}
                                onMove={(orderId, newStatus) => updateOrderStatusMutation.mutate({ orderId, newStatus })}
                                zoom={zoom}
                            />
                        ))}
                    </SortableContext>
                </div>

                {/* Drag Overlay for smooth visual */}
                <DragOverlay>
                    {activeDragItem && (
                        <div style={{ zoom: zoom }}>
                            {activeDragItem.slug ? (
                                <div className="bg-muted w-[350px] h-[500px] rounded-lg border-2 border-primary shadow-xl opacity-90 flex items-center justify-center font-bold text-lg">
                                    {activeDragItem.title}
                                </div>
                            ) : (
                                <div className="bg-background p-3 rounded-lg border shadow-xl w-[300px]">
                                    <p className="font-bold text-sm text-primary">#{activeDragItem.order_number}</p>
                                    <p className="font-medium text-sm">{activeDragItem.customer?.name}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
