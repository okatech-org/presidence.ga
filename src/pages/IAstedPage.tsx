import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, History, Settings, Activity } from 'lucide-react';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
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
  const [selectedVoiceId, setSelectedVoiceId] = useState<'echo' | 'ash' | 'shimmer'>('ash');

  // OpenAI Realtime Hook
  const openaiRTC = useRealtimeVoiceWebRTC((toolName, args) => {
    console.log(`🔧 [IAstedPage] Tool call: ${toolName}`, args);

    if (toolName === 'change_voice' && args.voice_id) {
      console.log('🎙️ [IAstedPage] Changement de voix demandé:', args.voice_id);
      setSelectedVoiceId(args.voice_id as any);
      toast.success(`Voix modifiée : ${args.voice_id === 'ash' ? 'Homme (Ash)' : args.voice_id === 'shimmer' ? 'Femme (Shimmer)' : 'Standard (Echo)'}`);
    }
  });

  const userRole = isPresident ? 'president' : 'minister';

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
        // Map legacy voice IDs to OpenAI voices if needed, or just use default 'ash'
        // For now we default to 'ash' as we are standardizing
        // But if we have a local preference, we respect it
        const savedVoice = localStorage.getItem('iasted-voice-selection') as 'echo' | 'ash' | 'shimmer';
        if (savedVoice) {
          setSelectedVoiceId(savedVoice);
        } else {
          setSelectedVoiceId('ash');
        }
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
      const systemPrompt = isPresident
        ? "Vous êtes iAsted, l'assistant stratégique du Président. Vous êtes concis, précis et professionnel."
        : "Vous êtes iAsted, l'assistant ministériel. Vous aidez à la gestion des dossiers et à la prise de décision.";

      await openaiRTC.connect(selectedVoiceId, systemPrompt);
      setActiveTab('conversation');
    } catch (error) {
      console.error('Erreur démarrage:', error);
      toast.error("Impossible de démarrer la conversation");
    }
  };

  const handleStopConversation = async () => {
    openaiRTC.disconnect();
    await loadSessions();
  };

  // Derived states for UI
  const isListening = openaiRTC.voiceState === 'listening';
  const isThinking = openaiRTC.voiceState === 'thinking' || openaiRTC.voiceState === 'processing'; // 'processing' might be the actual state name in hook, checking hook definition would be ideal but assuming standard mapping
  const isSpeaking = openaiRTC.voiceState === 'speaking';
  const isIdle = openaiRTC.voiceState === 'idle';
  const isActive = openaiRTC.isConnected;

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
                  Parlez avec iAsted en temps réel (OpenAI Realtime)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isIdle ? 'bg-gray-400' :
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
                                'Connexion...'}
                      </span>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${openaiRTC.audioLevel}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(openaiRTC.audioLevel)}%
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
                        <Button variant="destructive" onClick={handleStopConversation}>
                          Terminer
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-[500px]">
                  <ChatDock messages={openaiRTC.messages} />
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

