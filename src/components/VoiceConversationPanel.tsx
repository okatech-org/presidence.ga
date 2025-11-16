import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, User, Bot, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { VoiceSettings } from './VoiceSettings';
import { useOpenAIWebRTC } from '@/hooks/useOpenAIWebRTC';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [pushToTalk, setPushToTalk] = useState(false);
  
  const {
    isConnected,
    isSpeaking,
    isListening,
    startConversation,
    stopConversation,
  } = useOpenAIWebRTC({
    userRole,
    onSpeakingChange,
    autoStart: autoActivate,
  });

  const isActive = isConnected;

  // Notifier le parent quand le mode vocal change
  useEffect(() => {
    onVoiceModeChange?.(isActive);
  }, [isActive, onVoiceModeChange]);

  // Exposer la fonction de toggle pour permettre de basculer depuis l'extérieur
  useImperativeHandle(ref, () => ({
    toggleVoiceMode: handleToggle,
  }));

  const handleToggle = async () => {
    if (isActive) {
      stopConversation();
    } else {
      await startConversation();
    }
  };

  const handleSettingsChange = (settings: { pushToTalk: boolean }) => {
    setPushToTalk(settings.pushToTalk);
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
            <div className="flex justify-center gap-3">
              <VoiceButton
                isActive={isActive}
                isListening={isListening}
                isSpeaking={isSpeaking}
                onToggle={handleToggle}
              />
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
