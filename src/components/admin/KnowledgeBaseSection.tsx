import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Trash2, RefreshCw, Search, Database } from 'lucide-react';
import { IASTED_AUTHORIZED_ROLES, type AppRole } from '@/config/role-contexts';

interface KnowledgeDoc {
    id: string;
    title: string;
    file_path: string;
    file_type: string;
    status: 'indexing' | 'ready' | 'error';
    access_level: AppRole[];
    created_at: string;
}

export const KnowledgeBaseSection = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // New Doc Form
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocPath, setNewDocPath] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(['admin', 'president']);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('knowledge_base')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data as any[]);
        } catch (error: any) {
            console.error('Error fetching documents:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger la base de connaissances",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddDocument = async () => {
        if (!newDocTitle || !newDocPath) return;

        setLoading(true);
        try {
            const { error } = await (supabase as any)
                .from('knowledge_base')
                .insert({
                    title: newDocTitle,
                    content: '',
                    file_path: newDocPath,
                    file_type: newDocPath.split('.').pop() || 'unknown',
                    status: 'indexing',
                    access_level: selectedRoles
                });

            if (error) throw error;

            toast({
                title: "Document ajouté",
                description: "Le document est en cours d'indexation"
            });
            setIsAddDialogOpen(false);
            setNewDocTitle('');
            setNewDocPath('');
            fetchDocuments();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDocument = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

        try {
            const { error } = await (supabase as any)
                .from('knowledge_base')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Document supprimé",
                description: "Le document a été retiré de la base"
            });
            fetchDocuments();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleReindex = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('knowledge_base')
                .update({ status: 'indexing' })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Ré-indexation lancée",
                description: "Le statut sera mis à jour une fois terminé"
            });
            fetchDocuments();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ready':
                return <Badge className="bg-green-500">Prêt</Badge>;
            case 'indexing':
                return <Badge variant="secondary" className="animate-pulse">Indexation...</Badge>;
            case 'error':
                return <Badge variant="destructive">Erreur</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const toggleRole = (role: AppRole) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Base de Connaissances (RAG)</h2>
                    <p className="text-muted-foreground">
                        Gérez les documents de référence utilisés par l'IA pour répondre aux questions.
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Upload className="mr-2 h-4 w-4" /> Ajouter un document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Ajouter un document</DialogTitle>
                            <CardDescription>
                                Référencez un document pour l'indexation vectorielle.
                            </CardDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titre du document</Label>
                                <Input
                                    id="title"
                                    value={newDocTitle}
                                    onChange={(e) => setNewDocTitle(e.target.value)}
                                    placeholder="ex: Constitution Gabonaise"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="path">Chemin du fichier / URL</Label>
                                <Input
                                    id="path"
                                    value={newDocPath}
                                    onChange={(e) => setNewDocPath(e.target.value)}
                                    placeholder="ex: /docs/constitution.pdf"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Rôles autorisés</Label>
                                <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-[200px] overflow-y-auto">
                                    {IASTED_AUTHORIZED_ROLES.map(role => (
                                        <div key={role} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-${role}`}
                                                checked={selectedRoles.includes(role)}
                                                onCheckedChange={() => toggleRole(role)}
                                            />
                                            <label
                                                htmlFor={`role-${role}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {role}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleAddDocument} disabled={loading || !newDocTitle || !newDocPath}>
                                Ajouter
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" /> Documents Indexés
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={fetchDocuments}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Accès</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Aucun document dans la base de connaissances.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {doc.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground ml-6">{doc.file_path}</div>
                                        </TableCell>
                                        <TableCell className="uppercase text-xs">{doc.file_type}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {doc.access_level.slice(0, 2).map(role => (
                                                    <Badge key={role} variant="outline" className="text-[10px]">{role}</Badge>
                                                ))}
                                                {doc.access_level.length > 2 && (
                                                    <Badge variant="outline" className="text-[10px]">+{doc.access_level.length - 2}</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleReindex(doc.id)}
                                                    title="Ré-indexer"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
