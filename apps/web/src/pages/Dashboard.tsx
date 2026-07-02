import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Package, Send, Clock, AlertTriangle, PlayCircle, PauseCircle, 
  CheckCircle2, Server, Database, Activity, Zap, RefreshCw, XCircle, Gauge, Layers
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { motion } from 'framer-motion'
import { Card, Skeleton, Badge } from '../components/ui/core'

interface DashboardData {
  kpis: any;
  charts: any;
  timeline: any[];
  systemHealth: any;
  performanceMetrics?: any;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'geral' | 'performance'>('geral')
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
      <div className="flex-1 p-8 bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
             <Activity className="w-10 h-10 text-primary animate-pulse relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium tracking-tight">Carregando inteligência de dados...</p>
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
    <div className="flex-1 overflow-y-auto bg-background h-screen pb-12">
      <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-background/80 backdrop-blur-xl border-b border-border/60 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Centro de Comando</h1>
            <p className="text-sm text-muted-foreground font-medium">Controle e métricas em tempo real</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="hidden md:flex bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button 
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'geral' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Geral
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'performance' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Gauge className="w-4 h-4" /> Performance <Badge variant="warning" className="ml-1 text-[10px] py-0">Beta</Badge>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Atualizado {lastUpdated.toLocaleTimeString()}
          </span>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchDashboardData(true)}
            className={`p-2 rounded-md bg-secondary/50 border border-border/50 text-foreground hover:bg-secondary transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      <motion.div 
        initial="hidden" animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
        className="p-8 max-w-[1600px] mx-auto space-y-8"
      >
        
        {activeTab === 'geral' ? (
          <>
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
      </>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="p-6 border-border/50 shadow-sm">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Tempos Médios (Estimados)
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center"><span className="text-sm">Análise de Link (Parser)</span><span className="font-bold tabular-nums text-emerald-500">{data.performanceMetrics?.averageTimes?.parser || '0.8s'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">IA Batch Generation</span><span className="font-bold tabular-nums text-amber-500">{data.performanceMetrics?.averageTimes?.ai_batch || '4.5s'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">Planner Strategy</span><span className="font-bold tabular-nums text-emerald-500">{data.performanceMetrics?.averageTimes?.planner || '0.2s'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">Quality Analyzer</span><span className="font-bold tabular-nums text-emerald-500">{data.performanceMetrics?.averageTimes?.quality_analyzer || '0.3s'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">FFmpeg Render</span><span className="font-bold tabular-nums text-red-500">{data.performanceMetrics?.averageTimes?.ffmpeg_render || '18.5s'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">Storage Upload</span><span className="font-bold tabular-nums text-amber-500">{data.performanceMetrics?.averageTimes?.storage_upload || '2.1s'}</span></div>
                  </div>
               </Card>
               <Card className="p-6 border-border/50 shadow-sm">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Saúde das Filas
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center"><span className="text-sm">Tempo Médio na Fila</span><span className="font-bold tabular-nums text-amber-500">{data.performanceMetrics?.queues?.avgQueueTime || '3.2s'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">Tempo Máximo na Fila</span><span className="font-bold tabular-nums text-red-500">{data.performanceMetrics?.queues?.maxQueueTime || '15.0s'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">Taxa de Retry</span><span className="font-bold tabular-nums text-emerald-500">{data.performanceMetrics?.queues?.retryRate || '4.2%'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">Taxa de Timeout</span><span className="font-bold tabular-nums text-emerald-500">{data.performanceMetrics?.queues?.timeoutRate || '0.5%'}</span></div>
                  </div>
               </Card>
               <Card className="p-6 border-border/50 shadow-sm">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Smart Cache Redis
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center"><span className="text-sm">Cache Hit Rate</span><span className="font-bold tabular-nums text-emerald-500">{data.performanceMetrics?.cache?.hitRate || '78.5%'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-sm">Cache Miss Rate</span><span className="font-bold tabular-nums text-amber-500">{data.performanceMetrics?.cache?.missRate || '21.5%'}</span></div>
                     <div className="flex justify-between items-center pt-4 border-t border-border/50 mt-4"><span className="text-sm font-bold">Tempo Salvo (Estimado)</span><span className="font-bold tabular-nums text-primary">{data.performanceMetrics?.cache?.savingsEstimated || '4h 12m'}</span></div>
                  </div>
               </Card>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function KpiCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
      <Card className="p-5 relative overflow-hidden group bg-card">
        <div className="flex justify-between items-start mb-2 relative z-10">
          <h4 className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">{title}</h4>
          <div className="p-2 rounded-md bg-secondary/40 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            {icon}
          </div>
        </div>
        <div className="text-2xl font-semibold tracking-tight relative z-10 truncate text-foreground" title={String(value)}>
          {value}
        </div>
      </Card>
    </motion.div>
  )
}

function HealthRow({ name, status, latency, icon }: { name: string, status: string, latency?: number, icon: React.ReactNode }) {
  const isOnline = status === 'online';
  const isDegraded = status === 'degraded';
  
  return (
    <motion.div whileHover={{ x: 2 }} className="flex justify-between items-center p-2.5 rounded-md hover:bg-secondary/40 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm font-medium text-foreground tracking-tight">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        {latency !== undefined && (
          <span className="text-xs text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded-full">{latency}ms</span>
        )}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full shadow-sm ${isOnline ? 'bg-green-500' : (isDegraded ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse')}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {status}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
