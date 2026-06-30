const fs = require('fs');

const replaceInFile = (file, replacements) => {
  let content = fs.readFileSync(file, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(file, content);
};

// 1. Fix queue
replaceInFile('apps/api/src/queues/creative-render.queue.ts', [
  ['../config/redis', '../lib/redis']
]);

// 2. Fix repository
replaceInFile('apps/api/src/repositories/creative.repository.ts', [
  ['../config/supabase', '../lib/supabase']
]);

// 3. Fix routes (EventBus)
replaceInFile('apps/api/src/routes/creatives.ts', [
  ["import { eventBus } from '../events/event-bus';", "import { eventBus, FeatureDisabledEvent, CreativeSavedEvent } from '../events';"],
  ["eventBus.publish('FeatureDisabledEvent', { feature_key: 'creative_studio_ai' }, { user_id: request.user?.id, source: 'API' });", "eventBus.emit(new FeatureDisabledEvent({ feature_key: 'creative_studio_ai' }, { user_id: request.user?.id, source: 'API' }));"],
  ["eventBus.publish('CreativeSavedEvent', { creative_id: request.params.id }, { user_id: request.user.id, source: 'API' });", "eventBus.emit(new CreativeSavedEvent({ creative_id: request.params.id }, { user_id: request.user.id, source: 'API' }));"]
]);

// 4. Fix AI Service
replaceInFile('apps/api/src/services/creative-ai.service.ts', [
  ["import { eventBus } from '../events/event-bus';", "import { eventBus, CreativeFailedEvent } from '../events';"],
  ["const data = await response.json();", "const data = await response.json() as any;"],
  ["eventBus.publish('CreativeFailedEvent', { \n        creative_id: 'system', \n        error_message: `Gemini Fallback Triggered: ${(error as Error).message}` \n      }, { source: 'CreativeAIService' });", "eventBus.emit(new CreativeFailedEvent({ creative_id: 'system', error_message: `Gemini Fallback Triggered: ${(error as Error).message}` }, { source: 'CreativeAIService' }));"]
]);

// 5. Fix Studio Service
replaceInFile('apps/api/src/services/creative-studio.service.ts', [
  ["import { eventBus } from '../events/event-bus';", "import { eventBus, CreativeGenerationStartedEvent, CreativeFailedEvent, CreativeUpdatedEvent, CreativeDeletedEvent } from '../events';"],
  ["eventBus.publish('CreativeGenerationStartedEvent', { \n      creative_id: creative.id!, \n      product_url: url \n    }, { user_id: userId, source: 'CreativeStudioService' });", "eventBus.emit(new CreativeGenerationStartedEvent({ creative_id: creative.id!, product_url: url }, { user_id: userId, source: 'CreativeStudioService' }));"],
  ["eventBus.publish('CreativeFailedEvent', { \n        creative_id: creative.id!, \n        error_message: errorMsg \n      }, { user_id: userId, source: 'CreativeStudioService' });", "eventBus.emit(new CreativeFailedEvent({ creative_id: creative.id!, error_message: errorMsg }, { user_id: userId, source: 'CreativeStudioService' }));"],
  ["eventBus.publish('CreativeUpdatedEvent', { creative_id: id }, { user_id: userId, source: 'CreativeStudioService' });", "eventBus.emit(new CreativeUpdatedEvent({ creative_id: id }, { user_id: userId, source: 'CreativeStudioService' }));"],
  ["eventBus.publish('CreativeDeletedEvent', { creative_id: id }, { user_id: userId, source: 'CreativeStudioService' });", "eventBus.emit(new CreativeDeletedEvent({ creative_id: id }, { user_id: userId, source: 'CreativeStudioService' }));"]
]);

// 6. Fix Video Render Service
replaceInFile('apps/api/src/services/video-render.service.ts', [
  ["import { eventBus } from '../events/event-bus';", "import { eventBus, CreativeFallbackGeneratedEvent } from '../events';"],
  ["eventBus.publish('CreativeFallbackGeneratedEvent', {\n      creative_id: creativeId,\n      reason: error.message\n    }, { source: 'VideoRenderService' });", "eventBus.emit(new CreativeFallbackGeneratedEvent({ creative_id: creativeId, reason: error.message }, { source: 'VideoRenderService' }));"]
]);

// 7. Fix Worker
replaceInFile('apps/api/src/workers/creative-render.worker.ts', [
  ["import { redisConnection } from '../config/redis';", "import { redisConnection } from '../lib/redis';"],
  ["import { supabaseAdmin } from '../config/supabase';", "import { supabaseAdmin } from '../lib/supabase';"],
  ["import { eventBus } from '../events/event-bus';", "import { eventBus, CreativeRenderStartedEvent, CreativeRenderFinishedEvent, CreativeGeneratedEvent, CreativeRenderFailedEvent } from '../events';"],
  ["eventBus.publish('CreativeRenderStartedEvent', { creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' });", "eventBus.emit(new CreativeRenderStartedEvent({ creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' }));"],
  ["eventBus.publish('CreativeRenderFinishedEvent', { creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' });", "eventBus.emit(new CreativeRenderFinishedEvent({ creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' }));"],
  ["eventBus.publish('CreativeGeneratedEvent', { creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' });", "eventBus.emit(new CreativeGeneratedEvent({ creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' }));"],
  ["eventBus.publish('CreativeRenderFailedEvent', { \n        creative_id: creativeId, \n        error_message: errorMessage \n      }, { user_id: userId, source: 'CreativeRenderWorker' });", "eventBus.emit(new CreativeRenderFailedEvent({ creative_id: creativeId, error_message: errorMessage }, { user_id: userId, source: 'CreativeRenderWorker' }));"],
  ["const videoBuffer = fs.readFileSync(result.videoPath);", "const videoBuffer = fs.readFileSync((result as any).videoPath);"],
  ["const videoExt = path.extname(result.videoPath);", "const videoExt = path.extname((result as any).videoPath);"],
  ["const thumbBuffer = fs.readFileSync(result.thumbnailPath);", "const thumbBuffer = fs.readFileSync((result as any).thumbnailPath);"],
  ["const thumbExt = path.extname(result.thumbnailPath);", "const thumbExt = path.extname((result as any).thumbnailPath);"],
  ["fs.rmSync(path.dirname(result.videoPath)", "fs.rmSync(path.dirname((result as any).videoPath)"]
]);

// 8. Fix Parser
replaceInFile('apps/api/src/services/product-link-parser.service.ts', [
  ["import { shopeeProvider } from '../providers/products/shopee.provider';", "import { ShopeeProvider } from '../providers/products/shopee.provider';"],
  ["import { mercadoLivreProvider } from '../providers/products/mercadolivre.provider';", "import { MercadoLivreProvider } from '../providers/products/mercadolivre.provider';"],
  ["shopeeProvider", "new ShopeeProvider()"],
  ["mercadoLivreProvider", "new MercadoLivreProvider()"]
]);

console.log('Fixes applied.');
