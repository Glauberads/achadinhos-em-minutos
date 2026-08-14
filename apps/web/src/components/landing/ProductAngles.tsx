import React from 'react';
import { motion } from 'framer-motion';

const angles = [
  { name: 'Performance', color: 'from-orange-500/20 to-red-500/5', border: 'border-orange-500/30', desc: 'Focado em features técnicas' },
  { name: 'Lifestyle', color: 'from-blue-500/20 to-cyan-500/5', border: 'border-blue-500/30', desc: 'Focado no uso diário' },
  { name: 'Luxury', color: 'from-purple-500/20 to-pink-500/5', border: 'border-purple-500/30', desc: 'Focado em status e exclusividade' },
];

export const ProductAngles = () => {
  return (
    <section className="py-24 bg-[#0a0a0c] relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Um produto. <br className="md:hidden" />
            <span className="text-zinc-500">Dezenas de caminhos criativos.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            A mesma inteligência descobre os diferentes ângulos de venda do seu produto para evitar fadiga de criativo.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          
          {/* Original Product */}
          <div className="w-full lg:w-1/3 flex flex-col items-center">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Original Product</div>
            <div className="w-64 h-64 rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden relative shadow-2xl">
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80" alt="Produto Original" className="w-full h-full object-cover" />
            </div>
          </div>
          
          {/* Divider/Arrow (Desktop) */}
          <div className="hidden lg:flex w-24 h-px bg-white/20 relative items-center justify-center">
            <div className="w-3 h-3 border-t-2 border-r-2 border-white/40 rotate-45 absolute right-0 translate-x-1/2" />
          </div>
          
          {/* AI Variations */}
          <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {angles.map((angle, index) => (
              <motion.div
                key={angle.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-gradient-to-br ${angle.color} border ${angle.border} rounded-2xl p-4 flex flex-col`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-white">{angle.name}</span>
                  <span className="text-[10px] text-zinc-400">Concept {String.fromCharCode(65 + index)}</span>
                </div>
                
                <div className="aspect-[4/5] rounded-xl bg-black/50 border border-white/10 overflow-hidden relative mb-4">
                  <img src={`https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&sig=${index}`} alt={`${angle.name} Concept`} className="w-full h-full object-cover opacity-80 mix-blend-overlay hover:mix-blend-normal transition-all duration-300" />
                  
                  {/* Faux UI */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="h-2 w-1/2 bg-white/20 rounded mb-1" />
                    <div className="h-2 w-3/4 bg-white/10 rounded mb-2" />
                    <div className="h-6 w-full bg-white text-black text-[10px] font-bold flex items-center justify-center rounded">
                      CTA Button
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-zinc-400 mt-auto">{angle.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
