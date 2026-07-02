# ADR-003: Adoção do BullMQ para Processamento em Background

## Metadados
- **Título:** Utilização do BullMQ para Message Queuing Node.js
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
O processo principal do sistema (Renderização de Vídeo e Agendamento de Campanhas em massa) não pode ser gerido dentro de escopos HTTP tradicionais. Quando um usuário solicitava a renderização de um Creative (`POST /api/creatives/render`), se nós aplicássemos um `await renderVideo()`, o Fastify prenderia a conexão do cliente por até 2 minutos, consumindo muita memória do servidor e gerando Timeout (504 Gateway Timeout) na Cloudflare.

## Problema
- Necessidade de distribuir tarefas assíncronas duradouras (Long-running jobs) de forma garantida.
- Necessidade de mecanismos nativos de Retry caso a renderização falhasse por um glitch de rede.
- Lidar com Rate Limiting agressivo (Ex: Telegram API bloqueando disparos massivos).

## Alternativas Consideradas
1. **Agenda.js:** Baseado no MongoDB. 
2. **AWS SQS:** Solução serverless purista via Message Polling.
3. **BullMQ:** Message Broker focado no ecossistema Typescript suportado por Redis.

## Decisão Tomada
Decidimos utilizar o **BullMQ** (Alternativa 3). Ele foi abstraído em pastas `src/workers` e `src/queues` no nosso servidor API.

## Justificativa
O BullMQ provê abstrações de alto nível perfeitamente alinhadas com Node.js/TypeScript. Suporta nativamente:
- Jobs repetitivos (Cron).
- Concorrência limitada (`concurrency: 5`).
- Locks automáticos (Evitando race conditions onde 2 workers enviam o mesmo post no telegram).
- Exponential Backoff.
A AWS SQS exigiria a criação manual desses padrões e Agenda.js exigiria um banco MongoDB que não faz parte da nossa stack primária (Supabase/PostgreSQL).

## Consequências Positivas
- A fila de renderização não trava a API pública do painel.
- Se o servidor reiniciar no meio de um trabalho, o BullMQ recupera o Job interrompido automaticamente.
- Interface visual pronta com ferramentas como `BullMQ Board`.

## Consequências Negativas
- Aumentou brutalmente a complexidade da infraestrutura, obrigando o deploy de um Cluster Redis exclusivo (veja ADR-004) apenas para gerenciar ponteiros, além do BD principal PostgreSQL.

## Trade-offs
Aceitamos o custo financeiro (Manutenção de um Redis na nuvem) e a divisão arquitetural (Workers rodando sandboxed) para obter a escalabilidade horizontal irrestrita e a garantia de entrega (At-least-once delivery).

## Impacto Futuro
O isolamento forçado do BullMQ facilita amanhã destacarmos o código de Workers de Vídeo para Rodar em containers separados (Render Farm GPU), permitindo que a API Fastify escale independentemente dos Muxers de FFmpeg.

## Links Relacionados
- [Documentação de Workers](../architecture/workers.md)
- [ADR-004 Redis](./ADR-004-redis.md)
