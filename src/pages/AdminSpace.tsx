import React, { useState } from 'react';
import { useUserContext } from '@/hooks/useUserContext';
import IAstedInterface from '@/components/iasted/IAstedInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ShieldAlert, Settings, Activity, Server, Database, Bot } from 'lucide-react';
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

// Admin Components
import { AIConfigSection } from '@/components/admin/AIConfigSection';
import { KnowledgeBaseSection } from '@/components/admin/KnowledgeBaseSection';
import { UserManagementSection } from '@/components/admin/UserManagementSection';
import { AuditLogSection } from '@/components/admin/AuditLogSection';

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
    const [activeTab, setActiveTab] = useState('dashboard');
    const { toast } = useToast();
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [showDocuments, setShowDocuments] = useState(false);

    // Feedback Data
    const { data: feedbacks = [], isLoading: loadingFeedbacks, error: feedbackError } = useFeedbacks();
    useRealtimeFeedbacks();

    if (feedbackError) {
        toast({
            title: "Erreur",
            description: "Impossible de charger les feedbacks",
            variant: "destructive",
        });
    }

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
        return <div className="flex items-center justify-center h-screen text-red-500">Accès refusé. Réservé aux administrateurs.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Administration Système</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestion globale de la plateforme iAsted</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setIsIAstedOpen(true)}
                        className="bg-primary text-white hover:bg-primary/90"
                    >
                        Ouvrir iAsted
                    </Button>
                    <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">{profile?.full_name || 'Admin'}</div>
                        <div className="text-xs text-gray-500">Super Admin</div>
                    </div>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-7 lg:w-full">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="feedbacks" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Feedbacks
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Utilisateurs
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" /> IA & Voix
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="flex items-center gap-2">
                        <Database className="h-4 w-4" /> Connaissances
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Audit
                    </TabsTrigger>
                    <TabsTrigger value="config" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Config
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">128</div>
                                <p className="text-xs text-muted-foreground">+4 depuis hier</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Santé Système</CardTitle>
                                <Server className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">Opérationnel</div>
                                <p className="text-xs text-muted-foreground">Uptime 99.9%</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Alertes Sécurité</CardTitle>
                                <ShieldAlert className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">Aucune menace détectée</p>
                            </CardContent>
                        </Card>
                        <Card>
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

                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Activités Récentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AuditLogSection />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedbacks" className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <Card className="p-6">
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
                        <Card className="p-6">
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
                        <Card className="p-6">
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

                    <Card className="p-6">
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
                </TabsContent>

                <TabsContent value="users">
                    <UserManagementSection />
                </TabsContent>

                <TabsContent value="ai">
                    <AIConfigSection />
                </TabsContent>

                <TabsContent value="knowledge">
                    <KnowledgeBaseSection />
                </TabsContent>

                <TabsContent value="audit">
                    <AuditLogSection />
                </TabsContent>

                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Système</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Paramètres globaux de l'application (Maintenance, Variables, etc.)</p>
                            {/* Future SystemConfigSection */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* iAsted Interface */}
            <IAstedInterface
                isOpen={isIAstedOpen}
                onClose={() => setIsIAstedOpen(false)}
                userRole={role || 'admin'}
            />

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
