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

## 3. Buscar Produtos Automaticamente (O Motor Principal)
Ao invés de caçar links na mão, o sistema faz isso por você.

1. Acesse a aba **Buscar Produtos**.
2. Digite o que deseja vender na barra de pesquisa (Ex: `Fone Bluetooth`, `Fritadeira Air Fryer`).
3. Escolha a plataforma (Shopee ou Mercado Livre) e clique em **Buscar Ofertas**.
4. O sistema vai exibir uma grade com os produtos mais relevantes ou em alta, mostrando o preço, desconto e os sinais de venda.
5. Clique na imagem dos produtos que você acha atraentes (ficará com borda roxa).
6. Clique no botão **Importar Selecionados** no topo da lista. O sistema irá salvá-los no seu banco de dados e aplicar proteções anti-duplicidade.

*Nota sobre a Shopee: Caso as suas chaves cadastradas na aba Configurações ainda estejam sob análise pela Shopee (ou ausentes), o sistema continuará funcionando perfeitamente trazendo produtos "Fallback" simulados, para que a sua operação não pare.*

## 4. Gestão e Disparo de Produtos (O Envio Final)
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

## 5. O Dashboard e Estatísticas
Na tela inicial **Dashboard**, você tem um painel de controle executivo:
- **Resumo Geral:** Total de produtos que você já importou/cadastrou, quantos grupos estão conectados.
- **Taxa de Entregabilidade:** Acompanhamento de quantos envios ocorreram com "Sucesso" (chegaram no Telegram) e quantas "Falhas" ocorreram.
- **Feed em Tempo Real:** Uma lista inferior mostra o log dos seus últimos disparos.

Aproveite ao máximo o seu SaaS e boas vendas!
