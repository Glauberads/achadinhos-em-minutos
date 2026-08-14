import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Database, Server, Clock, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/card';

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
    status === 'online' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
  }`}>
    {status === 'online' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
    {status.toUpperCase()}
  </span>
);

export function ObservabilityDashboard() {
  const [metrics, setMetrics] = useState({
    healthScore: 98,
    apiStatus: 'online',
    redisStatus: 'online',
    supabaseStatus: 'online',
    storageStatus: 'online',
    workers: [
      { name: 'Creative Worker', status: 'online', cpu: '12%', mem: '150MB' },
      { name: 'FFmpeg Worker', status: 'online', cpu: '45%', mem: '1.2GB' },
      { name: 'Campaign Worker', status: 'online', cpu: '5%', mem: '120MB' },
      { name: 'Telegram Worker', status: 'online', cpu: '2%', mem: '80MB' },
    ],
    queues: [
      { name: 'Render Queue', active: 2, failed: 0, avgTime: '45s' },
      { name: 'Campaign Queue', active: 15, failed: 1, avgTime: '5s' },
      { name: 'Telegram Queue', active: 0, failed: 0, avgTime: '1s' },
    ],
    integrations: [
      { name: 'Gemini', status: 'online', latency: '1.2s' },
      { name: 'Asaas', status: 'online', latency: '400ms' },
    ],
    cache: {
      hits: 15420,
      misses: 320,
      ratio: '98%'
    },
    system: {
      cpu: '24%',
      memory: '450MB',
      uptime: '15d 4h'
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Aqui no futuro buscaríamos de /api/system/observability
    // Simulando fetch inicial
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Activity className="w-8 h-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Observability</h1>
          <p className="text-gray-500 mt-1">Monitoramento em tempo real da infraestrutura Enterprise.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-right">
            <p className="text-sm text-gray-500 font-medium">Health Score</p>
            <p className="text-2xl font-bold text-green-600">{metrics.healthScore}/100</p>
          </div>
          <ShieldAlert className="w-10 h-10 text-green-500 opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">API Gateway</p>
            <StatusBadge status={metrics.apiStatus} />
          </div>
          <Server className="w-8 h-8 text-blue-500 opacity-50" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Supabase DB</p>
            <StatusBadge status={metrics.supabaseStatus} />
          </div>
          <Database className="w-8 h-8 text-emerald-500 opacity-50" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Redis Cache</p>
            <StatusBadge status={metrics.redisStatus} />
          </div>
          <Database className="w-8 h-8 text-red-500 opacity-50" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Storage (Assets)</p>
            <StatusBadge status={metrics.storageStatus} />
          </div>
          <Database className="w-8 h-8 text-yellow-500 opacity-50" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workers Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            Workers & Processamento
          </h3>
          <div className="space-y-4">
            {metrics.workers.map((worker, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${worker.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-gray-700">{worker.name}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>CPU: {worker.cpu}</span>
                  <span>RAM: {worker.mem}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* BullMQ Queues */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Filas (BullMQ)
          </h3>
          <div className="space-y-4">
            {metrics.queues.map((queue, i) => (
              <div key={i} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">{queue.name}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">Avg: {queue.avgTime}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                    Ativos: {queue.active}
                  </div>
                  <div className={`flex items-center gap-1 ${queue.failed > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    <AlertTriangle className="w-3 h-3"/>
                    Falhas: {queue.failed}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cache Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Redis Cache Performance
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{metrics.cache.ratio}</p>
              <p className="text-xs text-green-600 mt-1 uppercase font-semibold">Hit Ratio</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-700">{metrics.cache.hits}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Total Hits</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{metrics.cache.misses}</p>
              <p className="text-xs text-red-600 mt-1 uppercase font-semibold">Total Misses</p>
            </div>
          </div>
        </Card>

        {/* External Integrations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-400" />
            Integrações Externas
          </h3>
          <div className="space-y-4">
            {metrics.integrations.map((int, i) => (
              <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-700">{int.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Latência: {int.latency}</span>
                  <StatusBadge status={int.status} />
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 text-sm text-gray-500">
              <span>Server Load (CPU)</span>
              <span className="font-mono">{metrics.system.cpu}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Memory Usage</span>
              <span className="font-mono">{metrics.system.memory}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
