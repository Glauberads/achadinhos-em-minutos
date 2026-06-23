export interface NormalizedProduct {
  platform: 'shopee' | 'mercadolivre';
  external_id: string;
  title: string;
  original_price: number | null;
  current_price: number;
  discount: number | null;
  image_url: string | null;
  source_url: string;
  affiliate_link: string | null;
  rating: number | null;
  sold_count: number | null;
  category: string | null;
  free_shipping: boolean;
  metadata: {
    score_reason?: string;
    affiliate_status?: 'success' | 'missing' | 'failed';
    [key: string]: any;
  };
}

export interface SearchFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  minRating?: number;
  freeShipping?: boolean;
  limit?: number;
  sort?: 'sales' | 'discount' | 'price_asc' | 'rating' | 'relevance';
}

export interface IProductProvider {
  search(filters: SearchFilters, userId?: string): Promise<NormalizedProduct[]>;
}
