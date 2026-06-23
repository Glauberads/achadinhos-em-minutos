import { useState, useEffect } from 'react'
import { Plus, Play, Pause, RefreshCw, BarChart2, Bot, AlertTriangle, Clock, Settings, Store, CheckCircle2, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface Campaign {
  id: string;
  name: string;
  platform: string;
  keyword: string;
  status: string;
  next_run_at: string;
  telegram_group: { group_name: string } | null;
  recurrence_cron: string;
}

interface Group {
  id: string;
  group_name: string;
}

export function Campaigns() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    platform: 'mercadolivre',
    keyword: '',
    telegram_group_id: '',
    recurrence_cron: '60' // mock pra 60 min
  })
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch Campaigns
      const resCamp = await fetch('http://localhost:3001/api/campaigns', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const dataCamp = await resCamp.json()
      if (resCamp.ok) setCampaigns(dataCamp.campaigns || [])

      // Fetch Groups
      const { data: grps } = await supabase.from('groups').select('id, group_name').eq('is_active', true)
      setGroups(grps || [])
    } catch (err) {
      console.error('Failed to fetch data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('http://localhost:3001/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowForm(false)
        fetchData()
      } else {
        alert('Erro ao salvar campanha.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'run-now') => {
    setActionLoading(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`http://localhost:3001/api/campaigns/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        if (action === 'run-now') alert('Campanha enviada para a fila de execução!')
        fetchData()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full"><Play className="w-3 h-3"/> Rodando</span>
      case 'paused': return <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full"><Pause className="w-3 h-3"/> Pausada</span>
      default: return <span className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">{status}</span>
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="h-16 shrink-0 flex justify-between items-center px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10 sticky top-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Campanhas Automáticas</h2>
          <p className="text-sm text-gray-500">Minerador 24/7 para o Telegram</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Campanha
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">

          {/* Empty State ou Lista */}
          {loading ? (
            <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sua máquina está dormindo</h3>
              <p className="text-gray-500 mt-2 max-w-md">Crie campanhas autônomas para buscar produtos quentes na Shopee ou Mercado Livre e enviá-los de forma inteligente para o seu Telegram, enquanto você dorme.</p>
              
              {groups.length === 0 ? (
                <div className="mt-6 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-sm flex items-start gap-3 max-w-md text-left">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Nenhum Grupo de Telegram Configurado</p>
                    <p className="mt-1">Antes de criar uma automação, você precisa plugar um grupo ou canal destino.</p>
                    <button onClick={() => navigate('/telegram')} className="mt-3 text-amber-900 underline font-medium">Configurar Telegram agora</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowForm(true)} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                  Criar Primeira Campanha
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map(camp => (
                <div key={camp.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      {renderStatus(camp.status)}
                      <span className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                        {camp.platform.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate" title={camp.name}>{camp.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                      <Search className="w-4 h-4"/> "{camp.keyword}"
                    </p>
                  </div>

                  <div className="p-5 space-y-4 flex-1">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs text-gray-400">Destino</p>
                        <p className="font-medium truncate">{camp.telegram_group?.group_name || 'Desconhecido'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Próxima Execução</p>
                        <p className="font-medium">{camp.next_run_at ? new Date(camp.next_run_at).toLocaleString() : 'Não agendada'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2">
                    {camp.status === 'active' ? (
                      <button 
                        onClick={() => handleAction(camp.id, 'pause')}
                        disabled={actionLoading === camp.id}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-amber-700 bg-white border border-amber-200 py-2 rounded-xl hover:bg-amber-50 disabled:opacity-50"
                      >
                        <Pause className="w-4 h-4" /> Pausar
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAction(camp.id, 'resume')}
                        disabled={actionLoading === camp.id}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-green-700 bg-white border border-green-200 py-2 rounded-xl hover:bg-green-50 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" /> Retomar
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleAction(camp.id, 'run-now')}
                      disabled={actionLoading === camp.id}
                      className="flex items-center justify-center gap-2 text-sm font-medium text-white bg-indigo-600 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {actionLoading === camp.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Rodar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nova Campanha Automática</h3>
                <p className="text-sm text-gray-500 mt-1">Configure o robô para buscar ofertas.</p>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nome Interno</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Aquecimento Black Friday - Celulares"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Plataforma</label>
                  <select 
                    value={formData.platform}
                    onChange={e => setFormData({...formData, platform: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
                  >
                    <option value="mercadolivre">Mercado Livre</option>
                    <option value="shopee">Shopee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Palavra-chave / Nicho</label>
                  <input 
                    type="text" 
                    value={formData.keyword}
                    onChange={e => setFormData({...formData, keyword: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
                    placeholder="Ex: Fone Bluetooth"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Grupo/Canal de Destino (Telegram)</label>
                  <select 
                    value={formData.telegram_group_id}
                    onChange={e => setFormData({...formData, telegram_group_id: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
                    required
                  >
                    <option value="">Selecione um grupo...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Frequência (Cron Mock)</label>
                  <select 
                    value={formData.recurrence_cron}
                    onChange={e => setFormData({...formData, recurrence_cron: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
                  >
                    <option value="30">A cada 30 Minutos</option>
                    <option value="60">A cada 1 Hora</option>
                    <option value="720">A cada 12 Horas</option>
                    <option value="1440">Uma vez por dia</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex justify-center items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {saving ? 'Criando...' : 'Ativar Robô'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
