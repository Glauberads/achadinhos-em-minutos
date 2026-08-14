import React from 'react';
import { motion } from 'framer-motion';

const showcases = [
  {
    product: "Perfume Luxuoso",
    category: "Luxury Campaign",
    format: "Story 9:16",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80",
    theme: "purple"
  },
  {
    product: "Tênis Performance",
    category: "Action Campaign",
    format: "Instagram Feed 4:5",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    theme: "orange"
  },
  {
    product: "Smartphone",
    category: "Tech Campaign",
    format: "Reels Video",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
    theme: "blue"
  },
  {
    product: "Cosmético Beauty",
    category: "Minimal Campaign",
    format: "Meta Ads 1:1",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    theme: "pink"
  },
  {
    product: "Headphone Premium",
    category: "Lifestyle Campaign",
    format: "Banner 16:9",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    theme: "zinc"
  },
  {
    product: "Relógio Clássico",
    category: "Elegance Campaign",
    format: "Product Creative",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    theme: "emerald"
  }
];

export const CreativeShowcase = () => {
  return (
    <section className="py-24 bg-[#050508] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Veja o que a inteligência entrega.
            </h2>
            <p className="text-zinc-400">
              A IA não apenas gera imagens, ela entende o produto, a categoria e a estética do mercado para construir campanhas que realmente convertem.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
            6 formatos otimizados
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcases.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-zinc-900 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
              
              <img 
                src={item.image} 
                alt={item.product} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out opacity-70 group-hover:opacity-100"
              />
              
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 bg-white/10 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider mb-2 border border-white/20">
                    {item.format}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{item.product}</h3>
                <p className="text-zinc-300 text-sm">{item.category}</p>
                
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  <span className="text-xs text-indigo-300 font-medium flex items-center gap-1">
                    Ver detalhes <span className="text-lg">→</span>
                  </span>
                </div>
              </div>
              
              {/* Premium Hover Inner Glow */}
              <div className="absolute inset-0 z-30 border-2 border-transparent group-hover:border-white/10 rounded-2xl transition-colors duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
