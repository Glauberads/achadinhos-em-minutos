import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Send, X, Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

type Product = {
  id: string
  title: string
  platform: string
  original_price: number | null
  current_price: number
  discount: number | null
  image_url: string | null
  source_url: string | null
  affiliate_link: string | null
  status: string
}

type Group = {
  id: string
  group_name: string
  external_group_id: string
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTestOpen, setIsTestOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null)
  
  // Form submission state
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [feedbackMsg, setFeedbackMsg] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchGroups()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (data) setProducts(data)
    setLoading(false)
  }

  const fetchGroups = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('groups')
      .select('id, group_name, external_group_id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      
    if (data) setGroups(data)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedbackMsg(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const productData = {
      ...currentProduct,
      user_id: session.user.id,
      discount: currentProduct?.original_price && currentProduct?.current_price 
        ? Math.round(((currentProduct.original_price - currentProduct.current_price) / currentProduct.original_price) * 100) 
        : 0
    }

    let error;
    if (productData.id) {
      // Update
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productData.id)
      error = updateError
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('products')
        .insert([productData])
      error = insertError
    }

    setSaving(false)
    if (error) {
      setFeedbackMsg({ type: 'error', text: error.message })
    } else {
      setFeedbackMsg({ type: 'success', text: 'Produto salvo com sucesso!' })
      setIsFormOpen(false)
      fetchProducts()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      alert('Erro ao deletar: ' + error.message)
    } else {
      fetchProducts()
    }
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !currentProduct?.id) return

    setSendingTest(true)
    setFeedbackMsg(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data: result } = await api.post('/telegram/test-send', {
        product_id: currentProduct.id,
        group_id: selectedGroup
      })

      setFeedbackMsg({ type: 'success', text: 'Mensagem enviada com sucesso para o Telegram!' })
      setTimeout(() => setIsTestOpen(false), 2000)
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message })
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Produtos</h2>
            <p className="text-gray-500 dark:text-gray-400">Gerencie seus links de afiliado e ofertas.</p>
          </div>
          <button 
            onClick={() => {
              setCurrentProduct({ platform: 'Shopee', status: 'active', current_price: 0 })
              setIsFormOpen(true)
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" /> Novo Produto
          </button>
        </div>

        {/* Feedback messages */}
        {feedbackMsg && (
          <div className={`p-4 rounded-xl border ${feedbackMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {feedbackMsg.text}
          </div>
        )}

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando produtos...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Nenhum produto cadastrado</h3>
              <p className="text-gray-500 mb-4">Comece adicionando seu primeiro achadinho.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-medium">Produto</th>
                    <th className="px-6 py-4 font-medium">Plataforma</th>
                    <th className="px-6 py-4 font-medium">Preço</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded object-cover border border-gray-200 dark:border-gray-600" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{p.title}</p>
                            <a href={p.affiliate_link || '#'} target="_blank" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                              Link <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {p.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">R$ {p.current_price}</span>
                          {p.original_price && p.original_price > p.current_price && (
                            <span className="text-xs text-gray-400 line-through">R$ {p.original_price}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {p.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setCurrentProduct(p)
                              setFeedbackMsg(null)
                              setIsTestOpen(true)
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Enviar Teste"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setCurrentProduct(p)
                              setIsFormOpen(true)
                            }}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {currentProduct?.id ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <input required type="text" value={currentProduct?.title || ''} onChange={(e) => setCurrentProduct({...currentProduct, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Smartwatch X Plus" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plataforma</label>
                    <select value={currentProduct?.platform || 'Shopee'} onChange={(e) => setCurrentProduct({...currentProduct, platform: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="Shopee">Shopee</option>
                      <option value="Mercado Livre">Mercado Livre</option>
                      <option value="Amazon">Amazon</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select value={currentProduct?.status || 'active'} onChange={(e) => setCurrentProduct({...currentProduct, status: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Original (opcional)</label>
                    <input type="number" step="0.01" value={currentProduct?.original_price || ''} onChange={(e) => setCurrentProduct({...currentProduct, original_price: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="99.90" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Atual com desconto</label>
                    <input required type="number" step="0.01" value={currentProduct?.current_price || ''} onChange={(e) => setCurrentProduct({...currentProduct, current_price: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="49.90" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link de Afiliado (Final)</label>
                  <input required type="url" value={currentProduct?.affiliate_link || ''} onChange={(e) => setCurrentProduct({...currentProduct, affiliate_link: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://shope.ee/..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link Original (opcional)</label>
                  <input type="url" value={currentProduct?.source_url || ''} onChange={(e) => setCurrentProduct({...currentProduct, source_url: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://shopee.com.br/..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL da Imagem (opcional)</label>
                  <input type="url" value={currentProduct?.image_url || ''} onChange={(e) => setCurrentProduct({...currentProduct, image_url: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Salvar Produto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Test Send Modal */}
        {isTestOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-500" /> Enviar Teste
                </h3>
                <button onClick={() => setIsTestOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSendTest} className="p-6 space-y-4">
                {feedbackMsg && (
                  <div className={`p-4 rounded-lg border text-sm ${feedbackMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {feedbackMsg.text}
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enviar o produto <strong className="text-gray-900 dark:text-white">{currentProduct?.title}</strong> para o Telegram.
                  </p>
                  
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecione o Grupo Destino</label>
                  {groups.length > 0 ? (
                    <select required value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">-- Selecione um grupo --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.group_name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">
                      Você ainda não conectou o Telegram. Vá em Integração Telegram primeiro.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="submit" disabled={sendingTest || groups.length === 0} className="flex w-full justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {sendingTest ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Disparar Mensagem'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
