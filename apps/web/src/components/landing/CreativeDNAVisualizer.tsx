import React from 'react';
import { motion } from 'framer-motion';
import { ScanFace, Fingerprint, Palette, Type, Navigation, Zap, Target } from 'lucide-react';

export const CreativeDNAVisualizer = () => {
  return (
    <section className="py-24 bg-[#0a0a0c] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0a0a0c]/80 to-[#0a0a0c] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-6 border border-indigo-500/20"
          >
            <Fingerprint className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Cada produto possui um DNA. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Nossa IA encontra o seu.
            </span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Uma varredura neural profunda analisa cada pixel do seu produto para extrair a essência visual e conectá-la ao desejo de compra do seu público.
          </p>
        </div>

        <div className="relative w-full max-w-5xl mx-auto h-[600px] flex items-center justify-center">
          
          {/* Central Product Scanner */}
          <div className="absolute z-30 w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-zinc-900 border border-white/10 p-2 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80" 
              alt="Product Scan" 
              className="w-full h-full object-cover rounded-2xl opacity-80"
            />
            {/* Scanner Line */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity }}
              className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_15px_#6366f1] z-40 opacity-70"
            />
            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-3xl m-2 pointer-events-none" />
            
            <div className="absolute bottom-4 left-0 right-0 text-center z-40">
              <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded text-xs text-indigo-300 font-mono border border-indigo-500/20">
                ANALYZING PIXELS...
              </span>
            </div>
          </div>

          {/* Neural Network Connections */}
          <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-30 text-indigo-500" viewBox="0 0 1000 600">
            {/* Left side connections */}
            <path d="M250,150 Q400,300 500,300" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M200,300 Q350,300 500,300" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M250,450 Q400,300 500,300" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Right side connections */}
            <path d="M750,150 Q600,300 500,300" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M800,300 Q650,300 500,300" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M750,450 Q600,300 500,300" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          </svg>

          {/* Data Cards (Floating around) */}
          {/* Top Left: Color System */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute top-[10%] left-[5%] md:left-[10%] bg-[#0a0a0c]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 w-48 shadow-lg z-20"
          >
            <div className="flex items-center gap-2 mb-3 text-indigo-400">
              <Palette className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Color System</span>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded bg-[#1A1A1A] border border-white/20" />
              <div className="w-8 h-8 rounded bg-[#E53935] border border-white/20" />
              <div className="w-8 h-8 rounded bg-[#FFFFFF] border border-white/20" />
            </div>
          </motion.div>

          {/* Middle Left: Target Audience */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute top-[45%] left-0 md:left-[5%] bg-[#0a0a0c]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 w-48 shadow-lg z-20"
          >
            <div className="flex items-center gap-2 mb-3 text-purple-400">
              <Target className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Audience</span>
            </div>
            <div className="text-sm text-zinc-300 font-medium">Urban Professionals</div>
            <div className="text-xs text-zinc-500 mt-1">Age 24-35 • Tech Savvy</div>
          </motion.div>

          {/* Bottom Left: Typography */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute bottom-[10%] left-[5%] md:left-[10%] bg-[#0a0a0c]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 w-48 shadow-lg z-20"
          >
            <div className="flex items-center gap-2 mb-3 text-blue-400">
              <Type className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Typography</span>
            </div>
            <div className="font-sans font-bold text-lg text-white leading-tight">Inter Bold</div>
            <div className="font-serif italic text-sm text-zinc-400">Secondary Font</div>
          </motion.div>

          {/* Top Right: Market Angle */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute top-[10%] right-[5%] md:right-[10%] bg-[#0a0a0c]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 w-48 shadow-lg z-20"
          >
            <div className="flex items-center gap-2 mb-3 text-emerald-400">
              <Navigation className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Market Angle</span>
            </div>
            <div className="bg-emerald-500/10 text-emerald-300 text-xs px-2 py-1 rounded inline-block border border-emerald-500/20">
              Premium Lifestyle
            </div>
          </motion.div>

          {/* Middle Right: Emotion */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute top-[45%] right-0 md:right-[5%] bg-[#0a0a0c]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 w-48 shadow-lg z-20"
          >
            <div className="flex items-center gap-2 mb-3 text-rose-400">
              <ScanFace className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Emotion</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Desire</span>
                <span className="text-white">85%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1"><div className="bg-rose-500 h-1 rounded-full w-[85%]" /></div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Trust</span>
                <span className="text-white">92%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1"><div className="bg-rose-500 h-1 rounded-full w-[92%]" /></div>
            </div>
          </motion.div>

          {/* Bottom Right: Hook Strategy */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="absolute bottom-[10%] right-[5%] md:right-[10%] bg-[#0a0a0c]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 w-48 shadow-lg z-20"
          >
            <div className="flex items-center gap-2 mb-3 text-amber-400">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Hook Strategy</span>
            </div>
            <div className="text-xs text-zinc-300 italic">
              "Eleve seu som. Isolamento acústico perfeito para o seu foco."
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
