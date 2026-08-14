# Playbook de Disaster Recovery (DR)

Este documento dita as normas e procedimentos de recuperação de falhas catastróficas (Perda de Datacenter, Corrupção de Banco de Dados ou Exclusão Acidental) na infraestrutura de Produção.

## Objetivos de Recuperação

| Indicador | Objetivo (Plano) | Justificativa |
| :--- | :--- | :--- |
| **RPO** (Recovery Point Objective) | **Max 5 minutos** | O Supabase Pro mantém *Point-in-Time Recovery* (PITR) permitindo a restauração granular de dados até os últimos minutos antes da falha. |
| **RTO** (Recovery Time Objective) | **15 minutos** | A infraestrutura inteira do Backend/Workers é declarativa (`Dockerfile`/`nixpacks`). Restaurá-los em qualquer provedor de Cloud leva o tempo de clonar o Git e gerar o Docker Build. |

---

## Procedimentos por Serviço Atacado / Caído

### 1. Supabase (PostgreSQL Central)
- **Cenário:** Deleção acidental de dados, ataque de ransomware no banco, ou migração destrutiva.
- **Restauração:**
  1. Acesse o Dashboard do Supabase.
  2. Vá até `Database` > `Backups` > `Point-in-Time Recovery`.
  3. Selecione o minuto/hora exato ANTES do incidente (ex: `14:32 BRT`).
  4. Clique em *Restore*. O banco original ficará inativo por alguns instantes e os dados serão reinjetados. 
  5. Caso a região do AWS que hospeda o Supabase caia por completo, a equipe de infra deve restaurar o backup físico diário gerado na Cloud concorrente.

### 2. Redis (Fila e Cache)
- **Cenário:** Redis estourou a memória (OOM), travou as conexões ou apagou seus dados.
- **Restauração:**
  - O Redis nesta arquitetura **é volátil (Non-Persistent)**. Ele não guarda dados insubstituíveis, apenas jobs em andamento e rate-limits.
  - Para recuperar, basta reiniciar o Container do Redis na plataforma (Railway) ou conectar via CLI e disparar um `FLUSHALL`.
  - Trabalhos de renderização e campanhas perdidos no Redis não prejudicam as transações financeiras, os usuários poderão reagendá-los normalmente após o sistema voltar.

### 3. Railway (API e Workers)
- **Cenário:** O Railway.app inteiro ficou offline globalmente ou baniu a conta.
- **Restauração (Tempo Máx 15 mins):**
  1. Criar conta em outra Cloud Serverless Docker (Ex: Render.com ou Fly.io).
  2. Conectar ao Github (`Glauberads/achadinhos-em-minutos`).
  3. Subir o `apps/api/Dockerfile`.
  4. Clonar esse App 4x para representar os workers (FFmpeg, Telegram, Creative, Campaign), definindo o *Run Command* correspondente (ex: `npm run start:ffmpeg-worker`).
  5. Copiar as chaves do `environment.md` salvas localmente/no cofre de senhas da empresa.

### 4. Cloudflare (DNS / Proxy)
- **Cenário:** Cloudflare cai ou sequestro de conta DNS.
- **Restauração:**
  - O DNS pode ser migrado temporariamente para o AWS Route53 ou Vercel. 
  - Alterar no registrador (Ex: Registro.br ou GoDaddy) os `Name Servers` para a nova nuvem e reconstruir as chaves de CNAME (`api.achadinhos...`) para onde os apps estiverem rodando.

### 5. Storage (Imagens e Vídeos)
- **Cenário:** Exclusão em massa de assets ou bucket deletada.
- **Restauração:**
  - Acionar o suporte do Supabase imediatamente com urgência máxima se a exclusão for de interface. Se os dados em disco na AWS S3 que sustenta o Supabase forem apagados, o Recovery passará a depender da política de backups cruzados estipulados no Contrato Enterprise. É recomendado ativar regras de retenção contra deleção (`S3 Object Lock`) no futuro.

### 6. Feature Flags
- **Cenário:** Ativação de uma Flag global (`new_dashboard`, `ai_rendering`) quebrou imediatamente o banco de dados em todos os clientes e os administradores não conseguem acessar o portal.
- **Restauração:**
  - Como o próprio acesso ao Painel Admin pode estar quebrado, recuperar rodando a query via SQL Editor do Supabase:
    ```sql
    UPDATE feature_flags SET is_enabled = false WHERE key = 'nome_da_flag_problematica';
    ```
