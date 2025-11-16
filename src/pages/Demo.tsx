import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LogIn, Shield, Users, Lock, FileText, Calendar, Mail, UserCheck, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RoleFeedbackModal } from "@/components/RoleFeedbackModal";
import emblemGabon from "@/assets/emblem_gabon.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

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
  const [loadingAccount, setLoadingAccount] = useState<string | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{ role: string; email: string } | null>(null);
  const [adminClicks, setAdminClicks] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [initializingAccounts, setInitializingAccounts] = useState(false);

  const demoAccounts: DemoAccount[] = [
    {
      role: "Président de la République",
      level: "Super-Admin",
      email: "president@presidence.ga",
      password: "President2025!",
      description: "**Accès total et illimité** à l'ensemble de la plateforme.\n\n**Attributions :**\n• Vision complète « Le Gabon en un coup d'œil »\n• Accès à toutes les synthèses stratégiques\n• Consultation de tous les indicateurs nationaux (économie, sécurité, santé, éducation)\n• Accès aux bases de connaissances classifiées\n• Supervision de l'action gouvernementale\n\n**Missions :**\n• Prise de décision stratégique au plus haut niveau\n• Orientation de la politique nationale\n• Arbitrage des conflits interministériels\n• Validation des projets structurants",
      icon: <Shield className="h-6 w-6" />,
      color: "from-accent to-accent/80",
    },
    {
      role: "Directeur de Cabinet",
      level: "Opérations",
      email: "directeur.cabinet@presidence.ga",
      password: "Cabinet2025!",
      description: "**Coordination de l'action gouvernementale** et exécution des directives présidentielles.\n\n**Attributions :**\n• Préparation de l'ordre du jour du Conseil des Ministres\n• Suivi de l'exécution des instructions présidentielles\n• Coordination interministérielle\n• Accès total aux données opérationnelles\n• Gestion des dossiers prioritaires\n\n**Missions :**\n• Interface principale entre la Présidence et le Gouvernement\n• Monitoring des projets gouvernementaux\n• Reporting régulier au Président\n• Résolution des blocages administratifs",
      icon: <Users className="h-6 w-6" />,
      color: "from-primary to-primary/80",
    },
    {
      role: "Directeur de Cabinet Privé",
      level: "Privé & Confidentiel",
      email: "cabinet.prive@presidence.ga",
      password: "Prive2025!",
      description: "**Gestion de l'agenda personnel** et des affaires privées du Président.\n\n**Attributions :**\n• Organisation des audiences privées\n• Gestion de la correspondance personnelle\n• Messagerie cryptée pour affaires réservées\n• Coordination des déplacements privés\n• Interface avec les personnalités nationales et internationales\n\n**Missions :**\n• Protection de la vie privée présidentielle\n• Organisation des rencontres confidentielles\n• Gestion du réseau relationnel du Président\n• Filtrage et priorisation des sollicitations",
      icon: <Lock className="h-6 w-6" />,
      color: "from-secondary to-secondary/80",
    },
    {
      role: "Secrétariat Général",
      level: "Légal & Administratif",
      email: "secretariat.general@presidence.ga",
      password: "SecGen2025!",
      description: "**Le Greffe de la République** - Gardien de la légalité et des archives nationales.\n\n**Attributions :**\n• Gestion du circuit de signature des actes présidentiels\n• Publication au Journal Officiel\n• Conservation des archives présidentielles\n• Validation juridique des textes\n• Gestion du sceau de la République\n\n**Missions :**\n• Authentification des actes officiels\n• Conseil juridique à la Présidence\n• Archivage et traçabilité documentaire\n• Veille juridique et constitutionnelle",
      icon: <FileText className="h-6 w-6" />,
      color: "from-primary/80 to-primary/60",
    },
    {
      role: "DGSS (Renseignement)",
      level: "Renseignement Stratégique",
      email: "dgss@presidence.ga",
      password: "DGSS2025!",
      description: "**Direction Générale des Services Spéciaux** - Veille stratégique et sécuritaire.\n\n**Attributions :**\n• Analyse des menaces internes et externes\n• Accès aux bases de données sécuritaires\n• Monitoring des risques pour la stabilité nationale\n• Coordination avec services de renseignement\n• Évaluations confidentielles\n\n**Missions :**\n• Protection de la sécurité de l'État\n• Détection précoce des menaces\n• Production de notes de synthèse classifiées\n• Conseil stratégique en matière de sécurité nationale",
      icon: <Shield className="h-6 w-6" />,
      color: "from-destructive to-destructive/80",
    },
    {
      role: "Directeur de Protocole",
      level: "Agenda & Cérémonial",
      email: "protocole@presidence.ga",
      password: "Proto2025!",
      description: "**Gestion du protocole d'État** et organisation des événements officiels.\n\n**Attributions :**\n• Gestion de l'agenda officiel du Président\n• Organisation des visites d'État\n• Coordination des cérémonies nationales\n• Gestion logistique des événements présidentiels\n• Relations avec le corps diplomatique\n\n**Missions :**\n• Respect des usages protocolaires\n• Organisation impeccable des cérémonies\n• Coordination avec services de sécurité\n• Valorisation de l'image présidentielle",
      icon: <Calendar className="h-6 w-6" />,
      color: "from-secondary/80 to-secondary/60",
    },
    {
      role: "Service Courriers",
      level: "GED - Entrée",
      email: "courriers@presidence.ga",
      password: "Courrier2025!",
      description: "**Gestion Électronique des Documents** - Porte d'entrée du flux documentaire.\n\n**Attributions :**\n• Réception et numérisation du courrier entrant\n• Indexation et classification documentaire\n• Dispatch vers les services compétents\n• Traçabilité du circuit documentaire\n• Archivage numérique\n\n**Missions :**\n• Assurer le traitement rapide du courrier\n• Garantir la traçabilité totale\n• Optimiser les délais de réponse\n• Maintenir l'organisation documentaire",
      icon: <Mail className="h-6 w-6" />,
      color: "from-muted to-muted/80",
    },
    {
      role: "Service Réception",
      level: "Accueil & Accréditation",
      email: "reception@presidence.ga",
      password: "Reception2025!",
      description: "**Accueil et gestion des visiteurs** au sein de la Présidence.\n\n**Attributions :**\n• Enregistrement des visiteurs\n• Gestion des accréditations\n• Traitement des demandes d'audience\n• Contrôle des accès au palais présidentiel\n• Coordination avec la sécurité\n\n**Missions :**\n• Premier contact avec la Présidence\n• Filtrage et orientation des visiteurs\n• Gestion des plannings de réception\n• Respect des procédures de sécurité",
      icon: <UserCheck className="h-6 w-6" />,
      color: "from-muted to-muted/80",
    },
  ];

  const handleLogin = async (email: string, password: string) => {
    setLoadingAccount(email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: "Identifiants incorrects ou compte non créé. Veuillez contacter l'administrateur.",
          variant: "destructive",
        });
        return;
      }

      if (data.session) {
        toast({
          title: "Connexion réussie",
          description: `Bienvenue !`,
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion.",
        variant: "destructive",
      });
    } finally {
      setLoadingAccount(null);
    }
  };

  const copyCredentials = (email: string, password: string) => {
    const credentials = `Email: ${email}\nMot de passe: ${password}`;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Identifiants copiés",
      description: "Les identifiants ont été copiés dans votre presse-papiers",
    });
  };

  const handleOpenFeedback = (role: string, email: string) => {
    setSelectedAccount({ role, email });
    setFeedbackModalOpen(true);
  };

  const handleInitializeDemoAccounts = async () => {
    setInitializingAccounts(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('initialize-demo-accounts', {
        body: {},
      });

      if (error) {
        throw error;
      }

      const results = data?.results;
      
      toast({
        title: "Comptes démo initialisés",
        description: `Créés: ${results?.created?.length || 0}, Existants: ${results?.existing?.length || 0}, Erreurs: ${results?.errors?.length || 0}`,
      });

      console.log('Initialization results:', data);

    } catch (error) {
      console.error('Error initializing demo accounts:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser les comptes démo",
        variant: "destructive",
      });
    } finally {
      setInitializingAccounts(false);
    }
  };

  const handleAdminClick = () => {
    const newClicks = adminClicks + 1;
    setAdminClicks(newClicks);
    
    if (newClicks === 2) {
      setShowAdminDialog(true);
      setAdminClicks(0);
    }
    
    // Reset clicks after 2 seconds if not reaching 2 clicks
    setTimeout(() => {
      setAdminClicks(0);
    }, 2000);
  };

  const handleAdminCodeChange = (value: string) => {
    setAdminCode(value);
    
    if (value.length === 6) {
      if (value === "011282") {
        toast({
          title: "Accès autorisé",
          description: "Bienvenue Administrateur Système",
        });
        setShowAdminDialog(false);
        setAdminCode("");
        navigate("/admin-dashboard");
      } else {
        toast({
          title: "Code incorrect",
          description: "Le code saisi est invalide",
          variant: "destructive",
        });
        setAdminCode("");
      }
    }
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
          <div className="flex flex-col gap-3 items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning-foreground rounded-lg border border-warning/20">
              <Lock className="h-4 w-4" />
              <p className="text-sm">
                Ces comptes sont uniquement pour la démonstration. Les données sont fictives.
              </p>
            </div>
            <Button
              onClick={handleInitializeDemoAccounts}
              disabled={initializingAccounts}
              variant="outline"
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              {initializingAccounts ? "Initialisation..." : "Initialiser les comptes démo"}
            </Button>
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

              <div className="mb-6 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {account.description}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenFeedback(account.role, account.email)}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Contribuer
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  onClick={() => handleLogin(account.email, account.password)}
                  disabled={loadingAccount === account.email}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {loadingAccount === account.email ? "Connexion..." : "Se connecter"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-12 p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Comment tester ?</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAdminClick}
              className="text-muted-foreground hover:text-foreground"
            >
              <Lock className="h-5 w-5" />
            </Button>
          </div>
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

      {/* Feedback Modal */}
      {selectedAccount && (
        <RoleFeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          roleName={selectedAccount.role}
          userEmail={selectedAccount.email}
        />
      )}

      {/* Admin Access Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Accès Administrateur Système
            </DialogTitle>
            <DialogDescription>
              Entrez le code à 6 chiffres pour accéder à l'administration
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <InputOTP
              maxLength={6}
              value={adminCode}
              onChange={handleAdminCodeChange}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Demo;
