import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button, Badge } from '../ui/core';
import { Wand2, ChevronRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SparkleIcon = () => <Wand2 className="w-4 h-4 mr-2 inline" />;

export const HeroSection = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse position (-1 to 1) for parallax
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x * 20); // max 20px movement
      mouseY.set(y * 20);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center overflow-visible">
      {/* Premium Blurred Gradient Orbs - Hero Background (GPU Friendly) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none z-0 overflow-visible">
        <motion.div 
          style={{ x: springX, y: springY }}
          className="absolute w-[600px] h-[600px] rounded-full top-[-100px] left-[-150px] bg-[#7C3AED] opacity-15 blur-[120px] mix-blend-screen"
        />
        <motion.div 
          style={{ x: useSpring(useTransform(mouseX, v => v * -1), { stiffness: 40 }), y: springY }}
          className="absolute w-[450px] h-[450px] rounded-full top-[100px] right-[-100px] bg-[#06B6D4] opacity-10 blur-[150px] mix-blend-screen"
        />
        <motion.div 
          style={{ x: springX, y: useSpring(useTransform(mouseY, v => v * -0.5), { stiffness: 30 }) }}
          className="absolute w-[700px] h-[700px] rounded-full top-[-200px] left-[30%] bg-[#3B82F6] opacity-10 blur-[180px] mix-blend-screen"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <Badge variant="info" className="mb-8 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 backdrop-blur-sm px-4 py-1.5">
          <SparkleIcon /> Creative OS Inteligente
        </Badge>
        
        <h1 className="text-5xl md:text-7xl lg:text-[80px] font-bold tracking-tight max-w-5xl mb-6 leading-[1.1]">
          Transforme produtos em{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
            campanhas que vendem.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed font-light">
          Basta colar um link. Nossa IA faz todo o trabalho pesado: analisa o mercado, escreve a copy, desenha o layout e orquestra o vídeo final.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link to="/early-access" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black text-base h-12 px-8 rounded-full font-semibold shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all duration-300">
              Entrar no Early Access
            </Button>
          </Link>
          <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-md h-12 px-8 rounded-full transition-all duration-300" onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}>
            Ver demonstração
          </Button>
        </div>
      </motion.div>
    </section>
  );
};
