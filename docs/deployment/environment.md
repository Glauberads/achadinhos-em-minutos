# Variáveis de Ambiente (Configuração Segura)

A aplicação gerencia configurações estritamente através do ambiente (`process.env`). Nenhuma chave secreta deve ser salva em código.

> [!WARNING]
> Nunca "commite" o arquivo `.env` para o Git e certifique-se de copiá-las corretamente no painel de sua nuvem.

### Grupo Core
* `NODE_ENV`: Define o ambiente (`production` ou `development`). O `logger` ajusta seu formato baseado nisto (json vs pretty).
* `PORT`: A porta em que o Fastify vai ser exposto. No Railway será sobrescrito dinamicamente pela nuvem.
* `LOG_LEVEL`: Define a verbosidade do `pino` (`info`, `debug`, `error`, `fatal`). Recomendamos `info` em produção.

### Grupo Supabase
* `SUPABASE_URL`: A URL do seu banco/API no Supabase (Ex: `https://abcd.supabase.co`).
* `SUPABASE_SERVICE_ROLE_KEY`: A chave mestre e secreta. Usada pelo backend para bypass das regras de acesso RLS. Nunca exiba isso publicamente.

### Grupo Redis e Filas
* `REDIS_URL`: URL completa gerada pelo Railway Redis. (Ex: `redis://default:senha@monorail.proxy.rlwy.net:1234`). É vital para que o BullMQ consiga rotear os jobs pros Workers.

### Grupo Integrações 
* `GEMINI_API_KEY`: Utilizado pelo Creative Worker para elaboração do Storyboard via Vertex/Studio.
* `OPENAI_API_KEY`: (Opcional, futuro) Fallback ou roteamento alternativo LLM.
* `BOT_TOKEN`: Utilizado pelo Telegram Worker para conectar e disparar mensagens na rede do Telegram.

### Grupo Financeiro (Asaas)
* `ASAAS_API_KEY`: API Key para criação de clientes e assinaturas.
* `ASAAS_WEBHOOK_TOKEN`: Token de segurança recebido no header do webhook via Asaas, a API validará `req.headers['asaas-access-token']` contra essa variável.
* `ASAAS_ENV`: (`production` ou `sandbox`)

### Grupo Segurança e Rede
* `CORS_ORIGINS`: origens exatas separadas por vírgula. Em produção deve incluir `https://app.achadinhos.builderfy.com.br`. Wildcard não é aceito porque a API habilita credenciais.
