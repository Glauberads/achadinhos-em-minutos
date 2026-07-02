import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MousePointerClick, Zap, LayoutTemplate, MessageSquare, PlaySquare, Sparkles } from 'lucide-react';

export const BenefitsBento = () => {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">A força de uma agência inteira,<br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">em um único clique.</span></h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]">
        {/* Card 1: Largo (2 cols) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="md:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity duration-700">
            <Zap className="w-32 h-32 text-indigo-500" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Economize horas todos os dias</h3>
              <p className="text-zinc-400 max-w-sm">Você apenas encontra o produto. Nós criamos a copy, o layout, o storyboard, o vídeo, o banner e os stories. Tudo pronto em minutos.</p>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Quadrado */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 flex flex-col h-full justify-between hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
             <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Publique muito mais</h3>
            <p className="text-zinc-400 text-sm">Escalabilidade absurda para todas as redes sociais.</p>
          </div>
        </motion.div>

        {/* Card 3: Quadrado */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 flex flex-col h-full justify-between hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
             <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Design Premium</h3>
            <p className="text-zinc-400 text-sm">Esqueça templates estáticos. Layouts dinâmicos e vibrantes.</p>
          </div>
        </motion.div>

        {/* Card 4: Largo (2 cols) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
          className="md:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-tr from-white/[0.05] to-transparent p-8 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Neuromarketing Aplicado</h3>
              <p className="text-zinc-400 max-w-sm">Hooks que prendem a atenção nos primeiros 3 segundos. CTAs otimizados. Tudo focado apenas em aumentar a sua conversão.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
