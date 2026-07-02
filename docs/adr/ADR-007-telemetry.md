# ADR-007: Separação de Telemetria e Auditoria

## Metadados
- **Título:** Segmentação Analítica entre System Logs e Audit Logs
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
O histórico das atividades no Achadinhos em Minutos ficava aglomerado numa tabela só. O cliente precisava acessar quais campanhas ele agendou, ao mesmo tempo que a equipe interna via logs de erro de FFmpeg e conexões timeout da OpenAI. A complexidade do payload de JSONB destruiu o tempo da Query e causou lentidão.

## Problema
- Vazamento de contexto: Usuários finais viam mensagens técnicas de erro HTTP.
- O crescimento exponencial de registros analíticos e de sistema afogava logs imutáveis de ações do usuário (Login, Inserção, Deleção).

## Alternativas Consideradas
1. **Third-Party Analytics (Datadog/Sentry):** Empurrar todos os System Logs para fora da nossa DB, deixando na Cloudflare ou Sentry, e manter o Audit interno para o cliente.
2. **Separação Interna (telemetry_logs vs audit_logs):** Particionar em duas tabelas diferentes dentro da nossa própria infraestrutura, separando "Eventos Críticos de Negócio (Audit)" de "Métricas do Motor (Telemetry)".

## Decisão Tomada
Decidimos por adotar a **Alternativa 2**. System Logs e Health Metrics vão para `telemetry_logs` (gerenciado por SRE). Cliques de botões importantes pelo usuário vão para `audit_logs` (Visualizado por ele).

## Justificativa
Serviços como Datadog cobram pelo volume ingerido, e a plataforma possui um volume insano de telemetria devido ao processamento repetitivo de IA (Marketing Brain emitindo metadados). O Supabase DB (PostgreSQL) ainda consegue suportar a ingestão dos dois, desde que logicamente separados em tabelas distintas.

## Consequências Positivas
- RLS liberado na tabela `audit_logs` para que o próprio cliente possa ver os horários em que alguém da equipe dele (Curador) agendou posts de vídeos.
- Tabela `telemetry_logs` pode ser truncada semanalmente (apagar dados velhos) sem ofender leis de retenção fiscal ou contratual (diferente da tabela Audit).

## Consequências Negativas
- Maior consumo de disco da base primária do banco relacional.

## Trade-offs
Decidimos utilizar a infraestrutura atual até atingirmos o teto de IOPS, pagando com espaço de disco, mas aliviando integrações e contratos com fornecedores externos de APM.

## Impacto Futuro
O *Future Consideration* é acoplar a tabela de Telemetria a rotinas programadas (Pg_Cron) para gerar Health Scores consolidados do sistema a cada hora e enviar para um ElasticSearch.

## Links Relacionados
- [Documentação Event Driven Architecture](../architecture/event-driven.md)
