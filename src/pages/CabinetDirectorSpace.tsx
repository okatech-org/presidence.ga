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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["ministerial_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministerial_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: instructions = [], isLoading: instructionsLoading } = useQuery({
    queryKey: ["presidential_instructions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presidential_instructions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: coordinations = [], isLoading: coordinationsLoading } = useQuery({
    queryKey: ["interministerial_coordination"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interministerial_coordination")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: conseils = [], isLoading: conseilsLoading } = useQuery({
    queryKey: ["conseil_ministers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conseil_ministers")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (newProject: any) => {
      const { data, error } = await supabase
        .from("ministerial_projects")
        .insert([newProject])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ministerial_projects"] });
      toast({
        title: "Projet créé",
        description: "Le projet a été ajouté avec succès.",
      });
    },
  });

  const createInstructionMutation = useMutation({
    mutationFn: async (newInstruction: any) => {
      const { data, error } = await supabase
        .from("presidential_instructions")
        .insert([newInstruction])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presidential_instructions"] });
      toast({
        title: "Instruction créée",
        description: "L'instruction a été ajoutée avec succès.",
      });
    },
  });

  const [newProject, setNewProject] = useState({
    ministry: "",
    project: "",
    status: "en_cours",
    progress: 0,
    deadline: "",
    priority: "moyenne",
  });

  const [newInstruction, setNewInstruction] = useState({
    instruction: "",
    assigned_to: "",
    status: "pending",
    due_date: "",
    priority: "normal",
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate(newProject);
    setNewProject({
      ministry: "",
      project: "",
      status: "en_cours",
      progress: 0,
      deadline: "",
      priority: "moyenne",
    });
  };

  const handleCreateInstruction = (e: React.FormEvent) => {
    e.preventDefault();
    createInstructionMutation.mutate(newInstruction);
    setNewInstruction({
      instruction: "",
      assigned_to: "",
      status: "pending",
      due_date: "",
      priority: "normal",
    });
  };

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

  const [activeSection, setActiveSection] = useState("instructions");
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    gouvernance: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const navigationItems = [
    { id: "instructions", label: "Instructions", icon: Target },
    { id: "projects", label: "Projets", icon: Building2 },
    { id: "coordination", label: "Coordination", icon: Users },
    { id: "conseil", label: "Conseil des Ministres", icon: Calendar },
  ];

  if (loading) {
    return null;
  }

  const blockedProjects = projects.filter(p => p.status === "bloque").length;
  const inProgressProjects = projects.filter(p => p.status === "en_cours").length;
  const completedProjects = projects.filter(p => p.status === "termine").length;
  const pendingInstructions = instructions.filter(i => i.status === "pending").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex gap-6 max-w-[1600px] mx-auto">
        {/* Sidebar détachée */}
        <aside className="neu-card w-60 flex-shrink-0 p-6 flex flex-col min-h-[calc(100vh-3rem)] overflow-hidden">
          {/* Logo et titre */}
          <div className="flex items-center gap-3 mb-8">
            <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center p-2">
              <img
                src={emblemGabon}
                alt="Emblème de la République Gabonaise"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-sm">CABINET.GA</div>
              <div className="text-xs text-muted-foreground">Directeur Cabinet</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('navigation')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              NAVIGATION
              {expandedSections.navigation ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.navigation && (
              <nav className="space-y-1 ml-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === item.id
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Paramètres et Déconnexion */}
          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive neu-raised hover:shadow-neo-md transition-all"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1">
          <div className="neu-card p-8 min-h-[calc(100vh-3rem)]">
            {/* En-tête */}
            <div className="flex items-start gap-4 mb-10">
              <div className="neu-raised w-20 h-20 rounded-full flex items-center justify-center p-3 shrink-0">
                <img
                  src={emblemGabon}
                  alt="Emblème de la République Gabonaise"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Directeur de Cabinet
                </h1>
                <p className="text-base text-muted-foreground">
                  Coordination & Suivi Gouvernemental
                </p>
              </div>
            </div>

            {/* Statistiques principales */}
            <div className="neu-card p-6 mb-8">
              <div className="grid grid-cols-4 divide-x divide-border">
                <div className="px-6 first:pl-0">
                  <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {inProgressProjects}
                  </div>
                  <div className="text-sm font-medium">Projets en cours</div>
                  <div className="text-xs text-muted-foreground">Suivi actif</div>
                </div>

                <div className="px-6">
                  <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="text-4xl font-bold mb-2 text-destructive">
                    {blockedProjects}
                  </div>
                  <div className="text-sm font-medium">Projets bloqués</div>
                  <div className="text-xs text-muted-foreground">Nécessitent intervention</div>
                </div>

                <div className="px-6">
                  <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {pendingInstructions}
                  </div>
                  <div className="text-sm font-medium">Instructions en attente</div>
                  <div className="text-xs text-muted-foreground">Présidentielles</div>
                </div>

                <div className="px-6 last:pr-0">
                  <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    76%
                  </div>
                  <div className="text-sm font-medium">Taux de réalisation</div>
                  <div className="text-xs text-muted-foreground">Objectifs 2025</div>
                </div>
              </div>
            </div>

            {/* Contenu conditionnel selon la section active */}
            {activeSection === "instructions" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Target className="h-6 w-6" />
                      Instructions Présidentielles
                    </h2>
                    <p className="text-muted-foreground">Suivi et exécution des directives du Président</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="neu-button px-4 py-2 flex items-center gap-2 text-sm font-medium hover:text-primary">
                        <Plus className="h-4 w-4" />
                        Nouvelle Instruction
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouvelle Instruction Présidentielle</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateInstruction} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="instruction">Instruction</Label>
                          <Input
                            id="instruction"
                            value={newInstruction.instruction}
                            onChange={(e) => setNewInstruction({ ...newInstruction, instruction: e.target.value })}
                            required
                            className="neu-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assigned_to">Assigné à</Label>
                          <Input
                            id="assigned_to"
                            value={newInstruction.assigned_to}
                            onChange={(e) => setNewInstruction({ ...newInstruction, assigned_to: e.target.value })}
                            required
                            className="neu-input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="due_date">Échéance</Label>
                            <Input
                              id="due_date"
                              type="date"
                              value={newInstruction.due_date}
                              onChange={(e) => setNewInstruction({ ...newInstruction, due_date: e.target.value })}
                              required
                              className="neu-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Select
                              value={newInstruction.priority}
                              onValueChange={(value) => setNewInstruction({ ...newInstruction, priority: value })}
                            >
                              <SelectTrigger className="neu-input">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normale</SelectItem>
                                <SelectItem value="high">Haute</SelectItem>
                                <SelectItem value="critical">Critique</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="submit" className="w-full">Créer</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {instructions.map((instruction) => (
                    <div key={instruction.id} className="neu-raised p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{instruction.instruction}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Assigné à: {instruction.assigned_to}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Échéance: {new Date(instruction.due_date).toLocaleDateString("fr-FR")}
                          </div>
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "projects" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Building2 className="h-6 w-6" />
                      Projets Gouvernementaux
                    </h2>
                    <p className="text-muted-foreground">Suivi de l'avancement des projets ministériels</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="neu-button px-4 py-2 flex items-center gap-2 text-sm font-medium hover:text-primary">
                        <Plus className="h-4 w-4" />
                        Nouveau Projet
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouveau Projet Ministériel</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateProject} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="project">Projet</Label>
                          <Input
                            id="project"
                            value={newProject.project}
                            onChange={(e) => setNewProject({ ...newProject, project: e.target.value })}
                            required
                            className="neu-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ministry">Ministère</Label>
                          <Input
                            id="ministry"
                            value={newProject.ministry}
                            onChange={(e) => setNewProject({ ...newProject, ministry: e.target.value })}
                            required
                            className="neu-input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="deadline">Échéance</Label>
                            <Input
                              id="deadline"
                              type="date"
                              value={newProject.deadline}
                              onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                              required
                              className="neu-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Select
                              value={newProject.priority}
                              onValueChange={(value) => setNewProject({ ...newProject, priority: value })}
                            >
                              <SelectTrigger className="neu-input">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basse">Basse</SelectItem>
                                <SelectItem value="moyenne">Moyenne</SelectItem>
                                <SelectItem value="haute">Haute</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="submit" className="w-full">Créer</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className="neu-raised p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{project.project}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.ministry}
                          </p>
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
                      <div className="space-y-4">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "coordination" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Coordination Interministérielle
                  </h2>
                  <p className="text-muted-foreground">Facilitation de la collaboration entre ministères</p>
                </div>

                <div className="grid gap-4">
                  {coordinations.map((coordination: any) => (
                    <div key={coordination.id} className="neu-raised p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-1">{coordination.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {coordination.type === 'reunion' ? 'Réunion' : 'Point de blocage'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          {new Date(coordination.date).toLocaleString("fr-FR")}
                        </div>
                        {coordination.description && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            {coordination.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {coordinations.length === 0 && (
                    <div className="neu-inset p-8 text-center text-muted-foreground">
                      Aucune coordination prévue.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "conseil" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    Conseil des Ministres
                  </h2>
                  <p className="text-muted-foreground">Préparation et suivi des décisions du Conseil</p>
                </div>

                <div className="grid gap-4">
                  {conseils.map((conseil: any) => (
                    <div key={conseil.id} className="neu-raised p-6 border-l-4 border-l-primary">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-1">{conseil.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(conseil.date).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Ordre du jour:</h4>
                          <ul className="space-y-2 text-sm">
                            {conseil.agenda && Array.isArray(conseil.agenda) && conseil.agenda.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {conseil.execution_rate !== null && (
                          <div className="neu-inset p-3 rounded-lg flex items-center justify-between">
                            <span className="text-sm">Taux d'exécution</span>
                            <Badge variant="default">{conseil.execution_rate}%</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {conseils.length === 0 && (
                    <div className="neu-inset p-8 text-center text-muted-foreground">
                      Aucun conseil des ministres enregistré.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
};

export default CabinetDirectorSpace;
