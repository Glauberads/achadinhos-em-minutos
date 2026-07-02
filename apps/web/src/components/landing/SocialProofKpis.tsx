import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';
import { motion } from 'framer-motion';

const kpis = [
  { value: 12500, suffix: '+', label: 'Produtos Analisados' },
  { value: 48000, suffix: '+', label: 'Criativos Gerados' },
  { value: 350, suffix: 'h+', label: 'Horas Economizadas' },
  { value: 99, suffix: '%', label: 'Automação' }
];

export const SocialProofKpis = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-24">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
        {kpis.map((kpi, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center text-center px-4"
          >
            <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter flex items-center justify-center">
              <AnimatedCounter value={kpi.value} suffix={kpi.suffix} duration={2.5} />
            </div>
            <div className="text-zinc-500 font-medium text-sm md:text-base uppercase tracking-wider">
              {kpi.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
