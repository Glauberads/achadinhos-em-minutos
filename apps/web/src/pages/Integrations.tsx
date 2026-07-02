import { useState, useEffect } from 'react'
import { Send, Store, Key, ShieldCheck, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

interface IntegrationStatus {
  platform: string;
  connected: boolean;
  status: string;
  updated_at: string;
  metadata: {
    app_id: string | null;
    affiliate_id: string | null;
  };
}

export function Integrations() {
  const navigate = useNavigate()
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [editingPlatform, setEditingPlatform] = useState<'shopee' | 'mercadolivre' | null>(null)
  
  // Form state
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [affiliateId, setAffiliateId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await api.get('/api/marketplaces/status')
      
      const data = response.data
      if (data && data.statuses) {
        setStatuses(data.statuses)
      }
    } catch (err) {
      console.error('Failed to fetch integration statuses', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlatform) return
    
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await api.post('/api/marketplaces/config', {
        platform: editingPlatform,
        app_id: appId,
        app_secret: appSecret,
        affiliate_id: affiliateId
      })

      if (response.data) {
        setEditingPlatform(null)
        setAppId('')
        setAppSecret('')
        setAffiliateId('')
        fetchStatuses()
      }
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (platform: 'shopee' | 'mercadolivre') => {
    setEditingPlatform(platform)
    setAppId('')
    setAppSecret('')
    setAffiliateId('')
  }

  const getStatus = (platform: string) => {
    return statuses.find(s => s.platform === platform)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="h-16 shrink-0 flex items-center px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10 sticky top-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Integrações & Marketplaces</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Intro */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gerencie suas chaves de API</h3>
            <p className="text-gray-500 text-sm mt-1">
              Conecte suas próprias contas de afiliado para que todas as vendas geradas pelo sistema caiam diretamente na sua conta. Seus segredos são criptografados no banco de dados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Shopee Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Shopee Affiliate</h4>
                    <span className="text-xs text-gray-500">Open API</span>
                  </div>
                </div>
                {getStatus('shopee')?.connected ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full"><ShieldCheck className="w-3 h-3"/> Conectado</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full"><ShieldAlert className="w-3 h-3"/> Pendente</span>
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">App ID</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300">{getStatus('shopee')?.metadata?.app_id || 'Não configurado'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Affiliate ID</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300">{getStatus('shopee')?.metadata?.affiliate_id || 'Não configurado'}</span>
                </div>
              </div>

              <button 
                onClick={() => openEdit('shopee')}
                className="w-full py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors text-gray-700 dark:text-gray-200"
              >
                Configurar Shopee
              </button>
            </div>

            {/* Mercado Livre Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Mercado Livre</h4>
                    <span className="text-xs text-gray-500">Developers API</span>
                  </div>
                </div>
                {getStatus('mercadolivre')?.connected ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full"><ShieldCheck className="w-3 h-3"/> Conectado</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full"><ShieldAlert className="w-3 h-3"/> Pendente</span>
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client ID</span>
                  <span className="font-medium text-gray-900 dark:text-gray-300">{getStatus('mercadolivre')?.metadata?.app_id || 'Não configurado'}</span>
                </div>
              </div>

              <button 
                onClick={() => openEdit('mercadolivre')}
                className="w-full py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium transition-colors text-gray-700 dark:text-gray-200"
              >
                Configurar Mercado Livre
              </button>
            </div>

            {/* Telegram Link Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-md text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/telegram')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Telegram Bot</h4>
                  <p className="text-blue-100 text-sm">Canal de Disparo</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-white/80">
                <span>Gerenciar Conexão</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {editingPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">Configurar {editingPlatform}</h3>
              <p className="text-sm text-gray-500 mt-1">Suas chaves são mantidas em sigilo criptografado.</p>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {editingPlatform === 'shopee' ? 'App ID' : 'Client ID'}
                </label>
                <input 
                  type="text" 
                  value={appId}
                  onChange={e => setAppId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  placeholder="ID da Aplicação"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {editingPlatform === 'shopee' ? 'App Secret' : 'Client Secret'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    value={appSecret}
                    onChange={e => setAppSecret(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    placeholder="Chave secreta (Será criptografada)"
                    required
                  />
                </div>
              </div>

              {editingPlatform === 'shopee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Affiliate ID (Opcional)
                  </label>
                  <input 
                    type="text" 
                    value={affiliateId}
                    onChange={e => setAffiliateId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    placeholder="Seu ID de Afiliado na plataforma"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingPlatform(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex justify-center items-center"
                >
                  {saving ? 'Salvando...' : 'Salvar Seguro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
