import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Layout } from './components/Layout'
import { Products } from './pages/Products'
import { SearchProducts } from './pages/SearchProducts'
import { TelegramConfig } from './pages/Telegram'
import { Integrations } from './pages/Integrations'
import { Campaigns } from './pages/Campaigns'
import { AuditLogs } from './pages/AuditLogs'
import { CreativeStudio } from './pages/CreativeStudio'
import { Reports } from './pages/Reports'
import { AdminProductDashboard } from './pages/AdminProductDashboard'

import { ToastProvider } from './components/ui/toast'

// Mock Components for Public Routes (To be implemented)
const LandingPage = () => <div className="p-8 text-center"><h1 className="text-3xl font-bold">Achadinhos</h1><p>Landing Page</p></div>;
const Pricing = () => <div className="p-8 text-center"><h1 className="text-3xl font-bold">Planos</h1></div>;
const Features = () => <div className="p-8 text-center"><h1 className="text-3xl font-bold">Recursos</h1></div>;
const Enterprise = () => <div className="p-8 text-center"><h1 className="text-3xl font-bold">Enterprise</h1></div>;
const EarlyAccess = () => <div className="p-8 text-center"><h1 className="text-3xl font-bold">Early Access</h1></div>;
const PublicStatus = () => <div className="p-8 text-center"><h1 className="text-3xl font-bold">Status Page</h1></div>;

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas Comerciais */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/early-access" element={<EarlyAccess />} />
          <Route path="/status" element={<PublicStatus />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rotas Autenticadas com Sidebar */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buscar-produtos" element={<SearchProducts />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/campanhas" element={<Campaigns />} />
            <Route path="/telegram" element={<TelegramConfig />} />
            <Route path="/config" element={<Integrations />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/creative-studio" element={<CreativeStudio />} />
            
            {/* System / Admin Routes */}
            <Route path="/system/reports" element={<Reports />} />
            <Route path="/system/operation-center" element={<AdminProductDashboard />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
