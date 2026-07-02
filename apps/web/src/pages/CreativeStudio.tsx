import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Wand2, RefreshCcw, Save, AlertCircle, Send, Plus, Link as LinkIcon, Video, CheckCircle2, Layers, ImageIcon, Trash2, Download, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { StoryboardEditor } from '../components/creative-studio/StoryboardEditor';
import { ManualUploadAlert } from '../components/creative-studio/ManualUploadAlert';
import { SmartProductPreview } from '../components/creative-studio/SmartProductPreview';
import { GenerationTimeline } from '../components/creative-studio/GenerationTimeline';
import { Button, Card, Input, Badge, Skeleton, EmptyState, ErrorState } from '../components/ui/core';
import { useToast } from '../components/ui/toast';
import * as htmlToImage from 'html-to-image';

function getCreativePreviewImage(creative: any): string {
  if (!creative) return 'https://placehold.co/600x800?text=Sem+Imagem';
  if (creative.thumbnail_url) return creative.thumbnail_url;
  if (creative.image_urls && creative.image_urls.length > 0) return creative.image_urls[0];
  if (creative.metadata?.product_image_url) return creative.metadata.product_image_url;
  return 'https://placehold.co/600x800?text=Sem+Imagem';
}

export function CreativeStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('gerador');
  const API_URL = import.meta.env.VITE_API_URL || '';
  
  // Video Generator State
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState('Oferta Relâmpago');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);
  
  // Smart Preview State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedProduct, setAnalyzedProduct] = useState<any | null>(null);

  // Image Generator State
  const [imageUrl, setImageUrl] = useState('');
  const [imageFormat, setImageFormat] = useState('story');
  const [imageStyle, setImageStyle] = useState('Oferta Relâmpago');
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImageCreative, setGeneratedImageCreative] = useState<any | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Gallery State
  const [creativeToDelete, setCreativeToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Adaptive Polling State
  const [pollingInterval, setPollingInterval] = useState(10000);
  const [errorCount, setErrorCount] = useState(0);

  const fetchCreatives = async () => {
    try {
      const { data } = await api.get('/creatives');
      setCreatives(data.creatives);
      if (data.creatives.length > 0 && !selectedCreative) {
        setSelectedCreative(data.creatives[0]);
      }
      
      // Determine next polling interval
      const hasActiveJobs = data.creatives.some((c: any) => ['pending', 'generating', 'rendering', 'uploading'].includes(c.generation_status));
      setPollingInterval(hasActiveJobs ? 2000 : 10000);
      setErrorCount(0); // Reset errors on success
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Módulo Creative Studio AI não habilitado para o seu perfil.');
        setPollingInterval(0); // Stop polling
      } else {
        console.error('Failed to fetch creatives', err);
        setErrorCount(prev => prev + 1);
        // Exponential backoff up to 30s
        setPollingInterval(prev => Math.min(prev * 2, 30000));
      }
    }
  };

  useEffect(() => {
    fetchCreatives();
  }, []); // Initial fetch

  useEffect(() => {
    if (pollingInterval === 0) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setPollingInterval(30000); // 30s background
      } else {
        fetchCreatives(); // force immediate fetch on return
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = setInterval(fetchCreatives, pollingInterval);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pollingInterval]); // Re-bind when interval changes

  useEffect(() => {
    const isValidUrl = url.startsWith('http') && (url.includes('shopee') || url.includes('mercadolivre') || url.includes('aliexpress'));
    if (isValidUrl && !analyzedProduct) {
      const timer = setTimeout(() => handleAnalyzeLink(url), 1000);
      return () => clearTimeout(timer);
    }
  }, [url]);

  const handleAnalyzeLink = async (link: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const { data } = await api.post('/creatives/analyze-link', { url: link });
      setAnalyzedProduct(data.product);
      // Removed the toast here to keep it "silent" as requested by user
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao analisar link.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- VIDEO HANDLERS ---
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/creatives/generate-from-link', { product_url: url, style });
      fetchCreatives();
      setUrl('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar criativo.');
    } finally {
      setLoading(false);
      setAnalyzedProduct(null); // Limpa o preview
      setUrl('');
      fetchCreatives(); // Fetch forçado após ação
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

  // --- IMAGE HANDLERS ---
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    
    setImageLoading(true);
    setError(null);
    setGeneratedImageCreative(null);
    try {
      const { data } = await api.post('/creatives/generate-image-from-link', { 
        product_url: imageUrl, 
        format: imageFormat, 
        style: imageStyle 
      });
      setGeneratedImageCreative(data.creative);
      toast('Imagem gerada com sucesso!', 'success');
      fetchCreatives();
      setImageUrl('');
    } catch (err: any) {
      console.error('Generate image error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Erro ao gerar imagem.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setImageLoading(false);
    }
  };

  const handleDownloadGeneratedImage = async () => {
    if (!previewRef.current || !generatedImageCreative) return;
    try {
      const dataUrl = await htmlToImage.toPng(previewRef.current, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `achadinho-${generatedImageCreative.metadata?.image_format || 'post'}.png`;
      link.href = dataUrl;
      link.click();
      toast('Download concluído!', 'success');
    } catch (err) {
      console.error('Download falhou', err);
      toast('Falha ao exportar imagem.', 'error');
    }
  };

  // --- GALLERY HANDLERS ---
  const handleDownload = (creative: any) => {
    const url = creative.video_url || creative.thumbnail_url;
    if (!url) {
      toast('Nenhum arquivo disponível para download.', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `criativo-${creative.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Download iniciado!', 'success');
  };

  const confirmDelete = async () => {
    if (!creativeToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/creatives/${creativeToDelete.id}`);
      toast('Criativo removido com sucesso!', 'success');
      setCreatives(prev => prev.filter(c => c.id !== creativeToDelete.id));
    } catch (err) {
      console.error('Erro ao remover', err);
      toast('Falha ao remover o criativo.', 'error');
    } finally {
      setIsDeleting(false);
      setCreativeToDelete(null);
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

  const completedCreatives = creatives.filter(c => 
    ['ready', 'ready_with_fallback', 'published', 'scheduled', 'sent'].includes(c.generation_status || c.status)
  );

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 pb-20 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creative Studio AI</h1>
          <p className="text-muted-foreground">Transforme links de produtos em vídeos e imagens virais.</p>
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-lg w-fit shrink-0">
          <button 
            onClick={() => setActiveTab('gerador')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'gerador' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Gerador de Vídeo
          </button>
          <button 
            onClick={() => setActiveTab('gerador_imagem')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'gerador_imagem' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Gerador de Imagem
          </button>
          <button 
            onClick={() => setActiveTab('galeria')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'galeria' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Galeria
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">


      {activeTab === 'gerador' && (
        <motion.div 
          key="gerador"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); if(url && !analyzedProduct) handleAnalyzeLink(url); }} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2 relative">
                <label className="text-sm font-medium">Link do Produto (Shopee ou Mercado Livre)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    type="url" 
                    placeholder="Cole o link aqui para começarmos..." 
                    className="pl-10 w-full bg-secondary/30 focus:bg-background transition-colors"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setAnalyzedProduct(null); }}
                    required
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Wand2 className="h-4 w-4 text-primary animate-bounce" />
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full md:w-64 space-y-2">
                <label className="text-sm font-medium">Estilo de Vídeo</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="Oferta Relâmpago">Oferta Relâmpago</option>
                  <option value="Review Viral">Review Viral</option>
                  <option value="Unboxing Estético">Unboxing Estético</option>
                  <option value="Comparativo">Comparativo</option>
                </select>
              </div>
              {!analyzedProduct && (
                 <Button type="submit" isLoading={isAnalyzing} icon={<Search className="w-4 h-4" />}>
                   Analisar
                 </Button>
              )}
            </form>
            {error && (
              <ErrorState message={error} onRetry={() => setError(null)} />
            )}
          </Card>

          {analyzedProduct && (
             <SmartProductPreview 
                product={{
                  title: analyzedProduct.title,
                  price: analyzedProduct.price,
                  discount: analyzedProduct.discount,
                  marketplace: analyzedProduct.marketplace,
                  images: analyzedProduct.images
                }}
                onGenerate={() => handleGenerate({ preventDefault: () => {} } as any)}
                isLoading={loading}
                isCached={true} // For MVP simulating a smart cache hit visually
             />
          )}

          {creatives.length === 0 && !loading && !analyzedProduct && !isAnalyzing && (
            <EmptyState 
              icon={<Video className="w-8 h-8" />}
              title="Sua máquina de vendas está parada"
              description="Cole o link de um produto acima. A IA vai analisar a página e preparar o roteiro e vídeo inteiro para você."
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
                        <h4 className="font-medium text-sm line-clamp-1">{c?.title || 'Gerando...'}</h4>
                        {c?.generation_status === 'ready' && <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-full">Pronto</span>}
                        {c?.generation_status === 'ready_with_fallback' && <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded-full">Fallback</span>}
                        {c?.generation_status === 'pending_review' && <span className="bg-purple-500/10 text-purple-500 text-xs px-2 py-1 rounded-full">Revisão</span>}
                        {c?.generation_status === 'draft_selected' && <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded-full">Storyboard</span>}
                        {(c?.generation_status === 'pending' || c?.generation_status === 'generating') && <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded-full animate-pulse">Processando</span>}
                        {c?.generation_status === 'failed' && <span className="bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded-full">Falhou</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c?.product_url}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCreative && (
                <div className="col-span-1 lg:col-span-2">
                  <ManualUploadAlert 
                    creativeId={selectedCreative.id} 
                    originalImageFound={selectedCreative.metadata?.original_image_found} 
                    onSuccess={(updated) => setSelectedCreative(updated)}
                  />

                  {selectedCreative.generation_status === 'pending_review' && (
                    <div className="bg-card p-6 rounded-lg border border-border/50 text-center space-y-4">
                      <Layers className="w-12 h-12 text-purple-500 mx-auto" />
                      <h3 className="text-xl font-bold">Rascunhos Gerados</h3>
                      <p className="text-muted-foreground">A IA gerou variações de copy. Aprove uma para continuar para a edição de storyboard.</p>
                      <Button onClick={() => selectVersion(selectedCreative.id)}>Aprovar Rascunho A</Button>
                    </div>
                  )}

                  {selectedCreative.generation_status === 'draft_selected' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Storyboard Editor</h3>
                        <Button variant="secondary" size="sm" onClick={() => triggerRender(selectedCreative.id)} icon={<Play className="w-4 h-4" />}>
                          Finalizar e Renderizar Vídeo
                        </Button>
                      </div>
                      <StoryboardEditor 
                         initialScenes={selectedCreative.metadata?.scenes || []}
                         onSave={(scenes) => saveStoryboard(selectedCreative.id, scenes)}
                         onRender={() => triggerRender(selectedCreative.id)}
                      />
                    </div>
                  )}

                  {['ready', 'ready_with_fallback', 'pending', 'generating', 'failed'].includes(selectedCreative.generation_status) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
                      <div className="aspect-[9/16] bg-black/5 rounded-xl overflow-hidden border border-border/50 relative flex items-center justify-center">
                        {['pending', 'generating'].includes(selectedCreative.generation_status) && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                             <GenerationTimeline status={selectedCreative.generation_status} />
                          </div>
                        )}
                        {selectedCreative.generation_status === 'failed' && (
                          <div className="flex flex-col items-center text-destructive">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium text-center px-4">Falha na renderização</p>
                          </div>
                        )}
                        {selectedCreative.generation_status === 'ready' && selectedCreative.video_url && (
                          <video src={selectedCreative.video_url} controls className="w-full h-full object-cover" />
                        )}
                        {selectedCreative.generation_status === 'ready_with_fallback' && (
                          <img src={getCreativePreviewImage(selectedCreative)} alt="Fallback" className="w-full h-full object-cover opacity-80" />
                        )}
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Título do Vídeo</h4>
                          <p className="font-semibold text-foreground text-lg">{selectedCreative.title || 'Preparando seu criativo...'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Copy / Legenda</h4>
                          <div className="p-4 bg-secondary/30 rounded-xl text-sm whitespace-pre-wrap max-h-48 overflow-y-auto border border-border/50 text-foreground leading-relaxed">
                            {selectedCreative.copy_text || 'A IA está escrevendo uma copy irresistível...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'gerador_imagem' && (
        <motion.div 
          key="gerador_imagem"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <form onSubmit={handleGenerateImage} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium">Link do Produto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    type="url" 
                    placeholder="Ex: https://shopee.com.br/..." 
                    className="pl-10 w-full"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium">Formato</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
                  value={imageFormat}
                  onChange={(e) => setImageFormat(e.target.value)}
                >
                  <option value="story">Story (9:16)</option>
                  <option value="feed">Feed (1:1)</option>
                </select>
              </div>
              <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium">Estilo do Banner</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                >
                  <option value="Oferta Relâmpago">Oferta Relâmpago</option>
                  <option value="Achadinho Viral">Achadinho Viral</option>
                </select>
              </div>
              <Button type="submit" isLoading={imageLoading} icon={<ImageIcon className="w-4 h-4" />}>
                Gerar Imagem
              </Button>
            </form>
            {error && !String(error).includes('indisponível') && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {String(error)}
              </div>
            )}
          </Card>

          {imageLoading && (
             <div className="flex justify-center py-20">
                <div className="flex flex-col items-center text-primary animate-pulse">
                   <Wand2 className="w-12 h-12 mb-4 animate-bounce" />
                   <h3 className="text-xl font-bold">Criando Banner...</h3>
                </div>
             </div>
          )}

          {generatedImageCreative && !imageLoading && (
            <div className="flex flex-col items-center gap-6 mt-8 w-full max-w-2xl mx-auto">
              <ManualUploadAlert 
                creativeId={generatedImageCreative.id} 
                originalImageFound={generatedImageCreative.metadata?.original_image_found} 
                onSuccess={(updated) => setGeneratedImageCreative(updated)}
              />
               <div className="relative border border-border/50 rounded-xl overflow-hidden shadow-2xl bg-card flex flex-col justify-center items-center p-6 w-full">
                  <div className="flex justify-between items-center w-full mb-6">
                     <h3 className="font-semibold text-lg">Preview do Banner</h3>
                     <Button onClick={handleDownloadGeneratedImage} icon={<Download className="w-4 h-4" />}>
                       Baixar PNG em Alta
                     </Button>
                  </div>

                  <div className="flex justify-center w-full p-4 bg-secondary/20 rounded-lg custom-scrollbar">
                    <div 
                      style={{
                        width: generatedImageCreative.metadata?.image_format === 'story' ? 1080 * 0.25 : 1080 * 0.25,
                        height: generatedImageCreative.metadata?.image_format === 'story' ? 1920 * 0.25 : 1080 * 0.25,
                      }}
                      className="relative overflow-hidden shadow-lg rounded-md"
                    >
                      <div style={{ transform: 'scale(0.25)', transformOrigin: 'top left' }}>
                        <div 
                          ref={previewRef}
                          style={{
                            width: '1080px',
                            height: generatedImageCreative.metadata?.image_format === 'story' ? '1920px' : '1080px',
                          }}
                          className="relative bg-white overflow-hidden"
                        >
                          <img 
                            src={`${API_URL}/api/creatives/proxy-image?url=${encodeURIComponent(getCreativePreviewImage(generatedImageCreative))}`} 
                            alt="Produto"
                            className="absolute inset-0 w-full h-full object-cover"
                            crossOrigin="anonymous" 
                          />
                          <div 
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(to top, ${generatedImageCreative.metadata?.design_payload?.themeColor || '#FF3B30'} 0%, transparent 60%)`,
                              opacity: 0.9
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20" />

                          <div className="absolute top-16 left-16 right-16 flex justify-between items-start">
                            <div 
                               className="px-6 py-3 rounded-full text-3xl font-bold tracking-wider uppercase text-white shadow-xl"
                               style={{ backgroundColor: generatedImageCreative.metadata?.design_payload?.themeColor || '#FF3B30' }}
                            >
                               {generatedImageCreative.metadata?.design_payload?.badge || 'OFERTA'}
                            </div>
                            
                            {(generatedImageCreative.metadata?.design_payload?.discount || 0) > 0 && (
                              <div className="w-32 h-32 bg-yellow-400 rounded-full flex flex-col items-center justify-center text-yellow-950 font-black rotate-12 shadow-2xl border-8 border-white">
                                 <span className="text-4xl">-{generatedImageCreative.metadata?.design_payload?.discount}%</span>
                                 <span className="text-xl">OFF</span>
                              </div>
                            )}
                          </div>

                          <div className="absolute bottom-16 left-16 right-16 text-white text-center">
                             <h1 
                               className="text-7xl font-black mb-12 drop-shadow-2xl leading-tight"
                               style={{ textShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
                             >
                                {generatedImageCreative.metadata?.design_payload?.headline || 'Mega Achadinho'}
                             </h1>
                             
                             <div className="bg-white/10 backdrop-blur-md border border-white/30 p-10 rounded-3xl shadow-2xl mb-12 flex justify-between items-center text-left">
                                <div>
                                   <p className="text-3xl text-gray-200 mb-2 font-medium">Preço Especial</p>
                                   <p className="text-6xl font-black">R$ {(generatedImageCreative.metadata?.design_payload?.price || 0).toFixed(2).replace('.', ',')}</p>
                                </div>
                                <div 
                                  className="px-10 py-6 rounded-2xl text-4xl font-bold shadow-xl"
                                  style={{ backgroundColor: generatedImageCreative.metadata?.design_payload?.themeColor || '#FF3B30' }}
                                >
                                  {generatedImageCreative.metadata?.design_payload?.cta || 'Link na Bio'}
                                </div>
                             </div>
                             
                             <p className="text-2xl font-medium opacity-80 uppercase tracking-widest">Achei na {generatedImageCreative.marketplace || 'Shopee'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'galeria' && (
        <motion.div 
          key="galeria"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> Seus Criativos Finalizados</h2>
            <Badge variant="default">{completedCreatives.length} itens</Badge>
          </div>
          
          {loading && creatives.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
          ) : completedCreatives.length === 0 ? (
             <EmptyState 
                icon={<ImageIcon className="w-8 h-8" />}
                title="Sua Galeria está vazia"
                description="Os criativos que você gerar aparecerão aqui prontos para download."
             />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCreatives.map(creative => (
                <div key={creative.id} className="group relative bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30 flex flex-col h-[350px]">
                  <div className="relative flex-1 overflow-hidden bg-black/5">
                    <img src={getCreativePreviewImage(creative)} alt={creative.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    <div className="absolute top-3 left-3 flex gap-2">
                       {creative.generation_status === 'ready_with_fallback' ? (
                         <Badge className="bg-yellow-500/80 hover:bg-yellow-500 text-yellow-950 backdrop-blur-md border-0"><ImageIcon className="w-3 h-3 mr-1" /> Estático</Badge>
                       ) : (
                         <Badge className="bg-green-500/80 hover:bg-green-500 text-green-950 backdrop-blur-md border-0"><Video className="w-3 h-3 mr-1" /> Vídeo</Badge>
                       )}
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                       <button onClick={() => setCreativeToDelete(creative)} className="p-2 bg-destructive/80 hover:bg-destructive text-white rounded-full backdrop-blur-md transition-colors shadow-lg"><Trash2 className="w-4 h-4" /></button>
                       <button onClick={() => handleDownload(creative)} className="p-2 bg-primary/80 hover:bg-primary text-white rounded-full backdrop-blur-md transition-colors shadow-lg"><Download className="w-4 h-4" /></button>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none">
                      <p className="text-[10px] text-primary font-bold tracking-wider mb-1 drop-shadow-md uppercase">{creative.marketplace}</p>
                      <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-md leading-tight">{creative.title || 'Sem título'}</h3>
                      <p className="text-[10px] text-gray-300 mt-2 opacity-80">{new Date(creative.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {creativeToDelete && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card w-full max-w-md rounded-xl border border-border/50 shadow-2xl p-6 relative"
              >
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Excluir Criativo?</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Tem certeza que deseja remover o criativo <strong>{creativeToDelete.title || 'Sem título'}</strong>? Esta ação não pode ser desfeita e os arquivos serão perdidos.
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setCreativeToDelete(null)} disabled={isDeleting}>Cancelar</Button>
                  <Button variant="destructive" className="flex-1" onClick={confirmDelete} isLoading={isDeleting}>Sim, Excluir</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
