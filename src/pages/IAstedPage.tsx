import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, History, Settings, Activity } from 'lucide-react';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';
import { ChatDock } from '@/components/ChatDock';
import { VoiceSettings } from '@/components/VoiceSettings';
import { usePresidentRole } from '@/hooks/usePresidentRole';
import { toast } from 'sonner';

interface ConversationSession {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
}

const IAstedPage = () => {
  const navigate = useNavigate();
  const { isPresident } = usePresidentRole();
  const [activeTab, setActiveTab] = useState('conversation');
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>();
  const [voiceConfig, setVoiceConfig] = useState({
    silenceDuration: 2000,
    silenceThreshold: 10,
    continuousMode: false,
  });

  const userRole = isPresident ? 'president' : 'minister';

  const {
    voiceState,
    sessionId,
    conversationMessages,
    audioLevel,
    isPaused,
    isIdle,
    isListening,
    isThinking,
    isSpeaking,
    isActive,
    startConversation,
    stopConversation,
    startListening,
    stopListening,
    cancelInteraction,
    setSelectedVoiceId: setVoiceId,
    togglePause,
  } = useVoiceInteraction({
    silenceDuration: voiceConfig.silenceDuration,
    silenceThreshold: voiceConfig.silenceThreshold,
    continuousMode: voiceConfig.continuousMode,
    voiceId: selectedVoiceId,
  });

  useEffect(() => {
    loadVoiceConfig();
    loadSessions();
  }, []);

  const loadVoiceConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('iasted_config')
        .select('president_voice_id, minister_voice_id, default_voice_id')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        const voiceId = isPresident 
          ? data.president_voice_id 
          : data.minister_voice_id || data.default_voice_id;
        setSelectedVoiceId(voiceId);
        setVoiceId(voiceId);
      }
    } catch (error) {
      console.error('Erreur chargement config voix:', error);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversation_sessions')
        .select(`
          id,
          title,
          started_at,
          ended_at,
          conversation_messages(count)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedSessions: ConversationSession[] = (data || []).map((session: any) => ({
        id: session.id,
        title: session.title || `Session ${new Date(session.started_at).toLocaleString('fr-FR')}`,
        started_at: session.started_at,
        ended_at: session.ended_at,
        message_count: session.conversation_messages?.[0]?.count || 0,
      }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      toast.error('Impossible de charger l\'historique');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleStartConversation = async () => {
    try {
      await startConversation();
      setActiveTab('conversation');
    } catch (error) {
      console.error('Erreur démarrage:', error);
    }
  };

  const handleStopConversation = async () => {
    await stopConversation();
    await loadSessions();
  };

  const handleVoiceConfigChange = (config: typeof voiceConfig) => {
    setVoiceConfig(config);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              iAsted - Assistant Vocal Intelligent
            </h1>
            <p className="text-muted-foreground mt-2">
              {isPresident 
                ? 'Monsieur le Président, votre assistant stratégique'
                : 'Excellence, votre assistant ministériel'}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="conversation">
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversation
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Vocale</CardTitle>
                <CardDescription>
                  Parlez avec iAsted en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        isIdle ? 'bg-gray-400' :
                        isListening ? 'bg-green-500 animate-pulse' :
                        isThinking ? 'bg-yellow-500 animate-pulse' :
                        isSpeaking ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium">
                        {isIdle ? 'Inactif' :
                         isListening ? 'Écoute...' :
                         isThinking ? 'Réflexion...' :
                         isSpeaking ? 'Parle...' :
                         'Inconnu'}
                      </span>
                    </div>
                    
                    {isActive && (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${audioLevel}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(audioLevel)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!isActive ? (
                      <Button onClick={handleStartConversation}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Démarrer
                      </Button>
                    ) : (
                      <>
                        {isPaused && (
                          <Button variant="outline" onClick={togglePause}>
                            Reprendre
                          </Button>
                        )}
                        {!isPaused && isListening && (
                          <Button variant="outline" onClick={stopListening}>
                            Arrêter l'écoute
                          </Button>
                        )}
                        {isSpeaking && (
                          <Button variant="outline" onClick={cancelInteraction}>
                            Interrompre
                          </Button>
                        )}
                        {isThinking && (
                          <Button variant="outline" onClick={cancelInteraction}>
                            Annuler
                          </Button>
                        )}
                        <Button variant="destructive" onClick={handleStopConversation}>
                          Terminer
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-[500px]">
                  <ChatDock messages={conversationMessages} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Conversations</CardTitle>
                <CardDescription>
                  Consultez vos sessions précédentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-12">
                    <Activity className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune conversation enregistrée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <Card key={session.id} className="cursor-pointer hover:bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{session.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(session.started_at).toLocaleString('fr-FR')}
                                {session.ended_at && (
                                  <> - {new Date(session.ended_at).toLocaleString('fr-FR')}</>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {session.message_count} messages
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast.info('Fonctionnalité à venir');
                              }}
                            >
                              Voir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <VoiceSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IAstedPage;

