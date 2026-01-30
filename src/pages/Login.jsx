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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                            <Wrench className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Sistema Oficina</CardTitle>
                    <CardDescription>
                        Entre com suas credenciais para acessar
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@oficina.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                        <Link
                            to="/forgot-password"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Esqueci minha senha
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
