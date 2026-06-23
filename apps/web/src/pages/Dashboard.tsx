import { useEffect, useState } from 'react'
import { Package, Users, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    groups: 0,
    successes: 0,
    failures: 0,
    activeCampaigns: 0,
    pendingPosts: 0,
    autoSentToday: 0,
    autoFailedToday: 0
  })
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const userId = session.user.id

    // 1. Total Produtos
    const { count: prodCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // 2. Grupos Ativos
    const { count: groupCount } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    // 3. Envios Manuais Sucesso/Falha
    const { data: logs } = await supabase
      .from('send_logs')
      .select('status')
      .eq('user_id', userId)

    let successes = 0
    let failures = 0
    logs?.forEach(log => {
      if (log.status === 'success') successes++
      else failures++
    })

    // 4. Métricas de Automação (Fase 4)
    const today = new Date()
    today.setHours(0,0,0,0)

    const { count: campCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')

    const { count: pendingCount } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['pending', 'queued'])

    const { count: autoSentCount } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString())

    const { count: autoFailedCount } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'failed')
      .gte('created_at', today.toISOString())

    setStats({
      products: prodCount || 0,
      groups: groupCount || 0,
      successes,
      failures,
      activeCampaigns: campCount || 0,
      pendingPosts: pendingCount || 0,
      autoSentToday: autoSentCount || 0,
      autoFailedToday: autoFailedCount || 0
    })

    // 5. Últimos Envios (com dados do produto cruzados)
    const { data: recent } = await supabase
      .from('send_logs')
      .select(`
        id,
        status,
        sent_at,
        error_message,
        products ( title, affiliate_link ),
        groups ( group_name )
      `)
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(5)

    if (recent) setRecentLogs(recent)

    setLoading(false)
  }

  return (
    <>
      <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10 sticky top-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Visão Geral</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {/* Welcome Banner */}
        <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-2">Bem-vindo de volta! 👋</h3>
            <p className="text-indigo-100 max-w-xl text-lg">
              Seu motor de afiliados está pronto. Acompanhe os disparos manuais e automáticos.
            </p>
          </div>
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Stats Grid - Automação */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Motor Automático (Fase 4)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
            <div className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-1">Campanhas Ativas</div>
            <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{loading ? '-' : stats.activeCampaigns}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Próximos Envios (Fila)</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.pendingPosts}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Envios Automáticos Hoje</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.autoSentToday}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Falhas Hoje (Sem Link)</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.autoFailedToday}</div>
          </div>
        </div>

        {/* Stats Grid - Geral */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Geral</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Produtos</h3>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"><Package className="h-5 w-5" /></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.products}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Grupos Ativos</h3>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"><Users className="h-5 w-5" /></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.groups}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sucesso Total</h3>
              <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform"><CheckCircle2 className="h-5 w-5" /></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.successes}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Falha Total</h3>
              <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform"><AlertCircle className="h-5 w-5" /></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.failures}</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Últimos Produtos Enviados</h3>
          </div>
          
          {loading ? (
             <div className="p-8 text-center text-gray-500">Carregando histórico...</div>
          ) : recentLogs.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-gray-900 dark:text-white font-medium mb-1">Nenhum envio recente</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">As postagens recentes enviadas aos seus grupos aparecerão aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                        {log.products?.title || 'Produto Removido'}
                        {log.products?.affiliate_link && (
                          <a href={log.products.affiliate_link} target="_blank" title="Ver Link" className="text-indigo-500 hover:text-indigo-700">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Enviado para <span className="font-medium">{log.groups?.group_name || 'Desconhecido'}</span> em {new Date(log.sent_at).toLocaleString('pt-BR')}
                      </p>
                      {log.status !== 'success' && log.error_message && (
                         <p className="text-xs text-red-500 mt-1">Erro: {log.error_message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
