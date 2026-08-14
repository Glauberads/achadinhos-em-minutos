# Arquitetura: Creative Intelligence V2

## Visão Geral

A arquitetura do **Creative Intelligence V2** eleva o sistema "Achadinhos em Minutos" do patamar de um simples gerador e orquestrador de vídeos para o de um **Diretor de Marketing Autônomo**. O foco deixa de ser "criar mídia a partir de um link", passando para "aplicar engenharia de marketing, gatilhos de conversão e neuro-copywriting otimizado por plataforma" gerando vídeos e CTAs persuasivos.

A estratégia arquitetural foca em desacoplar as "regras de negócios e marketing" do código fonte puro via arquivos textuais de suporte (`Knowledge Base`), combinando isso a um estado transacional rico: o `CreativeDNA V2`.

## 1. Feature Flagging

Todas as implementações da V2 estão envelopadas na feature flag `creative_intelligence_v2`.
- **Status OFF:** A lógica pass-through da V1 (Prompt Hardcoded) é executada.
- **Status ON:** Inicia a esteira orquestrada do Prompt Builder e Reviewer V2.
Qualquer falha do pipeline V2 resulta em Fallback para a V1, gerando logs estruturados (`Pino`) para debug e monitoramento.

## 2. A Esteira de Componentes Core

O fluxo principal opera na seguinte ordem:

1. **Extraction (Link Parser):** Parseamento via scraping ou API.
2. **Brain Strategy:** Criação do objeto DTO **`CreativeDNA V2`** baseado no nicho, awareness, temperatura e produto.
3. **Prompt Builder (Orchestrator):** Coleta as regras da *Marketing Knowledge Base* (Docs em MD) + Plataforma Específica + Estrutura do `CreativeDNA`. Constrói o Prompt Sistêmico e envia ao Gemini (via AI Provider genérico).
4. **Quality Reviewer V2 (Guardrails):** Submete a resposta da LLM a um crivo estrito (matriz de score baseada em urgência, claridade visual e oferta). Score < 85 -> Dispara Refatoração (max 1 tentativa). 
5. **Output (A/B Creator):** Emite a versão A ou A/B para o usuário aprovar no Storyboard.

## 3. Estruturas-Chave

### Marketing Knowledge Base
Armazenada em `docs/marketing/`. Essa base compõe os embeddings e blocos modulares textuais que o **Prompt Builder** usa. Remove do código-fonte a complexidade de explicar "O que é AIDA" para a IA, injetando os `.md` puros.

### CreativeDNA V2 (O Objeto)
Enquanto a V1 dependia de `buyer_persona`, a V2 unifica os estados do criativo.
A DTO validada no backend contém:
- `target_audience`, `audience_temperature`, `awareness_level`
- `emotional_driver`, `pain_points`, `desired_outcome`
- `offer_angle`, `urgency_strategy`, `risk_level`
- `primary_hook`, `cta_strategy`, `compliance_notes`

Este DTO é versionado (`creative_dna_version: "v2"`) e persistido via `JSONB` na tabela de Criativos do Supabase, impedindo inchaço do Schema com 20 colunas dispersas.

### Quality Reviewer Matriz
O Quality Reviewer não opera no escuro. Analisa e devolve um score em formato JSON para:
`Hook Score, Offer Score, Copy Clarity, Visual Clarity, Urgency Quality, Trust Score, CTA Strength, Compliance Score, Overall Score`.

## 4. Limites Econômicos
Dado o aumento brutal no tamanho do Prompt pelo Builder (Injeção de KB), os custos do LLM são limitados utilizando:
- Default: `Gemini 1.5 Flash`
- Retentativas do Reviewer: 1 máximo por criativo.
- Geração A/B: restrita à disponibilidade do plano do usuário.
