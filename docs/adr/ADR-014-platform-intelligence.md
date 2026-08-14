# ADR 014: Platform Intelligence

## Status
Aceito

## Contexto
O algoritmo de renderização e as diretrizes de texto para os vídeos/imagens criados são quase genéricos. TikTok, Reels (Instagram), YouTube Shorts e Pinterest possuem lógicas de retenção, durações ótimas e zonas seguras (safe zones) na tela, totalmente diferentes entre si. Se a plataforma for gerar um vídeo de "Achadinhos", ele precisa ser otimizado pontualmente para o formato de distribuição.

## Decisão
Estabelecer o **Platform Intelligence**, com regras dedicadas (`market-intelligence.service.ts` e arquivos `.md` na Knowledge Base) para cada plataforma alvo. O `Prompt Builder` fará o merge dos dados de DNA do Criativo com as regras específicas da Plataforma selecionada. 
Critérios mapeados: tempo ideal, quantidade de texto no storyboard, tamanho da headline, palavras proibidas (ban words), velocidade de cenas, e zonas seguras para interface do usuário no player original.

## Consequências
- **Positivas:** Os vídeos e scripts serão 100% nativos para o canal de distribuição. Reduz as rejeições do usuário nas redes sociais (melhor métrica de visualização e engajamento).
- **Negativas:** Exigirá constante manutenção das `Platform Rules` conforme as APIs e algoritmos (Meta, ByteDance, Google) evoluem.
