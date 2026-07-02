# Playbook: Criar Nova Página / View (React Frontend)

- **Status:** Stable
- **Versão:** 1.0.0
- **Última Atualização:** 01/07/2026

## 1. Quando utilizar
Quando o usuário requerer uma visão totalmente nova na URL da plataforma (ex: `/dashboard/billing`). Se for só um modal ou dropdown, este é o playbook errado (veja *Component*).

## 2. Arquivos envolvidos
- `apps/web/src/pages/[Pagina].tsx`
- `apps/web/src/App.tsx` (ou o arquivo mestre de Rotas React Router DOM)

## 3. Fluxo de Desenvolvimento

```mermaid
graph TD
    A[Configurar Rota React Router] --> B[Criar View Wrapper]
    B --> C[Definir SEO / Títulos]
    C --> D[Chamar Hooks de Busca (Query)]
    D --> E[Injetar Skeletons caso IsLoading]
    E --> F[Montar a UI Final Grid]
```

## 4. Boas práticas
- **Não crie "Monstros":** A página `.tsx` deve apenas orquestrar Layout, Meta Tags e gerenciar a injeção global. Botões rebuscados, listagens complexas e editores devem ser componentes extraídos numa sub-pasta.
- **Proteja a Rota:** Se a página for restrita (Premium), o `Route` lá no App.tsx deve ser envolto num `ProtectedRoute`.
- **Title and Meta:** Altere o `<title>` via Helmet ou manipulação nativa para refletir a aba atual.

## 5. Testes Recomendados
- **Refresh Pesado:** Dê F5 violentamente na página e observe se a tela não pisca dados sensíveis antes de carregar e ir pro redirect do Auth.
- **Redimensionamento:** Abra o Developer Tools e encolha até simular tela de celular (320px). Botões espremeram? Conserte as _Media Queries_.

## 6. Checklist de Implementação
- [ ] Renderiza um Empty State decente caso a tabela de fundo venha `[]`.
- [ ] Renderiza Loading Skeleton enquanto a API carrega (evitando tela branca seca).
- [ ] Botões utilizam componentes da biblioteca UI (Tailwind Customizado), não CSS purista maluco.
