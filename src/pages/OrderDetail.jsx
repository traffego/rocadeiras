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
    XCircle,
    X,
    Play,
    Youtube,
    History,
    CheckSquare
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
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


export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const cameraInputRef = useRef(null)
    const [lightbox, setLightbox] = useState(null) // { url, type }


    const [loadingUpload, setLoadingUpload] = useState(false)
    const [obs, setObs] = useState('')

    const queryClient = useQueryClient()
    const { profile } = useAuth()

    const { data: order, isLoading, isError, error } = useQuery({
        queryKey: ['order', id],
        queryFn: () => api.orders.getById(id),
        retry: false
    })

    const { data: technicians = [] } = useQuery({
        queryKey: ['technicians'],
        queryFn: api.technicians.list
    })

    const { data: logs = [] } = useQuery({
        queryKey: ['os_logs', id],
        queryFn: () => api.osLogs.getByOrderId(id),
        enabled: !!id
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

    const deleteFileMutation = useMutation({
        mutationFn: async (file) => {
            const { error } = await supabase.from('files').delete().eq('id', file.id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order', id])
            toast.success("Arquivo removido")
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

    // Log helpers
    const isAcceptablePhase = order.current_status !== 'received' && order.current_status !== 'finished'
    const currentPhaseAccepted = logs.some(l => l.action === 'accepted' && l.phase === order.current_status)

    const phaseLabel = (phase) => statusConfig[phase]?.label || phase || ''
    const formatLog = (log) => {
        const num = order.order_number?.toString().padStart(4, '0') || '0000'
        const d = new Date(log.created_at)
        const date = d.toLocaleDateString('pt-BR')
        const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        const suffix = `— ${date} às ${time}`
        switch (log.action) {
            case 'created':   return `OS #${num} cadastrada por ${log.user_name} ${suffix}`
            case 'moved':     return `OS #${num} movida para [${phaseLabel(log.phase)}] por ${log.user_name} ${suffix}`
            case 'accepted':  return `OS #${num} aceita em [${phaseLabel(log.phase)}] por ${log.user_name} ${suffix}`
            case 'finalized': return `OS #${num} finalizada por ${log.user_name} ${suffix}`
            default:          return `${log.action} por ${log.user_name} ${suffix}`
        }
    }
    const logColor = (action) => ({
        created:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        moved:     'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
        accepted:  'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
        finalized: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    }[action] || 'bg-muted text-muted-foreground')

    const handleAdvanceStep = async () => {
        if (!nextStep) return
        await updateOrderMutation.mutateAsync({ current_status: nextStep })
        const isFinished = nextStep === 'finished'
        try {
            await api.osLogs.create({
                service_order_id: id,
                action: isFinished ? 'finalized' : 'moved',
                phase: nextStep,
                user_name: profile?.name || 'Sistema',
                user_username: profile?.username || null,
                user_role: profile?.role || null
            })
        } catch (e) { console.warn('log error', e) }
        queryClient.invalidateQueries(['os_logs', id])
    }

    const handleAccept = async () => {
        try {
            await api.osLogs.create({
                service_order_id: id,
                action: 'accepted',
                phase: order.current_status,
                user_name: profile?.name || 'Sistema',
                user_username: profile?.username || null,
                user_role: profile?.role || null
            })
            queryClient.invalidateQueries(['os_logs', id])
            toast.success('Aceite registrado!')
        } catch (e) {
            toast.error('Erro ao registrar aceite')
        }
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
                caption: `Upload ${statusConfig[order.current_status].label}`
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
                            {order.customer?.name} • {order.equipment_type_data?.name} {order.equipment_model_data?.name}
                        </p>
                    </div>
                </div>

                {nextStep && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {isAcceptablePhase && !currentPhaseAccepted && (
                            <Button
                                variant="outline"
                                onClick={handleAccept}
                                className="border-green-500 text-green-600 hover:bg-green-50"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Aceitar {statusConfig[order.current_status]?.label}
                            </Button>
                        )}
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
                          ${isCurrent
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : isCompleted
                                                            ? 'bg-green-700 border-green-700 text-white'
                                                            : 'bg-background border-muted text-muted-foreground'}
                        `}>
                                                    {config?.icon ? <config.icon className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${isCurrent ? 'text-green-500' : isCompleted ? 'text-green-700' : ''}`}>
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

                    {/* Histórico de Movimentações */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Histórico
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {logs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro ainda.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {logs.map((log) => (
                                        <div key={log.id} className="flex items-start gap-3">
                                            <span className={`mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${logColor(log.action)}`}>
                                                {log.action === 'created' ? 'CRIOU' :
                                                 log.action === 'moved' ? 'MOVEU' :
                                                 log.action === 'accepted' ? 'ACEITOU' : 'FINALIZOU'}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-muted-foreground leading-snug">{formatLog(log)}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <span className="text-[11px] font-medium">{log.user_name}</span>
                                                    {log.user_username && (
                                                        <span className="text-[11px] text-muted-foreground">@{log.user_username}</span>
                                                    )}
                                                    {log.user_role && (
                                                        <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">{log.user_role}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Orçamento */}
                    <BudgetSection
                        orderId={id}
                        orderStatus={order.current_status}
                        onApprove={async () => {
                            const currentIdx = statusFlow.indexOf(order.current_status || 'received')
                            const washingIdx = statusFlow.indexOf('washing')
                            if (currentIdx < washingIdx) {
                                await updateOrderMutation.mutateAsync({ current_status: 'washing' })
                                try {
                                    await api.osLogs.create({
                                        service_order_id: id,
                                        action: 'moved',
                                        phase: 'washing',
                                        user_name: profile?.name || 'Sistema',
                                        user_username: profile?.username || null,
                                        user_role: profile?.role || null
                                    })
                                    queryClient.invalidateQueries(['os_logs', id])
                                } catch (e) { console.warn('log error', e) }
                            }
                        }}
                    />

                    {/* Fotos e Vídeos — galeria principal */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                Fotos e Vídeos
                                {order.files?.length > 0 && (
                                    <span className="text-xs font-normal text-muted-foreground">({order.files.length})</span>
                                )}
                            </CardTitle>
                            <div className="flex gap-1.5">
                                <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={handleYouTubeLink}>
                                    <Youtube className="h-3.5 w-3.5" /> YouTube
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => cameraInputRef.current?.click()} disabled={loadingUpload}>
                                    <Camera className="h-3.5 w-3.5" /> Câmera
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={loadingUpload}>
                                    {loadingUpload ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Galeria
                                </Button>
                                {/* Input câmera */}
                                <input type="file" ref={cameraInputRef} className="hidden" accept="image/*,video/*" capture="environment" onChange={handleFileUpload} />
                                {/* Input galeria */}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!order.files || order.files.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Camera className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Nenhuma mídia anexada</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {order.files.map(file => (
                                        <div
                                            key={file.id}
                                            className="group relative rounded-lg overflow-hidden border bg-muted cursor-pointer"
                                            style={{ aspectRatio: '1' }}
                                            onClick={() => setLightbox(file)}
                                        >
                                            {/* Thumbnail */}
                                            {file.storage_provider === 'youtube' ? (
                                                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-1">
                                                    <Youtube className="h-6 w-6 text-red-400" />
                                                    <span className="text-[10px] text-slate-400">YouTube</span>
                                                </div>
                                            ) : file.type === 'video' ? (
                                                <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-1">
                                                    <Play className="h-7 w-7 text-white/70" fill="currentColor" />
                                                    <span className="text-[10px] text-slate-400">Vídeo</span>
                                                </div>
                                            ) : (
                                                <img src={file.url} alt={file.caption || ''} className="object-cover w-full h-full" />
                                            )}

                                            {/* Caption */}
                                            {file.caption && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {file.caption}
                                                </div>
                                            )}

                                            {/* Delete */}
                                            <button
                                                onClick={e => { e.stopPropagation(); if (confirm('Remover este arquivo?')) deleteFileMutation.mutate(file) }}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>{/* end md:col-span-2 */}

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
                                <span className="font-medium">Tipo:</span> {order.equipment_type_data?.name || '—'}
                            </div>
                            <div>
                                <span className="font-medium">Marca:</span> {order.equipment_model_data?.brand?.name || '—'}
                            </div>
                            <div>
                                <span className="font-medium">Modelo:</span> {order.equipment_model_data?.name || '—'}
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

                    {/* Fotos - sidebar (removido - galeria movida para main) */}

                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        onClick={() => setLightbox(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white"
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <div className="max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
                        {lightbox.storage_provider === 'youtube' ? (
                            <div className="aspect-video w-full">
                                <iframe
                                    src={lightbox.url.replace('watch?v=', 'embed/')}
                                    className="w-full h-full rounded-lg"
                                    allow="autoplay; fullscreen"
                                    allowFullScreen
                                />
                            </div>
                        ) : lightbox.type === 'video' ? (
                            <video
                                src={lightbox.url}
                                controls
                                autoPlay
                                className="max-h-[80vh] max-w-full mx-auto rounded-lg"
                            />
                        ) : (
                            <img
                                src={lightbox.url}
                                alt={lightbox.caption || ''}
                                className="max-h-[85vh] max-w-full mx-auto rounded-lg object-contain"
                            />
                        )}
                        {lightbox.caption && (
                            <p className="text-center text-white/60 text-sm mt-3">{lightbox.caption}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
