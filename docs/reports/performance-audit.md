# Performance Audit

## 1. Visão Geral Frontend
- **Bundle Size:** O `index.css` está gigante e a biblioteca do `Framer Motion` (se houver) / `Lucide React` estão sendo carregadas globalmente no `main.tsx` sem Code Splitting.
- **Render Time:** O `CreativeStudio.tsx` re-renderiza inteiro a cada tecla digitada no formulário de edição (Falta de `useMemo` e separação de estados).

## 2. Visão Geral Backend e Infra
- **N+1 Queries:** Rotas de relatórios da Dashboard estão buscando Campanhas, e para cada campanha fazendo um loop no banco para buscar os Criativos. Matador de IOPS.
- **Cache Miss Rate:** A taxa do Redis é horrível porque a chave de cache está atrelada à URL inteira. Parâmetros inúteis na URL como `?utm_source` quebram o cache e forçam o Scraper a rodar repetidamente.
- **Workers (FFmpeg):** Renderização consumindo 100% da CPU do nó. Não há limite rígido de _nice_ ou prioridade, podendo travar requisições adjacentes se compartilharem instância.

## 3. Oportunidades de Otimização
- Aplicar React.lazy() nas rotas.
- Trocar loops SQL por INNER JOINS ou Supabase RPCs (Aggregate Functions).
- Normalizar URLs antes de salvar a Key no Redis (Remover query strings).