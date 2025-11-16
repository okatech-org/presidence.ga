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
    <header className="gradient-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-white">
              <img 
                src={emblemGabon} 
                alt="Emblème de la République Gabonaise" 
                className="h-14 w-14 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Présidence de la République</h1>
              <p className="text-sm text-primary-foreground/80">
                S.E. le Président de la République - Chef de l'État, Chef du Gouvernement
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
};
