# ADR 013: Learning Engine V2

## Status
Aceito

## Contexto
O atual processo de criação não assimila as escolhas dos usuários e nem melhora com o tempo com base em resultados ou edições. Precisamos de um motor que consiga receber "sinais de aprendizagem" e guardar o histórico para otimizar futuras tomadas de decisão sobre criativos e estratégias (Hooks, CTAs).

## Decisão
Criar o **Learning Engine V2**. O estado contínuo será salvo preferencialmente em estruturas de `JSONB` versionadas na tabela existente do criativo, ou numa tabela simples atrelada à análise, evitando criar dezenas de colunas novas de banco de dados e mantendo a agilidade do desenvolvimento.
Os "sinais" de feedback (como alterações pós-geração feitas pelo usuário no storyboard, visualizações, CTR, NPS) serão ingeridos periodicamente por este serviço.

## Consequências
- **Positivas:** Permite que o Dashboard (Creative Intelligence) visualize métricas históricas de assertividade, promovendo um loop de melhoria na plataforma.
- **Negativas:** Exigirá processamento adicional (assíncrono) para ingestão e consolidação dos dados no banco.
