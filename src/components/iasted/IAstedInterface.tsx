import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface IAstedInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'president' | 'minister' | 'default';
}

const IAstedInterface: React.FC<IAstedInterfaceProps> = ({ 
  isOpen, 
  onClose, 
  userRole = 'default' 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

  const toggleVoice = () => {
    setIsListening(!isListening);
    toast({
      title: "Fonctionnalité vocale",
      description: "La reconnaissance vocale sera disponible prochainement",
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <h2 className="text-2xl font-bold text-foreground">{getRoleTitle()}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Intelligence Artificielle Stratégique de Traitement et d'Évaluation des Données
          </p>
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

        {/* Input */}
        <div className="p-6 border-t border-border bg-background">
          <div className="flex gap-2">
            <Button
              variant={isListening ? "default" : "outline"}
              size="icon"
              onClick={toggleVoice}
              disabled={isLoading}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Posez votre question à iAsted..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
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
            Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IAstedInterface;
