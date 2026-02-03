import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SyncStatus = 'idle' | 'starting' | 'syncing_orders' | 'syncing_products' | 'finishing' | 'completed' | 'error';

interface SyncResult {
  success: boolean;
  message: string;
  stats?: {
    orders_synced: number;
    items_synced: number;
    products_synced: number;
    total_orders_fetched: number;
    total_products_fetched: number;
  };
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [progress, setProgress] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const syncMutation = useMutation({
    mutationFn: async (fullSync: boolean = false): Promise<SyncResult> => {
      setStatus('starting');
      setProgress('Iniciando sincronização...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      setStatus('syncing_orders');
      setProgress('Importando pedidos do Mercado Livre...');

      const fnBaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${fnBaseUrl}/functions/v1/meli-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_sync: fullSync }),
      });

      setStatus('syncing_products');
      setProgress('Atualizando produtos e estoque...');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Falha na sincronização');
      }

      setStatus('finishing');
      setProgress('Finalizando...');

      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      setStatus('completed');
      setProgress('');
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['mercadolivre-integration'] });

      const stats = result.stats;
      const message = stats 
        ? `${stats.total_orders_fetched} pedidos e ${stats.total_products_fetched} produtos sincronizados`
        : 'Sincronização concluída';
      
      toast({
        title: 'Sincronização concluída',
        description: message,
      });

      // Reset status after a delay
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    },
    onError: (error) => {
      setStatus('error');
      setProgress('');
      toast({
        variant: 'destructive',
        title: 'Erro na sincronização',
        description: error.message,
      });

      // Reset status after a delay
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    },
  });

  return {
    sync: (fullSync?: boolean) => syncMutation.mutate(fullSync),
    status,
    progress,
    isLoading: syncMutation.isPending,
    error: syncMutation.error,
  };
}
