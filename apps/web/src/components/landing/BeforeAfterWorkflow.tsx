import React from 'react';
import { motion } from 'framer-motion';
import { FileImage, Database, Wand2, XCircle, FileType2, CloudRain, Clock, ArrowRight } from 'lucide-react';

export const BeforeAfterWorkflow = () => {
  return (
    <section className="py-24 bg-[#0a0a0c] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            A forma antiga vs. <span className="text-indigo-400">Creative Intelligence</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Substitua a fragmentação de ferramentas e o esforço manual por um fluxo único orientado por IA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Old Way (Manual) */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Processo Manual
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-8">O caos das 5 ferramentas</h3>
            
            <div className="relative h-64 w-full">
              {/* Confusing visual representing old way */}
              <motion.div 
                animate={{ rotate: [-2, 2, -2], y: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-0 left-0 bg-[#1e1e1e] border border-white/10 p-3 rounded-lg shadow-lg flex items-center gap-2 z-10"
              >
                <Database className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-300">Planilha de Produtos</span>
              </motion.div>
              
              <motion.div 
                animate={{ rotate: [2, -2, 2], y: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-12 right-4 bg-[#1e1e1e] border border-white/10 p-3 rounded-lg shadow-lg flex items-center gap-2 z-20"
              >
                <FileType2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-zinc-300">Escrever Copy</span>
              </motion.div>
              
              <motion.div 
                animate={{ rotate: [-1, 1, -1], x: [0, 5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity }}
                className="absolute top-24 left-8 bg-[#1e1e1e] border border-white/10 p-3 rounded-lg shadow-lg flex items-center gap-2 z-30"
              >
                <FileImage className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-zinc-300">Editor de Imagem</span>
              </motion.div>
              
              <motion.div 
                animate={{ rotate: [3, -3, 3], y: [0, 8, 0] }}
                transition={{ duration: 5.5, repeat: Infinity }}
                className="absolute bottom-8 right-12 bg-[#1e1e1e] border border-white/10 p-3 rounded-lg shadow-lg flex items-center gap-2 z-40"
              >
                <CloudRain className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-300">Pastas de Assets</span>
              </motion.div>
              
              {/* Confusing connecting lines */}
              <svg className="absolute inset-0 w-full h-full text-red-500/20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M20,20 Q50,10 80,40 T30,80 T80,80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                <path d="M80,20 Q10,40 20,70" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-zinc-400 text-sm">
              <Clock className="w-4 h-4 text-red-400" />
              <span>Horas gastas por produto</span>
            </div>
          </div>
          
          {/* New Way (Achadinhos) */}
          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/30 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
            
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Achadinhos.ai
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-8">Fluidez inteligente</h3>
            
            <div className="relative h-64 w-full flex flex-col items-center justify-center">
              
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">1</span>
                  </div>
                  <span className="text-xs text-zinc-300 font-medium">Cole o Link</span>
                </div>
                
                <ArrowRight className="w-6 h-6 text-indigo-400 shrink-0" />
                
                <div className="flex-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-indigo-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <Wand2 className="w-8 h-8 text-indigo-400 relative z-10" />
                  <span className="text-xs text-indigo-200 font-medium relative z-10">IA Analisa</span>
                </div>
                
                <ArrowRight className="w-6 h-6 text-indigo-400 shrink-0" />
                
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-xs text-zinc-300 font-medium">Campanha Pronta</span>
                </div>
              </div>
              
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-indigo-300 text-sm">
              <Zap className="w-4 h-4" />
              <span>Segundos por produto</span>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

// Simple icon missing from lucide above
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const Zap = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);
