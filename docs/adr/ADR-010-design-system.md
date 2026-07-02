# ADR-010: Design System Pragmático e Copiável

## Metadados
- **Título:** Uso do paradigma Copy/Paste de componentes Headless via Shadcn UI
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
Construir um Design System React internamente do zero exige uma gigantesca força-tarefa dedicada (Testes em N navegadores, acessibilidade ARIA, keyboard navigation). Por outro lado, utilizar bibliotecas pesadas de ecossistema fechado (Material UI / Ant Design) força um lock-in temático (todos os projetos parecem apps do Google e o CSS é injetado via runtime CSS-in-JS que polui os bundles).

## Problema
- Necessidade de um visual premium com micro-animações, sem sobrecarga de CSS runtime.
- Componentes precisam ser altamente alteráveis sem depender da abertura de PRs no Github do repositório da biblioteca original.

## Alternativas Consideradas
1. **Material-UI (MUI):** O ecossistema padrão da indústria corporativa em React.
2. **Tailwind CSS Puro:** Desenvolver toda a acessibilidade dos modais do zero.
3. **Headless UI (Radix) + Shadcn UI:** A adoção de primitivas puras focadas em acessibilidade onde você possui o código completo do CSS de Tailwind, podendo sobrescrevê-lo dentro da pasta `src/components/ui/`.

## Decisão Tomada
Decidimos pelo uso conjunto de **Tailwind CSS + Radix UI Primitives + Shadcn UI** (Alternativa 3).

## Justificativa
O Tailwind CSS provê a base estilística sem carregar CSS ocioso para a produção (JIT compilation). A biblioteca Radix abstrai as complexidades horríveis de acessibilidade (Tab trap dentro de Modais, teclas Esc) de forma *headless* (sem injetar uma cor ou borda sequer). O paradigma do Shadcn garante que o componente gerado pertença 100% ao nosso código fonte e possamos editá-lo.

## Consequências Positivas
- Zero dores de cabeça para alterar a largura, cantos arredondados (border-radius) ou animação de Hover dos modais de forma definitiva, porque o JSX está visível nas nossas pastas.
- O tema não tem "cara de ferramenta de repartição". Fica moderno, com alto apelo visual (Premium Aesthetics).
- Arquivos de Output e Code Splitting do Webpack geram os menores bundles possíveis.

## Consequências Negativas
- Proliferação excessiva de pequenos arquivos `.tsx` utilitários criados pelo CLI do shadcn (`button.tsx`, `input.tsx`, `label.tsx`, `dialog.tsx`), inflando a pasta de arquivos UI na raiz do Frontend.

## Trade-offs
O time abdicou do conforto de simplesmente baixar um pacote NPM estático pronto, aceitando ter a governança completa (e a responsabilidade completa) pelo código de cada primitivo na tela. Acreditamos que um SaaS B2C exige personalização que as libs prontas limitam.

## Impacto Futuro
Se quisermos trocar de framework Tailwind para CSS Vanilla Módulos, ou para PandaCSS amanhã, todas as classes utilitárias estarão declaradas unicamente em nossa propriedade, tornando possível aplicar expressões regulares de regex globais (Substituições).

## Links Relacionados
- [Documentação de Componentes (Playbook)](../playbooks/new-design-system-component.md)
