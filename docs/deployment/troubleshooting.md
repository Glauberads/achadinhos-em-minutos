# Troubleshooting Avançado

## Problemas Comuns

### 1. `Worker is failing` ou Vídeos não geram
**Sintoma:** Os vídeos ficam travados em `rendering` no frontend ou falham instantaneamente sem erro legível.
**Solução:**
- Verifique os Logs do serviço *FFmpeg Worker* no Railway.
- Se o erro for `ffmpeg is not installed`, certifique-se que o Dockerfile foi utilizado ou o `nixpacks.toml` está ativo instalando pacotes do SO.

### 2. Memória Estourando / API caindo (OOM - Out of Memory)
**Sintoma:** Fastify exibe status de restart e a métrica de memória atinge 100% no Railway.
**Causa:** Um processamento de Renderização de Vídeo ou Upload gigante rodou DENTRO do processo da API ao invés do Worker.
**Solução:**
- Revise as chamadas. A API só deve despachar `bullMQConnection.add(...)`.
- Aumente a memória dos Workers independentemente da API (A API pode ter 512mb de RAM, enquanto o FFmpeg Worker deve ter no mínimo 2GB RAM).

### 3. Redis Timeout ou OOM (O Redis Travou)
**Sintoma:** Todo o sistema enfileira, a API loga `/health` `degraded` e os jobs dão timeout.
**Solução:** 
- Conecte no Redis via CLI ou painel do Railway e acione o comando `FLUSHALL` se for em homologação.
- Em produção, limpe manualmente os jobs pendentes da fila (utilize o RedisInsight).

### 4. Erros 405 ou CORS no Frontend
**Sintoma:** Falha na aba de networking do navegador informando Method Not Allowed ou CORS.
**Solução:**
- A variável `CORS_ORIGINS` na nuvem deve listar a exata URL do frontend SEM a barra no final (`/`).
- O frontend deve estar acessando a API através de `VITE_API_URL` e não uma rota relativa (`/api/...`).
