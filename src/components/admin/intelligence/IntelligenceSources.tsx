import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, RefreshCw, Smartphone, Globe, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Source {
    id: string;
    name: string;
    type: 'whatsapp_group' | 'web_search' | 'youtube_channel';
    url: string;
    status: 'active' | 'inactive' | 'error';
    last_crawled_at: string;
}

export const IntelligenceSources = () => {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSource, setNewSource] = useState({ name: '', type: 'web_search', url: '' });
    const { toast } = useToast();

    const fetchSources = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('intelligence_sources').select('*');
        if (error) console.error(error);
        else setSources(data as any);
        setLoading(false);
    };

    useEffect(() => {
        fetchSources();
    }, []);

    const handleAddSource = async () => {
        if (!newSource.name || !newSource.url) return;

        const { error } = await supabase.from('intelligence_sources').insert([newSource]);

        if (error) {
            toast({ title: "Erreur", description: "Impossible d'ajouter la source", variant: "destructive" });
        } else {
            toast({ title: "Succès", description: "Source ajoutée avec succès" });
            setNewSource({ name: '', type: 'web_search', url: '' });
            fetchSources();
        }
    };

    const handleDeleteSource = async (id: string) => {
        const { error } = await supabase.from('intelligence_sources').delete().eq('id', id);
        if (!error) {
            toast({ title: "Supprimé", description: "Source retirée" });
            fetchSources();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'whatsapp_group': return <Smartphone className="h-4 w-4 text-green-500" />;
            case 'youtube_channel': return <Youtube className="h-4 w-4 text-red-500" />;
            default: return <Globe className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Ajouter une Source</CardTitle>
                    <CardDescription>Configurez de nouveaux points d'écoute pour le système.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="grid gap-2 flex-1">
                            <label className="text-sm font-medium">Nom</label>
                            <Input
                                placeholder="Ex: Gabon Politique"
                                value={newSource.name}
                                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2 w-[200px]">
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={newSource.type}
                                onValueChange={(v) => setNewSource({ ...newSource, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="web_search">Recherche Web (Mot-clé)</SelectItem>
                                    <SelectItem value="whatsapp_group">Groupe WhatsApp</SelectItem>
                                    <SelectItem value="youtube_channel">Chaîne YouTube</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2 flex-1">
                            <label className="text-sm font-medium">Cible (URL ou ID)</label>
                            <Input
                                placeholder="Ex: 'Gabon Économie' ou ID Groupe"
                                value={newSource.url}
                                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleAddSource}><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sources Actives</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Cible</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sources.map((source) => (
                                <TableRow key={source.id}>
                                    <TableCell>{getIcon(source.type)}</TableCell>
                                    <TableCell className="font-medium">{source.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{source.url}</TableCell>
                                    <TableCell>
                                        <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                                            {source.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSource(source.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sources.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Aucune source configurée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
