import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Activity, LogOut } from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import { usePresidentRole } from "@/hooks/usePresidentRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VueEnsemble } from "@/components/president/VueEnsemble";
import { OpinionPublique } from "@/components/president/OpinionPublique";
import { SituationsCritiques } from "@/components/president/SituationsCritiques";
import { VisionNationale } from "@/components/president/VisionNationale";
import { ModuleXR7 } from "@/components/president/ModuleXR7";
import { useToast } from "@/hooks/use-toast";

const PresidentDashboard = () => {
  const navigate = useNavigate();
  const { isPresident, loading: roleLoading } = usePresidentRole();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!roleLoading && !isPresident && !loading) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits d'accès présidentiel",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  }, [isPresident, roleLoading, loading, navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!isPresident) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header Présidentiel */}
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

      <main className="container mx-auto px-6 py-6">
        {/* Titre du Tableau de Bord Stratégique */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Console de Pilotage Stratégique</h2>
          <p className="text-muted-foreground text-lg">
            Tolérance Zéro, Transparence Totale - Interface de Commandement Présidentielle
          </p>
        </div>

        {/* Les 4 Piliers de l'Interface Présidentielle */}
        <Tabs defaultValue="vue-ensemble" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vue-ensemble">Vue d'Ensemble</TabsTrigger>
            <TabsTrigger value="opinion-publique">Opinion Publique</TabsTrigger>
            <TabsTrigger value="situations-critiques">Situations Critiques</TabsTrigger>
            <TabsTrigger value="vision-nationale">Vision Nationale</TabsTrigger>
          </TabsList>

          <TabsContent value="vue-ensemble" className="space-y-6">
            <VueEnsemble />
          </TabsContent>

          <TabsContent value="opinion-publique" className="space-y-6">
            <OpinionPublique />
          </TabsContent>

          <TabsContent value="situations-critiques" className="space-y-6">
            <SituationsCritiques />
          </TabsContent>

          <TabsContent value="vision-nationale" className="space-y-6">
            <VisionNationale />
          </TabsContent>
        </Tabs>

        {/* Module XR-7 - PROTOCOLE D'ÉTAT (Toujours visible) */}
        <div className="mt-8">
          <ModuleXR7 />
        </div>
      </main>
      </div>
    </DashboardLayout>
  );
};

export default PresidentDashboard;
