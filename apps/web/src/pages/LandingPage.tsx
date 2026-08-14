import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/core';
import { Wand2 } from 'lucide-react';

import { HeroProductDemo } from '../components/landing/HeroProductDemo';
import { ProductToCampaignFlow } from '../components/landing/ProductToCampaignFlow';
import { CreativeShowcase } from '../components/landing/CreativeShowcase';
import { CreativeDNAVisualizer } from '../components/landing/CreativeDNAVisualizer';
import { AIEngineArchitecture } from '../components/landing/AIEngineArchitecture';
import { BeforeAfterWorkflow } from '../components/landing/BeforeAfterWorkflow';
import { ProductAngles } from '../components/landing/ProductAngles';
import { MultiFormatShowcase } from '../components/landing/MultiFormatShowcase';
import { FinalCTA } from '../components/landing/FinalCTA';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050508] text-zinc-50 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      
      {/* Navbar Premium */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-white/5 bg-[#050508]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-xl tracking-tight text-white">Achadinhos<span className="text-indigo-400">.ai</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#" className="hover:text-white transition-colors">Produto</a>
          <a href="#" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#" className="hover:text-white transition-colors">Creative Intelligence</a>
          <a href="#" className="hover:text-white transition-colors">Formatos</a>
        </div>

        <div className="flex gap-4">
          <Link to="/login" className="hidden md:block">
            <Button variant="ghost" className="text-zinc-400 hover:text-white h-10 px-6">Entrar</Button>
          </Link>
          <Link to="/early-access">
            <Button className="h-10 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold group shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all duration-300 border border-indigo-400/20 relative overflow-hidden rounded-full">
              <span className="relative z-10 flex items-center">
                Começar agora
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative w-full flex flex-col items-center">
        <HeroProductDemo />
        <ProductToCampaignFlow />
        <CreativeShowcase />
        <CreativeDNAVisualizer />
        <AIEngineArchitecture />
        <ProductAngles />
        <BeforeAfterWorkflow />
        <MultiFormatShowcase />
        <FinalCTA />
      </main>

      {/* Footer Premium Minimalista */}
      <footer className="bg-[#0a0a0c] border-t border-white/5 py-12 px-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto text-zinc-600 text-sm">
        <div className="flex items-center gap-2 mb-6 md:mb-0">
          <Wand2 className="w-5 h-5 text-indigo-900" />
          <span className="font-bold text-lg text-zinc-500">Achadinhos<span className="text-indigo-900">.ai</span></span>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-6 md:mb-0">
           <a href="#" className="hover:text-zinc-300 transition-colors">Produto</a>
           <a href="#" className="hover:text-zinc-300 transition-colors">Privacidade</a>
           <a href="#" className="hover:text-zinc-300 transition-colors">Termos</a>
           <a href="#" className="hover:text-zinc-300 transition-colors">Status</a>
        </div>
        
        <p className="text-zinc-700">© 2026 Achadinhos.ai. Inteligência Criativa.</p>
      </footer>
    </div>
  );
};
