import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Eye, LineChart, Cpu, Sparkles, Layout, Palette, Type, PlaySquare, FileCheck2 } from 'lucide-react';
import { Badge } from '../ui/core';

const engines = [
  { id: 'visual', label: 'Visual Intelligence', icon: <Eye />, col: 'col-span-1', desc: 'Extrai paletas e foco.' },
  { id: 'market', label: 'Market Intelligence', icon: <LineChart />, col: 'col-span-1', desc: 'Mapeia dores e público.' },
  { id: 'strategy', label: 'Creative Strategy', icon: <Cpu />, col: 'col-span-2', desc: 'O Cérebro orquestrador. Define o DNA.' },
  { id: 'layout', label: 'Layout Engine', icon: <Layout />, col: 'col-span-1', desc: 'Calcula margens.' },
  { id: 'color', label: 'Color Engine', icon: <Palette />, col: 'col-span-1', desc: 'Aplica teoria das cores.' },
  { id: 'typo', label: 'Typography', icon: <Type />, col: 'col-span-1', desc: 'Fontes de alta conversão.' },
  { id: 'motion', label: 'Motion Engine', icon: <PlaySquare />, col: 'col-span-1', desc: 'Transições suaves.' },
  { id: 'review', label: 'Creative Reviewer', icon: <FileCheck2 />, col: 'col-span-2', desc: 'Auditoria de Qualidade (Dual Score).' }
];

export const CreativeOSGrid = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-32 relative">
      <div className="flex flex-col items-center text-center mb-16">
        <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 mb-4 px-3 py-1">Arquitetura de Conversão</Badge>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Múltiplos motores especialistas. <br/><span className="text-zinc-500">Um único objetivo.</span></h2>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Nós não usamos um prompt genérico. Construímos um pipeline onde inteligências modulares conversam entre si para garantir qualidade humana em escala.
        </p>
      </div>

      <div className="relative w-full max-w-4xl mx-auto">
        {/* Conexões (Background Lines) */}
        <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
           <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
              <path d="M 25% 150 Q 50% 250 50% 250 T 50% 350" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
              <path d="M 75% 150 Q 50% 250 50% 250" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
           </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {engines.map((engine, index) => (
            <motion.div
              key={engine.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl group hover:bg-white/[0.04] transition-all hover:border-indigo-500/30 ${engine.col} relative overflow-hidden`}
            >
              {/* Glow sutil no hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-indigo-500/10 to-transparent transition-opacity duration-500 pointer-events-none" />
              
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all mb-4">
                {React.cloneElement(engine.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
              </div>
              <h3 className="font-semibold text-zinc-200 mb-1">{engine.label}</h3>
              <p className="text-sm text-zinc-500">{engine.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
