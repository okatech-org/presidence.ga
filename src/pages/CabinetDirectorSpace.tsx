import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  LogOut,
  Building2,
  Target,
  Activity,
  BarChart3,
} from "lucide-react";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import IAstedInterface from "@/components/iasted/IAstedInterface";
import emblemGabon from "@/assets/emblem_gabon.png";

interface MinisterialProject {
  id: string;
  ministry: string;
  project: string;
  status: "en_cours" | "termine" | "bloque";
  progress: number;
  deadline: string;
  priority: "haute" | "moyenne" | "basse";
}

interface PresidentialInstruction {
  id: string;
  instruction: string;
  assignedTo: string;
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  priority: "critical" | "high" | "normal";
}

const CabinetDirectorSpace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [iastedOpen, setIastedOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  // Mock data - à remplacer par des vraies données de la base
  const [projects] = useState<MinisterialProject[]>([
    {
      id: "1",
      ministry: "Ministère de l'Économie",
      project: "Réforme fiscale 2025",
      status: "en_cours",
      progress: 65,
      deadline: "2025-03-30",
      priority: "haute",
    },
    {
      id: "2",
      ministry: "Ministère de la Santé",
      project: "Digitalisation des hôpitaux",
      status: "en_cours",
      progress: 40,
      deadline: "2025-06-15",
      priority: "haute",
    },
    {
      id: "3",
      ministry: "Ministère de l'Éducation",
      project: "Programme de bourses",
      status: "bloque",
      progress: 25,
      deadline: "2025-02-28",
      priority: "moyenne",
    },
    {
      id: "4",
      ministry: "Ministère des Infrastructures",
      project: "Route Libreville-Port-Gentil",
      status: "en_cours",
      progress: 78,
      deadline: "2025-12-31",
      priority: "haute",
    },
  ]);

  const [instructions] = useState<PresidentialInstruction[]>([
    {
      id: "1",
      instruction: "Accélérer la mise en œuvre de la réforme fiscale",
      assignedTo: "Ministère de l'Économie",
      status: "in_progress",
      dueDate: "2025-02-15",
      priority: "critical",
    },
    {
      id: "2",
      instruction: "Débloquer le projet de digitalisation hospitalière",
      assignedTo: "Ministère de la Santé",
      status: "pending",
      dueDate: "2025-02-10",
      priority: "high",
    },
    {
      id: "3",
      instruction: "Préparer l'ordre du jour du prochain Conseil des Ministres",
      assignedTo: "Secrétariat Général",
      status: "in_progress",
      dueDate: "2025-02-05",
      priority: "critical",
    },
  ]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Vérifier le rôle
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (roles && roles.length > 0) {
      const role = roles[0].role;
      setUserRole(role);
      
      // Vérifier que l'utilisateur a bien le rôle dgr
      if (role !== "dgr" && role !== "admin") {
        navigate("/dashboard");
        return;
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      en_cours: { label: "En cours", variant: "default" as const },
      termine: { label: "Terminé", variant: "default" as const },
      bloque: { label: "Bloqué", variant: "destructive" as const },
      pending: { label: "En attente", variant: "secondary" as const },
      in_progress: { label: "En cours", variant: "default" as const },
      completed: { label: "Complété", variant: "default" as const },
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      haute: { label: "Haute", variant: "destructive" as const },
      moyenne: { label: "Moyenne", variant: "default" as const },
      basse: { label: "Basse", variant: "secondary" as const },
      critical: { label: "Critique", variant: "destructive" as const },
      high: { label: "Haute", variant: "destructive" as const },
      normal: { label: "Normal", variant: "default" as const },
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
  };

  if (loading) {
    return null;
  }

  const blockedProjects = projects.filter(p => p.status === "bloque").length;
  const inProgressProjects = projects.filter(p => p.status === "en_cours").length;
  const completedProjects = projects.filter(p => p.status === "termine").length;
  const pendingInstructions = instructions.filter(i => i.status === "pending").length;

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
                  <h1 className="text-2xl font-bold">Directeur de Cabinet</h1>
                  <p className="text-sm text-primary-foreground/80">
                    Coordination & Suivi Gouvernemental
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
          {/* Statistiques Clés */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Projets en cours</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressProjects}</div>
                <p className="text-xs text-muted-foreground">Suivi actif</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Projets bloqués</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{blockedProjects}</div>
                <p className="text-xs text-muted-foreground">Nécessitent intervention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Instructions en attente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingInstructions}</div>
                <p className="text-xs text-muted-foreground">Présidentielles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taux de réalisation</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">76%</div>
                <p className="text-xs text-muted-foreground">Objectifs 2025</p>
              </CardContent>
            </Card>
          </section>

          {/* Contenu Principal avec Tabs */}
          <Tabs defaultValue="instructions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="instructions">
                <Target className="h-4 w-4 mr-2" />
                Instructions
              </TabsTrigger>
              <TabsTrigger value="projects">
                <Building2 className="h-4 w-4 mr-2" />
                Projets
              </TabsTrigger>
              <TabsTrigger value="coordination">
                <Users className="h-4 w-4 mr-2" />
                Coordination
              </TabsTrigger>
              <TabsTrigger value="conseil">
                <Calendar className="h-4 w-4 mr-2" />
                Conseil des Ministres
              </TabsTrigger>
            </TabsList>

            {/* Instructions Présidentielles */}
            <TabsContent value="instructions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Instructions Présidentielles
                  </CardTitle>
                  <CardDescription>
                    Suivi et exécution des directives du Président
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {instructions.map((instruction) => (
                    <Card key={instruction.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{instruction.instruction}</CardTitle>
                            <CardDescription className="mt-1">
                              Assigné à: {instruction.assignedTo}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge variant={getPriorityBadge(instruction.priority).variant}>
                              {getPriorityBadge(instruction.priority).label}
                            </Badge>
                            <Badge variant={getStatusBadge(instruction.status).variant}>
                              {getStatusBadge(instruction.status).label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Échéance: {new Date(instruction.dueDate).toLocaleDateString("fr-FR")}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projets Ministériels */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Projets Gouvernementaux
                  </CardTitle>
                  <CardDescription>
                    Suivi de l'avancement des projets ministériels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{project.project}</CardTitle>
                            <CardDescription className="mt-1">
                              {project.ministry}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge variant={getPriorityBadge(project.priority).variant}>
                              {getPriorityBadge(project.priority).label}
                            </Badge>
                            <Badge variant={getStatusBadge(project.status).variant}>
                              {getStatusBadge(project.status).label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progression</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Échéance: {new Date(project.deadline).toLocaleDateString("fr-FR")}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Coordination Interministérielle */}
            <TabsContent value="coordination" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Coordination Interministérielle
                  </CardTitle>
                  <CardDescription>
                    Facilitation de la collaboration entre ministères
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Réunion de Coordination</CardTitle>
                      <CardDescription>Économie, Finances & Budget</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          Jeudi 20 Novembre 2025, 10h00
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Ordre du jour: Réforme fiscale et budget 2026
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Points de Blocage Identifiés</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium">Conflit interministériel</p>
                          <p className="text-sm text-muted-foreground">
                            Santé vs Budget - Financement des hôpitaux
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium">Retard de validation</p>
                          <p className="text-sm text-muted-foreground">
                            Éducation - Programme de bourses en attente
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conseil des Ministres */}
            <TabsContent value="conseil" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Conseil des Ministres
                  </CardTitle>
                  <CardDescription>
                    Préparation et suivi des décisions du Conseil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-base">Prochain Conseil</CardTitle>
                      <CardDescription>Mercredi 5 Février 2025 à 9h00</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Ordre du jour:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>Validation du budget rectificatif 2025</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>Projet de loi sur la digitalisation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>Nomination aux postes stratégiques</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>Point sur la sécurité nationale</span>
                          </li>
                        </ul>
                      </div>
                      <Button className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Voir le dossier complet
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Décisions du dernier Conseil</CardTitle>
                      <CardDescription>22 Janvier 2025</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Décisions prises</span>
                          <Badge>12 décisions</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Taux d'exécution</span>
                          <Badge variant="default">83%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* iAsted Button */}
        <IAstedButtonFull 
          onSingleClick={() => setIastedOpen(true)}
          onDoubleClick={() => setIastedOpen(true)}
        />
        
        {/* iAsted Interface */}
        <IAstedInterface 
          isOpen={iastedOpen} 
          onClose={() => setIastedOpen(false)} 
        />
      </div>
    </DashboardLayout>
  );
};

export default CabinetDirectorSpace;
