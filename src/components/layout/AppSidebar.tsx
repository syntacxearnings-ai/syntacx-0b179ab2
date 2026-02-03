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
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-accent-foreground text-lg tracking-tight">Syntacx</h1>
              <p className="text-[10px] text-sidebar-muted uppercase tracking-widest">Ops</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center mx-auto">
            <TrendingUp className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
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

      {/* Demo Badge */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-lg bg-sidebar-accent/50 border border-sidebar-border p-3">
            <p className="text-xs text-sidebar-muted">Modo Demo</p>
            <p className="text-xs text-sidebar-foreground mt-0.5">Dados simulados para demonstração</p>
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
