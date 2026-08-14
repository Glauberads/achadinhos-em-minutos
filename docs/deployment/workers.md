# Gerenciamento de Workers

A arquitetura utiliza o padrão **Processamento Assíncrono via Filas (BullMQ + Redis)**. Isso significa que tarefas pesadas ou sujeitas a lentidão externa nunca devem bloquear o *Event Loop* da API principal. 

Em produção, os processos de fila (Workers) rodam em instâncias Docker/Nixpacks isoladas da API web. 

## Os 4 Workers Essenciais

Temos scripts unificados no `package.json` para levantar apenas a parte do código responsável pela fila desejada.

### 1. Creative Worker (`npm run start:creative-worker`)
- **Fila (Queue):** `creative-generation-queue`
- **Responsabilidade:** Gerenciar processos de raciocínio de IA, montagem de Storyboards complexos baseados em links de produtos, estruturação do json do Creative OS.
- **Risco:** Alto risco de timeout (As chamadas para o Gemini/OpenAI costumam demorar). Nunca rode dentro da API.

### 2. FFmpeg Worker (`npm run start:ffmpeg-worker`)
- **Fila (Queue):** `creative-render-queue`
- **Responsabilidade:** Consumir o estado preparado pela etapa criativa e de fato invocar o `fluent-ffmpeg` no binário Linux do `ffmpeg` para unir, cortar, sobrepor textos (Drawtext), adicionar áudio e renderizar o artefato final (`.mp4`).
- **Risco:** Máximo consumo de CPU e RAM. Necessário rodar em uma máquina mais parruda se a demanda for alta. O Dockerfile requer instalação do ffmpeg nativo do sistema operacional.

### 3. Campaign Worker (`npm run start:campaign-worker`)
- **Fila (Queue):** `campaign-queue`
- **Responsabilidade:** Web scraping ético ou consumo de APIs lentas de lojas online para extração de meta-dados de produtos.

### 4. Telegram Worker (`npm run start:telegram-worker`)
- **Fila (Queue):** `telegram-queue`
- **Responsabilidade:** Disparar mensagens, imagens e vídeos prontos para canais do Telegram sem sobrecarregar a API web (Evita timeouts caso a API do Telegram esteja lenta e processa os Retry adequadamente).

## Escala e Balanceamento Horizontal
Caso a infraestrutura sinta que há vídeos pendentes por muito tempo, a única alteração necessária é ir ao painel do Railway e aumentar as "Replicas" do **FFmpeg Worker** de 1 para 3. O BullMQ (Redis) se encarregará automaticamente de distribuir os jobs uniformemente sem duplicação ou necessidade de configuração de rede adicional (basta todos compartilharem a mesma `REDIS_URL`).
