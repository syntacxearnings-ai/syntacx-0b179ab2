import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://289fa9d9-b6c0-4489-93d0-bad81c3761bb.lovableproject.com';

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('[ML Callback] ===== OAUTH CALLBACK =====');
    console.log('[ML Callback] code:', code ? 'present' : 'missing');
    console.log('[ML Callback] state:', state);
    console.log('[ML Callback] error:', error);

    // Handle OAuth errors from ML
    if (error) {
      console.error('[ML Callback] OAuth error from ML:', error, errorDescription);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/integrations?ml_error=${encodeURIComponent(error)}&ml_error_description=${encodeURIComponent(errorDescription || '')}`,
        },
      });
    }

    if (!code || !state) {
      console.error('[ML Callback] Missing code or state');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/integrations?ml_error=missing_params&ml_error_description=${encodeURIComponent('Código ou state ausente')}`,
        },
      });
    }

    // Validate state from database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .is('used_at', null)
      .single();

    if (stateError || !stateData) {
      console.error('[ML Callback] Invalid state:', stateError?.message || 'State not found or already used');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/integrations?ml_error=invalid_state&ml_error_description=${encodeURIComponent('State inválido, expirado ou já utilizado. Tente conectar novamente.')}`,
        },
      });
    }

    // Check if state expired
    if (new Date(stateData.expires_at) < new Date()) {
      console.error('[ML Callback] State expired:', stateData.expires_at);
      await supabaseAdmin.from('oauth_states').delete().eq('id', stateData.id);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/integrations?ml_error=state_expired&ml_error_description=${encodeURIComponent('Sessão expirada. Tente conectar novamente.')}`,
        },
      });
    }

    console.log('[ML Callback] State validated for user:', stateData.user_id);
    console.log('[ML Callback] redirect_uri (token_exchange):', stateData.redirect_uri);

    // Mark state as used immediately
    await supabaseAdmin
      .from('oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('id', stateData.id);

    // Exchange code for tokens
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: stateData.client_id,
      client_secret: stateData.client_secret,
      code: code,
      redirect_uri: stateData.redirect_uri,
    });

    console.log('[ML Callback] Exchanging code for tokens...');

    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    });

    const tokenResponseText = await tokenResponse.text();
    console.log('[ML Callback] Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      console.error('[ML Callback] Token exchange failed:', tokenResponseText);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/integrations?ml_error=token_exchange_failed&ml_error_description=${encodeURIComponent('Falha ao trocar código por tokens')}`,
        },
      });
    }

    let tokens;
    try {
      tokens = JSON.parse(tokenResponseText);
    } catch {
      console.error('[ML Callback] Failed to parse token response');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/integrations?ml_error=invalid_token_response&ml_error_description=${encodeURIComponent('Resposta inválida do Mercado Livre')}`,
        },
      });
    }

    // Detailed logging of token response (without exposing secrets)
    console.log('[ML Callback] ===== TOKEN RESPONSE ANALYSIS =====');
    console.log('[ML Callback] access_token:', tokens.access_token ? `present (${tokens.access_token.substring(0, 20)}...)` : 'MISSING');
    console.log('[ML Callback] refresh_token:', tokens.refresh_token ? 'present' : 'NOT RETURNED (ML did not provide refresh_token)');
    console.log('[ML Callback] expires_in:', tokens.expires_in);
    console.log('[ML Callback] user_id:', tokens.user_id);
    console.log('[ML Callback] token_type:', tokens.token_type);
    console.log('[ML Callback] scope:', tokens.scope);

    if (!tokens.refresh_token) {
      console.warn('[ML Callback] ⚠️ No refresh_token received. User will need to reconnect when access_token expires.');
    }

    // Get ML user info
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      console.error('[ML Callback] Failed to get ML user info');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/integrations?ml_error=user_info_failed&ml_error_description=${encodeURIComponent('Falha ao obter informações do usuário ML')}`,
        },
      });
    }

    const mlUser = await userResponse.json();
    console.log('[ML Callback] ML user:', { id: mlUser.id, nickname: mlUser.nickname });

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    // Build integration data - refresh_token is now nullable
    const integrationData: Record<string, unknown> = {
      user_id: stateData.user_id,
      ml_user_id: String(mlUser.id),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null, // Nullable - save null if not provided
      token_expires_at: expiresAt,
      nickname: mlUser.nickname,
      email: mlUser.email,
      site_id: mlUser.site_id || 'MLB',
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    console.log('[ML Callback] Saving integration with refresh_token:', tokens.refresh_token ? 'YES' : 'NO (null)');

    const { error: upsertError } = await supabaseAdmin
      .from('mercadolivre_integrations')
      .upsert(integrationData, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('[ML Callback] Database upsert error:', upsertError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/integrations?ml_error=db_error&ml_error_description=${encodeURIComponent('Falha ao salvar integração: ' + upsertError.message)}`,
        },
      });
    }

    console.log('[ML Callback] ✅ Integration saved successfully');

    // Clean up used state
    await supabaseAdmin.from('oauth_states').delete().eq('id', stateData.id);

    // Redirect to success
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${frontendUrl}/integrations?ml_success=1`,
      },
    });

  } catch (error: unknown) {
    console.error('[ML Callback] Unexpected error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${frontendUrl}/integrations?ml_error=unexpected&ml_error_description=${encodeURIComponent('Erro inesperado')}`,
      },
    });
  }
});
