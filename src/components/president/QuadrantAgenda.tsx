import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Newspaper, MessageCircle } from "lucide-react";

const QuadrantAgenda = () => {
  return (
    <Card className="border-green-500/50 shadow-lg">
      <CardHeader className="bg-green-500/10">
        <CardTitle className="flex items-center gap-2 text-green-600">
          <Calendar className="h-6 w-6" />
          AGENDA & OPINION
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Agenda Présidentiel Unifié */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Agenda Présidentiel Unifié</span>
          </div>
          <div className="ml-7 space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Fusion : Agenda Officiel/Protocole • Privé/Cabinet Privé • Gouvernemental
            </p>
            
            {/* Aujourd'hui */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Aujourd'hui - Mercredi 16 Nov.</p>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-600">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Audience Ambassadeur France</p>
                    <p className="text-xs text-muted-foreground">10h30 - 11h30 • Palais Présidentiel</p>
                  </div>
                  <Badge className="bg-blue-600">Officiel</Badge>
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-600">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Réunion restreinte Min. Défense</p>
                    <p className="text-xs text-muted-foreground">14h00 - 15h00 • Cabinet</p>
                  </div>
                  <Badge className="bg-purple-600">Gouvernemental</Badge>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-600">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Dîner Famille</p>
                    <p className="text-xs text-muted-foreground">19h30 • Résidence privée</p>
                  </div>
                  <Badge className="bg-green-600">Privé</Badge>
                </div>
              </div>
            </div>

            {/* Demain */}
            <div className="space-y-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Demain - Jeudi 17 Nov.</p>
              
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border-l-4 border-red-600">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Conseil National de Sécurité</p>
                    <p className="text-xs text-muted-foreground">08h00 - 10h00 • Palais Présidentiel</p>
                  </div>
                  <Badge variant="destructive">Prioritaire</Badge>
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-600">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Entretien Président Sénat</p>
                    <p className="text-xs text-muted-foreground">11h00 - 12h00 • Cabinet</p>
                  </div>
                  <Badge className="bg-purple-600">Gouvernemental</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Le Pouls du Pays */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="font-semibold">Le Pouls du Pays</span>
          </div>
          <div className="ml-7 space-y-3">
            {/* Revue de Presse */}
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors">
              <div className="flex items-start gap-2">
                <Newspaper className="h-4 w-4 text-orange-600 mt-1" />
                <div>
                  <p className="text-sm font-medium">Revue de Presse Nationale</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    7 quotidiens • 3 hebdomadaires • Synthèse disponible
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">+85% positif</Badge>
                    <Badge variant="outline" className="text-xs">Économie en Une</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Réseaux Sociaux */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
              <div className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm font-medium">Tendances Réseaux Sociaux</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analyse Twitter, Facebook, Instagram • Dernières 24h
                  </p>
                  <div className="space-y-1 mt-2">
                    <p className="text-xs">
                      <span className="font-semibold">#1 Tendance:</span> #TransgabonaisePh2 (14.2K mentions)
                    </p>
                    <p className="text-xs">
                      <span className="font-semibold">#2 Tendance:</span> #SommetAfriqueDuSud (8.7K mentions)
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-green-600 text-xs">Sentiment +78%</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuadrantAgenda;
