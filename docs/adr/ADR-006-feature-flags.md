# ADR-006: Gerenciamento de Release via Feature Flags

## Metadados
- **Título:** Adoção de Feature Flags (Toggles) em banco de dados
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
O processo de deploy na `main` acontecia de uma vez. Quando um novo Provider de Inteligência Artificial ou um novo Template de interface do Creative Studio era merjado, ele ia para 100% da base de clientes imediatamente. Se ele contivesse um Bug severo, causava interrupção massiva.

## Problema
- Deploys arriscados forçavam o time a trabalhar em branches eternas (Feature Branches isoladas por meses).
- Rollbacks exigiam reverter commits (`git revert`) inteiros e acionar Pipeline de Deploy da API e do Frontend.

## Alternativas Consideradas
1. **LaunchDarkly / Split.io:** Serviços PaaS poderosos e dedicados a Toggles.
2. **Hardcoded (Variáveis de Ambiente):** Ativar funcionalidades mudando o arquivo `.env` na Vercel.
3. **Internal Database Flags:** Tabela no próprio banco de dados carregada em memória na inicialização / consulta, acoplada aos nossos Services.

## Decisão Tomada
Decidimos por usar uma solução nativa baseada na Alternativa 3, gerando a tabela `feature_flags`.

## Justificativa
A infraestrutura de banco de dados do projeto já atende muito bem leituras via Cache, e LaunchDarkly geraria custos expressivos em dólar para uma necessidade simples de toggle global ou toggle por UUID do Workspace (Canary Release).

## Consequências Positivas
- Engenheiros agora fazem commits contínuos e frequentes na branch `main` (`Trunk Based Development`), escondendo as telas na UI via um simples `useFeatureFlag('nova_dashboard')`.
- O rollback é imediato: apenas entrar na Dashboard, atualizar a tabela de flags para `false` e a feature desaparece.

## Consequências Negativas
- Aumento da complexidade e "sujeira" do código, pois temos muitos blocos de `if (featureEnabled)` espalhados pelos controladores e React Components.

## Trade-offs
Assumimos a leve carga burocrática da proliferação de `Ifs` no código em troca da segurança (Tranquilidade Mental) de testar em produção sem expor a interface.

## Impacto Futuro
Será necessário estipular políticas rígidas para matar as Feature Flags "vencidas". Após 30 dias de lançamento com sucesso, a flag deve ser deletada e o fluxo consolidado. *(Planned: Incluir na definição de Done).*

## Links Relacionados
- [Documentação Base API](../architecture/api.md)
