import { ProfitBreakdown } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  DollarSign,
  Package,
  Truck,
  Receipt,
  Megaphone,
  Building2
} from 'lucide-react';

interface ProfitBreakdownPanelProps {
  breakdown: ProfitBreakdown;
  compact?: boolean;
}

interface BreakdownRowProps {
  label: string;
  value: number;
  isDeduction?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
  icon?: React.ReactNode;
}

function BreakdownRow({ label, value, isDeduction = false, isTotal = false, isSubtotal = false, icon }: BreakdownRowProps) {
  return (
    <div className={cn(
      "breakdown-row",
      isTotal && "breakdown-total text-base",
      isSubtotal && "bg-muted/30 rounded"
    )}>
      <div className="flex items-center gap-2 breakdown-label">
        {icon}
        <span className={cn(isTotal && "text-foreground font-semibold")}>{label}</span>
      </div>
      <span className={cn(
        "breakdown-value",
        isDeduction && value > 0 && "text-destructive",
        !isDeduction && value > 0 && isTotal && "text-success",
        value < 0 && "text-destructive"
      )}>
        {isDeduction && value > 0 && '−'}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

export function ProfitBreakdownPanel({ breakdown, compact = false }: ProfitBreakdownPanelProps) {
  const isProfit = breakdown.netProfit >= 0;

  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="breakdown" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-medium">Lucro Líquido</span>
                <span className={cn(
                  "font-bold text-lg",
                  isProfit ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(breakdown.netProfit)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <BreakdownContent breakdown={breakdown} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={cn(
        "p-4 border-b border-border",
        isProfit ? "bg-success/5" : "bg-destructive/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProfit ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <span className="font-semibold">Lucro Líquido</span>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-2xl font-bold",
              isProfit ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(breakdown.netProfit)}
            </p>
            <p className="text-sm text-muted-foreground">
              Margem: {formatPercentage(breakdown.netMarginPercent)}
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <BreakdownContent breakdown={breakdown} />
      </div>
    </div>
  );
}

function BreakdownContent({ breakdown }: { breakdown: ProfitBreakdown }) {
  return (
    <div className="space-y-1">
      {/* Revenue Section */}
      <BreakdownRow 
        label="Receita Bruta" 
        value={breakdown.grossRevenue}
        icon={<DollarSign className="w-4 h-4" />}
      />
      <BreakdownRow 
        label="Descontos" 
        value={breakdown.discounts}
        isDeduction
      />
      <BreakdownRow 
        label="Receita Líquida" 
        value={breakdown.netRevenue}
        isSubtotal
      />

      <div className="my-3 border-t border-border" />

      {/* Costs Section */}
      <BreakdownRow 
        label="Custo dos Produtos (COGS)" 
        value={breakdown.cogs}
        isDeduction
        icon={<Package className="w-4 h-4" />}
      />
      
      <div className="pl-4 space-y-0.5">
        <BreakdownRow 
          label="Taxas ML (brutas)" 
          value={breakdown.mlFeesGross}
          isDeduction
        />
        <BreakdownRow 
          label="Desconto de taxas ML" 
          value={-breakdown.mlFeeDiscount}
        />
        <BreakdownRow 
          label="Taxas ML (líquidas)" 
          value={breakdown.mlFeesNet}
          isDeduction
          isSubtotal
          icon={<Receipt className="w-4 h-4" />}
        />
      </div>

      <BreakdownRow 
        label="Frete (vendedor)" 
        value={breakdown.shippingSeller}
        isDeduction
        icon={<Truck className="w-4 h-4" />}
      />

      <div className="my-2 border-t border-dashed border-border" />

      {/* Variable Costs */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        Custos Variáveis
      </p>
      <BreakdownRow 
        label="Embalagem" 
        value={breakdown.packagingCost}
        isDeduction
      />
      <BreakdownRow 
        label="Processamento" 
        value={breakdown.processingCost}
        isDeduction
      />
      <BreakdownRow 
        label="Ads/Marketing" 
        value={breakdown.adsCost}
        isDeduction
        icon={<Megaphone className="w-4 h-4" />}
      />
      <BreakdownRow 
        label="Impostos" 
        value={breakdown.taxes}
        isDeduction
      />

      <div className="my-2 border-t border-dashed border-border" />

      {/* Fixed Costs */}
      <BreakdownRow 
        label="Custos Fixos (rateio)" 
        value={breakdown.fixedCostsAllocation}
        isDeduction
        icon={<Building2 className="w-4 h-4" />}
      />

      <div className="my-3 border-t border-border" />

      {/* Final Result */}
      <BreakdownRow 
        label="Lucro Líquido" 
        value={breakdown.netProfit}
        isTotal
      />
    </div>
  );
}
