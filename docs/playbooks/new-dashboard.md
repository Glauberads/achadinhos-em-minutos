# Playbook: Criar Nova Dashboard Analítica

- **Status:** Stable
- **Versão:** 1.0.0
- **Última Atualização:** 01/07/2026

## 1. Quando utilizar
Utilize quando precisar agregar e exibir visualizações de dados pesados, gráficos (Line, Bar) ou relatórios massivos no painel do administrador ou do usuário final.

## 2. Arquivos envolvidos
- `supabase/migrations/[Migration_com_RPC].sql`
- `apps/web/src/pages/Dashboards/[Nome].tsx`
- `apps/api/src/routes/dashboard.ts`

## 3. Fluxo de Desenvolvimento

```mermaid
graph TD
    A[Garantir existência do Banco (Index)] --> B[Escrever Função RPC (SQL)]
    B --> C[Exportar Rota Aggregator na API]
    C --> D[Criar Hook no Frontend]
    D --> E[Renderizar Chart (Recharts)]
```

## 4. Boas práticas
- **Agregue no Banco:** Nunca peça à API para retornar 10.000 linhas em JSON para o React fazer um `reduce()` na Home Page. O Browser travará. Use `SUM()` e `GROUP BY` no PostgreSQL (Supabase RPCs) e devolva só os 30 pontos de dados pro gráfico.
- **Evite Over-fetching:** A API deve aceitar um parâmetro `?period=30d` para restringir a busca.
- **Caching local:** Utilize o cache nativo (stale-while-revalidate) do React Query para não dar query no banco caso o usuário navegue entre abas rapidamente.

## 5. Testes Recomendados
- Inserir um payload falso de métricas com datas do mês passado. Garantir que se a Dashboard está definida como "Últimos 7 dias", o dado não infla.

## 6. Checklist de Implementação
- [ ] A RPC respeita o RLS do contexto do caller.
- [ ] O Tooltip do gráfico no React traduz dados adequadamente (ex: Moedas em formato PT-BR BRL).
