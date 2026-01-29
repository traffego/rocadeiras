import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!supabase) {
            setLoading(false)
            return
        }

        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email, password) => {
        if (!supabase) {
            // Fallback para modo demo/desenvolvimento se sem chaves
            // Apenas para não travar o fluxo se o usuário rodar sem configurar
            if (email === 'admin@oficina.com' && password === '123456') {
                setUser({ id: 'demo', email })
                return { error: null }
            }
            return { error: { message: 'Supabase não configurado' } }
        }
        return supabase.auth.signInWithPassword({ email, password })
    }

    const signOut = async () => {
        if (!supabase) {
            setUser(null)
            return
        }
        return supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
