import { z } from 'zod';

export const CreativeDnaV2Schema = z.object({
  creative_dna_version: z.literal('v2'),
  product_category: z.string().describe("Categoria principal do produto (ex: Casa inteligente, Beleza)"),
  marketplace: z.string().describe("Plataforma de onde o produto foi extraído (ex: Shopee, Mercado Livre)"),
  offer_strength: z.string().describe("Avaliação da força da oferta (ex: Muito forte, Moderada)"),
  price_attractiveness: z.string().describe("O quão atraente é o preço frente aos concorrentes"),
  audience_temperature: z.enum(['cold', 'warm', 'hot']).describe("Temperatura do público-alvo"),
  awareness_level: z.enum(['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware']).describe("Nível de consciência do consumidor de acordo com Eugene Schwartz"),
  risk_level: z.string().describe("O nível de risco percebido da compra (ex: Alto para eletrônicos caros)"),
  compliance_notes: z.string().describe("Regras da plataforma que não podem ser quebradas (ex: restrição do TikTok)"),
  claims_allowed: z.array(z.string()).describe("Afirmações permitidas para o produto"),
  claims_blocked: z.array(z.string()).describe("Afirmações bloqueadas ou enganosas (red flags)"),
  target_audience: z.string().describe("Público-alvo primário (ex: Mulheres de 25-45 anos, Donas de casa)"),
  pain_points: z.array(z.string()).describe("Lista de dores que o produto resolve"),
  desired_outcome: z.string().describe("O sonho ou resultado final que o cliente busca"),
  big_promise: z.string().describe("A maior promessa tangível que o produto entrega"),
  unique_mechanism: z.string().describe("O mecanismo único de funcionamento (por que só ele resolve assim)"),
  offer_angle: z.string().describe("Ângulo de venda (ex: Risk Reversal, Value Stacking)"),
  emotional_driver: z.string().describe("O gatilho emocional primário (ex: Medo de perder, Status)"),
  primary_hook: z.string().describe("O texto falado e visual que captura a atenção nos 3 primeiros segundos"),
  secondary_hook: z.string().describe("Um hook alternativo caso o primário seja refinado no A/B"),
  cta_strategy: z.string().describe("A estratégia do call to action (ex: Escassez, Curiosidade)"),
  visual_style: z.string().describe("O estilo visual esperado (ex: Minimalista, Cores Neon, Dinâmico)"),
  color_strategy: z.string().describe("Esquema de cores a ser utilizado nas legendas e backgrounds"),
  typography_strategy: z.string().describe("A estratégia de tipografia para os textos na tela"),
  motion_strategy: z.string().describe("Velocidade e agressividade da transição de cenas"),
  platform_strategy: z.string().describe("Regras específicas para a plataforma (ex: TikTok, Reels)"),
  urgency_strategy: z.string().describe("Como a urgência/escassez será criada sem mentiras"),
  social_proof_strategy: z.string().describe("Como a prova social será introduzida na copy (estrelas, reviews)"),
  trust_strategy: z.string().describe("Como ganhar a confiança do cliente (garantia)"),
  objection_strategy: z.string().describe("Qual a maior objeção e como quebrá-la"),
  conversion_goal: z.string().describe("O objetivo da conversão (ex: Clique no link da bio, Adicionar ao carrinho)")
});

export type CreativeDnaV2 = z.infer<typeof CreativeDnaV2Schema>;
