# ADR 015: Canonical CreativeDNA Contract and Structured AI Outputs

## Context
A arquitetura anterior dependia de extração de blocos ````json ` via regex, o que era frágil e sujeito a variações do LLM. Havia a necessidade de unificar os contratos (como `CreativeDnaV2Schema`) de forma forte e compartilhá-los via `@achadinhos/shared` para uso tipado, alinhando as validações tanto no frontend quanto no backend de maneira previsível.

## Decision
- Foi implementado o pacote `@achadinhos/shared` como fonte canônica (`Single Source of Truth`) para o `CreativeDnaV2Schema` e outros contratos de domínio.
- Substituímos o uso de Regex por `generateStructured`, alimentado nativamente pela funcionalidade Open API Schema (JSON Schema) do LLM.
- O Zod (`3.23.8`) atua como validador de tempo de execução (*runtime validation*).
- O pacote `zod-to-json-schema` é utilizado no adapter (`gemini-schema-adapter.ts`) para expurgar propriedades que a API do Gemini não suporta e converter os Schemas nativamente em JSON Schema.
- A Mock Policy em produção foi restringida: em produção (`NODE_ENV=production`), a ausência do `GEMINI_API_KEY` deve estourar um explícito `AIConfigurationError`, evitando falsos positivos ao invés de acionar falhas silenciosas ou mocks.
- `AIFactory` foi ajustada para *lazy loading* através de um `LazyAIProvider` proxy, para evitar travar o boot da API em rotas que não dependem da IA, deferindo o erro `AIConfigurationError` para a requisição de fato.
- Cada serviço (ex: Visual Intelligence) utiliza o seu próprio schema canônico específico.

## Consequences
**Positivas:**
- Falhas de parsing de IA eliminadas pela raiz (erro é devolvido via conformidade de contrato).
- A tipagem do Zod garante intellisense confiável nas chamadas.
- O Boot do servidor docker não capota mais na ausência do Gemini caso ele seja ativado em instâncias híbridas que testem a API primária.
**Negativas:**
- Algumas dependências transversais de monorepo foram injetadas (`@achadinhos/shared`), elevando levemente o tempo de build do Docker.

## Alternatives Considered
- Usar validação regex iterativa com retentativas LLM: descartado pelo custo excessivo e latência imprevisível.
- Migrar para Vercel AI SDK de forma integral: descartado para manter a biblioteca minimalista e nativa do Gemini enquanto for o LLM default de escolha do projeto.
