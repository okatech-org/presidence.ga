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
  Target,
  Activity,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Plus,
  Building2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MinisterialProject, PresidentialInstruction, InterministerialCoordination, CouncilPreparation } from "@/types/cabinet-operations";
import { useUserContext } from "@/hooks/useUserContext";
import { generateSystemPrompt } from "@/utils/generateSystemPrompt";
import { AdminSpaceLayout } from '@/components/layout/AdminSpaceLayout';
import { NavItem } from '@/components/layout/MobileBottomNav';
import { DocumentsSection } from '@/components/documents/DocumentsSection';

const CabinetDirectorSpace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [iastedOpen, setIastedOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('ash');
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    operations: true,
    coordination: false,
  });

  // Context utilisateur pour personnalisation
  const userContext = useUserContext({ spaceName: 'CabinetDirectorSpace' });

  // Hook OpenAI WebRTC
  const openaiRTC = useRealtimeVoiceWebRTC((toolName, args) => {
    console.log(`🔧 [CabinetDirectorSpace] Tool call: ${toolName}`, args);
    switch (toolName) {
      case 'control_ui':
        if (args.action === 'toggle_theme') toggleTheme();
        else if (args.action === 'set_theme_dark') setTheme("dark");
        else if (args.action === 'set_theme_light') setTheme("light");
        else if (args.action === 'set_volume') toast({ title: "Volume", description: `Volume ajusté` });
        else if (args.action === 'set_speech_rate') {
          if (args.value) openaiRTC.setSpeechRate(parseFloat(args.value));
          toast({ title: "Vitesse", description: `Vitesse ajustée` });
        }
        break;

      case 'change_voice':
        if (args.voice_id) {
          setSelectedVoice(args.voice_id as any);
          toast({ title: "Voix modifiée", description: `Voix changée pour ${args.voice_id}` });
        }
        break;

      case 'navigate_to_section':
        const sectionId = args.section_id;
        const accordionSections = ['navigation', 'operations', 'coordination'];

        if (accordionSections.includes(sectionId)) {
          toggleSection(sectionId);
          toast({ title: "Navigation", description: `Section ${sectionId} basculée` });
          return { success: true, message: `Section ${sectionId} basculée` };
        } else {
          setActiveSection(sectionId);

          const parentSectionMap: Record<string, string> = {
            'dashboard': 'navigation',
            'documents': 'navigation',
            'projects': 'operations',
            'instructions': 'operations',
            'interministerial': 'coordination',
            'council': 'coordination'
          };

          const parent = parentSectionMap[sectionId];
          if (parent) {
            setExpandedSections(prev => ({ ...prev, [parent]: true }));
          }
          toast({ title: "Navigation", description: `Ouverture de ${sectionId}` });
          return { success: true, message: `Section ${sectionId} ouverte` };
        }

      case 'control_document':
        toast({ title: "Document", description: `Action ${args.action} sur document` });
        break;

      case 'generate_document':
        toast({ title: "Génération", description: `Création de document...` });
        setIastedOpen(true);
        break;

      case 'open_chat':
        setIastedOpen(true);
        break;

      case 'close_chat':
        setIastedOpen(false);
        break;

      case 'stop_conversation':
        openaiRTC.disconnect();
        setIastedOpen(false);
        break;
    }
  });

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'projects', label: 'Projets', icon: Target },
    { id: 'instructions', label: 'Instructions', icon: FileText },
    { id: 'interministerial', label: 'Coordination', icon: Briefcase },
  ];

  // Access Control
  useEffect(() => {
    setMounted(true);
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      // Check for dgr role (Operations Director)
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
      }
    };
    checkAccess();
  }, [navigate, toast]);

  // Écouter les événements de navigation et contrôle UI depuis SuperAdminContext
  useEffect(() => {
    const handleNavigationEvent = (e: CustomEvent) => {
      const { sectionId } = e.detail;
      console.log('📍 [CabinetDirectorSpace] Événement navigation reçu:', sectionId);

      const accordionSections = ['navigation', 'operations', 'coordination'];

      if (accordionSections.includes(sectionId)) {
        toggleSection(sectionId);
      } else {
        setActiveSection(sectionId);
        const parentSectionMap: Record<string, string> = {
          'dashboard': 'navigation',
          'documents': 'navigation',
          'projects': 'operations',
          'instructions': 'operations',
          'interministerial': 'coordination',
          'council': 'coordination'
        };
        const parent = parentSectionMap[sectionId];
        if (parent) {
          setExpandedSections(prev => ({ ...prev, [parent]: true }));
        }
      }
    };

    const handleUIControlEvent = (e: CustomEvent) => {
      const { action } = e.detail;
      console.log('🎨 [CabinetDirectorSpace] Événement UI Control reçu:', action);

      if (action === 'toggle_theme') {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      } else if (action === 'set_theme_dark') {
        setTheme('dark');
      } else if (action === 'set_theme_light') {
        setTheme('light');
      }
    };

    window.addEventListener('iasted-navigate-section', handleNavigationEvent as EventListener);
    window.addEventListener('iasted-control-ui', handleUIControlEvent as EventListener);

    return () => {
      window.removeEventListener('iasted-navigate-section', handleNavigationEvent as EventListener);
      window.removeEventListener('iasted-control-ui', handleUIControlEvent as EventListener);
    };
  }, [theme, setTheme, toast]);

  const projects: any[] = [];
  const projectsLoading = false;
  const instructions: any[] = [];
  const instructionsLoading = false;
  const coordinations: any[] = [];
  const coordinationsLoading = false;
  const councils: any[] = [];
  const councilsLoading = false;

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (newProject: Omit<MinisterialProject, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from('ministerial_projects')
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ministerial_projects"] });
      toast({ title: "Succès", description: "Projet créé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Helper functions for UI
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      en_cours: { label: "En cours", variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
      termine: { label: "Terminé", variant: "secondary", className: "bg-green-100 text-green-700" },
      bloque: { label: "Bloqué", variant: "destructive" },
      pending: { label: "En attente", variant: "outline", className: "text-orange-500 border-orange-200" },
      in_progress: { label: "En cours", variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
      completed: { label: "Terminé", variant: "secondary", className: "bg-green-100 text-green-700" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
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

  // Stats
  const stats = {
    totalProjects: projects.length,
    completedInstructions: instructions.filter(i => i.status === "completed").length,
    pendingInstructions: instructions.filter(i => i.status === "pending").length,
    blockedProjects: projects.filter(p => p.status === "bloque").length,
  };

  if (projectsLoading || instructionsLoading || coordinationsLoading || councilsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const customSidebarNav = (
    <>
      {/* Navigation */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('navigation')}
          className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
        >
          NAVIGATION
          {expandedSections.navigation ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expandedSections.navigation && (
          <nav className="space-y-1 ml-2">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "dashboard"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tableau de Bord
            </button>
            <button
              onClick={() => setActiveSection("documents")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "documents"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <FileText className="w-4 h-4" />
              Documents
            </button>
          </nav>
        )}
      </div>

      {/* Opérations */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('operations')}
          className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
        >
          OPÉRATIONS
          {expandedSections.operations ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expandedSections.operations && (
          <nav className="space-y-1 ml-2">
            <button
              onClick={() => setActiveSection("projects")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "projects"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <Target className="w-4 h-4" />
              Projets Ministériels
            </button>
            <button
              onClick={() => setActiveSection("instructions")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "instructions"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <FileText className="w-4 h-4" />
              Instructions
            </button>
          </nav>
        )}
      </div>

      {/* Coordination */}
      <div className="mb-4 flex-1">
        <button
          onClick={() => toggleSection('coordination')}
          className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
        >
          COORDINATION
          {expandedSections.coordination ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expandedSections.coordination && (
          <nav className="space-y-1 ml-2">
            <button
              onClick={() => setActiveSection("interministerial")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "interministerial"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <Briefcase className="w-4 h-4" />
              Interministériel
            </button>
            <button
              onClick={() => setActiveSection("council")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "council"
                ? "neu-inset text-primary font-semibold"
                : "neu-raised hover:shadow-neo-md"
                } `}
            >
              <Users className="w-4 h-4" />
              Conseil des Ministres
            </button>
          </nav>
        )}
      </div>
    </>
  );

  return (
    <AdminSpaceLayout
      navItems={navItems}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      userContext={userContext}
      pageTitle="CABINET OPÉRATIONS"
      headerTitle="Espace Directeur de Cabinet"
      headerSubtitle="Coordination de l'action gouvernementale et suivi opérationnel"
      customSidebarNav={customSidebarNav}
      onOpenIasted={async () => {
        if (openaiRTC.isConnected) {
          openaiRTC.disconnect();
        } else {
          const systemPrompt = generateSystemPrompt(userContext);
          await openaiRTC.connect(selectedVoice, systemPrompt);
        }
      }}
    >
      {/* Dashboard */}
      {activeSection === "dashboard" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* KPIs */}
          <div className="neu-card p-6 mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
              <div className="px-6 first:pl-0">
                <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-4xl font-bold mb-2">{stats.totalProjects}</div>
                <div className="text-sm font-medium">Projets Ministériels</div>
                <div className="text-xs text-muted-foreground">En cours</div>
              </div>
              <div className="px-6">
                <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-4xl font-bold mb-2">{stats.completedInstructions}</div>
                <div className="text-sm font-medium">Instructions</div>
                <div className="text-xs text-muted-foreground">Complétées</div>
              </div>
              <div className="px-6">
                <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-4xl font-bold mb-2">{stats.pendingInstructions}</div>
                <div className="text-sm font-medium">Instructions</div>
                <div className="text-xs text-muted-foreground">En attente</div>
              </div>
              <div className="px-6 last:pr-0">
                <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="text-4xl font-bold mb-2">{stats.blockedProjects}</div>
                <div className="text-sm font-medium">Points de Blocage</div>
                <div className="text-xs text-muted-foreground">Nécessitent attention</div>
              </div>
            </div>
          </div>

          {/* Quick Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Instructions */}
            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Dernières Instructions
                </h3>
                <Button onClick={() => setActiveSection("instructions")} variant="ghost" size="sm" className="text-xs">
                  Voir tout
                </Button>
              </div>
              <div className="space-y-3">
                {instructions.slice(0, 3).map(instruction => (
                  <div key={instruction.id} className="neu-inset p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-2">{instruction.instruction}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {instruction.assigned_to}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getPriorityIcon(instruction.priority)}
                        {getStatusBadge(instruction.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {instructions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucune instruction
                  </div>
                )}
              </div>
            </div>

            {/* Active Projects */}
            <div className="neu-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Projets Prioritaires
                </h3>
                <Button onClick={() => setActiveSection("projects")} variant="ghost" size="sm" className="text-xs">
                  Voir tout
                </Button>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 3).map(project => (
                  <div key={project.id} className="neu-raised p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{project.ministry}</Badge>
                          {getPriorityIcon(project.priority)}
                        </div>
                        <p className="font-medium text-sm">{project.project_name}</p>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progression</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun projet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Section */}
      {activeSection === "projects" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Projets Ministériels</h2>
              <p className="text-muted-foreground">Suivi de l'exécution des projets gouvernementaux</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="neu-raised hover:shadow-neo-md transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un projet ministériel</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createProjectMutation.mutate({
                      ministry: formData.get("ministry") as string,
                      project_name: formData.get("project_name") as string,
                      status: "en_cours",
                      progress: 0,
                      deadline: formData.get("deadline") as string,
                      priority: formData.get("priority") as any,
                    });
                  }}
                  className="space-y-4 py-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="ministry">Ministère</Label>
                    <Select name="ministry" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un ministère" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Économie">Économie</SelectItem>
                        <SelectItem value="Santé">Santé</SelectItem>
                        <SelectItem value="Éducation">Éducation</SelectItem>
                        <SelectItem value="Travaux Publics">Travaux Publics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_name">Nom du projet</Label>
                    <Input id="project_name" name="project_name" placeholder="Nom du projet..." required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Date limite</Label>
                    <Input id="deadline" name="deadline" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Créer le projet</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {/* Projects List would go here */}
        </div>
      )}

      {/* Instructions Section */}
      {activeSection === "instructions" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Instructions Présidentielles</h2>
              <p className="text-muted-foreground">Suivi des directives et instructions</p>
            </div>
          </div>
          {/* Instructions List would go here */}
        </div>
      )}

      {/* Documents Section */}
      {activeSection === "documents" && (
        <DocumentsSection />
      )}
    </AdminSpaceLayout>
  );
};

export default CabinetDirectorSpace;
