# Manual de Go-Live (Deploy Final)

O Go-Live é a etapa onde o sistema deixa o ambiente estéril (Local/Homologação) e é aberto ao tráfego do cliente real. Todos os dados fictícios devem ser expurgados.

## 1. Expurgo do Banco de Dados (Seed Limpo)

O Supabase guarda lixo de testes (usuários fakes, campanhas mockadas). No dia do Go-Live, execute o Reset Geral pelo CLI.

```bash
npx supabase db reset --linked
```
*(Cuidado: este comando limpa o banco de dados e roda as migrations do zero. Certifique-se de que nenhum cliente Beta já tenha dados reais.)*

Se não quiser resetar tudo, exclua via SQL Editor as tabelas de Logs e Eventos:
```sql
DELETE FROM public.audit_logs;
DELETE FROM public.scheduled_posts;
```

## 2. Configurando o Cloudflare Pages (Frontend)

1. Faça login na Cloudflare > Pages > Criar Projeto > Conectar Git.
2. Selecione o Repositório `Achadinhos em Minutos`.
3. Definições do Build:
   - Framework: `Vite` (ou `React`)
   - Build Command: `npm run build`
   - Build Output: `dist`
4. Vá em **Environment Variables (Production)** e inclua o endereço da API que está rodando no Railway:
   - `VITE_API_URL=https://api.achadinhos.com.br`
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`

## 3. Configurando o Railway (Backend)

1. Faça login no Railway > New Project > Deploy from Repo.
2. Crie 3 serviços diferentes usando o MESMO repositório:
   - Serviço 1: **API Gateway**
     - Build: `Dockerfile`
     - Start Command: `npm run start:api`
     - URL Pública: Ativada
   - Serviço 2: **Worker Creative (FFmpeg)**
     - Build: `Dockerfile`
     - Start Command: `npm run start:creative-worker`
     - URL Pública: Desativada (Internal apenas)
   - Serviço 3: **Worker Campaign**
     - Build: `Dockerfile`
     - Start Command: `npm run start:campaign-worker`
     - URL Pública: Desativada
3. Crie um **Redis Service** no Railway pelo botão "New > Database > Redis".
4. Vá em *Variables* no Railway em todos os serviços criados e adicione a referência para a URL de Conexão desse Redis e as Chaves do Supabase.

## 4. O Dia Zero (Virada de Chave)

1. **Alterar as credenciais da Asaas:** Tire o sistema do Sandbox (`asaas.com.br/api/v3`) e coloque as URLs de produção.
2. **Teste de Compra Oculto:** Crie um plano oculto de R$ 1,00. Compre você mesmo com um cartão de crédito. Confirme se o Webhook funcionou e se a assinatura foi ativada.
3. **Mudança de DNS (A):** No Registro.br, direcione o Domínio `achadinhos.com.br` para o Proxy da Cloudflare Pages.
4. **Remoção de Feature Flags Experimentais:** Acesse o Supabase e desabilite flags que ainda estão instáveis.
5. **Divulgação do Link.**

## Bem vindo à Produção. O Go Live está concluído!
