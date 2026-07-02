# Spec: [Nome da Modificação no Frontend]

> [!NOTE]
> **Como usar este Template:** Utilize o `frontend-template.md` para novas páginas, views completas ou lógicas de gerenciamento de estado complexo no React.
> **Exemplo Preenchido:** `Galeria de Assets e História`

## 1. Metadados
| Propriedade | Detalhe |
|---|---|
| **Título** | Galeria de Mídia do Usuário |
| **Autor** | [Seu Nome] |
| **Data de Criação** | DD/MM/AAAA |
| **Status** | `Draft` |
| **Versão** | 1.0.0 |
| **Responsável** | Frontend Squad |
| **Última Atualização** | DD/MM/AAAA |

## 2. Objetivo
Criar uma página (`/gallery`) onde o usuário pode gerenciar os MP4 e Imagens que já gerou historicamente através da nossa IA.

## 3. Contexto
No momento o painel apenas gera criativos e desaparece. O usuário não tem controle histórico dos assets que renderizou.

## 4. Requisitos Funcionais
- **RF01:** Exibir Grid (Cards) com paginação.
- **RF02:** Botão de Download na miniatura do card.
- **RF03:** Botão de Apagar criativo (Soft delete ou Hard Delete do BD + Storage).

## 5. Requisitos Não Funcionais
- **Performance:** As imagens (thumbnail_url) devem estar no formato WebP ou redimensionadas.
- **Acessibilidade:** Usar navegação por setas de teclado (Arrow Keys) no grid.

## 6. Arquitetura
- As chamadas passam pelo custom hook `useQuery` do TanStack para garantir caching local na sessão.

## 7. Banco de Dados
- N/A. Depende de uma API que traga os dados.

## 8. Backend
- Necessita apenas consumo da rota `GET /api/creatives?page=1`.

## 9. Frontend
- **Páginas:** `src/pages/Gallery.tsx`.
- **Componentes:** `CreativeCard.tsx`, `PaginationControls.tsx`, `DeleteConfirmModal.tsx`.
- **Estados/Loading:** Uso de `SkeletonCard` no lugar da listagem enquanto carrega.
- **Error States:** Se 502, mostrar EmptyState com `alert-triangle` e botão de Retry.

## 10. Integrações
- Integração padrão com Axios (instância `api`).

## 11. Segurança
- O JWT deve ser validado via Context antes da renderização da view.

## 12. Performance
- **Lazy Loading:** Implementar `IntersectionObserver` ou `react-window` se a galeria tiver milhares de itens, para não estourar a RAM do Browser.

## 13. Observabilidade
- Se a página quebrar bruscamente (React Crash), enviar para a Telemetria Error Boundary.

## 14. Fallbacks
- Se uma thumbnail falhar o carregamento (404 Cloudflare), usar `<img onError={setFallbackPath} />`.

## 15. Critérios de Aceite
- [ ] View em Grid impecável no Desktop e empilhada em 1 coluna no Mobile.
- [ ] Skeletons mostrados inicialmente.
- [ ] Download do MP4 funciona em background sem abrir nova aba vazia.

## 16. Plano de Testes
- Testes via Storybook no `CreativeCard.tsx`. Validação Cypress no fluxo de paginação.

## 17. Plano de Rollback
- Reverter o PR ou esconder a rota por Feature Flag.

## 18. Impacto
- Nova interface gráfica pesada, aumentar atenção à fluidez (60fps scrolling).

## 19. Roadmap
- Inserir filtros de busca (Tags, Data).
