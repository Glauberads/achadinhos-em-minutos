import React from 'react';
import { motion } from 'framer-motion';
import { Link2, Sparkles, Brain, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    num: "01",
    title: "Produto Detectado",
    icon: <Link2 className="w-5 h-5 text-indigo-400" />,
    content: (
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-3 shadow-inner">
        <div className="flex gap-4 items-center">
          <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80" alt="Smartwatch" className="w-16 h-16 rounded object-cover border border-white/10" />
          <div>
            <div className="text-white text-sm font-semibold">Smartwatch Pro X</div>
            <div className="text-zinc-500 text-xs mt-1">Extraindo dados e imagens...</div>
          </div>
        </div>
      </div>
    )
  },
  {
    num: "02",
    title: "Creative DNA",
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    content: (
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4 shadow-inner grid grid-cols-2 gap-2">
        <div className="bg-white/5 rounded px-2 py-1.5 text-xs text-zinc-300 border border-white/5"><span className="text-zinc-500 mr-2">Color</span>Dark Tech</div>
        <div className="bg-white/5 rounded px-2 py-1.5 text-xs text-zinc-300 border border-white/5"><span className="text-zinc-500 mr-2">Vibe</span>Minimal</div>
        <div className="bg-white/5 rounded px-2 py-1.5 text-xs text-zinc-300 border border-white/5"><span className="text-zinc-500 mr-2">Audience</span>Gen Z</div>
        <div className="bg-white/5 rounded px-2 py-1.5 text-xs text-zinc-300 border border-white/5"><span className="text-zinc-500 mr-2">Angle</span>Lifestyle</div>
      </div>
    )
  },
  {
    num: "03",
    title: "AI Strategy",
    icon: <Brain className="w-5 h-5 text-blue-400" />,
    content: (
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4 shadow-inner flex flex-col gap-2">
        <div className="text-xs text-zinc-400"><strong className="text-white">Hook:</strong> "Seu tempo vale mais."</div>
        <div className="text-xs text-zinc-400"><strong className="text-white">Format:</strong> 9:16 Video / 1:1 Image</div>
        <div className="text-xs text-zinc-400"><strong className="text-white">Platform:</strong> Meta Ads / TikTok</div>
      </div>
    )
  },
  {
    num: "04",
    title: "Creative Ready",
    icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    content: (
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden relative group">
        <img src="https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80" alt="Ad Preview" className="w-full h-32 object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded py-1.5 text-center text-xs text-white font-medium">
            Exportar Campanha
          </div>
        </div>
      </div>
    )
  }
];

export const ProductToCampaignFlow = () => {
  return (
    <section className="py-24 bg-[#0a0a0c] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Um link entra. <br className="md:hidden" />
            <span className="text-zinc-500">Uma campanha completa sai.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            O fluxo completo de criação, de ponta a ponta, sem que você precise abrir nenhuma ferramenta de edição.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[40%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative z-10 flex flex-col"
            >
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full flex flex-col hover:border-indigo-500/30 transition-colors duration-300">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-4xl font-black text-white/5">{step.num}</span>
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-4">{step.title}</h3>
                
                <div className="mt-auto">
                  {step.content}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
