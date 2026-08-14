import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/core';

export const FinalCTA = () => {
  return (
    <section className="py-32 bg-[#050508] relative overflow-hidden border-t border-white/5">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] max-w-3xl rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] max-w-xl rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Inteligência Criativa de Alta Performance</span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6"
        >
          Seu próximo criativo <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">começa com um link.</span>
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl text-zinc-400 max-w-2xl mx-auto font-light mb-12"
        >
          Pare de montar campanhas peça por peça. Transforme produtos em campanhas completas com uma única inteligência.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/early-access" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-16 px-10 text-lg rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold group shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all duration-300 border border-indigo-400/20 relative overflow-hidden">
              <span className="relative z-10 flex items-center justify-center">
                Começar agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            </Button>
          </Link>
        </motion.div>
        
        {/* Floating Creative Previews in Background */}
        <div className="absolute -z-10 inset-0 pointer-events-none opacity-20 hidden md:block">
           <motion.div 
             animate={{ y: [-10, 10, -10], rotate: [2, -2, 2] }}
             transition={{ duration: 6, repeat: Infinity }}
             className="absolute top-[10%] left-[10%] w-48 h-64 bg-zinc-900 rounded-xl border border-white/20 rotate-[-15deg] overflow-hidden blur-[2px]"
           >
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80" alt="" className="w-full h-full object-cover" />
           </motion.div>
           <motion.div 
             animate={{ y: [10, -10, 10], rotate: [-2, 2, -2] }}
             transition={{ duration: 7, repeat: Infinity }}
             className="absolute top-[20%] right-[10%] w-56 h-40 bg-zinc-900 rounded-xl border border-white/20 rotate-[10deg] overflow-hidden blur-[2px]"
           >
             <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200&q=80" alt="" className="w-full h-full object-cover" />
           </motion.div>
        </div>

      </div>
    </section>
  );
};
