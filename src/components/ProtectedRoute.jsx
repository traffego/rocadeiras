import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}

export function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />
    }

    return children
}

export function ManagerRoute({ children }) {
    const { user, profile, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    const allowed = profile?.role === 'admin' || profile?.role === 'gerente'
    if (!allowed) {
        return <Navigate to="/" replace />
    }

    return children
}
