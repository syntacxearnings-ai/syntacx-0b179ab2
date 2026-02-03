import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { TopBar } from './TopBar';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - desktop only */}
      {!isMobile && <AppSidebar />}
      
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        {/* Top bar */}
        <TopBar />
        
        {/* Main content */}
        <main className="flex-1 pb-20 md:pb-6">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && <MobileNav />}
      
      <Toaster />
      <Sonner />
    </div>
  );
}
