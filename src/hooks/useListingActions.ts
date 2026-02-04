import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type ActionType = 'pause' | 'activate' | 'close' | 'update_price' | 'update_stock';

interface ActionResult {
  item_id: string;
  success: boolean;
  error?: string;
}

interface ActionResponse {
  success: boolean;
  message: string;
  results: ActionResult[];
}

interface ActionParams {
  action: ActionType;
  itemIds: string[]; // ML item IDs (e.g., MLB123456789)
  value?: number;
}

export function useListingActions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const actionMutation = useMutation({
    mutationFn: async ({ action, itemIds, value }: ActionParams): Promise<ActionResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const fnBaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${fnBaseUrl}/functions/v1/meli-listing-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          item_ids: itemIds,
          value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Falha na ação');
      }

      return response.json();
    },
    onSuccess: (result, variables) => {
      // Invalidate listings query to refresh data
      queryClient.invalidateQueries({ queryKey: ['ml_listings'] });
      
      const actionLabels: Record<ActionType, string> = {
        pause: 'pausado(s)',
        activate: 'ativado(s)',
        close: 'encerrado(s)',
        update_price: 'preço atualizado',
        update_stock: 'estoque atualizado',
      };

      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;

      if (failCount === 0) {
        toast({
          title: 'Sucesso',
          description: `${successCount} anúncio(s) ${actionLabels[variables.action]}`,
        });
      } else if (successCount > 0) {
        toast({
          variant: 'default',
          title: 'Parcialmente concluído',
          description: `${successCount} sucesso, ${failCount} falha(s)`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: `Falha ao processar ${failCount} anúncio(s)`,
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
    },
  });

  const pauseListings = (itemIds: string[]) => {
    return actionMutation.mutateAsync({ action: 'pause', itemIds });
  };

  const activateListings = (itemIds: string[]) => {
    return actionMutation.mutateAsync({ action: 'activate', itemIds });
  };

  const closeListings = (itemIds: string[]) => {
    return actionMutation.mutateAsync({ action: 'close', itemIds });
  };

  const updatePrice = (itemId: string, price: number) => {
    return actionMutation.mutateAsync({ action: 'update_price', itemIds: [itemId], value: price });
  };

  const updateStock = (itemId: string, quantity: number) => {
    return actionMutation.mutateAsync({ action: 'update_stock', itemIds: [itemId], value: quantity });
  };

  return {
    pauseListings,
    activateListings,
    closeListings,
    updatePrice,
    updateStock,
    isLoading: actionMutation.isPending,
    error: actionMutation.error,
  };
}
