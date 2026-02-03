-- =============================================
-- SYNTACX OPS - FULL DATABASE SCHEMA
-- =============================================

-- 1. Goals table (metas mensais/semanais)
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  revenue_goal NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit_goal NUMERIC(12,2) NOT NULL DEFAULT 0,
  margin_goal NUMERIC(5,2) NOT NULL DEFAULT 0,
  orders_goal INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Fixed Costs table (custos fixos)
CREATE TABLE public.fixed_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outros',
  amount_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Variable Costs Config table (config de custos variáveis)
CREATE TABLE public.variable_costs_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  packaging_per_order NUMERIC(10,2) NOT NULL DEFAULT 2.00,
  packaging_per_item NUMERIC(10,2) NOT NULL DEFAULT 0.50,
  processing_per_order NUMERIC(10,2) NOT NULL DEFAULT 1.50,
  ads_percentage NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Products table (produtos com custo)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  cost_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  ml_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sku)
);

-- 5. Inventory table (estoque por SKU)
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  available INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 6. Inventory Movements table (movimentações)
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment')),
  quantity INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Orders table (pedidos sincronizados do ML)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id_ml TEXT NOT NULL,
  date_created TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  gross_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  discounts_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_seller NUMERIC(12,2) NOT NULL DEFAULT 0,
  fees_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  fee_discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  taxes_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  ads_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  packaging_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  processing_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  buyer_nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, order_id_ml)
);

-- 8. Order Items table (itens de cada pedido)
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sku TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  ml_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Sync Logs table (histórico de sincronizações)
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'orders',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  records_synced INTEGER DEFAULT 0,
  error_message TEXT
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_costs_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Goals
-- =============================================
CREATE POLICY "Users can view their own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Fixed Costs
-- =============================================
CREATE POLICY "Users can view their own fixed costs" ON public.fixed_costs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own fixed costs" ON public.fixed_costs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fixed costs" ON public.fixed_costs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fixed costs" ON public.fixed_costs
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Variable Costs Config
-- =============================================
CREATE POLICY "Users can view their own variable costs config" ON public.variable_costs_config
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own variable costs config" ON public.variable_costs_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own variable costs config" ON public.variable_costs_config
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Products
-- =============================================
CREATE POLICY "Users can view their own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Inventory
-- =============================================
CREATE POLICY "Users can view their own inventory" ON public.inventory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own inventory" ON public.inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own inventory" ON public.inventory
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own inventory" ON public.inventory
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Inventory Movements
-- =============================================
CREATE POLICY "Users can view their own inventory movements" ON public.inventory_movements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own inventory movements" ON public.inventory_movements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Orders
-- =============================================
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Order Items
-- =============================================
CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own order items" ON public.order_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Sync Logs
-- =============================================
CREATE POLICY "Users can view their own sync logs" ON public.sync_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sync logs" ON public.sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sync logs" ON public.sync_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fixed_costs_updated_at
  BEFORE UPDATE ON public.fixed_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_variable_costs_config_updated_at
  BEFORE UPDATE ON public.variable_costs_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();