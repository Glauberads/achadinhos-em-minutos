# Guia de Deploy no Railway

Este guia apresenta o passo a passo completo para o provisionamento e deploy de toda a arquitetura de backend da plataforma Achadinhos em Minutos na Railway.app.

## 1. Criação do Projeto e Banco de Dados (Redis)
1. Acesse o painel da [Railway](https://railway.app/).
2. Clique em **New Project** -> **Deploy from GitHub repo**.
3. Selecione o repositório (`Glauberads/achadinhos-em-minutos`).
4. Inicialmente, o Railway criará apenas um serviço.
5. No painel do seu projeto recém criado, clique em **+ New** e escolha **Database** -> **Add Redis**.

## 2. Configurando o Serviço da API Principal
O serviço inicialmente criado apontando para o seu GitHub será a nossa **API**.
1. Clique sobre o serviço da API e vá em **Settings**.
2. Em **Build**, escolha o **Dockerfile** em `apps/api/Dockerfile` (se a Railway não detectar o multi-stage build via Nixpacks automaticamente, recomendamos Docker).
3. Em **Start Command**, defina explicitamente: `npm run start:api`
4. Na aba **Variables**, clique em **Raw Editor** e cole todas as variáveis listadas no arquivo [environment.md](./environment.md) (incluindo o URL gerado automaticamente pelo Redis recém provisionado).

## 3. Criando os Serviços de Workers (Isolamento)
Como precisamos de 4 processos isolados para evitar consumo desgovernado de CPU na API principal, criaremos "Réplicas" lógicas focadas apenas nos workers.

Para **cada Worker** listado em [workers.md](./workers.md) (Creative, FFmpeg, Campaign, Telegram), execute os passos abaixo:
1. No seu Projeto no Railway, clique em **+ New** -> **GitHub Repo** e adicione seu repositório *de novo*.
2. Renomeie o serviço gerado para, por exemplo, `FFmpeg Worker`.
3. Vá em **Settings** -> **Build** e mantenha a mesma configuração (Dockerfile de `apps/api/Dockerfile`).
4. Vá em **Start Command** e troque para o worker específico. Ex: `npm run start:ffmpeg-worker`.
5. Vá em **Variables** e copie e cole as *mesmas* variáveis de ambiente usadas na API principal.

## 4. Configurando Domínio Público
1. Vá na sua **API** -> aba **Settings**.
2. Na seção **Domains**, clique em **Custom Domain**.
3. Adicione `api.achadinhos.builderfy.com.br`.
4. O Railway exibirá um registro **CNAME** para você adicionar no seu painel DNS (Cloudflare).
5. Após o apontamento, a API ficará online e com HTTPS configurado automaticamente via TLS do Railway.
   *Aviso: Você NÃO deve adicionar domínios públicos nos serviços de Worker, pois eles rodam 100% internos conectados ao Redis.*

## 5. Healthcheck Automático
Na API (Settings > Deploy > Healthcheck), configure:
- **Path**: `/health/live`
- **Timeout**: 5s

Assim, o Railway entenderá que a API congelou caso ela não responda a esta rota super-rápida (não bate no banco de dados).
