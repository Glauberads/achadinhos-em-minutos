import React from 'react';
import { Card, Button } from '../components/ui/core';
import { CheckCircle2, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Checkout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Desbloqueie o Creative OS
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Escolha o plano e comece a gerar campanhas que vendem no automático.
        </p>
      </div>

      <div className="w-full max-w-lg">
        <Card className="relative p-8 rounded-3xl border-indigo-500/50 shadow-2xl overflow-hidden bg-white dark:bg-gray-800">
          {/* Badge */}
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            MAIS POPULAR
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Plano Pro</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Acesso completo ao estúdio de criação com IA.</p>
          </div>

          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">R$ 98,77</span>
            <span className="text-gray-500 dark:text-gray-400 font-medium">/mês</span>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              'Acesso ao Creative OS',
              'Geração Ilimitada de Copies',
              'Layouts de Alta Conversão',
              'Motor de Renderização Inteligente',
              'Integração com Mercado Livre / Shopee',
              'Suporte Prioritário'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            size="lg" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg h-14 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all"
            onClick={() => alert("Integração com gateway de pagamento será implementada aqui.")}
          >
            <Zap className="w-5 h-5 mr-2" />
            Assinar Agora
          </Button>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Shield className="w-4 h-4" />
            Pagamento 100% Seguro
          </div>
        </Card>
      </div>
    </div>
  );
}
