import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewOrder from './pages/NewOrder'
import Customers from './pages/Customers'
import OrderDetail from './pages/OrderDetail'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="os/new" element={<NewOrder />} />
          <Route path="customers" element={<Customers />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="os/:id" element={<OrderDetail />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
