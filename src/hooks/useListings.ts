import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MLListing {
  id: string;
  user_id: string;
  item_id: string;
  title: string;
  status: string;
  substatus: string | null;
  price: number;
  original_price: number | null;
  available_quantity: number;
  sold_quantity: number;
  listing_type: string | null;
  logistic_type: string | null;
  condition: string | null;
  category_id: string | null;
  site_id: string | null;
  permalink: string | null;
  thumbnail: string | null;
  free_shipping: boolean;
  has_variations: boolean;
  ml_created_at: string | null;
  ml_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MLListingVariation {
  id: string;
  user_id: string;
  listing_id: string;
  variation_id: string;
  sku: string | null;
  attributes: Array<{ id: string; name: string; value_name: string }>;
  price: number;
  available_quantity: number;
  sold_quantity: number;
  created_at: string;
  updated_at: string;
}

export function useListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ['ml_listings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ml_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as MLListing[];
    },
    enabled: !!user,
  });

  const { data: variations = [] } = useQuery({
    queryKey: ['ml_listing_variations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ml_listing_variations')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as MLListingVariation[];
    },
    enabled: !!user,
  });

  const getVariationsForListing = (listingId: string) => {
    return variations.filter(v => v.listing_id === listingId);
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['ml_listings'] });
    queryClient.invalidateQueries({ queryKey: ['ml_listing_variations'] });
  };

  // Stats
  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    paused: listings.filter(l => l.status === 'paused').length,
    closed: listings.filter(l => l.status === 'closed').length,
    withStock: listings.filter(l => l.available_quantity > 0).length,
    withoutStock: listings.filter(l => l.available_quantity === 0).length,
  };

  return {
    listings,
    variations,
    getVariationsForListing,
    isLoading,
    error,
    refetch,
    stats,
  };
}
