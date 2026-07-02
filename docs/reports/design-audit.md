# Design Audit

## 1. Visão Geral da Identidade
O produto usa Tailwind e Shadcn UI, o que garante limpeza, mas não transmite "Enterprise". Falta alma, tipografia assertiva e refinamento de Grid.

## 2. Inconsistências
- **Botões (Border Radius):** Temos botões de salvar com `rounded-md` e modais com `rounded-xl`. O Radius não está centralizado num Design Token de CSS variables.
- **Cores e Sombras:** O painel usa cinza chapado. Plataformas modernas (Vercel, Linear) usam sutis *Glassmorphisms* e sombras multicamadas (`shadow-sm` + bordas 1px `border-white/10`).
- **Tipografia:** A fonte atual (Inter genérica) não impõe respeito no Dashboard. Dados numéricos na home não são exibidos em tipografia tabular, fazendo os números pularem ao atualizar métricas em tempo real.

## 3. Padrões Exigidos
- Padronizar paleta HSL no `index.css`.
- Unificar todos os *Border Radius*.
- Refinar espaçamentos usando sistema de 4pt a 8pt estrito (Tailwind spacing).