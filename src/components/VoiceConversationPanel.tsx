import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { VoiceSettings } from './VoiceSettings';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';
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
  
  // Déterminer le voice ID selon le rôle utilisateur
  const voiceId = userRole === 'president' 
    ? config?.presidentVoiceId 
    : userRole === 'minister'
    ? config?.ministerVoiceId
    : config?.defaultVoiceId;
  
  console.log('[VoiceConversationPanel] 🎙️ Voice ID configuré:', voiceId, 'pour rôle:', userRole);
  
  const {
    voiceState,
    isActive,
    isListening,
    isSpeaking,
    isThinking,
    startConversation,
    stopConversation,
    audioLevel,
  } = useVoiceInteraction({ 
    onSpeakingChange,
    silenceDuration: 2000,
    silenceThreshold: 10,
    continuousMode: false,
    voiceId: voiceId,
  });

  // Notifier le parent quand le mode vocal change
  useEffect(() => {
    onVoiceModeChange?.(isActive);
  }, [isActive, onVoiceModeChange]);

  // Auto-activer la conversation si autoActivate est true
  useEffect(() => {
    if (autoActivate && !isActive) {
      console.log('[VoiceConversationPanel] 🚀 Auto-activation de la conversation (autoActivate=true)');
      setTimeout(() => {
        startConversation();
      }, 300); // Petit délai pour laisser le modal s'ouvrir
    }
  }, [autoActivate]); // Ne se déclenche qu'une fois quand autoActivate devient true

  // Exposer la fonction de toggle pour permettre de basculer depuis l'extérieur
  useImperativeHandle(ref, () => ({
    toggleVoiceMode: handleToggle,
  }));

  const handleToggle = async () => {
    console.log('[VoiceConversationPanel] handleToggle appelé');
    console.log('[VoiceConversationPanel] isActive:', isActive);
    
    try {
      if (isActive) {
        console.log('[VoiceConversationPanel] Arrêt de la conversation...');
        stopConversation();
      } else {
        console.log('[VoiceConversationPanel] Démarrage de la conversation...');
        await startConversation();
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
              {isActive
                ? isThinking
                  ? "⚙️ Traitement en cours..."
                  : isSpeaking
                  ? "🗣️ iAsted parle..."
                  : isListening
                  ? "🎤 Vous pouvez parler, je vous écoute..."
                  : "⏳ En attente..."
                : "Assistant vocal intelligent avec GPT + ElevenLabs"}
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
              <VoiceButton
                isActive={isActive}
                isListening={isListening}
                isSpeaking={isSpeaking}
                onToggle={handleToggle}
              />
              <p className="text-xs text-muted-foreground">
                Mode direct: GPT + ElevenLabs
              </p>
            </div>

            {/* Indicateurs d'état */}
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              {isThinking && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span>Traitement...</span>
                </div>
              )}
              {isListening && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span>Enregistrement</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>iAsted parle</span>
                </div>
              )}
              {isActive && !isListening && !isSpeaking && !isThinking && (
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
        <VoiceSettings />
      </TabsContent>
    </Tabs>
  );
});
