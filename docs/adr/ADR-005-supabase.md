# ADR-005: Supabase como Infraestrutura de Banco e Auth (BaaS)

## Metadados
- **Título:** Utilização do ecossistema Supabase para persistência, storage e auth
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
O projeto precisa armazenar milhares de arquivos de mídia (Vídeos MP4 pesados, imagens JSONs e templates), requer um sistema de autenticação sólido via JWT, e necessita de um banco relacional maduro para travar esquemas transacionais (Assinaturas e Criativos).

## Problema
- AWS Cognito, S3 e RDS exigem altíssimo esforço de DevOps com IaC (Terraform) apenas para amarrar quem pode ler qual arquivo e linha da tabela.
- Firebase não oferece queries SQL robustas nativas, engessando agregações de Dashboard.

## Alternativas Consideradas
1. **AWS Completa (RDS + S3 + Cognito):** Setup manual e descentralizado.
2. **Firebase (Google):** Base de dados em NoSQL (Firestore).
3. **Supabase:** Plataforma open-source construída sobre o PostgreSQL com Storage e Auth integrados.

## Decisão Tomada
Adotamos o **Supabase Cloud** (Alternativa 3) aliado ao gerenciamento local de migrations via `supabase-cli`.

## Justificativa
O Supabase encapsula o PostgreSQL 15+, nos dando as melhores ferramentas de modelagem e queries de junção. Ao mesmo tempo, ele gera a injeção nativa de Token de Autenticação nas chamadas de banco e de Bucket, permitindo usar as `Row Level Security (RLS)` para validar no próprio Kernel do banco quem pode fazer UPDATE numa imagem, em vez de criar middlewares gigantes no Fastify.

## Consequências Positivas
- Zero Backend para autenticação de Login/Senha/OAuth. O cliente React fala com o Supabase, recebe o JWT, e manda para o Fastify.
- RLS provê a proteção suprema para evitar que uma falha na lógica de acesso das Rotas HTTP vaze dados de clientes concorrentes.
- CLI oficial para empacotar tipos para TypeScript baseados nas tabelas existentes.

## Consequências Negativas
- Dependência do provedor (Vendor Lock-in no SDK e no ecossistema de APIs REST gerado pelo PostgREST, ainda que o banco subjacente seja Postgres puro).
- Storage buckets são fortemente atrelados ao sistema de Auth próprio deles.

## Trade-offs
Trocamos a neutralidade de nuvem por altíssima velocidade de validação (Market-Fit). Caso a plataforma expanda absurdamente, teremos a dor de extrair o Auth deles para algo self-hosted, mas o modelo relacional SQL pode ser perfeitamente migrado para a AWS via `pg_dump`.

## Impacto Futuro
Manteremos toda lógica transacional pesada encapsulada em Repositórios (veja ADR-001) para mascarar o forte acoplamento das bibliotecas de `.from()` da codebase, prevendo essa eventual dor de Lock-in.

## Links Relacionados
- [Documentação de Banco de Dados](../architecture/database.md)
