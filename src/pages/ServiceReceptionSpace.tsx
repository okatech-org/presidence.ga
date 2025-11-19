import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, UserCheck } from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useToast } from "@/components/ui/use-toast";

const ServiceReceptionSpace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "reception");

        if (!roles || roles.length === 0) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions nécessaires",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking access:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={emblemGabon} alt="Armoiries du Gabon" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold">Service Réception</h1>
                <p className="text-sm text-muted-foreground">
                  Accueil et gestion des visiteurs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                <UserCheck className="h-3 w-3 mr-1" />
                Service Réception
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Bienvenue dans le Service Réception</h2>
          <p className="text-muted-foreground">Cette page est en cours de développement.</p>
        </div>
      </main>
    </div>
  );
};

export default ServiceReceptionSpace;
