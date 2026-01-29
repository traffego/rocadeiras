import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
    PlusCircle,
    Search,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Dados mock para desenvolvimento
const mockOrdens = [
    {
        id: '1',
        numero_os: 1,
        cliente: { nome: 'João Silva', whatsapp: '11999999999' },
        equipamento_tipo: 'rocadeira',
        equipamento_marca: 'Stihl',
        equipamento_modelo: 'FS 220',
        etapa_atual: 'orcamento',
        data_entrada: '2024-01-28',
        defeito_relatado: 'Não liga, estava parada há 3 meses'
    },
    {
        id: '2',
        numero_os: 2,
        cliente: { nome: 'Maria Santos', whatsapp: '11988888888' },
        equipamento_tipo: 'motosserra',
        equipamento_marca: 'Husqvarna',
        equipamento_modelo: '450',
        etapa_atual: 'analise',
        data_entrada: '2024-01-29',
        defeito_relatado: 'Corrente solta, precisa de regulagem'
    },
    {
        id: '3',
        numero_os: 3,
        cliente: { nome: 'Pedro Oliveira', whatsapp: '11977777777' },
        equipamento_tipo: 'pulverizador',
        equipamento_marca: 'Jacto',
        equipamento_modelo: 'PJH 20',
        etapa_atual: 'teste',
        data_entrada: '2024-01-27',
        defeito_relatado: 'Vazamento na mangueira'
    },
    {
        id: '4',
        numero_os: 4,
        cliente: { nome: 'Ana Costa', whatsapp: '11966666666' },
        equipamento_tipo: 'rocadeira',
        equipamento_marca: 'Makita',
        equipamento_modelo: 'EM2500U',
        etapa_atual: 'recebida',
        data_entrada: '2024-01-29',
        defeito_relatado: 'Motor falhando'
    },
]

const etapas = {
    recebida: { label: 'Recebida', color: 'bg-gray-500', icon: Clock },
    analise: { label: 'Análise', color: 'bg-blue-500', icon: Search },
    orcamento: { label: 'Orçamento', color: 'bg-yellow-500', icon: AlertCircle },
    lavagem: { label: 'Lavagem', color: 'bg-cyan-500', icon: Clock },
    montagem: { label: 'Montagem', color: 'bg-purple-500', icon: Clock },
    teste: { label: 'Teste', color: 'bg-green-500', icon: CheckCircle2 },
    entrega: { label: 'Entrega', color: 'bg-emerald-500', icon: CheckCircle2 },
    finalizada: { label: 'Finalizada', color: 'bg-gray-400', icon: CheckCircle2 },
}

const tiposEquipamento = {
    rocadeira: 'Roçadeira',
    motosserra: 'Motosserra',
    pulverizador: 'Pulverizador',
}

export default function Dashboard() {
    const [busca, setBusca] = useState('')
    const [filtroEtapa, setFiltroEtapa] = useState('todas')

    const ordensFiltradas = useMemo(() => {
        return mockOrdens.filter(os => {
            const matchBusca = busca === '' ||
                os.cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
                os.numero_os.toString().includes(busca)

            const matchEtapa = filtroEtapa === 'todas' || os.etapa_atual === filtroEtapa

            return matchBusca && matchEtapa
        })
    }, [busca, filtroEtapa])

    // Contagem por etapa
    const contagem = useMemo(() => {
        const counts = { total: mockOrdens.length }
        Object.keys(etapas).forEach(etapa => {
            counts[etapa] = mockOrdens.filter(os => os.etapa_atual === etapa).length
        })
        return counts
    }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        {contagem.total} ordens de serviço em aberto
                    </p>
                </div>
                <Link to="/os/nova">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova OS
                    </Button>
                </Link>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Recebidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contagem.recebida || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Em Análise
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contagem.analise || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Aguardando Orçamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contagem.orcamento || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Em Teste
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contagem.teste || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Busca e filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por número da OS ou nome do cliente..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
                    <SelectTrigger className="w-full sm:w-48">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filtrar por etapa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Todas as etapas</SelectItem>
                        {Object.entries(etapas).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                                {value.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Lista de OS */}
            <div className="space-y-3">
                {ordensFiltradas.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Nenhuma ordem de serviço encontrada.
                        </CardContent>
                    </Card>
                ) : (
                    ordensFiltradas.map((os) => {
                        const etapa = etapas[os.etapa_atual]
                        return (
                            <Link key={os.id} to={`/os/${os.id}`}>
                                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            {/* Número OS */}
                                            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <span className="text-lg font-bold text-primary">
                                                    #{os.numero_os.toString().padStart(4, '0')}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-semibold truncate">
                                                            {os.cliente.nome}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {tiposEquipamento[os.equipamento_tipo]} {os.equipamento_marca} {os.equipamento_modelo}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`${etapa.color} text-white flex-shrink-0`}
                                                    >
                                                        {etapa.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                    {os.defeito_relatado}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Entrada: {new Date(os.data_entrada).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>

                                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}
