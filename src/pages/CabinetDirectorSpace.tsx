import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  Plus,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
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

  const { toast } = useToast();

  // Mock data for demonstration
  const [projects] = useState<MinisterialProject[]>([
    {
      id: "1",
      ministry: "Économie",
      project: "Réforme fiscale 2025",
      status: "en_cours",
      progress: 65,
      deadline: "2025-06-30",
      priority: "haute",
    },
    {
      id: "2",
      ministry: "Santé",
      project: "Extension hôpitaux régionaux",
      status: "en_cours",
      progress: 40,
      deadline: "2025-12-31",
      priority: "haute",
    },
    {
      id: "3",
      ministry: "Éducation",
      project: "Digitalisation des écoles",
      status: "bloque",
      progress: 20,
      deadline: "2025-09-15",
      priority: "moyenne",
    },
  ]);

  const [instructions] = useState<PresidentialInstruction[]>([
    {
      id: "1",
      instruction: "Accélérer la mise en œuvre du projet d'infrastructure routière",
      assignedTo: "Ministre des Travaux Publics",
      status: "in_progress",
      dueDate: "2025-03-31",
      priority: "critical",
    },
    {
      id: "2",
      instruction: "Préparer le rapport trimestriel sur la sécurité alimentaire",
      assignedTo: "Ministre de l'Agriculture",
      status: "pending",
      dueDate: "2025-02-28",
      priority: "high",
    },
    {
      id: "3",
      instruction: "Organiser la table ronde sur le développement durable",
      assignedTo: "Ministre de l'Environnement",
      status: "completed",
      dueDate: "2025-01-15",
      priority: "normal",
    },
  ]);

  const projectsLoading = false;
  const instructionsLoading = false;

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["dgr", "admin"]);

        if (!roles || roles.length === 0) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions nécessaires",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        setUserRole(roles[0].role);
      } catch (error) {
        console.error("Error checking access:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      en_cours: { label: "En cours", variant: "default" },
      termine: { label: "Terminé", variant: "secondary" },
      bloque: { label: "Bloqué", variant: "destructive" },
      pending: { label: "En attente", variant: "outline" },
      in_progress: { label: "En cours", variant: "default" },
      completed: { label: "Terminé", variant: "secondary" },
    };
    
    const config = variants[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "haute":
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "high":
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const totalProjects = projects.length;
  const completedInstructions = instructions.filter(i => i.status === "completed").length;
  const pendingInstructions = instructions.filter(i => i.status === "pending").length;
  const blockedProjects = projects.filter(p => p.status === "bloque").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={emblemGabon} alt="Armoiries du Gabon" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold">Espace Directeur de Cabinet</h1>
                <p className="text-sm text-muted-foreground">
                  Coordination de l'action gouvernementale
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {userRole === "admin" ? "Administrateur" : "Directeur de Cabinet"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">{totalProjects}</span>
            </div>
            <p className="text-sm text-muted-foreground">Projets ministériels</p>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold">{completedInstructions}</span>
            </div>
            <p className="text-sm text-muted-foreground">Instructions complétées</p>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <span className="text-3xl font-bold">{pendingInstructions}</span>
            </div>
            <p className="text-sm text-muted-foreground">Instructions en attente</p>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <span className="text-3xl font-bold">{blockedProjects}</span>
            </div>
            <p className="text-sm text-muted-foreground">Projets bloqués</p>
          </div>
        </div>

        {/* Presidential Instructions */}
        <section className="bg-card rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Instructions présidentielles</h2>
                <p className="text-sm text-muted-foreground">Suivi des directives du Président</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle instruction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une instruction présidentielle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="instruction">Instruction</Label>
                    <Input id="instruction" placeholder="Détails de l'instruction..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assigné à</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un ministère" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Ministre de l'Économie</SelectItem>
                        <SelectItem value="health">Ministre de la Santé</SelectItem>
                        <SelectItem value="education">Ministre de l'Éducation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Date limite</Label>
                    <Input id="dueDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critique</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Créer l'instruction</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {instructionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : (
            <div className="space-y-4">
              {instructions.map((instruction) => (
                <div key={instruction.id} className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{instruction.instruction}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {instruction.assignedTo}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(instruction.priority)}
                      {getStatusBadge(instruction.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(instruction.dueDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Ministerial Projects */}
        <section className="bg-card rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Projets ministériels</h2>
                <p className="text-sm text-muted-foreground">Vue d'ensemble des projets gouvernementaux</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un projet ministériel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ministry">Ministère</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un ministère" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Économie</SelectItem>
                        <SelectItem value="health">Santé</SelectItem>
                        <SelectItem value="education">Éducation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">Nom du projet</Label>
                    <Input id="project" placeholder="Nom du projet..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Date limite</Label>
                    <Input id="deadline" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="haute">Haute</SelectItem>
                        <SelectItem value="moyenne">Moyenne</SelectItem>
                        <SelectItem value="basse">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Créer le projet</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {projectsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{project.ministry}</Badge>
                        {getPriorityIcon(project.priority)}
                      </div>
                      <p className="font-medium">{project.project}</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Échéance: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Coordination Section */}
        <section className="bg-card rounded-lg p-6 border">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Coordination interministérielle</h2>
              <p className="text-sm text-muted-foreground">Suivi des dossiers transversaux</p>
            </div>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune coordination en cours</p>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Initier une coordination
            </Button>
          </div>
        </section>

        {/* Council of Ministers */}
        <section className="bg-card rounded-lg p-6 border">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Préparation Conseil des Ministres</h2>
              <p className="text-sm text-muted-foreground">Organisation et suivi</p>
            </div>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucun conseil programmé</p>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Programmer un conseil
            </Button>
          </div>
        </section>
      </main>

      {/* iAsted Integration */}
      <IAstedButtonFull
        onSingleClick={() => setIastedOpen(true)}
        onDoubleClick={() => setIastedOpen(true)}
      />

      {iastedOpen && (
        <IAstedInterface
          isOpen={iastedOpen}
          onClose={() => setIastedOpen(false)}
        />
      )}
    </div>
  );
};

export default CabinetDirectorSpace;
