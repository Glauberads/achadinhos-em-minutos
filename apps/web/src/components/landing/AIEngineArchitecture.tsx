import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Eye, TrendingUp, BrainCircuit, Layout, Palette, Type, Film, ShieldCheck } from 'lucide-react';

const engines = [
  { id: 'visual', name: 'Visual Intelligence', icon: Eye, color: 'text-blue-400', desc: 'Extrai paletas de cores, formas e estilo de qualquer imagem de produto.' },
  { id: 'market', name: 'Market Intelligence', icon: TrendingUp, color: 'text-emerald-400', desc: 'Analisa o nicho e identifica os ângulos de venda com maior conversão atual.' },
  { id: 'strategy', name: 'Creative Strategy', icon: BrainCircuit, color: 'text-purple-400', desc: 'Define os ganchos (hooks) e a estrutura persuasiva da campanha.' },
  { id: 'layout', name: 'Layout Engine', icon: Layout, color: 'text-indigo-400', desc: 'Posiciona elementos baseados em princípios de design e eye-tracking.' },
  { id: 'color', name: 'Color Engine', icon: Palette, color: 'text-rose-400', desc: 'Gera gradientes e contrastes dinâmicos que destacam o produto.' },
  { id: 'type', name: 'Typography Engine', icon: Type, color: 'text-amber-400', desc: 'Seleciona e dimensiona fontes para máxima legibilidade em mobile.' },
  { id: 'motion', name: 'Motion Engine', icon: Film, color: 'text-cyan-400', desc: 'Prepara assets e direções de animação para vídeos curtos.' },
  { id: 'review', name: 'Creative Reviewer', icon: ShieldCheck, color: 'text-green-400', desc: 'Audita a peça gerada contra políticas de anúncios (Meta/TikTok).' },
];

export const AIEngineArchitecture = () => {
  const [hoveredEngine, setHoveredEngine] = useState<string | null>(null);

  return (
    <section className="py-24 bg-[#050508] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Múltiplos motores especialistas. <br />
            <span className="text-zinc-500">
              Uma única inteligência.
            </span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Nós não usamos um único modelo para tudo. O Achadinhos.ai possui uma arquitetura de roteamento inteligente (Intelligent Routing) que aciona o motor exato para cada microtarefa criativa.
          </p>
        </div>

        <div className="relative w-full max-w-5xl mx-auto h-[600px] flex items-center justify-center">
          
          {/* Core Hub */}
          <div className="absolute z-30 w-48 h-48 rounded-full bg-black border border-indigo-500/50 shadow-[0_0_80px_rgba(99,102,241,0.2)] flex flex-col items-center justify-center p-6 text-center">
            <Network className="w-8 h-8 text-indigo-400 mb-2" />
            <h3 className="text-white font-bold tracking-tight">ACHADINHOS<br />AI CORE</h3>
            <div className="mt-2 text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-1 rounded">
              ROUTING ACTIVE
            </div>
            {/* Core Pulses */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border border-indigo-500 rounded-full"
            />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute inset-0 border border-indigo-500 rounded-full"
            />
          </div>

          {/* Engine Nodes */}
          <div className="absolute inset-0 w-full h-full">
            {engines.map((engine, i) => {
              const angle = (i * 360) / engines.length;
              const radius = 220;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              
              const isHovered = hoveredEngine === engine.id;
              
              return (
                <div 
                  key={engine.id}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                  onMouseEnter={() => setHoveredEngine(engine.id)}
                  onMouseLeave={() => setHoveredEngine(null)}
                >
                  <div className={`
                    w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center cursor-pointer
                    transition-all duration-300 border backdrop-blur-md
                    ${isHovered ? 'bg-white/10 border-white/30 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-[#0a0a0c]/80 border-white/10 hover:border-white/20'}
                  `}>
                    <engine.icon className={`w-6 h-6 ${engine.color}`} />
                  </div>
                  
                  {/* Connection Line to Core */}
                  <svg className="absolute top-1/2 left-1/2 pointer-events-none -z-10 overflow-visible" style={{ width: 0, height: 0 }}>
                    <motion.line
                      x1="0"
                      y1="0"
                      x2={-x}
                      y2={-y}
                      stroke={isHovered ? "rgba(99, 102, 241, 0.8)" : "rgba(255, 255, 255, 0.1)"}
                      strokeWidth={isHovered ? "2" : "1"}
                      strokeDasharray={isHovered ? "none" : "4 4"}
                      initial={false}
                      animate={{ strokeDashoffset: isHovered ? [0, -20] : 0 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Engine Description Panel (Centered below or above based on hover) */}
          <AnimatePresence>
            {hoveredEngine && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-10 z-40 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-sm text-center shadow-2xl"
              >
                {engines.filter(e => e.id === hoveredEngine).map(e => (
                  <div key={e.id}>
                    <h4 className={`text-lg font-bold mb-2 flex items-center justify-center gap-2 ${e.color}`}>
                      <e.icon className="w-5 h-5" />
                      {e.name}
                    </h4>
                    <p className="text-zinc-300 text-sm">
                      {e.desc}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
};
