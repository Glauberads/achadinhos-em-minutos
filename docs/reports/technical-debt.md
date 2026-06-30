# Auditoria de Dívida Técnica (Technical Debt)

## Visão Geral
Como parte da Sprint de Enterprise Excellence, realizamos uma auditoria em todo o código-fonte (Frontend e Backend) para mapear débitos técnicos que afetam a manutenibilidade, a performance e a escalabilidade.

## Matriz de Dívida Técnica

| Prioridade | Arquivo / Módulo | Categoria | Descrição | Impacto | Complexidade | Esforço (h) |
|------------|------------------|-----------|-----------|---------|--------------|-------------|
| 🔴 Crítica | `Dashboard.tsx` vs `Reports.tsx` | Código Duplicado | Ambos os painéis implementam lógicas de fetch de telemetria cruas sem usar abstrações de SWR ou hooks. | Alto (Manutenção) | Baixa | 2h |
| 🔴 Crítica | `creative-planner.service.ts` | Serviços Acoplados | A lógica do Gemini AI está chumbada no código. Falta uma interface abstrata de LLM Provider (AIProvider). | Alto (Resiliência) | Média | 4h |
| 🟠 Alta | `apps/web/package.json` | Dependências | Pacotes sem uso remanescentes da Fase 1 (ex. pacotes de animação e libs antigas de chart). | Baixo (Tamanho do Bundle) | Baixa | 1h |
| 🟠 Alta | `server.ts` (Hooks) | Performance | A telemetria não injeta um `correlation_id` único, o que impede rastrear o funil de eventos em caso de erro na Renderização. | Alto (Debugging) | Média | 3h |
| 🟡 Média | Várias rotas React | UX / Estado Vazio | Presença de estados de carregamento não consistentes (ainda há resquícios de carregamentos antigos em vez do `Skeleton` UI). | Médio (UX) | Baixa | 2h |
| 🟢 Baixa | `index.css` global | CSS Morto | Classes utilitárias puras não sendo usadas ou substituídas totalmente pelo novo core do Design System. | Baixo | Baixa | 1h |

## Plano de Resolução
Todas as dívidas Críticas e Altas serão tratadas imediatamente nesta Sprint (Enterprise Excellence), garantindo um código preparado para suportar tráfego em massa e refatorações complexas no futuro sem risco de quebra silenciosa.
