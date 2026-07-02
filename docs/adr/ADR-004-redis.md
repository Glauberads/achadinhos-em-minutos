# ADR-004: Redis como Camada de Cache e Orquestração

## Metadados
- **Título:** Adoção do Redis como In-Memory Data Store Primário
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
Durante o desenvolvimento do Pipeline do BullMQ (ADR-003), surgiu a obrigação técnica de adotar um In-Memory Datastore. Adicionalmente, verificamos que as integrações com APIs externas (ex: API do Mercado Livre e Shopee) cobram altíssimo preço em latência, precisando de mecanismos para aliviar requisições duplicadas pro mesmo produto (Caching).

## Problema
- Alta latência na ingestão de links de marketplace repetidos pelo mesmo usuário ou usuários diferentes.
- A ferramenta BullMQ necessita estritamente do Redis para funcionar.

## Alternativas Consideradas
1. **PostgreSQL Puro (Skip Caching):** Guardar os dados de BullMQ e Cache de HTML numa tabela `cache` padrão usando Supabase.
2. **Memcached:** Usar memcached apenas para cache de key/value efêmero.
3. **Redis:** Uso do Redis como Message Broker para as Filas e Key-Value store para Cache.

## Decisão Tomada
Decidimos integrar o **Redis** (Alternativa 3) como nossa ferramenta exclusiva de armazenamento volátil.

## Justificativa
O Redis suporta estruturas de dados complexas (Hashes, Sorted Sets) que o BullMQ utiliza para trancar e ordenar jobs assíncronos de renderização de vídeos com extrema eficiência via scripts Lua (Transações ACID). O PostgreSQL puro não daria vazão à taxa astronômica de INSERTS/UPDATES de milissegundos que o motor de Filas exige sem gerar degradação dos índices e da UX do sistema inteiro.

## Consequências Positivas
- Temos agora um local oficial para armazenar Rate Limiting Counters (Proteção contra bots).
- As requisições de raspagem (ProductLinkParser) para produtos repetidos foram de 3.000ms para 15ms.
- Infraestrutura 100% pronta para lidar com WebSockets e Pub/Sub distribuído caso decidamos escalar a API Horizontalmente.

## Consequências Negativas
- O projeto exige mais configuração local para novos desenvolvedores (`docker-compose` de Redis rodando).
- Maior superfície de ataque se o servidor Redis for exposto equivocadamente na rede sem autenticação TLS/ACL.

## Trade-offs
O Redis é volátil (se usarmos a policy padrão de expurgo em RAM cheia sem persistência no disco). Se o Redis cair, todas as filas temporárias não salvas no Postgres podem sumir. Aceitamos este trade-off pois o código prevê os registros definitivos sempre espelhados na tabela de `scheduled_posts` ou `creatives` no banco Supabase.

## Impacto Futuro
O Redis poderá atuar como camada de semáforo de bloqueio distribuído (Redlock) se o tráfego do projeto crescer muito, impedindo concorrência indesejada sobre a edição de faturas de pagamento.

## Links Relacionados
- [ADR-003 BullMQ](./ADR-003-bullmq.md)
