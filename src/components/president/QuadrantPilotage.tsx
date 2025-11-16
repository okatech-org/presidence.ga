import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Briefcase, Calendar, AlertCircle } from "lucide-react";

const QuadrantPilotage = () => {
  return (
    <Card className="shadow-neo-md hover:shadow-neo-lg transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="p-3 rounded-xl bg-background shadow-neo-inset">
            <Users className="h-6 w-6 text-primary" />
          </div>
          PILOTAGE GOUVERNEMENTAL
        </CardTitle>
        <p className="text-sm text-muted-foreground">L'Exécutif</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Conseil des Ministres */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-semibold">Conseil des Ministres</span>
          </div>
            <div className="ml-7 space-y-3">
            <div className="p-4 rounded-xl bg-card shadow-neo-sm">
              <p className="text-sm font-medium text-muted-foreground">Prochain Conseil</p>
              <p className="text-lg font-bold text-primary">Mercredi 20 Nov. à 10h00</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Taux d'exécution des Instructions PR</span>
                <span className="text-lg font-bold text-primary">73%</span>
              </div>
              <Progress value={73} className="h-2" />
            </div>
            
            {/* Instructions en retard */}
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  Instructions les plus en retard
                </span>
              </div>
              <div className="ml-6 space-y-1">
                <p className="text-sm">• Rapport Digitalisation - Min. Économie Numérique (12j)</p>
                <p className="text-sm">• Plan Santé Rurale - Min. Santé (8j)</p>
                <p className="text-sm">• Audit Douanes - Min. Finances (5j)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Économique & Financière */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Performance Économique & Financière</span>
          </div>
          <div className="ml-7 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-card shadow-neo-sm hover:shadow-neo-md cursor-pointer transition-all duration-300">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Trésorerie de l'État</p>
              <p className="text-xl font-bold text-success mt-1">842M FCFA</p>
              <p className="text-xs text-muted-foreground mt-2">Temps réel • Min. Finances</p>
            </div>
            <div className="p-4 rounded-xl bg-card shadow-neo-sm hover:shadow-neo-md cursor-pointer transition-all duration-300">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Inflation</p>
              <p className="text-xl font-bold text-primary mt-1">2.4%</p>
              <p className="text-xs text-muted-foreground mt-2">Oct. 2024 • Min. Économie</p>
            </div>
            <div className="p-4 rounded-xl bg-card shadow-neo-sm hover:shadow-neo-md col-span-2 cursor-pointer transition-all duration-300">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Réserves de Change</p>
              <p className="text-xl font-bold text-warning mt-1">184 jours</p>
              <p className="text-xs text-muted-foreground mt-2">Min. Finances</p>
            </div>
          </div>
        </div>

        {/* Projets Stratégiques */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            <span className="font-semibold">Projets Stratégiques (Grands Travaux)</span>
          </div>
          <div className="ml-7 space-y-3">
            {[
              { name: "Transgabonaise Phase 2", progress: 68, status: "En cours" },
              { name: "Port en Eau Profonde Owendo", progress: 45, status: "En cours" },
              { name: "Aéroport International Libreville", progress: 92, status: "Finalisation" },
              { name: "Réseau Fibre Optique National", progress: 23, status: "Démarrage" },
              { name: "Centrale Électrique Kinguélé", progress: 0, status: "ARRÊT 3j", alert: true },
            ].map((projet) => (
              <div key={projet.name} className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${
                projet.alert 
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                  : 'bg-muted/30 border-border'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{projet.name}</span>
                  <Badge variant={projet.alert ? "destructive" : "secondary"}>
                    {projet.status}
                  </Badge>
                </div>
                <Progress value={projet.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{projet.progress}% complété</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuadrantPilotage;
