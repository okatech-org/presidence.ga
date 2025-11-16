import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { AlertTriangle, TrendingUp, CheckCircle, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const VueEnsemble = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const { data } = await supabase
        .from('national_kpis')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setKpis(data);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des données...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs Stratégiques - Les 4 Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Signalements Totaux"
          value={kpis?.signalements_totaux?.toString() || "0"}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="up"
          trendValue="+12% ce mois"
        />
        <StatCard
          label="Cas Critiques"
          value={kpis?.cas_critiques?.toString() || "0"}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          trend="down"
          trendValue="-5% ce mois"
        />
        <StatCard
          label="Taux de Résolution"
          value={`${kpis?.taux_resolution || 0}%`}
          icon={<CheckCircle className="h-5 w-5 text-success" />}
          trend="up"
          trendValue="+8% ce mois"
        />
        <StatCard
          label="Fonds Récupérés"
          value={`${(kpis?.fonds_recuperes_fcfa || 0) / 1000000000}B FCFA`}
          icon={<DollarSign className="h-5 w-5 text-success" />}
          trend="up"
          trendValue="+23% ce mois"
        />
      </div>

      {/* Indice National de Transparence */}
      <Card className="shadow-neo-md hover:shadow-neo-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground">Indice National de Transparence</CardTitle>
          <p className="text-sm text-muted-foreground">Objectif 2025 : 85/100</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Score actuel</span>
              <span className="font-bold text-primary text-lg">{kpis?.indice_transparence || 0}/100</span>
            </div>
            <div className="p-2 rounded-xl bg-background shadow-neo-inset">
              <Progress value={kpis?.indice_transparence || 0} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Situation par Région */}
      <Card className="shadow-neo-md hover:shadow-neo-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground">Situation par Région (Heatmap)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {["Estuaire", "Haut-Ogooué", "Moyen-Ogooué", "Ngounié", "Nyanga", "Ogooué-Ivindo", "Ogooué-Lolo", "Ogooué-Maritime", "Woleu-Ntem"].map((region) => (
              <div key={region} className="p-4 rounded-xl bg-card shadow-neo-sm hover:shadow-neo-md transition-all duration-300 cursor-pointer">
                <p className="font-semibold text-sm text-foreground">{region}</p>
                <p className="text-xs text-muted-foreground mb-2">15 signalements</p>
                <div className="p-1 rounded-lg bg-background shadow-neo-inset">
                  <Progress value={Math.random() * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Évolution Mensuelle */}
      <Card className="shadow-neo-md hover:shadow-neo-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-xl bg-background shadow-neo-inset">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            Évolution Mensuelle des Signalements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-around gap-2">
            {[65, 78, 85, 92, 88, 95, 102, 110, 98, 105, 115, 120].map((val, idx) => (
              <div key={idx} className="flex-1 bg-primary rounded-t" style={{ height: `${(val / 120) * 100}%` }}>
                <div className="text-xs text-center text-primary-foreground pt-1">{val}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Jan</span>
            <span>Fév</span>
            <span>Mar</span>
            <span>Avr</span>
            <span>Mai</span>
            <span>Juin</span>
            <span>Juil</span>
            <span>Août</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Déc</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
