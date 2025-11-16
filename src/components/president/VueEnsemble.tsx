import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { AlertTriangle, TrendingUp, CheckCircle, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { NationalKPITrend, RegionData } from "@/types/analytics";
import RegionHeatmap from "./RegionHeatmap";

export const VueEnsemble = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [trend, setTrend] = useState<NationalKPITrend[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setError(null);
      // Dernier KPI (vue cartes)
      const { data: lastKpi, error: kpiErr } = await supabase
        .from('national_kpis')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (kpiErr) throw kpiErr;
      setKpis(lastKpi);

      // Tendances 12 derniers mois
      const { data: trendRows, error: trendErr } = await supabase
        .from('national_kpis')
        .select('date, signalements_totaux, taux_resolution')
        .order('date', { ascending: false })
        .limit(12);
      if (trendErr) throw trendErr;
      const parsedTrend: NationalKPITrend[] = (trendRows || [])
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((row: any) => {
          const d = new Date(row.date);
          const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short' });
          return {
            monthLabel,
            signalements_totaux: Number(row.signalements_totaux ?? 0),
            taux_resolution: Number(row.taux_resolution ?? 0),
          };
        });
      setTrend(parsedTrend);

      // Signalements par province (agrégation client simple)
      const { data: sigRows, error: sigErr } = await supabase
        .from('signalements')
        .select('province');
      if (sigErr) throw sigErr;
      const counts = new Map<string, number>();
      const provinces = [
        "Estuaire", "Haut-Ogooué", "Moyen-Ogooué", "Ngounié", "Nyanga",
        "Ogooué-Ivindo", "Ogooué-Lolo", "Ogooué-Maritime", "Woleu-Ntem"
      ];
      provinces.forEach(p => counts.set(p, 0));
      (sigRows || []).forEach((r: any) => {
        const p = r.province || "Estuaire";
        counts.set(p, (counts.get(p) || 0) + 1);
      });
      const max = Math.max(...Array.from(counts.values()));
      const regionData: RegionData[] = provinces.map((p) => {
        const count = counts.get(p) || 0;
        const score = max > 0 ? Math.round((count / max) * 100) : 0;
        return { province: p, count, score };
      });
      setRegions(regionData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Impossible de récupérer les données.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des données...</div>;
  }
  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>;
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

      {/* Situation par Région (Heatmap) */}
      <Card className="shadow-neo-md hover:shadow-neo-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground">Situation par Région (Heatmap)</CardTitle>
        </CardHeader>
        <CardContent>
          <RegionHeatmap data={regions} />
        </CardContent>
      </Card>

      {/* Évolution Mensuelle (Recharts) */}
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'signalements_totaux') {
                      return [`${value} cas`, 'Signalements'];
                    }
                    if (name === 'taux_resolution') {
                      return [`${value}%`, 'Taux de résolution'];
                    }
                    return [value, name];
                  }}
                />
                <Line type="monotone" dataKey="signalements_totaux" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="taux_resolution" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
