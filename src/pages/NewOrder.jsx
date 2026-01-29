import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    ArrowRight,
    Check,
    User,
    Wrench,
    ClipboardCheck,
    Camera,
    Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const steps = [
    { id: 1, name: 'Cliente', icon: User },
    { id: 2, name: 'Equipamento', icon: Wrench },
    { id: 3, name: 'Checklist', icon: ClipboardCheck },
]

// Mock de clientes existentes
const clientesMock = [
    { id: '1', nome: 'João Silva', whatsapp: '11999999999' },
    { id: '2', nome: 'Maria Santos', whatsapp: '11988888888' },
    { id: '3', nome: 'Pedro Oliveira', whatsapp: '11977777777' },
]

export default function NewOrder() {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [isNewClient, setIsNewClient] = useState(false)

    const [formData, setFormData] = useState({
        // Cliente
        cliente_id: '',
        cliente_nome: '',
        cliente_whatsapp: '',
        cliente_cpf: '',
        cliente_endereco: '',
        // Equipamento
        equipamento_tipo: '',
        equipamento_marca: '',
        equipamento_modelo: '',
        equipamento_serie: '',
        defeito_relatado: '',
        // Checklist
        maquina_liga: null,
        exige_regulagem: null,
        estava_parada: null,
        tempo_parada_meses: '',
        com_acessorios: null,
        descricao_acessorios: '',
        orcamento_autorizado: null,
        // Fotos
        fotos: []
    })

    const updateForm = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = () => {
        console.log('Dados da OS:', formData)
        // TODO: Salvar no Supabase
        alert('OS criada com sucesso!')
        navigate('/')
    }

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                if (isNewClient) {
                    return formData.cliente_nome && formData.cliente_whatsapp
                }
                return formData.cliente_id
            case 2:
                return formData.equipamento_tipo && formData.equipamento_marca &&
                    formData.equipamento_modelo && formData.defeito_relatado
            case 3:
                return formData.maquina_liga !== null && formData.estava_parada !== null &&
                    formData.com_acessorios !== null && formData.orcamento_autorizado !== null
            default:
                return false
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Nova Ordem de Serviço</h1>
                    <p className="text-muted-foreground">Preencha os dados para abrir uma OS</p>
                </div>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
              ${currentStep > step.id
                                ? 'bg-primary border-primary text-primary-foreground'
                                : currentStep === step.id
                                    ? 'border-primary text-primary'
                                    : 'border-muted text-muted-foreground'}
            `}>
                            {currentStep > step.id ? (
                                <Check className="h-5 w-5" />
                            ) : (
                                <step.icon className="h-5 w-5" />
                            )}
                        </div>
                        <span className={`ml-2 text-sm font-medium hidden sm:block ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                            {step.name}
                        </span>
                        {index < steps.length - 1 && (
                            <div className={`w-12 sm:w-24 h-0.5 mx-2 sm:mx-4 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Cliente */}
            {currentStep === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Cliente</CardTitle>
                        <CardDescription>Selecione um cliente existente ou cadastre um novo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                variant={!isNewClient ? "default" : "outline"}
                                onClick={() => setIsNewClient(false)}
                                className="flex-1"
                            >
                                Cliente Existente
                            </Button>
                            <Button
                                variant={isNewClient ? "default" : "outline"}
                                onClick={() => setIsNewClient(true)}
                                className="flex-1"
                            >
                                Novo Cliente
                            </Button>
                        </div>

                        {!isNewClient ? (
                            <div className="space-y-2">
                                <Label>Selecionar Cliente</Label>
                                <Select value={formData.cliente_id} onValueChange={(v) => updateForm('cliente_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha um cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientesMock.map(cliente => (
                                            <SelectItem key={cliente.id} value={cliente.id}>
                                                {cliente.nome} • {cliente.whatsapp}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nome">Nome *</Label>
                                        <Input
                                            id="nome"
                                            value={formData.cliente_nome}
                                            onChange={(e) => updateForm('cliente_nome', e.target.value)}
                                            placeholder="Nome completo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp">WhatsApp *</Label>
                                        <Input
                                            id="whatsapp"
                                            value={formData.cliente_whatsapp}
                                            onChange={(e) => updateForm('cliente_whatsapp', e.target.value)}
                                            placeholder="(11) 99999-9999"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cpf">CPF (opcional)</Label>
                                        <Input
                                            id="cpf"
                                            value={formData.cliente_cpf}
                                            onChange={(e) => updateForm('cliente_cpf', e.target.value)}
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endereco">Endereço (opcional)</Label>
                                        <Input
                                            id="endereco"
                                            value={formData.cliente_endereco}
                                            onChange={(e) => updateForm('cliente_endereco', e.target.value)}
                                            placeholder="Rua, número, bairro"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Equipamento */}
            {currentStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Equipamento</CardTitle>
                        <CardDescription>Informe os dados da máquina e o defeito relatado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Equipamento *</Label>
                            <Select value={formData.equipamento_tipo} onValueChange={(v) => updateForm('equipamento_tipo', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rocadeira">Roçadeira</SelectItem>
                                    <SelectItem value="motosserra">Motosserra</SelectItem>
                                    <SelectItem value="pulverizador">Pulverizador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="marca">Marca *</Label>
                                <Input
                                    id="marca"
                                    value={formData.equipamento_marca}
                                    onChange={(e) => updateForm('equipamento_marca', e.target.value)}
                                    placeholder="Ex: Stihl, Husqvarna, Makita"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="modelo">Modelo *</Label>
                                <Input
                                    id="modelo"
                                    value={formData.equipamento_modelo}
                                    onChange={(e) => updateForm('equipamento_modelo', e.target.value)}
                                    placeholder="Ex: FS 220, 450"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="serie">Número de Série (opcional)</Label>
                            <Input
                                id="serie"
                                value={formData.equipamento_serie}
                                onChange={(e) => updateForm('equipamento_serie', e.target.value)}
                                placeholder="Número de série do equipamento"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="defeito">Defeito Relatado *</Label>
                            <Textarea
                                id="defeito"
                                value={formData.defeito_relatado}
                                onChange={(e) => updateForm('defeito_relatado', e.target.value)}
                                placeholder="Descreva o problema relatado pelo cliente..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Checklist */}
            {currentStep === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Checklist de Entrada</CardTitle>
                        <CardDescription>Verifique as condições de chegada do equipamento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* A máquina liga? */}
                        <div className="space-y-3">
                            <Label>A máquina liga? *</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.maquina_liga === true ? "default" : "outline"}
                                    onClick={() => updateForm('maquina_liga', true)}
                                    className="flex-1"
                                >
                                    Sim
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.maquina_liga === false ? "default" : "outline"}
                                    onClick={() => {
                                        updateForm('maquina_liga', false)
                                        updateForm('exige_regulagem', null)
                                    }}
                                    className="flex-1"
                                >
                                    Não
                                </Button>
                            </div>
                            {formData.maquina_liga === true && (
                                <div className="ml-4 pt-2 space-y-2">
                                    <Label>Exige regulagem?</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={formData.exige_regulagem === true ? "default" : "outline"}
                                            onClick={() => updateForm('exige_regulagem', true)}
                                        >
                                            Sim
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={formData.exige_regulagem === false ? "default" : "outline"}
                                            onClick={() => updateForm('exige_regulagem', false)}
                                        >
                                            Não
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Estava parada? */}
                        <div className="space-y-3">
                            <Label>Estava parada? *</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.estava_parada === true ? "default" : "outline"}
                                    onClick={() => updateForm('estava_parada', true)}
                                    className="flex-1"
                                >
                                    Sim
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.estava_parada === false ? "default" : "outline"}
                                    onClick={() => {
                                        updateForm('estava_parada', false)
                                        updateForm('tempo_parada_meses', '')
                                    }}
                                    className="flex-1"
                                >
                                    Não
                                </Button>
                            </div>
                            {formData.estava_parada === true && (
                                <div className="ml-4 pt-2">
                                    <Label htmlFor="tempo_parada">Tempo parada (meses)</Label>
                                    <Input
                                        id="tempo_parada"
                                        type="number"
                                        min="1"
                                        value={formData.tempo_parada_meses}
                                        onChange={(e) => updateForm('tempo_parada_meses', e.target.value)}
                                        placeholder="Ex: 3"
                                        className="w-32 mt-1"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Com acessórios? */}
                        <div className="space-y-3">
                            <Label>Está com acessórios? *</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.com_acessorios === true ? "default" : "outline"}
                                    onClick={() => updateForm('com_acessorios', true)}
                                    className="flex-1"
                                >
                                    Sim
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.com_acessorios === false ? "default" : "outline"}
                                    onClick={() => {
                                        updateForm('com_acessorios', false)
                                        updateForm('descricao_acessorios', '')
                                    }}
                                    className="flex-1"
                                >
                                    Não
                                </Button>
                            </div>
                            {formData.com_acessorios === true && (
                                <div className="ml-4 pt-2">
                                    <Label htmlFor="acessorios">Descrever acessórios</Label>
                                    <Input
                                        id="acessorios"
                                        value={formData.descricao_acessorios}
                                        onChange={(e) => updateForm('descricao_acessorios', e.target.value)}
                                        placeholder="Ex: 2 lâminas, cinto, protetor"
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Orçamento autorizado? */}
                        <div className="space-y-3">
                            <Label>Orçamento autorizado inicialmente? *</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.orcamento_autorizado === true ? "default" : "outline"}
                                    onClick={() => updateForm('orcamento_autorizado', true)}
                                    className="flex-1"
                                >
                                    Sim
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.orcamento_autorizado === false ? "default" : "outline"}
                                    onClick={() => updateForm('orcamento_autorizado', false)}
                                    className="flex-1"
                                >
                                    Não
                                </Button>
                            </div>
                        </div>

                        {/* Fotos de entrada */}
                        <div className="space-y-3 pt-4 border-t">
                            <Label>Fotos de Entrada</Label>
                            <p className="text-sm text-muted-foreground">
                                Tire fotos do equipamento na chegada para registro
                            </p>
                            <Button variant="outline" className="w-full">
                                <Camera className="mr-2 h-4 w-4" />
                                Adicionar Fotos
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    disabled={currentStep === 1}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                {currentStep < 3 ? (
                    <Button
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        disabled={!canProceed()}
                    >
                        Próximo
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={!canProceed()}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Criar OS
                    </Button>
                )}
            </div>
        </div>
    )
}
