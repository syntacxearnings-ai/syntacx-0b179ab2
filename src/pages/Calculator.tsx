import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { generatePricingScenarios, calculatePricingSuggestion } from '@/lib/profitCalculator';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { Calculator as CalcIcon, TrendingUp, AlertTriangle, Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Calculator() {
  const [inputs, setInputs] = useState({
    productCost: 45,
    packagingCost: 3,
    shippingSeller: 5,
    mlFeePercentage: 16,
    mlFeeDiscountPercentage: 10,
    adsPercentage: 3,
    taxPercentage: 5,
    salePrice: 120,
    targetMargin: 15,
  });

  const scenarios = useMemo(() => {
    return generatePricingScenarios({
      productCost: inputs.productCost,
      packagingCost: inputs.packagingCost,
      shippingSeller: inputs.shippingSeller,
      mlFeePercentage: inputs.mlFeePercentage,
      mlFeeDiscountPercentage: inputs.mlFeeDiscountPercentage,
      salePrice: inputs.salePrice,
    });
  }, [inputs]);

  const suggestedPrice = useMemo(() => {
    return calculatePricingSuggestion({
      productCost: inputs.productCost,
      packagingCost: inputs.packagingCost,
      adsPercentage: inputs.adsPercentage,
      taxPercentage: inputs.taxPercentage,
      shippingSeller: inputs.shippingSeller,
      mlFeePercentage: inputs.mlFeePercentage,
      mlFeeDiscountPercentage: inputs.mlFeeDiscountPercentage,
      targetMarginPercentage: inputs.targetMargin,
    });
  }, [inputs]);

  // Calculate current scenario
  const currentScenario = useMemo(() => {
    const effectiveFee = inputs.salePrice * (inputs.mlFeePercentage / 100) * (1 - inputs.mlFeeDiscountPercentage / 100);
    const adsCost = inputs.salePrice * (inputs.adsPercentage / 100);
    const taxes = inputs.salePrice * (inputs.taxPercentage / 100);
    
    const totalCosts = inputs.productCost + inputs.packagingCost + 
      inputs.shippingSeller + effectiveFee + adsCost + taxes;
    
    const netProfit = inputs.salePrice - totalCosts;
    const margin = inputs.salePrice > 0 ? (netProfit / inputs.salePrice) * 100 : 0;

    return {
      effectiveFee,
      adsCost,
      taxes,
      totalCosts,
      netProfit,
      margin,
    };
  }, [inputs]);

  const updateInput = (key: keyof typeof inputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Calculadora de Precificação"
        description="Simule cenários e encontre o preço ideal para suas margens"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="w-5 h-5" />
              Parâmetros do Produto
            </CardTitle>
            <CardDescription>
              Insira os custos e taxas para calcular a margem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Costs */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Custos</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custo do Produto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.productCost}
                    onChange={(e) => updateInput('productCost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Embalagem (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.packagingCost}
                    onChange={(e) => updateInput('packagingCost', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frete Vendedor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={inputs.shippingSeller}
                  onChange={(e) => updateInput('shippingSeller', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* ML Fees */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Taxas Mercado Livre</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Taxa ML (%)</Label>
                  <span className="text-sm font-medium">{inputs.mlFeePercentage}%</span>
                </div>
                <Slider
                  value={[inputs.mlFeePercentage]}
                  onValueChange={([value]) => updateInput('mlFeePercentage', value)}
                  min={5}
                  max={25}
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Desconto de Taxa (%)</Label>
                  <span className="text-sm font-medium text-success">{inputs.mlFeeDiscountPercentage}%</span>
                </div>
                <Slider
                  value={[inputs.mlFeeDiscountPercentage]}
                  onValueChange={([value]) => updateInput('mlFeeDiscountPercentage', value)}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>
            </div>

            {/* Variable Costs */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Custos Variáveis</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Ads (%)</Label>
                    <span className="text-sm font-medium">{inputs.adsPercentage}%</span>
                  </div>
                  <Slider
                    value={[inputs.adsPercentage]}
                    onValueChange={([value]) => updateInput('adsPercentage', value)}
                    min={0}
                    max={15}
                    step={0.5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Impostos (%)</Label>
                    <span className="text-sm font-medium">{inputs.taxPercentage}%</span>
                  </div>
                  <Slider
                    value={[inputs.taxPercentage]}
                    onValueChange={([value]) => updateInput('taxPercentage', value)}
                    min={0}
                    max={15}
                    step={0.5}
                  />
                </div>
              </div>
            </div>

            {/* Sale Price */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Preço de Venda</h4>
              
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="1"
                  value={inputs.salePrice}
                  onChange={(e) => updateInput('salePrice', parseFloat(e.target.value) || 0)}
                  className="text-lg font-semibold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Current Scenario */}
          <Card className={cn(
            "border-2",
            currentScenario.netProfit >= 0 ? "border-success/30" : "border-destructive/30"
          )}>
            <CardHeader className={cn(
              "rounded-t-lg",
              currentScenario.netProfit >= 0 ? "bg-success/5" : "bg-destructive/5"
            )}>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {currentScenario.netProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  )}
                  Resultado Atual
                </span>
                <span className={cn(
                  "text-2xl font-bold",
                  currentScenario.netProfit >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(currentScenario.netProfit)}
                </span>
              </CardTitle>
              <CardDescription>
                Margem: {formatPercentage(currentScenario.margin)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço de Venda</span>
                  <span className="font-medium">{formatCurrency(inputs.salePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo do Produto</span>
                  <span className="text-destructive">-{formatCurrency(inputs.productCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Embalagem</span>
                  <span className="text-destructive">-{formatCurrency(inputs.packagingCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete Vendedor</span>
                  <span className="text-destructive">-{formatCurrency(inputs.shippingSeller)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa ML (líquida)</span>
                  <span className="text-destructive">-{formatCurrency(currentScenario.effectiveFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ads</span>
                  <span className="text-destructive">-{formatCurrency(currentScenario.adsCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impostos</span>
                  <span className="text-destructive">-{formatCurrency(currentScenario.taxes)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t font-medium">
                  <span>Lucro Líquido</span>
                  <span className={currentScenario.netProfit >= 0 ? "text-success" : "text-destructive"}>
                    {formatCurrency(currentScenario.netProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Suggestion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Preço Sugerido
              </CardTitle>
              <CardDescription>
                Para atingir {formatPercentage(inputs.targetMargin)} de margem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Margem Alvo (%)</Label>
                    <span className="text-sm font-medium text-primary">{inputs.targetMargin}%</span>
                  </div>
                  <Slider
                    value={[inputs.targetMargin]}
                    onValueChange={([value]) => updateInput('targetMargin', value)}
                    min={5}
                    max={40}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Preço Sugerido</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(suggestedPrice.suggestedPrice)}
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-primary" />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Lucro por Unidade</p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(suggestedPrice.netProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Cenários de Simulação</CardTitle>
              <CardDescription>
                Comparação com variações de custos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {scenarios.map((scenario, index) => (
                  <div 
                    key={scenario.name}
                    className={cn(
                      "p-4 rounded-lg border text-center",
                      index === 0 && "border-destructive/30 bg-destructive/5",
                      index === 1 && "border-primary/30 bg-primary/5",
                      index === 2 && "border-success/30 bg-success/5"
                    )}
                  >
                    <p className="text-sm font-medium mb-2">{scenario.name}</p>
                    <p className={cn(
                      "text-xl font-bold",
                      scenario.netProfit >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {formatCurrency(scenario.netProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Margem: {formatPercentage(scenario.margin)}
                    </p>
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      <p>Ads: {scenario.adsPercentage}%</p>
                      <p>Impostos: {scenario.taxPercentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
