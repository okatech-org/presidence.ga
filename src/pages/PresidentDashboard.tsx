import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Activity,
  LogOut,
  Mail,
  Phone,
  FileSignature,
  Bell,
  Scale,
  Calendar,
  Shield,
  Building2,
  Globe,
  Gavel,
  BookOpen,
} from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import QuadrantAlertes from "@/components/president/QuadrantAlertes";
import QuadrantPilotage from "@/components/president/QuadrantPilotage";
import QuadrantSupervision from "@/components/president/QuadrantSupervision";
import QuadrantAgenda from "@/components/president/QuadrantAgenda";
import BarreActionsPresidentielles from "@/components/president/BarreActionsPresidentielles";

const PresidentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Présidentiel */}
      <header className="gradient-primary text-primary-foreground shadow-lg sticky top-0 z-50">
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
          <h2 className="text-3xl font-bold mb-2">Tableau de Bord Stratégique</h2>
          <p className="text-muted-foreground text-lg">
            Le Gabon en un coup d'œil - Temps réel
          </p>
        </div>

        {/* Les 4 Quadrants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quadrant 1 : ALERTES PRIORITAIRES */}
          <QuadrantAlertes />

          {/* Quadrant 2 : PILOTAGE GOUVERNEMENTAL */}
          <QuadrantPilotage />

          {/* Quadrant 3 : SUPERVISION INSTITUTIONNELLE */}
          <QuadrantSupervision />

          {/* Quadrant 4 : AGENDA & OPINION */}
          <QuadrantAgenda />
        </div>

        {/* Barre d'Actions Présidentielles */}
        <BarreActionsPresidentielles />
      </main>
    </div>
  );
};

export default PresidentDashboard;
