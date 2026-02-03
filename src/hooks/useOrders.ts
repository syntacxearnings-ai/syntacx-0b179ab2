import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderItem, FixedCost } from '@/lib/types';

export interface DbOrder {
  id: string;
  user_id: string;
  order_id_ml: string;
  date_created: string;
  status: string;
  gross_total: number;
  discounts_total: number;
  shipping_total: number;
  shipping_seller: number;
  fees_total: number;
  fee_discount_total: number;
  taxes_total: number;
  ads_total: number;
  packaging_cost: number;
  processing_cost: number;
  buyer_nickname: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  user_id: string;
  sku: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_discount: number;
  unit_cost: number;
  ml_item_id: string | null;
  created_at: string;
}

// Transform DB order to app Order type
function transformOrder(dbOrder: DbOrder, items: DbOrderItem[]): Order {
  return {
    id: dbOrder.id,
    orderIdMl: dbOrder.order_id_ml,
    date: new Date(dbOrder.date_created),
    status: dbOrder.status as Order['status'],
    grossTotal: Number(dbOrder.gross_total),
    discountsTotal: Number(dbOrder.discounts_total),
    shippingTotal: Number(dbOrder.shipping_total),
    shippingSeller: Number(dbOrder.shipping_seller),
    feesTotal: Number(dbOrder.fees_total),
    feeDiscountTotal: Number(dbOrder.fee_discount_total),
    taxesTotal: Number(dbOrder.taxes_total),
    adsTotal: Number(dbOrder.ads_total),
    packagingCost: Number(dbOrder.packaging_cost),
    processingCost: Number(dbOrder.processing_cost),
    items: items.map(item => ({
      id: item.id,
      orderId: item.order_id,
      sku: item.sku || '',
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      unitDiscount: Number(item.unit_discount),
      unitCost: Number(item.unit_cost),
    })),
  };
}

// Transform DB fixed costs to app FixedCost type
export function transformFixedCosts(dbCosts: { id: string; name: string; category: string; amount_monthly: number; created_at: string }[]): FixedCost[] {
  return dbCosts.map(cost => ({
    id: cost.id,
    name: cost.name,
    category: cost.category,
    amountMonthly: Number(cost.amount_monthly),
    createdAt: new Date(cost.created_at),
  }));
}

export function useOrders() {
  const { user } = useAuth();

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('date_created', { ascending: false });
      
      if (error) throw error;
      return data as DbOrder[];
    },
    enabled: !!user,
  });

  const { data: orderItemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['order-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as DbOrderItem[];
    },
    enabled: !!user,
  });

  // Transform orders with their items
  const orders: Order[] = (ordersData || []).map(dbOrder => {
    const items = (orderItemsData || []).filter(item => item.order_id === dbOrder.id);
    return transformOrder(dbOrder, items);
  });

  return {
    orders,
    isLoading: isLoadingOrders || isLoadingItems,
  };
}
