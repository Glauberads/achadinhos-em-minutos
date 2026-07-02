# AI Audit (Inteligência Artificial)

## 1. Eficiência do Pipeline
A arquitetura Multi-Agente (Marketing Brain) funciona, mas é linear e engessada. 

## 2. Desperdício e Baixa Previsibilidade
- **Redundância:** Mandamos o Planner classificar o produto, e depois o Hook Engine faz a MESMA classificação interna. Custo duplo de Tokens.
- **Alucinações:** A IA às vezes insere emojis no campo de "URL de Áudio" no JSON, quebrando o player.
- **Prompts sem Few-Shot:** Os prompts atuais explicam a regra, mas não dão 5 exemplos de SUCESSO na vida real (Few-Shot Prompting). A IA tem que "adivinhar" nosso nível de agressividade de vendas.

## 3. Soluções
- Unificar passagens iniciais.
- Enviar 3 roteiros virais famosos como "Contexto/Shot" no System Prompt do Hook Engine.
- Validar via Zod o JSON do LLM e implementar auto-retry no próprio provedor caso ele fure a tipagem.