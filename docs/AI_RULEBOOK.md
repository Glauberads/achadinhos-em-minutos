# AI Rulebook (Regras para Agentes IA)

- **Status:** Stable
- **Version:** 1.0.0
- **Última Atualização:** 01/07/2026

## 1. Objetivo
Este documento define as diretrizes absolutas e imutáveis para qualquer Agente de Inteligência Artificial ou LLM (ex: Claude, GPT, Antigravity) encarregado de ler, planejar ou modificar o código da plataforma "Achadinhos em Minutos". É a camada final de defesa contra alucinações e degradação da arquitetura corporativa.

## 2. Contexto Obrigatório (Context Loading)
Nenhuma modificação de arquitetura, rota ou tela pode ser feita sem antes carregar e compreender o contexto global.

> [!CAUTION]
> **Antes de qualquer alteração de código**, a IA **DEVE LER** os seguintes arquivos para ancorar sua tomada de decisão:
> - `docs/SYSTEM.md`
> - `docs/architecture/overview.md`
> - `docs/architecture/coding-standards.md`
> - `docs/architecture/database.md`
> - `docs/architecture/api.md`
> - `docs/architecture/workers.md`
> - `docs/architecture/event-driven.md`
> - `docs/architecture/ai.md`

## 3. Leis Imutáveis de Engenharia (The Ten Commandments)

Qualquer código gerado que viole as regras abaixo deverá ser sumariamente descartado.

1. **Entendimento Prévio:** Nunca altere código sem entender a arquitetura macro na qual ele se insere.
2. **Abstração do Banco:** Nunca acessar `Supabase` (o banco de dados) diretamente em Controllers ou Rotas (`routes/`).
3. **Repository Pattern:** Sempre utilize o `Repository Pattern` (`src/repositories/`) para qualquer leitura, inserção ou atualização no PostgreSQL.
4. **Isolamento de Negócios:** Sempre utilize `Services` (`src/services/`) para abrigar a regra de negócio. As rotas devem ser extremamente limpas e atuar como meras delegadoras.
5. **Validação Estrita:** Sempre utilize `Validators` (via Zod). Nunca injete objetos puros do body diretamente num Service.
6. **Integridade de Features:** Toda nova _Feature_ (funcionalidade core) **deve** obrigatoriamente possuir:
   - Uma `Feature Flag` acoplada.
   - Pontos de `Telemetria` (System Logs).
   - `Audit Logs` para ações de usuários.
   - Emissão de `Eventos` (EventBus) em conclusões.
   - Suíte de `Testes` unitários e E2E *(Planned)*.
   - `Documentação` atualizada ou criada na pasta `/docs`.
   - `Migration` testada quando envolver banco.
   - Plano de `Rollback` claro (ex: drop tables invertidos na migration).
7. **DRY Estrito:** Nunca duplique regras de negócio. Se já existe um parser ou gerador, estenda-o ou o refatore; não crie uma versão genérica do zero.
8. **Profissionalismo de Código:** Nunca crie código "temporário" (`// TODO: fix this later`). Não deixe débitos intencionais no código principal de produção.
9. **Compatibilidade (Backwards Compatibility):** Nunca quebre contratos de API, payloads ou assinaturas do banco sem antes documentar as quebras e aplicar fluxos transitórios.
10. **A Documentação comanda o Código:** Nenhuma implementação deve fugir do que foi especificado na Spec (ou no PR Plan).
11. **Pipeline Creative OS:** A IA deve respeitar a separação estrita de motores (Engines). Nunca pule etapas estratégicas (ex: tentar definir cor e layout sem passar pelo `Creative Strategy`). Cada motor faz apenas o que seu domínio exige e repassa o dado adiante.

## 4. Fluxo de Ação da IA

Quando uma IA for instruída a "Criar X" pelo usuário, ela deverá operar sob o fluxo [Spec-Driven Engineering](./ENGINEERING.md):
1. Verificar os ADRs e Standards em `/docs`.
2. Propor o plano (Implementation Plan).
3. Aguardar aprovação do humano.
4. Executar e documentar no respectivo Walkthrough/Playbook as razões técnicas adotadas.

## 5. Ligações e Referências (Cross-Links)
- ⚙️ [**Coding Standards**](./architecture/coding-standards.md): Complemento vital de regras de nomeação e clean code.
- 🏗️ [**System Overview**](./SYSTEM.md): A porta de entrada do projeto.

## 6. Histórico de Versão
- **v1.0.0 (01/07/2026):** Primeira edição do Rulebook estabelecendo restrições para agentes de IA.
