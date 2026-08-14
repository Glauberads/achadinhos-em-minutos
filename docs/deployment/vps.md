# Guia de Deploy em VPS — Achadinhos em Minutos

Este guia descreve como realizar o deploy do monorepo "Achadinhos em Minutos" em uma VPS Linux de Produção usando Docker e Docker Compose.

## 1. Pré-requisitos na VPS

*   **Linux** (Ubuntu 22.04+ ou Debian 12+) recomendado.
*   **Docker** e **Docker Compose** instalados.
*   Domínio apontado para o IP da VPS.
*   Reverse Proxy (ex: Nginx, Traefik, Caddy) para gerenciar certificados SSL/TLS (HTTPS).

## 2. Preparação do Ambiente

1.  Clone o repositório na VPS:
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO> achadinhos
    cd achadinhos
    ```

2.  Configure as variáveis de ambiente. Copie os arquivos de exemplo e preencha com os dados reais de produção:
    ```bash
    cp apps/api/.env.example apps/api/.env
    # (Se existir web .env customizado)
    ```
    > [!IMPORTANT]
    > **Atenção:** Certifique-se de configurar corretamente `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, e `REDIS_URL`. A `REDIS_URL` deve apontar para o container Redis (ex: `redis://redis:6379`). O frontend não precisa de configuração pois o roteamento é automático por Nginx reverso (`/api` → `api:3001`). Nunca insira credenciais reais diretamente neste guia ou controle de versão!

## 3. Arquitetura Docker Compose e Topologia de Produção

O arquivo `docker-compose.yml` raiz define três serviços principais:
*   **redis:** O banco de dados em memória. Isolado na rede interna e **não exposto publicamente**.
*   **api:** O backend Fastify (Node.js). Aguarda conexões na porta 3001 **somente dentro da rede Docker** e **não possui bind/porta pública**.
*   **web:** O frontend SPA (Vite/React) servido via container Nginx otimizado. **Único entrypoint do stack na porta 80 do host**. Realiza o reverse proxy de chamadas `/api` internamente para a API.

```text
Internet
   ↓
Host Reverse Proxy / TLS (Caddy, Nginx, Traefik - a ser configurado)
   ↓
Web Container (:80 publicado)
   ├── /      → SPA
   └── /api   → API Container (:3001)
                  ↓
                Redis Container (:6379)
```

## 4. Build e Deploy

Execute o seguinte comando na raiz do projeto para construir e iniciar os containers em background:

```bash
docker compose up -d --build
```

A API aguardará o Redis ficar online antes de aceitar requisições.

## 5. Endpoints de Healthcheck

Para monitorar e verificar a saúde da plataforma, as seguintes rotas baseadas na especificação de Liveness e Readiness estão ativas sob o path `/api`:

*   `/health/live` = **Liveness** (Retorna 200 se a API e o Processo do Node estiverem vivos. Usado pelo Docker Engine).
*   `/health` = **Readiness** (Retorna 200 apenas se todas dependências obrigatórias como DB e Redis estiverem ok; senão 503).
*   `/health/ready` = **Readiness** (Idêntico ao de cima, compatibilidade K8s).

## 6. Gerenciamento e Logs

Para verificar logs da aplicação:
```bash
docker compose logs -f api
```

Para parar os serviços (sem destruir dados):
```bash
docker compose down
```
> [!CAUTION]
> NUNCA utilize `docker compose down -v` em produção a não ser que tenha intenção de destruir todos os volumes de cache permanentemente.

## 7. Considerações de Segurança (Produção)

*   **Reverse Proxy Externo:** Em produção, as portas do Docker (como a 80) deverão ser escudadas atrás de um Gateway TLS local (Let's Encrypt). O método será decidido na VPS.
*   **Segredos backend:** Absolutamente NENHUM segredo entra no bundle SPA compilado. Nenhuma variável `SUPABASE_SERVICE_ROLE_KEY` e afins é exposta em `/dist`.
*   **Isolamento:** A API executa com usuário restrito `appuser` e se encerra elegantemente ao receber sinais de SO (`SIGTERM` - Graceful Shutdown).
