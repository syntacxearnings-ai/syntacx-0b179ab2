import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshTokenIfNeeded(
  supabaseAdmin: any,
  integration: { 
    id: string; 
    user_id: string; 
    access_token: string; 
    refresh_token: string | null; 
    token_expires_at: string;
    ml_user_id: string;
  }
): Promise<string | null> {
  const expiresAt = new Date(integration.token_expires_at);
  const now = new Date();
  const bufferMinutes = 5;
  
  if (expiresAt.getTime() - bufferMinutes * 60 * 1000 > now.getTime()) {
    return integration.access_token;
  }

  console.log('[ML Sync] Token expired or expiring soon, attempting refresh...');

  if (!integration.refresh_token) {
    console.error('[ML Sync] No refresh token available, user needs to reconnect');
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
      console.error('[ML Sync] Token refresh failed:', await response.text());
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

    console.log('[ML Sync] Token refreshed successfully');
    return tokens.access_token;
  } catch (error) {
    console.error('[ML Sync] Token refresh error:', error);
    return null;
  }
}

async function fetchMLOrders(accessToken: string, sellerId: string, dateFrom?: string): Promise<unknown[]> {
  const orders: unknown[] = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  const params = new URLSearchParams({
    seller: sellerId,
    sort: 'date_desc',
    limit: limit.toString(),
  });

  if (dateFrom) {
    params.set('order.date_created.from', dateFrom);
  }

  while (hasMore) {
    params.set('offset', offset.toString());
    
    const response = await fetch(`https://api.mercadolibre.com/orders/search?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('[ML Sync] Orders fetch failed:', await response.text());
      break;
    }

    const data = await response.json();
    orders.push(...(data.results || []));
    
    hasMore = data.paging && offset + limit < data.paging.total;
    offset += limit;

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return orders;
}

async function fetchMLListings(accessToken: string, sellerId: string): Promise<unknown[]> {
  const items: unknown[] = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  console.log('[ML Sync] Fetching listings for seller:', sellerId);

  while (hasMore) {
    const response = await fetch(
      `https://api.mercadolibre.com/users/${sellerId}/items/search?offset=${offset}&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ML Sync] Items search failed:', errorText);
      break;
    }

    const data = await response.json();
    const itemIds = data.results || [];
    
    console.log('[ML Sync] Found', itemIds.length, 'item IDs at offset', offset);
    
    if (itemIds.length > 0) {
      // Fetch item details in batches of 20 (ML limit)
      for (let i = 0; i < itemIds.length; i += 20) {
        const batch = itemIds.slice(i, i + 20);
        const idsParam = batch.join(',');
        
        const detailsResponse = await fetch(
          `https://api.mercadolibre.com/items?ids=${idsParam}&attributes=id,title,status,sub_status,price,original_price,available_quantity,sold_quantity,listing_type_id,shipping,condition,category_id,site_id,permalink,thumbnail,variations,date_created,last_updated,seller_custom_field`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          items.push(...details.filter((d: { code?: number }) => !d.code).map((d: { body: unknown }) => d.body));
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    hasMore = data.paging && offset + limit < data.paging.total;
    offset += limit;

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('[ML Sync] Total listings fetched:', items.length);
  return items;
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
    console.log('[ML Sync] Starting sync for user:', userId);

    const body = await req.json().catch(() => ({}));
    const fullSync = body.full_sync === true;
    const syncType = body.sync_type || 'full'; // 'full', 'orders', 'listings'

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

    // Create sync log
    const { data: syncLog } = await supabaseAdmin
      .from('sync_logs')
      .insert({
        user_id: userId,
        sync_type: syncType,
        status: 'running',
      })
      .select()
      .single();

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(supabaseAdmin, integration);
    if (!accessToken) {
      await supabaseAdmin
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: 'Token expired and refresh failed. Please reconnect.',
          finished_at: new Date().toISOString(),
        })
        .eq('id', syncLog?.id);

      return new Response(
        JSON.stringify({ error: 'Token expired, please reconnect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let ordersInserted = 0;
    let itemsInserted = 0;
    let listingsInserted = 0;
    let listingsUpdated = 0;
    let variationsInserted = 0;

    // Sync orders if requested
    if (syncType === 'full' || syncType === 'orders') {
      let dateFrom: string | undefined;
      if (!fullSync && integration.last_sync_at) {
        dateFrom = integration.last_sync_at;
      } else {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        dateFrom = ninetyDaysAgo.toISOString();
      }

      console.log('[ML Sync] Fetching orders from:', dateFrom);
      const mlOrders = await fetchMLOrders(accessToken, integration.ml_user_id, dateFrom);
      console.log('[ML Sync] Fetched', mlOrders.length, 'orders');

      for (const mlOrder of mlOrders) {
        const order = mlOrder as {
          id: number;
          date_created: string;
          status: string;
          total_amount: number;
          coupon?: { amount: number };
          order_items?: Array<{
            item: { id: string; title: string; seller_sku?: string };
            quantity: number;
            unit_price: number;
            sale_fee?: number;
          }>;
          buyer?: { nickname: string };
        };

        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('user_id', userId)
          .eq('order_id_ml', String(order.id))
          .single();

        const orderData = {
          user_id: userId,
          order_id_ml: String(order.id),
          date_created: order.date_created,
          status: order.status === 'paid' ? 'paid' : 
                  order.status === 'shipped' ? 'shipped' : 
                  order.status === 'delivered' ? 'delivered' :
                  order.status === 'cancelled' ? 'cancelled' : 'paid',
          gross_total: order.total_amount || 0,
          discounts_total: order.coupon?.amount || 0,
          shipping_total: 0,
          shipping_seller: 0,
          fees_total: 0,
          fee_discount_total: 0,
          taxes_total: 0,
          ads_total: 0,
          packaging_cost: 0,
          processing_cost: 0,
          buyer_nickname: order.buyer?.nickname || null,
        };

        let totalFees = 0;
        if (order.order_items) {
          for (const item of order.order_items) {
            totalFees += item.sale_fee || 0;
          }
        }
        orderData.fees_total = totalFees;

        let orderId: string;
        if (existingOrder) {
          await supabaseAdmin
            .from('orders')
            .update({ ...orderData, updated_at: new Date().toISOString() })
            .eq('id', existingOrder.id);
          orderId = existingOrder.id;
        } else {
          const { data: newOrder } = await supabaseAdmin
            .from('orders')
            .insert(orderData)
            .select('id')
            .single();
          orderId = newOrder?.id || '';
          ordersInserted++;
        }

        if (orderId && order.order_items) {
          for (const item of order.order_items) {
            const { data: existingItem } = await supabaseAdmin
              .from('order_items')
              .select('id')
              .eq('order_id', orderId)
              .eq('ml_item_id', item.item.id)
              .single();

            if (!existingItem) {
              await supabaseAdmin
                .from('order_items')
                .insert({
                  user_id: userId,
                  order_id: orderId,
                  ml_item_id: item.item.id,
                  product_name: item.item.title,
                  sku: item.item.seller_sku || null,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  unit_discount: 0,
                  unit_cost: 0,
                });
              itemsInserted++;
            }
          }
        }
      }
    }

    // Sync listings if requested
    if (syncType === 'full' || syncType === 'listings') {
      console.log('[ML Sync] Fetching listings...');
      const mlListings = await fetchMLListings(accessToken, integration.ml_user_id);
      console.log('[ML Sync] Processing', mlListings.length, 'listings...');

      for (const mlListing of mlListings) {
        const listing = mlListing as {
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
          variations?: Array<{
            id: number;
            price: number;
            available_quantity: number;
            sold_quantity: number;
            seller_custom_field?: string;
            attribute_combinations?: Array<{ id: string; name: string; value_name: string }>;
          }>;
          date_created: string;
          last_updated: string;
          seller_custom_field?: string;
        };

        const { data: existingListing } = await supabaseAdmin
          .from('ml_listings')
          .select('id')
          .eq('user_id', userId)
          .eq('item_id', listing.id)
          .single();

        const listingData = {
          user_id: userId,
          item_id: listing.id,
          title: listing.title,
          status: listing.status,
          substatus: listing.sub_status?.join(', ') || null,
          price: listing.price || 0,
          original_price: listing.original_price || null,
          available_quantity: listing.available_quantity || 0,
          sold_quantity: listing.sold_quantity || 0,
          listing_type: listing.listing_type_id,
          logistic_type: listing.shipping?.logistic_type || null,
          condition: listing.condition,
          category_id: listing.category_id,
          site_id: listing.site_id,
          permalink: listing.permalink,
          thumbnail: listing.thumbnail,
          free_shipping: listing.shipping?.free_shipping || false,
          has_variations: (listing.variations?.length || 0) > 0,
          ml_created_at: listing.date_created,
          ml_updated_at: listing.last_updated,
        };

        let listingId: string;
        if (existingListing) {
          await supabaseAdmin
            .from('ml_listings')
            .update({ ...listingData, updated_at: new Date().toISOString() })
            .eq('id', existingListing.id);
          listingId = existingListing.id;
          listingsUpdated++;
        } else {
          const { data: newListing } = await supabaseAdmin
            .from('ml_listings')
            .insert(listingData)
            .select('id')
            .single();
          listingId = newListing?.id || '';
          listingsInserted++;
        }

        // Process variations
        if (listingId && listing.variations && listing.variations.length > 0) {
          for (const variation of listing.variations) {
            const { data: existingVariation } = await supabaseAdmin
              .from('ml_listing_variations')
              .select('id')
              .eq('listing_id', listingId)
              .eq('variation_id', String(variation.id))
              .single();

            const variationData = {
              user_id: userId,
              listing_id: listingId,
              variation_id: String(variation.id),
              sku: variation.seller_custom_field || null,
              attributes: variation.attribute_combinations || [],
              price: variation.price || listing.price,
              available_quantity: variation.available_quantity || 0,
              sold_quantity: variation.sold_quantity || 0,
            };

            if (existingVariation) {
              await supabaseAdmin
                .from('ml_listing_variations')
                .update({ ...variationData, updated_at: new Date().toISOString() })
                .eq('id', existingVariation.id);
            } else {
              await supabaseAdmin
                .from('ml_listing_variations')
                .insert(variationData);
              variationsInserted++;
            }
          }
        }

        // Also create/update product record for cost tracking
        const { data: existingProduct } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('user_id', userId)
          .eq('ml_item_id', listing.id)
          .single();

        if (!existingProduct) {
          const sku = listing.seller_custom_field || `ML-${listing.id}`;
          
          const { data: newProduct } = await supabaseAdmin
            .from('products')
            .insert({
              user_id: userId,
              ml_item_id: listing.id,
              sku: sku,
              name: listing.title,
              category: 'Mercado Livre',
              cost_unit: 0,
            })
            .select('id')
            .single();

          if (newProduct) {
            await supabaseAdmin
              .from('inventory')
              .insert({
                user_id: userId,
                product_id: newProduct.id,
                available: listing.available_quantity || 0,
                reserved: 0,
                min_stock: 10,
              });
          }
        } else {
          // Update inventory
          const { data: existingInventory } = await supabaseAdmin
            .from('inventory')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', existingProduct.id)
            .single();

          if (existingInventory) {
            await supabaseAdmin
              .from('inventory')
              .update({ 
                available: listing.available_quantity || 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingInventory.id);
          }
        }
      }
    }

    // Update last sync timestamp
    await supabaseAdmin
      .from('mercadolivre_integrations')
      .update({ 
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    // Complete sync log
    const totalRecords = ordersInserted + itemsInserted + listingsInserted + listingsUpdated + variationsInserted;
    await supabaseAdmin
      .from('sync_logs')
      .update({
        status: 'completed',
        records_synced: totalRecords,
        finished_at: new Date().toISOString(),
      })
      .eq('id', syncLog?.id);

    // Calculate summary stats
    const { data: listingStats } = await supabaseAdmin
      .from('ml_listings')
      .select('status, available_quantity')
      .eq('user_id', userId);

    const summary = {
      total_listings: listingStats?.length || 0,
      active: listingStats?.filter(l => l.status === 'active').length || 0,
      paused: listingStats?.filter(l => l.status === 'paused').length || 0,
      with_stock: listingStats?.filter(l => l.available_quantity > 0).length || 0,
      without_stock: listingStats?.filter(l => l.available_quantity === 0).length || 0,
    };

    console.log('[ML Sync] Sync completed:', {
      orders: ordersInserted,
      items: itemsInserted,
      listings_new: listingsInserted,
      listings_updated: listingsUpdated,
      variations: variationsInserted,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização concluída',
        stats: {
          orders_synced: ordersInserted,
          items_synced: itemsInserted,
          listings_new: listingsInserted,
          listings_updated: listingsUpdated,
          variations_synced: variationsInserted,
        },
        summary,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ML Sync] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Sync failed', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
