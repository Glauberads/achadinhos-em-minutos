# Revisão de Arquitetura (Enterprise Excellence)

## 1. Fluxo de Geração de Criativos (As Is vs To Be)

**Antes da V3 (Monolítico e Síncrono):**
- O usuário clicava em "Gerar Vídeo" no Frontend.
- A API segurava a conexão HTTP enquanto o AI Provider analisava o produto, gerava o roteiro, decidia as cenas e retornava.
- Consequência: Timeout frequente para o usuário final, ausência de Fallback.

**Atual e Futuro (Assíncrono e Resiliente):**
- `Frontend` despacha requisição -> `API` retorna JobID imediatamente (SWR).
- `Creative Intelligence Engine` orquestra:
  - `Marketing Brain` -> Analisa Avatar/Dor.
  - `Copy Engine` -> Gera Headings.
  - `Motion Engine` -> Atribui animações.
- Tudo isso envelopado pelo **TelemetryService**, garantindo observabilidade total em banco próprio.
- Se o Provider oficial cair, o `Fallback Mock` simula perfeitamente.

## 2. Abstração de Componentes (Design System)

A refatoração na camada de View elimina os gargalos de acoplamento entre Lógica e UI.
- `apps/web/src/components/ui/core.tsx` atua como o único guardião da apresentação.
- Novas integrações de componentes avançados (Accordions, Tabs, Modals) devem obrigatoriamente estender as variantes estabelecidas aqui.

## 3. Product Health Score

O pilar de monitoramento deixa de ser focado no "Ping" para usar uma matriz ponderada híbrida de serviços:
- **Penalidade Imediata:** DB offline ou Gateway 500 = Redução Drástica do Score (abaixo de 30).
- **Decaimento Suave:** Lentidão no renderizador de vídeos ou aumento de Cache Miss decaem suavemente o Score, gerando alertas (Amarelo).

Essa arquitetura isola completamente dependências externas. A queda do Gemini (IA) não impacta a geração de telemetria ou o banco, assegurando robustez de SaaS Nível 1.
