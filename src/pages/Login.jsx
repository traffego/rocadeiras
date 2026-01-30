import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Wrench, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { signIn } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    // Redirect to where user wanted to go, or home
    const from = location.state?.from?.pathname || '/'

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await signIn(email, password)

            if (error) {
                toast.error('Erro ao entrar', { description: 'Verifique seu e-mail e senha' })
            } else {
                navigate(from, { replace: true })
            }
        } catch (err) {
            toast.error('Erro inesperado', { description: 'Tente novamente mais tarde' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background animate-in slide-in-from-left-4 duration-500">
                <div className="w-full max-w-[380px] space-y-8">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Wrench className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
                        <p className="text-sm text-muted-foreground">
                            Entre com suas credenciais para acessar o sistema
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@oficina.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        Esqueci minha senha
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <Button className="w-full h-11 font-medium" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Acessar Sistema
                        </Button>
                    </form>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">ZMAQ</span> <br className="hidden sm:inline" />
                        Gestão de Máquinas Agrícolas
                    </p>
                </div>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-slate-900 to-slate-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1530124566582-a618bc2615dc?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20" />

                <div className="relative z-10 text-white max-w-lg space-y-6 animate-in slide-in-from-right-8 duration-700 delay-200">
                    <div className="h-2 w-20 bg-indigo-500 rounded-full" />
                    <h2 className="text-4xl font-bold tracking-tight">Gestão Inteligente para sua Oficina</h2>
                    <p className="text-lg text-slate-300 leading-relaxed">
                        Controle ordens de serviço, acompanhe etapas e mantenha seus clientes informados com eficiência e profissionalismo.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-8 text-sm font-medium text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                <Wrench className="h-4 w-4 text-white" />
                            </div>
                            <span>Controle de Equipamentos</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-white" />
                            </div>
                            <span>Acompanhamento em Tempo Real</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
