import { useState, useEffect } from 'react'
import { Search, ShoppingBag, ExternalLink, Download, Send, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface NormalizedProduct {
  platform: 'shopee' | 'mercadolivre';
  external_id: string;
  title: string;
  original_price: number | null;
  current_price: number;
  discount: number | null;
  image_url: string | null;
  source_url: string;
  affiliate_link: string | null;
  rating: number | null;
  sold_count: number | null;
  free_shipping: boolean;
  metadata: any;
}

export function SearchProducts() {
  const [platform, setPlatform] = useState<'shopee' | 'mercadolivre'>('shopee')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<NormalizedProduct[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  
  const [importing, setImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importSuccess, setImportSuccess] = useState<{ imported: number, ignored: number } | null>(null)

  const [telegramGroups, setTelegramGroups] = useState<any[]>([])
  const [sendingTelegram, setSendingTelegram] = useState<string | null>(null)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'telegram')
      .eq('is_active', true)
    
    if (data) setTelegramGroups(data)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword) return

    setLoading(true)
    setResults([])
    setJobId(null)
    setImportSuccess(null)
    setSelectedIds(new Set())

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('http://localhost:3001/api/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ platform, keyword, limit: 12 })
      })

      const data = await response.json()
      if (response.ok) {
        setResults(data.products)
        setJobId(data.job_id)
      } else {
        alert('Erro ao buscar: ' + data.error)
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (productsToImport: NormalizedProduct[]) => {
    if (productsToImport.length === 0) return

    setImporting(true)
    setImportSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('http://localhost:3001/api/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ products: productsToImport, job_id: jobId })
      })

      const data = await response.json()
      if (response.ok) {
        setImportSuccess({ imported: data.imported, ignored: data.ignored })
        // Limpar seleção
        setSelectedIds(new Set())
      } else {
        alert('Erro ao importar: ' + data.error)
      }
    } catch (err) {
      alert('Falha ao importar produtos')
    } finally {
      setImporting(false)
    }
  }

  // Como o produto importado ganha um ID novo no banco, não temos o product_id exato aqui no preview facilmente.
  // Idealmente, a tela de Produtos é o lugar correto para enviar após importado.
  // Mas para facilitar, vamos avisar o usuário.

  const toggleSelect = (extId: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(extId)) newSet.delete(extId)
    else newSet.add(extId)
    setSelectedIds(newSet)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="h-16 shrink-0 flex items-center justify-between px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10 sticky top-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Busca Automática</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        
        {/* Filters Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">O que você quer vender?</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Ex: Fone bluetooth, Relógio inteligente..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                />
              </div>
            </div>

            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plataforma</label>
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
              >
                <option value="shopee">Shopee</option>
                <option value="mercadolivre">Mercado Livre</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading || !keyword}
              className="w-full md:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <span className="animate-pulse">Buscando...</span> : <><Search className="w-4 h-4" /> Buscar Ofertas</>}
            </button>
          </form>
        </div>

        {/* Status Import */}
        {importSuccess && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">Importação concluída!</h4>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                {importSuccess.imported} produto(s) salvos no banco. {importSuccess.ignored} ignorados (já existiam).
                <br/>
                Vá até a aba <strong>Produtos</strong> para gerenciar e enviar para o Telegram!
              </p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Resultados Encontrados ({results.length})
                {results[0]?.metadata?.is_mock && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-yellow-200">
                    <Info className="w-3 h-3" /> Exibindo dados simulados (Fallback)
                  </span>
                )}
              </h3>

              {selectedIds.size > 0 && (
                <button 
                  onClick={() => handleImport(results.filter(r => selectedIds.has(r.external_id)))}
                  disabled={importing}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {importing ? 'Importando...' : `Importar Selecionados (${selectedIds.size})`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map(prod => (
                <div key={prod.external_id} className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border transition-all ${selectedIds.has(prod.external_id) ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
                  
                  {/* Imagem Placeholder */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative group">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag className="w-12 h-12 opacity-50" /></div>
                    )}
                    
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md font-medium uppercase tracking-wide">
                      {prod.platform}
                    </div>

                    {prod.discount && (
                       <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-bold">
                         -{prod.discount}%
                       </div>
                    )}

                    <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => toggleSelect(prod.external_id)}>
                      <div className="bg-white text-indigo-600 px-4 py-2 rounded-full font-medium text-sm shadow-lg flex items-center gap-2">
                        {selectedIds.has(prod.external_id) ? <CheckCircle2 className="w-4 h-4"/> : <Download className="w-4 h-4" />}
                        {selectedIds.has(prod.external_id) ? 'Selecionado' : 'Selecionar'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2 text-sm mb-2" title={prod.title}>
                      {prod.title}
                    </h4>

                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        R$ {prod.current_price.toFixed(2).replace('.', ',')}
                      </span>
                      {prod.original_price && (
                        <span className="text-xs text-gray-400 line-through mb-1">
                          R$ {prod.original_price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {prod.sold_count && (
                        <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium border border-orange-200">
                          🔥 {prod.sold_count} vendidos
                        </span>
                      )}
                      {prod.free_shipping && (
                        <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded font-medium border border-green-200">
                          📦 Frete Grátis
                        </span>
                      )}
                    </div>

                    {prod.metadata?.score_reason && (
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-4 line-clamp-1 italic">
                        {prod.metadata.score_reason}
                      </p>
                    )}

                    {!prod.affiliate_link && (
                       <div className="flex items-start gap-1.5 mb-4 text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                         <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                         <span className="leading-tight">Sem link de afiliado oficial. Será marcado como pendente ao importar.</span>
                       </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleImport([prod])}
                        disabled={importing}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Importar 1
                      </button>
                      <a 
                        href={prod.source_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg transition-colors"
                        title="Ver no site original"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length === 0 && keyword && jobId !== null && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mt-1">Tente buscar com outra palavra-chave ou categoria.</p>
          </div>
        )}

      </div>
    </div>
  )
}
