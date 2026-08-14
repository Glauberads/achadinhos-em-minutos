# Checklist de Produção (Go Live)

Este checklist DEVE ser verificado inteiramente pela liderança de engenharia antes de alterar as chaves de testes da Asaas para Produção e remover a senha de acesso (Beta) do front-end.

## 1. Banco de Dados e Storage (Supabase)
- [ ] Row Level Security (RLS) habilitado e validado em **todas** as tabelas.
- [ ] Storage Policies restritivas: `(storage.foldername(name))[1] = auth.uid()::text`. Não permitir uploads para qualquer bucket.
- [ ] PITR (Point in Time Recovery) ativado na configuração do Supabase Pro.
- [ ] Índices aplicados em todas as tabelas pesadas (`campaign_id`, `product_id`, `user_id`).
- [ ] Senha do Service Role rotacionada se houve suspeita de vazamento em testes.

## 2. Infraestrutura e Redes (Cloudflare + Railway)
- [ ] Regras WAF do Cloudflare configuradas bloqueando tráfego malicioso (Bad Bots).
- [ ] Cloudflare Proxy (Nuvem Laranja) ativo apontando para as instâncias do Railway.
- [ ] Rate Limit ativado no Nginx/Fastify impedindo ataques DoS de Camada 7.
- [ ] Domínios em Produção não respondem sem Certificado SSL (HTTPS Strict).
- [ ] Deploy do Frontend (Vite) feito gerando Code Splitting (Lazy Load).

## 3. Chaves e Variáveis de Ambiente (Secrets)
- [ ] `ENCRYPTION_KEY` definida explicitamente no Railway.
- [ ] Variáveis da API de Integração (`Asaas`, `Shopee`, `Mercado Livre`) substituídas do ambiente Sandbox para Produção real.
- [ ] `NODE_ENV=production` habilitado (Desativa logs de debug excessivos do Fastify).
- [ ] O `.env` de testes deletado das instâncias de deploy, uso estrito de Painel de Secrets Cloud.

## 4. Orquestração e Workers (BullMQ / Redis)
- [ ] Worker do FFmpeg isolado e fixado com concorrência = 1 (Mitigação de OOM).
- [ ] Dead Letter Queue (DLQ) do BullMQ esvaziando falhas antigas ou com TTL (evitando vazamento de Redis RAM).
- [ ] Connection Pool do Redis configurada (`maxRetriesPerRequest: null`) para os workers nativos.

## 5. Gateway Financeiro (Asaas)
- [ ] Token de Webhook `ASAAS_WEBHOOK_TOKEN` gerado no painel da Asaas e injetado no Railway.
- [ ] Endpoint `/api/webhooks/asaas` validado em ferramenta pública externa antes da mudança de DNS final.
- [ ] Conta recebedora configurada para aprovação e verificação de compliance no Asaas Brasil.
- [ ] Split de Pagamentos (se houver parceiros comerciais) validado via simulador.

## 6. Operacional (Health & Observability)
- [ ] Endpoint `/api/health/ready` não retorna métricas descritivas internas, apenas "Online".
- [ ] Rota `/system/observability` fechada estritamente para e-mails e Roles de administradores.
- [ ] Logs via `Pino` (JSON) capturados com sucesso pela interface do Railway Log.

**ASSINATURA DE GO LIVE:**

Aprovado por: ________________________ (CTO/Lead Engineer)
Data: ___/___/202X
Status: GO
