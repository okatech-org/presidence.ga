import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const PresidentHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="bg-card shadow-neo-lg mb-6">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-background shadow-neo-inset">
              <img 
                src={emblemGabon} 
                alt="Emblème de la République Gabonaise" 
                className="h-14 w-14 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Présidence de la République</h1>
              <p className="text-sm text-muted-foreground">
                S.E. le Président de la République - Chef de l'État, Chef du Gouvernement
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-card shadow-neo-sm hover:shadow-neo-md transition-all duration-300 text-foreground border-0"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
};
