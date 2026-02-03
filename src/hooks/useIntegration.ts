import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MercadoLivreIntegration {
  id: string;
  user_id: string;
  ml_user_id: string;
  nickname: string | null;
  email: string | null;
  site_id: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useIntegration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: integration, isLoading, error } = useQuery({
    queryKey: ['mercadolivre-integration', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('mercadolivre_integrations')
        .select('id, user_id, ml_user_id, nickname, email, site_id, is_active, last_sync_at, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as MercadoLivreIntegration | null;
    },
    enabled: !!user,
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('mercadolivre_integrations')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mercadolivre-integration'] });
    },
  });

  return {
    integration,
    isConnected: !!integration?.is_active,
    isLoading,
    error,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
}
