import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Briefcase, Calendar, AlertCircle } from "lucide-react";

const QuadrantPilotage = () => {
  return (
    <Card className="border-primary/50 shadow-lg">
      <CardHeader className="bg-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Users className="h-6 w-6" />
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
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm font-medium">Prochain Conseil</p>
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
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors">
              <p className="text-xs text-muted-foreground">Trésorerie de l'État</p>
              <p className="text-xl font-bold text-green-600">842M FCFA</p>
              <p className="text-xs text-muted-foreground mt-1">Temps réel • Min. Finances</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
              <p className="text-xs text-muted-foreground">Inflation</p>
              <p className="text-xl font-bold text-blue-600">2.4%</p>
              <p className="text-xs text-muted-foreground mt-1">Oct. 2024 • Min. Économie</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800 col-span-2 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors">
              <p className="text-xs text-muted-foreground">Réserves de Change</p>
              <p className="text-xl font-bold text-orange-600">184 jours</p>
              <p className="text-xs text-muted-foreground mt-1">Min. Finances</p>
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
