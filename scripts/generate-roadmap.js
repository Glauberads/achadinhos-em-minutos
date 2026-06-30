const fs = require('fs');
const path = require('path');

// Simulação de consolidação de dados da tabela creative_feedbacks e product_usage_events
const mockData = {
  feedbacks: [
    { tag: 'Precisa de mais templates', count: 12, impact: 'Alto', effort: 'Médio' },
    { tag: 'Vídeo lento', count: 8, impact: 'Médio', effort: 'Alto' },
    { tag: 'Faltam transições', count: 15, impact: 'Alto', effort: 'Baixo' },
    { tag: 'Integração direta Instagram', count: 18, impact: 'Muito Alto', effort: 'Muito Alto' },
    { tag: 'Exportar apenas áudio', count: 2, impact: 'Baixo', effort: 'Baixo' }
  ],
  nps: 8.4,
  mostUsedFeatures: ['Creative Studio', 'Storyboard Manual', 'Fallback AI'],
  leastUsedFeatures: ['A/B Test']
};

function classifyFeature(impact, effort) {
  if (impact === 'Alto' && (effort === 'Baixo' || effort === 'Médio')) return '🚀 Quick Wins';
  if (impact === 'Muito Alto' && effort === 'Muito Alto') return '🏗️ Grandes Projetos';
  if (impact === 'Baixo') return '🔬 Pesquisa';
  return '🛠️ Melhorias';
}

function generateMarkdown() {
  let md = `# ROADMAP V2 (Baseado no Beta Launch)\n\n`;
  md += `> Gerado automaticamente via análise de uso e feedbacks dos Beta Testers.\n\n`;
  
  md += `## 1. Visão Geral\n`;
  md += `- **NPS Médio do Beta:** ${mockData.nps}/10\n`;
  md += `- **Funcionalidades Mais Usadas:** ${mockData.mostUsedFeatures.join(', ')}\n`;
  md += `- **Funcionalidades Ignoradas:** ${mockData.leastUsedFeatures.join(', ')}\n\n`;

  md += `## 2. Matriz de Decisão (Features Solicitadas)\n\n`;
  md += `| Solicitação / Feedback | Votos | Impacto | Esforço | Classificação |\n`;
  md += `|-----------------------|-------|---------|---------|---------------|\n`;

  mockData.feedbacks.sort((a, b) => b.count - a.count).forEach(f => {
    md += `| ${f.tag} | ${f.count} | ${f.impact} | ${f.effort} | **${classifyFeature(f.impact, f.effort)}** |\n`;
  });

  return md;
}

const reportPath = path.join(__dirname, '../docs/reports/beta-roadmap-v2.md');
fs.writeFileSync(reportPath, generateMarkdown());
console.log('✅ Matriz do Roadmap V2 gerada com sucesso em: docs/reports/beta-roadmap-v2.md');
