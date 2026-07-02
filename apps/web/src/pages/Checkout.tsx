import React, { useState } from 'react';
import { Card, Button } from '../components/ui/core';
import { CheckCircle2, Shield, Zap, QrCode, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function Checkout() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'pix' | 'credit_card'>('pix');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: any, paymentId: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', cpfCnpj: '' });
  const [error, setError] = useState<string | null>(null);

  const handlePixCheckout = async () => {
    if (!formData.name || !formData.cpfCnpj) {
      setError("Preencha Nome e CPF/CNPJ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/checkout/pix', formData);
      setPixData(response.data);
      // Aqui entraria um polling ou websocket aguardando aprovação
    } catch (e: any) {
      setError(e.response?.data?.error || "Erro ao gerar PIX");
    }
    setLoading(false);
  };

  const handleCreditCardCheckout = async () => {
    if (!formData.name || !formData.cpfCnpj) {
      setError("Preencha Nome e CPF/CNPJ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Simula tokenização do Asaas (Na vida real usaria o SDK.js deles)
      const mockToken = "tok_mock_" + Date.now();
      
      const response = await api.post('/api/checkout/credit-card', {
        ...formData,
        creditCardToken: mockToken
      });
      
      if (response.data.status === 'ACTIVE') {
        navigate('/system/operation-center'); // ou /dashboard
      }
    } catch (e: any) {
      setError(e.response?.data?.error || "Erro ao processar cartão");
    }
    setLoading(false);
  };

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
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            MAIS POPULAR
          </div>

          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Plano Pro</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Assinatura Mensal</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-indigo-500">R$ 98,77</span>
            </div>
          </div>

          {!pixData ? (
            <>
              {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                <button 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'pix' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600' : 'text-gray-500'}`}
                  onClick={() => setTab('pix')}
                >
                  <QrCode className="w-4 h-4" /> PIX
                </button>
                <button 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'credit_card' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600' : 'text-gray-500'}`}
                  onClick={() => setTab('credit_card')}
                >
                  <CreditCard className="w-4 h-4" /> Cartão
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                  <input type="text" className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 text-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF / CNPJ</label>
                  <input type="text" className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 text-white" value={formData.cpfCnpj} onChange={e => setFormData({ ...formData, cpfCnpj: e.target.value })} />
                </div>

                {tab === 'credit_card' && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
                     <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                       <Shield className="w-4 h-4"/> Dados tokenizados com segurança (Padrão PCI)
                     </p>
                     <div className="space-y-2">
                        <input type="text" placeholder="Número do Cartão" className="w-full text-sm rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 text-white" />
                        <div className="flex gap-2">
                          <input type="text" placeholder="MM/AA" className="w-1/2 text-sm rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 text-white" />
                          <input type="text" placeholder="CVV" className="w-1/2 text-sm rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2 text-white" />
                        </div>
                     </div>
                  </div>
                )}
              </div>

              <Button 
                size="lg" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg h-14 rounded-xl shadow-lg transition-all"
                onClick={tab === 'pix' ? handlePixCheckout : handleCreditCardCheckout}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                {tab === 'pix' ? 'Gerar PIX' : 'Assinar Agora'}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-6 py-4">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">Escaneie o QR Code</h4>
              <div className="flex justify-center">
                <img src={`data:image/png;base64,${pixData.qrCode.encodedImage}`} alt="QR Code PIX" className="w-48 h-48 rounded-lg bg-white p-2" />
              </div>
              <div className="text-left bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-hidden relative">
                <p className="text-xs text-gray-500 mb-1">Pix Copia e Cola:</p>
                <p className="text-sm font-mono truncate text-gray-900 dark:text-white pr-8">{pixData.qrCode.payload}</p>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded" onClick={() => navigator.clipboard.writeText(pixData.qrCode.payload)}>Copiar</button>
              </div>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Aguardando pagamento...
              </p>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/system/operation-center')}>
                Simular Pagamento Confirmado (MOCK)
              </Button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="w-4 h-4" /> Pagamento Processado por Asaas S.A.
          </div>
        </Card>
      </div>
    </div>
  );
}
