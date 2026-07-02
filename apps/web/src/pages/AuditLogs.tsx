import { useState, useEffect } from 'react'
import { Activity, ShieldCheck, AlertCircle, FileSearch, Filter, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditLog {
  id: string
  event_id: string
  event_name: string
  action: string
  entity: string
  entity_id: string | null
  severity: 'info' | 'warn' | 'error' | 'critical'
  status: 'success' | 'failed'
  source: string
  user_id: string
  created_at: string
  metadata: any
  error_message: string | null
}

interface Pagination {
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Em um app real usaríamos o supabase.auth.getSession() + fetch para a nossa API protegida
// Para este exemplo, como a API é protegida por JWT, precisamos buscar o token.
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, hasMore: false })
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    severity: '',
    status: '',
    entity: '',
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [stats, setStats] = useState({ total: 0, errors: 0, security: 0, system: 0 })

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Construir query params
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      })

      if (filters.search) query.append('search', filters.search)
      if (filters.severity) query.append('severity', filters.severity)
      if (filters.status) query.append('status', filters.status)
      if (filters.entity) query.append('entity', filters.entity)

      const response = await api.get(`/api/audit-logs?${query.toString()}`);
      
      const result = response.data;
      setLogs(result.data)
      setPagination(result.pagination)
      
      // Se for a primeira página, também calcular os stats (idealmente o backend faria isso num endpoint /stats)
      if (page === 1) {
        setStats({
          total: result.pagination.total,
          errors: result.data.filter((l: any) => l.severity === 'error' || l.status === 'failed').length,
          security: result.data.filter((l: any) => l.action.includes('auth') || l.action.includes('login')).length,
          system: result.data.filter((l: any) => l.source === 'system' || l.entity === 'workers').length,
        })
      }

    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ search: '', severity: '', status: '', entity: '' })
  }

  const formatJSON = (obj: any) => {
    if (!obj) return 'N/A'
    return JSON.stringify(obj, null, 2)
  }

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'error':
      case 'critical':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">Error</span>
      case 'warn':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Warning</span>
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">Info</span>
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Success</span>
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">Failed</span>
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="text-gray-400 mt-1">
            Trilha de auditoria de segurança e eventos do sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchLogs(pagination.page)}
            className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-xl transition-all flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-xl transition-all flex items-center gap-2 ${
              showFilters || Object.values(filters).some(v => v !== '') 
                ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' 
                : 'bg-gray-800/50 hover:bg-gray-800 border-gray-700/50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Events</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileSearch className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">Errors (24h)</p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">{stats.errors}</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">Security</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">{stats.security}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">System</p>
              <h3 className="text-2xl font-bold text-purple-500 mt-1">{stats.system}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      {showFilters && (
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-300">Filter Logs</h3>
            <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-white transition-colors">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Search / ID</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Event ID, message..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Entity</label>
              <select
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                <option value="campaigns">Campaigns</option>
                <option value="products">Products</option>
                <option value="telegram">Telegram</option>
                <option value="workers">Workers</option>
                <option value="auth">Auth</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/50 border-b border-gray-800/60">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-400">Timestamp</th>
                <th className="px-6 py-4 font-medium text-gray-400">Event</th>
                <th className="px-6 py-4 font-medium text-gray-400">Entity</th>
                <th className="px-6 py-4 font-medium text-gray-400">Source</th>
                <th className="px-6 py-4 font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 font-medium text-gray-400 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading && logs.length === 0 ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-800 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-800 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-800 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-800 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-800 rounded-full animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-800 rounded-lg ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileSearch className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-200">{log.event_name}</div>
                      <div className="text-xs text-gray-500 mt-1">{log.action}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300">{log.entity}</span>
                      {log.entity_id && (
                        <span className="block text-xs text-gray-600 mt-1 truncate max-w-[120px]">
                          {log.entity_id}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {log.source || 'system'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2 items-start">
                        {getStatusBadge(log.status)}
                        {log.severity !== 'info' && getSeverityBadge(log.severity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-800/60 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing page {pagination.page}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="p-2 rounded-lg bg-gray-900 border border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={!pagination.hasMore || loading}
              className="p-2 rounded-lg bg-gray-900 border border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  Log Details
                  {getStatusBadge(selectedLog.status)}
                </h2>
                <p className="text-sm text-gray-400 mt-1">ID: {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              {selectedLog.error_message && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <h4 className="text-red-400 font-medium mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Error Message
                  </h4>
                  <p className="text-red-300/80 text-sm">{selectedLog.error_message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
                  <span className="text-xs text-gray-500 block mb-1">Timestamp</span>
                  <span className="text-sm text-gray-200">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss")}
                  </span>
                </div>
                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
                  <span className="text-xs text-gray-500 block mb-1">Event Name</span>
                  <span className="text-sm text-gray-200">{selectedLog.event_name}</span>
                </div>
                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
                  <span className="text-xs text-gray-500 block mb-1">Action</span>
                  <span className="text-sm text-gray-200">{selectedLog.action}</span>
                </div>
                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
                  <span className="text-xs text-gray-500 block mb-1">Source</span>
                  <span className="text-sm text-gray-200">{selectedLog.source || 'system'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Metadata / Payload</h4>
                <div className="bg-gray-950 rounded-xl border border-gray-800/80 p-4 overflow-x-auto">
                  <pre className="text-xs text-emerald-400/90 font-mono">
                    {formatJSON(selectedLog.metadata)}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
