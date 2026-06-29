# Event Bus Enterprise

Este diretório contém a infraestrutura orientada a eventos (EDA - Event Driven Architecture) do Achadinhos em Minutos.

## Arquitetura
A arquitetura de eventos foi desenhada para desacoplar as responsabilidades. 
- **Services/Workers** NUNCA devem chamar serviços de infraestrutura paralelos (Auditoria, Notificação, Analytics, etc) diretamente.
- Eles apenas emitem **DomainEvents** através do `EventBus`.
- Os **Listeners** escutam esses eventos em background e executam suas tarefas independentemente.

## Fluxo
1. Algo relevante acontece (ex: Worker terminou de importar um produto).
2. O serviço importa o EventBus e os tipos de eventos:
   ```ts
   import { eventBus, ProductImportedEvent } from '../events';
   ```
3. O evento é despachado:
   ```ts
   eventBus.emit(new ProductImportedEvent(
     { product_id: '123', platform: 'shopee', external_id: 'abc' },
     { user_id: 'user_1', source: 'campaign-runner' }
   ));
   ```
4. O `EventBus` repassa isso para o `EventEmitter` interno.
5. Em `/listeners`, cada classe interessada recebe o evento:
   - `AuditListener` registra no banco de logs.
   - `AnalyticsListener` incrementa contadores de performance.
   - `CacheListener` invalida a listagem do usuário.

## Eventos Existentes
Todos os eventos estão fortemente tipados em `event-types.ts`.
- **Produtos**: `ProductImportedEvent`, `ProductSavedEvent`
- **Buscas**: `SearchStartedEvent`, `SearchFinishedEvent`
- **Campanhas**: `CampaignStartedEvent`, `CampaignPausedEvent`, `CampaignStoppedEvent`, `CampaignFinishedEvent`
- **Telegram**: `TelegramQueuedEvent`, `TelegramSentEvent`, `TelegramFailedEvent`
- **Afiliados**: `AffiliateValidatedEvent`
- **Workers**: `WorkerStartedEvent`, `WorkerFinishedEvent`, `WorkerFailedEvent`
- **Sistema**: `NotificationCreatedEvent`, `WebhookDispatchedEvent`, `FeatureEnabledEvent`, `FeatureDisabledEvent`

## Como Criar Novos Eventos
1. Abra `event-types.ts`.
2. Crie uma classe herdando de `DomainEvent<T>` (onde T é a interface do payload customizado).
3. Exporte a classe.

## Como Criar Novos Listeners
1. Crie um arquivo em `apps/api/src/listeners/meu-novo.listener.ts`.
2. Defina os métodos que vão tratar os eventos.
3. Importe o Listener no arquivo `event-registry.ts`.
4. Registre o listener com tratamento de erros:
   ```ts
   register('MeuNovoEvento', 'MeuNovoListener', (e) => meuNovoListener.onMeuNovoEvento(e as any));
   ```

## Resiliência e Isolamento
Se o envio de um Webhook falhar, ele NÃO pode interromper a inserção de Auditoria e NÃO pode quebrar o Worker original. O `event-registry.ts` garante que cada Listener é embrulhado em um bloco `try/catch`. 

## Futuro
Esta camada interna está isolada. No futuro (para escalabilidade Multi-Server), o arquivo `event-emitter.ts` será o único modificado para plugar no **Redis Pub/Sub** ou **RabbitMQ**. Nenhum service ou listener precisará ser refatorado.
