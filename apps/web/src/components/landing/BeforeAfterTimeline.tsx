import React from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Scissors, Edit, MessageSquare, MonitorPlay, XCircle, CheckCircle2, Zap } from 'lucide-react';

const manualSteps = [
  { id: 1, label: 'Pesquisar produto' },
  { id: 2, label: 'Baixar imagens' },
  { id: 3, label: 'Canva / Photoshop' },
  { id: 4, label: 'CapCut / Premiere' },
  { id: 5, label: 'ChatGPT para copy' },
  { id: 6, label: 'Editar vídeo' },
  { id: 7, label: 'Publicar' }
];

const aiSteps = [
  { id: 1, label: 'Cole o link' },
  { id: 2, label: 'IA analisa' },
  { id: 3, label: 'Criativo pronto' },
  { id: 4, label: 'Publicar' }
];

export const BeforeAfterTimeline = () => {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 border-t border-white/5">
      <div className="text-center mb-16">
         <h2 className="text-3xl md:text-5xl font-bold mb-4">A forma antiga vs. <br/><span className="text-indigo-400">Creative OS</span></h2>
         <p className="text-zinc-400 max-w-xl mx-auto">Mude o jogo. Pare de gastar energia com edições repetitivas e foque no que traz dinheiro: a estratégia.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Antes */}
        <div className="p-8 rounded-2xl border border-white/5 bg-zinc-900/50">
          <div className="flex items-center gap-3 mb-8 text-zinc-500 font-semibold">
            <XCircle className="w-5 h-5 text-red-500/70" /> 
            PROCESSO MANUAL
          </div>
          <div className="flex flex-col gap-6 relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-white/5" />
            {manualSteps.map((step, idx) => (
              <motion.div 
                key={step.id} 
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-6 relative z-10"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono text-zinc-500">
                  {step.id}
                </div>
                <span className="text-zinc-400">{step.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Depois */}
        <div className="p-8 rounded-2xl border border-indigo-500/30 bg-indigo-900/10 relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-8 text-indigo-300 font-semibold relative z-10">
            <Zap className="w-5 h-5 text-indigo-400" /> 
            CREATIVE OS
          </div>
          
          <div className="flex flex-col gap-8 relative z-10 mt-12">
            <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-indigo-500/50 to-transparent" />
            {aiSteps.map((step, idx) => (
              <motion.div 
                key={step.id} 
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15 }}
                className="flex items-center gap-6 relative z-10"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center justify-center text-sm font-bold text-white border border-indigo-400">
                  {step.id}
                </div>
                <span className="text-white text-lg font-medium">{step.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
