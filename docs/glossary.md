# Glossário (Dicionário de Domínio)

## Metadados
- **Status:** Stable
- **Versão:** 1.0.0
- **Última Atualização:** 01/07/2026
- **Objetivo:** Estabelecer a linguagem ubíqua (Ubiquitous Language) do projeto Achadinhos em Minutos, garantindo que a comunicação técnica e de negócios utilize os mesmos jargões.
- **Escopo:** Engenheiros, IAs, Product Managers e Atendimento.

## Termos e Definições

| Termo | Definição | Módulo | Contexto / Referências |
|---|---|---|---|
| **Creative** | A peça final de marketing gerada (vídeo, texto, imagem) pronta para ser postada. | `Creative Studio` | O output central do sistema. Ligado ao [ADR-008](./adr/ADR-008-creative-studio-architecture.md). |
| **Creative DNA** | A estrutura de dados (JSON) que define todas as cenas, áudios e textos antes de virar vídeo. | `Marketing Brain` | O payload intermediário. O "Roteiro" puro. |
| **Marketing Brain** | O serviço de Inteligência Artificial que toma as decisões criativas, formatando prompts e orquestrando LLMs. | `Core API / AI` | [Padrões de IA](./standards/ai-standards.md) |
| **Creative Intelligence** | Termo guarda-chuva para todo o ecossistema de geração autônoma de conteúdo do app. | `Core API / AI` | [SYSTEM.md](./SYSTEM.md) |
| **Planner** | O agente que recebe o link bruto e estrutura qual será o ângulo (estratégia) de vendas do criativo. | `Marketing Brain` | Pipeline inicial da IA. |
| **Hook Engine** | Sub-agente focado estritamente em gerar ganchos (3 primeiros segundos) altamentes persuasivos e clickbaits éticos. | `Marketing Brain` | Essencial para o CTR. |
| **CTA Engine** | Sub-agente encarregado do Call-to-Action, guiando o clique para o link de afiliado. | `Marketing Brain` | Pipeline final do texto. |
| **Template Engine** | O módulo que injeta as definições estéticas (cores, fontes, posições) no Storyboard. | `Renderer` | Executado antes do FFmpeg. |
| **Motion Engine** | O módulo/worker que converte o Storyboard JSON em um arquivo MP4 com transições. | `Renderer (BullMQ)` | Intensivo de CPU. [ADR-003](./adr/ADR-003-bullmq.md). |
| **Quality Analyzer** | Agente IA de revisão. Valida se o texto bate com a imagem e não há alucinações. | `Marketing Brain` | Previne falhas antes de renderizar. |
| **Learning Engine** | *(Planned)* Loop futuro que lerá as métricas de conversão para aprimorar os próximos Hooks. | `AI` | Evolução RAG do Brain. |
| **Storyboard** | A mesma coisa que o *Creative DNA*, mas na visão de linha do tempo do Frontend (Editor visual). | `Frontend` | Onde o usuário edita as cenas. |
| **Feature Flag** | Chave booleana remota usada para habilitar ou esconder features em produção sem precisar de re-deploy. | `Core API / Web` | [ADR-006](./adr/ADR-006-feature-flags.md) |
| **Event Bus** | O barramento de memória (CQRS-lite) que comunica eventos internos no backend. | `Core API` | [ADR-002](./adr/ADR-002-event-driven-architecture.md) |
| **Audit Log** | Registro imutável de ações importantes (Ex: "Campanha disparada", "Vídeo apagado"). | `Telemetry` | Visualizável pelo Usuário. |
| **Telemetry** | Dados crus de infra (Ex: Tempo do banco, Queda de requisição). Exclusivo para Engenharia. | `Telemetry` | [ADR-007](./adr/ADR-007-telemetry.md) |
| **Product Usage** | Dados agregados das ações diárias que compõem a retenção do software. | `Analytics` | O usuário usou a IA hoje? |
| **Product Health Score** | Índice interno global medindo lentidão e taxa de falha dos componentes do sistema (APIs e Filas). | `SRE` | Monitoramento no Datadog/Grafana. |
| **Customer Health Score** | Índice de sucesso do cliente. Mede se ele está prestes a cancelar a assinatura (Churn). | `Billing` | Uso da plataforma em queda. |
| **TTFS** | *Time to First Success*. O tempo em segundos/minutos desde o cadastro até o usuário gerar o 1º Criativo. | `Product` | Principal métrica do Onboarding. |
| **NPS** | *Net Promoter Score*. Pesquisa de satisfação "De 0 a 10...". | `Product` | - |
| **Provider** | Abstração em código para serviços de terceiros (Ex: OpenAI, Stripe). | `Core API` | [ADR-009](./adr/ADR-009-ai-providers.md) |
| **Repository** | A única camada permitida a fazer SELECT/INSERT direto no banco de dados. | `Core API` | [ADR-001](./adr/ADR-001-repository-pattern.md) |
| **Worker** | Script que roda de fundo, fora da Thread da API, executando jobs pesados. | `Background Jobs` | [Playbook de Worker](./playbooks/new-worker.md) |
| **BullMQ** | O gerenciador open-source de filas escolhido para gerir os Workers. | `Infrastructure` | [ADR-003](./adr/ADR-003-bullmq.md) |
| **Redis** | Banco de dados em RAM, usado para orquestrar as filas do BullMQ e Caching rápido. | `Infrastructure` | [ADR-004](./adr/ADR-004-redis.md) |
| **Supabase** | A infraestrutura BaaS que hospeda nosso PostgreSQL, Autenticação e Storage. | `Infrastructure` | [ADR-005](./adr/ADR-005-supabase.md) |
| **RLS** | *Row Level Security*. Regras cravadas no PostgreSQL que bloqueiam usuários de verem dados dos outros. | `Database` | Segurança suprema contra vazamentos. |
| **Fallback** | Comportamento de emergência. (Ex: IA 1 caiu, chama IA 2. Imagem original do produto deu erro, usa foto genérica). | `Resilience` | [Padrões Backend](./standards/backend-standards.md) |
| **Campaign** | O agrupamento e agendamento em massa de criativos para disparo em Telegram/WhatsApp. | `Campaigns` | Distribuição do output. |
| **Marketplace** | As lojas fonte (Shopee, Aliexpress, Amazon) de onde raspamos links de afiliados. | `Scraper` | A fonte do tráfego. |
| **Affiliate Link** | A URL personalizada do usuário que garante a comissão dele. Injetada pelo CTA Engine. | `Core API` | Core do modelo de negócio. |
| **Billing Readiness** | Status atestando se a feature está 100% amarrada aos limites do plano pago antes do lançamento. | `Billing` | Não lançar algo "grátis por acidente". |
| **Early Access** | Fase beta de uma feature onde usuários convidados testam antecipadamente via Feature Flags restritas. | `Product` | - |
| **Invite Code** | Código de acesso manual ao registro da plataforma durante estágios iniciais de Beta fechado. | `Auth` | Controle de Growth. |

---

## Integração
Este Glossário reflete o estado consolidado da Plataforma delineado no [**SYSTEM.md**](../SYSTEM.md) e [**ENGINEERING.md**](../ENGINEERING.md). Utilize-o ativamente ao nomear variáveis, serviços e documentações, aderindo também aos [**Naming Standards**](./standards/naming-standards.md).
