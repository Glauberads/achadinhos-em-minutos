# Auditoria de Segurança: Production Readiness

Este relatório apresenta os resultados da auditoria de segurança da infraestrutura da API, Banco de Dados e Serviços do **Achadinhos em Minutos**, realizada no contexto do Go Live (Enterprise).

## Resumo Executivo
A plataforma baseia-se em boas práticas modernas (Zod, Fastify Helmet, validação de tipos). Contudo, a varredura profunda no repositório encontrou **3 vulnerabilidades CRÍTICAS** que devem ser bloqueantes para o lançamento: Exposição de chaves estáticas (Hardcoded Secrets), Bypass de Webhooks Financeiros e IDOR de Uploads em Storage. 

---

## 1. Chave Criptográfica Hardcoded (Hardcoded Secret)
- **Status:** 🔴 Crítico (Bloqueante)
- **Prioridade:** P0
- **Evidências encontradas:** 
  O arquivo `apps/api/src/lib/crypto.ts` na linha 6 utiliza: `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'minha_chave_secreta_provisoria_12345';`
- **Impacto:** Caso a aplicação suba para produção sem a declaração exata dessa variável, o sistema utilizará uma chave pública globalmente conhecida para encriptar dados sensíveis, quebrando o sigilo das integrações em nuvem.
- **Como reproduzir:** Iniciar a API sem a flag definida no ambiente e salvar uma integração (Mercado Livre, Shopee). A criptografia usará a chave padrão insegura.
- **Correção recomendada:** Remover o fallback de string pura. Levantar uma exceção (Ex: `throw new Error('ENCRYPTION_KEY is required in production')`) no bootstrap se estiver faltando.

---

## 2. Autenticação de Webhook Financeiro (Bypass)
- **Status:** 🔴 Crítico (Bloqueante)
- **Prioridade:** P0
- **Evidências encontradas:** 
  O arquivo `apps/api/src/routes/webhooks.ts` valida o header da Asaas da seguinte forma: 
  `if (process.env.ASAAS_WEBHOOK_TOKEN && asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) { ... }`
- **Impacto:** A cláusula condicional dupla permite que, se a variável não estiver presente no arquivo `.env` do Railway, o servidor "bypasse" completamente a validação. Atacantes poderiam descobrir a rota `/api/webhooks/asaas` e forjar pagamentos falsos (`PAYMENT_CONFIRMED`), gerando assinaturas sem pagar.
- **Como reproduzir:** Fazer um POST com cURL sem o token asaas para `/api/webhooks/asaas` localmente sem a var definida no `.env`.
- **Correção recomendada:** Lançar falha de inicialização do servidor se a variável estiver vazia em produção, ou alterar a validação para: `if (!process.env.ASAAS_WEBHOOK_TOKEN || asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) return reply.code(401);`

---

## 3. IDOR / Mass Assignment no Supabase Storage
- **Status:** 🔴 Crítico (Bloqueante)
- **Prioridade:** P0
- **Evidências encontradas:** 
  As migrations `20260629000004` e `20260629000005` criam as Storage Policies (Ex: `Users can upload to 'creatives' bucket`) com a seguinte política genérica:
  `WITH CHECK (bucket_id = 'creatives' AND auth.role() = 'authenticated');`
- **Impacto:** Qualquer usuário logado pode fazer upload de arquivos diretamente na API do Supabase e possivelmente sobrescrever os assets de outros clientes caso adivinhe ou encontre os IDs/paths alheios.
- **Como reproduzir:** Utilizar o token JWT de um usuário X para fazer um POST na API do Storage tentando sobrescrever o arquivo na pasta do usuário Y.
- **Correção recomendada:** Refatorar as Storage Policies para exigir que a primeira pasta do path seja o ID do usuário: `AND (storage.foldername(name))[1] = auth.uid()::text`.

---

## 4. Vazamento de Métricas e Infraestrutura (Information Disclosure)
- **Status:** 🟠 Alto
- **Prioridade:** P1
- **Evidências encontradas:** 
  No arquivo `apps/api/src/routes/health.ts`, o endpoint `/metrics` não possui o middleware `requireAuth`, e `/health/ready` relata o uptime e o estado do sistema.
- **Impacto:** Usuários anônimos na web conseguem consultar livremente e mapear o pico de CPU, memória RAM alocada e o tempo de inicialização da infraestrutura do servidor, facilitando engenharia reversa para DDoS.
- **Como reproduzir:** Acessar `http://api.../health` e `/metrics` no navegador via rota GET sem nenhum Header de Authorization.
- **Correção recomendada:** Adicionar `{ preHandler: requireAuth }` nas métricas do servidor, permitindo que apenas administradores as acessem.

---

## 5. Dependências de Sistema Vulneráveis 
- **Status:** 🟡 Médio
- **Prioridade:** P2
- **Evidências encontradas:** 
  O uso do `pnpm audit` identificou falhas no ecossistema (6 vulnerabilidades, incluindo `fastify` DoS [GHSA-mrq3-vjjr-p77c] e `fast-uri` de host confusion).
- **Impacto:** Potencial bloqueio de rotas Fastify em ataques DDoS de baixo esforço através de alocações ilimitadas em memória (`sendWebStream`).
- **Como reproduzir:** Rodar comando `pnpm audit`.
- **Correção recomendada:** Rodar comando `pnpm update` e assegurar que as versões do core estão atualizadas.

---

## Conclusão da Auditoria de Segurança

**Nota de Segurança: 40/100**

**Riscos Restantes:**
Embora as rotas possuam verificação de JWT padronizada e as transações ocorram com proteção anti-DDoS, a exposição do Supabase Storage e Webhook Financeiro inviabilizam o deploy em seu estado atual. A infraestrutura possui brechas primárias na validação de Variáveis de Ambiente no bootstrap.

**Critérios para aprovação:**
A plataforma só ganhará a pontuação mínima de Go Live após todos os riscos (P0 e P1) serem sanados via refatoração. Nenhuma vulnerabilidade Crítica ou Alta restará no sistema após as correções indicadas.
