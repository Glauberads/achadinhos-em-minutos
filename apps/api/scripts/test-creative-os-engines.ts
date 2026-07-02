import { visualIntelligenceService } from '../src/services/visual-intelligence.service';
import { marketIntelligenceService } from '../src/services/market-intelligence.service';
import { creativeIntelligenceService } from '../src/services/creative-intelligence.service';
import { creativeStrategyService } from '../src/services/creative-strategy.service';
import { learningEngineService } from '../src/services/learning-engine.service';
import { featureFlagService } from '../src/services/feature-flag.service';
import { executionPlannerService } from '../src/services/engines/execution-planner.service';
import { creativeReviewerService } from '../src/services/engines/creative-reviewer.service';
import { creativeOsOrchestrator } from '../src/services/creative-os.orchestrator';
import { config } from 'dotenv';
config();

async function runTests() {
  console.log('--- Iniciando Teste dos Motores Analíticos (Creative OS) ---');

  // Forçar ativação da feature flag para o teste
  const originalToggle = featureFlagService.toggleFlag;
  featureFlagService.toggleFlag = async () => true;
  featureFlagService.isEnabled = async () => true;
  console.log('[Setup] Feature flag "creative_os" ativada simuladamente para o teste.\n');

  try {
    // 1. Visual Intelligence
    console.log('[1/5] Executando Visual Intelligence...');
    const visualData = await visualIntelligenceService.analyze({
      imageUrl: 'https://example.com/produto-beleza.jpg',
      productName: 'Creme facial com modelo'
    });
    console.log('Visual Data:', visualData);

    // 2. Market Intelligence
    console.log('\n[2/5] Executando Market Intelligence...');
    const marketData = await marketIntelligenceService.analyze({
      niche: 'Beleza e Skincare',
      price: 29.90
    });
    console.log('Market Data:', marketData);

    // 3. Creative Intelligence
    console.log('\n[3/5] Executando Creative Intelligence...');
    const creativeData = await creativeIntelligenceService.analyzeForCreativeOS({
      platform: 'tiktok',
      audience: marketData.targetAudience
    });
    console.log('Creative Data:', creativeData);

    // 4. Creative Strategy (Cérebro)
    console.log('\n[4/5] Executando Creative Strategy (Orquestrador)...');
    const strategyData = await creativeStrategyService.buildStrategy({
      visualData,
      marketData,
      creativeData
    });
    console.log('--- CREATIVE DNA FINAL ---');
    console.log(strategyData);

    // 4.5 Execution Planner
    console.log('\n[4.5] Executando Execution Planner (Consolidado)...');
    const executionPlan = await executionPlannerService.planExecution(strategyData);
    console.log('--- EXECUTION PLAN (Parcial) ---');
    console.log('Hook:', executionPlan.hook);
    console.log('Color:', executionPlan.color);

    // 4.6 Reviewer
    console.log('\n[4.6] Executando Reviewer (Dual Score)...');
    const review = await creativeReviewerService.review(executionPlan);
    console.log('--- REVIEW RESULTS ---');
    console.log(review);

    // 5. Learning Engine
    console.log('\n[5/5] Executando Learning Engine...');
    const learningData = await learningEngineService.learnFromCreativeOS({
      creativeId: 'test-creative-123',
      performanceMetrics: {
        views: 1000,
        clicks: 50,
        ctr: 5.0
      }
    });
    console.log('Learning Insights:', learningData);

    console.log('\n[TESTE DO ORQUESTRADOR]');
    console.log('Iniciando o Orquestrador Completo...');
    const orchestratorResult = await creativeOsOrchestrator.generate({
      niche: 'Moda e Acessórios',
      platform: 'reels',
      price: 199.90,
      productName: 'Bolsa de Couro Luxo'
    });
    console.log('Metadata Final do Orquestrador:', orchestratorResult.metadata);

    console.log('\n✅ Todos os testes concluídos com sucesso! Zod validation OK.');

  } catch (error: any) {
    console.error('\n❌ Erro durante os testes:', error);
  }
}

runTests();
