import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Activity } from 'lucide-react'

// Mocks baseados no ADR-012/013
const mockData = {
  hooks: [
    { name: 'Curiosity', usage: 45, conversion_rate: '8.2%' },
    { name: 'Problem-Focused', usage: 30, conversion_rate: '6.5%' },
    { name: 'Authority', usage: 15, conversion_rate: '11.0%' },
    { name: 'Contrarian', usage: 10, conversion_rate: '4.1%' },
  ],
  ctas: [
    { name: 'Ação Direta (Link)', usage: 60, conversion_rate: '9.4%' },
    { name: 'Urgência (Últimas un.)', usage: 25, conversion_rate: '12.3%' },
    { name: 'Curiosidade', usage: 15, conversion_rate: '5.1%' }
  ],
  engines: [
    { name: 'Quality Reviewer', status: 'operational', score_avg: 88, regenerations: 142 },
    { name: 'Prompt Builder', status: 'operational', calls: 1042, fallback_rate: '1.2%' },
    { name: 'Learning Engine', status: 'collecting', feedback_points: 3450 }
  ]
}

export function CreativeIntelligence() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simula fetch das métricas do Learning Engine
    const t = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-full">Carregando Creative Brain...</div>
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          Creative Intelligence V2
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do Diretor Criativo Autônomo e performance do Learning Engine.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Score Médio (Quality)</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">88.4</div>
            <p className="text-xs text-green-400">+2.1 desde V1</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Regenerações (Score &lt; 85)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">142</div>
            <p className="text-xs text-zinc-500">Custo LLM sob controle</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Sinais de Aprendizado</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">3,450</div>
            <p className="text-xs text-zinc-500">Feedbacks processados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">DNA Gerados</CardTitle>
            <Zap className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1,042</div>
            <p className="text-xs text-zinc-500">Via Prompt Builder</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Hooks Performance */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance de Hooks
            </CardTitle>
            <CardDescription>Uso e taxa de conversão (Mockado - Aguardando Telemetria Real)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.hooks.map(hook => (
                <div key={hook.name} className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{hook.name}</span>
                    <span className="text-xs text-zinc-500">{hook.usage}% de uso</span>
                  </div>
                  <div className="text-sm font-bold text-green-400">{hook.conversion_rate} CVR</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Performance */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Performance de CTAs</CardTitle>
            <CardDescription>Conversões baseadas na Call To Action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.ctas.map(cta => (
                <div key={cta.name} className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{cta.name}</span>
                    <span className="text-xs text-zinc-500">{cta.usage}% de uso</span>
                  </div>
                  <div className="text-sm font-bold text-green-400">{cta.conversion_rate} CVR</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motores Status */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Saúde dos Motores (V2)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {mockData.engines.map(engine => (
              <div key={engine.name} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-zinc-200">{engine.name}</span>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <div className="text-xs text-zinc-400">
                  Status: <span className="uppercase text-primary">{engine.status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
