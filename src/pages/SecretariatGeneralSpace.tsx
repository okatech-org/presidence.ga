import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  LogOut,
  Scale,
  Archive,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import IAstedInterface from "@/components/iasted/IAstedInterface";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OfficialDecree, LegalReview, AdministrativeArchive } from "@/types/secretariat-general";

const SecretariatGeneralSpace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [iastedOpen, setIastedOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    legal: true,
    archives: false,
  });

  // Access Control
  useEffect(() => {
    setMounted(true);
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      // Check for sec_gen role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["sec_gen", "admin"]);

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

  // Data Fetching
  const { data: decrees = [], isLoading: decreesLoading } = useQuery({
    queryKey: ["official_decrees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("official_decrees")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OfficialDecree[];
    },
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["legal_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LegalReview[];
    },
  });

  // Mutations
  const createDecreeMutation = useMutation({
    mutationFn: async (newDecree: Omit<OfficialDecree, "id" | "created_at">) => {
      const { error } = await supabase.from("official_decrees").insert(newDecree);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official_decrees"] });
      toast({ title: "Succès", description: "Décret créé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le décret", variant: "destructive" });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (newReview: Omit<LegalReview, "id" | "created_at">) => {
      const { error } = await supabase.from("legal_reviews").insert(newReview);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal_reviews"] });
      toast({ title: "Succès", description: "Demande d'avis créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la demande", variant: "destructive" });
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
      draft: { label: "Brouillon", variant: "outline" },
      pending_signature: { label: "En attente signature", variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      signed: { label: "Signé", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      published: { label: "Publié", variant: "default", className: "bg-green-500 hover:bg-green-600" },
      pending: { label: "En attente", variant: "outline" },
      in_review: { label: "En examen", variant: "default", className: "bg-blue-500" },
      completed: { label: "Terminé", variant: "secondary", className: "bg-green-100 text-green-700" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  // Stats
  const stats = {
    decreesPending: decrees.filter(d => d.status === "pending_signature").length,
    reviewsUrgent: reviews.filter(r => r.priority === "high" && r.status !== "completed").length,
    decreesPublished: decrees.filter(d => d.status === "published").length,
  };

  if (decreesLoading || reviewsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 transition-colors duration-300">
      <div className="flex gap-6 max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside className="neu-card w-64 flex-shrink-0 p-6 flex flex-col min-h-[calc(100vh-3rem)] overflow-hidden sticky top-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center p-2">
              <img
                src={emblemGabon}
                alt="Emblème de la République Gabonaise"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-sm">SECRÉTARIAT GÉNÉRAL</div>
              <div className="text-xs text-muted-foreground">Présidence</div>
            </div>
          </div>

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
              </nav>
            )}
          </div>

          {/* Légal */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('legal')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              JURIDIQUE
              {expandedSections.legal ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.legal && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("decrees")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "decrees"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <FileText className="w-4 h-4" />
                  Décrets & Arrêtés
                </button>
                <button
                  onClick={() => setActiveSection("reviews")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "reviews"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Scale className="w-4 h-4" />
                  Veille Juridique
                </button>
              </nav>
            )}
          </div>

          {/* Archives */}
          <div className="mb-4 flex-1">
            <button
              onClick={() => toggleSection('archives')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              ARCHIVES
              {expandedSections.archives ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.archives && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("archives_list")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "archives_list"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Archive className="w-4 h-4" />
                  Archives Admin.
                </button>
              </nav>
            )}
          </div>

          {/* Settings */}
          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm neu-raised hover:shadow-neo-md transition-all mb-1"
            >
              {mounted && theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4" />
                  Mode clair
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  Mode sombre
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive neu-raised hover:shadow-neo-md transition-all"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="neu-card p-8 min-h-[calc(100vh-3rem)]">
            {/* Header */}
            <div className="flex items-start gap-4 mb-10">
              <div className="neu-raised w-20 h-20 rounded-full flex items-center justify-center p-3 shrink-0">
                <img
                  src={emblemGabon}
                  alt="Emblème"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Espace Secrétariat Général
                </h1>
                <p className="text-base text-muted-foreground">
                  Coordination administrative, juridique et gestion des archives
                </p>
              </div>
            </div>

            {/* Dashboard */}
            {activeSection === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* KPIs */}
                <div className="neu-card p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
                    <div className="px-6 first:pl-0">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <FileText className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.decreesPending}</div>
                      <div className="text-sm font-medium">Décrets en attente</div>
                      <div className="text-xs text-muted-foreground">De signature</div>
                    </div>
                    <div className="px-6">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-destructive" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.reviewsUrgent}</div>
                      <div className="text-sm font-medium">Avis Juridiques</div>
                      <div className="text-xs text-muted-foreground">Urgents</div>
                    </div>
                    <div className="px-6">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.decreesPublished}</div>
                      <div className="text-sm font-medium">Textes Publiés</div>
                      <div className="text-xs text-muted-foreground">Journal Officiel</div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Recent Decrees */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Derniers Textes
                      </h3>
                      <Button onClick={() => setActiveSection("decrees")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {decrees.slice(0, 3).map(decree => (
                        <div key={decree.id} className="neu-inset p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-2">{decree.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="font-mono">{decree.reference_number}</span>
                              </div>
                            </div>
                            {getStatusBadge(decree.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Reviews */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Scale className="w-5 h-5 text-primary" />
                        Avis Juridiques Récents
                      </h3>
                      <Button onClick={() => setActiveSection("reviews")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {reviews.slice(0, 3).map(review => (
                        <div key={review.id} className="neu-raised p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{review.document_title}</p>
                              <p className="text-xs text-muted-foreground mt-1">Demandé par: {review.requestor}</p>
                            </div>
                            {getStatusBadge(review.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Decrees Section */}
            {activeSection === "decrees" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Décrets & Arrêtés</h2>
                    <p className="text-muted-foreground">Gestion des textes officiels</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau texte
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enregistrer un nouveau texte</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          createDecreeMutation.mutate({
                            title: formData.get("title") as string,
                            reference_number: formData.get("reference_number") as string,
                            type: formData.get("type") as any,
                            status: "draft",
                          });
                        }}
                        className="space-y-4 py-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="type">Type de texte</Label>
                          <Select name="type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="decree">Décret</SelectItem>
                              <SelectItem value="order">Arrêté</SelectItem>
                              <SelectItem value="decision">Décision</SelectItem>
                              <SelectItem value="circular">Circulaire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reference_number">Numéro de référence</Label>
                          <Input id="reference_number" name="reference_number" placeholder="ex: 001/PR/2025" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">Titre / Objet</Label>
                          <Input id="title" name="title" placeholder="Objet du texte..." required />
                        </div>
                        <Button type="submit" className="w-full">Créer le brouillon</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {decrees.map((decree) => (
                    <div key={decree.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-background/50 uppercase">{decree.type}</Badge>
                            <span className="font-mono text-sm text-muted-foreground">{decree.reference_number}</span>
                          </div>
                          <h3 className="font-semibold text-lg">{decree.title}</h3>
                        </div>
                        {getStatusBadge(decree.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Créé le: {new Date(decree.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {activeSection === "reviews" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Veille Juridique</h2>
                    <p className="text-muted-foreground">Examen de conformité et avis juridiques</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle demande
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouvelle demande d'avis</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          createReviewMutation.mutate({
                            document_title: formData.get("document_title") as string,
                            requestor: formData.get("requestor") as string,
                            priority: formData.get("priority") as any,
                            status: "pending",
                            due_date: formData.get("due_date") as string,
                          });
                        }}
                        className="space-y-4 py-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="document_title">Document à examiner</Label>
                          <Input id="document_title" name="document_title" placeholder="Titre du document..." required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="requestor">Demandeur</Label>
                          <Input id="requestor" name="requestor" placeholder="Service ou Ministère demandeur" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="due_date">Date souhaitée</Label>
                          <Input id="due_date" name="due_date" type="date" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priorité</Label>
                          <Select name="priority" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner la priorité" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">Haute</SelectItem>
                              <SelectItem value="medium">Moyenne</SelectItem>
                              <SelectItem value="low">Basse</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">Soumettre la demande</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className="font-medium text-lg mb-2">{review.document_title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            Demandeur: <span className="text-foreground font-medium">{review.requestor}</span>
                          </div>
                        </div>
                        {getStatusBadge(review.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Pour le: {review.due_date ? new Date(review.due_date).toLocaleDateString('fr-FR') : 'Non défini'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
};

export default SecretariatGeneralSpace;
