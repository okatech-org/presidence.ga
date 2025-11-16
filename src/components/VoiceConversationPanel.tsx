import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { VoiceSettings } from './VoiceSettings';
import { useContinuousConversation } from '@/hooks/useContinuousConversation';
import { useIastedAgent } from '@/hooks/useIastedAgent';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VoiceConversationHandle {
  toggleVoiceMode: () => void;
}

interface VoiceConversationPanelProps {
  userRole: 'president' | 'minister' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
  autoActivate?: boolean;
  onVoiceModeChange?: (isActive: boolean) => void;
}

export const VoiceConversationPanel = forwardRef<VoiceConversationHandle, VoiceConversationPanelProps>(({
  userRole,
  onSpeakingChange,
  autoActivate = false,
  onVoiceModeChange,
}, ref) => {
  const { toast } = useToast();
  const { config, isLoading: isLoadingConfig } = useIastedAgent();
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  
  const {
    status,
    isSpeaking,
    startContinuousMode,
    stopContinuousMode,
  } = useContinuousConversation(userRole, config?.agentId || '');

  const isActive = status === 'connected';
  const isListening = status === 'connected' && !isSpeaking;

  // Notifier le parent quand le mode vocal change
  useEffect(() => {
    onVoiceModeChange?.(isActive);
  }, [isActive, onVoiceModeChange]);

  // Exposer la fonction de toggle pour permettre de basculer depuis l'extérieur
  useImperativeHandle(ref, () => ({
    toggleVoiceMode: handleToggle,
  }));

  const handleToggle = async () => {
    console.log('[VoiceConversationPanel] handleToggle appelé');
    console.log('[VoiceConversationPanel] config:', config);
    console.log('[VoiceConversationPanel] isActive:', isActive);
    console.log('[VoiceConversationPanel] status:', status);
    
    if (!config?.agentId) {
      console.error('[VoiceConversationPanel] ❌ Pas d\'agent ID configuré');
      toast({
        title: "Agent non configuré",
        description: "Veuillez d'abord créer un agent iAsted",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (isActive) {
        console.log('[VoiceConversationPanel] Arrêt de la conversation...');
        stopContinuousMode();
      } else {
        console.log('[VoiceConversationPanel] Démarrage de la conversation...');
        await startContinuousMode();
        console.log('[VoiceConversationPanel] ✅ Conversation démarrée');
      }
    } catch (error) {
      console.error('[VoiceConversationPanel] ❌ Erreur toggle:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de démarrer la conversation",
        variant: "destructive",
      });
    }
  };

  const handleSettingsChange = (settings: { pushToTalk: boolean; focusMode: boolean }) => {
    console.log('Settings changed:', settings);
  };

  const handleCreateAgent = async () => {
    console.log('[VoiceConversationPanel] 🚀 Début création agent...');
    setIsCreatingAgent(true);
    
    try {
      console.log('[VoiceConversationPanel] Appel edge function create-elevenlabs-agent...');
      
      // Créer l'agent via l'edge function
      const { data, error } = await supabase.functions.invoke('create-elevenlabs-agent', {
        body: {
          agentName: 'iAsted',
          presidentVoiceId: config?.presidentVoiceId || '9BWtsMINqrJLrRacOk9x',
          ministerVoiceId: config?.ministerVoiceId || 'EXAVITQu4vr4xnSDxMaL',
          defaultVoiceId: config?.defaultVoiceId || 'Xb7hH8MSUJpSbSDYk0k2',
        }
      });

      console.log('[VoiceConversationPanel] Réponse edge function:', { data, error });

      if (error) {
        console.error('[VoiceConversationPanel] ❌ Erreur edge function:', error);
        throw error;
      }

      if (!data?.agentId) {
        console.error('[VoiceConversationPanel] ❌ Pas d\'agentId dans la réponse:', data);
        throw new Error('Agent ID non reçu dans la réponse');
      }

      console.log('[VoiceConversationPanel] ✅ Agent créé avec ID:', data.agentId);

      // Récupérer l'ID de la config existante
      console.log('[VoiceConversationPanel] Récupération config existante...');
      const { data: existingConfig, error: configError } = await supabase
        .from('iasted_config')
        .select('id')
        .single();

      if (configError) {
        console.error('[VoiceConversationPanel] ❌ Erreur récupération config:', configError);
        throw new Error(`Erreur config: ${configError.message}`);
      }

      if (!existingConfig) {
        console.error('[VoiceConversationPanel] ❌ Config non trouvée');
        throw new Error('Configuration iAsted non trouvée');
      }

      console.log('[VoiceConversationPanel] Config existante trouvée:', existingConfig.id);

      // Mettre à jour la config dans la DB
      console.log('[VoiceConversationPanel] Mise à jour config avec agent ID...');
      const { error: updateError } = await supabase
        .from('iasted_config')
        .update({
          agent_id: data.agentId,
          agent_name: data.agentName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id);

      if (updateError) {
        console.error('[VoiceConversationPanel] ❌ Erreur update config:', updateError);
        throw new Error(`Erreur mise à jour: ${updateError.message}`);
      }

      console.log('[VoiceConversationPanel] ✅ Config mise à jour avec succès');

      toast({
        title: "✅ Agent créé avec succès",
        description: `Agent iAsted créé (ID: ${data.agentId.substring(0, 8)}...)`,
      });

      // Recharger la page pour obtenir la nouvelle config
      console.log('[VoiceConversationPanel] Rechargement de la page...');
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (error) {
      console.error('[VoiceConversationPanel] ❌ ERREUR CRÉATION AGENT:', error);
      toast({
        title: "❌ Erreur création agent",
        description: error instanceof Error ? error.message : "Impossible de créer l'agent. Vérifiez que la clé API ElevenLabs est configurée.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  return (
    <Tabs defaultValue="conversation" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="conversation">Conversation</TabsTrigger>
        <TabsTrigger value="settings">
          <SettingsIcon className="w-4 h-4 mr-2" />
          Paramètres
        </TabsTrigger>
      </TabsList>

      <TabsContent value="conversation">
        <Card className="w-full border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Conversation Vocale avec iAsted
            </CardTitle>
            <CardDescription>
              {isLoadingConfig
                ? "⏳ Chargement de la configuration..."
                : !config?.agentId
                ? "⚠️ Agent non configuré - Cliquez sur 'Créer l'agent' ci-dessous"
                : isActive
                ? isSpeaking
                  ? "🗣️ iAsted parle..."
                  : "🎤 Vous pouvez parler, je vous écoute..."
                : "Cliquez sur Démarrer pour lancer la conversation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Indicateur de statut */}
            <div className="flex items-center justify-center p-6 rounded-lg bg-muted/50">
              <div className="flex flex-col items-center gap-3">
                {isActive ? (
                  <>
                    <div className={cn(
                      "relative w-20 h-20 rounded-full flex items-center justify-center",
                      isSpeaking 
                        ? "bg-gradient-to-br from-cyan-500 to-blue-500 animate-pulse" 
                        : "bg-gradient-to-br from-green-500 to-emerald-500"
                    )}>
                      {isSpeaking ? (
                        <Volume2 className="h-10 w-10 text-white" />
                      ) : (
                        <Mic className="h-10 w-10 text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium">
                        {isSpeaking ? "iAsted parle..." : "Écoute en cours..."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Conversation active
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-muted">
                      <MicOff className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">
                        Conversation inactive
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cliquez sur Démarrer pour commencer
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Contrôles */}
            <div className="flex flex-col items-center gap-3">
              {(!isLoadingConfig && config?.agentId) ? (
                <>
                  <VoiceButton
                    isActive={isActive}
                    isListening={isListening}
                    isSpeaking={isSpeaking}
                    onToggle={handleToggle}
                  />
                  <p className="text-xs text-muted-foreground">
                    Agent ID: {config.agentId.substring(0, 8)}...
                  </p>
                </>
              ) : !isLoadingConfig ? (
                <>
                  <Button 
                    onClick={handleCreateAgent}
                    disabled={isCreatingAgent}
                    className="gap-2"
                    size="lg"
                  >
                    {isCreatingAgent ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Créer l'agent iAsted
                      </>
                    )}
                  </Button>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground max-w-md">
                      Aucun agent vocal configuré. Cliquez pour créer automatiquement un agent ElevenLabs.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Nécessite une clé API ElevenLabs valide configurée dans les secrets
                    </p>
                  </div>
                </>
              ) : (
                <Button disabled variant="outline">
                  Chargement...
                </Button>
              )}
            </div>

            {/* Indicateurs d'état */}
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              {isListening && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span>Écoute active</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>iAsted parle</span>
                </div>
              )}
              {isActive && !isListening && !isSpeaking && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Prêt</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <VoiceSettings onSettingsChange={handleSettingsChange} />
      </TabsContent>
    </Tabs>
  );
});
