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
    if (!config?.agentId) {
      console.error('No agent ID configured');
      return;
    }
    
    if (isActive) {
      stopContinuousMode();
    } else {
      await startContinuousMode();
    }
  };

  const handleSettingsChange = (settings: { pushToTalk: boolean; focusMode: boolean }) => {
    console.log('Settings changed:', settings);
  };

  const handleCreateAgent = async () => {
    setIsCreatingAgent(true);
    try {
      // Créer l'agent via l'edge function
      const { data, error } = await supabase.functions.invoke('create-elevenlabs-agent', {
        body: {
          agentName: 'iAsted',
          presidentVoiceId: config?.presidentVoiceId || '9BWtsMINqrJLrRacOk9x',
          ministerVoiceId: config?.ministerVoiceId || 'EXAVITQu4vr4xnSDxMaL',
          defaultVoiceId: config?.defaultVoiceId || 'Xb7hH8MSUJpSbSDYk0k2',
        }
      });

      if (error) throw error;

      // Récupérer l'ID de la config existante
      const { data: existingConfig } = await supabase
        .from('iasted_config')
        .select('id')
        .single();

      if (!existingConfig) throw new Error('Config not found');

      // Mettre à jour la config dans la DB
      const { error: updateError } = await supabase
        .from('iasted_config')
        .update({
          agent_id: data.agentId,
          agent_name: data.agentName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id);

      if (updateError) throw updateError;

      toast({
        title: "Agent créé",
        description: "L'agent iAsted a été créé avec succès",
      });

      // Recharger la page pour obtenir la nouvelle config
      window.location.reload();
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'agent",
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
                ? "⚠️ Agent non configuré - Allez dans les paramètres"
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
                <VoiceButton
                  isActive={isActive}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onToggle={handleToggle}
                />
              ) : !isLoadingConfig ? (
                <>
                  <Button 
                    onClick={handleCreateAgent}
                    disabled={isCreatingAgent}
                    className="gap-2"
                  >
                    {isCreatingAgent ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Créer l'agent iAsted automatiquement
                      </>
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground max-w-md">
                    Aucun agent configuré. Cliquez pour créer automatiquement un agent ElevenLabs.
                  </p>
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
