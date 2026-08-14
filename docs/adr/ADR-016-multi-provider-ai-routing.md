# ADR-016: Multi-Provider AI Routing Governed by Superadmin

## Context
A plataforma Achadinhos em Minutos começou com uma integração exclusiva com o Gemini para inteligência artificial. Com o avanço das funcionalidades (CreativeStudio, geradores de vídeo, agentes especialistas), a dependência de um único provedor tornou-se um risco de negócio e uma limitação técnica. Adicionalmente, precisávamos de um mecanismo para permitir configurações dinâmicas de IAs em tempo real sem redeploys, mantendo rigoroso controle de acesso e sigilo das chaves de API.

## Decision
Adotamos uma arquitetura "Multi-Provider AI" suportada por Roteamento Global (AI Router) e Governança Estrita (Superadmin Role).

### Provider / Model / Capability Separation
Separamos os conceitos em três camadas persistidas no banco de dados (`ai_providers`, `ai_provider_models`, `ai_capability_routes`):
- **Provider**: A identidade lógica da IA (ex: Gemini, OpenAI, Runway).
- **Model**: A versão específica alocada no provider (ex: `gemini-1.5-pro`, `gpt-4o`).
- **Capability**: O domínio de problema que a IA resolve (`structured-generation`, `image-generation`, etc).

### Global Routing e Fallback Policy
Introduzimos o `AIRouterService`, que não orquestra lógicas de negócios, mas age como um Resolver. Ele consulta as rotas de `capability` no banco de dados, resolve qual provider/model primário deve ser acionado, e em caso de falhas específicas (rate limits, timeouts), chaveia automaticamente para um fallback predefinido na malha.

### Superadmin `platform_role`
Criamos uma autorização global `platform_role = 'superadmin'` injetada na tabela `profiles`. Ela é protegida no banco de dados por:
- Constraint CHECK garantindo apenas `'superadmin'` ou `NULL`.
- Trigger SQL que impede mutação via payloads normais de usuários (`authenticated`).
Apenas chaves Service Role podem atribuir esse papel, blindando o sistema contra self-promotion.

### Credential Encryption e Resolver
Credenciais de IAs (como chaves de API) não trafegam pela API REST e não ficam em plaintext.
- São cifradas em AES-256-GCM via `AICryptoService` e armazenadas em `ai_provider_credentials`.
- A chave mestra de criptografia (`ENCRYPTION_KEY`) no ambiente é obrigatoriamente um buffer de exatos 32 bytes em Base64, garantindo entropia total.
- O `AICredentialResolver` lê o banco, decifra o conteúdo de forma isolada, e alimenta o `AIProviderRegistry` na inicialização do serviço.

### Legacy Gemini ENV Transition
Para manter a retrocompatibilidade com a base legada, o Gemini Provider ainda aceita chaves via `process.env.GEMINI_API_KEY` se a configuração no banco não for encontrada.

## Security Consequences
- **Vazamento evitado**: Os DTOs de leitura de Providers nunca transmitem a chave decifrada, apenas um `credentialConfigured` boolean.
- **Fail-closed**: O sistema foi padronizado em "deny all" por RLS (Row Level Security). O frontend normal não tem acesso às tabelas. Tudo flui via chamadas com Superadmin authorization.
- **Auditoria de Criptografia**: Chaves estritas, payloads inalteráveis (via AuthTag do GCM) e proteção nativa de inicialização.

## Alternatives Considered
- Usar HashiCorp Vault para guardar credenciais: Adicionaria muita complexidade e custos infraestruturais neste estágio. A criptografia AES no banco resolve com menor atrito.
- Manter chaves configuradas hardcoded: Prejudica a escalabilidade e amarra o onboarding de IAs.

## Deferred Work
- Implementação real das SDKs (OpenAI, Runway) foi adiada (registrados apenas arquiteturalmente).
- Integração ponta-a-ponta do Router no `CreativeIntelligenceService` e Studio (será realizado na Fase 2.2).
- Construção do Painel Administrativo frontend (Superadmin UI) para editar essas configurações visualmente.
