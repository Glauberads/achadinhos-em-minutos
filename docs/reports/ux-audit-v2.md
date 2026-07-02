# UX Audit (v2) - Achadinhos em Minutos

## 1. Visão Geral
Auditoria crítica das interfaces. O produto atualmente transpira "MVP". Funciona tecnicamente, mas a carga cognitiva sobre o usuário é pesada.

## 2. Problemas Críticos
- **Creative Studio (Cognitive Overload):** A tela do estúdio joga campos de form, preview de vídeo, e opções de IA todas juntas. Hierarquia visual inexistente.
- **Empty States Fantasmas:** A tela de Galeria, quando vazia, exibe apenas uma grid nula sem guiar o usuário sobre "como gerar o primeiro vídeo".
- **Falta de Feedback (Loading):** Quando a IA do Marketing Brain está rodando (que leva até 20s), a UI mostra um *Spinner* genérico. O usuário não sabe o que está acontecendo e tem vontade de dar F5 (Quebrando o Job).

## 3. Problemas Importantes
- **Mobile Experience Destruída:** As tabelas de "Campaigns" transbordam do viewport no celular. Scroll horizontal obrigatório em 2026 é inaceitável.
- **Acessibilidade (a11y):** Baixo contraste nos textos secundários e ausência de navegação por teclado nos Modais do Shadcn (focus trap quebrado em alguns componentes base mal adaptados).

## 4. Melhorias
- **Breadcrumbs:** O usuário se perde ao navegar `Dashboard > Creative > Configurações`. Faltam breadcrumbs no header.
- **Toasts Excessivos:** Sucesso ao copiar link, sucesso ao salvar, sucesso ao apagar. A poluição visual no canto direito é irritante.