import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingCart, Info, TrendingUp, CheckCircle2, Wand2 } from 'lucide-react';
import { Badge, Button } from '../ui/core';

interface ProductData {
  title: string;
  price?: number;
  discount?: number;
  marketplace: string;
  category?: string;
  images?: string[];
  opportunityScore?: number;
}

interface Props {
  product: ProductData;
  onGenerate: () => void;
  isLoading: boolean;
  isCached: boolean;
}

export function SmartProductPreview({ product, onGenerate, isLoading, isCached }: Props) {
  const coverImage = product.images?.[0] || 'https://placehold.co/600x800?text=Sem+Imagem';
  const score = product.opportunityScore || 85; 

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-card border border-border/50 shadow-premium rounded-2xl overflow-hidden w-full max-w-3xl mx-auto"
    >
      <div className="flex flex-col md:flex-row">
        {/* Product Image */}
        <div className="w-full md:w-1/3 bg-black/5 relative aspect-square md:aspect-auto">
          <img src={coverImage} alt="Produto" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {isCached && (
             <div className="absolute top-3 left-3">
                <Badge variant="success" className="backdrop-blur-md bg-green-500/80 text-white border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Cache Ativo
                </Badge>
             </div>
          )}
          <div className="absolute bottom-3 left-3 text-white">
             <Badge className="bg-primary/90 text-primary-foreground border-0 capitalize">
               {product.marketplace}
             </Badge>
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-2/3 p-6 sm:p-8 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-2">
              {product.title}
            </h2>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              R$ {(product.price || 0).toFixed(2).replace('.', ',')}
            </span>
            {product.discount ? (
               <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
                 -{product.discount}% OFF
               </Badge>
            ) : null}
          </div>

          {/* AI Intelligence Brief */}
          <div className="bg-secondary/40 rounded-xl p-4 mb-8 border border-border/50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" /> Inteligência de Conversão
            </h4>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-xs text-muted-foreground">Oportunidade</p>
                  <p className="font-bold text-foreground text-sm flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" /> {score}/100 Alta
                  </p>
               </div>
               <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p className="font-bold text-foreground text-sm capitalize">{product.category || 'Geral'}</p>
               </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <Info className="w-3 h-3" /> A IA detectou um forte apelo visual neste produto.
            </p>
          </div>

          <div className="mt-auto">
            <Button 
               size="lg" 
               className="w-full text-base py-6 shadow-premium hover:shadow-premium-hover bg-primary text-primary-foreground transition-all duration-300 transform hover:-translate-y-1"
               onClick={onGenerate}
               isLoading={isLoading}
               icon={<Wand2 className="w-5 h-5" />}
            >
              ✨ Gerar Vídeo e Roteiro
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Nossa IA criará a persona, o texto persuasivo e o vídeo em 45 segundos.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
