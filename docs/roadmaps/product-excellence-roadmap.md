# Product Excellence Roadmap

## Missão:
Transformar a percepção do usuário de "Sistema útil" para "Software World-Class Premium".

---

## Sprint 1: Fundação Tátil e Visual (Design & Motion)
- **Objetivo:** Refino absoluto da casca. O usuário tem que notar a diferença nos primeiros 3 segundos.
- **Tarefas:**
  - Refatorar `index.css` com tipografia premium e paletas sutis (Sombreados Vercel-like).
  - Adicionar transições em TODOS os botões, links e *Hover states* (`transition-all duration-200 ease-in-out`).
  - Refatorar Modais/Dialogs/Tabs para utilizar animações suaves (Framer Motion / Tailwind Animate).
- **Impacto:** Altíssimo visualmente. **Complexidade:** Baixa.

## Sprint 2: Fricção Zero (UX & CRO)
- **Objetivo:** Reduzir o TTFS (Time to First Success) de 5 minutos para 45 segundos.
- **Tarefas:**
  - Implementar Onboarding guiado para a primeira conta (Wizard 3 steps focado em fazer o 1º vídeo).
  - Limpar a `CreativeStudio.tsx` (Remover poluição visual e auto-preencher dados raspados).
  - Reformular Skeletons / Empty States de toda a plataforma (Guiding actions, not dead ends).
- **Impacto:** Altíssimo na Retenção (D1). **Complexidade:** Média.

## Sprint 3: Performance e Escalabilidade Base
- **Objetivo:** Tudo tem que parecer instantâneo ao clicar.
- **Tarefas:**
  - Eliminar `N+1` Queries nos relatórios substituindo por `Supabase RPCs`.
  - Normalizar chaves do Redis (Aumento de Cache Hit).
  - Code Splitting no React (Lazy Loaded Routes para diminuir bundle).
- **Impacto:** Médio perceptível, Alto infra. **Complexidade:** Alta.

## Sprint 4: Inteligência Confiável (AI & Product)
- **Objetivo:** Garantir que 99% das gerações de criativos sejam impecáveis na escrita.
- **Tarefas:**
  - Refatorar os Prompts injetando *Few-Shot Learning* com roteiros vencedores reais.
  - Tela de *Live Status* da Fila de processamento (Gerando confiança visual ao invés de apenas um spinner e um Toast).
  - Injetar micro-cópia amigável em toda a plataforma.
- **Impacto:** Extremo na Conversão Final. **Complexidade:** Alta.
