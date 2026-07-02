import React, { useState } from 'react';
import { Card, Button, Badge } from '../ui/core';
import { Star, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { api } from '../../lib/api';

interface FeedbackProps {
  creativeId: string;
  onSubmitted: () => void;
}

const TAGS = [
  'Hook fraco', 'Texto longo', 'CTA ruim', 'Movimento exagerado',
  'Pouca urgência', 'Vídeo lento', 'Visual excelente', 'Muito profissional', 'Ficou genérico'
];

export function CreativeFeedbackForm({ creativeId, onSubmitted }: FeedbackProps) {
  const [rating, setRating] = useState(0);
  const [wouldPublish, setWouldPublish] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) newTags.delete(tag);
    else newTags.add(tag);
    setSelectedTags(newTags);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/feedbacks', {
        creative_id: creativeId,
        overall_rating: rating,
        reason_tags: Array.from(selectedTags),
        comments,
        would_publish: wouldPublish
      });
      onSubmitted();
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 max-w-lg mx-auto bg-background/50 backdrop-blur border-indigo-500/20 shadow-xl">
      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" /> 
        Avalie este Criativo
      </h3>
      <p className="text-sm text-muted-foreground mb-6">Seu feedback treina nossa IA para gerar vídeos ainda melhores para o seu nicho.</p>

      {/* Ratings */}
      <div className="flex gap-2 justify-center mb-8">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star} 
            onClick={() => setRating(star)}
            className={`p-2 transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500/50'}`}
          >
            <Star className="w-8 h-8 fill-current" />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="space-y-3">
            <p className="text-sm font-medium">Você publicaria este vídeo?</p>
            <div className="flex gap-4">
              <Button 
                variant={wouldPublish === true ? 'primary' : 'ghost'} 
                className="flex-1" 
                onClick={() => setWouldPublish(true)}
                icon={<ThumbsUp className="w-4 h-4" />}
              >Sim</Button>
              <Button 
                variant={wouldPublish === false ? 'destructive' : 'ghost'} 
                className="flex-1" 
                onClick={() => setWouldPublish(false)}
                icon={<ThumbsDown className="w-4 h-4" />}
              >Não</Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">O que chamou sua atenção?</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.has(tag) 
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                    : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Algum comentário extra?</p>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ex: Achei a transição inicial um pouco confusa..." 
              value={comments}
              onChange={(e: any) => setComments(e.target.value)}
            />
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            isLoading={isSubmitting} 
            onClick={handleSubmit}
            icon={<Send className="w-4 h-4" />}
          >
            Enviar Avaliação
          </Button>

        </div>
      )}
    </Card>
  );
}
