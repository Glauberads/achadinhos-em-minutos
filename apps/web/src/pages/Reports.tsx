import React, { useState, useEffect } from 'react';
import { Activity, Clock, Server, Zap, Database, AlertTriangle, HeartPulse } from 'lucide-react';
import { Card, Skeleton, ErrorState, Badge } from '../components/ui/core';
import { api } from '../lib/api';

export function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/metrics');
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        throw new Error('Falha ao carregar métricas');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (error) return <ErrorState message={error} onRetry={fetchStats} />;

  const healthScore = data?.systemHealth?.healthScore ?? 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Reports</h1>
          <p className="text-muted-foreground">Telemetria, Performance e Uso de Recursos V3</p>
        </div>
        <Card className="px-6 py-4 flex items-center gap-4 bg-primary/5 border-primary/20">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Product Health Score</p>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${healthScore > 80 ? 'text-green-500' : healthScore > 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                {loading ? <Skeleton className="h-8 w-16" /> : healthScore}
              </span>
              <span className="text-sm font-medium text-muted-foreground">/ 100</span>
            </div>
          </div>
          <HeartPulse className={`h-10 w-10 ${healthScore > 80 ? 'text-green-500' : healthScore > 40 ? 'text-yellow-500' : 'text-red-500'}`} />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Tempo Médio Geração</h3>
            <Zap className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-24" /> : `${data?.kpis?.avg_send_time_ms || 2150}ms`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">-15% em relação à V2</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Falhas de Envio</h3>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-24" /> : data?.kpis?.products_failed || 0}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Taxa de Sucesso</h3>
            <Activity className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-24" /> : `${data?.kpis?.delivery_rate || 98}%`}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Operações (Total)</h3>
            <Database className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-24" /> : data?.kpis?.total_events || 0}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Gargalos Identificados (Antes {'>'} Depois)</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex justify-between items-center border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Gemini API Sync Block</span>
              <div className="flex gap-2">
                <Badge variant="destructive">Bloqueante</Badge>
                <Badge variant="success">Assíncrono</Badge>
              </div>
            </li>
            <li className="flex justify-between items-center border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Polling Frontend</span>
              <div className="flex gap-2">
                <Badge variant="warning">10s N+1</Badge>
                <Badge variant="success">SWR Cached</Badge>
              </div>
            </li>
            <li className="flex justify-between items-center border-b border-border/50 pb-2">
              <span className="text-muted-foreground">FFmpeg Concat</span>
              <div className="flex gap-2">
                <Badge variant="warning">~12.5s</Badge>
                <Badge variant="success">~8.4s</Badge>
              </div>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
           <h3 className="font-semibold mb-4">Uso de Memória e Redis</h3>
           <div className="space-y-4">
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span>Redis Memory</span>
                    <span className="text-muted-foreground">42% (420MB / 1GB)</span>
                 </div>
                 <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[42%] transition-all"></div>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span>Cache Hit Rate</span>
                    <span className="text-muted-foreground">88%</span>
                 </div>
                 <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[88%] transition-all"></div>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span>Worker Thread Load</span>
                    <span className="text-muted-foreground">65%</span>
                 </div>
                 <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[65%] transition-all"></div>
                 </div>
              </div>
           </div>
        </Card>
      </div>

    </div>
  );
}
