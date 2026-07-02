# Estrutura do Projeto (Project Structure)

> [!NOTE]
> Este documento detalha a taxonomia de pastas do Monorepo. Compreender essa estrutura garante que novos arquivos e módulos sejam criados nos lugares corretos.

## 1. Visão Macro (Root)

A plataforma utiliza o padrão de monorepo gerenciado via `pnpm workspaces`. O diretório raiz contém arquivos de configuração globais (`package.json`, `pnpm-workspace.yaml`, `.gitignore`) e as seguintes sub-árvores principais:

```
/ (Raiz)
├── apps/         # Aplicações principais (Frontend e Backend)
├── packages/     # Bibliotecas e pacotes compartilhados (se aplicável)
├── docs/         # Central Oficial de Documentação (esta pasta)
├── scripts/      # Scripts utilitários de manutenção, migração ou devops
└── supabase/     # Configurações, migrations, seeds e funções do banco de dados
```

## 2. Aplicações (`apps/`)

### 2.1 Backend (`apps/api/`)
Contém a API principal feita em Node.js com Fastify.
- **`src/`**
  - **`routes/`**: Controladores HTTP. Cada arquivo encapsula endpoints de um recurso (ex: `creatives.ts`).
  - **`services/`**: Camada de domínio onde vive a lógica de negócios pesada (ex: `creative-studio.service.ts`).
  - **`repositories/`**: Abstração do banco de dados. Os únicos arquivos autorizados a importar o cliente Supabase ou executar queries.
  - **`workers/`**: Processos em background (consumidores do BullMQ) que lidam com tarefas longas (render, disparos).
  - **`queues/`**: Definições das filas do BullMQ e produtores.
  - **`events/`**: Declarações dos `Domain Events` e barramento pub/sub local do Event Bus.
  - **`lib/`**: Ferramentas core e wrappers de terceiros (Supabase admin, instâncias Redis).
- **`package.json`**: Dependências específicas da API.

### 2.2 Frontend (`apps/web/`)
Contém o painel administrativo SPA do usuário. Criado com React e empacotado via Vite.
- **`src/`**
  - **`pages/`**: Componentes de visualização de alto nível atrelados diretamente a rotas (ex: `CreativeStudio.tsx`, `Dashboard.tsx`).
  - **`components/`**
    - **`ui/`**: Componentes atômicos e burros de interface (botões, modais, alertas) fortemente baseados no Tailwind e Lucide Icons.
    - **`<domain>/`**: Componentes complexos e específicos de um contexto de domínio (ex: `creative-studio/StoryboardEditor.tsx`).
  - **`lib/`**: Clientes HTTP e integrações genéricas. Onde vive a instância do axios `api.ts`.
  - **`contexts/`**: Contextos React para estado global (ex: `AuthContext`).
- **`vite.config.ts`**: Configurações de build do Vite.

## 3. Demais Diretórios

### 3.1 Infraestrutura de Banco (`supabase/`)
Qualquer modificação na estrutura relacional do sistema deve passar por aqui.
- **`migrations/`**: Onde residem os arquivos `.sql` históricos e incrementais para versionar o schema do banco de dados.
- **`seed.sql`**: Dados pre-preenchidos para testar a aplicação localmente.
- **`config.toml`**: Configuração do runtime local do Supabase.

### 3.2 Documentação (`docs/`)
A Fonte Única da Verdade. Repositório de Markdown.
- **`architecture/`**: Como o sistema foi projetado e como funciona.
- **`adr/` (Futuro)**: Architecture Decision Records. Para registrar "por que" escolhemos a tecnologia A em vez da B.
- **`specs/` (Futuro)**: Especificações e regras de negócio puras para features futuras.
- **`playbooks/` (Futuro)**: Guias de resolução de problemas frequentes para SRE.

### 3.3 Ferramental (`scripts/`)
Scripts genéricos escritos em Bash, Node ou Python usados para automação do ciclo de vida, deploy, seed customizado, limpeza de banco local, ou testes unitários de carga. Evite colocar regras de negócios dentro de scripts de raiz.
