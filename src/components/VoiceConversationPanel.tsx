import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, User, Bot } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { useVoiceConversation } from '@/hooks/useVoiceConversation';
import { cn } from '@/lib/utils';

interface VoiceConversationPanelProps {
  userRole: 'president' | 'minister' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export const VoiceConversationPanel: React.FC<VoiceConversationPanelProps> = ({
  userRole,
  onSpeakingChange,
}) => {
  const {
    isActive,
    isListening,
    isSpeaking,
    messages,
    startConversation,
    stopConversation,
  } = useVoiceConversation({ userRole, onSpeakingChange });

  const handleToggle = () => {
    if (isActive) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Conversation Vocale avec iAsted
        </CardTitle>
        <CardDescription>
          {isActive
            ? isListening
              ? "Vous pouvez parler..."
              : isSpeaking
              ? "iAsted répond..."
              : "En attente..."
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
                <p className="text-sm">Démarrez la conversation pour commencer</p>
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
  );
};
