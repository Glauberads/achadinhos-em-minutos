# Relatório de Performance Inicial (Pré-V3)

## Objetivo
Este relatório documenta as métricas extraídas antes da aplicação das otimizações arquiteturais da V3. O sistema atualiza o Supabase e gera criativos utilizando Gemini e FFmpeg.

## Benchmarks de Execução (Baseline)

### Frontend (SPA - React)
- **First Contentful Paint (FCP):** ~0.8s
- **Time to Interactive (TTI):** ~1.2s
- **Bundle Size Inicial:** ~981KB (gargalos identificados com assets e dependências grandes em chunk único, ex: lucide-react sem split).
- **Network Requests por Ação:** O painel de *Creative Studio* atualmente utiliza *polling* agressivo de 10 em 10 segundos, causando um overhead substancial (N requests por minuto por usuário).

### Backend (Node/Fastify)
- **Latência Média Endpoints Padrão:** ~45ms.
- **Requisições ao Supabase:** Ineficientes em alguns endpoints devido a falta de memoização e caching de sessão. A rota `/creatives` não está cacheada e faz request toda vez no banco de dados.

### Processamento Assíncrono (BullMQ & FFmpeg)
- **Tempo Médio Fila (Wait Time):** ~200ms
- **Tempo de Inteligência Artificial (Gemini):** ~3.5s a 5.0s por execução síncrona dentro do `creative-planner.service`. O usuário atualmente aguarda a IA terminar para só então a API responder. Esse é um gargalo percebido na UX.
- **Tempo Médio FFmpeg (Render):** O comando `ffmpeg` concatenando imagens e aplicando filtros (Zoom/Pan) demora em média ~12.5s para um vídeo de 15 segundos no Worker. Sem aceleração de hardware otimizada via libx264 padrão.
- **Upload Storage:** ~1.5s após a renderização.

## Pontos Críticos e Gargalos
1. A IA roda sincronicamente no fluxo HTTP, segurando a request.
2. FFmpeg pode ser tunado (`-preset ultrafast`, `-threads`).
3. O Polling constante no frontend gera muito tráfego no banco (N+1 oculto nas conexões).
4. Bundle do Vite não tem Code Splitting fino.

A meta da V3 é reduzir o TTI, implementar Webhooks/SSE em vez de polling, ou apenas polling condicional via SWR, e otimizar as threads do worker.
