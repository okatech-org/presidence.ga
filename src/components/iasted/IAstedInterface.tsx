import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Loader2, MessageCircle, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useContinuousConversation } from '@/hooks/useContinuousConversation';
import { ConnectionStatusOverlay } from './ConnectionStatusOverlay';

import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface IAstedInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'president' | 'minister' | 'default';
  elevenLabsAgentId?: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  voiceModeToggleTimestamp?: number; // Timestamp pour déclencher le basculement du mode vocal
  onVoiceModeChange?: (isActive: boolean) => void;
  voiceOnlyMode?: boolean; // Mode vocal pur sans afficher le modal visuel
}

const IAstedInterface: React.FC<IAstedInterfaceProps> = ({
  isOpen, 
  onClose, 
  userRole = 'default',
  elevenLabsAgentId: elevenLabsAgentIdProp,
  onSpeakingChange,
  voiceModeToggleTimestamp = 0,
  onVoiceModeChange,
  voiceOnlyMode = false
}) => {
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState<string | undefined>(elevenLabsAgentIdProp);

  // Charger la config iAsted
  useEffect(() => {
    const loadIAstedConfig = async () => {
      const { data, error } = await supabase
        .from('iasted_config')
        .select('agent_id')
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error loading iAsted config:', error);
      } else if (data?.agent_id) {
        setElevenLabsAgentId(data.agent_id);
      }
    };
    
    loadIAstedConfig();
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [connectionError, setConnectionError] = useState<string>('');
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecording();
  
  const {
    isActive: isConversationActive,
    isSpeaking: isAgentSpeaking,
    status: conversationStatus,
    messages: conversationMessages,
    startContinuousMode,
    stopContinuousMode,
    setVolume: setAgentVolume,
  } = useContinuousConversation(userRole, elevenLabsAgentId || '');

  // Map conversation status to overlay status
  const getOverlayStatus = () => {
    if (isContinuousMode && !isConversationActive) {
      return connectionError ? 'error' : 'connecting';
    }
    return conversationStatus === 'connected' ? 'connected' : 'disconnected';
  };

  // Notifier le parent quand l'agent parle
  useEffect(() => {
    onSpeakingChange?.(isAgentSpeaking);
  }, [isAgentSpeaking, onSpeakingChange]);

  // Notifier le parent quand le mode vocal change
  useEffect(() => {
    onVoiceModeChange?.(isContinuousMode);
  }, [isContinuousMode, onVoiceModeChange]);

  // Arrêter la conversation si on ferme l'interface en mode vocal
  useEffect(() => {
    if (!isOpen && isContinuousMode) {
      stopContinuousMode();
      setIsContinuousMode(false);
    }
  }, [isOpen, isContinuousMode]);

  // Démarrer automatiquement le mode vocal quand l'interface s'ouvre et que l'agent est configuré
  useEffect(() => {
    if (isOpen && elevenLabsAgentId && !isContinuousMode && !isConversationActive) {
      console.log('[IAstedInterface] Démarrage automatique du mode vocal...');
      
      // Activer le contexte audio immédiatement (avant même de démarrer)
      const activateAudioContext = async () => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('[IAstedInterface] ✅ Contexte audio activé pour démarrage');
          }
        } catch (error) {
          console.error('[IAstedInterface] Erreur activation contexte audio:', error);
        }
      };
      activateAudioContext();
      
      const timer = setTimeout(async () => {
        setIsContinuousMode(true);
        setConnectionError('');
        try {
          console.log('[IAstedInterface] Appel startContinuousMode...');
          await startContinuousMode();
          console.log('[IAstedInterface] ✅ Mode vocal démarré');
          toast({
            title: "Mode vocal activé",
            description: "iAsted vous écoute et va vous saluer...",
          });
        } catch (error) {
          console.error('[IAstedInterface] ❌ Erreur démarrage automatique:', error);
          setIsContinuousMode(false);
          const errorMessage = error instanceof Error ? error.message : "Impossible de démarrer le mode vocal";
          setConnectionError(errorMessage);
          toast({
            title: "Erreur de connexion",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }, 300); // Délai réduit pour démarrer plus vite
      return () => clearTimeout(timer);
    }
  }, [isOpen, elevenLabsAgentId, isContinuousMode, isConversationActive, startContinuousMode, toast]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Synchroniser les messages du mode conversation avec l'état local
  useEffect(() => {
    if (isContinuousMode && conversationMessages.length > 0) {
      setMessages(conversationMessages);
      scrollToBottom();
    }
  }, [conversationMessages, isContinuousMode]);

  // Gérer le changement de mode
  const handleModeToggle = async (enabled: boolean) => {
    if (!elevenLabsAgentId) {
      toast({
        title: "Agent non configuré",
        description: "Créez d'abord un agent ElevenLabs dans la configuration iAsted.",
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/iasted-config'}
          >
            Configurer
          </Button>
        ),
      });
      return;
    }

    setIsContinuousMode(enabled);
    
    if (enabled) {
      setConnectionError('');
      try {
        await startContinuousMode();
        toast({
          title: "Mode vocal activé",
          description: "Vous pouvez maintenant parler avec iAsted.",
        });
      } catch (error) {
        console.error('Error starting continuous mode:', error);
        setIsContinuousMode(false);
        const errorMessage = error instanceof Error ? error.message : "Impossible de démarrer le mode vocal.";
        setConnectionError(errorMessage);
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      setConnectionError('');
      await stopContinuousMode();
      toast({
        title: "Mode vocal désactivé",
        description: "Vous êtes revenu au mode texte.",
      });
    }
  };

  // Activer le mode vocal automatiquement si demandé (après la définition de handleModeToggle)
  useEffect(() => {
    if (voiceModeToggleTimestamp > 0 && elevenLabsAgentId) {
      // Basculer le mode vocal à chaque changement de timestamp
      handleModeToggle(!isContinuousMode);
    }
  }, [voiceModeToggleTimestamp, elevenLabsAgentId]);

  // Gérer le volume
  const handleVolumeChange = async (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    try {
      await setAgentVolume(vol);
      console.log('[IAstedInterface] Volume réglé à:', vol * 100 + '%');
    } catch (error) {
      console.error('[IAstedInterface] Erreur réglage volume:', error);
    }
  };

  // Initialiser le volume par défaut quand la conversation démarre
  useEffect(() => {
    if (isConversationActive && volume > 0) {
      console.log('[IAstedInterface] Initialisation du volume:', volume * 100 + '%');
      setAgentVolume(volume);
    }
  }, [isConversationActive, volume]);

  // Fonction pour activer manuellement l'audio (nécessaire pour certains navigateurs)
  const activateAudio = async () => {
    try {
      console.log('[IAstedInterface] Activation manuelle de l\'audio...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('[IAstedInterface] État contexte audio:', audioContext.state);
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('[IAstedInterface] ✅ Contexte audio activé manuellement');
      }
      
      // Créer un son de test pour forcer l'activation
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = 0.001; // Très silencieux pour ne pas gêner
      oscillator.frequency.value = 440;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.01);
      
      // Si la conversation est active, régler à nouveau le volume
      if (isConversationActive) {
        try {
          await setAgentVolume(0.8);
          console.log('[IAstedInterface] Volume réglé après activation manuelle');
        } catch (volError) {
          console.error('[IAstedInterface] Erreur réglage volume:', volError);
        }
      }
      
      toast({
        title: "Audio activé",
        description: "Le son est maintenant activé. Vérifiez votre volume système.",
      });
    } catch (error) {
      console.error('[IAstedInterface] Erreur activation audio manuelle:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'activer l'audio",
        variant: "destructive",
      });
    }
  };

  // Fonction de diagnostic
  const runDiagnostic = () => {
    const diagnostics: string[] = [];
    
    // Vérifier l'agent
    if (!elevenLabsAgentId) {
      diagnostics.push('❌ Agent ElevenLabs non configuré');
    } else {
      diagnostics.push(`✅ Agent configuré: ${elevenLabsAgentId.substring(0, 8)}...`);
    }
    
    // Vérifier le statut de la conversation
    diagnostics.push(`📊 Statut conversation: ${conversationStatus}`);
    diagnostics.push(`🔊 Agent parle: ${isAgentSpeaking ? 'Oui' : 'Non'}`);
    diagnostics.push(`🎤 Mode actif: ${isConversationActive ? 'Oui' : 'Non'}`);
    
    // Vérifier le contexte audio
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      diagnostics.push(`🎵 Contexte audio: ${audioContext.state}`);
    } catch (error) {
      diagnostics.push(`❌ Erreur contexte audio: ${error}`);
    }
    
    // Vérifier le volume
    diagnostics.push(`🔉 Volume: ${Math.round(volume * 100)}%`);
    
    // Afficher dans la console et dans une toast
    console.log('[IAstedInterface] 📋 Diagnostic:');
    diagnostics.forEach(msg => console.log('  ' + msg));
    
    toast({
      title: "Diagnostic iAsted",
      description: diagnostics.join('\n'),
      duration: 8000,
    });
  };

  const streamChat = useCallback(async (userMessage: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-iasted`;
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: newMessages,
          userRole 
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({
            title: "Limite atteinte",
            description: "Trop de requêtes. Veuillez patienter un instant.",
            variant: "destructive",
          });
          return;
        }
        if (resp.status === 402) {
          toast({
            title: "Crédits insuffisants",
            description: "Veuillez contacter l'administrateur système.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Erreur de communication');
      }

      if (!resp.body) throw new Error('Pas de réponse');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return updated;
              });
              scrollToBottom();
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error streaming chat:', error);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec iAsted",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, userRole, toast]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = async () => {
    // Mode conversation continue actif : ne pas gérer le micro manuellement
    if (isContinuousMode) {
      toast({
        title: "Mode conversation actif",
        description: "Le micro est géré automatiquement en mode conversation",
      });
      return;
    }

    if (isRecording) {
      try {
        const transcribedText = await stopRecording();
        if (transcribedText.trim()) {
          setInput(transcribedText);
        }
      } catch (error) {
        console.error('Erreur arrêt enregistrement:', error);
      }
    } else {
      await startRecording();
    }
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'president':
        return 'iAsted - Assistant Présidentiel';
      case 'minister':
        return 'iAsted - Assistant Ministériel';
      default:
        return 'iAsted - Assistant Intelligent';
    }
  };

  // En mode vocal pur, ne pas afficher le modal mais gérer la connexion en arrière-plan
  if (voiceOnlyMode) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 relative">
        <DialogTitle className="sr-only">{getRoleTitle()}</DialogTitle>
        <DialogDescription className="sr-only">
          Intelligence Artificielle Stratégique de Traitement et d'Évaluation des Données
        </DialogDescription>
        
        {/* Connection Status Overlay */}
        <ConnectionStatusOverlay
          status={getOverlayStatus()}
          error={connectionError}
          onRetry={async () => {
            setConnectionError('');
            await handleModeToggle(true);
          }}
          onClose={onClose}
        />
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <h2 className="text-2xl font-bold text-foreground">{getRoleTitle()}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Intelligence Artificielle Stratégique de Traitement et d'Évaluation des Données
          </p>
        </div>

        {/* Mode Controls */}
        <div className="px-6 pt-4 pb-2 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Switch
                id="continuous-mode"
                checked={isContinuousMode}
                onCheckedChange={handleModeToggle}
                disabled={isLoading || isRecording}
              />
              <Label htmlFor="continuous-mode" className="flex items-center gap-2 cursor-pointer">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">Mode Conversation Continue</span>
              </Label>
            </div>
            {isConversationActive && (
              <div className="flex items-center gap-2 text-sm">
                {isAgentSpeaking ? (
                  <span className="flex items-center gap-2 text-primary animate-pulse">
                    <Volume2 className="w-4 h-4" />
                    iAsted parle...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Mic className="w-4 h-4" />
                    En écoute
                  </span>
                )}
              </div>
            )}
          </div>
          
          {isContinuousMode && (
            <div className="space-y-2 pb-2">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={activateAudio}
                    className="flex-1"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Activer l'audio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runDiagnostic}
                    className="flex-1"
                  >
                    🔍 Diagnostic
                  </Button>
                </div>
                {isConversationActive && (
                  <div className="space-y-1">
                    {!isAgentSpeaking ? (
                      <p className="text-xs text-center text-muted-foreground">
                        💡 Parlez pour déclencher une réponse, ou attendez quelques secondes pour le message de bienvenue
                      </p>
                    ) : (
                      <p className="text-xs text-center text-primary font-medium animate-pulse">
                        🔊 iAsted vous parle...
                      </p>
                    )}
                    <p className="text-xs text-center text-muted-foreground">
                      ⚠️ Si vous n'entendez pas le son, vérifiez votre volume système et cliquez sur "Activer l'audio"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-6">
          <div className="space-y-4 py-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">iAsted à votre service</h3>
                <p className="text-muted-foreground">
                  {userRole === 'president' 
                    ? 'Monsieur le Président, comment puis-je vous assister aujourd\'hui?'
                    : userRole === 'minister'
                    ? 'Excellence, comment puis-je vous aider?'
                    : 'Comment puis-je vous aider aujourd\'hui?'}
                </p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role === 'assistant' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">iAsted réfléchit...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input - Désactivé en mode conversation */}
        {!isContinuousMode && (
          <div className="p-6 border-t border-border bg-background">
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "default" : "outline"}
                size="icon"
                onClick={toggleVoice}
                disabled={isLoading || isTranscribing}
                className={isRecording ? "animate-pulse" : ""}
              >
                {isTranscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </Button>
            
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isRecording ? "Parlez maintenant..." : isTranscribing ? "Transcription en cours..." : "Posez votre question à iAsted..."}
              className="min-h-[60px] resize-none"
              disabled={isLoading || isRecording || isTranscribing}
            />
            
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isRecording || isTranscribing}
              size="icon"
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          
            <p className="text-xs text-muted-foreground mt-2">
              {isRecording 
                ? "🎙️ Enregistrement en cours - Cliquez à nouveau pour terminer" 
                : isTranscribing
                ? "⏳ Transcription en cours..."
                : "Cliquez sur le micro pour parler, ou tapez votre message (Entrée pour envoyer)"
              }
            </p>
          </div>
        )}
        
        {isContinuousMode && (
          <div className="p-6 border-t border-border bg-muted/50">
            <p className="text-sm text-center text-muted-foreground">
              {isAgentSpeaking 
                ? "🔊 iAsted vous répond..." 
                : "🎤 Parlez librement, iAsted vous écoute en continu"
              }
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IAstedInterface;
