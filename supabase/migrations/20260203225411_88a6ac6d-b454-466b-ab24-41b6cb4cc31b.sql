-- Create oauth_states table for secure state management
CREATE TABLE public.oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  state TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Service role can manage all states (for edge functions)
CREATE POLICY "Service role can manage oauth states"
ON public.oauth_states
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for fast state lookup
CREATE INDEX idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX idx_oauth_states_user_id ON public.oauth_states(user_id);

-- Auto-cleanup expired states (optional trigger)
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_states 
  WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_oauth_states_trigger
AFTER INSERT ON public.oauth_states
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_oauth_states();