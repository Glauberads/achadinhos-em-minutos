# Achadinhos em Minutos: Engineering Hub

- **Status:** Stable
- **Version:** 1.0.0
- **Última Atualização:** 01/07/2026

Bem-vindo ao **Engineering Hub**. Este é o portal de entrada para toda a documentação estruturada do projeto "Achadinhos em Minutos". A documentação aqui presente constitui a **Fonte Oficial da Verdade** da plataforma.

Seja você um novo desenvolvedor (Onboarding) ou uma Inteligência Artificial operando o código, todos devem respeitar o fluxo e os preceitos definidos nestas pastas.

---

## 🏗️ 1. Fundamentos e Arquitetura

Os pilares da fundação da plataforma.

- 🧭 [**SYSTEM.md**](./SYSTEM.md): Visão Macro, objetivo de negócios e índice resumido do core.
- ⚙️ [**Ciclo de Engenharia (ENGINEERING.md)**](./ENGINEERING.md): Como transitamos ideias para código testado.
- 🤖 [**Regras para IA (AI_RULEBOOK.md)**](./AI_RULEBOOK.md): Leis imutáveis de desenvolvimento guiado por IA.
- 📂 [**Arquitetura (Architecture)**](./architecture/): Mergulho profundo em cada camada técnica (Overview, BD, APIs, Workers, EventBus, AI).

## 📄 2. Especificações (Specs)

A documentação precede o código. Novas features são pensadas aqui.

- 🧩 [**Templates de Especificação**](./specs/templates/): *(Planned)* Modelos obrigatórios (Feature, Backend, UI) para criar escopos blindados.
- 📁 **Especificações Ativas**: Onde viverão os projetos em andamento. *(Future Work)*

## 📚 3. Playbooks (Como Fazer)

Guias pragmáticos passo-a-passo. Não perca tempo reinventando a roda.

- 📖 [**Playbooks Oficiais**](./playbooks/): *(Planned)* Roteiros de criação de Controllers, Services, Workers, e Migrations do zero.

## ⚖️ 4. ADRs (Decisões de Arquitetura)

Por que fizemos as coisas do jeito que fizemos? O histórico de decisões sistêmicas.

- 🗄️ [**ADR-001: Padrão de Repositório**](./adr/ADR-001-repository-pattern.md)
- 📡 [**ADR-002: Event Driven Architecture**](./adr/ADR-002-event-driven-architecture.md)
- ⚙️ [**ADR-003: Processamento com BullMQ**](./adr/ADR-003-bullmq.md)
- ⚡ [**ADR-004: Redis como Cache Primário**](./adr/ADR-004-redis.md)
- ☁️ [**ADR-005: Supabase como BaaS**](./adr/ADR-005-supabase.md)
- 🚦 [**ADR-006: Feature Flags**](./adr/ADR-006-feature-flags.md)
- 📊 [**ADR-007: Separação de Telemetria**](./adr/ADR-007-telemetry.md)
- 🧠 [**ADR-008: Arquitetura do Creative Studio**](./adr/ADR-008-creative-studio-architecture.md)
- 🤖 [**ADR-009: Providers de IA**](./adr/ADR-009-ai-providers.md)
- 🎨 [**ADR-010: Design System Shadcn**](./adr/ADR-010-design-system.md)
- 🔀 [**ADR-011: Creative Operating System**](./adr/ADR-011-creative-operating-system.md)

## 📏 5. Padrões de Qualidade (Standards e Checklists)

O Framework oficial de Engenharia. Nenhuma feature é aceita sem passar por este crivo.

- 📝 [**Standards Oficiais**](./standards/): Normas para desenvolvimento (API, DB, UI, Security).
- ✅ [**Quality Checklists**](./quality/): Definition of Done (DoD), Definition of Ready e Testes.

## 📈 6. Dicionário e Métricas

Conhecimento de negócio e acompanhamento.

- 📖 [**Glossário (Glossary)**](./glossary.md): Dicionário do jargão da plataforma (TTFS, Planner, Marketing Brain).
- 📊 [**Métricas de Engenharia**](./engineering-metrics.md): Nossos KPIs e SLAs, garantindo a saúde da plataforma.

---

> [!CAUTION]
> Ao longo da Sprint 1, muitos dos caminhos listados acima (*Planned*) serão fisicamente criados. Não crie documentações fora deste índice. O `README.md` é o grande orquestrador.
