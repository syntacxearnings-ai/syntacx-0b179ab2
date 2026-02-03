import { Order, Product, Inventory, FixedCost, Goal, VariableCostConfig, MlFeeDiscount } from './types';

// Mock Products
export const mockProducts: Product[] = [
  { id: '1', sku: 'FONE-BT-001', name: 'Fone Bluetooth Premium', category: 'Eletrônicos', costUnit: 45.00, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  { id: '2', sku: 'CAP-CEL-002', name: 'Capinha iPhone 15 Pro', category: 'Acessórios', costUnit: 12.00, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  { id: '3', sku: 'CARR-VEI-003', name: 'Carregador Veicular USB-C', category: 'Eletrônicos', costUnit: 18.00, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  { id: '4', sku: 'CABO-TC-004', name: 'Cabo Type-C 2m Premium', category: 'Cabos', costUnit: 8.00, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  { id: '5', sku: 'PELI-VID-005', name: 'Película Vidro Galaxy S24', category: 'Acessórios', costUnit: 5.00, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  { id: '6', sku: 'PWB-10K-006', name: 'Power Bank 10000mAh', category: 'Eletrônicos', costUnit: 55.00, createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-02-01') },
  { id: '7', sku: 'SUPO-CEL-007', name: 'Suporte Celular Carro', category: 'Acessórios', costUnit: 15.00, createdAt: new Date('2024-02-10'), updatedAt: new Date('2024-02-10') },
  { id: '8', sku: 'ALAM-BT-008', name: 'Alto-falante Bluetooth', category: 'Eletrônicos', costUnit: 75.00, createdAt: new Date('2024-02-15'), updatedAt: new Date('2024-02-15') },
];

// Mock Inventory
export const mockInventory: Inventory[] = [
  { id: '1', sku: 'FONE-BT-001', available: 45, reserved: 5, minStock: 20, updatedAt: new Date() },
  { id: '2', sku: 'CAP-CEL-002', available: 180, reserved: 12, minStock: 50, updatedAt: new Date() },
  { id: '3', sku: 'CARR-VEI-003', available: 8, reserved: 2, minStock: 15, updatedAt: new Date() }, // Low stock
  { id: '4', sku: 'CABO-TC-004', available: 220, reserved: 15, minStock: 100, updatedAt: new Date() },
  { id: '5', sku: 'PELI-VID-005', available: 95, reserved: 8, minStock: 30, updatedAt: new Date() },
  { id: '6', sku: 'PWB-10K-006', available: 12, reserved: 3, minStock: 10, updatedAt: new Date() },
  { id: '7', sku: 'SUPO-CEL-007', available: 3, reserved: 1, minStock: 15, updatedAt: new Date() }, // Critical stock
  { id: '8', sku: 'ALAM-BT-008', available: 25, reserved: 4, minStock: 8, updatedAt: new Date() },
];

// Generate realistic orders for the past 30 days
function generateMockOrders(): Order[] {
  const orders: Order[] = [];
  const statuses: Order['status'][] = ['paid', 'shipped', 'delivered', 'returned', 'cancelled'];
  const statusWeights = [0.15, 0.25, 0.50, 0.05, 0.05];

  const getRandomStatus = () => {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < statuses.length; i++) {
      cumulative += statusWeights[i];
      if (rand < cumulative) return statuses[i];
    }
    return 'delivered';
  };

  for (let i = 0; i < 85; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);
    
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let grossTotal = 0;
    let totalCogs = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const unitPrice = product.costUnit * (2 + Math.random());
      const unitDiscount = Math.random() > 0.7 ? unitPrice * 0.1 : 0;
      
      items.push({
        id: `item-${i}-${j}`,
        orderId: `order-${i}`,
        sku: product.sku,
        productName: product.name,
        quantity: qty,
        unitPrice: Math.round(unitPrice * 100) / 100,
        unitDiscount: Math.round(unitDiscount * 100) / 100,
        unitCost: product.costUnit,
      });
      
      grossTotal += unitPrice * qty;
      totalCogs += product.costUnit * qty;
    }
    
    const discountsTotal = items.reduce((sum, item) => sum + (item.unitDiscount * item.quantity), 0);
    const shippingTotal = 15 + Math.random() * 20;
    const shippingSeller = Math.random() > 0.6 ? shippingTotal * 0.3 : 0;
    const feesTotal = grossTotal * 0.16; // ~16% ML fees
    const feeDiscountTotal = feesTotal * (0.05 + Math.random() * 0.1); // 5-15% discount
    const taxesTotal = grossTotal * 0.05;
    const adsTotal = grossTotal * 0.03;
    const packagingCost = 2 + numItems;
    const processingCost = 1.5;

    orders.push({
      id: `order-${i}`,
      orderIdMl: `MLB${2000000000 + i}`,
      date: orderDate,
      status: getRandomStatus(),
      grossTotal: Math.round(grossTotal * 100) / 100,
      discountsTotal: Math.round(discountsTotal * 100) / 100,
      shippingTotal: Math.round(shippingTotal * 100) / 100,
      shippingSeller: Math.round(shippingSeller * 100) / 100,
      feesTotal: Math.round(feesTotal * 100) / 100,
      feeDiscountTotal: Math.round(feeDiscountTotal * 100) / 100,
      taxesTotal: Math.round(taxesTotal * 100) / 100,
      adsTotal: Math.round(adsTotal * 100) / 100,
      packagingCost: Math.round(packagingCost * 100) / 100,
      processingCost,
      items,
    });
  }
  
  return orders.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export const mockOrders = generateMockOrders();

// Mock Fixed Costs
export const mockFixedCosts: FixedCost[] = [
  { id: '1', name: 'Aluguel Escritório', category: 'Infraestrutura', amountMonthly: 1500, createdAt: new Date() },
  { id: '2', name: 'Contador', category: 'Serviços', amountMonthly: 350, createdAt: new Date() },
  { id: '3', name: 'Software ERP', category: 'Ferramentas', amountMonthly: 199, createdAt: new Date() },
  { id: '4', name: 'Internet + Telefone', category: 'Infraestrutura', amountMonthly: 180, createdAt: new Date() },
  { id: '5', name: 'Funcionário', category: 'Pessoal', amountMonthly: 2500, createdAt: new Date() },
];

// Mock Variable Cost Config
export const mockVariableCostConfig: VariableCostConfig = {
  id: '1',
  packagingPerOrder: 2.00,
  packagingPerItem: 0.50,
  processingPerOrder: 1.50,
  adsPercentage: 3,
  taxPercentage: 5,
};

// Mock Fee Discounts
export const mockFeeDiscounts: MlFeeDiscount[] = [
  { id: '1', name: 'Desconto Reputação Verde', type: 'percentage', value: 10, isActive: true },
  { id: '2', name: 'Campanha Promocional', type: 'percentage', value: 5, isActive: true },
  { id: '3', name: 'Mercado Pontos', type: 'fixed', value: 50, isActive: false },
];

// Mock Goals
export const mockGoals: Goal[] = [
  {
    id: '1',
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    revenueGoal: 50000,
    profitGoal: 8000,
    marginGoal: 16,
    ordersGoal: 120,
  },
  {
    id: '2',
    period: 'weekly',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revenueGoal: 12000,
    profitGoal: 2000,
    marginGoal: 17,
    ordersGoal: 30,
  },
];

export function getProductBySku(sku: string): Product | undefined {
  return mockProducts.find(p => p.sku === sku);
}

export function getInventoryBySku(sku: string): Inventory | undefined {
  return mockInventory.find(i => i.sku === sku);
}
