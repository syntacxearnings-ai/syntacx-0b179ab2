import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

export function AppLayout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 ml-64 transition-all duration-300">
        <div className="p-6 max-w-[1800px] mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster />
      <Sonner />
    </div>
  );
}
