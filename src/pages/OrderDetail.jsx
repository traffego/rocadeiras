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
    DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { uploadToR2 } from '@/lib/r2'

// Mock Data
const mockOS = {
    id: '1',
    numero_os: 1,
    cliente: { nome: 'João Silva', whatsapp: '11999999999' },
    equipamento: {
        tipo: 'rocadeira',
        marca: 'Stihl',
        modelo: 'FS 220',
        serie: 'X123456'
    },
    defeito_relatado: 'Não liga, estava parada há 3 meses',
    checklist: {
        maquina_liga: false,
        estava_parada: true,
        tempo_parada_meses: 3,
        com_acessorios: true,
        descricao_acessorios: 'Lâmina e cinto'
    },
    etapa_atual: 'orcamento',
    historico: [
        { etapa: 'recebida', data: '2024-01-28 10:00', obs: 'Recebida na bancada' },
        { etapa: 'analise', data: '2024-01-28 14:00', obs: 'Carburador sujo' }
    ],
    fotos: [
        { id: 1, url: 'https://placehold.co/300x200?text=Chegada', etapa: 'recebida', legenda: 'Chegada' }
    ]
}

const etapasFlow = ['recebida', 'analise', 'orcamento', 'lavagem', 'montagem', 'teste', 'entrega', 'finalizada']

const etapasConfig = {
    recebida: { label: 'Recebida', color: 'bg-gray-500', icon: Clock },
    analise: { label: 'Análise', color: 'bg-blue-500', icon: Search },
    orcamento: { label: 'Orçamento', color: 'bg-yellow-500', icon: AlertCircle },
    lavagem: { label: 'Lavagem', color: 'bg-cyan-500', icon: Clock },
    montagem: { label: 'Montagem', color: 'bg-purple-500', icon: Clock },
    teste: { label: 'Teste', color: 'bg-green-500', icon: CheckCircle2 },
    entrega: { label: 'Entrega', color: 'bg-emerald-500', icon: CheckCircle2 },
    finalizada: { label: 'Finalizada', color: 'bg-gray-400', icon: CheckCircle2 },
}

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    // State
    const [os, setOs] = useState(mockOS) // In real app, fetch from Supabase
    const [loading, setLoading] = useState(false)
    const [obs, setObs] = useState('')

    const currentStepIndex = etapasFlow.indexOf(os.etapa_atual)
    const nextStep = etapasFlow[currentStepIndex + 1]

    const handleAdvanceStep = () => {
        if (!nextStep) return

        // TODO: Update in Supabase
        setOs(prev => ({
            ...prev,
            etapa_atual: nextStep,
            historico: [
                ...prev.historico,
                { etapa: nextStep, data: new Date().toISOString(), obs: obs || 'Mudança de etapa' }
            ]
        }))
        setObs('')
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setLoading(true)
        try {
            const result = await uploadToR2(file)
            if (result.success) {
                setOs(prev => ({
                    ...prev,
                    fotos: [
                        ...prev.fotos,
                        {
                            id: Date.now(),
                            url: result.url,
                            etapa: os.etapa_atual,
                            legenda: `Foto ${etapasConfig[os.etapa_atual].label}`
                        }
                    ]
                }))
            }
        } catch (error) {
            console.error('Erro upload', error)
        } finally {
            setLoading(false)
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
                            <h1 className="text-2xl font-bold">OS #{os.numero_os.toString().padStart(4, '0')}</h1>
                            <Badge className={etapasConfig[os.etapa_atual].color}>
                                {etapasConfig[os.etapa_atual].label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {os.cliente.nome} • {os.equipamento.tipo} {os.equipamento.modelo}
                        </p>
                    </div>
                </div>

                {nextStep && (
                    <div className="flex items-center gap-2">
                        <Button onClick={handleAdvanceStep}>
                            Avançar para {etapasConfig[nextStep]?.label}
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
                                    {etapasFlow.map((etapa, index) => {
                                        const isCompleted = index <= currentStepIndex
                                        const isCurrent = index === currentStepIndex
                                        const config = etapasConfig[etapa]

                                        return (
                                            <div key={etapa} className="relative flex items-center gap-4">
                                                <div className={`
                          relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 
                          ${isCompleted
                                                        ? 'bg-primary border-primary text-primary-foreground'
                                                        : 'bg-background border-muted text-muted-foreground'}
                        `}>
                                                    <config.icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                                                        {config.label}
                                                    </p>
                                                    {/* Show timestamp if exists in history */}
                                                    {isCompleted && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {os.historico.find(h => h.etapa === etapa)?.data || 'Concluído'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Observations Input */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Observações da Etapa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="Adicione observações sobre o serviço..."
                                    value={obs}
                                    onChange={(e) => setObs(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Equipamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Dados do Equipamento</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div>
                                <span className="font-medium">Marca:</span> {os.equipamento.marca}
                            </div>
                            <div>
                                <span className="font-medium">Modelo:</span> {os.equipamento.modelo}
                            </div>
                            <div>
                                <span className="font-medium">Série:</span> {os.equipamento.serie || 'N/A'}
                            </div>
                            <Separator className="my-2" />
                            <div>
                                <span className="font-medium">Defeito:</span>
                                <p className="text-muted-foreground mt-1">{os.defeito_relatado}</p>
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
                                <Badge variant={os.checklist.maquina_liga ? "default" : "destructive"}>
                                    {os.checklist.maquina_liga ? 'Sim' : 'Não'}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Parada?</span>
                                <Badge variant="outline">
                                    {os.checklist.estava_parada ? `${os.checklist.tempo_parada_meses} meses` : 'Não'}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Acessórios?</span>
                                <Badge variant="outline">
                                    {os.checklist.com_acessorios ? 'Sim' : 'Não'}
                                </Badge>
                            </div>
                            {os.checklist.com_acessorios && (
                                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                    {os.checklist.descricao_acessorios}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Fotos */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Fotos e Vídeos</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4" />
                            </Button>
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
                                {os.fotos.map(foto => (
                                    <div key={foto.id} className="relative aspect-square rounded-md overflow-hidden border">
                                        <img src={foto.url} alt={foto.legenda} className="object-cover w-full h-full" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                                            {foto.legenda}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
