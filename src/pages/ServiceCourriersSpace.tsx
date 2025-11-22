import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  LogOut, Mail, Plus, Search, Filter, ScanLine, Moon, Sun, CheckCircle2,
  LayoutDashboard, Inbox, FileText, Archive, Settings, Menu, ChevronRight
} from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { IncomingMail, MailStats as MailStatsType } from "@/types/service-courriers-types";
import { MailCard } from "@/components/courrier/MailCard";
import { MailStats } from "@/components/courrier/MailStats";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import IAstedInterface from "@/components/iasted/IAstedInterface";

import { MailSplitViewer } from "@/components/courrier/MailSplitViewer";

const ServiceCourriersSpace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [iastedOpen, setIastedOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  // Selection state for Split View
  const [selectedMail, setSelectedMail] = useState<IncomingMail | null>(null);

  // Data state
  const [mails, setMails] = useState<IncomingMail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMail, setNewMail] = useState({
    reference_number: "",
    sender: "",
    subject: "",
    type: "lettre",
    urgency: "normale",
    assigned_to: "",
    notes: "",
    digital_copy_url: ""
  });

  useEffect(() => {
    setMounted(true);
    checkAccess();
    fetchMails();
  }, []);

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
        .eq("role", "courrier");

      if (!roles || roles.length === 0) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchMails = async () => {
    try {
      const { data, error } = await supabase
        .from('mails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setMails(data as unknown as IncomingMail[]);
      } else {
        // Fallback to mock data if no real data exists
        const mockMails: IncomingMail[] = [
          {
            id: "1",
            reference_number: "COUR-2025-001",
            sender: "Ministère de l'Intérieur",
            subject: "Rapport mensuel de sécurité",
            received_date: new Date().toISOString(),
            type: "lettre",
            urgency: "haute",
            status: "en_traitement",
            assigned_to: "cabinet_private",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            digital_copy_url: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=2070&auto=format&fit=crop"
          },
          {
            id: "2",
            reference_number: "COUR-2025-002",
            sender: "Ambassade de France",
            subject: "Invitation réception officielle",
            received_date: new Date().toISOString(),
            type: "invitation",
            urgency: "normale",
            status: "recu",
            assigned_to: "protocol",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            digital_copy_url: "https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2070&auto=format&fit=crop"
          }
        ];
        setMails(mockMails);
      }
    } catch (error) {
      console.error("Error fetching mails:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les courriers.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCreateMail = async () => {
    const createdMail: IncomingMail = {
      id: Math.random().toString(36).substr(2, 9),
      ...newMail,
      received_date: new Date().toISOString(),
      status: "recu",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as IncomingMail;

    setMails([createdMail, ...mails]);
    setIsDialogOpen(false);
    toast({
      title: "Courrier enregistré",
      description: `Référence: ${newMail.reference_number}`,
    });

    setNewMail({
      reference_number: "",
      sender: "",
      subject: "",
      type: "lettre",
      urgency: "normale",
      assigned_to: "",
      notes: "",
      digital_copy_url: ""
    });
  };

  const handleMailValidation = (updatedMail: IncomingMail) => {
    setMails(prev => prev.map(m => m.id === updatedMail.id ? updatedMail : m));
    setSelectedMail(null);
    toast({
      title: "Courrier validé et transmis",
      description: `Le courrier ${updatedMail.reference_number} a été envoyé au destinataire.`,
      variant: "default",
    });
  };

  const getFilteredMails = () => {
    let filtered = mails.filter(mail => {
      const matchesSearch =
        mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mail.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mail.reference_number.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    if (activeSection === "incoming") {
      filtered = filtered.filter(m => m.status === "recu");
    } else if (activeSection === "processing") {
      filtered = filtered.filter(m => m.status === "en_traitement");
    } else if (activeSection === "archives") {
      filtered = filtered.filter(m => m.status === "archive" || m.status === "distribue");
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    return filtered;
  };

  const filteredMails = getFilteredMails();

  const stats: MailStatsType = {
    totalToday: mails.filter(m => new Date(m.received_date).toDateString() === new Date().toDateString()).length,
    urgentPending: mails.filter(m => (m.urgency === 'haute' || m.urgency === 'urgente') && m.status !== 'archive').length,
    toProcess: mails.filter(m => m.status === 'recu' || m.status === 'en_traitement').length,
    processedToday: mails.filter(m => m.status === 'distribue' && new Date(m.updated_at).toDateString() === new Date().toDateString()).length
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

  const NavButton = ({ id, icon: Icon, label, count }: { id: string, icon: any, label: string, count?: number }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${activeSection === id
        ? "neu-inset text-primary font-medium"
        : "hover:bg-white/50 dark:hover:bg-black/20"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="neu-raised">
          {count}
        </Badge>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 transition-colors duration-300">
      {/* Split View Modal */}
      {selectedMail && (
        <MailSplitViewer
          mail={selectedMail}
          onClose={() => setSelectedMail(null)}
          onValidate={handleMailValidation}
        />
      )}

      <div className="flex gap-6 max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside className="neu-card w-64 flex-shrink-0 p-6 flex flex-col min-h-[calc(100vh-3rem)] overflow-hidden sticky top-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center p-2">
              <img src={emblemGabon} alt="Armoiries" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                SERVICE COURRIERS
              </h1>
              <p className="text-xs text-muted-foreground">
                GED - Entrée
              </p>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <NavButton id="dashboard" icon={LayoutDashboard} label="Tableau de bord" />
            <div className="my-4 border-t border-border/50" />
            <NavButton
              id="incoming"
              icon={Inbox}
              label="Nouveaux reçus"
              count={mails.filter(m => m.status === 'recu').length}
            />
            <NavButton
              id="processing"
              icon={FileText}
              label="En traitement"
              count={mails.filter(m => m.status === 'en_traitement').length}
            />
            <NavButton id="archives" icon={Archive} label="Archives" />
          </nav>

          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between px-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="neu-raised rounded-full w-10 h-10">
                {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="neu-raised hover:text-destructive rounded-full w-10 h-10">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Top Bar */}
          <header className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {activeSection === 'dashboard' && 'Tableau de bord'}
                {activeSection === 'incoming' && 'Courriers Reçus'}
                {activeSection === 'processing' && 'En Traitement'}
                {activeSection === 'archives' && 'Archives'}
              </h2>
              <p className="text-muted-foreground">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="neu-raised hover:shadow-neo-md transition-all bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Courrier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Enregistrer un nouveau courrier</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Référence</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="REF-2025-XXX"
                          value={newMail.reference_number}
                          onChange={(e) => setNewMail({ ...newMail, reference_number: e.target.value })}
                        />
                        <Button size="icon" variant="outline" title="Générer auto">
                          <ScanLine className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newMail.type}
                        onValueChange={(v) => setNewMail({ ...newMail, type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lettre">Lettre</SelectItem>
                          <SelectItem value="colis">Colis</SelectItem>
                          <SelectItem value="facture">Facture</SelectItem>
                          <SelectItem value="invitation">Invitation</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Expéditeur</Label>
                    <Input
                      placeholder="Nom de l'expéditeur / Organisme"
                      value={newMail.sender}
                      onChange={(e) => setNewMail({ ...newMail, sender: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Objet</Label>
                    <Input
                      placeholder="Objet du courrier"
                      value={newMail.subject}
                      onChange={(e) => setNewMail({ ...newMail, subject: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Urgence</Label>
                      <Select
                        value={newMail.urgency}
                        onValueChange={(v) => setNewMail({ ...newMail, urgency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faible">Faible</SelectItem>
                          <SelectItem value="normale">Normale</SelectItem>
                          <SelectItem value="haute">Haute</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Service Destinataire</Label>
                      <Select
                        value={newMail.assigned_to}
                        onValueChange={(v) => setNewMail({ ...newMail, assigned_to: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cabinet_private">Cabinet Privé</SelectItem>
                          <SelectItem value="secretariat_general">Secrétariat Général</SelectItem>
                          <SelectItem value="protocol">Protocole</SelectItem>
                          <SelectItem value="dgss">DGSS</SelectItem>
                          <SelectItem value="president">Président</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Copie Numérique (GED)</Label>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <Input
                          type="file"
                          className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewMail({ ...newMail, digital_copy_url: URL.createObjectURL(file) });
                            }
                          }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          toast({
                            title: "Numérisation en cours...",
                            description: "Veuillez patienter pendant la connexion au scanner.",
                          });
                          setTimeout(() => {
                            setNewMail({ ...newMail, digital_copy_url: "scanned_document_v1.pdf" });
                            toast({
                              title: "Numérisation terminée",
                              description: "Le document a été joint avec succès.",
                            });
                          }, 2000);
                        }}
                      >
                        <ScanLine className="h-4 w-4" />
                        Scanner
                      </Button>
                    </div>
                    {newMail.digital_copy_url && (
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Document joint : {newMail.digital_copy_url.split('/').pop()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Notes / Instructions</Label>
                    <Textarea
                      placeholder="Notes complémentaires..."
                      value={newMail.notes}
                      onChange={(e) => setNewMail({ ...newMail, notes: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleCreateMail} className="w-full">
                    Enregistrer le courrier
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          {/* Dashboard View */}
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              <MailStats stats={stats} />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Courriers Récents</h3>
                  <Button variant="link" onClick={() => setActiveSection('incoming')}>
                    Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="grid gap-4">
                  {mails.slice(0, 3).map(mail => (
                    <MailCard
                      key={mail.id}
                      mail={mail}
                      onView={(m) => setSelectedMail(m)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* List Views */}
          {activeSection !== 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-10 neu-inset"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] neu-raised">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="recu">Reçu</SelectItem>
                    <SelectItem value="en_traitement">En traitement</SelectItem>
                    <SelectItem value="distribue">Distribué</SelectItem>
                    <SelectItem value="archive">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4">
                {filteredMails.map(mail => (
                  <MailCard
                    key={mail.id}
                    mail={mail}
                    onView={(m) => setSelectedMail(m)}
                  />
                ))}
                {filteredMails.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground neu-inset rounded-xl">
                    Aucun courrier trouvé dans cette section
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* IAsted Integration */}
      <IAstedButtonFull
        voiceListening={false}
        voiceSpeaking={false}
        voiceProcessing={false}
        onClick={() => setIastedOpen(true)}
        onDoubleClick={() => setIastedOpen(true)}
      />
      <IAstedInterface
        isOpen={iastedOpen}
        onClose={() => setIastedOpen(false)}
      />
    </div>
  );
};

export default ServiceCourriersSpace;
