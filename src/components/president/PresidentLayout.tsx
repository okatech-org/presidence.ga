import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import emblemGabon from "@/assets/emblem_gabon.png";

interface PresidentLayoutProps {
  children: ReactNode;
}

export function PresidentLayout({ children }: PresidentLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Header horizontal unifié */}
        <header className="fixed top-0 left-0 right-0 z-50 h-20 px-6 flex items-center justify-between bg-card shadow-neo-lg">
          <div className="flex items-center gap-6">
            {/* Logo et titre */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-background shadow-neo-sm">
              <div className="p-2.5 rounded-full bg-success/10 shadow-neo-inset">
                <img 
                  src={emblemGabon} 
                  alt="République Gabonaise" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-foreground">Présidence</span>
                <span className="text-xs text-muted-foreground">République Gabonaise</span>
              </div>
            </div>
            
            {/* Titre console */}
            <div className="border-l border-border/30 pl-6">
              <h1 className="text-xl font-bold text-foreground">Présidence de la République</h1>
              <p className="text-sm text-muted-foreground">
                S.E. le Président de la République - Chef de l'État, Chef du Gouvernement
              </p>
            </div>
          </div>
          
          {/* Bouton déconnexion */}
          <Button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/auth";
            }}
            className="bg-background shadow-neo-sm hover:shadow-neo-md transition-all duration-300 text-foreground border-0 px-6"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </header>
        
        <div className="w-full pt-20 px-6 pb-6 flex gap-6">
          {/* Sidebar détachée sans header */}
          <div className="w-[280px] shrink-0">
            <div className="sticky top-24">
              <AppSidebar />
            </div>
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
