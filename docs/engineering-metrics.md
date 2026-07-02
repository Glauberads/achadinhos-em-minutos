# Engineering & Product Metrics

## Metadados
- **Status:** Stable
- **Versão:** 1.0.0
- **Última Atualização:** 01/07/2026
- **Objetivo:** Definir os indicadores fundamentais de performance (KPIs) para a operação sustentável da plataforma.
- **Escopo:** Engenharia (DevOps/DORA), Operação (SRE) e Produto (Growth).

---

## 1. Métricas de Engenharia
Foco na eficiência, velocidade e qualidade do processo de desenvolvimento da equipe (Baseado no fluxo definido em [ENGINEERING.md](../ENGINEERING.md)).

| Métrica | Definição | Meta / SLA |
|---|---|---|
| **Build Time** | Tempo total para o Webpack/Vite ou TS compiler terminar o build local/CI. | `< 2 minutos` |
| **Deploy Time** | Tempo da Vercel/Github Actions do push na `main` até a URL online. | `< 5 minutos` |
| **TypeScript Errors** | Quantidade de inferências do tipo `any` ou erros estritos do TSC na branch `main`. | `Zero Absoluto` |
| **Lint Errors** | Violações de formatação do ESLint (Warning/Error) que passaram no commit. | `Zero Absoluto` |
| **Test Success Rate** | Porcentagem da suíte de testes (Jest) aprovada (Must pass 100%). | `100% (Green Build)` |
| **Rollback Rate** | Percentual de deploys que precisaram ser revertidos emergencialmente. | `< 2% dos Deploys` |
| **Lead Time** | Tempo decorrido desde o card entrar em `In Progress` até o merge em `Produção`. | `< 4 dias (Features Médias)` |
| **Change Failure Rate** | Percentual de Pull Requests que introduziram Bugs graves em Produção. | `< 5%` |
| **MTTR (Mean Time to Recovery)** | Tempo médio para restaurar o sistema após uma queda crítica total. | `< 30 minutos` |
| **Deployment Frequency** | Quantidade de deploys na main por dia/semana (Trunk Based Development). | `> 2 Deploys diários` |

---

## 2. Métricas de Operação
Foco na estabilidade e resiliência da infraestrutura rodando em tempo real (Supabase, BullMQ, Redis, LLMs).

| Métrica | Definição | Meta / SLA |
|---|---|---|
| **Product Health Score** | Índice agregado (0 a 100) derivado da telemetria de componentes vitais. | `> 98.0` |
| **API Latency** | Tempo de resposta para o P95 das rotas HTTP do Fastify. | `< 200 ms` |
| **Redis Availability** | Disponibilidade e ausência de *Connection Timeouts* no In-Memory DB. | `99.99% (Four Nines)` |
| **Supabase Availability** | Uptime da infraestrutura de Banco e Auth relacional (PostgreSQL). | `99.9% (Three Nines)` |
| **Worker Success Rate** | Percentual de Jobs no BullMQ (Ex: Renderizar) concluídos sem ir para a fila de *Failed*. | `> 95%` |
| **Queue Time** | Tempo que um Job fica "Waiting" na fila do Redis antes de ser processado pelo Worker. | `< 10 segundos` |
| **Processing Time** | Tempo bruto gasto da CPU para rodar e completar um Job. | `Job-dependent` |
| **Cache Hit Rate** | Quantas vezes o sistema puxou links do Redis vs Bateu no Scraper demorado. | `> 60%` |
| **AI Response Time** | Latência na geração do *Marketing Brain* batendo na OpenAI/Claude. | `< 12 segundos` |
| **FFmpeg Render Time** | Tempo gasto de CPU para muxar um vídeo de 15s. | `< 20 segundos` |
| **Storage Upload Time** | Tempo médio de I/O subindo arquivos pro Supabase Buckets. | `< 3 segundos (para 5MB)` |

---

## 3. Métricas de Produto
Foco no engajamento, retenção e satisfação do usuário ao utilizar o SaaS.

| Métrica | Definição | Meta / SLA |
|---|---|---|
| **TTFS (Time to First Success)** | Tempo do *Sign up* até a criação do 1º Criativo via Inteligência Artificial. | `< 2 Minutos` |
| **Onboarding Completion Rate** | Porcentagem de novos cadastros que completaram o fluxo de Setup Inicial. | `> 70%` |
| **First Creative Generated** | Usuários que completaram com êxito o fluxo do "Creative Studio" pela 1º vez. | `> 80% (dos Ativos)` |
| **First Video Rendered** | Usuários que conseguiram extrair o MP4 finalizado (Teste de conversão real). | `> 60% (dos Ativos)` |
| **Feedback Score** | Nota das estrelinhas de review do vídeo no *Quality Analyzer* (1 a 5). | `Média > 4.2` |
| **NPS (Net Promoter Score)** | Qual a probabilidade de recomendar a ferramenta a outro curador. | `> +40` |
| **Retention D1** | Percentual de pessoas que voltaram ao software no Dia seguinte ao cadastro. | `> 40%` |
| **Retention D7** | Percentual de pessoas que voltaram ao software na primeira Semana. | `> 25%` |
| **Retention D30** | Percentual de pessoas que se mantiveram ativas após o Mês inicial. | `> 15%` |
| **Creative Conversion Score** | Estimativa (Baseada em cliques de redes sociais se conectado) de sucesso do post. | `Acompanhamento Longo Prazo` |
| **Feature Adoption Rate** | Quantos usuários clicaram e utilizaram uma nova Feature Flag liberada (7 dias). | `> 20% da Base Ativa` |

---

## Integração

Essas métricas são guias absolutos. O [**AI_RULEBOOK.md**](../AI_RULEBOOK.md) estipula que a arquitetura gerada por Inteligência Artificial no repositório nunca pode comprometer os KPIs de "Engenharia" descritos aqui. Já os padrões de [**Telemetry Standards**](./standards/telemetry-standards.md) ensinam como capturar as métricas de "Operação" através do sistema Event Driven.
