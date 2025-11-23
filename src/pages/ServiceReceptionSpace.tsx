import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ServiceReception from "./ServiceReception";
import ServiceReceptionHistory from "@/components/iasted/ServiceReceptionHistory";
import {
  LogOut,
  UserCheck,
  Users,
  Calendar,
  Clock,
  Search,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Sun,
  Moon,
  Building2,
  UserPlus,
  CreditCard,
  Mail,
  History
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import IAstedInterface from "@/components/iasted/IAstedInterface";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VisitorLog, AccreditationRequest } from "@/types/reception";
import { receptionService } from "@/services/receptionService";

const ServiceReceptionSpace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    visitors: true,
    accreditations: false,
    courrier: true,
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
      // Check for reception role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["reception", "admin"]);

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
  const { data: visitors = [], isLoading: visitorsLoading } = useQuery({
    queryKey: ["visitor_logs"],
    queryFn: receptionService.getVisitors,
  });

  const { data: accreditations = [], isLoading: accreditationsLoading } = useQuery({
    queryKey: ["accreditation_requests"],
    queryFn: receptionService.getAccreditations,
  });

  // Mutations
  const checkInVisitorMutation = useMutation({
    mutationFn: receptionService.checkInVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitor_logs"] });
      toast({ title: "Succès", description: "Visiteur enregistré avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible d'enregistrer le visiteur: " + error.message, variant: "destructive" });
    },
  });

  const checkOutVisitorMutation = useMutation({
    mutationFn: receptionService.checkOutVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitor_logs"] });
      toast({ title: "Succès", description: "Sortie enregistrée" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible d'enregistrer la sortie: " + error.message, variant: "destructive" });
    },
  });

  const createAccreditationMutation = useMutation({
    mutationFn: receptionService.createAccreditation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accreditation_requests"] });
      toast({ title: "Succès", description: "Demande d'accréditation créée" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de créer la demande: " + error.message, variant: "destructive" });
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

  // Stats
  const stats = {
    visitorsOnSite: visitors.filter(v => v.status === "checked_in").length,
    expectedVisitors: visitors.filter(v => v.status === "expected").length,
    pendingAccreditations: accreditations.filter(a => a.status === "pending").length,
  };

  if (visitorsLoading || accreditationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement du service réception...</p>
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
              <div className="font-bold text-sm">Réception</div>
              <div className="text-xs text-muted-foreground">Accueil</div>
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

          {/* Visitors */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('visitors')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              VISITEURS
              {expandedSections.visitors ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.visitors && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("visitors")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "visitors"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Users className="w-4 h-4" />
                  Registre Visiteurs
                </button>
              </nav>
            )}
          </div>

          {/* Accreditations */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('accreditations')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              ACCRÉDITATIONS
              {expandedSections.accreditations ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.accreditations && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("accreditations")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "accreditations"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <CreditCard className="w-4 h-4" />
                  Demandes
                </button>
              </nav>
            )}
          </div>

          {/* Courrier */}
          <div className="mb-4 flex-1">
            <button
              onClick={() => toggleSection('courrier')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              COURRIER
              {expandedSections.courrier ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.courrier && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("mail-ingestion")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "mail-ingestion"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Mail className="w-4 h-4" />
                  Nouveau Pli
                </button>
                <button
                  onClick={() => setActiveSection("mail-history")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "mail-history"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <History className="w-4 h-4" />
                  Historique
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
                <UserCheck className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Service Réception
                </h1>
                <p className="text-base text-muted-foreground">
                  Accueil, Orientation et Accréditation
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
                        <Users className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.visitorsOnSite}</div>
                      <div className="text-sm font-medium">Visiteurs sur Site</div>
                      <div className="text-xs text-muted-foreground">Actuellement présents</div>
                    </div>
                    <div className="px-6">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <Calendar className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.expectedVisitors}</div>
                      <div className="text-sm font-medium">Visiteurs Attendus</div>
                      <div className="text-xs text-muted-foreground">Aujourd'hui</div>
                    </div>
                    <div className="px-6">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <CreditCard className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.pendingAccreditations}</div>
                      <div className="text-sm font-medium">Accréditations</div>
                      <div className="text-xs text-muted-foreground">En attente de validation</div>
                    </div>
                  </div>
                </div>

                {/* Recent Visitors */}
                <div className="neu-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Derniers Mouvements
                    </h3>
                    <Button onClick={() => setActiveSection("visitors")} variant="ghost" size="sm" className="text-xs">
                      Voir tout
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {visitors.slice(0, 5).map(visitor => (
                      <div key={visitor.id} className="neu-inset p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${visitor.status === 'checked_in' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="font-medium text-sm">{visitor.visitor_name}</p>
                            <p className="text-xs text-muted-foreground">{visitor.organization || "Particulier"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">{new Date(visitor.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs text-muted-foreground">{visitor.host_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Visitors Section */}
            {activeSection === "visitors" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Registre des Visiteurs</h2>
                    <p className="text-muted-foreground">Gestion des entrées et sorties</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Enregistrer une entrée
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouveau Visiteur</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          checkInVisitorMutation.mutate({
                            visitor_name: formData.get("visitor_name") as string,
                            organization: formData.get("organization") as string,
                            purpose: formData.get("purpose") as string,
                            host_name: formData.get("host_name") as string,
                            badge_number: formData.get("badge_number") as string,
                            status: "checked_in",
                            check_in_time: new Date().toISOString(),
                          });
                        }}
                        className="space-y-4 py-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="visitor_name">Nom du visiteur</Label>
                          <Input id="visitor_name" name="visitor_name" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="organization">Organisation / Société</Label>
                          <Input id="organization" name="organization" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="host_name">Visite pour</Label>
                            <Input id="host_name" name="host_name" placeholder="Nom de l'hôte" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="badge_number">N° Badge</Label>
                            <Input id="badge_number" name="badge_number" placeholder="Ex: V-123" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="purpose">Motif de la visite</Label>
                          <Input id="purpose" name="purpose" required />
                        </div>
                        <Button type="submit" className="w-full">Valider l'entrée</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="neu-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-6 py-3">Visiteur</th>
                          <th className="px-6 py-3">Organisation</th>
                          <th className="px-6 py-3">Hôte</th>
                          <th className="px-6 py-3">Heure d'arrivée</th>
                          <th className="px-6 py-3">Badge</th>
                          <th className="px-6 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.map((visitor) => (
                          <tr key={visitor.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 font-medium">{visitor.visitor_name}</td>
                            <td className="px-6 py-4">{visitor.organization || "-"}</td>
                            <td className="px-6 py-4">{visitor.host_name}</td>
                            <td className="px-6 py-4">
                              {new Date(visitor.check_in_time).toLocaleString('fr-FR')}
                            </td>
                            <td className="px-6 py-4">{visitor.badge_number || "-"}</td>
                            <td className="px-6 py-4">
                              <Badge variant={visitor.status === 'checked_in' ? 'default' : 'secondary'}>
                                {visitor.status === 'checked_in' ? 'SUR SITE' : visitor.status === 'checked_out' ? 'PARTI' : 'ATTENDU'}
                              </Badge>
                              {visitor.status === 'checked_in' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 h-6 text-xs"
                                  onClick={() => checkOutVisitorMutation.mutate(visitor.id)}
                                >
                                  Sortie
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Accreditations Section */}
            {activeSection === "accreditations" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Demandes d'Accréditation</h2>
                    <p className="text-muted-foreground">Gestion des accès permanents et temporaires</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle Demande
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Demande d'Accréditation</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          createAccreditationMutation.mutate({
                            applicant_name: formData.get("applicant_name") as string,
                            organization: formData.get("organization") as string,
                            type: formData.get("type") as any,
                            status: "pending",
                          });
                        }}
                        className="space-y-4 py-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="applicant_name">Nom du demandeur</Label>
                          <Input id="applicant_name" name="applicant_name" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="organization">Organisation / Média</Label>
                          <Input id="organization" name="organization" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type d'accréditation</Label>
                          <Select name="type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="press">Presse</SelectItem>
                              <SelectItem value="diplomatic">Diplomatique</SelectItem>
                              <SelectItem value="staff">Personnel</SelectItem>
                              <SelectItem value="contractor">Prestataire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">Soumettre la demande</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {accreditations.map((accreditation) => (
                    <div key={accreditation.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="capitalize">{accreditation.type}</Badge>
                        <Badge variant={
                          accreditation.status === 'approved' ? 'default' :
                            accreditation.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {accreditation.status.toUpperCase()}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg mb-1">{accreditation.applicant_name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {accreditation.organization}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
                        <span>Créé le: {new Date(accreditation.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mail Ingestion Section */}
            {activeSection === "mail-ingestion" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Ingestion du Courrier</h2>
                  <p className="text-muted-foreground">Numérisation et enregistrement des plis entrants</p>
                </div>
                <ServiceReception embedded={true} />
              </div>
            )}

            {/* Mail History Section */}
            {activeSection === "mail-history" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Historique du Courrier</h2>
                  <p className="text-muted-foreground">Suivi des plis scannés et statuts</p>
                </div>
                <ServiceReceptionHistory />
              </div>
            )}
          </div>
        </main>

        {/* iAsted Integration */}
        <IAstedInterface userRole="reception" />
      </div>
    </div>
  );
};

export default ServiceReceptionSpace;
