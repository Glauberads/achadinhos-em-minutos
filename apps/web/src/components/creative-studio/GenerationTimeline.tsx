import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card } from '../ui/core';

interface Props {
  status: string; // 'analyzing', 'pending', 'generating', 'pending_review', 'draft_selected', 'ready', 'failed'
}

const STEPS = [
  { id: 'analyzing', label: 'Analisando Produto' },
  { id: 'intelligence', label: 'IA criando Persona e Copy' },
  { id: 'storyboard', label: 'Montando Storyboard' },
  { id: 'render', label: 'Renderizando Vídeo' },
  { id: 'upload', label: 'Finalizando Upload' }
];

export function GenerationTimeline({ status }: Props) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    switch (status) {
      case 'analyzing':
        setActiveStepIndex(0);
        break;
      case 'pending':
      case 'generating': {
        // Simulating the middle steps to provide the requested "Perception of Velocity"
        setActiveStepIndex(1);
        const t1 = setTimeout(() => setActiveStepIndex(2), 3000);
        const t2 = setTimeout(() => setActiveStepIndex(3), 8000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
      case 'pending_review':
      case 'draft_selected':
        setActiveStepIndex(2);
        break;
      case 'uploading':
        setActiveStepIndex(4);
        break;
      case 'ready':
      case 'ready_with_fallback':
        setActiveStepIndex(5);
        break;
      default:
        break;
    }
  }, [status]);

  return (
    <Card className="p-8 w-full max-w-xl mx-auto border-border/50 shadow-premium">
      <div className="flex flex-col items-center mb-8">
        <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Estamos preparando seu criativo
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          A IA está trabalhando no background. Você será notificado quando finalizar.
        </p>
      </div>

      <div className="relative space-y-6">
        {/* Background Line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border/50" />

        {STEPS.map((step, index) => {
          const isCompleted = index < activeStepIndex;
          const isActive = index === activeStepIndex && status !== 'ready' && status !== 'ready_with_fallback' && status !== 'failed';
          const isPending = index > activeStepIndex;

          return (
            <div key={step.id} className="relative flex items-center gap-4 z-10">
              <div className="bg-card w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="completed"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 bg-white rounded-full shadow-sm" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      key="active"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-primary text-primary-foreground p-1 rounded-full shadow-md"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Circle className="w-4 h-4 text-muted-foreground/40" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1">
                <p 
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground/60'
                  }`}
                >
                  {step.label}
                </p>
                {isActive && (
                   <motion.div 
                     initial={{ width: 0, opacity: 0 }} 
                     animate={{ width: "100%", opacity: 1 }} 
                     transition={{ duration: 0.5 }}
                     className="h-1 bg-primary/10 rounded-full mt-2 overflow-hidden"
                   >
                      <motion.div 
                         className="h-full bg-primary"
                         animate={{ x: ["-100%", "100%"] }}
                         transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                   </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
