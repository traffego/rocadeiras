import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

const LOCAL_SESSION_KEY = 'zmaq_app_session'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null) // { id, name, username, role }
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!supabase) {
            // Modo demo sem Supabase configurado
            const local = localStorage.getItem(LOCAL_SESSION_KEY)
            if (local) {
                const parsed = JSON.parse(local)
                setUser(parsed)
                setProfile(parsed)
            }
            setLoading(false)
            return
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                // Usuário logado via Supabase Auth = admin
                setUser(session.user)
                setProfile({ id: session.user.id, name: session.user.email, username: session.user.email, role: 'admin' })
            } else {
                // Verificar sessão local (usuários internos)
                const local = localStorage.getItem(LOCAL_SESSION_KEY)
                if (local) {
                    try {
                        const parsed = JSON.parse(local)
                        setUser(parsed)
                        setProfile(parsed)
                    } catch {
                        localStorage.removeItem(LOCAL_SESSION_KEY)
                    }
                }
            }
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user)
                setProfile({ id: session.user.id, name: session.user.email, username: session.user.email, role: 'admin' })
            } else if (!localStorage.getItem(LOCAL_SESSION_KEY)) {
                setUser(null)
                setProfile(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (identifier, password) => {
        // Se parece com email → tenta Supabase Auth (admin)
        if (identifier.includes('@')) {
            if (!supabase) {
                if (identifier === 'admin@oficina.com' && password === '123456') {
                    const demoProfile = { id: 'demo', name: 'Admin Demo', username: 'admin@oficina.com', role: 'admin' }
                    setUser({ id: 'demo', email: identifier })
                    setProfile(demoProfile)
                    return { error: null }
                }
                return { error: { message: 'Supabase não configurado' } }
            }
            return supabase.auth.signInWithPassword({ email: identifier, password })
        }

        // Caso contrário → tenta usuário interno (app_users via RPC)
        if (!supabase) {
            // Fallback demo: admin/admin123
            if (identifier === 'admin' && password === 'admin123') {
                const demoProfile = { id: 'demo', name: 'Administrador', username: 'admin', role: 'admin' }
                localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(demoProfile))
                setUser(demoProfile)
                setProfile(demoProfile)
                return { error: null }
            }
            return { error: { message: 'Usuário ou senha inválidos' } }
        }

        const { data, error } = await supabase.rpc('authenticate_app_user', {
            p_username: identifier,
            p_password: password
        })

        if (error) return { error }
        if (!data) return { error: { message: 'Usuário ou senha inválidos' } }

        const sessionData = data
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionData))
        setUser(sessionData)
        setProfile(sessionData)
        return { error: null }
    }

    const signOut = async () => {
        localStorage.removeItem(LOCAL_SESSION_KEY)
        setUser(null)
        setProfile(null)
        if (supabase) {
            await supabase.auth.signOut()
        }
    }

    const resetPasswordForEmail = async (email) => {
        if (!supabase) return { error: { message: 'Supabase não configurado' } }
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })
    }

    const updatePassword = async (newPassword) => {
        if (!supabase) return { error: { message: 'Supabase não configurado' } }
        return supabase.auth.updateUser({ password: newPassword })
    }

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            isAdmin: profile?.role === 'admin',
            signIn,
            signOut,
            resetPasswordForEmail,
            updatePassword,
            loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
