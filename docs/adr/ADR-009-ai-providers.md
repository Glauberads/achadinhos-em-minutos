# ADR-009: Abstração via Strategy Pattern para Providers de IA

## Metadados
- **Título:** Isolamento Dinâmico de Provedores de Inteligência Artificial
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
O ecossistema de Modelos de Linguagem Grande (LLM) sofre rupturas constantes. As APIs saem do ar, quotas mensais estouram ou novas IAs subitamente tornam-se 20x mais rápidas/baratas (Ex: Llama vs OpenAI vs Claude). Originalmente os SDKs dessas ferramentas eram hard-coded no Controller.

## Problema
- Interrupções temporárias de um provedor (Ex: OpenAI outage) paralisava 100% da plataforma e causava churn de assinantes Premium.
- Refatorar cada ponto em que o SDK era usado requeria alto trabalho de Regex/Replace.

## Alternativas Consideradas
1. **LangchainJS:** Um orquestrador gigantesco para abstrair IAs e conectar fluxos RAG.
2. **Strategy Pattern Customizado:** Abstração minimalista baseada em interfaces limpas puramente em TypeScript.

## Decisão Tomada
Implementamos um modelo próprio de interfaces estritas (**Alternativa 2**), o `Strategy Pattern`.

## Justificativa
O pacote Langchain (Node) tem um ecossistema frágil de atualizações massivas de versões que constantemente introduzem Breaking Changes. Não queremos delegar o controle das nossas requisições de prompt para uma lib pesada de terceiros que possui camadas obscuras. Um simples `interface IAProvider { generateCopy(options): Promise<JSON> }` injetado via construtor supre nossa necessidade perfeitamente.

## Consequências Positivas
- Permitiu desenvolver o mecanismo automático de Fallback: O sistema tenta instanciar a classe da `OpenAIProvider`. Se houver *timeout*, ele repassa a exata mesma requisição à classe `AnthropicProvider` de forma invisível.
- Permite rodar baterias de testes via CI instanciando um `MockAIProvider` que não consome dólares da nossa fatura durante `npm run test`.

## Consequências Negativas
- Modelos distintos de IA têm capacidades e "limiares de obediência" distintos. Se o fallback de OpenAI -> Llama ocorrer, o prompt deve ser super blindado, senão Llama falha em retornar um JSON limpo, quebrando o parser.

## Trade-offs
Decidimos que um eventual retorno de erro de parser de JSON pelo provedor fallback é menos danoso na percepção do usuário do que um "502 - Provedor Offline".

## Impacto Futuro
Habilita que a funcionalidade "Bring Your Own Key" (BYOK) possa ser implementada amanhã sem sofrimento, instanciando o Provider na hora da chamada baseado na API Key inserida na base de dados do cliente.

## Links Relacionados
- [Documentação AI](../architecture/ai.md)
