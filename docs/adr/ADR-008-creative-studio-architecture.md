# ADR-008: Arquitetura Multi-Engine no Creative Studio

## Metadados
- **Título:** Adoção de Pipilines Multi-Agente para a IA
- **Status:** Implementado (Stable)
- **Data:** 01/07/2026

## Contexto
Originalmente o usuário colava o link de um produto, o backend extraía o título/preço, criava um Mega Prompt "Faça um roteiro de vídeo curto vendendo isso" e mandava pra OpenAI, retornando o Roteiro Final em texto corrido e renderizando.

## Problema
- Alta variância e inconstância na qualidade de output do LLM. Textos muito longos, formato errado (alucinação quebrando o JSON de cenas) e péssimos gatilhos mentais para vendas curtas (Hooks fracos).

## Alternativas Consideradas
1. **Fine-Tuning:** Criar um modelo LLM pré-treinado com nossos melhores criativos para guiar a estrutura.
2. **Agentic Pipeline (Pipelines Paralelos):** Desmembrar a geração num Marketing Brain que delega tarefas para 3 Engines sub-orquestradas: Template (Base), Hook (Chamadas) e Motion (Cenas).

## Decisão Tomada
Decidimos usar a **Alternativa 2 (Pipelines Multi-Agente e Self-Correction Analyzer)**.

## Justificativa
Fine-tuning é altamente custoso para evoluir rapidamente e amarra o sistema a um provedor ou open-source específico. Desmembrando a inteligência em etapas distintas do Prompting, conseguimos especializar sub-chamadas: uma focada brutalmente em Psicologia de Consumo (O Hook), outra no Encaixe do Áudio x Tela (Motion). Por fim, um Analyzer aprova a coerência do conjunto final antes do Frontend recebê-lo.

## Consequências Positivas
- Aumento drástico (Tracking empírico via Telemetria) no CTR (Click-Through Rate) dos vídeos, devido à força isolada do "Hook Engine".
- Output JSON estabilizado em 99%, reduzindo os crashs de parser.

## Consequências Negativas
- Em vez de uma requisição de IA rápida (3s), o pipeline pode disparar de 3 a 5 prompts sequenciais, atrasando a finalização para até 15-20 segundos.

## Trade-offs
Decidimos sacrificar duramente a velocidade pela excelência do Copywriting e precisão de formato do render de vídeo. Um excelente vídeo de vendas leva 20s para surgir e 1 hora para fechar uma venda. Um vídeo ruim de 3s não converte nada.

## Impacto Futuro
No futuro, o *Marketing Brain* evoluirá para atrelar-se a bancos de dados Vetoriais (RAG) onde procurará dinamicamente os "Hooks" mais similares do mesmo nicho no banco e enviará pro LLM como exemplo.

## Links Relacionados
- [Arquitetura de Inteligência Artificial](../architecture/ai.md)
