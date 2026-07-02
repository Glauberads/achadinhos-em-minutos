# Spec: [Nome do Módulo Backend]

> [!NOTE]
> **Como usar este Template:** Utilize o `backend-template.md` quando for estruturar uma pasta inteira no servidor que conterá Controllers, Services, e Events simultâneos, sem envolver o frontend.
> **Exemplo Preenchido:** `Módulo de Autenticação OAuth`

## 1. Metadados
| Propriedade | Detalhe |
|---|---|
| **Título** | Novo Módulo de OAuth |
| **Autor** | [Seu Nome] |
| **Data de Criação** | DD/MM/AAAA |
| **Status** | `Draft` |
| **Versão** | 1.0.0 |
| **Responsável** | Backend Squad |
| **Última Atualização** | DD/MM/AAAA |

## 2. Objetivo
Criar as engrenagens completas para aceitar Logins vindos de sistemas externos.

## 3. Contexto
No momento apenas dependemos do email/senha do Supabase. O módulo deve ser generalizado para Google e Facebook.

## 4. Requisitos Funcionais
- **RF01:** Múltiplas rotas callback para injetar os Tokens.
- **RF02:** Um service abstrato `OAuthService` que unifique a criação de contas de qualquer Provider.

## 5. Requisitos Não Funcionais
- **Segurança:** Tratar vazamento de Redirect URIs abertas (Prevenção CSRF).

## 6. Arquitetura
- Abstração completa num domínio `auth`, isolando do arquivo `routes.ts` genérico.

## 7. Banco de Dados
- N/A

## 8. Backend
- **Rotas:** `/api/auth/callback/google`
- **Services:** `AuthService`, `GoogleAuthStrategy`.
- **Validators:** Validar State token do OAuth.
- **Feature Flags:** `ff_social_login`

## 9. Frontend
- N/A

## 10. Integrações
- Integrações configuradas na Cloud do Provider (Google GCP).

## 11. Segurança
- Validação estrita de Header "Origin" nas chamadas.
- Limite (Rate limit) nas tentativas.

## 12. Performance
- N/A

## 13. Observabilidade
- Evento `UserSocialLoggedIn` deve ser emitido.

## 14. Fallbacks
- Se Provider falhar, direcionar o user para login de email/senha com mensagem de erro clara na URI (`?error=provider_down`).

## 15. Critérios de Aceite
- [ ] Login pelo Google cria ou atualiza `profiles` e redireciona ao painel com JWT setado.

## 16. Plano de Testes
- Mock tests pesados em cima da URL de redirecionamento.

## 17. Plano de Rollback
- Reverter as rotas `/auth`.

## 18. Impacto
- Altera porta de entrada principal de acessos.

## 19. Roadmap
- Estender para Apple Sign In.
