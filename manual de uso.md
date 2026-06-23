# Achadinhos em Minutos - Manual de Uso

Este manual orienta você a utilizar o seu motor de afiliação passo a passo, extraindo o máximo da ferramenta e automatizando a gestão dos seus canais de oferta.

## 1. Primeiros Passos: Conectando o Telegram
Para que o sistema consiga disparar as ofertas automaticamente, você precisa conectar o seu Bot do Telegram.

1. Acesse a aba **Telegram** no menu lateral.
2. Acesse o **BotFather** no seu próprio aplicativo do Telegram e copie o **Token** do seu robô (ex: `1234567890:AAH...`).
3. Cole o Token no campo indicado.
4. Digite o **ID do seu Chat ou Grupo**.
   - Se o seu canal for **público**, digite `@nome_do_canal`.
   - Se for **privado**, adicione o robô `@RawDataBot` no seu canal para descobrir o ID numérico (ex: `-100123456789`).
5. **DICA DE OURO:** O seu bot precisa ser adicionado como **Administrador** no canal para poder enviar mensagens!
6. Clique em **Salvar Conexão**. Você verá um card verde indicando "Bot Ativo".

## 2. Configurando Marketplaces (Shopee e Mercado Livre)
Para que você ganhe comissões nas ofertas automáticas importadas pelo sistema, você deve conectar as suas próprias chaves das plataformas de afiliação.

1. Acesse a aba **Configurações** no menu lateral.
2. No painel de Integrações, você verá os cards da **Shopee Affiliate** e **Mercado Livre**.
3. Clique em **Configurar Shopee** ou **Configurar Mercado Livre**.
4. Insira as chaves fornecidas pelas plataformas (App ID, App Secret, Client ID, etc.) e seu ID de Afiliado.
5. Fique tranquilo: Seus segredos (App Secret/Client Secret) são **criptografados** no exato momento em que você clica em Salvar, e nunca mais são exibidos na tela por questões de segurança.
6. Uma vez salvo, as buscas automáticas da aba "Buscar Produtos" já farão o rastreio usando o seu ID!

## 3. Automação (A Máquina de Vendas 24/7)
Com o Telegram e seus Marketplaces conectados, você pode deixar o sistema trabalhando sozinho.

1. Acesse a aba **Automação (Ícone de Robô)** no menu lateral.
2. Clique em **Nova Campanha**.
3. Escolha um nome, a plataforma de busca (ex: Mercado Livre) e a Palavra-chave do que o robô deve buscar (ex: "Fritadeira Elétrica").
4. Selecione o grupo do Telegram de destino e a frequência de disparo.
5. Clique em **Ativar Robô**.
6. **Pronto!** O robô vai acordar nos horários programados, buscar os produtos na plataforma, salvar na sua conta, confirmar se o link de afiliado está preenchido, e então disparar os posts para o Telegram um por um, usando travas de inteligência anti-spam para não sobrecarregar o canal.
7. Se quiser forçar uma execução fora de hora, basta clicar em **Rodar** na campanha criada.

## 4. Buscar Produtos Manualmente
Se você quiser ter mais controle no garimpo:

1. Acesse a aba **Buscar Produtos**.
2. Digite o que deseja vender na barra de pesquisa (Ex: `Fone Bluetooth`).
3. Escolha a plataforma e clique em **Buscar Ofertas**.
4. O sistema vai exibir uma grade com os produtos mais relevantes ou em alta.
5. Selecione os produtos e clique no botão **Importar Selecionados**. O sistema irá salvá-los no seu banco de dados e aplicar proteções anti-duplicidade.

*Nota sobre a Shopee: Caso as suas chaves cadastradas na aba Configurações ainda estejam sob análise pela Shopee, o sistema continuará funcionando perfeitamente trazendo produtos "Fallback" simulados.*

## 5. Gestão e Disparo de Produtos (Envio Manual)
Aqui é onde a mágica de monetização acontece. 

1. Acesse a aba **Produtos** no menu lateral. 
2. Você verá todos os itens que você cadastrou manualmente ou que você importou da busca automática.
3. Se um produto não tiver um **Link de Afiliado** preenchido (sinalizado com um alerta), você deve editá-lo e colar o link gerado pelo seu painel de afiliado (necessário principalmente no Mercado Livre público).
4. Estando tudo certo, clique no **Botão de Avião de Papel** ✈️ ("Enviar Teste").
5. O sistema vai montar automaticamente uma mensagem super persuasiva, contendo:
   - Título e foto do produto.
   - Preço De / Por (com desconto).
   - Selos de confiança (Frete Grátis, Alta Venda).
   - Seu link de afiliado rastreável.
6. Confira no seu Telegram se a notificação chegou perfeitamente!

## 6. O Dashboard e Estatísticas
Na tela inicial **Dashboard**, você tem um painel de controle executivo duplo:
- **Motor Automático (Fase 4):** Acompanha as Campanhas Ativas, quantos produtos estão na Fila para Envio, Envios de hoje e falhas (caso o robô ache produtos sem link de afiliado).
- **Geral:** Total de produtos importados, Grupos conectados, total de sucesso e falha no histórico.
- **Histórico de Envio:** Acompanhamento dos disparos reais com os CTAs apontando para a sua conta de afiliação.s.

Aproveite ao máximo o seu SaaS e boas vendas!
