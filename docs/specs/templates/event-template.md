# Spec: [Nome do Evento]

> [!NOTE]
> **Como usar este Template:** Utilize o `event-template.md` quando precisar injetar uma nova rota de comunicação pub/sub (CQRS-lite) no EventBus para o AuditLog ou sistema de Analytics.
> **Exemplo Preenchido:** `CampaignDeletedEvent`

## 1. Metadados
| Propriedade | Detalhe |
|---|---|
| **Título** | Evento: Campanha Deletada |
| **Autor** | [Seu Nome] |
| **Data de Criação** | DD/MM/AAAA |
| **Status** | `Draft` |
| **Versão** | 1.0.0 |
| **Responsável** | SRE Squad |
| **Última Atualização** | DD/MM/AAAA |

## 2. Objetivo
Garantir que a exclusão manual de campanhas via API reflita na métrica global e notifique o usuário da ação (Audit).

## 3. Contexto
Ao deletar uma campanha, não sabemos "quem" deletou, pois as tabelas não possuem hard logs se excluidas em cascata. O Evento garante que o registro imutável do Audit fique salvo antes do DELETE oficial.

## 4. Requisitos Funcionais
- **RF01:** Definir a classe tipada do evento (Payload deve ter id da campanha e email do admin).
- **RF02:** Assinar no Listener global para disparar gravação no Supabase Audit Log.

## 5. Requisitos Não Funcionais
- **Performance:** Evento assíncrono (não aguarda o Insert do Audit Log para continuar).

## 6. Arquitetura
- Emissão acoplada ao finalizador do service (ex: `campaign.service.ts`).

## 7. Banco de Dados
- **Novas tabelas:** N/A (Apenas insert natural na existente `audit_logs`).

## 8. Backend
- **Events:** `CampaignDeletedEvent`.
- **Listeners:** Atualização do `listeners.ts`.

## 9. Frontend
- N/A. O frontend apenas verá a ação na tela de auditoria.

## 10. Integrações
- N/A.

## 11. Segurança
- N/A.

## 12. Performance
- O emissor não deve possuir bloqueio lógico de Async/Await caso o BD caia. (Fire and Forget).

## 13. Observabilidade
- A telemetria pode decrementar a contagem total de campanhas ativas.

## 14. Fallbacks
- Se falhar na escrita do log, imprime no console.error.

## 15. Critérios de Aceite
- [ ] Interface TS do evento corretamente gerada.
- [ ] O Listener de Audit está escutando e gravando via Repositório de Logs.

## 16. Plano de Testes
- Efetuar deleção num Mock Unitário e verificar se o `bus.emit` foi chamado passando o ID alvo.

## 17. Plano de Rollback
- Excluir o listener da lista de subscriptions em tempo de execução.

## 18. Impacto
- Baixíssimo impacto no sistema.

## 19. Roadmap
- Envio do log para um ElasticSearch/Kibana externo no futuro.
