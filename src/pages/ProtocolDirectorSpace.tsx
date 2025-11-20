import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Calendar,
    LogOut,
    Users,
    MapPin,
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
    Flag,
    ScrollText,
    PartyPopper
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
import type { OfficialEvent, Guest, ProtocolProcedure } from "@/types/protocol";

const ProtocolDirectorSpace = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const queryClient = useQueryClient();

    const [mounted, setMounted] = useState(false);
    const [iastedOpen, setIastedOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("dashboard");
    const [expandedSections, setExpandedSections] = useState({
        navigation: true,
        agenda: true,
        guests: false,
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
            // Check for protocol role
            const { data: roles } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .in("role", ["protocol", "admin"]);

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

    // Data Fetching - TEMPORAIRE: Tables non créées
    const { data: events = [], isLoading: eventsLoading } = useQuery({
        queryKey: ["official_events"],
        queryFn: async () => {
            // TODO: Créer la table official_events
            return [] as OfficialEvent[];
        },
    });

    const { data: guests = [], isLoading: guestsLoading } = useQuery({
        queryKey: ["guest_lists"],
        queryFn: async () => {
            // TODO: Créer la table guest_lists
            return [] as Guest[];
        },
    });

    // Mutations - Désactivées temporairement
    const createEventMutation = useMutation({
        mutationFn: async (newEvent: Omit<OfficialEvent, "id" | "created_at">) => {
            console.log("Table official_events non créée");
            throw new Error("Table non créée");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["official_events"] });
            toast({ title: "Succès", description: "Événement créé avec succès" });
        },
        onError: () => {
            toast({ title: "Erreur", description: "Table non créée dans la base de données", variant: "destructive" });
        },
    });

    const addGuestMutation = useMutation({
        mutationFn: async (newGuest: Omit<Guest, "id" | "created_at">) => {
            console.log("Table guest_lists non créée");
            throw new Error("Table non créée");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guest_lists"] });
            toast({ title: "Succès", description: "Invité ajouté avec succès" });
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible d'ajouter l'invité", variant: "destructive" });
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
            upcoming: { label: "À venir", variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
            ongoing: { label: "En cours", variant: "default", className: "bg-green-500 hover:bg-green-600 animate-pulse" },
            completed: { label: "Terminé", variant: "secondary", className: "bg-gray-100 text-gray-700" },
            cancelled: { label: "Annulé", variant: "destructive" },
            invited: { label: "Invité", variant: "outline" },
            confirmed: { label: "Confirmé", variant: "default", className: "bg-green-500 hover:bg-green-600" },
            declined: { label: "Décliné", variant: "destructive" },
            attended: { label: "Présent", variant: "secondary", className: "bg-blue-100 text-blue-700" },
        };

        const config = variants[status] || { label: status, variant: "outline" };
        return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
    };

    // Stats
    const stats = {
        upcomingEvents: events.filter(e => e.status === "upcoming").length,
        pendingRSVPs: guests.filter(g => g.status === "invited").length,
        confirmedGuests: guests.filter(g => g.status === "confirmed").length,
    };

    if (eventsLoading || guestsLoading) {
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
                            <div className="font-bold text-sm">PROTOCOLE D'ÉTAT</div>
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

                    {/* Agenda */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('agenda')}
                            className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
                        >
                            AGENDA & CÉRÉMONIAL
                            {expandedSections.agenda ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        {expandedSections.agenda && (
                            <nav className="space-y-1 ml-2">
                                <button
                                    onClick={() => setActiveSection("events")}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "events"
                                        ? "neu-inset text-primary font-semibold"
                                        : "neu-raised hover:shadow-neo-md"
                                        } `}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Événements Officiels
                                </button>
                                <button
                                    onClick={() => setActiveSection("procedures")}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "procedures"
                                        ? "neu-inset text-primary font-semibold"
                                        : "neu-raised hover:shadow-neo-md"
                                        } `}
                                >
                                    <ScrollText className="w-4 h-4" />
                                    Procédures
                                </button>
                            </nav>
                        )}
                    </div>

                    {/* Invités */}
                    <div className="mb-4 flex-1">
                        <button
                            onClick={() => toggleSection('guests')}
                            className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
                        >
                            INVITÉS
                            {expandedSections.guests ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        {expandedSections.guests && (
                            <nav className="space-y-1 ml-2">
                                <button
                                    onClick={() => setActiveSection("guest_list")}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "guest_list"
                                        ? "neu-inset text-primary font-semibold"
                                        : "neu-raised hover:shadow-neo-md"
                                        } `}
                                >
                                    <Users className="w-4 h-4" />
                                    Listes d'Invités
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
                                    Espace Directeur du Protocole
                                </h1>
                                <p className="text-base text-muted-foreground">
                                    Gestion de l'agenda officiel, du cérémonial et des invités
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
                                                <Calendar className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="text-4xl font-bold mb-2">{stats.upcomingEvents}</div>
                                            <div className="text-sm font-medium">Événements à venir</div>
                                            <div className="text-xs text-muted-foreground">Confirmés</div>
                                        </div>
                                        <div className="px-6">
                                            <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                                                <Users className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <div className="text-4xl font-bold mb-2">{stats.pendingRSVPs}</div>
                                            <div className="text-sm font-medium">RSVP en attente</div>
                                            <div className="text-xs text-muted-foreground">Invités</div>
                                        </div>
                                        <div className="px-6">
                                            <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            </div>
                                            <div className="text-4xl font-bold mb-2">{stats.confirmedGuests}</div>
                                            <div className="text-sm font-medium">Invités Confirmés</div>
                                            <div className="text-xs text-muted-foreground">Prochains événements</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Upcoming Events */}
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="neu-card p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-primary" />
                                                Prochains Événements
                                            </h3>
                                            <Button onClick={() => setActiveSection("events")} variant="ghost" size="sm" className="text-xs">
                                                Voir tout
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {events.slice(0, 3).map(event => (
                                                <div key={event.id} className="neu-inset p-4 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm line-clamp-2">{event.title}</p>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <MapPin className="h-3 w-3" />
                                                                {event.location}
                                                            </div>
                                                        </div>
                                                        {getStatusBadge(event.status)}
                                                    </div>
                                                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(event.date).toLocaleString('fr-FR')}
                                                    </div>
                                                </div>
                                            ))}
                                            {events.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                    Aucun événement prévu
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Guests */}
                                    <div className="neu-card p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                                <Users className="w-5 h-5 text-primary" />
                                                Derniers Invités Ajoutés
                                            </h3>
                                            <Button onClick={() => setActiveSection("guest_list")} variant="ghost" size="sm" className="text-xs">
                                                Voir tout
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {guests.slice(0, 3).map(guest => (
                                                <div key={guest.id} className="neu-raised p-4 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">{guest.name}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">{guest.title || guest.organization}</p>
                                                        </div>
                                                        {getStatusBadge(guest.status)}
                                                    </div>
                                                </div>
                                            ))}
                                            {guests.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                    Aucun invité récent
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Events Section */}
                        {activeSection === "events" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Événements Officiels</h2>
                                        <p className="text-muted-foreground">Gestion de l'agenda présidentiel et cérémonial</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="neu-raised hover:shadow-neo-md transition-all">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Nouvel événement
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Créer un événement</DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    createEventMutation.mutate({
                                                        title: formData.get("title") as string,
                                                        date: formData.get("date") as string,
                                                        location: formData.get("location") as string,
                                                        type: formData.get("type") as any,
                                                        status: "upcoming",
                                                        description: formData.get("description") as string,
                                                    });
                                                }}
                                                className="space-y-4 py-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Titre de l'événement</Label>
                                                    <Input id="title" name="title" placeholder="Ex: Cérémonie des vœux" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="type">Type</Label>
                                                    <Select name="type" required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner le type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ceremony">Cérémonie</SelectItem>
                                                            <SelectItem value="meeting">Réunion</SelectItem>
                                                            <SelectItem value="visit">Visite Officielle</SelectItem>
                                                            <SelectItem value="gala">Gala / Dîner</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="date">Date et Heure</Label>
                                                    <Input id="date" name="date" type="datetime-local" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">Lieu</Label>
                                                    <Input id="location" name="location" placeholder="Ex: Palais du Bord de Mer" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Description</Label>
                                                    <Input id="description" name="description" placeholder="Détails supplémentaires..." />
                                                </div>
                                                <Button type="submit" className="w-full">Créer l'événement</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="grid gap-4">
                                    {events.map((event) => (
                                        <div key={event.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline" className="bg-background/50 uppercase">{event.type}</Badge>
                                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> {event.location}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-lg">{event.title}</h3>
                                                </div>
                                                {getStatusBadge(event.status)}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(event.date).toLocaleString('fr-FR')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Guests Section */}
                        {activeSection === "guest_list" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Listes d'Invités</h2>
                                        <p className="text-muted-foreground">Gestion des invitations et des présences</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="neu-raised hover:shadow-neo-md transition-all">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Ajouter un invité
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Ajouter un invité</DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    addGuestMutation.mutate({
                                                        event_id: formData.get("event_id") as string,
                                                        name: formData.get("name") as string,
                                                        title: formData.get("title") as string,
                                                        organization: formData.get("organization") as string,
                                                        category: formData.get("category") as any,
                                                        status: "invited",
                                                    });
                                                }}
                                                className="space-y-4 py-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="event_id">Événement</Label>
                                                    <Select name="event_id" required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner l'événement" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {events.filter(e => e.status === 'upcoming').map(event => (
                                                                <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Nom complet</Label>
                                                    <Input id="name" name="name" placeholder="Ex: Jean Dupont" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Titre / Fonction</Label>
                                                    <Input id="title" name="title" placeholder="Ex: Ambassadeur" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="organization">Organisation</Label>
                                                    <Input id="organization" name="organization" placeholder="Ex: Ambassade de France" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="category">Catégorie</Label>
                                                    <Select name="category" required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner la catégorie" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="vip">VIP</SelectItem>
                                                            <SelectItem value="press">Presse</SelectItem>
                                                            <SelectItem value="staff">Staff</SelectItem>
                                                            <SelectItem value="general">Général</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button type="submit" className="w-full">Ajouter à la liste</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="grid gap-4">
                                    {guests.map((guest) => (
                                        <div key={guest.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="text-xs">{guest.category.toUpperCase()}</Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {events.find(e => e.id === guest.event_id)?.title || 'Événement inconnu'}
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-lg">{guest.name}</p>
                                                    <p className="text-sm text-muted-foreground">{guest.title} - {guest.organization}</p>
                                                </div>
                                                {getStatusBadge(guest.status)}
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

export default ProtocolDirectorSpace;
