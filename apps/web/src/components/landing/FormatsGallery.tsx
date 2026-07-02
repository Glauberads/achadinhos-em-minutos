import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, LayoutGrid, MonitorPlay, Film } from 'lucide-react';

export const FormatsGallery = () => {
  return (
    <section className="w-full bg-[#050508] border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-center">Para todos os formatos.</h2>
        <p className="text-zinc-400 mb-16 text-center">Não importa onde seu público está, nós renderizamos o formato ideal.</p>

        <div className="flex justify-center gap-8 flex-wrap">
          {/* Story / Reels */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-48 h-80 rounded-2xl bg-zinc-900 border border-white/10 relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent" />
              <div className="m-4 h-8 bg-white/10 rounded-full w-24 mb-auto" />
              <div className="m-4 h-12 bg-white/10 rounded-lg w-[80%] self-center" />
              <div className="m-4 h-10 bg-indigo-600 rounded-full w-[90%] self-center flex items-center justify-center font-bold text-white text-xs">Comprar</div>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-medium">
              <Smartphone className="w-4 h-4" /> Story & Reels
            </div>
          </motion.div>

          {/* Feed Quadrado */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-64 h-64 rounded-2xl bg-zinc-900 border border-white/10 relative overflow-hidden flex flex-col justify-between p-4">
              <div className="h-6 bg-white/10 rounded-full w-32" />
              <div className="h-24 bg-purple-500/20 rounded-lg w-full flex items-center justify-center">
                <Film className="w-8 h-8 text-purple-400/50" />
              </div>
              <div className="h-10 bg-white/5 rounded-full w-full" />
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-medium">
              <LayoutGrid className="w-4 h-4" /> Feed (1:1)
            </div>
          </motion.div>

          {/* YouTube / Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-72 h-40 rounded-2xl bg-zinc-900 border border-white/10 relative overflow-hidden flex items-center justify-between p-4">
               <div className="flex flex-col gap-2 w-1/2">
                 <div className="h-4 bg-white/10 rounded w-full" />
                 <div className="h-4 bg-white/10 rounded w-2/3" />
                 <div className="h-8 bg-cyan-600/40 rounded-full w-24 mt-4" />
               </div>
               <div className="w-20 h-20 bg-white/5 rounded-lg flex items-center justify-center">
                 <MonitorPlay className="w-6 h-6 text-zinc-600" />
               </div>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-medium mt-auto">
              <MonitorPlay className="w-4 h-4" /> Banners (16:9)
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
