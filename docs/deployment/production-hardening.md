# Production hardening contract

## Reverse proxy

Traefik termina TLS e encaminha o tráfego para o Nginx do serviço `web` pela
network externa `proxy`. O Nginx serve a SPA e encaminha `/api/*` para a API sem
remover o prefixo. O Fastify mantém rotas canônicas de health tanto em `/health`
quanto em `/api/health` para checks internos e smoke tests através do Web.

## Readiness and liveness

`/health/live` verifica somente o processo HTTP. `/health/ready` exige uma
consulta bem-sucedida à tabela `profiles` e uma resposta literal `PONG` do Redis.
Falhas de dependência retornam HTTP 503 sem derrubar o liveness do container.

## Encryption compatibility

O CBC legado permanece disponível exclusivamente para ciphertext existente. Ele
continua derivando a chave com SHA-256 sobre o valor explicitamente configurado
em `ENCRYPTION_KEY`, preservando compatibilidade, mas não possui mais fallback.
O GCM de governança continua exigindo uma chave Base64 que decodifique para
exatamente 32 bytes. Ambos são carregados sob demanda; operações criptográficas
falham explicitamente se a configuração estiver ausente ou inválida.

Uma futura migração CBC para envelopes GCM deverá inventariar dados, oferecer
rollback e recriptografar registros de forma transacional. Nenhuma migração de
ciphertext faz parte desta fase.

## Redis durability

O stack usa seu próprio Redis fixado em `redis:7.4.5-alpine`, sem porta publicada.
AOF e o volume `redis_data` preservam filas BullMQ e cache entre reinícios. Esse
volume deve entrar no plano de backup e não deve ser compartilhado com outros
serviços da VPS.

## Environment boundaries

Somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` entram no estágio de build
do Web. Variáveis server-side e capability secrets permanecem exclusivamente no
runtime da API. Use `.env.production.example` como contrato e crie o arquivo real
fora do Git no host de produção.
