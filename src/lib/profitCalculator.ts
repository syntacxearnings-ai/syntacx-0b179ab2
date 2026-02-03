import { Order, ProfitBreakdown, FixedCost } from './types';

/**
 * Central profit calculation function
 * Implements the complete breakdown formula as specified
 */
export function calculateNetProfit(
  order: Order,
  fixedCosts: FixedCost[],
  ordersInPeriod: number
): ProfitBreakdown {
  // 1. Gross Revenue = sum(unit_price * qty)
  const grossRevenue = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // 2. Discounts = order discounts + item discounts
  const discounts = order.discountsTotal + 
    order.items.reduce(
      (sum, item) => sum + item.unitDiscount * item.quantity,
      0
    );

  // 3. Net Revenue = Gross Revenue - Discounts
  const netRevenue = grossRevenue - discounts;

  // 4. COGS = sum(unit_cost * qty)
  const cogs = order.items.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0
  );

  // 5. ML Fees
  const mlFeesGross = order.feesTotal;
  const mlFeeDiscount = order.feeDiscountTotal;
  const mlFeesNet = mlFeesGross - mlFeeDiscount;

  // 6. Shipping paid by seller
  const shippingSeller = order.shippingSeller;

  // 7. Variable Costs
  const packagingCost = order.packagingCost;
  const processingCost = order.processingCost;
  const adsCost = order.adsTotal;
  const taxes = order.taxesTotal;
  const variableCosts = packagingCost + processingCost + adsCost + taxes;

  // 8. Fixed Costs Allocation (prorated by orders in period)
  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.amountMonthly, 0);
  const fixedCostsAllocation = ordersInPeriod > 0 ? totalFixedCosts / ordersInPeriod : 0;

  // 9. Net Profit
  const netProfit = netRevenue - cogs - mlFeesNet - shippingSeller - variableCosts - fixedCostsAllocation;

  // 10. Net Margin %
  const netMarginPercent = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    discounts: Math.round(discounts * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    cogs: Math.round(cogs * 100) / 100,
    mlFeesGross: Math.round(mlFeesGross * 100) / 100,
    mlFeeDiscount: Math.round(mlFeeDiscount * 100) / 100,
    mlFeesNet: Math.round(mlFeesNet * 100) / 100,
    shippingSeller: Math.round(shippingSeller * 100) / 100,
    packagingCost: Math.round(packagingCost * 100) / 100,
    processingCost: Math.round(processingCost * 100) / 100,
    adsCost: Math.round(adsCost * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    variableCosts: Math.round(variableCosts * 100) / 100,
    fixedCostsAllocation: Math.round(fixedCostsAllocation * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    netMarginPercent: Math.round(netMarginPercent * 100) / 100,
  };
}

/**
 * Calculate aggregated metrics for multiple orders
 */
export function calculateAggregatedMetrics(
  orders: Order[],
  fixedCosts: FixedCost[]
): {
  totals: ProfitBreakdown;
  ordersCount: number;
  itemsSold: number;
  avgTicket: number;
  returns: number;
  cancellations: number;
} {
  const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');
  const ordersInPeriod = validOrders.length;

  const totals: ProfitBreakdown = {
    grossRevenue: 0,
    discounts: 0,
    netRevenue: 0,
    cogs: 0,
    mlFeesGross: 0,
    mlFeeDiscount: 0,
    mlFeesNet: 0,
    shippingSeller: 0,
    packagingCost: 0,
    processingCost: 0,
    adsCost: 0,
    taxes: 0,
    variableCosts: 0,
    fixedCostsAllocation: 0,
    netProfit: 0,
    netMarginPercent: 0,
  };

  validOrders.forEach(order => {
    const breakdown = calculateNetProfit(order, fixedCosts, ordersInPeriod);
    totals.grossRevenue += breakdown.grossRevenue;
    totals.discounts += breakdown.discounts;
    totals.netRevenue += breakdown.netRevenue;
    totals.cogs += breakdown.cogs;
    totals.mlFeesGross += breakdown.mlFeesGross;
    totals.mlFeeDiscount += breakdown.mlFeeDiscount;
    totals.mlFeesNet += breakdown.mlFeesNet;
    totals.shippingSeller += breakdown.shippingSeller;
    totals.packagingCost += breakdown.packagingCost;
    totals.processingCost += breakdown.processingCost;
    totals.adsCost += breakdown.adsCost;
    totals.taxes += breakdown.taxes;
    totals.variableCosts += breakdown.variableCosts;
    totals.fixedCostsAllocation += breakdown.fixedCostsAllocation;
    totals.netProfit += breakdown.netProfit;
  });

  totals.netMarginPercent = totals.netRevenue > 0 
    ? (totals.netProfit / totals.netRevenue) * 100 
    : 0;

  // Round all values
  Object.keys(totals).forEach(key => {
    totals[key as keyof ProfitBreakdown] = Math.round(totals[key as keyof ProfitBreakdown] * 100) / 100;
  });

  const itemsSold = validOrders.reduce(
    (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  return {
    totals,
    ordersCount: ordersInPeriod,
    itemsSold,
    avgTicket: ordersInPeriod > 0 ? Math.round((totals.grossRevenue / ordersInPeriod) * 100) / 100 : 0,
    returns: orders.filter(o => o.status === 'returned').length,
    cancellations: orders.filter(o => o.status === 'cancelled').length,
  };
}

/**
 * Calculate pricing suggestion for target margin
 */
export function calculatePricingSuggestion(params: {
  productCost: number;
  packagingCost: number;
  adsPercentage: number;
  taxPercentage: number;
  shippingSeller: number;
  mlFeePercentage: number;
  mlFeeDiscountPercentage: number;
  targetMarginPercentage: number;
}): {
  suggestedPrice: number;
  netProfit: number;
  actualMargin: number;
} {
  const {
    productCost,
    packagingCost,
    adsPercentage,
    taxPercentage,
    shippingSeller,
    mlFeePercentage,
    mlFeeDiscountPercentage,
    targetMarginPercentage,
  } = params;

  // Formula: Price = (TotalCosts) / (1 - targetMargin - fees)
  const effectiveFeeRate = (mlFeePercentage * (1 - mlFeeDiscountPercentage / 100)) / 100;
  const variableRate = (adsPercentage + taxPercentage) / 100;
  const fixedCosts = productCost + packagingCost + shippingSeller;
  
  const denominator = 1 - (targetMarginPercentage / 100) - effectiveFeeRate - variableRate;
  
  if (denominator <= 0) {
    return { suggestedPrice: 0, netProfit: 0, actualMargin: 0 };
  }

  const suggestedPrice = fixedCosts / denominator;
  const netProfit = suggestedPrice * (targetMarginPercentage / 100);
  
  return {
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    actualMargin: targetMarginPercentage,
  };
}

/**
 * Generate scenarios for pricing calculator
 */
export function generatePricingScenarios(baseParams: {
  productCost: number;
  packagingCost: number;
  shippingSeller: number;
  mlFeePercentage: number;
  mlFeeDiscountPercentage: number;
  salePrice: number;
}) {
  const scenarios = [
    { name: 'Pessimista', adsPercentage: 5, taxPercentage: 6, feeAdjustment: 1.1 },
    { name: 'Realista', adsPercentage: 3, taxPercentage: 5, feeAdjustment: 1.0 },
    { name: 'Otimista', adsPercentage: 2, taxPercentage: 4, feeAdjustment: 0.9 },
  ];

  return scenarios.map(scenario => {
    const effectiveFee = baseParams.mlFeePercentage * scenario.feeAdjustment;
    const feeAmount = baseParams.salePrice * (effectiveFee / 100) * (1 - baseParams.mlFeeDiscountPercentage / 100);
    const adsCost = baseParams.salePrice * (scenario.adsPercentage / 100);
    const taxes = baseParams.salePrice * (scenario.taxPercentage / 100);
    
    const totalCosts = baseParams.productCost + baseParams.packagingCost + 
      baseParams.shippingSeller + feeAmount + adsCost + taxes;
    
    const netProfit = baseParams.salePrice - totalCosts;
    const margin = baseParams.salePrice > 0 ? (netProfit / baseParams.salePrice) * 100 : 0;

    return {
      name: scenario.name,
      adsPercentage: scenario.adsPercentage,
      taxPercentage: scenario.taxPercentage,
      netProfit: Math.round(netProfit * 100) / 100,
      margin: Math.round(margin * 100) / 100,
    };
  });
}
