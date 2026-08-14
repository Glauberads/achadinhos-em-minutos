# Offer Frameworks (Estruturas de Oferta)

Uma oferta no *Creative OS* não é apenas o "Preço". É o ângulo pelo qual o produto e a transação são apresentados à audiência, visando reduzir a percepção de risco e aumentar o valor intrínseco (Value Proposition).

## 1. Princípios Básicos de Oferta
A Oferta de um "Achadinho" deve responder mentalmente:
- Por que este produto? (Diferenciação)
- Por que de você/desse vendedor? (Confiança/Autoridade)
- Por que agora? (Urgência/Escassez)
- Por que a esse preço? (Justificativa lógica)

## 2. Risk Reversal (Reversão de Risco)
A redução do medo do consumidor em perder dinheiro ou fazer uma má escolha. Em marketplaces, usamos as regras da própria plataforma a nosso favor.
- **Aplicação para Shopee:** "E se você não gostar? A devolução é grátis pela garantia da plataforma."
- **Aplicação para Mercado Livre:** "Sua compra está garantida pelo Compra Garantida. Receba o que comprou ou seu dinheiro de volta na hora."
- **Regra da IA:** Use Reversão de Risco para produtos com ticket médio > R$ 150 ou eletrônicos desconhecidos.

## 3. Price Anchoring (Ancoragem de Preço)
É a técnica de estabelecer um preço inicial alto para tornar o preço atual irresistível por contraste.
- **Conceito:** O consumidor julga o valor relativo, não absoluto.
- **Aplicação em Achadinhos:** "Se você fosse comprar isso no shopping ou loja oficial, custaria mais de R$ 300 (Âncora). Mas achei o fornecedor na plataforma vendendo por apenas R$ 59,90 (Oferta Real)."
- **Restrição de Compliance:** Não invente um preço âncora abusivamente distante da realidade apenas para causar choque. Baseie-se no `original_price` extraído. Se ele não existir ou for implausível, use a âncora de concorrentes genéricos: "Um modelo de marca conhecida sai caro, mas essa versão entrega o mesmo por menos da metade".

## 4. Value Stacking (Empilhamento de Valor)
Em vez de diminuir o preço, aumente a percepção do que o cliente está levando.
- **Quando usar:** Produtos que acompanham brindes, kits (Leve 3 Pague 2) ou frete grátis.
- **Aplicação:** "Você não está levando só uma garrafa. É o modelo térmico de 2L, que já vem com canudo de silicone, alça reforçada e ainda tem frete grátis na loja hoje."

## 5. Justification (A Razão do Porquê)
Ofertas boas demais sem justificativa geram desconfiança. O cérebro precisa de uma desculpa lógica.
- **Aplicação:** "A loja está fazendo uma queima de estoque absurda porque..." ou "Este vendedor acabou de abrir a loja e está dando descontos insanos nas primeiras vendas para ganhar reputação na plataforma."
- **Regra da IA:** Use *Justification* se o desconto (`discount_percentage`) extraído do produto for > 50%.

## 6. Integração com o CreativeDNA V2
O Prompt Builder usará esses frameworks preenchendo o `offer_angle` do objeto `CreativeDNA V2`. A IA precisa identificar, baseada no `price_attractiveness`, qual a melhor tática.
- Se é muito barato e simples -> Focar em Value Stacking + Frete.
- Se é caro (ticket alto) -> Focar em Risk Reversal + Price Anchoring.
