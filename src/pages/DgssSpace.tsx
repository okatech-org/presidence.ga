import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Shield,
    LogOut,
    Eye,
    FileText,
    LayoutDashboard,
    ChevronDown,
    ChevronRight,
    Sun,
    Moon,
    Plus,
    Search,
    Filter,
    AlertTriangle,
    Radar,
    Lock,
    Globe,
    UserX,
    Building2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { generateSystemPrompt } from "@/utils/generateSystemPrompt";
import { useUserContext } from "@/hooks/useUserContext";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IntelligenceReport, SurveillanceTarget, ThreatIndicator } from "@/types/dgss";
import { ThreatHeatmap } from "@/components/dgss/ThreatHeatmap";
import { ThreatTrends } from "@/components/dgss/ThreatTrends";



const DgssSpace = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const queryClient = useQueryClient();

    const [mounted, setMounted] = useState(false);
    const [iastedOpen, setIastedOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("dashboard");
    const [expandedSections, setExpandedSections] = useState({
        navigation: true,
        intelligence: true,
        operations: false,
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

    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('echo');
    const userContext = useUserContext({ spaceName: 'DgssSpace' });

    // Tool call handler for iAsted
    const handleToolCall = useCallback((toolName: string, args: any) => {
        console.log(`🔧 [DgssSpace] Tool call: ${toolName}`, args);
        switch (toolName) {
            case 'control_ui':
                if (args.action === 'toggle_theme') toggleTheme();
                else if (args.action === 'set_theme_dark') setTheme("dark");
                else if (args.action === 'set_theme_light') setTheme("light");
                else if (args.action === 'set_volume') toast({ title: "Volume", description: `Volume ajusté` });
                else if (args.action === 'set_speech_rate') {
                    if (args.value && openaiRTC) openaiRTC.setSpeechRate(parseFloat(args.value));
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
                const accordionSections = ['navigation', 'intelligence', 'operations'];

                const sectionMap: Record<string, string> = {
                    'dashboard': 'dashboard',
                    'tableau-de-bord': 'dashboard',
                    'reports': 'reports',
                    'rapports': 'reports',
                    'threats': 'threats',
                    'menaces': 'threats',
                    'targets': 'targets',
                    'cibles': 'targets',
                    'surveillance': 'targets',
                    'heatmap': 'heatmap',
                    'carte': 'heatmap',
                    'trends': 'trends',
                    'tendances': 'trends'
                };

                const targetSection = sectionMap[sectionId] || sectionId;

                if (accordionSections.includes(targetSection)) {
                    toggleSection(targetSection);
                    toast({ title: "Navigation", description: `Section ${targetSection} basculée` });
                    return { success: true, message: `Section ${targetSection} basculée` };
                } else {
                    setActiveSection(targetSection);

                    const parentSectionMap: Record<string, string> = {
                        'dashboard': 'navigation',
                        'reports': 'intelligence',
                        'threats': 'intelligence',
                        'targets': 'operations',
                        'heatmap': 'operations',
                        'trends': 'operations'
                    };

                    const parent = parentSectionMap[targetSection];
                    if (parent) {
                        setExpandedSections(prev => ({ ...prev, [parent]: true }));
                    }
                    toast({ title: "Navigation", description: `Ouverture de ${targetSection}` });
                    return { success: true, message: `Section ${targetSection} ouverte` };
                }

            case 'open_chat':
                setIastedOpen(true);
                break;

            case 'close_chat':
                setIastedOpen(false);
                break;

            case 'stop_conversation':
                setIastedOpen(false);
                break;

            default:
                console.log('[DgssSpace] Tool call not handled:', toolName);
        }
    }, [toast, theme, setTheme]);

    const openaiRTC = useRealtimeVoiceWebRTC(handleToolCall);

    // Access Control
    useEffect(() => {
        setMounted(true);
        const checkAccess = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/auth");
                return;
            }
            // Check for dgss role
            const { data: roles } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .in("role", ["dgss", "admin"]);

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
            console.log('📍 [DgssSpace] Événement navigation reçu:', sectionId);

            const accordionSections = ['navigation', 'intelligence', 'operations'];
            const sectionMap: Record<string, string> = {
                'dashboard': 'dashboard',
                'tableau-de-bord': 'dashboard',
                'reports': 'reports',
                'rapports': 'reports',
                'threats': 'threats',
                'menaces': 'threats',
                'targets': 'targets',
                'cibles': 'targets',
                'surveillance': 'targets',
                'heatmap': 'heatmap',
                'carte': 'heatmap',
                'trends': 'trends',
                'tendances': 'trends'
            };

            const targetSection = sectionMap[sectionId] || sectionId;

            if (accordionSections.includes(targetSection)) {
                toggleSection(targetSection);
            } else {
                setActiveSection(targetSection);
                const parentSectionMap: Record<string, string> = {
                    'dashboard': 'navigation',
                    'reports': 'intelligence',
                    'threats': 'intelligence',
                    'targets': 'operations',
                    'heatmap': 'operations',
                    'trends': 'operations'
                };
                const parent = parentSectionMap[targetSection];
                if (parent) {
                    setExpandedSections(prev => ({ ...prev, [parent]: true }));
                }
            }
        };

        const handleUIControlEvent = (e: CustomEvent) => {
            const { action } = e.detail;
            console.log('🎨 [DgssSpace] Événement UI Control reçu:', action);
            
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

    // Data Fetching
    const { data: reports = [], isLoading: reportsLoading } = useQuery({
        queryKey: ["intelligence_reports"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('intelligence_reports')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as IntelligenceReport[];
        },
    });

    const { data: targets = [], isLoading: targetsLoading } = useQuery({
        queryKey: ["surveillance_targets"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('surveillance_targets')
                .select('*')
                .order('last_update', { ascending: false });
            if (error) throw error;
            return data as SurveillanceTarget[];
        },
    });

    const { data: threats = [], isLoading: threatsLoading } = useQuery({
        queryKey: ["threat_indicators"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('threat_indicators')
                .select('*')
                .order('timestamp', { ascending: false });
            if (error) throw error;
            return data as ThreatIndicator[];
        },
    });

    // Mutations
    const createReportMutation = useMutation({
        mutationFn: async (newReport: Omit<IntelligenceReport, "id" | "created_at">) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('intelligence_reports')
                .insert({
                    ...newReport,
                    created_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intelligence_reports"] });
            toast({ title: "Succès", description: "Rapport créé avec succès" });
        },
        onError: (error) => {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        },
    });

    const addTargetMutation = useMutation({
        mutationFn: async (newTarget: Omit<SurveillanceTarget, "id" | "created_at" | "last_update">) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('surveillance_targets')
                .insert({
                    ...newTarget,
                    created_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["surveillance_targets"] });
            toast({ title: "Succès", description: "Cible ajoutée avec succès" });
        },
        onError: (error) => {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        },
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    // Helper functions
    const getClassificationBadge = (classification: string) => {
        const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
            top_secret: { label: "TOP SECRET", variant: "destructive", className: "bg-red-600 hover:bg-red-700 animate-pulse" },
            secret: { label: "SECRET", variant: "destructive", className: "bg-orange-500 hover:bg-orange-600" },
            confidential: { label: "CONFIDENTIEL", variant: "default", className: "bg-yellow-500 hover:bg-yellow-600 text-black" },
            restricted: { label: "RESTREINT", variant: "secondary" },
        };

        const config = variants[classification] || { label: classification, variant: "outline" };
        return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            critical: { label: "CRITIQUE", className: "text-red-500 border-red-500" },
            high: { label: "ÉLEVÉE", className: "text-orange-500 border-orange-500" },
            medium: { label: "MOYENNE", className: "text-yellow-500 border-yellow-500" },
            low: { label: "FAIBLE", className: "text-green-500 border-green-500" },
        };

        const config = variants[priority] || { label: priority, className: "" };
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
    };

    // Stats
    const stats = {
        activeThreats: threats.filter(t => ["critical", "high"].includes(t.level)).length,
        activeTargets: targets.filter(t => t.status === "active").length,
        pendingReports: reports.filter(r => r.status === "draft" || r.status === "submitted").length,
    };

    if (reportsLoading || targetsLoading || threatsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="text-muted-foreground">Chargement des données sécurisées...</p>
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
                            <div className="font-bold text-sm">DGSS</div>
                            <div className="text-xs text-muted-foreground">Renseignement</div>
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

                    {/* Intelligence */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('intelligence')}
                            className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
                        >
                            RENSEIGNEMENT
                            {expandedSections.intelligence ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        {expandedSections.intelligence && (
                            <nav className="space-y-1 ml-2">
                                <button
                                    onClick={() => setActiveSection("reports")}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "reports"
                                        ? "neu-inset text-primary font-semibold"
                                        : "neu-raised hover:shadow-neo-md"
                                        } `}
                                >
                                    <FileText className="w-4 h-4" />
                                    Rapports
                                </button>
                                <button
                                    onClick={() => setActiveSection("threats")}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "threats"
                                        ? "neu-inset text-primary font-semibold"
                                        : "neu-raised hover:shadow-neo-md"
                                        } `}
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    Menaces
                                </button>
                            </nav>
                        )}
                    </div>

                    {/* Operations */}
                    <div className="mb-4 flex-1">
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
                                    onClick={() => setActiveSection("targets")}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "targets"
                                        ? "neu-inset text-primary font-semibold"
                                        : "neu-raised hover:shadow-neo-md"
                                        } `}
                                >
                                    <Radar className="w-4 h-4" />
                                    Cibles
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
                                <Shield className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                    Espace DGSS
                                </h1>
                                <p className="text-base text-muted-foreground">
                                    Direction Générale des Services Spéciaux - Renseignement Stratégique
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
                                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                            </div>
                                            <div className="text-4xl font-bold mb-2">{stats.activeThreats}</div>
                                            <div className="text-sm font-medium">Menaces Actives</div>
                                            <div className="text-xs text-muted-foreground">Niveau critique/élevé</div>
                                        </div>
                                        <div className="px-6">
                                            <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                                                <Radar className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <div className="text-4xl font-bold mb-2">{stats.activeTargets}</div>
                                            <div className="text-sm font-medium">Cibles sous Surveillance</div>
                                            <div className="text-xs text-muted-foreground">En temps réel</div>
                                        </div>
                                        <div className="px-6">
                                            <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                                                <FileText className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div className="text-4xl font-bold mb-2">{stats.pendingReports}</div>
                                            <div className="text-sm font-medium">Rapports en Cours</div>
                                            <div className="text-xs text-muted-foreground">À valider</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Visualisations */}
                                <div className="mb-8">
                                    <ThreatTrends threats={threats} targets={targets} />
                                </div>

                                <div className="mb-8">
                                    <ThreatHeatmap threats={threats} />
                                </div>

                                {/* Recent Reports */}
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="neu-card p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-primary" />
                                                Derniers Rapports
                                            </h3>
                                            <Button onClick={() => setActiveSection("reports")} variant="ghost" size="sm" className="text-xs">
                                                Voir tout
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {reports.slice(0, 3).map(report => (
                                                <div key={report.id} className="neu-inset p-4 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {getClassificationBadge(report.classification)}
                                                            </div>
                                                            <p className="font-medium text-sm line-clamp-1">{report.title}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                                                        <span>Source: {report.source}</span>
                                                        <span>{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Active Threats */}
                                    <div className="neu-card p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                                Menaces Prioritaires
                                            </h3>
                                            <Button onClick={() => setActiveSection("threats")} variant="ghost" size="sm" className="text-xs">
                                                Voir tout
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {threats.slice(0, 3).map(threat => (
                                                <div key={threat.id} className="neu-raised p-4 rounded-lg border-l-4 border-red-500">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-medium text-sm">{threat.type.toUpperCase()}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">{threat.location}</p>
                                                        </div>
                                                        <Badge variant={threat.level === 'critical' ? 'destructive' : 'default'}>
                                                            {threat.level.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{threat.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reports Section */}
                        {activeSection === "reports" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Rapports de Renseignement</h2>
                                        <p className="text-muted-foreground">Centralisation et analyse des informations</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="neu-raised hover:shadow-neo-md transition-all">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Nouveau Rapport
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Créer un rapport de renseignement</DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    createReportMutation.mutate({
                                                        title: formData.get("title") as string,
                                                        content: formData.get("content") as string,
                                                        source: formData.get("source") as string,
                                                        classification: formData.get("classification") as any,
                                                        status: "draft",
                                                    });
                                                }}
                                                className="space-y-4 py-4"
                                            >
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="title">Titre du rapport</Label>
                                                        <Input id="title" name="title" placeholder="Ex: Analyse situationnelle..." required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="classification">Classification</Label>
                                                        <Select name="classification" required>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Niveau de classification" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="top_secret">TOP SECRET</SelectItem>
                                                                <SelectItem value="secret">SECRET</SelectItem>
                                                                <SelectItem value="confidential">CONFIDENTIEL</SelectItem>
                                                                <SelectItem value="restricted">RESTREINT</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="source">Source</Label>
                                                    <Input id="source" name="source" placeholder="Ex: HUMINT, SIGINT, OSINT..." required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="content">Contenu</Label>
                                                    <Textarea id="content" name="content" className="min-h-[200px]" placeholder="Détails du rapport..." required />
                                                </div>
                                                <Button type="submit" className="w-full">Soumettre le rapport</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="grid gap-4">
                                    {reports.map((report) => (
                                        <div key={report.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getClassificationBadge(report.classification)}
                                                        <Badge variant="outline">{report.status}</Badge>
                                                    </div>
                                                    <h3 className="font-semibold text-lg">{report.title}</h3>
                                                </div>
                                                <Lock className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{report.content}</p>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                                                <div className="flex items-center gap-2">
                                                    <Eye className="h-3 w-3" /> Source: {report.source}
                                                </div>
                                                <div>{new Date(report.created_at).toLocaleString('fr-FR')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Targets Section */}
                        {activeSection === "targets" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Cibles sous Surveillance</h2>
                                        <p className="text-muted-foreground">Suivi opérationnel des cibles</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="neu-raised hover:shadow-neo-md transition-all">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Ajouter une cible
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Nouvelle cible</DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    addTargetMutation.mutate({
                                                        name: formData.get("name") as string,
                                                        type: formData.get("type") as any,
                                                        status: "active",
                                                        priority: formData.get("priority") as any,
                                                    });
                                                }}
                                                className="space-y-4 py-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Nom / Identifiant</Label>
                                                    <Input id="name" name="name" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="type">Type de cible</Label>
                                                    <Select name="type" required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner le type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="individual">Individu</SelectItem>
                                                            <SelectItem value="organization">Organisation</SelectItem>
                                                            <SelectItem value="location">Lieu</SelectItem>
                                                            <SelectItem value="cyber">Cyber</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="priority">Priorité</Label>
                                                    <Select name="priority" required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Niveau de priorité" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="critical">Critique</SelectItem>
                                                            <SelectItem value="high">Élevée</SelectItem>
                                                            <SelectItem value="medium">Moyenne</SelectItem>
                                                            <SelectItem value="low">Faible</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button type="submit" className="w-full">Activer la surveillance</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {targets.map((target) => (
                                        <div key={target.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                                            <div className="flex items-center justify-between mb-4">
                                                {target.type === 'individual' && <UserX className="w-8 h-8 text-primary" />}
                                                {target.type === 'organization' && <Building2 className="w-8 h-8 text-primary" />}
                                                {target.type === 'location' && <Globe className="w-8 h-8 text-primary" />}
                                                {target.type === 'cyber' && <Radar className="w-8 h-8 text-primary" />}
                                                {getPriorityBadge(target.priority)}
                                            </div>
                                            <h3 className="font-bold text-lg mb-1">{target.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-4 capitalize">{target.type}</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                                <Badge variant={target.status === 'active' ? 'default' : 'secondary'}>
                                                    {target.status.toUpperCase()}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    MàJ: {new Date(target.last_update).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* iAsted Integration */}
                {userContext.hasIAstedAccess && (
                    <IAstedButtonFull
                        onClick={async () => {
                            if (openaiRTC.isConnected) {
                                openaiRTC.disconnect();
                            } else {
                                const systemPrompt = generateSystemPrompt(userContext);
                                await openaiRTC.connect(selectedVoice, systemPrompt);
                            }
                        }}
                        onDoubleClick={() => setIastedOpen(true)}
                        audioLevel={openaiRTC.audioLevel}
                        voiceListening={openaiRTC.voiceState === 'listening'}
                        voiceSpeaking={openaiRTC.voiceState === 'speaking'}
                        voiceProcessing={openaiRTC.voiceState === 'connecting' || openaiRTC.voiceState === 'thinking'}
                    />
                )}

                {iastedOpen && (
                    <IAstedChatModal
                        isOpen={iastedOpen}
                        onClose={() => setIastedOpen(false)}
                        systemPrompt={generateSystemPrompt(userContext)}
                        openaiRTC={openaiRTC}
                    />
                )}
            </div>
        </div>
    );
};

export default DgssSpace;
