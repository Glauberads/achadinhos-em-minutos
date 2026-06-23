# Contexto do Sistema - Achadinhos em Minutos

Este documento define o escopo técnico, arquitetura e estado atual do sistema SaaS "Achadinhos em Minutos". Ele serve como guia primário para novos desenvolvedores ou IAs entenderem rapidamente a stack e as regras de negócio.

## 1. O que é o projeto?
O "Achadinhos em Minutos" é um SaaS B2B2C para "garimpeiros" de ofertas e afiliados digitais. Ele automatiza a rotina de buscar produtos promissores em marketplaces (Shopee e Mercado Livre), gerenciar links de afiliados e disparar notificações ricas (com foto, texto persuasivo e CTAs) para canais e grupos de audiência no Telegram.

## 2. Stack Tecnológica
- **Frontend (SPA):** React 18, Vite, TypeScript, Tailwind CSS v4, React Router, Lucide React (ícones).
- **Backend (API):** Node.js, Fastify, TypeScript.
- **Banco de Dados & Auth:** Supabase (PostgreSQL 15+, Supabase Auth).
- **Gerenciamento de Pacotes:** npm, Monorepo leve (`apps/web`, `apps/api`).

## 3. Arquitetura de Segurança
- **RLS (Row Level Security):** Fortemente aplicado no PostgreSQL. A tabela `products` e `groups` é filtrada por `auth.uid() = user_id`.
- **Backend Soberano:** O Frontend nunca insere tokens críticos diretamente. A tabela `platform_connections` (que guarda o token de bot do Telegram) está trancada para o front. Apenas o backend (`apps/api`), através da `SUPABASE_SERVICE_ROLE_KEY`, possui permissão de leitura/gravação nela via endpoints seguros validados com JWT.
- **CORS e Middleware:** A comunicação entre front (Porta 5173) e back (Porta 3001) é validada por headers de autorização portando o JWT originado do Supabase Auth no client.

## 4. O que já foi entregue (Status Atual)

### Fase 1 (MVP Base) - CONCLUÍDO
- Setup do Supabase (Authentication e Tabelas essenciais).
- UI/UX Premium (Glassmorphism, Dark mode ready) via Tailwind.
- CRUD de Produtos (Listagem, Modal de Inserção, Deleção).
- Conexão Segura com Telegram API usando endpoint próprio de upsert.
- Endpoint de envio inteligente (`/api/telegram/test-send`) com fallback para `sendMessage` ou `sendPhoto` dependendo da URL da imagem.
- Dashboard dinâmico lendo agregações do banco.

### Fase 2 (Automação de Busca) - CONCLUÍDO
- Implementação de um Design Pattern `Provider` (`IProductProvider`) no backend para isolar as lógicas do Mercado Livre e Shopee.
- Tabela `product_search_jobs` para auditar pesquisas e quantidade de itens salvos.
- Endpoint público de busca para o ML (com filtro de relevância) e infraestrutura Mock/Fallback de alta fidelidade para Shopee (para lidar com pendências de chaves oficiais).
- Tela Front `/buscar-produtos` para preview e importação segura anti-duplicação (usando Unique Index Parcial no banco).

### Fase 4 (Motor de Automação & Filas) - CONCLUÍDO
- **Banco de Dados (Motor):** Criação das tabelas `campaigns`, `scheduled_posts` e `queue_locks` com Índice Único Parcial protegendo duplicação nativa na camada do banco.
- **Infraestrutura de Mensageria:** Configuração de Redis nativo pareado com BullMQ, separando a carga da API (porta 3001) dos Workers de Processamento (`npm run dev:workers`).
- **Worker 1 (Campaign Runner):** Cron/Jobs que escutam campanhas ativas, puxam de 10 em 10 produtos via Providers, inserem no BD de produtos e injetam posts agendados (`pending`). Valida a existência do `affiliate_link`.
- **Worker 2 (Telegram Sender):** Consome a fila isolada `telegram-send`, travando via Redis (Rate Limiter customizado por `group_id`) e efetuando o disparo final, salvando logs ricos (`send_logs`).
- **Frontend Premium:** Aba `/campanhas` criada para gestão de regras da máquina autônoma, validada com Empty States, skeletons e bloqueadores seguros de ação. Dashboard expandido para exibir fluxos do motor.

## 5. Próximos Passos Futuros (Fase 5+)
1. **Evolution API / WhatsApp:** Replicar a arquitetura da conexão de Telegram e os provedores de envio para instâncias de disparo do WhatsApp, com leitura via QR Code no Front.
2. **Integração de Contas Pagas / Assinaturas:** Limitar quantidades de Campanhas e Groups dependendo da camada do usuário logado (ex: Stripe ou Pagar.me).
