import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    ArrowRight,
    Check,
    User,
    Wrench,
    ClipboardCheck,
    CheckCircle2,
    Loader2,
    Calendar,
    Camera,
    X,
    Upload
} from 'lucide-react'
import { storage } from '@/services/storage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
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
import { toast } from 'sonner'
import { uploadToR2 } from '@/lib/r2'
import { EQUIPMENT_BRANDS } from '@/data/equipmentData'

const steps = [
    { id: 1, name: 'Cliente', icon: User },
    { id: 2, name: 'Equipamento', icon: Wrench },
    { id: 3, name: 'Checklist', icon: ClipboardCheck },
]

export default function NewOrder() {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [isNewClient, setIsNewClient] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const queryClient = useQueryClient()

    // Fetch customers
    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: api.customers.list
    })

    // Fetch technicians
    const { data: technicians = [] } = useQuery({
        queryKey: ['technicians'],
        queryFn: api.technicians.list
    })

    // Fetch Kanban Columns to get the first status
    const { data: kanbanColumns = [] } = useQuery({
        queryKey: ['kanban_columns'],
        queryFn: api.kanban.list
    })

    // Create Customer Mutation
    const createCustomerMutation = useMutation({
        mutationFn: api.customers.create
    })

    // Create Order Mutation
    const createOrderMutation = useMutation({
        mutationFn: api.orders.create,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['orders'])
            toast.success(`Ordem de serviço #${data.order_number} criada!`)
            navigate('/')
        },
        onError: (e) => toast.error("Erro ao criar OS: " + e.message)
    })

    const [formData, setFormData] = useState({
        // Customer
        customer_id: '',
        customer_name: '',
        customer_whatsapp: '',
        customer_cpf: '',
        customer_address: '',
        // Equipment
        equipment_type: '',
        equipment_brand: '',
        equipment_model: '',
        equipment_serial: '',
        reported_defect: '',
        technician_id: '',
        // Checklist
        machine_turns_on: null,
        needs_adjustment: null,
        was_stopped: null,
        stopped_time_months: '',
        has_accessories: null,
        accessories_description: '',
        budget_authorized: null,
        // Files
        files: []
    })

    const updateForm = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setUploading(true)
        try {
            for (const file of files) {
                const result = await storage.upload(file, 'temp')
                setUploadedFiles(prev => [...prev, {
                    url: result.url,
                    storage_path: result.path,
                    storage_provider: result.provider,
                    type: file.type.startsWith('video') ? 'video' : 'photo',
                    name: file.name
                }])
            }
            toast.success("Arquivos carregados com sucesso!")
        } catch (error) {
            toast.error("Erro no upload: " + error.message)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeFile = async (index) => {
        const file = uploadedFiles[index]
        try {
            if (file.storage_path) {
                await storage.delete(file.storage_path, file.storage_provider)
            }
            setUploadedFiles(prev => prev.filter((_, i) => i !== index))
        } catch (error) {
            toast.error("Erro ao remover arquivo")
        }
    }

    const handleSubmit = async () => {
        if (!canProceed()) return

        setLoading(true)
        try {
            let customerId = formData.customer_id

            // If new client, create it first
            if (isNewClient) {
                const newCustomer = await createCustomerMutation.mutateAsync({
                    name: formData.customer_name,
                    whatsapp: formData.customer_whatsapp,
                    cpf: formData.customer_cpf,
                    address: formData.customer_address
                })
                customerId = newCustomer.id
            }

            // Create Order
            const orderData = {
                customer_id: customerId,
                equipment_type: formData.equipment_type,
                equipment_brand: formData.equipment_brand,
                equipment_model: formData.equipment_model,
                equipment_serial: formData.equipment_serial,
                reported_defect: formData.reported_defect,
                machine_turns_on: formData.machine_turns_on,
                needs_adjustment: formData.needs_adjustment,
                was_stopped: formData.was_stopped,
                stopped_time_months: formData.stopped_time_months ? parseInt(formData.stopped_time_months) : null,
                has_accessories: formData.has_accessories,
                accessories_description: formData.accessories_description,
                budget_authorized: formData.budget_authorized,
                technician_id: formData.technician_id || null,
                current_status: kanbanColumns.length > 0
                    ? kanbanColumns.reduce((prev, curr) => prev.position < curr.position ? prev : curr).slug
                    : 'received'
            }

            const order = await createOrderMutation.mutateAsync(orderData)

            // 4. Save uploaded files
            if (uploadedFiles.length > 0) {
                await Promise.all(uploadedFiles.map(file =>
                    api.files.create({
                        service_order_id: order.id,
                        url: file.url,
                        step: 'received',
                        type: file.type,
                        caption: 'Foto de Entrada',
                        storage_path: file.storage_path,
                        storage_provider: file.storage_provider
                    })
                ))
            }

            toast.success("Ordem de Serviço criada com sucesso!")

            // 5. Navigate to Detail
            navigate(`/os/${order.id}`)

            // 6. Reset Form
            setUploadedFiles([])

        } catch (error) {
            console.error(error)
            toast.error("Erro ao processar: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                if (isNewClient) {
                    return formData.customer_name && formData.customer_whatsapp
                }
                return formData.customer_id
            case 2:
                return formData.equipment_type && formData.equipment_brand &&
                    formData.equipment_model && formData.reported_defect
            case 3:
                return formData.machine_turns_on !== null && formData.was_stopped !== null &&
                    formData.has_accessories !== null && formData.budget_authorized !== null
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

            {/* Step 1: Customer */}
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
                                <Select value={formData.customer_id} onValueChange={(v) => updateForm('customer_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Escolha um cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map(customer => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {customer.name} • {customer.whatsapp}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome *</Label>
                                        <Input
                                            id="name"
                                            value={formData.customer_name}
                                            onChange={(e) => updateForm('customer_name', e.target.value)}
                                            placeholder="Nome completo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp">WhatsApp *</Label>
                                        <Input
                                            id="whatsapp"
                                            value={formData.customer_whatsapp}
                                            onChange={(e) => updateForm('customer_whatsapp', e.target.value)}
                                            placeholder="(11) 99999-9999"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cpf">CPF (opcional)</Label>
                                        <Input
                                            id="cpf"
                                            value={formData.customer_cpf}
                                            onChange={(e) => updateForm('customer_cpf', e.target.value)}
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Endereço (opcional)</Label>
                                        <Input
                                            id="address"
                                            value={formData.customer_address}
                                            onChange={(e) => updateForm('customer_address', e.target.value)}
                                            placeholder="Rua, número, bairro"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Equipment */}
            {currentStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Equipamento</CardTitle>
                        <CardDescription>Informe os dados da máquina e o defeito relatado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Equipamento *</Label>
                            <Select value={formData.equipment_type} onValueChange={(v) => updateForm('equipment_type', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brush_cutter">Roçadeira</SelectItem>
                                    <SelectItem value="chainsaw">Motosserra</SelectItem>
                                    <SelectItem value="sprayer">Pulverizador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand">Marca *</Label>
                                <Select
                                    value={formData.equipment_brand}
                                    onValueChange={(v) => {
                                        updateForm('equipment_brand', v)
                                        updateForm('equipment_model', '') // Reset model when brand changes
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a marca..." />
                                    </SelectTrigger>
                                    <SelectContent className="h-64">
                                        {EQUIPMENT_BRANDS.map(brand => (
                                            <SelectItem key={brand.name} value={brand.name}>
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">Modelo *</Label>
                                <Select
                                    value={formData.equipment_model}
                                    onValueChange={(v) => updateForm('equipment_model', v)}
                                    disabled={!formData.equipment_brand}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={!formData.equipment_brand ? "Selecione a marca primeiro" : "Selecione o modelo..."} />
                                    </SelectTrigger>
                                    <SelectContent className="h-64">
                                        {formData.equipment_brand && EQUIPMENT_BRANDS
                                            .find(b => b.name === formData.equipment_brand)
                                            ?.models.map(model => (
                                                <SelectItem key={model} value={model}>
                                                    {model}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="serial">Número de Série (opcional)</Label>
                            <Input
                                id="serial"
                                value={formData.equipment_serial}
                                onChange={(e) => updateForm('equipment_serial', e.target.value)}
                                placeholder="Número de série do equipamento"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="defect">Defeito Relatado *</Label>
                            <Textarea
                                id="defect"
                                value={formData.reported_defect}
                                onChange={(e) => updateForm('reported_defect', e.target.value)}
                                placeholder="Descreva o problema relatado pelo cliente..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2 pt-4 border-t bg-indigo-50/30 -mx-6 px-6 pb-4">
                            <Label htmlFor="tech" className="text-indigo-700 font-bold flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Técnico Responsável (opcional)
                            </Label>
                            <Select
                                value={formData.technician_id || "none"}
                                onValueChange={(v) => updateForm('technician_id', v === "none" ? "" : v)}
                            >
                                <SelectTrigger className="bg-background border-indigo-200">
                                    <SelectValue placeholder="Selecione um técnico..." />
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
                        {/* Machine Turns On? */}
                        <div className="space-y-3">
                            <Label>A máquina liga? *</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.machine_turns_on === true ? "default" : "outline"}
                                    onClick={() => updateForm('machine_turns_on', true)}
                                    className="flex-1"
                                >
                                    Sim
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.machine_turns_on === false ? "default" : "outline"}
                                    onClick={() => {
                                        updateForm('machine_turns_on', false)
                                        updateForm('needs_adjustment', null)
                                    }}
                                    className="flex-1"
                                >
                                    Não
                                </Button>
                            </div>
                            {formData.machine_turns_on === true && (
                                <div className="ml-4 pt-2 space-y-2">
                                    <Label>Exige regulagem?</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={formData.needs_adjustment === true ? "default" : "outline"}
                                            onClick={() => updateForm('needs_adjustment', true)}
                                        >
                                            Sim
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={formData.needs_adjustment === false ? "default" : "outline"}
                                            onClick={() => updateForm('needs_adjustment', false)}
                                        >
                                            Não
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Was Stopped? */}
                        <div className="space-y-3">
                            <Label>Estava parada? *</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.was_stopped === true ? "default" : "outline"}
                                    onClick={() => updateForm('was_stopped', true)}
                                    className="flex-1"
                                >
                                    Sim
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.was_stopped === false ? "default" : "outline"}
                                    onClick={() => {
                                        updateForm('was_stopped', false)
                                        updateForm('stopped_time_months', '')
                                    }}
                                    className="flex-1"
                                >
                                    Não
                                </Button>
                            </div>
                            {formData.was_stopped === true && (
                                <div className="ml-4 pt-2">
                                    <Label htmlFor="stopped_time">Tempo parada (meses)</Label>
                                    <Input
                                        id="stopped_time"
                                        type="number"
                                        min="1"
                                        value={formData.stopped_time_months}
                                        onChange={(e) => updateForm('stopped_time_months', e.target.value)}
                                        placeholder="Ex: 3"
                                        className="w-32 mt-1"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Has Accessories? */}
                        <div className="space-y-3">
                            <Label>Está com acessórios? *</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.has_accessories === true ? "default" : "outline"}
                                    onClick={() => updateForm('has_accessories', true)}
                                    className="flex-1"
                                >
                                    Sim
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.has_accessories === false ? "default" : "outline"}
                                    onClick={() => {
                                        updateForm('has_accessories', false)
                                        updateForm('accessories_description', '')
                                    }}
                                    className="flex-1"
                                >
                                    Não
                                </Button>
                            </div>
                            {formData.has_accessories === true && (
                                <div className="ml-4 pt-2">
                                    <Label htmlFor="accessories">Descrever acessórios</Label>
                                    <Input
                                        id="accessories"
                                        value={formData.accessories_description}
                                        onChange={(e) => updateForm('accessories_description', e.target.value)}
                                        placeholder="Ex: 2 lâminas, cinto, protetor"
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Budget Authorized? */}
                        <div className="space-y-3">
                            <Label>Orçamento autorizado inicialmente? *</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.budget_authorized === true ? "default" : "outline"}
                                    onClick={() => updateForm('budget_authorized', true)}
                                    className="flex-1"
                                >
                                    Sim
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.budget_authorized === false ? "default" : "outline"}
                                    onClick={() => updateForm('budget_authorized', false)}
                                    className="flex-1"
                                >
                                    Não
                                </Button>
                            </div>
                        </div>

                        {/* Entry Files */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-indigo-700 font-bold flex items-center gap-2">
                                    <Camera className="h-4 w-4" />
                                    Fotos de Entrada
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-indigo-200 text-indigo-700"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Upload className="h-4 w-4 mr-2" />
                                    )}
                                    Anexar Mídia
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {uploadedFiles.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {uploadedFiles.map((file, index) => (
                                        <div key={index} className="relative aspect-square rounded-md overflow-hidden border group">
                                            <img src={file.url} alt={file.name} className="object-cover w-full h-full" />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                                                {file.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    Nenhuma mídia anexada ainda. Utilize fotos para o registro inicial.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    disabled={currentStep === 1 || loading}
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
                        disabled={!canProceed() || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar OS
                    </Button>
                )}
            </div>
        </div>
    )
}
