import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, MessageSquare, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
}

const ConversationHistory = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('conversation_sessions')
        .select('id, started_at, ended_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;

      // Compter les messages pour chaque session
      const sessionsWithCount = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { count } = await supabase
            .from('conversation_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          return {
            ...session,
            message_count: count || 0,
          };
        })
      );

      setSessions(sessionsWithCount);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session supprimée",
        description: "La conversation a été supprimée",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la session",
        variant: "destructive",
      });
    }
  };

  const filteredSessions = sessions.filter(session =>
    searchQuery === '' ||
    format(new Date(session.started_at), 'PPP', { locale: fr })
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
              </div>
            ) : (
              filteredSessions.map((session) => (
                <Card key={session.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(new Date(session.started_at), 'PPP', { locale: fr })}
                        </span>
                        {session.ended_at && (
                          <Badge variant="secondary" className="text-xs">
                            Terminée
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span>{session.message_count} message{session.message_count > 1 ? 's' : ''}</span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.started_at), 'HH:mm', { locale: fr })}
                        {session.ended_at && (
                          <> - {format(new Date(session.ended_at), 'HH:mm', { locale: fr })}</>
                        )}
                      </p>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSession(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default ConversationHistory;
