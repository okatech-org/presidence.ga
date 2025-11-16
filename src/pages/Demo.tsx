import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Shield, Users, Lock, FileText, Calendar, Mail, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import emblemGabon from "@/assets/emblem_gabon.png";

interface DemoAccount {
  role: string;
  level: string;
  email: string;
  password: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const Demo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const demoAccounts: DemoAccount[] = [
    {
      role: "Président de la République",
      level: "Super-Admin",
      email: "president@presidence.ga",
      password: "President2025!",
      description: "Accès total et illimité à toutes les synthèses, indicateurs et bases de connaissances. Vue 'Le Gabon en un coup d'œil'.",
      icon: <Shield className="h-6 w-6" />,
      color: "from-accent to-accent/80",
    },
    {
      role: "Directeur de Cabinet",
      level: "Opérations",
      email: "directeur.cabinet@presidence.ga",
      password: "Cabinet2025!",
      description: "Gestion de l'action gouvernementale. Accès total axé sur l'exécution. Prépare l'ordre du jour du Conseil des Ministres.",
      icon: <Users className="h-6 w-6" />,
      color: "from-primary to-primary/80",
    },
    {
      role: "Directeur de Cabinet Privé",
      level: "Privé & Confidentiel",
      email: "cabinet.prive@presidence.ga",
      password: "Prive2025!",
      description: "Gestion de l'agenda personnel et des audiences privées du Président. Messagerie cryptée pour affaires réservées.",
      icon: <Lock className="h-6 w-6" />,
      color: "from-secondary to-secondary/80",
    },
    {
      role: "Secrétariat Général",
      level: "Légal & Administratif",
      email: "secretariat.general@presidence.ga",
      password: "SecGen2025!",
      description: "Le Greffe de la République. Gestion du circuit de signature, Journal Officiel, archives des lois et décrets.",
      icon: <FileText className="h-6 w-6" />,
      color: "from-primary/80 to-primary/60",
    },
    {
      role: "DGSS (Renseignement)",
      level: "Renseignement Stratégique",
      email: "dgss@presidence.ga",
      password: "DGSS2025!",
      description: "Tableau de bord des menaces. Analyse des menaces internes/externes. Accès aux bases de données de sécurité.",
      icon: <Shield className="h-6 w-6" />,
      color: "from-destructive to-destructive/80",
    },
    {
      role: "Directeur de Protocole",
      level: "Agenda & Cérémonial",
      email: "protocole@presidence.ga",
      password: "Proto2025!",
      description: "Gestion de l'agenda officiel et des visites d'État. Organisation logistique des cérémonies.",
      icon: <Calendar className="h-6 w-6" />,
      color: "from-secondary/80 to-secondary/60",
    },
    {
      role: "Service Courriers",
      level: "GED - Entrée",
      email: "courriers@presidence.ga",
      password: "Courrier2025!",
      description: "Gestion électronique des documents. Scanner, indexer et dispatcher le courrier entrant vers les services compétents.",
      icon: <Mail className="h-6 w-6" />,
      color: "from-muted to-muted/80",
    },
    {
      role: "Service Réception",
      level: "Accueil & Accréditation",
      email: "reception@presidence.ga",
      password: "Reception2025!",
      description: "Gestion des visiteurs. Enregistrement et accréditation. Gestion des demandes d'audience.",
      icon: <UserCheck className="h-6 w-6" />,
      color: "from-muted to-muted/80",
    },
  ];

  const copyCredentials = (email: string, password: string) => {
    const credentials = `Email: ${email}\nMot de passe: ${password}`;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Identifiants copiés",
      description: "Les identifiants ont été copiés dans votre presse-papiers",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="gradient-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white">
                <img 
                  src={emblemGabon} 
                  alt="Emblème de la République Gabonaise" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">Comptes Démo</h1>
                <p className="text-sm text-primary-foreground/80">
                  Testez l'application avec différents niveaux d'accès
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Introduction */}
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Comptes de Démonstration</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Explorez l'application avec différents rôles et niveaux d'accès. Chaque compte offre 
            une vue et des fonctionnalités spécifiques selon les responsabilités du poste.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning-foreground rounded-lg border border-warning/20">
            <Lock className="h-4 w-4" />
            <p className="text-sm">
              Ces comptes sont uniquement pour la démonstration. Les données sont fictives.
            </p>
          </div>
        </div>

        {/* Demo Accounts Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {demoAccounts.map((account, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-elegant transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${account.color} text-white`}>
                  {account.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{account.role}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{account.level}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {account.description}
              </p>

              <div className="space-y-3 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-mono">{account.email}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Mot de passe</p>
                  <p className="text-sm font-mono">{account.password}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyCredentials(account.email, account.password)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  onClick={() => navigate("/auth")}
                >
                  Se connecter
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-12 p-6 bg-card rounded-lg border shadow-sm">
          <h3 className="text-xl font-bold mb-4">Comment tester ?</h3>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Choisissez un compte de démonstration ci-dessus</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>Copiez les identifiants (email et mot de passe)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>Cliquez sur "Se connecter" pour accéder à la page d'authentification</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>Collez les identifiants et découvrez l'interface selon le rôle choisi</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
};

export default Demo;
