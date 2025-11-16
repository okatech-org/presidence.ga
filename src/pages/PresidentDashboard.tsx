import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PresidentLayout } from "@/components/president/PresidentLayout";
import { Activity } from "lucide-react";
import { usePresidentRole } from "@/hooks/usePresidentRole";
import { VueEnsemble } from "@/components/president/VueEnsemble";
import { OpinionPublique } from "@/components/president/OpinionPublique";
import { SituationsCritiques } from "@/components/president/SituationsCritiques";
import { VisionNationale } from "@/components/president/VisionNationale";
import { ModuleXR7 } from "@/components/president/ModuleXR7";
import { useToast } from "@/hooks/use-toast";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import IAstedInterface from "@/components/iasted/IAstedInterface";

const PresidentDashboard = () => {
  const navigate = useNavigate();
  const { isPresident, loading: roleLoading } = usePresidentRole();
  const [loading, setLoading] = useState(true);
  const [iastedOpen, setIastedOpen] = useState(false);
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
      <div className="space-y-6">
        {/* Titre du Tableau de Bord */}
        <div className="p-6 rounded-2xl bg-card shadow-neo-md border-0">
          <h2 className="text-2xl font-bold mb-1 text-foreground">Console de Pilotage Stratégique</h2>
          <p className="text-muted-foreground">
            Tolérance Zéro, Transparence Totale - Interface de Commandement Présidentielle
          </p>
        </div>

        {/* Les 4 Piliers de l'Interface Présidentielle */}
        <div id="vue-ensemble" className="scroll-mt-6">
          <VueEnsemble />
        </div>

        <div id="opinion-publique" className="scroll-mt-6">
          <OpinionPublique />
        </div>

        <div id="situations-critiques" className="scroll-mt-6">
          <SituationsCritiques />
        </div>

        <div id="vision-nationale" className="scroll-mt-6">
          <VisionNationale />
        </div>

        {/* Module XR-7 - PROTOCOLE D'ÉTAT (Toujours visible) */}
        <div id="module-xr7" className="scroll-mt-6">
          <ModuleXR7 />
        </div>
      </div>
      
      {/* Bouton iAsted flottant */}
      <div
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 200,
        }}
      >
        <IAstedButtonFull
          onSingleClick={async () => {
            // Activer le contexte audio lors du clic
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              if (audioContext.state === 'suspended') {
                await audioContext.resume();
                console.log('[PresidentDashboard] ✅ Contexte audio activé au clic');
              }
            } catch (error) {
              console.error('[PresidentDashboard] Erreur activation audio:', error);
            }
            setIastedOpen(true);
          }}
          onDoubleClick={async () => {
            // Activer le contexte audio lors du double clic
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              if (audioContext.state === 'suspended') {
                await audioContext.resume();
                console.log('[PresidentDashboard] ✅ Contexte audio activé au double clic');
              }
            } catch (error) {
              console.error('[PresidentDashboard] Erreur activation audio:', error);
            }
            setIastedOpen(true);
          }}
          size="lg"
          voiceListening={false}
          voiceSpeaking={false}
          voiceProcessing={false}
          isInterfaceOpen={iastedOpen}
        />
      </div>
      
      {/* Interface iAsted */}
      <IAstedInterface 
        isOpen={iastedOpen} 
        onClose={() => setIastedOpen(false)}
        userRole="president"
      />
    </PresidentLayout>
  );
};

export default PresidentDashboard;
