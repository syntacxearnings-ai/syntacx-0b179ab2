import { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardFilters as FiltersType } from '@/lib/types';

interface DashboardFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export function DashboardFiltersBar({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePeriodChange = (period: FiltersType['period']) => {
    onFiltersChange({ ...filters, period });
  };

  const handleStatusChange = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status as any)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status as any];
    onFiltersChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category: category === 'all' ? undefined : category });
  };

  const handleSkuChange = (sku: string) => {
    onFiltersChange({ ...filters, sku: sku || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({ period: 'month' });
  };

  const hasActiveFilters = filters.status?.length || filters.category || filters.sku;

  return (
    <div className="filter-bar">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Period Filter */}
        <Select value={filters.period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Hoje</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Expand Filters */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={isExpanded ? 'bg-primary/10' : ''}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {(filters.status?.length || 0) + (filters.category ? 1 : 0) + (filters.sku ? 1 : 0)}
            </Badge>
          )}
        </Button>

        {/* Active Filter Badges */}
        {filters.status?.map(status => (
          <Badge key={status} variant="outline" className="gap-1">
            {status}
            <X 
              className="w-3 h-3 cursor-pointer" 
              onClick={() => handleStatusChange(status)} 
            />
          </Badge>
        ))}

        {filters.category && (
          <Badge variant="outline" className="gap-1">
            {filters.category}
            <X 
              className="w-3 h-3 cursor-pointer" 
              onClick={() => handleCategoryChange('all')} 
            />
          </Badge>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="flex items-center gap-3 pt-3 border-t border-border mt-3 flex-wrap">
          {/* Status Filter */}
          <Select onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="returned">Devolvido</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
              <SelectItem value="Acessórios">Acessórios</SelectItem>
              <SelectItem value="Cabos">Cabos</SelectItem>
            </SelectContent>
          </Select>

          {/* SKU Search */}
          <Input
            placeholder="Buscar por SKU..."
            value={filters.sku || ''}
            onChange={(e) => handleSkuChange(e.target.value)}
            className="w-[180px]"
          />
        </div>
      )}
    </div>
  );
}
