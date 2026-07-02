# Achadinhos em Minutos — System Foundation (Single Source of Truth)

> [!IMPORTANT]
> **Leitura Obrigatória:** Este é o documento principal da plataforma. Qualquer desenvolvedor ou agente de inteligência artificial deve ler e compreender as definições deste arquivo antes de sugerir ou implementar qualquer mudança na base de código.

## 1. Visão Geral e Objetivo da Plataforma

**Achadinhos em Minutos** é uma plataforma SaaS avançada desenvolvida para afiliados, curadores de ofertas e profissionais de marketing digital. O objetivo principal do sistema é automatizar, com extrema eficiência e qualidade, o processo de curadoria, geração criativa (Creative Studio AI) e distribuição de conteúdo viral para redes sociais e mensagerias (Telegram/WhatsApp) utilizando engenharia de prompts avançada e inteligência artificial generativa.

A plataforma transforma um simples link de produto (Shopee, Mercado Livre, etc.) em uma peça de marketing completa: vídeos dinâmicos, banners persuasivos e copys de alta conversão, prontos para faturar.

## 2. Arquitetura Geral

O sistema é construído como uma aplicação **Event-Driven (Orientada a Eventos)** altamente escalável, utilizando o padrão Backend-For-Frontend (BFF) com separação estrita de responsabilidades:

1. **Frontend (SPA):** Painel do usuário e ferramentas de edição em tempo real.
2. **Core API:** Camada central que recebe requisições, orquestra domínios e delega processamento pesado.
3. **Fila e Workers (BullMQ):** Processamento assíncrono para renderização de mídia e disparo de mensagens.
4. **Data Layer (Supabase/PostgreSQL):** Persistência robusta com RLS (Row Level Security).
5. **Event Bus:** Barramento interno (`events.ts`) para auditoria, telemetria e desacoplamento de ações de domínio (CQRS-lite).

## 3. Stack Tecnológica

| Camada | Tecnologias Principais |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI (Customizado) |
| **Backend API** | Node.js, Fastify, TypeScript, Zod (Validação) |
| **Banco de Dados** | PostgreSQL (Hospedado no Supabase) com Prisma/Raw Queries |
| **Autenticação** | Supabase Auth (JWT) |
| **Filas e Cache** | Redis (BullMQ para Jobs e processamento em background) |
| **Storage** | Supabase Storage (Buckets para Vídeos, Imagens, e Renderizações) |

## 4. Estrutura do Monorepo

O projeto está organizado como um monorepo tradicional, utilizando `pnpm workspaces`:

- `apps/web/`: Aplicação Frontend (Painel de Controle).
- `apps/api/`: Aplicação Backend (Core API + Workers).
- `packages/`: Bibliotecas e tipos compartilhados.
- `docs/`: Central de conhecimento, arquitetura e documentação (este diretório).

> [!NOTE]
> Consulte [Project Structure](./architecture/project-structure.md) para detalhes minuciosos de cada diretório.

## 5. Módulos Principais

### Creative Studio AI (e Creative OS)
O coração da plataforma. Responsável pela transformação de URLs de produtos em mídia viral. A arquitetura atual (V2) engloba o _Marketing Brain_ (planejamento), _Template Engine_, e o fluxo de _Fallback_ de extração. O foco é a geração em múltiplas etapas (Brain -> Planner -> Analyzer -> Renderer).
**Nota sobre a Transição:** Estamos em transição para a V3, o **Creative OS** (atualmente protegido pela feature flag `creative_os`). O Creative OS adota um pipeline desacoplado e multi-motores (ex: Layout Engine, Color Engine, Hook Engine) avaliados por um sistema de *Dual Score*. 
**Status atual (Bloco 2)**: Os motores analíticos iniciais foram criados sob o regime `Implemented with Mock Intelligence` (stub funcional). A integração pesada com LLMs ocorrerá no bloco seguinte. Se a flag estiver inativa ou ocorrerem erros, o pipeline V2 atual permanece operando nativamente como fallback.

### Campaigns & Scheduled Posts
Módulo de distribuição de conteúdo. Permite que os usuários agendem e disparem em massa os criativos gerados diretamente para canais e grupos de Telegram, gerenciando limites de uso e log de entrega.

### Telemetria e Auditoria (Audit Logs)
Todo evento no sistema emite um registro. Há uma separação entre **Audit Logs** (ações críticas realizadas pelo usuário na plataforma) e **System Logs / Telemetria** (métricas internas de performance da IA, saúde do Supabase/Redis e monitoramento de falhas).

### Billing & Feature Flags
Gerenciamento do modelo SaaS. Limita acesso a recursos premium (como Renderização de Vídeo ou IA Avançada) através do serviço de Feature Flags.

## 6. Sumário de Documentação

Abaixo encontra-se a arquitetura de documentação. **Estes links guiam para o mergulho profundo em cada domínio específico do sistema:**

### Engenharia e Qualidade
- 🧭 [**Portal de Documentação (README)**](./README.md) — O índice mestre da plataforma.
- ⚙️ [**Ciclo de Engenharia**](./ENGINEERING.md) — Como funcionalidades são propostas, planejadas e codificadas.
- 🤖 [**Regras para Agentes IA**](./AI_RULEBOOK.md) — Leis imutáveis de qualidade para inteligências atuando no projeto.

### Produto e Métricas
- 📖 [**Glossário (Glossário de Domínio)**](./glossary.md) — Dicionário da linguagem ubíqua do projeto (Creative Studio, TTFS, Hook Engine).
- 📊 [**Métricas de Engenharia**](./engineering-metrics.md) — Nossos KPIs cruciais de Engenharia (DORA), Operação (SRE) e Produto (Growth).

### Histórico de Decisões (ADRs)
As raízes estruturais da plataforma e os porquês de cada tecnologia (Supabase, BullMQ, React, EventBus). Estão concentradas na pasta [**`docs/adr/`**](./adr/):
- **Fundação:** Padrão de Repositório (001), Event-Driven (002) e Feature Flags (006).
- **Dados & Mídia:** Supabase (005), Redis (004) e BullMQ (003).
- **Core & Inteligência:** Creative Studio (008), Providers IA (009), Telemetria (007) e Shadcn UI (010).

### Arquitetura de Software
- 🗺️ [**Visão Geral (Overview)**](./architecture/overview.md) — Diagramas e fluxo completo de vida da informação.
- 🏗️ [**Estrutura do Projeto**](./architecture/project-structure.md) — Onde o código vive e por quê.
- 📐 [**Padrões de Código (Coding Standards)**](./architecture/coding-standards.md) — As leis imutáveis de desenvolvimento da plataforma.
- 🏷️ [**Convenções de Nomenclatura**](./architecture/naming-conventions.md) — Padronização de classes, arquivos e camadas.

### Componentes de Infraestrutura e Dados
- 🗄️ [**Banco de Dados (Supabase/PostgreSQL)**](./architecture/database.md) — Modelo ER, Segurança RLS e Tabelas.
- 🔌 [**Core API**](./architecture/api.md) — Mapeamento e fluxo das rotas, validações de entrada e middlewares.
- ⚙️ [**Fila de Processamento (Workers)**](./architecture/workers.md) — BullMQ, backoffs, retries e o ecossistema de jobs assíncronos.
- 📡 [**Event-Driven Architecture**](./architecture/event-driven.md) — O Event Bus interno, acoplamento de logs e domínios.

### Motores Específicos
- 🧠 [**Arquitetura de Inteligência Artificial**](./architecture/ai.md) — Creative Intelligence, Marketing Brain, Planner e Pipelines Generativos.

## 7. Próximas Evoluções (Roadmap Resumido)
A documentação e arquitetura são organismos vivos. O objetivo de curto/médio prazo inclui:
- Adoção de integrações com WhatsApp Business API nativa.
- Separação definitiva da camada de infraestrutura de mídia pesada (Render Farm Serverless).
- Implementação de Feedback Loop de aprendizagem contínua para o Marketing Brain baseado no Analytics dos posts nas redes sociais.
