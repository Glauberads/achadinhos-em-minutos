import React from 'react';
import { Card, Button, Badge } from '../components/ui/core';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export function Gateways() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gateways de Pagamento
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Gerencie os provedores de cobrança e faturamento do sistema.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 relative border-indigo-500/20 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Asaas</h3>
                  <p className="text-sm text-gray-500">Gateway Padrão</p>
                </div>
              </div>
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ativo
              </Badge>
            </div>
            
            <div className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-300">
              <p>• Suporte a PIX e Cartão de Crédito.</p>
              <p>• Configurado em ambiente Sandbox.</p>
              <p>• Webhooks ativos e idempotentes.</p>
            </div>

            <Button variant="secondary" className="w-full text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
              Configurar Gateway
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
