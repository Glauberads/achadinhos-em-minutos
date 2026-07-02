# ADR-001: Adoção do Repository Pattern para Isolamento de Dados

## Metadados
- **Título:** Isolamento de consultas ao banco via Repository Pattern
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
O projeto "Achadinhos em Minutos" começou com a arquitetura Backend-For-Frontend em Fastify interagindo diretamente com o Supabase. Inicialmente, o objeto `supabase.from('...')` era invocado livremente nas rotas HTTP para acelerar o desenvolvimento. Com a expansão para Serviços de Inteligência Artificial e múltiplos Workers em background consumindo as mesmas tabelas, o espalhamento das lógicas SQL e RLS tornou-se incontrolável.

## Problema
- Consultas complexas sendo duplicadas nas Rotas e nos Workers.
- Impossibilidade de testar (Mock) a lógica de negócios porque ela estava fortemente acoplada à leitura de banco.
- Insegurança na passagem do Token JWT, onde rotas poderiam acidentalmente vazar a `service_role` (Admin Key) se não houvesse rigor.

## Alternativas Consideradas
1. **Padrão Active Record (Prisma/TypeORM):** Migrar totalmente de chamadas SDK do Supabase para um ORM pesado como Prisma.
2. **Repository Pattern sobre o SDK Nativo:** Continuar utilizando `@supabase/supabase-js`, mas enclausurar toda leitura e escrita em classes Repository que exportam apenas DTOs e escondem a string das tabelas.
3. **Deixar como estava:** Aceitar a dívida técnica.

## Decisão Tomada
Decidimos adotar estritamente o **Repository Pattern (Alternativa 2)**. 
- Nenhum arquivo dentro de `src/routes/` ou `src/services/` tem permissão de importar o cliente do Supabase e encadear consultas `.from()`.
- Toda consulta ocorre em `src/repositories/*.repository.ts`.
- O Repositório é passivo: O cliente Supabase (`req.supabase` logado, ou `supabaseAdmin` para workers) deve ser repassado pelo chamador. O repositório não fabrica a conexão.

## Justificativa
O SDK do Supabase já é muito similar a um query builder elegante. Colocar um ORM inteiro em cima do Supabase nos faria perder o poder de Row Level Security (RLS) herdado no JWT. Isolando no Repository Pattern, ganhamos testabilidade sem perder a integração nativa com o BaaS.

## Consequências Positivas
- Testes unitários de regras de negócio (Services) tornaram-se imediatos, bastando mockar a saída do Repositório.
- A segurança RLS foi centralizada.
- Queries monstruosas que puxam tabelas relacionadas desapareceram dos Controllers.

## Consequências Negativas
- Aumento da verbosidade. Inserir uma linha agora exige criar a rota, atualizar o service e mapear o método no repositório.

## Trade-offs
Trocamos a *velocidade absoluta de prototipação* pela *consistência arquitetural de médio/longo prazo*. O custo de boilerplate compensa a prevenção de refatoração futura.

## Impacto Futuro
Se amanhã o projeto migrar do Supabase Cloud para um PostgreSQL purista na AWS (RDS) gerenciado via Drizzle/Prisma, toda a alteração acontecerá estritamente na pasta `/repositories`, sem quebrar 1% dos fluxos de AI e Controllers.

## Links Relacionados
- [Coding Standards](../architecture/coding-standards.md)
