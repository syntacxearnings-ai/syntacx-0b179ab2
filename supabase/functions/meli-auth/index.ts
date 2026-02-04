import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const clientSecret = url.searchParams.get('client_secret');

    console.log('[ML Auth] Starting auth flow');

    if (!clientId || !clientSecret) {
      console.error('[ML Auth] Missing credentials');
      return new Response(
        JSON.stringify({ error: 'Missing client_id or client_secret' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[ML Auth] Missing auth header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) {
      console.error('[ML Auth] User auth failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    console.log('[ML Auth] User authenticated:', userId);

    // Generate secure state
    const state = crypto.randomUUID();
    
    // CRITICAL: redirect_uri must point to the Edge Function, NOT frontend route
    // This URL must be registered in ML Developers console
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const redirectUri = `${supabaseUrl}/functions/v1/meli-oauth-callback`;

    // Save state to database using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: insertError } = await supabaseAdmin
      .from('oauth_states')
      .insert({
        user_id: userId,
        state: state,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      });

    if (insertError) {
      console.error('[ML Auth] Failed to save state:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize OAuth' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ML Auth] State saved:', state);
    console.log('[ML Auth] redirect_uri:', redirectUri);

    // Build authorization URL
    // IMPORTANT: The app must have these scopes enabled in ML Developers Console
    // Go to: https://developers.mercadolibre.com.br/devcenter -> Your App -> Scopes
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    
    // Note: Mercado Libre doesn't use scope parameter in the OAuth URL
    // Scopes are configured at the app level in the ML Developer Console
    // The app must have "read", "write", and "offline_access" enabled

    console.log('[ML Auth] Authorization URL:', authUrl.toString());

    // Return the authorization URL for frontend to redirect
    return new Response(
      JSON.stringify({ 
        authorization_url: authUrl.toString(),
        message: 'Certifique-se de que seu app no Mercado Livre Developers tem os escopos: read, write, offline_access'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ML Auth] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
