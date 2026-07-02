const fs = require('fs');
const path = require('path');

const uxAudit = `# UX Audit (v2) - Achadinhos em Minutos

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
- **Breadcrumbs:** O usuário se perde ao navegar \`Dashboard > Creative > Configurações\`. Faltam breadcrumbs no header.
- **Toasts Excessivos:** Sucesso ao copiar link, sucesso ao salvar, sucesso ao apagar. A poluição visual no canto direito é irritante.`;

const croAudit = `# CRO Audit (Conversion Rate Optimization)

## 1. Visão Geral
Como o usuário pensa e onde ele abandona a plataforma. O TTFS (Time to First Success) está perigosamente alto ( > 5 minutos).

## 2. Gargalos de Fluxo
- **Atrito no Onboarding:** Após o login, o usuário é jogado num Dashboard vazio. O cérebro paralisa. Deveríamos ter um Wizard "Cole seu primeiro link da Shopee aqui e veja a mágica".
- **Cliques Desnecessários:** Para agendar um post, o usuário tem que: 1. Abrir modal; 2. Selecionar vídeo; 3. Avançar; 4. Selecionar Grupo do Telegram; 5. Confirmar. São 5 cliques onde poderiam ser 2 com _drag and drop_.
- **Percepção de Valor (A-HA Moment):** O valor real do SaaS é a geração da Copy (Texto) casada com o Vídeo. Mas a tela joga isso num Accordion fechado. O usuário tem que clicar para ler a obra de arte que a IA criou.

## 3. Plano de Ação (Redução de Atrito)
- Implementar Onboarding Interativo (Tours).
- Exibir a Copy da IA aberta, gigante e orgulhosa logo após a geração.
- Reduzir formulários: Autopreencher dados puxados do link (Scraper) sem pedir pro usuário confirmar Título e Preço toda vez.`;

const perfAudit = `# Performance Audit

## 1. Visão Geral Frontend
- **Bundle Size:** O \`index.css\` está gigante e a biblioteca do \`Framer Motion\` (se houver) / \`Lucide React\` estão sendo carregadas globalmente no \`main.tsx\` sem Code Splitting.
- **Render Time:** O \`CreativeStudio.tsx\` re-renderiza inteiro a cada tecla digitada no formulário de edição (Falta de \`useMemo\` e separação de estados).

## 2. Visão Geral Backend e Infra
- **N+1 Queries:** Rotas de relatórios da Dashboard estão buscando Campanhas, e para cada campanha fazendo um loop no banco para buscar os Criativos. Matador de IOPS.
- **Cache Miss Rate:** A taxa do Redis é horrível porque a chave de cache está atrelada à URL inteira. Parâmetros inúteis na URL como \`?utm_source\` quebram o cache e forçam o Scraper a rodar repetidamente.
- **Workers (FFmpeg):** Renderização consumindo 100% da CPU do nó. Não há limite rígido de _nice_ ou prioridade, podendo travar requisições adjacentes se compartilharem instância.

## 3. Oportunidades de Otimização
- Aplicar React.lazy() nas rotas.
- Trocar loops SQL por INNER JOINS ou Supabase RPCs (Aggregate Functions).
- Normalizar URLs antes de salvar a Key no Redis (Remover query strings).`;

const designAudit = `# Design Audit

## 1. Visão Geral da Identidade
O produto usa Tailwind e Shadcn UI, o que garante limpeza, mas não transmite "Enterprise". Falta alma, tipografia assertiva e refinamento de Grid.

## 2. Inconsistências
- **Botões (Border Radius):** Temos botões de salvar com \`rounded-md\` e modais com \`rounded-xl\`. O Radius não está centralizado num Design Token de CSS variables.
- **Cores e Sombras:** O painel usa cinza chapado. Plataformas modernas (Vercel, Linear) usam sutis *Glassmorphisms* e sombras multicamadas (\`shadow-sm\` + bordas 1px \`border-white/10\`).
- **Tipografia:** A fonte atual (Inter genérica) não impõe respeito no Dashboard. Dados numéricos na home não são exibidos em tipografia tabular, fazendo os números pularem ao atualizar métricas em tempo real.

## 3. Padrões Exigidos
- Padronizar paleta HSL no \`index.css\`.
- Unificar todos os *Border Radius*.
- Refinar espaçamentos usando sistema de 4pt a 8pt estrito (Tailwind spacing).`;

const motionAudit = `# Motion Audit

## 1. Visão Geral
O sistema é estático, duro e "pisca" na tela. Isso aniquila a percepção de um "Software Inteligente e Fluído".

## 2. Pontos Duros (Sem Transição)
- **Modais:** O \`Dialog\` abre seco (display: block). Falta animação de entrada (Fade-in + Scale).
- **Abas (Tabs):** A troca de contexto entre "Vídeo / Legenda / Áudio" pisca o conteúdo. Precisamos de *Crossfade* ou animações de slide guiadas por layout.
- **Hover States:** Botões mudam de cor instantaneamente. Falta \`transition-colors duration-200\`.

## 3. Oportunidades de Micro-Animações
- Botão "Gerar IA" deveria ter um estado cintilante (\`shimmer\`) enquanto a IA processa, transferindo ansiedade para encantamento.
- Ao deletar um criativo, a row da tabela deve "encolher e desaparecer" (\`AnimatePresence\`), não sumir num pulo agressivo.`;

const aiAudit = `# AI Audit (Inteligência Artificial)

## 1. Eficiência do Pipeline
A arquitetura Multi-Agente (Marketing Brain) funciona, mas é linear e engessada. 

## 2. Desperdício e Baixa Previsibilidade
- **Redundância:** Mandamos o Planner classificar o produto, e depois o Hook Engine faz a MESMA classificação interna. Custo duplo de Tokens.
- **Alucinações:** A IA às vezes insere emojis no campo de "URL de Áudio" no JSON, quebrando o player.
- **Prompts sem Few-Shot:** Os prompts atuais explicam a regra, mas não dão 5 exemplos de SUCESSO na vida real (Few-Shot Prompting). A IA tem que "adivinhar" nosso nível de agressividade de vendas.

## 3. Soluções
- Unificar passagens iniciais.
- Enviar 3 roteiros virais famosos como "Contexto/Shot" no System Prompt do Hook Engine.
- Validar via Zod o JSON do LLM e implementar auto-retry no próprio provedor caso ele fure a tipagem.`;

const productAudit = `# Product Audit (Visão de Cliente)

## 1. Percepção Geral
Eu pagaria $99/mês por isso? Hoje, não. 
O produto resolve o problema (Gera os vídeos automatizados), mas o envelope é "Open Source Barato". Ele não transmite a sensação de uma "Máquina de Vendas Profissional".

## 2. Momentos de Frustração (Pain Points)
- **Falta Confiança:** O usuário clica em "Postar no Telegram" e o sistema diz "Sucesso". Mas cadê a prova? Falta uma tela de Status de Fila mostrando o robô trabalhando ao vivo (Building trust).
- **Sem Magia:** A mágica do SaaS é ganhar tempo. Porém, eu (usuário) me sinto trabalhando muito clicando, checando relatórios soltos e lendo textos monótonos.

## 3. Como Gerar Sorrisos
- Ao invés de uma "Galeria" fria, ter um painel "Sua Fábrica de Conversão" com estimativa de quanto tempo a IA economizou pra ele hoje ("Você poupou 4h de edição hoje").
- Easter Eggs, micro-cópias (textos nos botões e loadings) amigáveis e com personalidade (Ex: *Acordando os redatores robôs...*).`;

const roadmap = `# Product Excellence Roadmap

## Missão:
Transformar a percepção do usuário de "Sistema útil" para "Software World-Class Premium".

---

## Sprint 1: Fundação Tátil e Visual (Design & Motion)
- **Objetivo:** Refino absoluto da casca. O usuário tem que notar a diferença nos primeiros 3 segundos.
- **Tarefas:**
  - Refatorar \`index.css\` com tipografia premium e paletas sutis (Sombreados Vercel-like).
  - Adicionar transições em TODOS os botões, links e *Hover states* (\`transition-all duration-200 ease-in-out\`).
  - Refatorar Modais/Dialogs/Tabs para utilizar animações suaves (Framer Motion / Tailwind Animate).
- **Impacto:** Altíssimo visualmente. **Complexidade:** Baixa.

## Sprint 2: Fricção Zero (UX & CRO)
- **Objetivo:** Reduzir o TTFS (Time to First Success) de 5 minutos para 45 segundos.
- **Tarefas:**
  - Implementar Onboarding guiado para a primeira conta (Wizard 3 steps focado em fazer o 1º vídeo).
  - Limpar a \`CreativeStudio.tsx\` (Remover poluição visual e auto-preencher dados raspados).
  - Reformular Skeletons / Empty States de toda a plataforma (Guiding actions, not dead ends).
- **Impacto:** Altíssimo na Retenção (D1). **Complexidade:** Média.

## Sprint 3: Performance e Escalabilidade Base
- **Objetivo:** Tudo tem que parecer instantâneo ao clicar.
- **Tarefas:**
  - Eliminar \`N+1\` Queries nos relatórios substituindo por \`Supabase RPCs\`.
  - Normalizar chaves do Redis (Aumento de Cache Hit).
  - Code Splitting no React (Lazy Loaded Routes para diminuir bundle).
- **Impacto:** Médio perceptível, Alto infra. **Complexidade:** Alta.

## Sprint 4: Inteligência Confiável (AI & Product)
- **Objetivo:** Garantir que 99% das gerações de criativos sejam impecáveis na escrita.
- **Tarefas:**
  - Refatorar os Prompts injetando *Few-Shot Learning* com roteiros vencedores reais.
  - Tela de *Live Status* da Fila de processamento (Gerando confiança visual ao invés de apenas um spinner e um Toast).
  - Injetar micro-cópia amigável em toda a plataforma.
- **Impacto:** Extremo na Conversão Final. **Complexidade:** Alta.
`;

fs.writeFileSync(path.join(__dirname, 'docs', 'reports', 'ux-audit-v2.md'), uxAudit);
fs.writeFileSync(path.join(__dirname, 'docs', 'reports', 'cro-audit.md'), croAudit);
fs.writeFileSync(path.join(__dirname, 'docs', 'reports', 'performance-audit.md'), perfAudit);
fs.writeFileSync(path.join(__dirname, 'docs', 'reports', 'design-audit.md'), designAudit);
fs.writeFileSync(path.join(__dirname, 'docs', 'reports', 'motion-audit.md'), motionAudit);
fs.writeFileSync(path.join(__dirname, 'docs', 'reports', 'ai-audit.md'), aiAudit);
fs.writeFileSync(path.join(__dirname, 'docs', 'reports', 'product-audit.md'), productAudit);
fs.writeFileSync(path.join(__dirname, 'docs', 'roadmaps', 'product-excellence-roadmap.md'), roadmap);

console.log('Auditoria completa. Documentos gerados!');
