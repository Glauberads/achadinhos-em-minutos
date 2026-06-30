import React, { useState, useEffect } from 'react';
import { Card, Button, Progress } from './core';
import { supabase } from '../../lib/supabase';
import { Check, ChevronRight, X } from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Bem-vindo ao Creative Studio', description: 'Vamos gerar seu primeiro criativo de alta conversão juntos.' },
  { id: 'connect', title: 'Conecte sua Conta', description: 'Vincule seu Marketplace para puxar os dados dos produtos automaticamente.' },
  { id: 'first_link', title: 'Insira um Link', description: 'Cole o link de qualquer produto da Shopee ou Mercado Livre.' },
  { id: 'generate', title: 'Gere o Vídeo', description: 'A Inteligência Artificial fará a análise, copy e edição automaticamente.' },
  { id: 'publish', title: 'Pronto para Publicar', description: 'Seu vídeo está pronto. Revise e envie para suas redes.' }
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Sem registro de onboarding, criar um e abrir o modal
        await supabase.from('user_onboarding').insert([{ user_id: user.id }]);
        setIsOpen(true);
      } else if (data && !data.completed_at) {
        // Onboarding não finalizado, retoma de onde parou
        const stepIndex = STEPS.findIndex(s => s.id === data.current_step);
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Failed to load onboarding status:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (nextStepIndex: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCompleted = nextStepIndex >= STEPS.length;
    const nextStepId = isCompleted ? 'completed' : STEPS[nextStepIndex].id;

    const payload: any = { current_step: nextStepId };
    
    // Anexa a etapa atual como completada
    const { data: currentData } = await supabase.from('user_onboarding').select('completed_steps').eq('user_id', user.id).single();
    if (currentData) {
      const completedSteps = new Set(currentData.completed_steps || []);
      completedSteps.add(STEPS[currentStepIndex].id);
      payload.completed_steps = Array.from(completedSteps);
    }

    if (isCompleted) {
      payload.completed_at = new Date().toISOString();
      setIsOpen(false);
    } else {
      setCurrentStepIndex(nextStepIndex);
    }

    await supabase.from('user_onboarding').update(payload).eq('user_id', user.id);
  };

  const handleNext = () => updateProgress(currentStepIndex + 1);

  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: currentData } = await supabase.from('user_onboarding').select('skipped_steps').eq('user_id', user.id).single();
    const skippedSteps = new Set(currentData?.skipped_steps || []);
    skippedSteps.add(STEPS[currentStepIndex].id);

    await supabase.from('user_onboarding').update({ 
      skipped_steps: Array.from(skippedSteps),
      current_step: currentStepIndex + 1 >= STEPS.length ? 'completed' : STEPS[currentStepIndex + 1].id
    }).eq('user_id', user.id);

    if (currentStepIndex + 1 >= STEPS.length) {
      setIsOpen(false);
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  if (!isOpen || loading) return null;

  const step = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg p-0 overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{step.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.description}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-2 text-sm font-medium text-muted-foreground">
              Passo {currentStepIndex + 1} de {STEPS.length}
            </div>
            {/* Minimalist Progress Bar from Design System */}
            <Progress value={progress} className="h-2 w-full bg-secondary" />
          </div>
        </div>

        <div className="bg-secondary/30 p-6 flex items-center justify-between border-t border-border/50">
          <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
            Pular Etapa
          </Button>
          <Button onClick={handleNext} icon={currentStepIndex === STEPS.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />} iconPosition="right">
            {currentStepIndex === STEPS.length - 1 ? 'Concluir Onboarding' : 'Próxima Etapa'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
