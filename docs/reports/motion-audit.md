# Motion Audit

## 1. Visão Geral
O sistema é estático, duro e "pisca" na tela. Isso aniquila a percepção de um "Software Inteligente e Fluído".

## 2. Pontos Duros (Sem Transição)
- **Modais:** O `Dialog` abre seco (display: block). Falta animação de entrada (Fade-in + Scale).
- **Abas (Tabs):** A troca de contexto entre "Vídeo / Legenda / Áudio" pisca o conteúdo. Precisamos de *Crossfade* ou animações de slide guiadas por layout.
- **Hover States:** Botões mudam de cor instantaneamente. Falta `transition-colors duration-200`.

## 3. Oportunidades de Micro-Animações
- Botão "Gerar IA" deveria ter um estado cintilante (`shimmer`) enquanto a IA processa, transferindo ansiedade para encantamento.
- Ao deletar um criativo, a row da tabela deve "encolher e desaparecer" (`AnimatePresence`), não sumir num pulo agressivo.