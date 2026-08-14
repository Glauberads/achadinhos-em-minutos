import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/core';

export const HeroProductDemo = () => {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden bg-[#050508]">
      {/* Futuristic Background System */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] rounded-full bg-purple-900/10 blur-[120px]" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Copy & CTA */}
        <div className="lg:col-span-5 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-md"
          >
            <Wand2 className="w-4 h-4" />
            <span>Creative Intelligence Platform</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter mb-6 text-white leading-[1.1]"
          >
            Transforme produtos em <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              campanhas que vendem.
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg lg:text-xl text-zinc-400 mb-8 max-w-lg font-light leading-relaxed"
          >
            Cole um link. A inteligência do Achadinhos.ai analisa produto, mercado e audiência — e transforma tudo em uma campanha pronta para publicar.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link to="/early-access" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 text-base rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold group shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all duration-300 border border-indigo-400/20 relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center">
                  Começar agora
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </Link>
            
            <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-base rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium backdrop-blur-sm transition-all duration-300">
              Ver a plataforma
            </Button>
          </motion.div>
        </div>

        {/* Right Column: Hero Product Demo Composition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="lg:col-span-7 relative h-[600px] w-full"
        >
          {/* Central Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[80%] bg-indigo-500/20 blur-[100px] rounded-full" />
          </div>

          <div className="relative w-full h-full flex items-center justify-center perspective-[1000px]">
            {/* The Before -> AI -> After Composition */}
            <div className="w-full max-w-3xl flex items-center justify-between gap-4">
              
              {/* Product Card (Left) */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="w-1/3 max-w-[220px] shrink-0 bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative z-20"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-zinc-900 border border-white/5">
                  <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" alt="Produto" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                  <div className="flex items-center gap-2 mt-4">
                    <div className="h-6 w-16 bg-green-500/20 border border-green-500/30 rounded flex items-center justify-center">
                      <span className="text-[10px] text-green-400 font-medium">9.8 SCORE</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Processing Flow (Center) */}
              <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                {/* Data Flow Lines */}
                <svg className="absolute w-full h-24 text-indigo-500/30" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path
                    d="M0,50 Q25,20 50,50 T100,50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [0, -20] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.path
                    d="M0,60 Q25,80 50,60 T100,60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [0, -20] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </svg>
                
                {/* AI Node */}
                <div className="w-16 h-16 rounded-full bg-[#0a0a0c] border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] flex items-center justify-center relative z-20">
                  <Wand2 className="w-6 h-6 text-indigo-400" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent"
                  />
                </div>
                
                {/* Status Pills */}
                <div className="mt-6 flex flex-col gap-2 w-full max-w-[140px]">
                  {['Extracting DNA', 'Market Signals', 'Generating'].map((text, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1 + (i * 0.2) }}
                      className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded text-center"
                    >
                      {text}...
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Generated Ad (Right) */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-1/3 max-w-[200px] shrink-0 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl relative z-20 transform translate-y-8"
              >
                {/* Story Format Mockup */}
                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-zinc-900 border border-white/5 relative">
                  <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" alt="Ad" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-sm leading-tight mb-1">O tênis perfeito.</h3>
                    <p className="text-zinc-300 text-[10px] mb-3">Conforto e estilo para o seu dia a dia.</p>
                    <div className="w-full py-2 bg-white text-black text-[10px] font-bold text-center rounded-md">
                      Comprar agora
                    </div>
                  </div>
                  {/* Decorative UI elements */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                     <div className="flex gap-1">
                        <div className="w-6 h-1 bg-white/50 rounded-full" />
                        <div className="w-6 h-1 bg-white/20 rounded-full" />
                        <div className="w-6 h-1 bg-white/20 rounded-full" />
                     </div>
                  </div>
                </div>
              </motion.div>
              
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
