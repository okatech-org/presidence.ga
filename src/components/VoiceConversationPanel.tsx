import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, User, Bot, Settings as SettingsIcon } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { VoiceSettings } from './VoiceSettings';
import { useVoiceConversation } from '@/hooks/useVoiceConversation';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VoiceConversationPanelProps {
  userRole: 'president' | 'minister' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export const VoiceConversationPanel: React.FC<VoiceConversationPanelProps> = ({
  userRole,
  onSpeakingChange,
}) => {
  const [pushToTalk, setPushToTalk] = useState(false);
  
  const {
    isActive,
    isListening,
    isSpeaking,
    messages,
    startConversation,
    stopConversation,
    startListening,
    stopListening,
  } = useVoiceConversation({ userRole, onSpeakingChange, pushToTalk });

  const handleToggle = () => {
    if (isActive) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  const handleSettingsChange = (settings: { pushToTalk: boolean }) => {
    setPushToTalk(settings.pushToTalk);
  };

  // Gestion du push-to-talk
  const handleMouseDown = () => {
    if (isActive && pushToTalk && !isListening && !isSpeaking) {
      startListening();
    }
  };

  const handleMouseUp = () => {
    if (isActive && pushToTalk && isListening) {
      stopListening();
    }
  };

  // Empêcher la sélection de texte pendant le push-to-talk
  const handleMouseLeave = () => {
    if (isActive && pushToTalk && isListening) {
      stopListening();
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
              {pushToTalk && isActive ? (
                <Button
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleMouseDown}
                  onTouchEnd={handleMouseUp}
                  variant={isListening ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "relative rounded-full w-20 h-20 transition-all duration-300",
                    isListening && "ring-4 ring-primary/50 scale-110",
                    isSpeaking && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isSpeaking}
                >
                  {isSpeaking ? (
                    <Volume2 className="w-8 h-8" />
                  ) : isListening ? (
                    <div className="relative">
                      <Mic className="w-8 h-8" />
                      <div className="absolute inset-0 animate-ping">
                        <Mic className="w-8 h-8 opacity-75" />
                      </div>
                    </div>
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
              ) : (
                <VoiceButton
                  isActive={isActive}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onToggle={handleToggle}
                />
              )}
            </div>

            {/* Instructions pour push-to-talk */}
            {pushToTalk && isActive && (
              <div className="text-center text-sm text-muted-foreground">
                <p className="font-medium">Maintenez le bouton enfoncé pour parler</p>
                <p className="text-xs mt-1">Relâchez pour que iAsted réponde</p>
              </div>
            )}

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
};
