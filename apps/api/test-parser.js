require('dotenv').config();
const { productLinkParserService } = require('./dist/services/product-link-parser.service');

async function run() {
  process.env.DEBUG_PRODUCT_IMAGE_EXTRACTION = 'true';
  const data = await productLinkParserService.parseAndFetch('https://shopee.com.br/Bicicleta-Mountain-Bike-Aro-29-Freio-A-Disco-i.12345.67890');
  console.log(JSON.stringify(data, null, 2));
}

run();
