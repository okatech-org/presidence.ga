import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, Globe, Youtube, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface IntelligenceItem {
    id: string;
    content: string;
    summary: string;
    category: 'securite' | 'economie' | 'social' | 'politique' | 'rumeur' | 'autre';
    sentiment: 'positif' | 'negatif' | 'neutre' | 'colere' | 'peur' | 'joie';
    author: string;
    published_at: string;
    source_type?: string; // Déduit de l'auteur ou autre
}

export const IntelligenceFeed = () => {
    const [items, setItems] = useState<IntelligenceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchItems = async () => {
        setLoading(true);
        let query = supabase
            .from('intelligence_items')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(50);

        if (filter !== 'all') {
            query = query.eq('category', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching intelligence:', error);
        } else {
            setItems(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();

        // Realtime subscription
        const channel = supabase
            .channel('intelligence_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'intelligence_items' }, (payload) => {
                console.log('New intelligence item:', payload);
                setItems(prev => [payload.new as any, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filter]);

    const getSourceIcon = (author: string) => {
        if (author.includes('whatsapp')) return <MessageSquare className="h-4 w-4 text-green-500" />;
        if (author.includes('youtube')) return <Youtube className="h-4 w-4 text-red-500" />;
        return <Globe className="h-4 w-4 text-blue-500" />;
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'negatif':
            case 'colere':
            case 'peur': return 'bg-red-100 text-red-800 border-red-200';
            case 'positif':
            case 'joie': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            securite: 'bg-red-500',
            economie: 'bg-blue-500',
            social: 'bg-yellow-500',
            politique: 'bg-purple-500',
            rumeur: 'bg-orange-500',
            autre: 'bg-gray-500'
        };
        return <Badge className={`${colors[category] || 'bg-gray-500'} hover:${colors[category]}`}>{category.toUpperCase()}</Badge>;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Flux en Temps Réel</h3>
                <div className="flex gap-2">
                    {['all', 'securite', 'politique', 'social', 'rumeur'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs rounded-full border ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                        >
                            {f === 'all' ? 'Tout' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : items.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">Aucune donnée capturée pour le moment.</div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md border-l-4" style={{ borderLeftColor: item.sentiment === 'negatif' ? '#ef4444' : item.sentiment === 'positif' ? '#22c55e' : '#e5e7eb' }}>
                                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                                    <div className="flex items-center gap-2">
                                        {getSourceIcon(item.author)}
                                        <span className="text-xs font-mono text-muted-foreground">{item.author}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {getCategoryBadge(item.category || 'autre')}
                                        <Badge variant="outline" className={getSentimentColor(item.sentiment || 'neutre')}>
                                            {item.sentiment || 'neutre'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <p className="text-sm font-medium mb-1">{item.summary || "En attente d'analyse..."}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.content}</p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: fr })}
                                        </div>
                                        {item.summary ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};
