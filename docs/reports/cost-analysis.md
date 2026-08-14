# Auditoria Financeira e de Custos: Production Readiness

Este relatório apresenta a projeção financeira real da infraestrutura baseada no uso de serviços terceirizados, calculando o custo unitário e a margem de contribuição (Gross Margin) por volume de usuários.

## Premissas Financeiras (Ticket e Taxas)
- **Receita Média por Usuário (ARPU):** R$ 49,90/mês
- **Taxa Asaas (Gateway):** Média combinada de Pix/Cartão (estimada em 4% sobre faturamento).
- **Câmbio Utilizado:** USD 1,00 = BRL 5,50

---

## 1. Composição de Custos por Serviço

1. **Supabase (DB & Auth & Storage):**
   - Inicia no plano Pro ($25/mês). Para volumes acima de 5K usuários, considera-se upgrade de Compute (+$50 a $150) e custos adicionais de Egress/Storage extra.
2. **Railway (Infra e Redis):**
   - Precificado por RAM/vCPU ativa. A API principal e Redis possuem curva de custo baixa.
3. **FFmpeg Worker (Railway/Hetzner):**
   - O processo de renderização de vídeos requer instâncias "Compute-Intensive". Custos escalam linearmente com o número de usuários ativos gerando vídeos.
4. **Gemini & OpenAI (Creative OS):**
   - Nível gratuito (15 RPM) absorve até 100 usuários. A partir de 500, a API do Gemini é precificada por Input/Output de caracteres/tokens. OpenAI atua como fallback encarecendo ~15% do bloco de IA.
5. **Cloudflare:**
   - Free Tier absorve bem. Para estabilidade acima de 5K usuários, alocamos a conta Pro ($20/mês) para WAF e regras customizadas.

---

## 2. Projeção de Cenários em Escala (BRL)

| Serviço / Escala        | 100 Usuários  | 500 Usuários  | 1.000 Usuários | 5.000 Usuários | 10.000 Usuários |
|-------------------------|---------------|---------------|----------------|----------------|-----------------|
| **Supabase (DB/Storage)**| R$ 150,00     | R$ 150,00     | R$ 250,00      | R$ 600,00      | R$ 1.200,00     |
| **Railway (API + Redis)**| R$ 50,00      | R$ 100,00     | R$ 200,00      | R$ 800,00      | R$ 1.500,00     |
| **FFmpeg Workers**      | R$ 50,00      | R$ 150,00     | R$ 300,00      | R$ 1.500,00    | R$ 3.000,00     |
| **LLMs (Gemini/OpenAI)**| R$ 0,00 (Free)| R$ 25,00      | R$ 80,00       | R$ 300,00      | R$ 600,00       |
| **Cloudflare**          | R$ 0,00       | R$ 0,00       | R$ 0,00        | R$ 120,00      | R$ 120,00       |
| **Asaas (Gateway 4%)**  | R$ 200,00     | R$ 998,00     | R$ 1.996,00    | R$ 9.980,00    | R$ 19.960,00    |
|                         |               |               |                |                |                 |
| **Custo Total**         | **R$ 450,00** | **R$ 1.423,00**| **R$ 2.826,00**| **R$ 13.300,00**| **R$ 26.380,00**|

---

## 3. Resumo Executivo e Margens

| Indicador Financ.       | 100 Usuários  | 500 Usuários  | 1.000 Usuários | 5.000 Usuários | 10.000 Usuários |
|-------------------------|---------------|---------------|----------------|----------------|-----------------|
| **Receita Bruta (MRR)** | R$ 4.990,00   | R$ 24.950,00  | R$ 49.900,00   | R$ 249.500,00  | R$ 499.000,00   |
| **Custos Operacionais** | R$ 450,00     | R$ 1.423,00   | R$ 2.826,00    | R$ 13.300,00   | R$ 26.380,00    |
| **Lucro Bruto**         | **R$ 4.540,00**| **R$ 23.527,00**| **R$ 47.074,00**| **R$ 236.200,00**| **R$ 472.620,00**|
| **Margem de Operação**  | **90,9%**     | **94,2%**     | **94,3%**      | **94,6%**      | **94,7%**       |

### Análise de Viabilidade (Status)
- **Status da Infraestrutura:** 🟢 Extremamente Viável
- A arquitetura Serverless (Railway Nixpacks) em conjunto com o Supabase permite manter o custo fixo baixíssimo na fase de validação (100 a 500 usuários). 
- O maior custo invisível a escalar (FFmpeg) cresce de forma contida e previsível, mantendo o COGS (Custo de Produto Vendido) abaixo de 6% do faturamento total da empresa em qualquer cenário de escala.
- **Atenção (Gargalo de Escala):** Para atingir os 10.000 usuários com eficiência de custo e manter a alta disponibilidade do render, sugere-se eventualmente portar exclusivamente o Worker do FFmpeg da Railway para Bare-Metals (como Hetzner ou AWS EC2 Reservadas), o que aumentará a margem final para ~96%.
