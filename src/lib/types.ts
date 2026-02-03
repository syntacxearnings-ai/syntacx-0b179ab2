// Syntacx Ops - Type Definitions

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costUnit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  sku: string;
  available: number;
  reserved: number;
  minStock: number;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  sku: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  date: Date;
  note?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitDiscount: number;
  unitCost: number;
}

export interface Order {
  id: string;
  orderIdMl: string;
  date: Date;
  status: 'paid' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  grossTotal: number;
  discountsTotal: number;
  shippingTotal: number;
  shippingSeller: number;
  feesTotal: number;
  feeDiscountTotal: number;
  taxesTotal: number;
  adsTotal: number;
  packagingCost: number;
  processingCost: number;
  items: OrderItem[];
}

export interface FixedCost {
  id: string;
  name: string;
  category: string;
  amountMonthly: number;
  createdAt: Date;
}

export interface VariableCostConfig {
  id: string;
  packagingPerOrder: number;
  packagingPerItem: number;
  processingPerOrder: number;
  adsPercentage: number;
  taxPercentage: number;
}

export interface MlFeeRule {
  id: string;
  category: string;
  listingType: string;
  feePercentage: number;
}

export interface MlFeeDiscount {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  isActive: boolean;
}

export interface Goal {
  id: string;
  period: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  revenueGoal: number;
  profitGoal: number;
  marginGoal: number;
  ordersGoal: number;
}

export interface ProfitBreakdown {
  grossRevenue: number;
  discounts: number;
  netRevenue: number;
  cogs: number;
  mlFeesGross: number;
  mlFeeDiscount: number;
  mlFeesNet: number;
  shippingSeller: number;
  packagingCost: number;
  processingCost: number;
  adsCost: number;
  taxes: number;
  variableCosts: number;
  fixedCostsAllocation: number;
  netProfit: number;
  netMarginPercent: number;
}

export interface DashboardFilters {
  period: 'day' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  status?: Order['status'][];
  category?: string;
  sku?: string;
}

export interface DashboardMetrics {
  grossRevenue: number;
  netRevenue: number;
  cogs: number;
  mlFeesGross: number;
  mlFeeDiscount: number;
  mlFeesNet: number;
  shippingSeller: number;
  variableCosts: number;
  fixedCostsAllocation: number;
  netProfit: number;
  netMarginPercent: number;
  ordersCount: number;
  itemsSold: number;
  avgTicket: number;
  returns: number;
  cancellations: number;
}

export type StatusType = Order['status'];
