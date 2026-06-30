# Relatório de Auditoria de UX (Pré-V3)

## Escopo
Análise detalhada de usabilidade, feedbacks de estado, fluidez e padronização visual nas páginas de `Creative Studio` e `Dashboard`.

## Pontos Identificados para Melhoria

### 1. Inconsistência de Estado e Carregamento (Loading & Skeletons)
- Atualmente a tela `Creative Studio` utiliza texto simples "Processando" ou spinners genéricos. O estado vazio do painel, quando está carregando, gera layouts que "piscam" ou empurram o conteúdo para baixo.
- **Solução (V3):** Implementação do componente `Skeleton.tsx` simulando perfeitamente a estrutura de Cards que vão aparecer, mantendo a estabilidade da página.

### 2. Feedback de Ações Negativas e Positivas
- Quando ocorre erro, o frontend exibe um texto em vermelho fixo. Mensagens de sucesso são apresentadas via `alert('Teste enviado com sucesso')`, paralisando o navegador.
- **Solução (V3):** Implementação global do componente `Toast.tsx` para feedbacks silenciosos e elegantes de canto de tela.

### 3. Excesso de Cliques e UX Truncada
- No Storyboard, para salvar uma edição de texto na Cena, o usuário precisa clicar no campo, digitar, e clicar num botão. Não há auto-save.
- A tela de A/B joga todo o fluxo em "Pending Review" obrigando o usuário a um scroll extra para achar o botão "Selecionar Esta Versão".

### 4. Fragmentação Visual (Design System Inexistente)
- Cores de botão (`bg-primary`), bordas (`border-border`) e sombras são setadas ad-hoc.
- **Solução (V3):** Criação estrita dos 27 componentes requeridos na arquitetura. As páginas não possuirão tags `div` sujas de classes Tailwind longas nas lógicas principais.

### 5. Fallbacks e Erros Amigáveis
- Se o vídeo falhar, a mensagem no Card é muito crua e técnica ("FFmpeg timeout").
- **Solução (V3):** Mostrar estado customizado `ErrorState.tsx` com opção amigável de Retry (Tentar Novamente).
