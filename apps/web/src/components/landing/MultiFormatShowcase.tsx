import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Monitor, Square } from 'lucide-react';

const formats = [
  { name: 'Story / Reels', ratio: '9:16', icon: Smartphone, width: 'w-48', height: 'h-[340px]', image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { name: 'Feed Instagram', ratio: '4:5', icon: Smartphone, width: 'w-56', height: 'h-[280px]', image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" },
  { name: 'Meta Ads', ratio: '1:1', icon: Square, width: 'w-64', height: 'h-64', image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80" },
  { name: 'Banner', ratio: '16:9', icon: Monitor, width: 'w-80', height: 'h-44', image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80" },
];

export const MultiFormatShowcase = () => {
  return (
    <section className="py-24 bg-[#050508] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Para todos os formatos. <br className="hidden md:block" />
              <span className="text-zinc-500">Instantaneamente.</span>
            </h2>
            <p className="text-zinc-400">
              A inteligência adapta automaticamente a composição, textos e assets para os formatos mais utilizados no tráfego pago, mantendo a coerência visual.
            </p>
          </div>
        </div>

        <div className="w-full flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-between gap-8 lg:gap-4 overflow-hidden py-10">
          {formats.map((format, index) => (
            <motion.div
              key={format.ratio}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className={`relative ${format.width} ${format.height} bg-zinc-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl group`}>
                <img src={format.image} alt={format.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                
                {/* Mock UI overlay based on format */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                   <div className="w-1/3 h-1.5 bg-white/30 rounded mb-2" />
                   <div className="w-2/3 h-2 bg-white/20 rounded mb-4" />
                   <div className="w-full py-2 bg-indigo-600 rounded text-center text-white text-[10px] font-bold">Comprar Agora</div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1 text-zinc-300">
                  <format.icon className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium text-sm">{format.name}</span>
                </div>
                <div className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs text-zinc-500 font-mono">
                  {format.ratio}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
