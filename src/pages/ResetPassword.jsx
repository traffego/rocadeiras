import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Wrench, Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPassword() {
    const navigate = useNavigate()
    const { updatePassword, user } = useAuth()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Verifica se o usuário está autenticado via link mágico
    useEffect(() => {
        if (!user) {
            // Se não tem sessão, o link pode ter expirado
            // Aguarda um pouco para o Supabase processar o token da URL
            const timer = setTimeout(() => {
                if (!user) {
                    toast.error('Link expirado ou inválido', {
                        description: 'Solicite um novo link de recuperação'
                    })
                }
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [user])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem')
            return
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres')
            return
        }

        setLoading(true)

        try {
            const { error } = await updatePassword(password)

            if (error) {
                toast.error('Erro ao atualizar senha', { description: error.message })
            } else {
                setSuccess(true)
                toast.success('Senha atualizada com sucesso!')
                setTimeout(() => navigate('/login'), 2000)
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
                    <CardTitle className="text-2xl font-bold">
                        {success ? 'Senha Atualizada!' : 'Nova Senha'}
                    </CardTitle>
                    <CardDescription>
                        {success
                            ? 'Você será redirecionado para o login...'
                            : 'Digite sua nova senha'}
                    </CardDescription>
                </CardHeader>

                {success ? (
                    <CardContent className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <p className="text-muted-foreground">
                            Sua senha foi atualizada com sucesso.
                        </p>
                    </CardContent>
                ) : !user ? (
                    <CardContent className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                            </div>
                        </div>
                        <p className="text-muted-foreground">
                            Verificando link de recuperação...
                        </p>
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <Button asChild variant="outline" className="w-full mt-4">
                            <Link to="/forgot-password">
                                Solicitar novo link
                            </Link>
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Nova senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Digite novamente"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Lock className="mr-2 h-4 w-4" />
                                Redefinir senha
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    )
}
