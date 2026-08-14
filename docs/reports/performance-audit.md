# Auditoria de Performance: Production Readiness

Este relatório apresenta os resultados da auditoria de performance da infraestrutura Fullstack do **Achadinhos em Minutos**, aferindo Frontend, Backend e Banco de Dados para uso real em produção.

## Resumo Executivo
A performance global do sistema atinge bons níveis graças ao ecossistema Node/Fastify e proxying do Cloudflare. Porém, a aplicação SPA do Frontend requer refatorações de Code Splitting para evitar lentidão extrema de carregamento. No backend, processos rodando em *loop* dentro dos Workers causam gargalos de N+1 queries, que prejudicarão a escalabilidade horizontal a longo prazo.

---

## 1. Frontend: Monolith Bundle e Ausência de Lazy Loading
- **Status:** 🟠 Alto
- **Prioridade:** P1
- **Evidências encontradas:** 
  O roteador React no `apps/web/src/App.tsx` importa estaticamente +15 páginas complexas, como `CreativeStudio`, `Gateways` e `Campaigns`. Durante o build do Vite, a aplicação inteira é compilada em um único arquivo de índice JavaScript (Métrica aferida: Múltiplos Megabytes).
- **Impacto:** Tempo de carregamento inicial (First Contentful Paint) muito alto e TTI (Time to Interactive) prejudicado. Todo usuário que abrir a Landing Page baixará o painel administrativo internamente sem necessidade.
- **Como reproduzir:** Inspecionar o tamanho da resposta HTTP do `index-[hash].js` retornado pelo Cloudflare Pages.
- **Correção recomendada:** Implementar o padrão `const Dashboard = React.lazy(() => import('./pages/Dashboard'))` e empacotar cada rota sob um `<Suspense fallback={<Loader/>}>`, gerando Code Splitting nativo e modular no Vite.

---

## 2. Backend: Gargalo N+1 no Worker de Campanhas
- **Status:** 🟡 Médio
- **Prioridade:** P2
- **Evidências encontradas:** 
  O arquivo `apps/api/src/workers/campaign-runner.ts` (linha 68) implementa um `for (const p of rawProducts)` que executa `productRepository.upsert` e `scheduledPostRepository.create` de forma sequencial com interrupção `await` para cada item extraído da Shopee/Mercado Livre.
- **Impacto:** Se o robô minerar 1000 ofertas de uma vez, realizará 2000 RTT (Round Trips) consecutivos para o Supabase, gerando exaustão na Pool de Conexões e atrasando o encerramento do Worker por vários minutos.
- **Como reproduzir:** Rodar uma campanha pesada que traga muitos itens. Observar o terminal subindo insert a insert em vez de um salto atômico.
- **Correção recomendada:** Refatorar o repositório para `upsertMany` e `createMany` agrupando os objetos em Arrays e disparando apenas 2 chamadas de rede no final do loop.

---

## 3. Workers: Concorrência Destrutiva (OOM Risk no FFmpeg)
- **Status:** 🟠 Alto
- **Prioridade:** P1
- **Evidências encontradas:** 
  O arquivo base de criação do Worker no BullMQ permite a configuração de concorrência simultânea. A renderização de vídeos usando o nativo Linux do FFmpeg aloca picos gigantes de CPU e RAM no Railway (1 a 2GB por renderização dependendo da engine).
- **Impacto:** Caso ocorra enfileiramento múltiplo e a concorrência for acidentalmente deixada em `> 1` nas instâncias mais simples do Railway (512MB RAM), os renders irão colapsar resultando no travamento total da réplica de processamento (Out of Memory Error).
- **Como reproduzir:** Enviar requisições de renderização de 5 vídeos de 30s na mesma janela de tempo com a concorrência não-controlada.
- **Correção recomendada:** Explicitamente amarrar a concorrência do RenderWorker em `concurrency: 1` para garantir serialização. Se precisar acelerar vídeos na empresa, cria-se Novas Réplicas e não mais concorrência interna.

---

## 4. Banco de Dados: Overhead de Telemetria e Eventos
- **Status:** 🟢 Baixo
- **Prioridade:** P3
- **Evidências encontradas:** 
  A tabela `audit_logs` e os disparos do `eventBus` injetam logs de alta cardinalidade de forma transacional no banco PostgreSQL central (`Supabase`).
- **Impacto:** Acumular telemetria no banco transacional fragmenta o disco, impacta os índices e esgota as cotas mensais de armazenagem dos planos básicos/pro do Supabase precocemente.
- **Como reproduzir:** Rodar o sistema sob alta carga simulada (Load Testing) por 24h e verificar o crescimento acelerado da database.
- **Correção recomendada:** Adicionar particionamento, rotinas de Rotação de Logs mensais (excluir ou descarregar os logs com > 90 dias) para arquivamento no frio (`Cold Storage / Buckets`).

---

## Conclusão da Auditoria de Performance

**Nota de Performance: 75/100**

**Riscos Restantes:**
Do ponto de vista sistêmico as infraestruturas descentralizadas isolam muito bem o impacto (A API Fastify nunca cairá por conta de CPU do FFMPEG). Contudo, a experiência principal de UX para First-Time Users será lenta caso a renderização da aplicação React não seja compartimentada pelo bundler Vite (Lazy load).

**Critérios para aprovação:**
Implementar e testar em build o empacotamento preguiçoso (`React.lazy`) do frontend (Block 6/Produção ajudará nisto). Transformar as iterações pesadas do `campaign-worker` em chamadas Bulk/Batch no PostgreSQL.