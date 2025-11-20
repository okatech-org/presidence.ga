import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock, LogOut, Shield, Mail, Calendar, Users, MapPin, MessageSquare,
  ChevronDown, ChevronRight, LayoutDashboard, UserCheck, Plane, Settings,
  Moon, Sun, Plus, Search, Filter, Clock, AlertCircle, CheckCircle2,
  FileText, Phone, Globe
} from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import IAstedInterface from "@/components/iasted/IAstedInterface";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  PrivateAudience,
  EncryptedMessage,
  PersonalCorrespondence,
  VIPContact,
  PrivateTrip,
  ConfidentialityLevel,
  AudienceStatus,
  MessagePriority,
  SecurityLevel,
  CorrespondencePriority,
  CorrespondenceStatus,
  TripStatus
} from "@/types/private-cabinet-types";
import { PrivateAudienceCard } from "@/components/cabinet/PrivateAudienceCard";
import { EncryptedMessageItem } from "@/components/cabinet/EncryptedMessageItem";

const PrivateCabinetDirectorSpace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [iastedOpen, setIastedOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    private: true,
    contacts: false,
  });

  // State for data
  const [audiences, setAudiences] = useState<PrivateAudience[]>([]);
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [correspondence, setCorrespondence] = useState<PersonalCorrespondence[]>([]);
  const [vipContacts, setVipContacts] = useState<VIPContact[]>([]);
  const [trips, setTrips] = useState<PrivateTrip[]>([]);

  // Mock data initialization (fallback if DB is empty)
  useEffect(() => {
    const initMockData = () => {
      setAudiences([
        {
          id: "1",
          person_name: "Ali Bongo Ondimba",
          person_title: "Ancien Président",
          subject: "Consultation privée",
          date: "2025-12-01T14:00:00",
          location: "Résidence présidentielle",
          confidentiality_level: "tres_confidentiel",
          status: "scheduled",
          created_at: "2025-11-15T10:00:00Z"
        },
        {
          id: "2",
          person_name: "Emmanuel Macron",
          person_title: "Président de la République Française",
          subject: "Entretien bilatéral informel",
          date: "2025-12-05T16:30:00",
          location: "Salon privé",
          confidentiality_level: "secret",
          status: "scheduled",
          created_at: "2025-11-18T14:30:00Z"
        },
      ]);

      setMessages([
        {
          id: "1",
          sender_name: "Secrétariat Élysée",
          sender_role: "Conseiller diplomatique",
          subject: "Coordination visite d'État",
          content: "Concernant les modalités de la prochaine visite, nous souhaiterions aborder les points suivants en toute confidentialité...",
          created_at: "2025-11-19T15:30:00Z",
          is_read: false,
          priority: "high",
          security_level: "maximum"
        },
        {
          id: "2",
          sender_name: "Cabinet Présidence UA",
          subject: "Invitation sommet africain",
          content: "Le Président de la Commission vous invite personnellement au prochain sommet...",
          created_at: "2025-11-18T09:00:00Z",
          is_read: true,
          priority: "normal",
          security_level: "enhanced"
        },
      ]);

      setCorrespondence([
        {
          id: "1",
          sender_name: "Chambre de Commerce France-Gabon",
          type: "invitation",
          subject: "Dîner de gala annuel",
          received_date: "2025-11-17T10:00:00Z",
          priority: "moyenne",
          status: "en_traitement",
          deadline: "2025-11-25",
          created_at: "2025-11-17T10:00:00Z"
        },
        {
          id: "2",
          sender_name: "Fondation Pierre Savorgnan de Brazza",
          type: "lettre",
          subject: "Parrainage événement culturel",
          received_date: "2025-11-16T14:20:00Z",
          priority: "haute",
          status: "recu",
          deadline: "2025-11-30",
          created_at: "2025-11-16T14:20:00Z"
        },
      ]);

      setVipContacts([
        {
          id: "1",
          name: "Emmanuel Macron",
          title: "Président de la République",
          organization: "République Française",
          country: "France",
          category: "chef_etat",
          email: "contact@elysee.fr",
          phone: "+33 1 42 92 81 00",
          is_favorite: true,
          created_at: "2025-01-01T00:00:00Z"
        },
        {
          id: "2",
          name: "Moussa Faki Mahamat",
          title: "Président de la Commission",
          organization: "Union Africaine",
          country: "Tchad",
          category: "diplomate",
          is_favorite: false,
          created_at: "2025-01-01T00:00:00Z"
        },
      ]);

      setTrips([
        {
          id: "1",
          destination: "Paris",
          start_date: "2025-12-10T00:00:00Z",
          end_date: "2025-12-12T00:00:00Z",
          type: "prive",
          purpose: "Visite médicale et rencontres informelles",
          status: "confirmed",
          participants: ["Épouse", "Médecin personnel"],
          created_at: "2025-11-01T00:00:00Z"
        },
      ]);
    };

    initMockData();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          .eq("role", "cabinet_private");

        if (!roles || roles.length === 0) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions nécessaires",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        // Here we would fetch real data from Supabase
        // fetchRealData();

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getPriorityBadge = (priority: CorrespondencePriority) => {
    const variants = {
      basse: { label: "Basse", variant: "outline" as const, className: "text-gray-500" },
      moyenne: { label: "Moyenne", variant: "secondary" as const, className: "text-blue-600 bg-blue-100" },
      haute: { label: "Haute", variant: "destructive" as const, className: "bg-red-100 text-red-700 hover:bg-red-200" }
    };
    const config = variants[priority];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: CorrespondenceStatus) => {
    const variants = {
      recu: { label: "Reçu", variant: "outline" as const },
      en_traitement: { label: "En traitement", variant: "default" as const, className: "bg-blue-500" },
      traite: { label: "Traité", variant: "secondary" as const, className: "bg-green-100 text-green-700" },
      archive: { label: "Archivé", variant: "outline" as const, className: "text-gray-400" }
    };
    const config = variants[status];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
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

  const stats = {
    audiencesThisMonth: audiences.length,
    unreadMessages: messages.filter(m => !m.is_read).length,
    pendingCorrespondence: correspondence.filter(c => c.status === "recu" || c.status === "en_traitement").length,
    upcomingTrips: trips.filter(t => t.status === "confirmed").length
  };

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
              <div className="font-bold text-sm">CABINET PRIVÉ</div>
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

          {/* Affaires Privées */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('private')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              AFFAIRES PRIVÉES
              {expandedSections.private ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.private && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("audiences")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "audiences"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <UserCheck className="w-4 h-4" />
                  Audiences Privées
                </button>
                <button
                  onClick={() => setActiveSection("messages")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "messages"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <MessageSquare className="w-4 h-4" />
                  Messagerie Cryptée
                </button>
                <button
                  onClick={() => setActiveSection("correspondence")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "correspondence"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Mail className="w-4 h-4" />
                  Correspondance
                </button>
                <button
                  onClick={() => setActiveSection("trips")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "trips"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Plane className="w-4 h-4" />
                  Déplacements Privés
                </button>
              </nav>
            )}
          </div>

          {/* Contacts */}
          <div className="mb-4 flex-1">
            <button
              onClick={() => toggleSection('contacts')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              CONTACTS VIP
              {expandedSections.contacts ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.contacts && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("vip-contacts")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "vip-contacts"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Users className="w-4 h-4" />
                  Carnet d'Adresses
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
                  Espace Cabinet Privé
                </h1>
                <p className="text-base text-muted-foreground">
                  Gestion des Affaires Privées et Confidentielles - Présidence de la République
                </p>
              </div>
            </div>

            {/* Dashboard */}
            {activeSection === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* KPIs */}
                <div className="neu-card p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
                    <div className="px-6 first:pl-0">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <UserCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.audiencesThisMonth}</div>
                      <div className="text-sm font-medium">Audiences ce Mois</div>
                      <div className="text-xs text-muted-foreground">Programmées</div>
                    </div>
                    <div className="px-6">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.unreadMessages}</div>
                      <div className="text-sm font-medium">Messages Non Lus</div>
                      <div className="text-xs text-muted-foreground">Cryptés E2E</div>
                    </div>
                    <div className="px-6">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <Mail className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.pendingCorrespondence}</div>
                      <div className="text-sm font-medium">Correspondances</div>
                      <div className="text-xs text-muted-foreground">En attente</div>
                    </div>
                    <div className="px-6 last:pr-0">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <Plane className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.upcomingTrips}</div>
                      <div className="text-sm font-medium">Déplacements Prévus</div>
                      <div className="text-xs text-muted-foreground">Confirmés</div>
                    </div>
                  </div>
                </div>

                {/* Quick Sections */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Upcoming Audiences */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary" />
                        Prochaines Audiences
                      </h3>
                      <Button onClick={() => setActiveSection("audiences")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {audiences.slice(0, 3).map(audience => (
                        <PrivateAudienceCard key={audience.id} audience={audience} />
                      ))}
                      {audiences.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Aucune audience programmée
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unread Messages */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        Messages Cryptés
                      </h3>
                      <Button onClick={() => setActiveSection("messages")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {messages.slice(0, 3).map(message => (
                        <EncryptedMessageItem key={message.id} message={message} />
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Aucun message
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Correspondence */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Mail className="w-5 h-5 text-orange-500" />
                        Correspondances
                      </h3>
                      <Button onClick={() => setActiveSection("correspondence")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {correspondence.slice(0, 3).map(item => (
                        <div key={item.id} className="neu-inset p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.subject}</p>
                              <p className="text-xs text-muted-foreground">{item.sender_name}</p>
                            </div>
                            {getPriorityBadge(item.priority)}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {item.deadline ? new Date(item.deadline).toLocaleDateString('fr-FR') : 'Aucune échéance'}
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Trips */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Plane className="w-5 h-5 text-green-500" />
                        Déplacements
                      </h3>
                      <Button onClick={() => setActiveSection("trips")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {trips.map(trip => (
                        <div key={trip.id} className="neu-raised p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <p className="font-medium">{trip.destination}</p>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{trip.purpose}</p>
                            </div>
                            <Badge variant="outline" className="capitalize">{trip.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(trip.start_date).toLocaleDateString('fr-FR')} - {new Date(trip.end_date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audiences Section */}
            {activeSection === "audiences" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Audiences Privées</h2>
                    <p className="text-muted-foreground">Gestion des rendez-vous confidentiels</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle audience
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Programmer une audience privée</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Personne</Label>
                          <Input placeholder="Nom de la personne" />
                        </div>
                        <div className="space-y-2">
                          <Label>Fonction</Label>
                          <Input placeholder="Titre/Fonction" />
                        </div>
                        <div className="space-y-2">
                          <Label>Sujet</Label>
                          <Input placeholder="Sujet de l'audience" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label>Heure</Label>
                            <Input type="time" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Niveau de confidentialité</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confidentiel">Confidentiel</SelectItem>
                              <SelectItem value="tres_confidentiel">Très Confidentiel</SelectItem>
                              <SelectItem value="secret">Secret</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full">Programmer l'audience</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {audiences.map(audience => (
                    <PrivateAudienceCard key={audience.id} audience={audience} />
                  ))}
                </div>
              </div>
            )}

            {/* Messages Section */}
            {activeSection === "messages" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Messagerie Cryptée</h2>
                    <p className="text-muted-foreground">Communications sécurisées end-to-end</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouveau message crypté</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Destinataire</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un contact" />
                            </SelectTrigger>
                            <SelectContent>
                              {vipContacts.map(contact => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.name} - {contact.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Sujet</Label>
                          <Input placeholder="Sujet du message" />
                        </div>
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea placeholder="Votre message..." rows={5} />
                        </div>
                        <div className="space-y-2">
                          <Label>Priorité</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normale</SelectItem>
                              <SelectItem value="high">Haute</SelectItem>
                              <SelectItem value="critical">Critique</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Envoyer (Crypté)
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="neu-card p-6">
                  {messages.map(message => (
                    <EncryptedMessageItem key={message.id} message={message} />
                  ))}
                </div>
              </div>
            )}

            {/* Correspondence Section */}
            {activeSection === "correspondence" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Correspondance Personnelle</h2>
                    <p className="text-muted-foreground">Gestion du courrier privé</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {correspondence.map(item => (
                    <div key={item.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="neu-raised w-10 h-10 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{item.subject}</h4>
                            <p className="text-sm text-muted-foreground">{item.sender_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(item.priority)}
                          {getStatusBadge(item.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Reçu le: {new Date(item.received_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Échéance: {item.deadline ? new Date(item.deadline).toLocaleDateString('fr-FR') : 'Aucune'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Type: <span className="capitalize">{item.type}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" size="sm">Archiver</Button>
                        <Button size="sm">Traiter</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIP Contacts Section */}
            {activeSection === "vip-contacts" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Carnet d'Adresses VIP</h2>
                    <p className="text-muted-foreground">Contacts privilégiés et confidentiels</p>
                  </div>
                  <Button className="neu-raised hover:shadow-neo-md transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau contact
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vipContacts.map(contact => (
                    <div key={contact.id} className="neu-card p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="neu-raised w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">{contact.title}</p>
                          <p className="text-xs text-muted-foreground">{contact.organization}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/5 transition-colors">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.country}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/5 transition-colors">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/5 transition-colors">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trips Section */}
            {activeSection === "trips" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Déplacements Privés</h2>
                    <p className="text-muted-foreground">Agenda des voyages personnels</p>
                  </div>
                  <Button className="neu-raised hover:shadow-neo-md transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Planifier
                  </Button>
                </div>

                <div className="space-y-4">
                  {trips.map(trip => (
                    <div key={trip.id} className="neu-card p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="neu-raised w-12 h-12 rounded-xl flex items-center justify-center">
                            <Plane className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{trip.destination}</h4>
                            <p className="text-sm text-muted-foreground">{trip.purpose}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{trip.type}</Badge>
                          <Badge className={trip.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {trip.status === 'confirmed' ? 'Confirmé' : trip.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-accent/5 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Dates</p>
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar className="h-4 w-4" />
                            {new Date(trip.start_date).toLocaleDateString('fr-FR')} - {new Date(trip.end_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Participants</p>
                          <div className="flex items-center gap-2 font-medium">
                            <Users className="h-4 w-4" />
                            {trip.participants?.join(", ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* IAsted Button */}
      <IAstedButtonFull onClick={() => setIastedOpen(true)} />
      <IAstedInterface
        isOpen={iastedOpen}
        onClose={() => setIastedOpen(false)}
        context="cabinet_private"
      />
    </div>
  );
};

export default PrivateCabinetDirectorSpace;
