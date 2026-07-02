const fs = require('fs');
const path = require('path');

const standards = [
  { name: 'api-standards', title: 'API Standards', desc: 'Regras para APIs REST Fastify.' },
  { name: 'database-standards', title: 'Database Standards', desc: 'Padrões de Modelagem e RLS no Supabase.' },
  { name: 'frontend-standards', title: 'Frontend Standards', desc: 'Padrões de UI React, Hooks e Componentização.' },
  { name: 'backend-standards', title: 'Backend Standards', desc: 'Arquitetura base de Controllers e Services.' },
  { name: 'worker-standards', title: 'Worker Standards', desc: 'Orquestração de BullMQ e processamento de fundo.' },
  { name: 'telemetry-standards', title: 'Telemetry Standards', desc: 'Rastreamento de logs e saúde do sistema.' },
  { name: 'design-system-standards', title: 'Design System Standards', desc: 'Regras de Shadcn UI e acessibilidade.' },
  { name: 'security-standards', title: 'Security Standards', desc: 'Proteções contra OWASP Top 10 e vazamento JWT.' },
  { name: 'naming-standards', title: 'Naming Standards', desc: 'Convenções de nomenclatura universais.' },
  { name: 'testing-standards', title: 'Testing Standards', desc: 'Cobertura de testes e Mocks Jest.' },
  { name: 'documentation-standards', title: 'Documentation Standards', desc: 'Como manter e expandir o Engineering Hub.' },
  { name: 'performance-standards', title: 'Performance Standards', desc: 'Tratativas de gargalo, Lazy loading e Cache.' },
  { name: 'observability-standards', title: 'Observability Standards', desc: 'Dashboards internas e ElasticSearch Logging.' },
  { name: 'ai-standards', title: 'AI Standards', desc: 'Diretrizes imutáveis para Agentes IA operando no código.' },
  { name: 'release-standards', title: 'Release Standards', desc: 'Trunk Based Development e Feature Flags deployment.' }
];

const qualities = [
  { name: 'definition-of-ready', title: 'Definition of Ready', desc: 'Checklist para uma Feature iniciar desenvolvimento.' },
  { name: 'definition-of-done', title: 'Definition of Done', desc: 'Checklist para uma Feature ser considerada concluída.' },
  { name: 'definition-of-testing', title: 'Definition of Testing', desc: 'Requisitos para aprovação da suíte de QA.' },
  { name: 'definition-of-release', title: 'Definition of Release', desc: 'Critérios para Merge na main e Deploy.' },
  { name: 'release-checklist', title: 'Release Checklist', desc: 'Verificações manuais de Rollout.' },
  { name: 'qa-checklist', title: 'QA Checklist', desc: 'Validação de Qualidade de Software.' },
  { name: 'performance-checklist', title: 'Performance Checklist', desc: 'Garantia de 60fps no frontend e API <200ms.' },
  { name: 'security-checklist', title: 'Security Checklist', desc: 'Revisão de chaves hardcoded e Injections.' },
  { name: 'documentation-checklist', title: 'Documentation Checklist', desc: 'Auditoria da fonte oficial da verdade.' },
  { name: 'observability-checklist', title: 'Observability Checklist', desc: 'Garantia de que os alertas críticos irão apitar.' },
  { name: 'database-checklist', title: 'Database Checklist', desc: 'Testes de RLS e Migrations de Zero-Downtime.' },
  { name: 'api-checklist', title: 'API Checklist', desc: 'Validações Zod e Rate Limit garantidos.' },
  { name: 'frontend-checklist', title: 'Frontend Checklist', desc: 'Skeletons e Empty States aprovados.' },
  { name: 'worker-checklist', title: 'Worker Checklist', desc: 'Idempotência e Backoff exponencial revisados.' },
  { name: 'ai-checklist', title: 'AI Checklist', desc: 'Prevenção de alucinações via Strategy Pattern e Timeout.' },
  { name: 'deployment-checklist', title: 'Deployment Checklist', desc: 'Garantia de Vercel e Github Actions sadios.' },
  { name: 'post-release-checklist', title: 'Post-Release Checklist', desc: 'Ativação de Feature flag e acompanhamento no dia seguinte.' },
  { name: 'incident-checklist', title: 'Incident Checklist', desc: 'O que fazer quando a plataforma capota.' },
  { name: 'rollback-checklist', title: 'Rollback Checklist', desc: 'Caminho mais rápido para desfazer cagadas.' }
];

const template = (title, desc) => `# Standard: ${title}

## 1. Metadados
- **Status:** Stable
- **Versão:** 1.0.0
- **Autor:** Plataforma de Engenharia
- **Última Atualização:** 01/07/2026

## 2. Objetivo
${desc}

## 3. Escopo
Aplica-se globalmente ao desenvolvimento de features e manutenções do projeto Achadinhos em Minutos. Nenhuma release deverá ignorar este artefato.

## 4. Responsabilidades
- **Desenvolvedor / IA:** Consultar, aplicar e evoluir as melhores práticas.
- **Reviewer:** Negar PRs que não satisfaçam os preceitos.
- **Tech Lead:** Auditar as exceções documentadas nos ADRs.

## 5. Fluxo de Execução

\`\`\`mermaid
graph TD
    A[Reconhecer Regras] --> B[Implementar Seguindo o Standard]
    B --> C[Passar no Checklist Local]
    C --> D[Submeter para Review]
\`\`\`

## 6. Exemplos Práticos
- Utilize o padrão de \`Repository Pattern\` explicitamente isolado (Conforme o \`ADR-001\`).
- Exponha \`Feature Flags\` nas implementações visuais (\`ADR-006\`).

## 7. Boas Práticas
- **Mantenha Simples:** Código não é lugar de filosofar, é lugar de resolver problemas de negócios.
- **Respeite o Design:** \`Shadcn UI\` e Tailwind são as fontes de verdade de estilo.
- **Isolamento de Falhas:** IAs terceiras caem sempre, aplique Timeout/Retry.

## 8. Anti-Padrões (Más Práticas)
- *Hardcoding* de senhas.
- Rotas \`Fastify\` enormes.
- \`SELECT * FROM\` desnecessário na UI.

## 9. Métricas Associadas
- *Lead Time*: Tempo da Ideia até Release deve cair ao usar esse padrão.
- *MTTR (Mean Time to Recovery)*: Aplicação do Checklist de Rollback reduz impactos críticos.

## 10. Checklist Final
- [ ] Lido e compreendido.
- [ ] Aplicado no Pull Request atual.
- [ ] Validado pelos pares ou ferramentas estáticas de Lint.

## 11. Integrações (Referências Cruzadas)
Este documento pertence à engrenagem descrita em:
- [SYSTEM.md](../../SYSTEM.md)
- [ENGINEERING.md](../../ENGINEERING.md)
- [AI_RULEBOOK.md](../../AI_RULEBOOK.md)
- Consulte também os [Playbooks Oficiais](../../playbooks/) e [ADRs](../../adr/) correlacionados.
`;

const generate = (list, folder) => {
  list.forEach(item => {
    const content = template(item.title, item.desc);
    fs.writeFileSync(path.join(__dirname, 'docs', folder, item.name + '.md'), content);
  });
};

generate(standards, 'standards');
generate(qualities, 'quality');

console.log('Todos os 34 documentos do Framework foram gerados com sucesso!');
