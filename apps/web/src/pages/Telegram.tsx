import { useState, useEffect } from 'react'
import { Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function TelegramConfig() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ connected: boolean; bot_username?: string; groups_count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [groupName, setGroupName] = useState('')

  const fetchStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/telegram/status`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Erro ao buscar status', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Usuário não autenticado")

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/telegram/connect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          bot_token: botToken,
          chat_id: chatId,
          group_name: groupName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao conectar')
      }

      setSuccessMsg(`Conectado com sucesso ao bot @${data.bot_username}!`)
      setBotToken('')
      setChatId('')
      setGroupName('')
      fetchStatus()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Carregando status...</div>

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Send className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Integração Telegram</h2>
            <p className="text-gray-500 dark:text-gray-400">Conecte seu bot do Telegram para envio automático de ofertas.</p>
          </div>
        </div>

        {/* Card de Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Status da Conexão</h3>
          
          {status?.connected ? (
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-400">Bot Ativo: @{status.bot_username}</p>
                <p className="text-sm text-green-700 dark:text-green-500">{status.groups_count} grupo(s) configurado(s)</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-400">Aguardando Conexão</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">Você ainda não conectou nenhum bot.</p>
              </div>
            </div>
          )}
        </div>

        {/* Formulário de Conexão */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Configurar Novo Bot ou Grupo</h3>
          </div>
          
          <form onSubmit={handleConnect} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
                {successMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token do Bot (BotFather)</label>
                <input 
                  type="password" 
                  required
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="1234567890:AAH_..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID do Chat / Grupo</label>
                  <input 
                    type="text" 
                    required
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="-100123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de identificação</label>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Ofertas VIP"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Salvar Conexão
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
