import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  LayoutDashboard, 
  Package, 
  Send, 
  MessageCircle, 
  Settings, 
  LogOut, 
  TrendingUp,
  Search
} from 'lucide-react'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
      } else {
        setUserEmail(session.user.email ?? null)
      }
    }
    
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Buscar Produtos', path: '/buscar-produtos', icon: Search },
    { name: 'Produtos', path: '/produtos', icon: Package },
    { name: 'Telegram', path: '/telegram', icon: Send },
    { name: 'WhatsApp', path: '#', icon: MessageCircle, disabled: true },
    { name: 'Configurações', path: '/config', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">Achadinhos</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            if (item.disabled) {
              return (
                <div key={item.name} className="flex items-center gap-3 px-3 py-2.5 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed font-medium" title="Em breve na Fase 2">
                  <Icon className="h-5 w-5" />
                  {item.name}
                  <span className="ml-auto text-[10px] uppercase tracking-wider bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full">Breve</span>
                </div>
              )
            }

            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={userEmail ?? ''}>
                {userEmail}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Administrador</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  )
}
