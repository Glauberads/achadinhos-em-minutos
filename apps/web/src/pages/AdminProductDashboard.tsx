import React, { useState, useEffect } from 'react';
import { Card, Skeleton, Badge, Progress } from '../components/ui/core';
import { Users, Server, Clock, HeartPulse, Activity, Zap, Play, Filter, Box, AlertTriangle, Cpu, Layers } from 'lucide-react';
import { api } from '../lib/api';

export function AdminProductDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando fetch de dados pesados da API de admin (Operation Center)
    setTimeout(() => {
      setData({
        operations: {
          online_users: 142,
          active_orgs: 38,
          active_sessions: 156
        },
        infrastructure: {
          workers: 12,
          jobs_processing: 45,
          queues_pending: 128
        },
        performance: {
          avg_ia_time: '1.2s',
          avg_render_time: '4.5s',
          avg_upload_time: '0.8s'
        },
        incidents: [
          { id: 1, type: 'warning', message: 'Alta latência no Redis (> 200ms)', time: '10 mins ago' },
          { id: 2, type: 'critical', message: 'Falha na fila de renderização (Node 3)', time: '1 hora ago' }
        ],
        healthScore: 92
      });
      setLoading(false);
    }, 1200);
  }, []);

  if (loading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operation Center</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real da infraestrutura e operação Enterprise</p>
        </div>
        <Card className="px-6 py-4 flex items-center gap-4 bg-primary/5 border-primary/20">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Product Health Score</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-green-500">{data.healthScore}</span>
              <span className="text-sm font-medium text-muted-foreground">/ 100</span>
            </div>
          </div>
          <HeartPulse className="h-10 w-10 text-green-500" />
        </Card>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 border-indigo-500/20 shadow-sm">
          <div className="flex justify-between pb-2">
            <h3 className="text-sm font-medium">Usuários Online</h3>
            <Activity className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold">{data.operations.online_users}</div>
          <p className="text-xs text-muted-foreground mt-1">{data.operations.active_sessions} sessões ativas</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between pb-2">
            <h3 className="text-sm font-medium">Organizações Ativas</h3>
            <Box className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">{data.operations.active_orgs}</div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between pb-2">
            <h3 className="text-sm font-medium">Workers Ativos</h3>
            <Cpu className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-3xl font-bold">{data.infrastructure.workers}</div>
          <p className="text-xs text-muted-foreground mt-1">{data.infrastructure.jobs_processing} jobs processando</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2"><Zap className="w-5 h-5"/> Tempos de Resposta</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">Geração de IA</span>
              <span className="font-bold">{data.performance.avg_ia_time}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">Renderização FFmpeg</span>
              <span className="font-bold">{data.performance.avg_render_time}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">Upload para Storage</span>
              <span className="font-bold">{data.performance.avg_upload_time}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4"/> Filas (Pending)
              </span>
              <Badge variant="warning">{data.infrastructure.queues_pending} itens</Badge>
            </div>
          </div>
        </Card>

        {/* Incidentes */}
        <Card className="p-6">
           <h3 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Histórico de Incidentes</h3>
           <div className="space-y-3">
             {data.incidents.map((incident: any) => (
               <div key={incident.id} className={`p-3 rounded-lg border flex justify-between items-center ${incident.type === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                 <div className="flex items-center gap-3">
                   <AlertTriangle className={`w-4 h-4 ${incident.type === 'critical' ? 'text-red-500' : 'text-yellow-600'}`} />
                   <span className="text-sm font-medium">{incident.message}</span>
                 </div>
                 <span className="text-xs text-muted-foreground">{incident.time}</span>
               </div>
             ))}
             {data.incidents.length === 0 && (
               <div className="text-center text-muted-foreground text-sm py-4">Nenhum incidente recente.</div>
             )}
           </div>
        </Card>
      </div>
    </div>
  );
}
