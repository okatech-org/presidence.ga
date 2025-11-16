import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PresidentLayout } from "@/components/president/PresidentLayout";
import { PresidentHeader } from "@/components/president/PresidentHeader";
import { Activity } from "lucide-react";
import { usePresidentRole } from "@/hooks/usePresidentRole";
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
    <PresidentLayout>
      <div className="min-h-screen bg-background">
        {/* Header Présidentiel */}
        <PresidentHeader />

        <main className="container mx-auto px-6 py-8">
          {/* Titre du Tableau de Bord Stratégique */}
          <div className="mb-8 p-6 rounded-2xl bg-card shadow-neo-md">
            <h2 className="text-3xl font-bold mb-2 text-foreground">Console de Pilotage Stratégique</h2>
            <p className="text-muted-foreground text-lg">
              Tolérance Zéro, Transparence Totale - Interface de Commandement Présidentielle
            </p>
          </div>

        {/* Les 4 Piliers de l'Interface Présidentielle */}
        <div id="vue-ensemble" className="scroll-mt-16 mb-8">
          <VueEnsemble />
        </div>

        <div id="opinion-publique" className="scroll-mt-16 mb-8">
          <OpinionPublique />
        </div>

        <div id="situations-critiques" className="scroll-mt-16 mb-8">
          <SituationsCritiques />
        </div>

        <div id="vision-nationale" className="scroll-mt-16 mb-8">
          <VisionNationale />
        </div>

        {/* Module XR-7 - PROTOCOLE D'ÉTAT (Toujours visible) */}
        <div id="module-xr7" className="scroll-mt-16 mb-8">
          <ModuleXR7 />
        </div>
      </main>
      </div>
    </PresidentLayout>
  );
};

export default PresidentDashboard;
