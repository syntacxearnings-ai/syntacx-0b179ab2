import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Goal {
  id: string;
  user_id: string;
  period: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  revenue_goal: number;
  profit_goal: number;
  margin_goal: number;
  orders_goal: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  period: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  revenue_goal: number;
  profit_goal: number;
  margin_goal: number;
  orders_goal: number;
}

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });

  const createGoal = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('goals')
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
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({ title: 'Meta criada', description: 'Meta salva com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: error.message 
      });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Goal> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('goals')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({ title: 'Meta atualizada', description: 'Meta atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: error.message 
      });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({ title: 'Meta excluída', description: 'Meta removida com sucesso!' });
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: error.message 
      });
    },
  });

  const monthlyGoals = goals.filter(g => g.period === 'monthly');
  const weeklyGoals = goals.filter(g => g.period === 'weekly');

  return {
    goals,
    monthlyGoals,
    weeklyGoals,
    isLoading,
    error,
    createGoal: createGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
    isCreating: createGoal.isPending,
    isUpdating: updateGoal.isPending,
    isDeleting: deleteGoal.isPending,
  };
}
