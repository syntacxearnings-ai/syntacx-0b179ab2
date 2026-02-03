import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FixedCost {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount_monthly: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VariableCostsConfig {
  id: string;
  user_id: string;
  packaging_per_order: number;
  packaging_per_item: number;
  processing_per_order: number;
  ads_percentage: number;
  tax_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFixedCostInput {
  name: string;
  category: string;
  amount_monthly: number;
}

export function useCosts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fixed Costs
  const { data: fixedCosts = [], isLoading: isLoadingFixed } = useQuery({
    queryKey: ['fixed-costs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('fixed_costs')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data as FixedCost[];
    },
    enabled: !!user,
  });

  // Variable Costs Config
  const { data: variableCostsConfig, isLoading: isLoadingVariable } = useQuery({
    queryKey: ['variable-costs-config', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('variable_costs_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as VariableCostsConfig | null;
    },
    enabled: !!user,
  });

  // Create Fixed Cost
  const createFixedCost = useMutation({
    mutationFn: async (input: CreateFixedCostInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('fixed_costs')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
      toast({ title: 'Custo criado', description: 'Custo fixo adicionado com sucesso!' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Update Fixed Cost
  const updateFixedCost = useMutation({
    mutationFn: async ({ id, ...input }: Partial<FixedCost> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('fixed_costs')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
      toast({ title: 'Custo atualizado' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Delete Fixed Cost
  const deleteFixedCost = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('fixed_costs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
      toast({ title: 'Custo excluído' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Update or Create Variable Costs Config
  const updateVariableCostsConfig = useMutation({
    mutationFn: async (input: Partial<Omit<VariableCostsConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('variable_costs_config')
        .upsert({
          user_id: user.id,
          ...input,
        }, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-costs-config'] });
      toast({ title: 'Configuração salva' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  const totalFixedCosts = fixedCosts.filter(c => c.is_active).reduce((sum, c) => sum + Number(c.amount_monthly), 0);

  return {
    fixedCosts,
    variableCostsConfig,
    totalFixedCosts,
    isLoading: isLoadingFixed || isLoadingVariable,
    createFixedCost: createFixedCost.mutate,
    updateFixedCost: updateFixedCost.mutate,
    deleteFixedCost: deleteFixedCost.mutate,
    updateVariableCostsConfig: updateVariableCostsConfig.mutate,
    isCreating: createFixedCost.isPending,
    isUpdating: updateFixedCost.isPending,
    isDeleting: deleteFixedCost.isPending,
  };
}
