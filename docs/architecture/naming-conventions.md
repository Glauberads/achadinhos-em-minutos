# Convenções de Nomenclatura (Naming Conventions)

> [!TIP]
> A consistência na nomenclatura facilita a busca global de arquivos na IDE e permite deduzir instantaneamente a responsabilidade de um script sem abrir seu conteúdo.

## 1. Padrões de Arquivos e Sufixos (Backend)

Todos os arquivos no backend (`apps/api/`) devem ser grafados em minúsculas (kebab-case) separados por hífen e possuir um sufixo que deixe claro seu padrão de design (Design Pattern).

| Camada / Responsabilidade | Padrão de Nomenclatura | Exemplo | Regra de Conteúdo |
|---|---|---|---|
| **Rotas (Endpoints HTTP)** | `*.ts` (sem sufixo ou plural) | `creatives.ts`, `campaigns.ts` | Somente declaração do router Fastify. |
| **Serviços (Regra de Domínio)** | `*.service.ts` | `creative-studio.service.ts` | Exporta uma classe ou singleton com métodos focados na manipulação pesada de dados e decisões. |
| **Repositórios (DB Access)** | `*.repository.ts` | `product.repository.ts` | Métodos CRUD e acessos ao banco de dados via Supabase SDK. |
| **Trabalhadores (Filas)** | `*.worker.ts` | `video-render.worker.ts` | O processo que subscreve no Redis/BullMQ e executa o processamento pesado. |
| **Produtores (Filas)** | `*.queue.ts` | `video-render.queue.ts` | Apenas funções que envelopam o `queue.add()` para facilitar o uso no Service. |
| **Eventos (Event Bus)** | `*.event.ts` ou `event-types.ts`| `creative.events.ts` | Declaração da assinatura e payload do evento (classes). |
| **Componentes Genéricos / Libs** | `*.ts` | `supabase.ts`, `redis.ts` | Inicializadores de conexões, helpers globais sem domínio específico. |

## 2. Padrões de Arquivos e Pastas (Frontend)

O Frontend (`apps/web/`) adota uma mistura de PascalCase e kebab-case.

| Camada / Responsabilidade | Padrão de Nomenclatura | Exemplo | Regra de Conteúdo |
|---|---|---|---|
| **Páginas / Views** | `PascalCase.tsx` | `CreativeStudio.tsx` | Componentes de altíssimo nível (páginas inteiras) mapeadas no Router. |
| **Componentes UI Atômicos** | `kebab-case.tsx` | `core.tsx`, `toast.tsx` | Componentes reutilizáveis genéricos (botões, modais). |
| **Componentes de Domínio** | `PascalCase.tsx` dentro de pasta kebab-case | `creative-studio/StoryboardEditor.tsx` | Blocos de UI amarrados a um contexto de negócio que não devem ser utilizados soltos. |
| **Contextos de Estado** | `PascalCase.tsx` ou `useX.ts`| `AuthContext.tsx` | Providers React e os hooks injetores. |
| **Bibliotecas e Funções Puras** | `kebab-case.ts` | `api.ts`, `utils.ts` | Sem JSX. Funções puras utilitárias. |

## 3. Nomenclatura Interna de Código (Variáveis e Métodos)

- **Variáveis Comuns e Funções:** Utilizar `camelCase` (ex: `userEmail`, `calculateTotal()`).
- **Constantes Fixas Globais:** Utilizar `UPPER_SNAKE_CASE` (ex: `MAX_RENDER_LIMIT_MB = 100`).
- **Classes e Interfaces:** Utilizar `PascalCase` (ex: `ProductRepository`, `CreativeData`).
- **Interfaces e Types Omissos:** Não utilizar o prefixo `I` (Evite `IUser`, use `User`). A linguagem já suporta fortemente isso.
- **Tipos Dinâmicos do BD:** Preferir manter em snake_case como os dados chegam da API se eles são meros proxies da tabela (ex: `created_at`). Se precisar mutar e expor como classe de negócio, convirja para `camelCase`.

## 4. O Significado de Verbos em Métodos

Siga essas diretrizes de nomenclatura para previsibilidade de métodos em Services e Repositórios:

- **`get...()`**: Acesso leve/síncrono ou busca de chave/valor já conhecida.
- **`fetch...()` / `find...()`**: Envolve query no BD ou API externa (Promise pesada).
- **`create...()`**: Insere dados inéditos.
- **`update...()`**: Altera parcialmente um dado.
- **`process...()`**: Orquestra uma cadeia de funções ou transformação densa.
- **`enqueue...()`**: Adiciona uma tarefa à fila (BullMQ).
- **`trigger...()`**: Dispara uma ação externa não obstrutiva (ex: trigger webhook).
