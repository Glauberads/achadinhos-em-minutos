# Design System V3 (UI Core)

## Visão Geral
Como parte da Product Polish V3, o uso de marcação HTML solta com milhares de classes Tailwind foi substituído por uma arquitetura escalável e tipada (`components/ui/core.tsx`). 

Isso garante a consistência absoluta do produto Enterprise: cada tela exibe sempre o mesmo botão, o mesmo padrão de carregamento, e os mesmos tons de cores, independente de quem programe.

## Componentes Abstraídos e Implementados

### 1. Base Components
- **Button:** Variante primária, secundária, fantasma e destrutiva. Suporte nativo a `isLoading` (Substitui botão genérico com `RefreshCcw`).
- **Input:** Input unificado com foco em anéis (`ring-offset`) padronizados.
- **Card:** Wrapper universal que propaga fundo dinâmico (`bg-card`) e sombras com bordas opacas (Dark Mode safe).
- **Badge:** Utilizado na `Dashboard.tsx` para apresentar de forma elegante o nível de estresse da API e status de fallback.
- **Select / Textarea:** Implementados dentro do core para manter o formulário robusto e responsivo.

### 2. Feedback Components (Crucial para UX Enterprise)
- **Toast / ToastProvider:** O fim dos `alert()` travantes no navegador. Agora todas as operações (salvar cena, enviar teste, gerar criativo) flutuam suavemente no canto da tela.
- **Skeleton:** Onde antes a tela "piscava" carregando, agora o componente UI `Skeleton` mantém o layout estável, aumentando a percepção de performance.
- **EmptyState:** Substituiu caixas de aviso vazias por ícones 3D/Vectors com chamadas para ação amigáveis (`CreativeStudio.tsx`).
- **ErrorState:** Container elegante de aviso que fornece um botão "Tentar Novamente" em caso de Timeout do FFmpeg ou rate limit da API Gemini.

## Benefícios Imediatos
- Redução de pelo menos 200 linhas de código duplicadas por página.
- Troca de Tema (Claro/Escuro) totalmente controlada por tokens no Tailwind sem precisar inspecionar centenas de divs isoladas.
- O Frontend está isolado de regras de CSS, podendo escalar rápido focando só em Lógica de Negócio.
