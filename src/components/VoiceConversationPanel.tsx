import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, User, Bot, Settings as SettingsIcon } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { VoiceSettings } from './VoiceSettings';
import { useContinuousConversation } from '@/hooks/useContinuousConversation';
import { useIastedAgent } from '@/hooks/useIastedAgent';
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
  const { config: agentConfig, isLoading: isLoadingAgent } = useIastedAgent();
  
  const {
    isActive,
    isSpeaking,
    messages,
    startContinuousMode,
    stopContinuousMode,
  } = useContinuousConversation(
    userRole,
    agentConfig?.agentId || ''
  );

  const isListening = isActive && !isSpeaking;

  // Notifier le parent quand le mode vocal change
  useEffect(() => {
    onVoiceModeChange?.(isActive);
  }, [isActive, onVoiceModeChange]);

  // Auto-activer la conversation vocale au montage si demandé
  useEffect(() => {
    if (autoActivate && !isActive && agentConfig?.agentId) {
      startContinuousMode();
    }
  }, [autoActivate, agentConfig]); // Ne dépend que de autoActivate pour s'exécuter une seule fois

  // Exposer la fonction de toggle pour permettre de basculer depuis l'extérieur
  useImperativeHandle(ref, () => ({
    toggleVoiceMode: handleToggle,
  }));

  const handleToggle = async () => {
    if (!agentConfig?.agentId) {
      return;
    }
    
    if (isActive) {
      stopContinuousMode();
    } else {
      await startContinuousMode();
    }
  };

  const handleSettingsChange = (settings: { pushToTalk: boolean }) => {
    setPushToTalk(settings.pushToTalk);
  };

  if (isLoadingAgent) {
    return (
      <Card className="w-full border-0 shadow-none">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Chargement de l'agent iAsted...</p>
        </CardContent>
      </Card>
    );
  }

  if (!agentConfig?.agentId) {
    return (
      <Card className="w-full border-0 shadow-none">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Agent iAsted non disponible</p>
        </CardContent>
      </Card>
    );
  }

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
                ? pushToTalk
                  ? isListening
                    ? "Parlez maintenant..."
                    : isSpeaking
                    ? "iAsted répond..."
                    : "Maintenez le bouton pour parler"
                  : isListening
                  ? "Vous pouvez parler..."
                  : isSpeaking
                  ? "iAsted répond..."
                  : "En attente..."
                : pushToTalk
                ? "Cliquez pour démarrer, puis maintenez le bouton pour parler"
                : "Cliquez sur le bouton pour commencer"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zone de messages */}
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun message pour le moment</p>
                    <p className="text-sm">
                      {pushToTalk 
                        ? "Démarrez et maintenez le bouton pour parler"
                        : "Démarrez la conversation pour commencer"}
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3 items-start",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 max-w-[80%]",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Bouton de contrôle */}
            <div className="flex justify-center">
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
