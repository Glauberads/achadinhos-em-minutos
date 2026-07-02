import { videoRenderService } from './apps/api/src/services/video-render.service';

async function test() {
  try {
    const scenes = [
      { id: '1', url: 'https://placehold.co/600x800/png?text=1', duration: 2, animation: 'static' },
      { id: '2', url: 'https://placehold.co/600x800/png?text=2', duration: 2, animation: 'static' }
    ];
    console.log('Testing videoRenderService...');
    const result = await videoRenderService.renderVideo('test-id', scenes);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
