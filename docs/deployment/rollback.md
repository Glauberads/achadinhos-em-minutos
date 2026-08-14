# Procedimentos de Rollback e Recuperação de Falhas

Em produção (Enterprise), o princípio de falha tolerante estabelece que voltar para uma versão anterior nunca deve quebrar o banco de dados.

## 1. Rollback de Código (Deploy na Railway)
Se um deploy automático quebrar o sistema (e não for barrado pela fase de build do Railway), faça o rollback imediatamente:
1. Acesse o projeto na Railway.
2. Clique no **Serviço da API** e vá até a guia **Deployments**.
3. Localize o último deploy "Verdinho" (Success) com o qual tudo estava funcionando.
4. Clique nos três pontinhos (`...`) à direita do deploy.
5. Selecione **"Redeploy"** ou **"Revert to this version"**.
6. **ATENÇÃO:** Lembre-se de repetir este processo para todos os **Workers** que também atualizaram simultaneamente.

## 2. Rollback do Banco de Dados (Supabase)
Migrations nunca devem ser deletadas ou desfeitas levianamente em produção. 
- Sempre escreva migrations "Forward-Only" (Ao invés de deletar uma coluna antiga, crie uma nova e faça o script migrar os dados no próprio SQL).
- Se houver perda maciça, o Supabase mantém PITR (Point-In-Time Recovery) se você ativar o plano PRO. Vá na aba `Database > Backups` e recupere o momento exato em que o desastre ocorreu.

## 3. Desastre Total de Região (Railway Caiu)
Se toda a infraestrutura do provedor primário falhar, temos os containers prontos e as documentações `.env.example` prontas.
1. Crie uma conta no `Render.com`.
2. Aponte para o GitHub.
3. Suba uma instância de Redis no Render ou Upstash.
4. Utilize o `Dockerfile` gerado para provisionar `start:api` e os workers.
5. Altere o DNS `api.achadinhos.builderfy.com.br` no Cloudflare apontando para o CNAME do Render. A replicação costuma demorar menos de 2 minutos pelo Cloudflare Proxy.
