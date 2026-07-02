import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button, Card, Badge } from '../components/ui/core';
import { InteractiveParticles } from '../components/ui/InteractiveParticles';
import { Wand2, Zap, Clock, Palette, Rocket, CheckCircle2, PlayCircle, BarChart3, ChevronRight, Video, Target, Users } from 'lucide-react';

const fadeIn: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-50 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      
      {/* Premium Blurred Gradient Orbs - Hero Background */}
      <div className="absolute top-0 left-0 w-full h-[900px] pointer-events-none select-none z-0 overflow-hidden">
        <div 
          className="absolute rounded-full animate-orb-1"
          style={{ width: '600px', height: '600px', top: '-100px', left: '-150px', backgroundColor: '#7C3AED', opacity: 0.15, filter: 'blur(120px)', mixBlendMode: 'screen', willChange: 'transform' }} 
        />
        <div 
          className="absolute rounded-full animate-orb-2"
          style={{ width: '450px', height: '450px', top: '100px', right: '-100px', backgroundColor: '#06B6D4', opacity: 0.12, filter: 'blur(150px)', mixBlendMode: 'screen', willChange: 'transform' }} 
        />
        <div 
          className="absolute rounded-full animate-orb-3"
          style={{ width: '700px', height: '700px', top: '-200px', left: '30%', backgroundColor: '#3B82F6', opacity: 0.1, filter: 'blur(180px)', mixBlendMode: 'screen', willChange: 'transform' }} 
        />
        <div 
          className="absolute rounded-full animate-orb-4"
          style={{ width: '300px', height: '300px', top: '250px', left: '20%', backgroundColor: '#A855F7', opacity: 0.18, filter: 'blur(100px)', mixBlendMode: 'screen', willChange: 'transform' }} 
        />
        <div 
          className="absolute rounded-full animate-orb-1"
          style={{ width: '500px', height: '500px', top: '50px', right: '20%', backgroundColor: '#8B5CF6', opacity: 0.15, filter: 'blur(140px)', mixBlendMode: 'screen', willChange: 'transform' }} 
        />
      </div>

      {/* Partículas interativas que seguem o mouse */}
      <InteractiveParticles />
      
      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-xl tracking-tight">Achadinhos<span className="text-indigo-400">.ai</span></span>
        </div>
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-zinc-300 hover:text-white">Entrar</Button>
          </Link>
          <Link to="/early-access">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-[0_0_15px_rgba(79,70,229,0.3)]">Early Access</Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center">
        
        {/* 1. HERO SECTION */}
        <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <Badge variant="info" className="mb-6 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 backdrop-blur-sm">
              <SparkleIcon /> Beta fechado em preparação
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial="hidden" animate="visible" variants={fadeIn} 
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-5xl mb-6 leading-tight"
          >
            Transforme links de produtos em criativos{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-gradient bg-[length:200%_auto]">
              prontos para vender com IA
            </span>
          </motion.h1>
          
          <motion.p 
            initial="hidden" animate="visible" variants={fadeIn} 
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed"
          >
            Cole um link da Shopee ou Mercado Livre e deixe a IA criar copy, layout, vídeo, imagem e estratégia de venda em poucos minutos.
          </motion.p>
          
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
            <Link to="/early-access" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-base h-12 px-8 rounded-full font-semibold group shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all duration-300 border border-indigo-400/20 relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Entrar na lista de acesso
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </Link>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-md h-12 px-8 rounded-full group hover:border-white/20 transition-all duration-300">
              <span className="flex items-center text-zinc-300 group-hover:text-white transition-colors">
                Ver como funciona
              </span>
            </Button>
          </motion.div>
          
          {/* Dashboard Mockup Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 w-full max-w-5xl rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl p-2 md:p-4 relative overflow-hidden hidden md:block"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent z-10 h-full pointer-events-none" />
            <div className="aspect-[16/9] bg-[#121214] rounded-lg border border-white/5 flex items-center justify-center relative">
               <PlayCircle className="w-16 h-16 text-white/20" />
               <p className="absolute bottom-4 left-4 text-sm text-zinc-500 font-mono">Creative OS Dashboard</p>
            </div>
          </motion.div>
        </section>

        {/* 2. COMO FUNCIONA */}
        <section className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/5 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Do link ao criativo em poucos minutos</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Gere criativos sem depender de designer ou editor.</p>
          </div>
          
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <StepCard number="01" title="Cole o Link" desc="Apenas cole a URL do seu produto afiliado (Shopee ou Mercado Livre)." icon={<Zap />} />
            <StepCard number="02" title="IA processa tudo" desc="Nossa IA extrai fotos, define o nicho, cria a copy (Hook & CTA) e aplica o design visual." icon={<Wand2 />} />
            <StepCard number="03" title="Baixe e Publique" desc="Seu vídeo e banners estão prontos para lucrar. O sistema faz o trabalho pesado para você." icon={<Rocket />} />
          </motion.div>
        </section>

        {/* 3. CREATIVE STUDIO AI */}
        <section className="w-full bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 z-10">
              <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">Creative OS</Badge>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">O Cérebro por trás da Conversão.</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Nós orquestramos múltiplos motores especialistas de Inteligência Artificial para não apenas criar vídeos bonitos, mas que geram desejo de compra real.
              </p>
              <ul className="space-y-3 pt-4">
                {['Motor de Tipografia e Layout', 'Motor de Chamada (Hook) e CTA', 'Validador de Qualidade (Dual Score)'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full flex justify-center relative">
              <div className="absolute w-[120%] h-[120%] bg-purple-500/20 blur-[100px] -z-10 rounded-full" />
              <div className="w-full max-w-md aspect-square rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 flex flex-col gap-4 shadow-2xl">
                <div className="h-4 w-1/3 bg-white/10 rounded" />
                <div className="h-32 w-full bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-indigo-400 w-10 h-10" />
                </div>
                <div className="h-4 w-2/3 bg-white/10 rounded mt-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. BENEFÍCIOS */}
        <section className="w-full max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Elimine as tarefas repetitivas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BenefitCard icon={<Clock />} title="Falta de tempo?" desc="Dificuldade de criar criativos todos os dias? Nós automatizamos a linha de montagem para você produzir em escala." />
            <BenefitCard icon={<Palette />} title="Esqueça o Designer" desc="Templates visuais horríveis? Nós garantimos alta qualidade estética de ponta a ponta sem precisar de agência." />
            <BenefitCard icon={<Zap />} title="Chega de copiar e colar" desc="Pare de copiar ofertas manualmente. A demora para postar achadinhos acabou." />
          </div>
        </section>

        {/* 5. EXEMPLOS DE USO */}
        <section className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/5 text-center">
           <h2 className="text-3xl md:text-4xl font-bold mb-12">O que a IA é capaz de gerar</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[9/16] bg-zinc-900 rounded-xl border border-white/10 relative flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <Video className="w-12 h-12 text-white/30 z-20 group-hover:scale-110 transition-transform" />
                  <div className="absolute bottom-4 left-4 right-4 z-20 text-left">
                    <p className="text-xs font-semibold text-indigo-400 mb-1">Nichos Validados</p>
                    <p className="text-sm text-zinc-300">Produto Viral #{i}</p>
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* 6. PARA QUEM É */}
        <section className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div>
               <h2 className="text-3xl md:text-4xl font-bold mb-6">Criado para afiliados, garimpeiros e criadores de achadinhos</h2>
               <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                 O ecossistema foi desenhado focando em resolver exatamente o seu gargalo: gerar alto volume e escalar seus lucros na velocidade da luz.
               </p>
               <Button className="bg-white text-black hover:bg-zinc-200 rounded-full font-semibold">Quero testar</Button>
             </div>
             <div className="grid grid-cols-2 gap-4">
               {[{title: 'Afiliados Shopee', icon: <Users className="w-5 h-5 mb-2" />}, {title: 'Mercado Livre', icon: <Target className="w-5 h-5 mb-2" />}, {title: 'Dona de Canal Telegram', icon: <Rocket className="w-5 h-5 mb-2" />}, {title: 'Criadores TikTok', icon: <PlayCircle className="w-5 h-5 mb-2" />}].map((niche, i) => (
                 <div key={i} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-center font-medium flex flex-col items-center text-zinc-300">
                   {niche.icon}
                   {niche.title}
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* 7. EARLY ACCESS */}
        <section className="w-full bg-indigo-900/10 border-y border-indigo-500/20 relative overflow-hidden">
           <div className="max-w-4xl mx-auto px-6 py-24 text-center">
             <Badge className="bg-indigo-500/20 text-indigo-300 mb-6 border-indigo-500/30">Vagas Limitadas</Badge>
             <h2 className="text-3xl md:text-4xl font-bold mb-6">Beta fechado em preparação</h2>
             <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
               Estamos liberando o acesso ao Creative OS gradativamente para garantir estabilidade e os melhores resultados.
             </p>
             <Link to="/early-access">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">Garantir minha vaga</Button>
             </Link>
           </div>
        </section>

        {/* 8. FAQ */}
        <section className="w-full max-w-3xl mx-auto px-6 py-24 text-center">
           <h2 className="text-3xl font-bold mb-10">Dúvidas Frequentes</h2>
           <div className="text-left space-y-4">
             <FaqItem q="Preciso de conhecimento em design?" a="Não. O sistema resolve cores, textos e layouts baseado no link do produto de forma automática." />
             <FaqItem q="Posso usar links de quais plataformas?" a="Atualmente suportamos nativamente Shopee e Mercado Livre, extraindo imagens e dados." />
             <FaqItem q="Demora muito para gerar o vídeo?" a="Literalmente poucos minutos. Nossa arquitetura roda motores de forma assíncrona para não perder tempo." />
           </div>
        </section>

        {/* 9. CTA FINAL */}
        <section className="w-full border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 py-32 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Pronto para revolucionar seus posts?</h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">O sistema faz o trabalho pesado para você focar no que importa: escalar suas vendas.</p>
            <Link to="/early-access">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold group shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all duration-300 border border-indigo-400/20 relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Entrar na lista de acesso
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-center text-zinc-600 text-sm">
        <p>© 2026 Achadinhos em Minutos. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

// -- Componentes Reutilizáveis Locais --

const SparkleIcon = () => <Wand2 className="w-4 h-4 mr-2 inline" />;

const StepCard = ({ number, title, desc, icon }: any) => (
  <motion.div variants={fadeIn} className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md relative overflow-hidden group hover:bg-white/[0.05] transition-colors">
    <div className="text-5xl font-black text-white/5 mb-6">{number}</div>
    <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-zinc-400 leading-relaxed text-sm">{desc}</p>
  </motion.div>
);

const BenefitCard = ({ icon, title, desc }: any) => (
  <Card className="p-6 bg-transparent border-white/10 text-white shadow-none hover:bg-white/[0.02] transition-colors">
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white">
      {icon}
    </div>
    <h4 className="font-semibold text-lg mb-2">{title}</h4>
    <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
  </Card>
);

const FaqItem = ({ q, a }: any) => (
  <div className="p-6 rounded-xl border border-white/10 bg-white/5 text-left hover:bg-white/10 transition-colors">
    <h4 className="font-semibold text-lg mb-2">{q}</h4>
    <p className="text-zinc-400 text-sm">{a}</p>
  </div>
);
