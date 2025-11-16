import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Building2, Gavel, AlertCircle } from "lucide-react";

const QuadrantSupervision = () => {
  return (
    <Card className="border-blue-500/50 shadow-lg">
      <CardHeader className="bg-blue-500/10">
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Scale className="h-6 w-6" />
          SUPERVISION INSTITUTIONNELLE
        </CardTitle>
        <p className="text-sm text-muted-foreground">Les Piliers de l'État</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Pouvoir Législatif */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">Pouvoir Législatif (Parlement)</span>
          </div>
          <div className="ml-7 space-y-2">
            <p className="text-sm font-medium mb-3">Pipeline Législatif - Projets du Gouvernement</p>
            <div className="space-y-2">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">Loi de Finances Rectificative 2024</p>
                  <Badge className="bg-green-600">Voté</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Promulgation en attente</p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">Projet Loi Économie Numérique</p>
                  <Badge variant="secondary">En plénière</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Discussion art. 12-24</p>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">Réforme Code Investissements</p>
                  <Badge variant="outline">En commission</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Commission Économie & Finances</p>
              </div>
            </div>

            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Alerte Budgétaire</p>
                  <p className="text-sm mt-1">Proposition loi parlementaire "Subventions Transport" - Impact +15M FCFA non financé</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pouvoir Judiciaire */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-purple-600" />
            <span className="font-semibold">Pouvoir Judiciaire (CSM)</span>
          </div>
          <div className="ml-7 space-y-2">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors">
              <p className="text-sm font-medium">Prochain Conseil Supérieur de la Magistrature</p>
              <p className="text-lg font-bold text-purple-600">Lundi 25 Nov. à 14h00</p>
              <p className="text-xs text-muted-foreground mt-1">Vous présidez • 12 points à l'ordre du jour</p>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Remontée Cour des Comptes</p>
                  <p className="text-sm mt-1">Rapport "Rouge" : Gestion irrégulière Ministère Travaux Publics - Exercice 2023</p>
                  <p className="text-xs text-muted-foreground mt-1">Cliquer pour rapport complet</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cour Constitutionnelle */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold">Cour Constitutionnelle</span>
          </div>
          <div className="ml-7 space-y-2">
            <p className="text-sm font-medium mb-2">Saisines en cours</p>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-950/30 transition-colors">
              <p className="text-sm font-medium">Loi Électorale - Art. 45 contesté</p>
              <p className="text-xs text-muted-foreground mt-1">Requérant : Groupe parlementaire Opposition</p>
              <Badge variant="outline" className="mt-2">En délibéré</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuadrantSupervision;
