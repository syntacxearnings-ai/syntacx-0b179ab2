import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionRequest {
  action: 'pause' | 'activate' | 'close' | 'update_price' | 'update_stock';
  item_ids: string[]; // ML item IDs (e.g., MLB123456789)
  value?: number; // For price or stock updates
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshTokenIfNeeded(
  supabaseAdmin: any,
  integration: {
    id: string;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string;
  }
): Promise<string | null> {
  const expiresAt = new Date(integration.token_expires_at);
  const now = new Date();
  const bufferMinutes = 5;

  if (expiresAt.getTime() - bufferMinutes * 60 * 1000 > now.getTime()) {
    return integration.access_token;
  }

  console.log('[ML Actions] Token expired, attempting refresh...');

  if (!integration.refresh_token) {
    console.error('[ML Actions] No refresh token available');
    await supabaseAdmin
      .from('mercadolivre_integrations')
      .update({ is_active: false })
      .eq('id', integration.id);
    return null;
  }

  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: Deno.env.get('ML_CLIENT_ID') || '',
        client_secret: Deno.env.get('ML_CLIENT_SECRET') || '',
        refresh_token: integration.refresh_token,
      }),
    });

    if (!response.ok) {
      console.error('[ML Actions] Token refresh failed:', await response.text());
      await supabaseAdmin
        .from('mercadolivre_integrations')
        .update({ is_active: false })
        .eq('id', integration.id);
      return null;
    }

    const tokens = await response.json();
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabaseAdmin
      .from('mercadolivre_integrations')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || integration.refresh_token,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    console.log('[ML Actions] Token refreshed successfully');
    return tokens.access_token;
  } catch (error) {
    console.error('[ML Actions] Token refresh error:', error);
    return null;
  }
}

async function updateItemOnML(
  accessToken: string,
  itemId: string,
  action: string,
  value?: number
): Promise<{ success: boolean; error?: string }> {
  let body: Record<string, unknown> = {};

  switch (action) {
    case 'pause':
      body = { status: 'paused' };
      break;
    case 'activate':
      body = { status: 'active' };
      break;
    case 'close':
      body = { status: 'closed' };
      break;
    case 'update_price':
      if (value === undefined || value <= 0) {
        return { success: false, error: 'Invalid price value' };
      }
      body = { price: value };
      break;
    case 'update_stock':
      if (value === undefined || value < 0) {
        return { success: false, error: 'Invalid stock value' };
      }
      body = { available_quantity: value };
      break;
    default:
      return { success: false, error: 'Unknown action' };
  }

  console.log(`[ML Actions] Updating item ${itemId} with:`, body);

  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`[ML Actions] Failed to update ${itemId}:`, responseText);
      let errorMsg = 'Failed to update item';
      try {
        const errorJson = JSON.parse(responseText);
        errorMsg = errorJson.message || errorJson.error || errorMsg;
      } catch {
        // Use default error message
      }
      return { success: false, error: errorMsg };
    }

    console.log(`[ML Actions] Successfully updated ${itemId}`);
    return { success: true };
  } catch (error) {
    console.error(`[ML Actions] Error updating ${itemId}:`, error);
    return { success: false, error: String(error) };
  }
}

async function fetchItemDetails(accessToken: string, itemId: string): Promise<unknown | null> {
  try {
    const response = await fetch(
      `https://api.mercadolibre.com/items/${itemId}?attributes=id,title,status,sub_status,price,original_price,available_quantity,sold_quantity,listing_type_id,shipping,condition,category_id,site_id,permalink,thumbnail,variations,date_created,last_updated`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      console.error(`[ML Actions] Failed to fetch item ${itemId}:`, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[ML Actions] Error fetching ${itemId}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const body: ActionRequest = await req.json();
    const { action, item_ids, value } = body;

    if (!action || !item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: action and item_ids are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ML Actions] User ${userId} requesting ${action} on ${item_ids.length} items`);

    // Get integration
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('mercadolivre_integrations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.is_active) {
      return new Response(
        JSON.stringify({ error: 'Integration is inactive, please reconnect' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(supabaseAdmin, integration);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token expired, please reconnect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each item
    const results: { item_id: string; success: boolean; error?: string }[] = [];

    for (const itemId of item_ids) {
      const result = await updateItemOnML(accessToken, itemId, action, value);
      results.push({ item_id: itemId, ...result });

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

      // If successful, fetch updated item details and update Supabase
      if (result.success) {
        const updatedItem = await fetchItemDetails(accessToken, itemId);
        if (updatedItem) {
          const item = updatedItem as {
            id: string;
            title: string;
            status: string;
            sub_status?: string[];
            price: number;
            original_price?: number;
            available_quantity: number;
            sold_quantity: number;
            listing_type_id: string;
            shipping?: { free_shipping?: boolean; logistic_type?: string };
            condition: string;
            category_id: string;
            site_id: string;
            permalink: string;
            thumbnail: string;
            last_updated: string;
          };

          await supabaseAdmin
            .from('ml_listings')
            .update({
              title: item.title,
              status: item.status,
              substatus: item.sub_status?.join(', ') || null,
              price: item.price || 0,
              original_price: item.original_price || null,
              available_quantity: item.available_quantity || 0,
              sold_quantity: item.sold_quantity || 0,
              listing_type: item.listing_type_id,
              logistic_type: item.shipping?.logistic_type || null,
              condition: item.condition,
              category_id: item.category_id,
              site_id: item.site_id,
              permalink: item.permalink,
              thumbnail: item.thumbnail,
              free_shipping: item.shipping?.free_shipping || false,
              ml_updated_at: item.last_updated,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('item_id', itemId);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[ML Actions] Completed: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: `${successCount} item(s) updated, ${failCount} failed`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ML Actions] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
