import { MarketingStrategy } from './marketing-brain.service';

export interface CreativeTemplate {
  id: string;
  name: string;
  category: string;
  default_colors: string[];
  animation_style: 'dynamic' | 'smooth' | 'aggressive' | 'minimal';
}

export class TemplateEngineService {
  private readonly library: CreativeTemplate[] = [
    { id: 'oferta_relampago', name: 'Oferta Relâmpago', category: 'Geral', default_colors: ['#FF0000', '#000000', '#FFFFFF'], animation_style: 'aggressive' },
    { id: 'premium', name: 'Premium', category: 'Geral', default_colors: ['#D4AF37', '#000000'], animation_style: 'smooth' },
    { id: 'viral', name: 'Viral', category: 'Geral', default_colors: ['#00FF00', '#000000'], animation_style: 'dynamic' },
    { id: 'luxo', name: 'Luxo', category: 'Geral', default_colors: ['#000000', '#FFFFFF', '#CCCCCC'], animation_style: 'minimal' },
    { id: 'tecnologia', name: 'Tecnologia', category: 'Tech', default_colors: ['#0000FF', '#FFFFFF', '#00FFFF'], animation_style: 'dynamic' },
    { id: 'infantil', name: 'Infantil', category: 'Kids', default_colors: ['#FF69B4', '#87CEEB', '#FFFF00'], animation_style: 'smooth' },
    { id: 'beleza', name: 'Beleza', category: 'Beauty', default_colors: ['#FFC0CB', '#FFFFFF'], animation_style: 'smooth' },
    { id: 'moda', name: 'Moda', category: 'Fashion', default_colors: ['#000000', '#FFFFFF'], animation_style: 'minimal' },
    { id: 'casa', name: 'Casa', category: 'Home', default_colors: ['#8B4513', '#F5F5DC'], animation_style: 'smooth' },
    { id: 'ferramentas', name: 'Ferramentas', category: 'Tools', default_colors: ['#FFA500', '#000000'], animation_style: 'aggressive' },
    { id: 'fitness', name: 'Fitness', category: 'Health', default_colors: ['#00FF00', '#000000'], animation_style: 'dynamic' },
    { id: 'pet', name: 'Pet', category: 'Pets', default_colors: ['#FFA500', '#FFFFFF'], animation_style: 'dynamic' },
  ];

  selectTemplate(strategy: MarketingStrategy, productCategory: string): CreativeTemplate {
    // 1. Try to match by category
    const categoryMatch = this.library.find(t => t.category.toLowerCase() === productCategory.toLowerCase());
    if (categoryMatch) return categoryMatch;

    // 2. Match by marketing trigger
    if (strategy.mental_trigger === 'Urgência' || strategy.mental_trigger === 'Escassez') {
      return this.library.find(t => t.id === 'oferta_relampago')!;
    }
    if (strategy.mental_trigger === 'Autoridade') {
      return this.library.find(t => t.id === 'premium')!;
    }
    if (strategy.mental_trigger === 'Curiosidade') {
      return this.library.find(t => t.id === 'viral')!;
    }

    // Default
    return this.library.find(t => t.id === 'oferta_relampago')!;
  }
}

export const templateEngineService = new TemplateEngineService();
