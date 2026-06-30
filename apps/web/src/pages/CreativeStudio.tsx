import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Wand2, RefreshCcw, Save, AlertCircle, Send, Plus, Link as LinkIcon, Video, CheckCircle2, Layers } from 'lucide-react';
import { api } from '../lib/api';
import { StoryboardEditor } from '../components/creative-studio/StoryboardEditor';
import { Button, Card, Input, Badge, Skeleton, EmptyState, ErrorState } from '../components/ui/core';
import { useToast } from '../components/ui/toast';

export function CreativeStudio() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState('Oferta Relâmpago');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [creatives, setCreatives] = useState<any[]>([]);
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);

  const fetchCreatives = async () => {
    try {
      const { data } = await api.get('/creatives');
      setCreatives(data.creatives);
      if (data.creatives.length > 0 && !selectedCreative) {
        setSelectedCreative(data.creatives[0]);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Módulo Creative Studio AI não habilitado para o seu perfil.');
      } else {
        console.error('Failed to fetch creatives', err);
      }
    }
  };

  useEffect(() => {
    fetchCreatives();
    const interval = setInterval(fetchCreatives, 10000); // Polling for MVP
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/creatives/generate-from-link', { product_url: url, style });
      // Reload list immediately
      fetchCreatives();
      setUrl('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar criativo.');
    } finally {
      setLoading(false);
    }
  };

  const triggerRender = async (id: string) => {
    try {
      await api.post(`/creatives/${id}/render`);
      fetchCreatives();
    } catch (err) {
      console.error(err);
    }
  };

  const selectVersion = async (id: string) => {
    try {
      await api.post(`/creatives/${id}/select-version`);
      fetchCreatives();
    } catch (err) {
      console.error(err);
    }
  };

  const saveStoryboard = async (id: string, scenes: any[]) => {
    try {
      await api.patch(`/creatives/${id}`, { scenes });
      toast('Rascunho salvo!', 'success');
      fetchCreatives();
    } catch (err) {
      console.error(err);
      toast('Erro ao salvar rascunho.', 'error');
    }
  };

  const sendTest = async (id: string) => {
    try {
      await api.post(`/creatives/${id}/send-test`);
      toast('Teste simulado enviado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      toast('Erro ao enviar teste.', 'error');
    }
  };

  if (error && error.includes('indisponível')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Creative Studio AI Premium</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          O módulo Creative Studio AI está protegido por Feature Flag ou não está disponível no seu plano atual.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Creative Studio AI</h1>
        <p className="text-muted-foreground">Transforme links de produtos em vídeos virais automaticamente.</p>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium">Link do Produto (Shopee ou Mercado Livre)</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Ex: https://shopee.com.br/produto..." 
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <label className="text-sm font-medium">Estilo de Vídeo</label>
            <select 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Oferta Relâmpago">Oferta Relâmpago</option>
              <option value="Premium Minimalista">Premium Minimalista</option>
              <option value="Achadinho Viral">Achadinho Viral</option>
              <option value="Urgência Máxima">Urgência Máxima</option>
            </select>
          </div>
          <Button 
            type="submit" 
            isLoading={loading}
            icon={<Wand2 className="w-4 h-4" />}
            className="w-full md:w-auto"
          >
            Gerar Criativo
          </Button>
        </form>
        {error && !error.includes('indisponível') && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </Card>

      {/* Grid Bento / Resultados */}
      {creatives.length === 0 && !loading && (
        <EmptyState 
          icon={<Video className="w-8 h-8" />}
          title="Nenhum criativo gerado ainda"
          description="Cole um link acima para começar a mágica."
        />
      )}

      {loading && creatives.length === 0 && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="col-span-1 h-[600px]" />
            <Skeleton className="col-span-2 h-[600px]" />
         </div>
      )}

      {creatives.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Histórico/Lista */}
          <div className="col-span-1 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Meus Criativos</h3>
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
              {creatives.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedCreative(c)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedCreative?.id === c.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{c.title || 'Gerando...'}</h4>
                    {c.generation_status === 'ready' && <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-full">Pronto</span>}
                    {c.generation_status === 'ready_with_fallback' && <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded-full">Fallback</span>}
                    {c.generation_status === 'pending_review' && <span className="bg-purple-500/10 text-purple-500 text-xs px-2 py-1 rounded-full">Revisão A/B</span>}
                    {c.generation_status === 'draft_selected' && <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded-full">Storyboard</span>}
                    {(c.generation_status === 'pending' || c.generation_status === 'generating') && <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded-full animate-pulse">Processando</span>}
                    {c.generation_status === 'failed' && <span className="bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded-full">Falhou</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.product_url}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Editor/Preview Bento */}
          {selectedCreative && (
            <div className="col-span-1 lg:col-span-2">
              
              {selectedCreative.generation_status === 'pending_review' && (
                <div className="bg-card p-6 rounded-lg border border-border/50 text-center space-y-4">
                  <Layers className="w-12 h-12 text-purple-500 mx-auto" />
                  <h3 className="text-xl font-bold">Teste A/B Gerado</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">A IA analisou seu produto e gerou o roteiro e as cenas. Escolha esta versão para continuar com a edição e renderização.</p>
                  
                  <div className="bg-background p-4 rounded-lg text-left mt-4">
                    <h4 className="font-semibold text-sm mb-2">Creative DNA</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li><strong>Gatilho:</strong> {selectedCreative.creative_dna?.mental_trigger}</li>
                      <li><strong>Emoção:</strong> {selectedCreative.creative_dna?.emotion}</li>
                      <li><strong>Hook:</strong> {selectedCreative.creative_dna?.hook}</li>
                      <li><strong>Score:</strong> {selectedCreative.quality_scores?.overall_score}/100</li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => selectVersion(selectedCreative.id)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium"
                  >
                    Selecionar Esta Versão
                  </button>
                </div>
              )}

              {selectedCreative.generation_status === 'draft_selected' && (
                <StoryboardEditor 
                  initialScenes={selectedCreative.scenes || []} 
                  onSave={(scenes) => saveStoryboard(selectedCreative.id, scenes)}
                  onRender={() => triggerRender(selectedCreative.id)}
                />
              )}

              {['ready', 'ready_with_fallback', 'pending', 'generating', 'failed'].includes(selectedCreative.generation_status) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border border-border/50">
                  {/* Preview Vídeo */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Preview</h3>
                    <div className="aspect-[9/16] bg-black/50 rounded-lg overflow-hidden border border-border/50 relative flex flex-col items-center justify-center">
                      {selectedCreative.generation_status === 'ready' && selectedCreative.video_url && (
                        <video src={selectedCreative.video_url} controls className="w-full h-full object-cover" />
                      )}
                      {selectedCreative.generation_status === 'ready_with_fallback' && selectedCreative.thumbnail_url && (
                        <div className="w-full h-full relative">
                          <img src={selectedCreative.thumbnail_url} alt="Fallback" className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-background/80 p-4 rounded-lg text-center backdrop-blur-sm">
                                <h4 className="font-bold text-yellow-500 mb-1">Storyboard Fallback</h4>
                                <p className="text-xs">Renderização falhou. Exibindo preview estático.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {(selectedCreative.generation_status === 'pending' || selectedCreative.generation_status === 'generating') && (
                        <div className="text-center p-6">
                          <RefreshCcw className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
                          <p className="text-sm font-medium">Renderizando Mágica...</p>
                          <p className="text-xs text-muted-foreground mt-2">Isso pode levar alguns segundos.</p>
                        </div>
                      )}
                      {selectedCreative.generation_status === 'failed' && (
                        <div className="text-center p-6 text-destructive">
                          <AlertCircle className="w-8 h-8 mx-auto mb-4" />
                          <p className="text-sm font-medium">Falha na Geração</p>
                          <p className="text-xs mt-2">{selectedCreative.error_message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="space-y-4 flex flex-col h-full">
                    <h3 className="font-semibold">Copy & Assets</h3>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Título do Vídeo</label>
                        <input type="text" value={selectedCreative.title || ''} readOnly className="w-full bg-background border border-border rounded p-2 text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Copy / Legenda</label>
                        <textarea rows={4} value={selectedCreative.description || ''} readOnly className="w-full bg-background border border-border rounded p-2 text-sm mt-1 resize-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                      <button 
                        onClick={() => sendTest(selectedCreative.id)}
                        disabled={selectedCreative.generation_status !== 'ready' && selectedCreative.generation_status !== 'ready_with_fallback'}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md text-sm font-medium flex justify-center items-center gap-2 disabled:opacity-50 col-span-2"
                      >
                        <Send className="w-4 h-4" /> Enviar Teste
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
