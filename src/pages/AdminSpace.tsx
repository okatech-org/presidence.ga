import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserContext } from '@/hooks/useUserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    ShieldAlert,
    Settings,
    Activity,
    Server,
    Database,
    Bot,
    LayoutDashboard,
    LogOut,
    Menu,
    ChevronRight,
    ChevronDown,
    Search,
    Bell,
    Moon,
    Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeedbacks } from "@/hooks/useSupabaseQuery";
import { useRealtimeFeedbacks } from "@/hooks/useRealtimeSync";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FeedbackDocumentsViewer } from "@/components/FeedbackDocumentsViewer";
import { FileText, Download, Eye, Paperclip, FileSpreadsheet, MessageSquare } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "next-themes";
import emblemGabon from "@/assets/emblem_gabon.png";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { generateSystemPrompt } from '@/utils/generateSystemPrompt';
import { resolveRoute } from '@/utils/route-mapping';

// Admin Components
import { AIConfigSection } from '@/components/admin/AIConfigSection';
import { KnowledgeBaseSection } from '@/components/admin/KnowledgeBaseSection';
import { UserManagementSection } from '@/components/admin/UserManagementSection';
import { AuditLogSection } from '@/components/admin/AuditLogSection';
import { AdminUnlock } from '@/components/admin/AdminUnlock';

interface Feedback {
    id: string;
    user_email: string;
    role_name: string;
    role_description: string;
    work_description: string;
    implementation_suggestions: string | null;
    created_at: string;
    status: string | null;
    document_paths: string[];
}

const AdminSpace = () => {
    const { profile, role, isLoading } = useUserContext({ spaceName: 'AdminSpace' });
    const [isIAstedOpen, setIsIAstedOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [expandedSections, setExpandedSections] = useState({
        general: true,
        systeme: true,
    });
    const { toast } = useToast();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [showDocuments, setShowDocuments] = useState(false);

    // Feedback Data
    const { data: feedbacks = [], isLoading: loadingFeedbacks, error: feedbackError } = useFeedbacks();
    useRealtimeFeedbacks();

    // Voice & Super Admin Tools
    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('echo');
    const [securityOverrideActive, setSecurityOverrideActive] = useState(false);
    const [originRoute, setOriginRoute] = useState<string | null>(null); // Track where we came from

    const handleToolCall = useCallback((toolName: string, args: any) => {
        switch (toolName) {
            case 'global_navigate':
                // Intelligent route resolution
                const query = args.query || args.route; // Support both old and new format
                console.log('🦭 [Super Admin] Navigation request:', query);

                const resolvedRoute = resolveRoute(query);
                if (resolvedRoute) {
                    // Store current location before navigating
                    setOriginRoute(window.location.pathname);
                    console.log('✅ [Super Admin] Resolved to:', resolvedRoute);
                    navigate(resolvedRoute);
                } else {
                    console.error('❌ [Super Admin] Route not found for:', query);
                    toast({
                        title: 'Route inconnue',
                        description: `Impossible de trouver la route pour "${query}"`,
                        variant: 'destructive'
                    });
                }
                break;
            case 'return_to_base':
                console.log('🏠 [Super Admin] Returning to base (AdminSpace)');
                setOriginRoute(window.location.pathname);
                navigate('/admin-space');
                toast({
                    title: 'Retour à la base',
                    description: 'Navigation vers l\'AdminSpace',
                });
                break;
            case 'return_to_origin':
                if (originRoute) {
                    console.log('⏮️ [Super Admin] Returning to origin:', originRoute);
                    navigate(originRoute);
                    toast({
                        title: 'Retour à l\'origine',
                        description: `Navigation vers ${originRoute}`,
                    });
                    setOriginRoute(null); // Clear after use
                } else {
                    console.log('⚠️ [Super Admin] No origin route stored');
                    toast({
                        title: 'Pas d\'origine',
                        description: 'Aucune page d\'origine enregistrée',
                        variant: 'destructive'
                    });
                }
                break;
            case 'security_override':
                if (args.action === 'unlock_admin_access') {
                    console.log('🔓 [Super Admin] Security override activated');
                    setSecurityOverrideActive(true);
                    toast({
                        title: '🔐 Accès déverrouillé',
                        description: 'Mode God: Tous les accès sont autorisés',
                        duration: 3000,
                    });
                    // Visual effect: reset after 3 seconds
                    setTimeout(() => setSecurityOverrideActive(false), 3000);
                }
                break;

            // UI Tools (like PresidentSpace)
            case 'open_chat':
                console.log('💬 [AdminSpace] Opening chat');
                setIsIAstedOpen(true);
                break;

            case 'close_chat':
                console.log('❌ [AdminSpace] Closing chat');
                setIsIAstedOpen(false);
                break;

            case 'stop_conversation':
                console.log('🛑 [AdminSpace] Stopping conversation');
                openaiRTC.disconnect();
                setIsIAstedOpen(false);
                break;

            default:
                console.log('[AdminSpace] Tool call not handled:', toolName, args);
        }
    }, [navigate, toast, originRoute]);

    const openaiRTC = useRealtimeVoiceWebRTC(handleToolCall);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (feedbackError) {
        toast({
            title: "Erreur",
            description: "Impossible de charger les feedbacks",
            variant: "destructive",
        });
    }

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    }, [navigate]);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case "processed":
                return <Badge variant="default">Traité</Badge>;
            case "pending":
                return <Badge variant="secondary">En attente</Badge>;
            default:
                return <Badge variant="outline">Nouveau</Badge>;
        }
    };

    const handleViewDocuments = (feedback: Feedback) => {
        setSelectedFeedback(feedback);
        setShowDocuments(true);
    };

    const exportToCSV = () => {
        try {
            const headers = ["Date", "Rôle", "Email", "Description rôle", "Description travail", "Suggestions", "Statut", "Documents"];
            const rows = feedbacks.map(feedback => [
                new Date(feedback.created_at).toLocaleDateString("fr-FR"),
                feedback.role_name,
                feedback.user_email,
                feedback.role_description.replace(/\n/g, " "),
                feedback.work_description.replace(/\n/g, " "),
                (feedback.implementation_suggestions || "-").replace(/\n/g, " "),
                feedback.status || "nouveau",
                feedback.document_paths?.length || 0
            ]);
            const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `feedbacks_${new Date().toISOString().split("T")[0]}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Export réussi", description: "Les feedbacks ont été exportés en CSV" });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'exporter en CSV", variant: "destructive" });
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Feedbacks des responsables", 14, 20);
            doc.setFontSize(11);
            doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 28);
            const tableData = feedbacks.map(feedback => [
                new Date(feedback.created_at).toLocaleDateString("fr-FR"),
                feedback.role_name,
                feedback.user_email,
                feedback.role_description.substring(0, 50) + "...",
                feedback.work_description.substring(0, 50) + "...",
                (feedback.implementation_suggestions || "-").substring(0, 50),
                feedback.status || "nouveau",
            ]);
            autoTable(doc, {
                head: [["Date", "Rôle", "Email", "Description rôle", "Description travail", "Suggestions", "Statut"]],
                body: tableData,
                startY: 35,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 139, 202] },
            });
            doc.save(`feedbacks_${new Date().toISOString().split("T")[0]}.pdf`);
            toast({ title: "Export réussi", description: "Les feedbacks ont été exportés en PDF" });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'exporter en PDF", variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Chargement...</div>;
    }

    // Allow both admin and president (who has admin rights)
    if (role !== 'admin' && role !== 'president') {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="text-red-500 text-xl mb-4">Accès refusé. Réservé aux administrateurs.</div>
                <p className="text-muted-foreground mb-8">Double-cliquez sur le cadenas en bas à gauche pour débloquer</p>
                <AdminUnlock onUnlocked={() => window.location.reload()} />
            </div>
        );
    }

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
                                alt="Emblème"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <div className="font-bold text-sm">ADMIN.GA</div>
                            <div className="text-xs text-muted-foreground">Super Admin</div>
                        </div>
                    </div>

                    {/* Navigation Générale */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('general')}
                            className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
                        >
                            GÉNÉRAL
                            {expandedSections.general ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        {expandedSections.general && (
                            <nav className="space-y-1 ml-2">
                                <button
                                    onClick={() => setActiveSection('dashboard')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'dashboard' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Tableau de Bord
                                </button>
                                <button
                                    onClick={() => setActiveSection('feedbacks')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'feedbacks' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Feedbacks
                                </button>
                                <button
                                    onClick={() => setActiveSection('users')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'users' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                                >
                                    <Users className="w-4 h-4" />
                                    Utilisateurs
                                </button>
                            </nav>
                        )}
                    </div>

                    {/* Navigation Système */}
                    <div className="mb-4 flex-1">
                        <button
                            onClick={() => toggleSection('systeme')}
                            className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
                        >
                            SYSTÈME
                            {expandedSections.systeme ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        {expandedSections.systeme && (
                            <nav className="space-y-1 ml-2">
                                <button
                                    onClick={() => setActiveSection('ai')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'ai' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                                >
                                    <Bot className="w-4 h-4" />
                                    IA & Voix
                                </button>
                                <button
                                    onClick={() => setActiveSection('knowledge')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'knowledge' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                                >
                                    <Database className="w-4 h-4" />
                                    Connaissances
                                </button>
                                <button
                                    onClick={() => setActiveSection('audit')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'audit' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    Audit & Logs
                                </button>
                                <button
                                    onClick={() => setActiveSection('config')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === 'config' ? "neu-inset text-primary font-semibold" : "neu-raised hover:shadow-neo-md"}`}
                                >
                                    <Settings className="w-4 h-4" />
                                    Configuration
                                </button>
                            </nav>
                        )}
                    </div>

                    {/* Footer Sidebar */}
                    <div className="mt-auto pt-4 border-t border-border">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm neu-raised hover:shadow-neo-md transition-all mb-1"
                        >
                            {mounted && theme === "dark" ? (
                                <>
                                    <Sun className="w-4 h-4" /> Mode clair
                                </>
                            ) : (
                                <>
                                    <Moon className="w-4 h-4" /> Mode sombre
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

                {/* Contenu Principal */}
                <main className="flex-1">
                    <div className="neu-card p-8 min-h-[calc(100vh-3rem)]">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-10">
                            <div className="flex items-start gap-4">
                                <div className="neu-raised w-16 h-16 rounded-full flex items-center justify-center p-3 shrink-0">
                                    <img
                                        src={emblemGabon}
                                        alt="Emblème"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-1">Administration Système</h1>
                                    <p className="text-sm text-muted-foreground">Gestion globale de la plateforme iAsted</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={() => setIsIAstedOpen(true)}
                                    className="bg-primary text-white hover:bg-primary/90"
                                >
                                    <Bot className="mr-2 h-4 w-4" /> Ouvrir iAsted
                                </Button>
                            </div>
                        </div>

                        {/* Contenu Dynamique */}
                        <div className="space-y-6">
                            {activeSection === 'dashboard' && (
                                <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Card className="neu-raised border-none">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">128</div>
                                                <p className="text-xs text-muted-foreground">+4 depuis hier</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="neu-raised border-none">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Santé Système</CardTitle>
                                                <Server className="h-4 w-4 text-green-500" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-green-600">Opérationnel</div>
                                                <p className="text-xs text-muted-foreground">Uptime 99.9%</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="neu-raised border-none">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Alertes Sécurité</CardTitle>
                                                <ShieldAlert className="h-4 w-4 text-yellow-500" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">0</div>
                                                <p className="text-xs text-muted-foreground">Aucune menace détectée</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="neu-raised border-none">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Requêtes iAsted</CardTitle>
                                                <Activity className="h-4 w-4 text-blue-500" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">1,429</div>
                                                <p className="text-xs text-muted-foreground">+12% cette semaine</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card className="neu-raised border-none">
                                        <CardHeader>
                                            <CardTitle>Activités Récentes</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <AuditLogSection />
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {activeSection === 'feedbacks' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                                        <Card className="neu-raised border-none p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-lg bg-primary/10">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Feedbacks</p>
                                                    <p className="text-2xl font-bold">{feedbacks.length}</p>
                                                </div>
                                            </div>
                                        </Card>
                                        <Card className="neu-raised border-none p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-lg bg-secondary/10">
                                                    <Eye className="h-6 w-6 text-secondary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">En attente</p>
                                                    <p className="text-2xl font-bold">
                                                        {feedbacks.filter((f) => !f.status || f.status === "pending").length}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                        <Card className="neu-raised border-none p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-lg bg-accent/10">
                                                    <Download className="h-6 w-6 text-accent" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Traités</p>
                                                    <p className="text-2xl font-bold">
                                                        {feedbacks.filter((f) => f.status === "processed").length}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    <Card className="neu-raised border-none p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-bold">Feedbacks des responsables</h2>
                                            <div className="flex gap-2">
                                                <Button variant="outline" onClick={exportToCSV} className="gap-2">
                                                    <FileSpreadsheet className="h-4 w-4" /> Exporter CSV
                                                </Button>
                                                <Button variant="outline" onClick={exportToPDF} className="gap-2">
                                                    <FileText className="h-4 w-4" /> Exporter PDF
                                                </Button>
                                            </div>
                                        </div>
                                        {loadingFeedbacks ? (
                                            <p className="text-center text-muted-foreground py-8">Chargement...</p>
                                        ) : feedbacks.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">Aucun feedback pour le moment</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Rôle</TableHead>
                                                            <TableHead>Email</TableHead>
                                                            <TableHead>Description</TableHead>
                                                            <TableHead>Suggestions</TableHead>
                                                            <TableHead>Docs</TableHead>
                                                            <TableHead>Statut</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {feedbacks.map((feedback) => (
                                                            <TableRow key={feedback.id}>
                                                                <TableCell className="whitespace-nowrap">
                                                                    {new Date(feedback.created_at).toLocaleDateString("fr-FR")}
                                                                </TableCell>
                                                                <TableCell className="font-medium">{feedback.role_name}</TableCell>
                                                                <TableCell>{feedback.user_email}</TableCell>
                                                                <TableCell className="max-w-xs truncate">{feedback.role_description}</TableCell>
                                                                <TableCell className="max-w-xs truncate">{feedback.implementation_suggestions || "-"}</TableCell>
                                                                <TableCell>
                                                                    {feedback.document_paths && feedback.document_paths.length > 0 ? (
                                                                        <Button variant="outline" size="sm" onClick={() => handleViewDocuments(feedback)}>
                                                                            <Paperclip className="h-4 w-4 mr-2" /> {feedback.document_paths.length}
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            )}

                            {activeSection === 'users' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <UserManagementSection />
                                </div>
                            )}

                            {activeSection === 'ai' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <AIConfigSection />
                                </div>
                            )}

                            {activeSection === 'knowledge' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <KnowledgeBaseSection />
                                </div>
                            )}

                            {activeSection === 'audit' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <AuditLogSection />
                                </div>
                            )}

                            {activeSection === 'config' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Card className="neu-raised border-none">
                                        <CardHeader>
                                            <CardTitle>Configuration Système</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground">Paramètres globaux de l'application (Maintenance, Variables, etc.)</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Documents Viewer Modal */}
            {selectedFeedback && (
                <FeedbackDocumentsViewer
                    isOpen={showDocuments}
                    onClose={() => {
                        setShowDocuments(false);
                        setSelectedFeedback(null);
                    }}
                    documentPaths={selectedFeedback.document_paths || []}
                    feedbackId={selectedFeedback.id}
                />
            )}
        </div>
    );
};

export default AdminSpace;
