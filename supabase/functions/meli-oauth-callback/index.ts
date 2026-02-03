import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('OAuth callback received:', { code: code ? 'present' : 'missing', state, error });

    // Check for OAuth errors from ML
    if (error) {
      console.error('OAuth error from ML:', error, errorDescription);
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://syntacx-profit-navigator.lovable.app';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${frontendUrl}/integrations?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`,
        },
      });
    }

    if (!code) {
      console.error('Missing authorization code');
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get credentials from request body (POST) or headers
    const body = req.method === 'POST' ? await req.json() : {};
    const clientId = body.client_id || req.headers.get('x-ml-client-id');
    const clientSecret = body.client_secret || req.headers.get('x-ml-client-secret');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://syntacx-profit-navigator.lovable.app';
    // CRITICAL: redirect_uri MUST be identical to the one used in authorization
    const redirectUri = body.redirect_uri || `${frontendUrl}/api/integrations/meli/callback`;

    console.log('Token exchange config:', { 
      clientId: clientId ? 'present' : 'missing', 
      clientSecret: clientSecret ? 'present' : 'missing',
      redirectUri 
    });

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing client credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange code for tokens using authorization_code grant
    // Body MUST be x-www-form-urlencoded
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    });

    console.log('Exchanging code for tokens...');
    
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    });

    const tokenResponseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenResponseText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to exchange code for tokens', 
          details: tokenResponseText,
          status: tokenResponse.status 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let tokens;
    try {
      tokens = JSON.parse(tokenResponseText);
    } catch (e) {
      console.error('Failed to parse token response:', tokenResponseText);
      return new Response(
        JSON.stringify({ error: 'Invalid token response from ML', details: tokenResponseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tokens received:', { 
      access_token: tokens.access_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing',
      expires_in: tokens.expires_in,
      user_id: tokens.user_id
    });

    // Get user info from Mercado Livre
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const userError = await userResponse.text();
      console.error('Failed to get ML user info:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to get user info from ML', details: userError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mlUser = await userResponse.json();
    console.log('ML user info:', { id: mlUser.id, nickname: mlUser.nickname, site_id: mlUser.site_id });

    // Create Supabase client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get authenticated user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing auth header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing auth token' }),
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
      console.error('Failed to get auth user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate token expiration timestamp
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    // Upsert integration record with all required fields
    const { error: upsertError } = await supabaseAdmin
      .from('mercadolivre_integrations')
      .upsert({
        user_id: userData.user.id,
        ml_user_id: String(mlUser.id),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        nickname: mlUser.nickname,
        email: mlUser.email,
        site_id: mlUser.site_id || 'MLB',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save integration', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Integration saved successfully for user:', userData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: mlUser.id,
          nickname: mlUser.nickname,
          email: mlUser.email,
          site_id: mlUser.site_id,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
