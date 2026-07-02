# Padrões de Código e Desenvolvimento (Coding Standards)

> [!IMPORTANT]
> Estas são as **leis imutáveis** do projeto. O não cumprimento destas regras resultará em falhas sistêmicas de segurança ou performance. Todo o código submetido (seja por um engenheiro ou gerado por IA) deve respeitá-las estritamente.

## 1. Regras Estruturais (Backend)

### 1.1 Repository Pattern Rigoroso
- **NUNCA acesse o banco de dados diretamente de Rotas (`routes/`) ou Workers (`workers/`).**
- **Sempre utilize um Repositório:** Apenas arquivos dentro de `src/repositories/` têm autorização de importar e usar o `supabaseAdmin`.
- **Justificativa:** Garantir que consultas, caching de consultas ou trocas futuras de ORM (ex: Prisma, Drizzle) exijam mudança em apenas um lugar.

### 1.2 Regras de Negócio em Services
- As Rotas não devem conter nenhuma lógica de validação complexa, lógica de faturamento, ou lógica de IA. Rotas apenas chamam as validações do Zod e em seguida repassam os dados validados ao Service correspondente.
- Todo domínio central (Creative, Campaign, Product) deve ter um `<dominio>.service.ts`.

### 1.3 Validação Inflexível de Entradas
- **Sempre valide payloads:** Toda rota da API deve obrigatoriamente tipar o objeto JSON recebido e validá-lo. (Atualmente, usamos as asserções nativas em Typescript / tratamentos tipados no Fastify). Nunca confie cegamente no body enviado pelo usuário.

### 1.4 Princípio da Proteção RLS no DB
- Nenhuma tabela do PostgreSQL no Supabase deve ser criada sem possuir `Row Level Security (RLS)`.
- Toda policy RLS deve verificar `auth.uid() = user_id`.
- Se a aplicação falhar de alguma forma em filtrar registros no backend via WHERE clause de código, o RLS atuará como a rede de segurança.

## 2. Operações e Telemetria

### 2.1 Eventos Mandatórios (Workers e Services)
- Os Workers operam num "buraco negro" (background process). Eles devem emitir Domain Events via `EventBus` toda vez que começarem, falharem ou concluírem um trabalho importante.
- O EventBus roteia a mensagem para Telemetria ou Audit Log. Nunca grave diretamente no Audit Log sem emitir um Evento genérico antes.

### 2.2 Feature Flags
- Novas integrações de IA, novos módulos de edição visual, novos Providers e novos recursos de assinatura devem sempre ser cercados por uma verificação de `FeatureFlagService.isEnabled('nome_flag')`.
- O código deve lidar graciosamente caso a Flag retorne `false` (por exemplo, retornar fallback ou negar acesso com Status 403).

### 2.3 Logs Não-Ruidosos
- Evite espalhar `console.log()` com objetos massivos na produção, pois isso sobrecarrega o coletor de logs do docker/sistema host.
- Use `console.error` unicamente quando uma exceção não-tratada for capturada. E use eventos para monitorar sucessos lógicos.

## 3. Qualidade do Código

### 3.1 DRY (Don't Repeat Yourself)
- Nunca duplique integrações. Se três módulos diferentes usam o Anthropic/Claude, abstraia em um `ai-client.ts`.
- Evite funções utilitárias isoladas; se for genérico, mova para uma pasta ou arquivo `utils`. Se for de negócio, agrupe no Service.

### 3.2 Imutabilidade
- No Frontend, o estado (useState/Contexts) deve ser sempre tratado de forma imutável.
- Ao atualizar arrays ou objetos com respostas da API, use espalhamento (spread operators) e nunca mute variáveis originais da árvore.

### 3.3 TypeScript Inflexível
- Evite `any`. A única exceção aceitável para o uso do tipo `any` são nos casos explícitos de catch block `catch (err: any)`. Para outros casos, crie tipagens precisas ou `interfaces` no arquivo apropriado.

## 4. O Checklist do Desenvolvedor

Antes de criar um PR ou confirmar uma task:
- [ ] Eu coloquei a validação da rota?
- [ ] O repositório foi chamado ao invés de bater no DB direto da rota?
- [ ] O serviço emitiu um Evento se esta ação foi crítica?
- [ ] Minha alteração afetou o frontend? O tipo mudou e quebrou o build TS lá?
- [ ] O código lida com erros graciosamente (4xx/5xx limpos)?
