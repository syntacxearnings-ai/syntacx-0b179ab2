import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  low_stock_alert: boolean;
  daily_summary: boolean;
  negative_margin_alert: boolean;
  goal_progress_alert: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  // Fetch notification settings
  const { data: notificationSettings, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: !!user,
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (input: { full_name?: string; company_name?: string; timezone?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...input,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Perfil atualizado', description: 'Suas alterações foram salvas.' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Update notification settings
  const updateNotificationSettings = useMutation({
    mutationFn: async (input: Partial<Omit<NotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...input,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({ title: 'Preferências salvas', description: 'Suas configurações de notificação foram atualizadas.' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  return {
    profile,
    notificationSettings,
    isLoading: isLoadingProfile || isLoadingNotifications,
    updateProfile: updateProfile.mutate,
    updateNotificationSettings: updateNotificationSettings.mutate,
    isUpdatingProfile: updateProfile.isPending,
    isUpdatingNotifications: updateNotificationSettings.isPending,
  };
}
