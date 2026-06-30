import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Package, Send, Clock, AlertTriangle, PlayCircle, PauseCircle, 
  CheckCircle2, Server, Database, Activity, Zap, RefreshCw, XCircle
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Card, Skeleton } from '../components/ui/core'

interface DashboardData {
  kpis: any;
  charts: any;
  timeline: any[];
  systemHealth: any;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async (background = false) => {
    if (!background) setLoading(true)
    else setIsRefreshing(true)
    setError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 seconds timeout

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return
      
      const currentToken = sessionData.session.access_token
      setToken(currentToken)

      const response = await fetch('/api/dashboard/metrics', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const json = await response.json()
        setData(json.data)
        setLastUpdated(new Date())
      } else {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || 'Erro ao carregar os dados do dashboard')
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
      if (err.name === 'AbortError') {
        setError('A conexão com o servidor expirou. O banco de dados pode estar indisponível.')
      } else {
        setError(err.message)
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Realtime Integration
  useEffect(() => {
    if (!token) return

    // Listen to major events
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {
        fetchDashboardData(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_posts' }, () => {
        fetchDashboardData(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        fetchDashboardData(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [token, fetchDashboardData])


  if (loading && !data && !error) {
    return (
      <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Carregando painel de inteligência...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800 text-center space-y-4">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Falha ao carregar painel</h3>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">{error}</p>
            <button 
              onClick={() => fetchDashboardData()}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors text-sm font-medium"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 h-screen pb-12">
      <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            Dashboard Executivo
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Atualizado {lastUpdated.toLocaleTimeString()}
          </span>
          <button 
            onClick={() => fetchDashboardData(true)}
            className={`p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* RESUMO EXECUTIVO (KPIs) */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Métricas Globais</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <KpiCard 
              title="Campanhas Ativas" 
              value={data.kpis.campaigns_active} 
              icon={<PlayCircle className="w-5 h-5 text-indigo-500" />} 
            />
            <KpiCard 
              title="Produtos Enviados" 
              value={data.kpis.products_sent} 
              icon={<Send className="w-5 h-5 text-green-500" />} 
            />
            <KpiCard 
              title="Taxa de Entrega" 
              value={`${data.kpis.delivery_rate}%`} 
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} 
            />
            <KpiCard 
              title="Tempo Médio" 
              value={`${data.kpis.avg_send_time_ms} ms`} 
              icon={<Clock className="w-5 h-5 text-amber-500" />} 
            />
            <KpiCard 
              title="Total de Eventos" 
              value={data.kpis.total_events} 
              icon={<Activity className="w-5 h-5 text-purple-500" />} 
            />
             <KpiCard 
              title="Falhas de Envio" 
              value={data.kpis.products_failed} 
              icon={<AlertTriangle className="w-5 h-5 text-red-500" />} 
            />

          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: Gráficos Principais */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* GRÁFICO: Envios por Dia (Area Chart) */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Volume de Envios (7 dias)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.charts.sends_by_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSends" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Area type="monotone" dataKey="count" name="Envios" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSends)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* GRÁFICO: Marketplaces */}
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Marketplaces</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.products_by_marketplace} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="platform" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }} />
                      <Bar dataKey="count" name="Produtos" radius={[4, 4, 0, 0]}>
                        {data.charts.products_by_marketplace?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.platform === 'shopee' ? '#f97316' : '#ffe600'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GRÁFICO: Status das Campanhas */}
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Status das Campanhas</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.charts.campaign_status}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.charts.campaign_status?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: Saúde e Timeline */}
          <div className="space-y-8">
            
            {/* SAÚDE DO SISTEMA */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Saúde do Sistema
              </h3>
              
              <div className="space-y-3">
                <HealthRow 
                  name="API Gateway" 
                  status={data.systemHealth.api.status} 
                  latency={data.systemHealth.api.latency_ms} 
                  icon={<Server className="w-4 h-4" />}
                />
                <HealthRow 
                  name="Redis Cache" 
                  status={data.systemHealth.redis.status} 
                  latency={data.systemHealth.redis.latency_ms} 
                  icon={<Zap className="w-4 h-4" />}
                />
                <HealthRow 
                  name="Database (Supabase)" 
                  status={data.systemHealth.supabase.status} 
                  latency={data.systemHealth.supabase.latency_ms} 
                  icon={<Database className="w-4 h-4" />}
                />
                
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filas (BullMQ)</h4>
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-500" /> Telegram
                    </span>
                    <div className="flex gap-2 text-xs font-mono">
                      <span className="text-yellow-600 dark:text-yellow-400" title="Pendentes">{data.systemHealth.queues.telegram.pending}P</span>
                      <span className="text-blue-600 dark:text-blue-400" title="Ativos">{data.systemHealth.queues.telegram.active}A</span>
                      <span className="text-red-600 dark:text-red-400" title="Falhos">{data.systemHealth.queues.telegram.failed}F</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE DE ATIVIDADES */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Últimas Atividades</h3>
              <div className="space-y-4">
                {data.timeline.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade recente.</p>
                ) : (
                  data.timeline.map((event: any) => (
                    <div key={event.id} className="flex gap-3 items-start relative">
                      <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                        event.severity === 'error' ? 'bg-red-500' :
                        event.severity === 'warning' ? 'bg-yellow-500' :
                        'bg-indigo-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {event.event_name.replace('Event', '')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(event.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-2 relative z-10">
        <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{title}</h4>
        <div className="p-2 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold relative z-10 truncate" title={String(value)}>
        {value}
      </div>
      <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity transform scale-150 rotate-12">
        {icon}
      </div>
    </Card>
  )
}

function HealthRow({ name, status, latency, icon }: { name: string, status: string, latency?: number, icon: React.ReactNode }) {
  const isOnline = status === 'online';
  const isDegraded = status === 'degraded';
  
  return (
    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      <div className="flex items-center gap-2">
        <div className="text-gray-500 dark:text-gray-400">{icon}</div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        {latency !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">{latency}ms</span>
        )}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : (isDegraded ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse')}`} />
          <span className="text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
            {status}
          </span>
        </div>
      </div>
    </div>
  )
}
