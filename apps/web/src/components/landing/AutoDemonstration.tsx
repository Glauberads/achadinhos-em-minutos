import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Brain, LayoutTemplate, Film, CheckCircle2 } from 'lucide-react';

const pipelineSteps = [
  { id: 'input', label: 'Cole o link', icon: <Search className="w-4 h-4" /> },
  { id: 'brain', label: 'Marketing Brain', icon: <Brain className="w-4 h-4" /> },
  { id: 'strategy', label: 'Creative DNA', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'layout', label: 'Layout & Motion', icon: <LayoutTemplate className="w-4 h-4" /> },
  { id: 'render', label: 'Renderizando...', icon: <Film className="w-4 h-4 animate-pulse" /> },
  { id: 'done', label: 'Vídeo Pronto', icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> }
];

export const AutoDemonstration = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev >= pipelineSteps.length - 1 ? 0 : prev + 1));
    }, 3000); // Mudar a cada 3s (Total ~18-20s)
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="showcase" className="w-full max-w-5xl mx-auto px-6 pb-32 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-2xl p-4 md:p-8 relative overflow-hidden flex flex-col md:flex-row gap-8 min-h-[400px]"
      >
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />

        {/* Lado Esquerdo - Timeline steps */}
        <div className="flex-1 flex flex-col justify-center gap-4 relative z-10">
          {pipelineSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <motion.div 
                    animate={{
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : isPast ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isActive ? 'rgba(99, 102, 241, 0.5)' : isPast ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? '#818cf8' : isPast ? '#d4d4d8' : '#52525b',
                      scale: isActive ? 1.1 : 1
                    }}
                    className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors duration-500"
                  >
                    {step.icon}
                  </motion.div>
                  {index !== pipelineSteps.length - 1 && (
                    <motion.div 
                      className="w-[2px] h-6 bg-white/10 my-1"
                      animate={{ backgroundColor: isPast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)' }}
                    />
                  )}
                </div>
                <motion.span 
                  animate={{ 
                    opacity: isActive ? 1 : isPast ? 0.7 : 0.3,
                    x: isActive ? 10 : 0
                  }}
                  className="text-sm font-medium transition-all duration-500"
                >
                  {step.label}
                </motion.span>
              </div>
            );
          })}
        </div>

        {/* Lado Direito - Representação Visual do passo atual */}
        <div className="flex-[2] bg-black/40 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden min-h-[300px]">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div key="step-0" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm">
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-400 font-mono">
                  <Search className="w-4 h-4" />
                  https://shopee.com.br/produto...
                </div>
              </motion.div>
            )}
            
            {(currentStep === 1 || currentStep === 2) && (
              <motion.div key="step-1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex flex-col gap-3 w-full max-w-sm">
                <div className="flex gap-2">
                  <div className="h-20 w-20 bg-indigo-500/20 rounded animate-pulse" />
                  <div className="flex-1 flex flex-col gap-2 justify-center">
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                    <div className="h-3 w-1/3 bg-white/10 rounded mt-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="h-8 bg-purple-500/10 border border-purple-500/20 rounded flex items-center justify-center text-xs text-purple-300 font-mono">Visual Score: 95</div>
                  <div className="h-8 bg-cyan-500/10 border border-cyan-500/20 rounded flex items-center justify-center text-xs text-cyan-300 font-mono">Hook: Urgency</div>
                </div>
              </motion.div>
            )}

            {(currentStep === 3 || currentStep === 4) && (
              <motion.div key="step-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative aspect-[9/16] h-64 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 to-black" />
                <div className="mt-8 mx-4 h-8 bg-white/20 rounded backdrop-blur-sm animate-pulse" />
                <div className="mt-4 mx-4 h-32 bg-white/10 rounded-lg" />
                <div className="mt-auto mx-4 mb-6 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                  {currentStep === 4 ? 'Renderizando frames...' : 'Aplicando Layout...'}
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div key="step-5" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative aspect-[9/16] h-64 bg-[#121214] border border-green-500/30 rounded-lg overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(74,222,128,0.15)]">
                 <CheckCircle2 className="w-16 h-16 text-green-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
};
