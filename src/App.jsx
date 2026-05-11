import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/lib/auth'
import { ProtectedRoute, AdminRoute, ManagerRoute } from '@/components/ProtectedRoute'
import { ThemeProvider } from '@/components/theme-provider'
import { Loader2 } from 'lucide-react'
import Layout from './components/Layout'

// Eager: rotas públicas leves
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Lazy: todas as páginas protegidas
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Kanban = lazy(() => import('./pages/Kanban'))
const NewOrder = lazy(() => import('./pages/NewOrder'))
const Customers = lazy(() => import('./pages/Customers'))
const Technicians = lazy(() => import('./pages/Technicians'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const Orders = lazy(() => import('./pages/Orders'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Equipments = lazy(() => import('./pages/Equipments'))
const Brands = lazy(() => import('./pages/Brands'))
const EquipmentTypes = lazy(() => import('./pages/EquipmentTypes'))
const Models = lazy(() => import('./pages/Models'))
const UsersPage = lazy(() => import('./pages/Users'))
const ActivityLogPage = lazy(() => import('./pages/ActivityLog'))

function PageLoader() {
  return (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}


function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="navy" storageKey="vite-ui-theme">
        <Suspense fallback={<PageLoader />}>
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
              <Route path="equipments" element={<Equipments />} />
              <Route path="brands" element={<Brands />} />
              <Route path="equipment-types" element={<EquipmentTypes />} />
              <Route path="models" element={<Models />} />
              <Route path="customers" element={<Customers />} />
              <Route path="technicians" element={<Technicians />} />
              <Route path="os/:id" element={<OrderDetail />} />
              <Route path="users" element={
                <AdminRoute><UsersPage /></AdminRoute>
              } />
              <Route path="activity-log" element={
                <ManagerRoute><ActivityLogPage /></ManagerRoute>
              } />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
