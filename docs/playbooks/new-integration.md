# Playbook: Criar Integração Sistêmica (Ex: Pagamentos, Webhooks)

- **Status:** Stable
- **Versão:** 1.0.0
- **Última Atualização:** 01/07/2026

## 1. Quando utilizar
Utilize para sistemas mastodônticos que enviam retornos complexos pra dentro da nossa máquina (Webhook da Stripe, Asaas, Shopify API Sync).

## 2. Arquivos envolvidos
- `apps/api/src/routes/webhooks.ts`
- `docs/specs/templates/integration-template.md` (A spec inteira).

## 3. Fluxo de Desenvolvimento

```mermaid
graph TD
    A[Estudar a Especificação Oficial] --> B[Reservar Rotas Desprotegidas]
    B --> C[Adicionar Verificador HMAC / Signature]
    C --> D[Consumir Corpo (Buffer)]
    D --> E[Processar e Salvar no BD]
```

## 4. Boas práticas
- **Idempotência Máxima:** Integrações amam reenviar o mesmo POST HTTP se acharem que houve falha de rede. Nossa API deve tratar webhooks repetidos com sucesso. Grave um `webhook_id` na tabela para recusar repetições.
- **Raw Body Preserved:** No Fastify, para validar assinaturas criptográficas complexas (Ex: Stripe Webhooks), não parseie como JSON nativo. Pegue o raw-body buffer.
- **Fail Fast:** Responda `200 OK` ao serviço terceiro o mais rápido que conseguir, preferencialmente antes de mandar para o banco (ou emita um EventBus/Fila). Se ele dar timeout esperando, gerará retrabalho.

## 5. Testes Recomendados
- Ferramentas CLI oficiais (ex: `stripe listen`).
- Falsificar o payload e alterar um caractere para garantir que a criptografia bloqueia com erro HTTP 401.

## 6. Checklist de Implementação
- [ ] Rota imune à JWT padrão (não tem bearer token), mas com validação criptográfica (Signature Valid).
- [ ] Payload é processado via Message Queue em caso de demora.
