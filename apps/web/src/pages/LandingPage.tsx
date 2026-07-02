import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/core';
import { Wand2, ChevronRight } from 'lucide-react';

import { HeroSection } from '../components/landing/HeroSection';
import { AutoDemonstration } from '../components/landing/AutoDemonstration';
import { CreativeOSGrid } from '../components/landing/CreativeOSGrid';
import { BenefitsBento } from '../components/landing/BenefitsBento';
import { BeforeAfterTimeline } from '../components/landing/BeforeAfterTimeline';
import { FormatsGallery } from '../components/landing/FormatsGallery';
import { SocialProofKpis } from '../components/landing/SocialProofKpis';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-50 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      
      {/* Navbar (Minimalista) */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-white/5 bg-transparent">
        <div className="flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-xl tracking-tight">Achadinhos<span className="text-indigo-400">.ai</span></span>
        </div>
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white">Entrar</Button>
          </Link>
          <Link to="/early-access" className="hidden md:block">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold group shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all duration-300 border border-indigo-400/20 relative overflow-hidden rounded-full px-6">
              <span className="relative z-10 flex items-center">
                Early Access
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center w-full">
        <HeroSection />
        <AutoDemonstration />
        <SocialProofKpis />
        <CreativeOSGrid />
        <BeforeAfterTimeline />
        <BenefitsBento />
        <FormatsGallery />
        
        {/* CTA FINAL (Minimalista e de alto impacto) */}
        <section className="w-full border-t border-white/5 relative overflow-hidden bg-[#050508]">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 py-32 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">O futuro da conversão.</h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto font-light">
              Pare de operar ferramentas e comece a operar lucros. Entre na lista de acesso e seja um dos primeiros a testar.
            </p>
            <Link to="/early-access">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold group shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all duration-300 border border-indigo-400/20 relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Garantir minha vaga
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/5 py-12 px-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto text-zinc-600 text-sm">
        <p>© 2026 Achadinhos em Minutos. Todos os direitos reservados.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
           <a href="#" className="hover:text-zinc-400">Termos</a>
           <a href="#" className="hover:text-zinc-400">Privacidade</a>
           <a href="#" className="hover:text-zinc-400">Status</a>
        </div>
      </footer>
    </div>
  );
};
