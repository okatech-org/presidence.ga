import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Loader2, Volume2, User, Bot, X, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';
import { useIastedChat } from '@/hooks/useIastedChat';
import { PDFPreview } from './PDFPreview';
import { DocumentMessage } from './DocumentMessage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IAstedChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'president' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onVoiceModeChange?: (isActive: boolean) => void;
  voiceModeToggleTimestamp?: number;
}

const IAstedChatInterface: React.FC<IAstedChatInterfaceProps> = ({
  isOpen,
  onClose,
  userRole = 'president',
  onSpeakingChange,
  onVoiceModeChange,
  voiceModeToggleTimestamp = 0,
}) => {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [agentConfigured, setAgentConfigured] = useState<boolean | null>(null);
  const [previewPdfIndex, setPreviewPdfIndex] = useState<number | null>(null);

  // Hook pour gérer le chat avec iAsted et la génération de documents
  const { 
    messages, 
    generatedDocuments, 
    isLoading: isTextLoading, 
    sendMessage,
    clearChat 
  } = useIastedChat({ userRole });

  // Vérifier si l'agent est configuré
  useEffect(() => {
    const checkAgentConfig = async () => {
      const { data } = await supabase
        .from('iasted_config')
        .select('agent_id')
        .single();
      
      setAgentConfigured(!!data?.agent_id);
    };
    checkAgentConfig();
  }, [isOpen]);

  // Hook vocal avec toutes les fonctionnalités demandées
  const {
    voiceState,
    sessionId,
    handleInteraction,
    isListening,
    isThinking,
    isSpeaking,
    audioLevel,
    silenceDetected,
    silenceTimeRemaining,
    silenceDuration,
    liveTranscript,
    conversationMessages,
  } = useVoiceInteraction({
    onSpeakingChange,
    continuousMode: false,
  });

  // Notifier le parent des changements d'état vocal
  useEffect(() => {
    onVoiceModeChange?.(isListening || isThinking || isSpeaking);
  }, [isListening, isThinking, isSpeaking, onVoiceModeChange]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, generatedDocuments, conversationMessages, liveTranscript]);

  // Envoi de message texte via l'API
  const handleSendText = useCallback(async () => {
    if (!input.trim() || isTextLoading) return;

    const messageText = input.trim();
    setInput('');
    await sendMessage(messageText);
  }, [input, isTextLoading, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleDownloadDocument = (docIndex: number) => {
    const doc = generatedDocuments[docIndex];
    if (!doc) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(doc.pdfBlob);
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gérer le toggle vocal depuis l'extérieur
  useEffect(() => {
    if (voiceModeToggleTimestamp > 0 && isOpen) {
      console.log('[IAstedChatInterface] Toggle vocal demandé');
      handleInteraction();
    }
  }, [voiceModeToggleTimestamp, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogTitle className="sr-only">
          {userRole === 'president' ? 'iAsted - Assistant Présidentiel' : 'iAsted - Assistant Intelligent'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Intelligence Artificielle Stratégique de Traitement et d'Évaluation des Données
        </DialogDescription>

        {/* Agent non configuré */}
        {agentConfigured === false ? (
          <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
            <Bot className="w-24 h-24 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">Agent iAsted non configuré</h3>
              <p className="text-muted-foreground max-w-md">
                Vous devez d'abord créer un agent ElevenLabs pour utiliser les fonctionnalités vocales d'iAsted.
              </p>
            </div>
            <Button 
              size="lg"
              onClick={() => window.location.href = '/iasted-setup'}
              className="gap-2"
            >
              <Bot className="w-5 h-5" />
              Configurer iAsted
            </Button>
          </div>
        ) : agentConfigured === null ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {userRole === 'president' ? 'iAsted - Assistant Présidentiel' : 'iAsted'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Intelligence Artificielle Stratégique
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(messages.length > 0 || generatedDocuments.length > 0) && (
                <Button
                  onClick={clearChat}
                  size="sm"
                  variant="ghost"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Effacer
                </Button>
              )}
              {sessionId && (
                <div className="text-xs text-muted-foreground">
                  Session: {sessionId.substring(0, 8)}...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        {(isListening || isThinking || isSpeaking) && (
          <div className="px-6 py-3 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-3">
              {isListening && (
                <>
                  <Mic className="w-5 h-5 text-red-500 animate-pulse" />
                  <span className="text-sm font-medium">Je vous écoute...</span>
                  {silenceDetected && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Envoi dans {Math.ceil(silenceTimeRemaining / 1000)}s
                    </span>
                  )}
                </>
              )}
              {isThinking && (
                <>
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                  <span className="text-sm font-medium">iAsted réfléchit...</span>
                </>
              )}
              {isSpeaking && (
                <>
                  <Volume2 className="w-5 h-5 text-green-500 animate-pulse" />
                  <span className="text-sm font-medium">iAsted vous répond...</span>
                </>
              )}
            </div>
            {audioLevel > 0 && isListening && (
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-150"
                  style={{ width: `${Math.min(audioLevel, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {/* Messages du chat textuel */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[70%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Documents générés */}
            {generatedDocuments.map((doc, idx) => (
              <div key={doc.id} className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1 max-w-[70%]">
                  <DocumentMessage
                    fileName={doc.fileName}
                    documentType={doc.type}
                    recipient={doc.recipient}
                    subject={doc.subject}
                    onDownload={() => handleDownloadDocument(idx)}
                    onPreview={() => setPreviewPdfIndex(idx)}
                  />
                </div>
              </div>
            ))}

            {/* Messages vocaux (conversation en temps réel) */}
            {conversationMessages.map((msg, idx) => (
              <div
                key={`voice-${idx}`}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[70%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                  {msg.timestamp && (
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Transcription en temps réel */}
            {liveTranscript && isListening && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                  <User className="w-5 h-5" />
                </div>
                <div className="rounded-2xl px-4 py-3 max-w-[70%] bg-primary/50 text-primary-foreground">
                  <p className="whitespace-pre-wrap text-sm italic">{liveTranscript}</p>
                </div>
              </div>
            )}

            {/* Indicateur de chargement texte */}
            {isTextLoading && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted text-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">iAsted génère le document...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-border bg-background shrink-0">
          <div className="flex gap-2 items-end">
            <Button
              variant={isListening ? "default" : "outline"}
              size="icon"
              onClick={handleInteraction}
              disabled={isThinking || isSpeaking || isTextLoading}
              className={isListening ? "animate-pulse bg-red-500 hover:bg-red-600" : ""}
            >
              {isListening ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                isListening 
                  ? "Parlez maintenant..." 
                  : isThinking || isSpeaking
                  ? "Veuillez patienter..."
                  : "Posez votre question à iAsted..."
              }
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isListening || isThinking || isSpeaking || isTextLoading}
            />

            <Button
              onClick={handleSendText}
              disabled={!input.trim() || isListening || isThinking || isSpeaking || isTextLoading}
              size="icon"
              className="self-end"
            >
              {isTextLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            {isListening 
              ? "🎙️ Parlez maintenant - L'écoute s'arrêtera automatiquement après un silence"
              : isThinking
              ? "🤔 iAsted réfléchit à sa réponse..."
              : isSpeaking
              ? "🔊 iAsted vous répond..."
              : "Cliquez sur le micro pour parler ou tapez votre message (Entrée pour envoyer)"
            }
          </p>
        </div>
        </>
        )}

        {/* Prévisualisation PDF */}
        {previewPdfIndex !== null && generatedDocuments[previewPdfIndex] && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <PDFPreview
                pdfBlob={generatedDocuments[previewPdfIndex].pdfBlob}
                fileName={generatedDocuments[previewPdfIndex].fileName}
                onClose={() => setPreviewPdfIndex(null)}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IAstedChatInterface;