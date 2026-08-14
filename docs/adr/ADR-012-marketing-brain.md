# ADR 012: Marketing Brain V2

## Status
Aceito

## Contexto
Atualmente, o Creative OS funciona primariamente como um gerador de vídeos, com prompts extensos inseridos diretamente nos serviços (hardcoded) e dependência de templates fixos. Isso resulta em criativos muitas vezes genéricos que não aplicam princípios avançados de marketing, reduzindo a conversão de anúncios em plataformas como Meta Ads e TikTok. Precisamos transformar o sistema em um "Diretor Criativo" (Selling Machine), capaz de tomar decisões focadas na conversão.

## Decisão
Implementar a arquitetura **Creative Intelligence V2**.
O núcleo dessa nova arquitetura será a `Marketing Knowledge Base`, composta por documentação estruturada em Markdown (arquivos como `hooks-library.md`, `offer-frameworks.md`).
Um novo objeto central de estado, o `CreativeDNA V2`, consolidará a estratégia traçada para um criativo.
Toda geração de prompts será delegada a um novo serviço especialista, o `prompt-builder.service.ts`, que consultará a Base de Conhecimento e as Regras de Plataforma em tempo real. Toda esta inteligência operará debaixo da feature flag `creative_intelligence_v2` para garantir fallback e experimentação sem risco à produção atual.

## Consequências
- **Positivas:** Geração de anúncios altamente persuasivos e adaptados a contextos específicos (AIDA, PAS, etc.). Centralização das regras, facilitando atualizações sem necessidade de alterar o código-fonte (TypeScript).
- **Negativas:** Maior custo computacional, pois o `Prompt Builder` enviará um contexto maior para o LLM. A mitigação será a utilização do modelo `Gemini 1.5 Flash` para balancear qualidade e custo, com limitação estrita de tentativas de regeneração (máximo 1).
