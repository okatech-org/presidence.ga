import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Users, Globe, Bell } from "lucide-react";

const QuadrantAlertes = () => {
  return (
    <Card className="border-destructive/50 shadow-lg">
      <CardHeader className="bg-destructive/10">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-6 w-6" />
          ALERTES PRIORITAIRES
        </CardTitle>
        <p className="text-sm text-muted-foreground">Le "Triangle Rouge"</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Niveau de Menace Nationale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              <span className="font-semibold">Niveau de Menace Nationale</span>
            </div>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              MODÉRÉ
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            Source : Min. Défense & Intérieur
          </p>
        </div>

        {/* Stabilité Sociale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">Stabilité Sociale</span>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              2 incidents
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            Grèves/manifestations en cours • Source : Min. Intérieur
          </p>
        </div>

        {/* Flash DGSS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            <span className="font-semibold">Flash DGSS - Urgence PR</span>
          </div>
          <div className="ml-7 space-y-2">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors">
              <p className="font-medium text-sm">Mouvement suspect zone frontalière Nord</p>
              <p className="text-xs text-muted-foreground">Il y a 15 min • Cliquer pour détails</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors">
              <p className="font-medium text-sm">Indication activité inhabituelle port Owendo</p>
              <p className="text-xs text-muted-foreground">Il y a 1h • Cliquer pour détails</p>
            </div>
          </div>
        </div>

        {/* Diplomatie Chaude */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">Diplomatie Chaude</span>
          </div>
          <div className="ml-7 space-y-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
              <p className="font-medium text-sm">Opportunité accord commercial UE</p>
              <p className="text-xs text-muted-foreground">Il y a 3h • Source : Min. Affaires Étrangères</p>
            </div>
          </div>
        </div>

        {/* Bouton d'Action */}
        <Button variant="destructive" className="w-full mt-4" size="lg">
          <Bell className="h-5 w-5 mr-2" />
          Convoquer la Cellule de Crise
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuadrantAlertes;
