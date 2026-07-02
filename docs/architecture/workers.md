# Background Workers e Filas (BullMQ)

> [!NOTE]
> Todo o processamento pesado do projeto (renderização de mídia, chamadas demoradas de IA e agendamentos de postagem) é feito off-thread utilizando `BullMQ` em cima do `Redis`.

## 1. Topologia de Filas

Atualmente, o sistema distribui o trabalho entre as seguintes filas primárias:

- **`creative-render`**: Fila de renderização gráfica. Processa imagens e vídeos a partir de metadados da IA (Canvas API/FFmpeg).
- **`campaign-runner`**: Fila do tipo Cron (repetitiva). Verifica de minuto em minuto se existem campanhas que devem ser acionadas e posts que passaram do `scheduled_at`.
- **`telegram-sender`**: Fila para disparo efetivo de mensagens HTTP via API do Telegram. Isolada para respeitar _rate limits_.

```mermaid
graph LR
    API[Core API Fastify] --> |Enfileira (addJob)| Redis[(Redis Server)]
    Redis --> |Pop Job| W1[Creative Render Worker]
    Redis --> |Pop Job| W2[Campaign Runner Worker]
    W2 --> |Enfileira (addJob)| Redis
    Redis --> |Pop Job| W3[Telegram Sender Worker]
```

## 2. Padrões Operacionais (BullMQ)

### 2.1 Concorrência
Cada Worker instancia um limite de concorrência (`concurrency`). O Render Worker é tipicamente travado em concorrência baixa (ex: 2) para não fritar a CPU e a RAM do Host com FFmpeg simultâneos, enquanto o Telegram Sender pode ter concorrência alta (ex: 10-20) já que a carga é primariamente I/O (rede).

### 2.2 Retry & Exponential Backoff
Jobs não são descartados na primeira falha.
- Eles são configurados com política de Retry (ex: 3 tentativas).
- O recuo é exponencial (Exponential Backoff): a primeira falha aguarda 5s, a segunda 15s, a terceira 45s.
- Isso previne que instabilidades curtas da Shopee ou da OpenAI destruam o trabalho do usuário.

### 2.3 Locks
BullMQ aplica locks no Redis enquanto o Job executa. Isso impede que outro processo suba e tome a mesma tarefa simultaneamente (Evita post duplo no Telegram, por exemplo).

## 3. Sandboxing de Workers
Os arquivos `.worker.ts` funcionam como contêineres autônomos de lógica. Eles inicializam seu próprio cliente Supabase (via `supabaseAdmin`) bypassando RLS e não dependem do Fastify.

O ciclo de vida obrigatório de um Worker:
1. Puxa dados do Payload.
2. Vai no banco (`supabaseAdmin`) conferir se a tarefa ainda é válida.
3. Faz o trabalho.
4. Emite Log/Evento.
5. Salva resultado final na tabela (`status = 'ready' | 'sent' | 'failed'`).
