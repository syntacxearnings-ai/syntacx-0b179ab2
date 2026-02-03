import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/hooks/useIntegration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  LogOut, 
  Settings, 
  Link2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function TopBar() {
  const { user, signOut } = useAuth();
  const { isConnected } = useIntegration();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
      {/* Logo - visible on mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-foreground">Syntacx</span>
      </div>

      {/* Spacer on desktop */}
      <div className="hidden md:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Integration Status */}
        <Link to="/integrations">
          <Badge 
            variant="outline" 
            className={isConnected 
              ? "border-success text-success cursor-pointer hover:bg-success/10" 
              : "border-warning text-warning-foreground cursor-pointer hover:bg-warning/10"
            }
          >
            {isConnected ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">ML Conectado</span>
                <span className="sm:hidden">ML</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Conectar ML</span>
                <span className="sm:hidden">ML</span>
              </>
            )}
          </Badge>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.user_metadata?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/integrations" className="cursor-pointer">
                <Link2 className="mr-2 h-4 w-4" />
                Integrações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
