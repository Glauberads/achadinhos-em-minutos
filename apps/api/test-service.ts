import { imageCreativeService } from './src/services/image-creative.service';
import { creativeRepository } from './src/repositories/creative.repository';

async function run() {
  try {
    console.log('Starting...');
    const url = 'https://shopee.com.br/Panela-de-Press%C3%A3o-El%C3%A9trica-Digital-5-6-litros-Preta-ou-Inox-kian-i.563110312.22694663438?extraParam=123';
    
    const creative = await imageCreativeService.generateFromLink(url, 'story', 'Oferta Relâmpago', '2e08e6ca-3e6c-48be-a690-d47da153f36a');
    console.log('SUCCESS:', creative);
  } catch (err) {
    console.error('BIG ERROR:', err);
  } finally {
    // delay to flush
    setTimeout(() => process.exit(0), 500);
  }
}

run();
