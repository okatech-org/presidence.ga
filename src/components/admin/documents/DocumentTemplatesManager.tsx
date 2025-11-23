import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Trash2, FileText, Layout } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    structure: any;
    created_at: string;
}

export const DocumentTemplatesManager = () => {
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        structure: '{}'
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('document_templates' as any)
                .select('*')
                .order('name');

            if (error) throw error;
            setTemplates((data as any) || []);
        } catch (error: any) {
            console.error('Error fetching templates:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les modèles.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || '',
            structure: JSON.stringify(template.structure, null, 2)
        });
        setIsEditing(true);
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setFormData({
            name: 'Nouveau Modèle',
            description: '',
            structure: JSON.stringify({
                sections: [
                    { type: 'header', visible: true },
                    { type: 'title', visible: true },
                    { type: 'body', visible: true },
                    { type: 'footer', visible: true }
                ]
            }, null, 2)
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast({
                title: "Erreur",
                description: "Le nom du modèle est requis.",
                variant: "destructive"
            });
            return;
        }

        let parsedStructure = {};
        try {
            parsedStructure = JSON.parse(formData.structure);
        } catch (e) {
            toast({
                title: "Erreur JSON",
                description: "La structure JSON est invalide.",
                variant: "destructive"
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                structure: parsedStructure
            };

            let error;
            if (selectedTemplate) {
                // Update
                const { error: updateError } = await supabase
                    .from('document_templates' as any)
                    .update(payload)
                    .eq('id', selectedTemplate.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('document_templates' as any)
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;

            toast({
                title: "Succès",
                description: "Modèle enregistré avec succès.",
            });
            fetchTemplates();
            setIsEditing(false);
            setSelectedTemplate(null);
        } catch (error: any) {
            console.error('Error saving template:', error);
            toast({
                title: "Erreur",
                description: "Erreur lors de l'enregistrement: " + error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return;

        try {
            const { error } = await supabase
                .from('document_templates' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Succès",
                description: "Modèle supprimé.",
            });
            fetchTemplates();
            if (selectedTemplate?.id === id) {
                setSelectedTemplate(null);
                setIsEditing(false);
            }
        } catch (error: any) {
            console.error('Error deleting template:', error);
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le modèle.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* List Column */}
            <Card className="md:col-span-1 flex flex-col h-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Modèles</CardTitle>
                        <Button size="sm" onClick={handleCreateNew} variant="outline">
                            <Plus className="h-4 w-4 mr-1" /> Nouveau
                        </Button>
                    </div>
                    <CardDescription>Liste des modèles disponibles</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-2 space-y-1">
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : templates.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground p-4">Aucun modèle trouvé.</p>
                            ) : (
                                templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${selectedTemplate?.id === template.id
                                            ? "bg-secondary text-secondary-foreground"
                                            : "hover:bg-muted"
                                            }`}
                                        onClick={() => handleSelectTemplate(template)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="h-4 w-4 flex-shrink-0" />
                                            <div className="truncate">
                                                <p className="text-sm font-medium truncate">{template.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Editor Column */}
            <Card className="md:col-span-2 flex flex-col h-full">
                {isEditing ? (
                    <>
                        <CardHeader>
                            <CardTitle>{selectedTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}</CardTitle>
                            <CardDescription>Définissez les propriétés et la structure du document.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 overflow-y-auto">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom du modèle</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Lettre de mission"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Description courte de l'usage..."
                                />
                            </div>

                            <Separator />

                            <div className="space-y-2 h-full flex flex-col">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="structure">Structure (JSON)</Label>
                                    <span className="text-xs text-muted-foreground">Configuration avancée</span>
                                </div>
                                <Textarea
                                    id="structure"
                                    value={formData.structure}
                                    onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                                    className="font-mono text-xs flex-1 min-h-[200px]"
                                    placeholder="{ ... }"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Définissez les sections, l'ordre et les propriétés par défaut.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t p-4">
                            {selectedTemplate && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(selectedTemplate.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                                </Button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" /> Enregistrer
                                </Button>
                            </div>
                        </CardFooter>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                        <Layout className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">Aucun modèle sélectionné</h3>
                        <p className="text-sm text-center max-w-xs mt-2">
                            Sélectionnez un modèle dans la liste ou créez-en un nouveau pour commencer l'édition.
                        </p>
                        <Button onClick={handleCreateNew} className="mt-6">
                            <Plus className="mr-2 h-4 w-4" /> Créer un modèle
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
