import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MinistryCard } from "@/components/MinistryCard";
import { AlertBanner } from "@/components/AlertBanner";
import { StatCard } from "@/components/StatCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Shield,
  Building2,
  Scale,
  Briefcase,
  Globe,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import emblemGabon from "@/assets/emblem_gabon.png";
import { usePresidentRole } from "@/hooks/usePresidentRole";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { isPresident } = usePresidentRole();

  useEffect(() => {
    checkUser();
  }, [isPresident]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    if (isPresident) {
      navigate("/president-space");
      return;
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
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="gradient-primary text-primary-foreground shadow-lg">
          <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-white">
                <img 
                  src={emblemGabon} 
                  alt="Emblème de la République Gabonaise" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Présidence de la République</h1>
                <p className="text-sm text-primary-foreground/80">
                  Tableau de Bord Exécutif
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

      <main className="container mx-auto px-6 py-8">
        {/* Alertes Urgentes */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Alertes Prioritaires
          </h2>
          <div className="space-y-3">
            <AlertBanner
              type="critical"
              title="Sécurité Nationale"
              description="Incident frontalier signalé dans la province de l'Ogooué-Ivindo - Niveau Rouge"
              timestamp="Il y a 15 min"
            />
            <AlertBanner
              type="warning"
              title="Économie & Finances"
              description="Réserves de change en baisse de 3.2% ce trimestre - Nécessite attention"
              timestamp="Il y a 2h"
            />
          </div>
        </section>

        {/* iAsted - Assistant Vocal */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-background to-secondary/20 p-8 rounded-lg shadow-lg">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                iAsted
              </h3>
              <p className="text-muted-foreground">
                Assistant Vocal Intelligent - Votre conseiller présidentiel IA
              </p>
            </div>
            
            <div className="flex justify-center">
              <IAstedButtonFull
                onClick={() => navigate("/iasted")}
                size="lg"
                voiceListening={false}
                voiceSpeaking={false}
                voiceProcessing={false}
                isInterfaceOpen={false}
              />
            </div>
          </div>
        </section>

        {/* KPIs Nationaux */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Vue d'Ensemble Nationale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="PIB National"
              value="18.2B $"
              trend="up"
              trendValue="+2.4%"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label="Taux d'Inflation"
              value="4.8%"
              trend="down"
              trendValue="-0.6%"
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label="Réserves de Change"
              value="2.1B $"
              trend="stable"
              trendValue="0.0%"
              icon={<Briefcase className="h-5 w-5" />}
            />
            <StatCard
              label="Indice Sécuritaire"
              value="87/100"
              trend="up"
              trendValue="+3 pts"
              icon={<Shield className="h-5 w-5" />}
            />
          </div>
        </section>

        {/* Modules Gouvernementaux */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Pilotage Exécutif</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MinistryCard
              title="Défense Nationale"
              icon={<Shield className="h-6 w-6" />}
              urgentAlerts={1}
              kpis={[
                { label: "Niveau d'alerte", value: "ROUGE", status: "error" },
                { label: "Effectifs opérationnels", value: "95%", status: "success" },
                { label: "Incidents (24h)", value: "1", status: "warning" },
              ]}
            />
            
            <MinistryCard
              title="Intérieur & Sécurité"
              icon={<Building2 className="h-6 w-6" />}
              kpis={[
                { label: "Ordre public", value: "Stable", status: "success" },
                { label: "Population carcérale", value: "2,847", status: "warning" },
                { label: "Collectivités locales", value: "48/52", status: "success" },
              ]}
            />

            <MinistryCard
              title="Économie & Finances"
              icon={<Briefcase className="h-6 w-6" />}
              urgentAlerts={1}
              kpis={[
                { label: "Solde budgétaire", value: "-2.8%", status: "warning" },
                { label: "Dette publique", value: "62.4%", status: "warning" },
                { label: "Exécution budget", value: "78%", status: "success" },
              ]}
            />

            <MinistryCard
              title="Justice & Droits Humains"
              icon={<Scale className="h-6 w-6" />}
              kpis={[
                { label: "Congestion tribunaux", value: "68%", status: "warning" },
                { label: "Dossiers sensibles", value: "12", status: "warning" },
                { label: "Affaires DH", value: "3", status: "success" },
              ]}
            />

            <MinistryCard
              title="Affaires Étrangères"
              icon={<Globe className="h-6 w-6" />}
              kpis={[
                { label: "Visites diplomatiques", value: "4 prévues", status: "success" },
                { label: "Relations stratégiques", value: "Excellentes", status: "success" },
                { label: "Traités en cours", value: "7", status: "success" },
              ]}
            />

            <MinistryCard
              title="Réformes & Institutions"
              icon={<Users className="h-6 w-6" />}
              kpis={[
                { label: "Réformes en cours", value: "15", status: "success" },
                { label: "Taux d'avancement", value: "64%", status: "success" },
                { label: "Blocages", value: "2", status: "warning" },
              ]}
            />
          </div>
        </section>

        {/* Pouvoir Législatif */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Autres Pouvoirs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MinistryCard
              title="Assemblée Nationale & Sénat"
              icon={<Building2 className="h-6 w-6" />}
              kpis={[
                { label: "Projets de loi en cours", value: "8", status: "success" },
                { label: "Lois adoptées (mois)", value: "3", status: "success" },
                { label: "Auditions prévues", value: "2", status: "warning" },
              ]}
            />

            <MinistryCard
              title="Cour Constitutionnelle"
              icon={<Scale className="h-6 w-6" />}
              kpis={[
                { label: "Saisines actives", value: "2", status: "warning" },
                { label: "Décisions (trimestre)", value: "5", status: "success" },
                { label: "Contentieux électoral", value: "0", status: "success" },
              ]}
            />

            <MinistryCard
              title="Cour des Comptes"
              icon={<Briefcase className="h-6 w-6" />}
              kpis={[
                { label: "Audits en cours", value: "12", status: "success" },
                { label: "Rapports publiés", value: "4", status: "success" },
                { label: "Anomalies détectées", value: "7", status: "warning" },
              ]}
            />
          </div>
        </section>
      </main>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
