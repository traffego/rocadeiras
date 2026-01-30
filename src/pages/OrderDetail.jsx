import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Upload,
    FileText,
    DollarSign,
    Loader2,
    Wrench,
    XCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { storage } from '@/services/storage'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import BudgetSection from '@/components/os/BudgetSection'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const statusFlow = ['received', 'analysis', 'budget', 'washing', 'assembly', 'testing', 'pickup', 'finished']

const statusConfig = {
    received: { label: 'Recebida', color: 'bg-gray-500', icon: Clock },
    analysis: { label: 'Análise', color: 'bg-blue-500', icon: Search },
    budget: { label: 'Orçamento', color: 'bg-yellow-500', icon: AlertCircle },
    washing: { label: 'Lavagem', color: 'bg-cyan-500', icon: Clock },
    assembly: { label: 'Montagem', color: 'bg-purple-500', icon: Clock },
    testing: { label: 'Teste', color: 'bg-green-500', icon: CheckCircle2 },
    pickup: { label: 'Entrega', color: 'bg-emerald-500', icon: CheckCircle2 },
    finished: { label: 'Finalizada', color: 'bg-gray-400', icon: CheckCircle2 },
}

const equipmentTypeConfig = {
    brush_cutter: 'Roçadeira',
    chainsaw: 'Motosserra',
    sprayer: 'Pulverizador'
}

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)


    const [loadingUpload, setLoadingUpload] = useState(false)
    const [obs, setObs] = useState('')

    const queryClient = useQueryClient()

    const { data: order, isLoading, isError, error } = useQuery({
        queryKey: ['order', id],
        queryFn: () => api.orders.getById(id),
        retry: false
    })

    const { data: technicians = [] } = useQuery({
        queryKey: ['technicians'],
        queryFn: api.technicians.list
    })

    // Update mutation
    const updateOrderMutation = useMutation({
        mutationFn: (updates) => api.orders.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries(['order', id])
            toast.success("Ordem atualizada!")
        },
        onError: (e) => toast.error(e.message)
    })

    // File Mutation
    const addFileMutation = useMutation({
        mutationFn: api.files.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['order', id])
            toast.success("Arquivo enviado!")
        }
    })

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro ao carregar ordem de serviço</h2>
                <p className="text-muted-foreground mb-4">{error?.message || "Erro desconhecido"}</p>
                <Button variant="outline" onClick={() => navigate('/os')}>Voltar para Lista</Button>
            </div>
        )
    }

    if (!order) {
        return <div className="flex justify-center p-8">Ordem não encontrada</div>
    }

    const currentStepIndex = statusFlow.indexOf(order.current_status || 'received')
    const nextStep = statusFlow[currentStepIndex + 1]

    const handleAdvanceStep = () => {
        if (!nextStep) return
        updateOrderMutation.mutate({ current_status: nextStep })
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setLoadingUpload(true)
        try {
            const result = await storage.upload(file, `order-${id}`)
            await addFileMutation.mutateAsync({
                service_order_id: id,
                url: result.url,
                step: order.current_status,
                type: file.type.startsWith('video') ? 'video' : 'photo',
                caption: `Upload ${statusConfig[order.current_status].label}`,
                storage_path: result.path,
                storage_provider: result.provider
            })
        } catch (error) {
            console.error('Erro upload', error)
            toast.error("Erro no upload: " + error.message)
        } finally {
            setLoadingUpload(false)
        }
    }

    const handleYouTubeLink = async () => {
        const url = prompt("Cole a URL do vídeo do YouTube:")
        if (!url) return

        try {
            const result = await storage.processExternalLink(url, 'youtube')
            await addFileMutation.mutateAsync({
                service_order_id: id,
                url: result.url,
                step: order.current_status,
                type: 'video',
                caption: 'Vídeo YouTube',
                storage_provider: 'youtube'
            })
        } catch (error) {
            toast.error("Erro ao adicionar link")
        }
    }

    const deleteFileMutation = useMutation({
        mutationFn: async (file) => {
            if (file.storage_path) {
                await storage.delete(file.storage_path, file.storage_provider)
            }
            const { error } = await supabase.from('files').delete().eq('id', file.id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order', id])
            toast.success("Arquivo removido")
        }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">OS #{order.order_number?.toString().padStart(4, '0') || '0000'}</h1>
                            <Badge className={statusConfig[order.current_status]?.color || 'bg-gray-500'}>
                                {statusConfig[order.current_status]?.label || order.current_status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {order.customer?.name} • {equipmentTypeConfig[order.equipment_type] || order.equipment_type} {order.equipment_model}
                        </p>
                    </div>
                </div>

                {nextStep && (
                    <div className="flex items-center gap-2">
                        <Button onClick={handleAdvanceStep} disabled={updateOrderMutation.isPending}>
                            {updateOrderMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Avançar para {statusConfig[nextStep]?.label}
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">

                    {/* Status Progress */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fluxo de Trabalho</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-muted" />
                                <div className="space-y-6">
                                    {statusFlow.map((step, index) => {
                                        const isCompleted = index <= currentStepIndex
                                        const isCurrent = index === currentStepIndex
                                        const config = statusConfig[step]

                                        return (
                                            <div key={step} className="relative flex items-center gap-4">
                                                <div className={`
                          relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 
                          ${isCompleted
                                                        ? 'bg-primary border-primary text-primary-foreground'
                                                        : 'bg-background border-muted text-muted-foreground'}
                        `}>
                                                    {config?.icon ? <config.icon className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                                                        {config?.label || step}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orçamento */}
                    <BudgetSection orderId={id} />

                    {/* Observations Input */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Observações da Etapa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="Adicione observações sobre o serviço... (Funcionalidade futura)"
                                    value={obs}
                                    onChange={(e) => setObs(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Técnico Responsável */}
                    <Card className="border-indigo-100 bg-indigo-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-indigo-700">
                                <Wrench className="h-4 w-4" />
                                Técnico Responsável
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select
                                value={order.technician_id || "none"}
                                onValueChange={(v) => updateOrderMutation.mutate({ technician_id: v === "none" ? null : v })}
                                disabled={updateOrderMutation.isPending}
                            >
                                <SelectTrigger className="bg-background border-indigo-200">
                                    <SelectValue placeholder="Atribuir técnico..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {technicians.map(tech => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                            {tech.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Equipamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Dados do Equipamento</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div>
                                <span className="font-medium">Marca:</span> {order.equipment_brand}
                            </div>
                            <div>
                                <span className="font-medium">Modelo:</span> {order.equipment_model}
                            </div>
                            <div>
                                <span className="font-medium">Série:</span> {order.equipment_serial || 'N/A'}
                            </div>
                            <Separator className="my-2" />
                            <div>
                                <span className="font-medium">Defeito:</span>
                                <p className="text-muted-foreground mt-1">{order.reported_defect}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Checklist */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Checklist Inicial</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span>Liga?</span>
                                <Badge variant={order.machine_turns_on ? "default" : "destructive"}>
                                    {order.machine_turns_on ? 'Sim' : 'Não'}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Parada?</span>
                                <Badge variant="outline">
                                    {order.was_stopped ? `${order.stopped_time_months} meses` : 'Não'}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Acessórios?</span>
                                <Badge variant="outline">
                                    {order.has_accessories ? 'Sim' : 'Não'}
                                </Badge>
                            </div>
                            {order.has_accessories && (
                                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                    {order.accessories_description}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Fotos */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base text-indigo-700 flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                Fotos e Vídeos
                            </CardTitle>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 h-8 w-8 p-0" onClick={handleYouTubeLink}>
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 h-8 w-8 p-0" onClick={() => fileInputRef.current?.click()} disabled={loadingUpload}>
                                    {loadingUpload ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                </Button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={handleFileUpload}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                {order.files?.map(file => (
                                    <div key={file.id} className="relative aspect-square rounded-md overflow-hidden border group">
                                        {file.storage_provider === 'youtube' ? (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                <FileText className="h-8 w-8 text-white opacity-50" />
                                            </div>
                                        ) : (
                                            <img src={file.url} alt={file.caption} className="object-cover w-full h-full" />
                                        )}
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-6 w-6 rounded-full shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (confirm("Remover este arquivo?")) deleteFileMutation.mutate(file)
                                                }}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                                            {file.caption}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div >
    )
}
