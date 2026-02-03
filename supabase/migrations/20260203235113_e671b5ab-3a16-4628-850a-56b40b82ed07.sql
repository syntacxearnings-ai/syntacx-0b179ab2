-- Tabela principal de anúncios do Mercado Livre
CREATE TABLE public.ml_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  substatus TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  listing_type TEXT,
  logistic_type TEXT,
  condition TEXT,
  category_id TEXT,
  site_id TEXT DEFAULT 'MLB',
  permalink TEXT,
  thumbnail TEXT,
  free_shipping BOOLEAN DEFAULT false,
  has_variations BOOLEAN DEFAULT false,
  ml_created_at TIMESTAMP WITH TIME ZONE,
  ml_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Tabela de variações dos anúncios
CREATE TABLE public.ml_listing_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.ml_listings(id) ON DELETE CASCADE,
  variation_id TEXT NOT NULL,
  sku TEXT,
  attributes JSONB DEFAULT '[]'::jsonb,
  price NUMERIC NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, variation_id)
);

-- Enable RLS
ALTER TABLE public.ml_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_listing_variations ENABLE ROW LEVEL SECURITY;

-- RLS policies for ml_listings
CREATE POLICY "Users can view their own listings"
ON public.ml_listings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own listings"
ON public.ml_listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
ON public.ml_listings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
ON public.ml_listings FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for ml_listing_variations
CREATE POLICY "Users can view their own listing variations"
ON public.ml_listing_variations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own listing variations"
ON public.ml_listing_variations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listing variations"
ON public.ml_listing_variations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listing variations"
ON public.ml_listing_variations FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_ml_listings_updated_at
BEFORE UPDATE ON public.ml_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ml_listing_variations_updated_at
BEFORE UPDATE ON public.ml_listing_variations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for better performance
CREATE INDEX idx_ml_listings_user_id ON public.ml_listings(user_id);
CREATE INDEX idx_ml_listings_status ON public.ml_listings(status);
CREATE INDEX idx_ml_listings_item_id ON public.ml_listings(item_id);
CREATE INDEX idx_ml_listing_variations_listing_id ON public.ml_listing_variations(listing_id);