# Arquitetura do Creative Operating System (Creative OS)

> [!IMPORTANT]
> O Creative OS está atualmente protegido pela feature flag `creative_os`. Se a flag estiver inativa, o fluxo atual do Creative Studio permanece intacto. Em caso de falha no pipeline do Creative OS, o fallback automático para o fluxo antigo será executado.

## 1. Visão Geral
O Creative Operating System representa a evolução (V3) do pipeline de geração de criativos. Ao invés de um fluxo monolítico ou dependente de um único orquestrador pesado, o sistema adota uma abordagem modular inspirada em sistemas operacionais, utilizando **Motores Especialistas (Engines)** e **Serviços de Inteligência (Intelligence)** isolados.

## 2. A Divisão de Responsabilidades

### Motores Analíticos (Intelligence & Strategy)
Estes motores analisam o contexto antes da geração criativa. 
**Status atual (Bloco 2)**: `Implemented with Mock Intelligence` (Integração real com IA: `Planned for next block`).
- **Visual Intelligence**: Avalia a qualidade, conteúdo e paleta de imagens base.
- **Market Intelligence**: Analisa nichos, tendências de mercado e dores do público-alvo.
- **Creative Intelligence**: Analisa referências de concorrentes e criativos que já funcionaram.
- **Creative Strategy**: O cérebro decisório que compila os insumos e gera a estratégia geral do criativo (Briefing Técnico).
- **Learning Engine**: Feedback loop para ajustar parâmetros futuros baseados na conversão real.

### Motores Criativos (Engines)
Estes são os executores da estratégia. Eles **não tomam decisões estratégicas** e não chamam a IA diretamente se a decisão já foi resolvida no Creative Strategy.
- **Layout Engine**: Posicionamento de elementos, margens, grid.
- **Typography Engine**: Fontes, tamanhos e legibilidade.
- **Color Engine**: Harmonia de cores e contraste.
- **Hook Engine**: Responsável exclusivo pelos primeiros 3 segundos do vídeo (Gancho).
- **CTA Engine**: Chamada para Ação otimizada para conversão.
- **Storyboard Engine**: Divisão do roteiro em cenas sequenciais lógicas.
- **Motion Engine**: Transições e animações de entrada/saída.

## 3. Orquestração e Validação

### Creative Reviewer e Dual Score System
O `CreativeReviewerService` atua como o juiz final do pipeline. Antes de entregar a variação, o resultado de todos os motores passa por uma dupla avaliação:
1. **Visual Score**: Pontuação focada na harmonia visual, respeito à paleta, legibilidade (Typography) e equilíbrio (Layout).
2. **Conversion Score**: Pontuação voltada para a psicologia de vendas (Hooks fortes, clareza do CTA, gatilhos de urgência).

Se o Dual Score for inferior ao threshold aceitável, o Reviewer pode rejeitar a versão e acionar os motores novamente.

## 4. Feature Flagging & Fallback
Durante o período de transição, a API e o Frontend verificarão o estado de `creative_os`. 
- **ON**: Inicia o novo pipeline orquestrado.
- **OFF**: Utiliza os métodos atuais `generateCreativeV2`, ignorando os novos motores especialistas.
- **Erro (Catch)**: Em caso de timeout de IA, falha de validação Zod ou queda do LLM no novo pipeline, um bloco `try/catch` aciona a geração legada e registra via Telemetria para análise e correções sem impacto ao usuário.
