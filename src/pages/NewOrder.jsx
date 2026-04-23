import { useState, useRef, useEffect } from 'react'
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
import { SearchableSelect } from '@/components/SearchableSelect'

const steps = [
    { id: 1, name: 'Cliente', icon: User },
    { id: 2, name: 'Equipamento', icon: Wrench },
    { id: 3, name: 'Checklist', icon: ClipboardCheck },
]

export default function NewOrder() {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [isNewClient, setIsNewClient] = useState(false)
    const [equipmentNotInList, setEquipmentNotInList] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)
    const cameraInputRef = useRef(null)

    // Customer combobox state
    const [customerSearch, setCustomerSearch] = useState('')
    const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
    const customerComboRef = useRef(null)

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
    })    // Fetch equipment data from DB
    const { data: equipmentTypes = [] } = useQuery({
        queryKey: ['equipmentTypes'],
        queryFn: api.equipmentTypes.list
    })
    const { data: brands = [] } = useQuery({
        queryKey: ['brands'],
        queryFn: api.brands.list
    })
    const { data: allModels = [] } = useQuery({
        queryKey: ['models'],
        queryFn: api.models.list
    })

    // Combinações tipo+marca+modelo para filtro em cascata
    const { data: combinations = [] } = useQuery({
        queryKey: ['equipmentCombinations'],
        queryFn: api.equipments.listCombinations
    })

    // Marcas disponíveis para o tipo selecionado
    const filteredBrands = formData.equipment_type_id
        ? brands.filter(b =>
            combinations.some(c => c.type_id === formData.equipment_type_id && c.brand_id === b.id)
          )
        : brands

    // Modelos disponíveis para o tipo + marca selecionados
    const filteredModels = (formData.equipment_type_id && formData.equipment_brand_id)
        ? allModels.filter(m =>
            combinations.some(c =>
                c.type_id === formData.equipment_type_id &&
                c.brand_id === formData.equipment_brand_id &&
                c.model_id === m.id
            )
          )
        : allModels

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
        equipment_type_id: '',
        equipment_brand_id: '',
        equipment_model_id: '',
        equipment_type_custom: '',
        equipment_brand_custom: '',
        equipment_model_custom: '',
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (customerComboRef.current && !customerComboRef.current.contains(e.target)) {
                setCustomerDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.whatsapp || '').includes(customerSearch)
    )

    const selectedCustomer = customers.find(c => c.id === formData.customer_id)

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
                ...(equipmentNotInList
                    ? {
                        equipment_type: formData.equipment_type_custom,
                        equipment_brand: formData.equipment_brand_custom,
                        equipment_model: formData.equipment_model_custom,
                    }
                    : {
                        equipment_type_id: formData.equipment_type_id,
                        equipment_model_id: formData.equipment_model_id,
                    }
                ),
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
                if (equipmentNotInList) {
                    return formData.equipment_type_custom &&
                        formData.equipment_brand_custom &&
                        formData.equipment_model_custom &&
                        formData.reported_defect && formData.technician_id
                }
                return formData.equipment_type_id && formData.equipment_brand_id &&
                    formData.equipment_model_id && formData.reported_defect && formData.technician_id
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
                            <div className="space-y-2" ref={customerComboRef}>
                                <Label>Selecionar Cliente</Label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        placeholder="Buscar por nome ou WhatsApp..."
                                        value={customerSearch || (selectedCustomer ? selectedCustomer.name : '')}
                                        onFocus={() => {
                                            setCustomerSearch('')
                                            setCustomerDropdownOpen(true)
                                        }}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value)
                                            updateForm('customer_id', '')
                                            setCustomerDropdownOpen(true)
                                        }}
                                        autoComplete="off"
                                    />
                                    {customerDropdownOpen && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-y-auto">
                                            {filteredCustomers.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-muted-foreground">
                                                    Nenhum cliente encontrado.
                                                </div>
                                            ) : (
                                                filteredCustomers.map(customer => (
                                                    <button
                                                        key={customer.id}
                                                        type="button"
                                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex flex-col ${
                                                            formData.customer_id === customer.id ? 'bg-accent font-medium' : ''
                                                        }`}
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            updateForm('customer_id', customer.id)
                                                            setCustomerSearch('')
                                                            setCustomerDropdownOpen(false)
                                                        }}
                                                    >
                                                        <span>{customer.name}</span>
                                                        <span className="text-xs text-muted-foreground">{customer.whatsapp}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
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
                            <SearchableSelect
                                value={formData.equipment_type_id}
                                onValueChange={(v) => {
                                    updateForm('equipment_type_id', v)
                                    updateForm('equipment_brand_id', '')
                                    updateForm('equipment_model_id', '')
                                }}
                                options={equipmentTypes}
                                placeholder="Selecione o tipo..."
                                searchPlaceholder="Buscar tipo..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Marca *</Label>
                                <SearchableSelect
                                    value={formData.equipment_brand_id}
                                    onValueChange={(v) => {
                                        updateForm('equipment_brand_id', v)
                                        updateForm('equipment_model_id', '')
                                    }}
                                    options={filteredBrands}
                                    placeholder={!formData.equipment_type_id ? 'Selecione o tipo primeiro' : 'Selecione a marca...'}
                                    searchPlaceholder="Buscar marca..."
                                    disabled={!formData.equipment_type_id}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Modelo *</Label>
                                <SearchableSelect
                                    value={formData.equipment_model_id}
                                    onValueChange={(v) => updateForm('equipment_model_id', v)}
                                    options={filteredModels}
                                    placeholder={!formData.equipment_brand_id ? 'Selecione a marca primeiro' : 'Selecione o modelo...'}
                                    searchPlaceholder="Buscar modelo..."
                                    disabled={!formData.equipment_brand_id}
                                />
                            </div>
                        </div>

                        {/* Checkbox: não está na lista */}
                        <div className="flex items-center gap-2 py-1">
                            <input
                                type="checkbox"
                                id="not-in-list"
                                checked={equipmentNotInList}
                                onChange={(e) => {
                                    setEquipmentNotInList(e.target.checked)
                                    if (e.target.checked) {
                                        updateForm('equipment_type_id', '')
                                        updateForm('equipment_brand_id', '')
                                        updateForm('equipment_model_id', '')
                                    } else {
                                        updateForm('equipment_type_custom', '')
                                        updateForm('equipment_brand_custom', '')
                                        updateForm('equipment_model_custom', '')
                                    }
                                }}
                                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                            />
                            <label htmlFor="not-in-list" className="text-sm text-muted-foreground cursor-pointer select-none">
                                O equipamento não está na lista
                            </label>
                        </div>

                        {/* Campos de texto livre quando não está na lista */}
                        {equipmentNotInList && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg border border-dashed border-border bg-muted/30">
                                <div className="space-y-2">
                                    <Label>Tipo *</Label>
                                    <Input
                                        value={formData.equipment_type_custom}
                                        onChange={(e) => updateForm('equipment_type_custom', e.target.value)}
                                        placeholder="Ex: Roçadeira"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Marca *</Label>
                                    <Input
                                        value={formData.equipment_brand_custom}
                                        onChange={(e) => updateForm('equipment_brand_custom', e.target.value)}
                                        placeholder="Ex: Stihl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Modelo *</Label>
                                    <Input
                                        value={formData.equipment_model_custom}
                                        onChange={(e) => updateForm('equipment_model_custom', e.target.value)}
                                        placeholder="Ex: FS 55"
                                    />
                                </div>
                            </div>
                        )}

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

                        <div className="space-y-2 pt-4 border-t">
                            <Label className="font-semibold flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Técnico Responsável *
                            </Label>
                            <SearchableSelect
                                value={formData.technician_id}
                                onValueChange={(v) => updateForm('technician_id', v)}
                                options={technicians}
                                placeholder="Selecione o técnico..."
                                searchPlaceholder="Buscar técnico..."
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
                                    <Label>Regula?</Label>
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
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <Label className="font-semibold flex items-center gap-2">
                                    <Camera className="h-4 w-4" />
                                    Fotos de Entrada
                                </Label>
                                <div className="flex gap-2">
                                    {/* Câmera — abre direto a câmera no mobile */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => cameraInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading
                                            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            : <Camera className="h-4 w-4 mr-2" />
                                        }
                                        Câmera
                                    </Button>
                                    {/* Galeria / Arquivo */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading
                                            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            : <Upload className="h-4 w-4 mr-2" />
                                        }
                                        Galeria
                                    </Button>
                                </div>
                                {/* Input câmera — capture=environment abre câmera traseira no mobile */}
                                <input
                                    type="file"
                                    ref={cameraInputRef}
                                    className="hidden"
                                    accept="image/*,video/*"
                                    capture="environment"
                                    onChange={handleFileUpload}
                                />
                                {/* Input galeria — múltiplos arquivos */}
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
