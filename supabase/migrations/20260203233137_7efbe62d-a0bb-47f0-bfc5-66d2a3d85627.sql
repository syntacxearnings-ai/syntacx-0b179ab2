-- Add notification_settings table for user notification preferences
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  low_stock_alert BOOLEAN NOT NULL DEFAULT true,
  daily_summary BOOLEAN NOT NULL DEFAULT true,
  negative_margin_alert BOOLEAN NOT NULL DEFAULT true,
  goal_progress_alert BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Add timezone to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

-- Add trigger for updated_at on notification_settings
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();