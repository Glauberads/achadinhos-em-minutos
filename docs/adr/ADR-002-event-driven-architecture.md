# ADR-002: Event Driven Architecture (Barramento Local)

## Metadados
- **Título:** Adoção de Arquitetura Orientada a Eventos em Memória
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
Toda plataforma SaaS enterprise requer forte auditoria (Audit Logs) para rastrear o que os usuários fazem, além de telemetria analítica de uso (Quantos criativos gerados? Quantos erros na IA?). Originalmente, se a rota `/creatives/generate` terminasse o processo, ela mesma tinha que abrir o Supabase e dar `insert` em 3 tabelas diferentes (Criativo, Telemetria e Auditoria). 

## Problema
- O Controller/Service ficava acoplado a serviços acessórios.
- Requisições HTTP do Frontend ficavam muito lentas, pois o usuário esperava as tabelas de log responderem para o Request retornar `200 OK`.
- Falhas irrelevantes de inserção de log derrubavam o fluxo principal do usuário (Status 500).

## Alternativas Consideradas
1. **Filas Pesadas (RabbitMQ / Kafka):** Usar um Message Broker robusto e externo para rotear logs.
2. **Event Bus Local (Mitt / NodeJS EventEmitter):** Instanciar um barramento em memória no Fastify usando CQRS-lite. O fluxo principal dispara `EventBus.emit()` sincronicamente e retorna 200, enquanto Listeners rodam de fundo de forma não-bloqueante.
3. **Database Triggers:** Fazer o PostgreSQL gerar os logs automaticamente após o INSERT do criativo.

## Decisão Tomada
Decidimos pela **Alternativa 2 (Event Bus Local)** como nossa Event Driven Architecture base, complementada pela biblioteca leve `mitt`.

## Justificativa
Kafka e RabbitMQ introduziriam custos absurdos e sobrecarga de infraestrutura incondizente com o estágio atual (Bootstrapped Startup). Triggers de banco de dados são caixas-pretas obscuras de versionar. Um `EventBus` em NodeJS permite emitir Eventos tipados que a própria API digere sem latência de rede.

## Consequências Positivas
- A latência para o usuário final caiu drasticamente (TTFB menor).
- O código dos `Services` foi limpo; eles não importam mais `AuditService` nem `TelemetryService`.
- Exceções nos logs não abortam a jornada do usuário.

## Consequências Negativas
- **Perda de Integridade Estrita (Durabilidade):** Se o pod/node da API sofrer crash (OOM ou Server Restart) milissegundos após emitir o evento e antes do Listener terminar o Insert no Supabase, esse Log da Telemetria sumirá para sempre.
- Rastreamento de _Stack Traces_ fica complexo, pois os erros não sobem para o Middleware de captura do Fastify.

## Trade-offs
Assumimos o risco de perder ~0.01% dos eventos não-críticos em caso de crash catastrófico, em troca de remover o gargalo de I/O em 100% das transações saudáveis do sistema.

## Impacto Futuro
A abstração feita pelo `EventBus` permite que amanhã, se necessário, troquemos o provedor em memória (`mitt`) pela injeção no Apache Kafka ou Amazon SQS sem modificar nenhuma das emissões nos domínios do negócio.

## Links Relacionados
- [Arquitetura Orientada a Eventos](../architecture/event-driven.md)
