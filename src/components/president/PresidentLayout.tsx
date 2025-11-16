import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface PresidentLayoutProps {
  children: ReactNode;
}

export function PresidentLayout({ children }: PresidentLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background p-6 gap-6">
        {/* Sidebar détachée avec effet neomorphique */}
        <div className="w-[280px] shrink-0">
          <div className="sticky top-6">
            <AppSidebar />
          </div>
        </div>
        
        {/* Contenu principal */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
