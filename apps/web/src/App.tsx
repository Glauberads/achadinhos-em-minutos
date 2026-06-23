import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Layout } from './components/Layout'
import { Products } from './pages/Products'
import { SearchProducts } from './pages/SearchProducts'
import { TelegramConfig } from './pages/Telegram'
import { Integrations } from './pages/Integrations'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Autenticadas com Sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/buscar-produtos" element={<SearchProducts />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/telegram" element={<TelegramConfig />} />
          <Route path="/config" element={<Integrations />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
