import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { AlertCircle, CheckCircle, Info, RefreshCw, Terminal, Trash2, Filter, Download } from 'lucide-react';

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  source: string;
  timestamp: string;
  metadata?: any;
}

const LEVEL_STYLES = {
  error: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300', icon: AlertCircle },
  warn: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300', icon: AlertCircle },
  success: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300', icon: CheckCircle },
  info: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300', icon: Info },
  debug: { bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-400', badge: 'bg-gray-500/20 text-gray-300', icon: Info },
};

export function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'success'>('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [liveApiLogs, setLiveApiLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch audit logs from DB
  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/audit-logs?page=1&limit=100');
      const mapped = (data.logs || []).map((l: any) => ({
        id: l.id,
        level: l.level === 'error' ? 'error' : l.level === 'warn' ? 'warn' : l.action?.includes('completed') ? 'success' : 'info',
        message: `[${l.action || 'event'}] ${l.details ? JSON.stringify(l.details).substring(0, 120) : ''}`,
        source: l.source || 'system',
        timestamp: l.created_at,
        metadata: l.details,
      }));
      setLogs(mapped);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulate live API logs from server
  const fetchApiStatus = async () => {
    try {
      const resp = await api.get('/health');
      const ts = new Date().toLocaleTimeString('pt-BR');
      setLiveApiLogs(prev => [`[${ts}] ✅ API OK — ${JSON.stringify(resp.data || {}).substring(0, 80)}`, ...prev.slice(0, 49)]);
    } catch (err: any) {
      const ts = new Date().toLocaleTimeString('pt-BR');
      const msg = err?.response?.data?.message || err?.message || 'Sem resposta';
      setLiveApiLogs(prev => [`[${ts}] ❌ API ERROR — ${msg}`, ...prev.slice(0, 49)]);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchApiStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
      fetchApiStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveApiLogs]);

  const filtered = logs.filter(l => {
    const matchLevel = filter === 'all' || l.level === filter;
    const matchSearch = !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.source.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  const downloadLogs = () => {
    const content = filtered.map(l => `${l.timestamp} [${l.level.toUpperCase()}] ${l.source}: ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Logs do Sistema</h1>
              <p className="text-xs text-gray-400">Monitoramento em tempo real da API e eventos</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-red-400 font-mono">{errorCount} erros</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-yellow-400 font-mono">{warnCount} avisos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></div>
              <button
                onClick={() => setAutoRefresh(v => !v)}
                className={`text-xs font-medium ${autoRefresh ? 'text-emerald-400' : 'text-gray-500'}`}
              >
                {autoRefresh ? 'Live' : 'Pausado'}
              </button>
            </div>
            <button onClick={fetchLogs} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={downloadLogs} className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Exportar logs">
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-1 bg-gray-800/80 rounded-lg p-1">
            {(['all', 'error', 'warn', 'info', 'success'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filtrar logs..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
          <button onClick={() => setLiveApiLogs([])} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Audit Log Panel */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-800">
          <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Audit Logs — Banco de Dados</span>
            <span className="text-xs text-gray-600">{filtered.length} registros</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <Terminal className="w-10 h-10 mb-3" />
                <p className="text-sm">Nenhum log encontrado</p>
              </div>
            )}
            {filtered.map(log => {
              const styles = LEVEL_STYLES[log.level] || LEVEL_STYLES.info;
              const Icon = styles.icon;
              return (
                <div key={log.id} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${styles.bg}`}>
                  <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${styles.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${styles.badge}`}>{log.level}</span>
                      <span className="text-gray-500">{log.source}</span>
                      <span className="ml-auto text-gray-600 text-[10px]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('pt-BR') : ''}
                      </span>
                    </div>
                    <p className={`break-all leading-relaxed ${styles.text}`}>{log.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live API Console */}
        <div className="w-96 flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Console API — Live</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-[10px] text-gray-500">{autoRefresh ? 'Polling 5s' : 'Parado'}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs bg-gray-950">
            {liveApiLogs.length === 0 && (
              <p className="text-gray-600 text-center py-8">Aguardando requisições...</p>
            )}
            {liveApiLogs.map((l, i) => (
              <div key={i} className={`py-0.5 ${l.includes('❌') ? 'text-red-400' : 'text-emerald-400'}`}>
                {l}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-800 p-3 bg-gray-900/50">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Ações Rápidas</p>
            <div className="space-y-1.5">
              <button
                onClick={() => api.get('/health').then(r => setLiveApiLogs(p => [`[${new Date().toLocaleTimeString('pt-BR')}] Health: ${JSON.stringify(r.data)}`, ...p]))}
                className="w-full text-left text-xs px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
              >
                $ GET /api/health
              </button>
              <button
                onClick={() => api.get('/creatives').then(r => setLiveApiLogs(p => [`[${new Date().toLocaleTimeString('pt-BR')}] Creatives: ${r.data.creatives?.length || 0} found`, ...p])).catch(e => setLiveApiLogs(p => [`[${new Date().toLocaleTimeString('pt-BR')}] ❌ /creatives: ${e?.response?.data?.error || e.message}`, ...p]))}
                className="w-full text-left text-xs px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
              >
                $ GET /api/creatives
              </button>
              <button
                onClick={() => api.get('/feature-flags').then(r => setLiveApiLogs(p => [`[${new Date().toLocaleTimeString('pt-BR')}] Flags: ${JSON.stringify(r.data?.flags)}`, ...p])).catch(e => setLiveApiLogs(p => [`[${new Date().toLocaleTimeString('pt-BR')}] ❌ /feature-flags: ${e?.response?.data?.error || e.message}`, ...p]))}
                className="w-full text-left text-xs px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
              >
                $ GET /api/feature-flags
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
