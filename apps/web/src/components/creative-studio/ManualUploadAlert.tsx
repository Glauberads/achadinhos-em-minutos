import React, { useRef, useState } from 'react';
import { AlertCircle, Upload, CheckCircle } from 'lucide-react';
import { Button } from '../ui/core';
import { api } from '../../lib/api';
import { useToast } from '../ui/toast';

interface ManualUploadAlertProps {
  creativeId: string;
  originalImageFound: boolean;
  onSuccess: (updatedCreative: any) => void;
}

export function ManualUploadAlert({ creativeId, originalImageFound, onSuccess }: ManualUploadAlertProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (originalImageFound !== false) {
    return null; // Only show if original image was NOT found
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast('O limite é de 5MB.', 'error');
      return;
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      toast('Use JPG, PNG ou WEBP.', 'error');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post(`/creatives/${creativeId}/upload-image`, formData);
      
      toast('Imagem do produto atualizada com sucesso.', 'success');
      onSuccess(data.creative);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Tente novamente.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAcceptFallback = async () => {
    try {
      const { data } = await api.post(`/creatives/${creativeId}/accept-fallback`);
      onSuccess(data.creative);
    } catch (err) {
      toast('Erro ao aceitar imagem genérica.', 'error');
    }
  };

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6 relative overflow-hidden">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-600 dark:text-yellow-400">Atenção ao Produto</h4>
          <p className="text-sm text-yellow-700/80 dark:text-yellow-200/80 mt-1 mb-4">
            A loja bloqueou a captura automática da foto oficial. Envie a imagem do produto para manter o criativo fiel.
          </p>
          <div className="flex flex-wrap gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleFileChange}
            />
            <Button 
              size="sm" 
              onClick={handleUploadClick} 
              isLoading={isUploading}
              icon={<Upload className="w-4 h-4" />}
            >
              Enviar imagem do produto
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleAcceptFallback}
              disabled={isUploading}
            >
              Continuar com imagem sugerida
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
