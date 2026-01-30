import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/lib/auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import NewOrder from './pages/NewOrder'
import Customers from './pages/Customers'
import Technicians from './pages/Technicians'
import OrderDetail from './pages/OrderDetail'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="os" element={<Orders />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="os/new" element={<NewOrder />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="customers" element={<Customers />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="os/:id" element={<OrderDetail />} />
        </Route>
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App
