import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Target, 
  Calculator, 
  Settings,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useIntegration } from '@/hooks/useIntegration';
import sxLogo from '@/assets/sx-logo.png';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Pedidos', icon: ShoppingCart },
  { path: '/products', label: 'Produtos & Estoque', icon: Package },
  { path: '/costs', label: 'Custos', icon: DollarSign },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/calculator', label: 'Precificação', icon: Calculator },
  { path: '/integrations', label: 'Integrações', icon: LinkIcon },
  { path: '/settings', label: 'Configurações', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isConnected } = useIntegration();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50 hidden md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={sxLogo} alt="SX" className="h-8 w-auto" />
            <div>
              <h1 className="font-bold text-sidebar-accent-foreground text-lg tracking-tight">Syntacx</h1>
              <p className="text-[10px] text-sidebar-muted uppercase tracking-widest">Ops</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={sxLogo} alt="SX" className="h-7 w-auto mx-auto" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-link",
                isActive && "sidebar-link-active"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Connection Status */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className={cn(
            "rounded-lg border p-3",
            isConnected 
              ? "bg-primary/10 border-primary/30" 
              : "bg-warning/10 border-warning/30"
          )}>
            <p className={cn(
              "text-xs font-medium",
              isConnected ? "text-primary" : "text-warning-foreground"
            )}>
              {isConnected ? 'Mercado Livre Conectado' : 'ML Não Conectado'}
            </p>
            <p className="text-xs text-sidebar-muted mt-0.5">
              {isConnected 
                ? 'Dados sincronizados' 
                : 'Conecte para ver dados reais'}
            </p>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Recolher</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
