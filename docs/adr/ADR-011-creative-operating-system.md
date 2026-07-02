# ADR-011: Creative Operating System (Pipeline Multi-Motores)

## Metadados
- **Título:** Adoção do "Creative OS" para Geração Desacoplada e Paralela de Criativos
- **Status:** Proposto
- **Data:** 01/07/2026

## Contexto
O pipeline de geração no `Creative Studio` inicial delegava muita responsabilidade a prompts densos ou a componentes que tomavam múltiplas decisões (ex: hook, motion, cor e tipografia) em uma única requisição ao LLM. À medida que o produto escalou, manter a qualidade visual e de conversão se tornou insustentável. Modelos tendem a esquecer constraints complexas se pedirmos o roteiro, a cor, o layout e o pacing visual numa tacada só.

## Problema
- O LLM tinha que processar lógica pesada e gerar layout, design e texto em uma única requisição.
- Se a IA gerasse um Hook maravilhoso mas errasse a Tipografia, a repetição (retry) descartava tudo e gerava um novo Hook, correndo o risco de piorar o resultado global.
- Manutenção difícil: Testar uma melhoria nas transições (Motion Engine) afetava as respostas da Copy (Hook Engine).

## Alternativas Consideradas
1. **Manter um Orquestrador Único Melhorado:** Aumentar os constraints no Prompt e usar modelos mais robustos (o1, GPT-4). Rejeitado devido ao custo elevado, à imprevisibilidade e ao limite estrutural de atenção das IAs atuais.
2. **Cadeia Sequencial Simples:** Motor A passa para Motor B, que passa para C. Problema: Alta latência e forte dependência linear.

## Decisão Tomada
Decidimos implementar o **Creative Operating System (Creative OS)**. Este modelo separa estritamente `Inteligência Analítica/Estratégica` (onde pensar é livre e demorado) da `Geração Especialista` (onde o agente foca exclusivamente em executar a estratégia em sua vertical — ex: Layout, Typography, Hook). 
A coordenação será feita por um `Creative Reviewer` via `Dual Score System` (Visual e de Conversão).

## Consequências Positivas
- **Controle Cirúrgico:** Podemos alterar a regra de "Core" e "Padding" do `LayoutEngine` sem afetar a copy criativa do `HookEngine`.
- **Especialização:** Possibilidade de usar modelos mais ágeis, baratos ou especialistas (ex: um fine-tuned só para gerar chamadas de ação - CTAs).
- **Escalabilidade Qualitativa:** O sistema de Score permite recriar apenas a parte que reprovou, preservando o resto (se desejável).

## Consequências Negativas
- Aumento expressivo da complexidade do back-end.
- Aumento do volume de microrrequisições aos provedores de IA (trade-off entre qualidade e consumo de tokens isolados).
- Maior latência na geração final (compensado pela percepção de maior valor e qualidade na entrega).

## Rollout e Restrições
A transição deve ser indolor:
1. O Creative OS nascerá inteiramente atrás da feature flag `creative_os` (default `false`).
2. O fluxo atual não será quebrado nem depreciado durante a fase 1, 2 e 3 de adoção.
3. Se um Engine do Creative OS falhar catastróficamente, deverá existir um mecanismo de **Fallback Automático** redirecionando a request para o antigo monolítico, além de reportar no sistema de Telemetria e Audit.
