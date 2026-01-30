import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Wrench, Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPassword() {
    const { resetPasswordForEmail } = useAuth()

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await resetPasswordForEmail(email)

            if (error) {
                toast.error('Erro ao enviar', { description: error.message })
            } else {
                setSent(true)
                toast.success('E-mail enviado!')
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
                    <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
                    <CardDescription>
                        {sent
                            ? 'Verifique sua caixa de entrada'
                            : 'Digite seu e-mail para receber o link de recuperação'}
                    </CardDescription>
                </CardHeader>

                {sent ? (
                    <CardContent className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <p className="text-muted-foreground">
                            Enviamos um link de recuperação para <strong>{email}</strong>.
                            Verifique sua caixa de entrada e spam.
                        </p>
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar ao login
                            </Link>
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar link de recuperação
                            </Button>
                            <Button asChild variant="ghost" className="w-full">
                                <Link to="/login">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Voltar ao login
                                </Link>
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    )
}
