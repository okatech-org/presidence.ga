import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Loader2,
  X,
  Bot,
  User,
  FileText,
  Download,
  Brain,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    responseStyle?: string;
    documents?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
    }>;
  };
}

interface IAstedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-success/10">
              <Bot className="w-4 h-4 text-success" />
            </div>
          )}
          <div className="flex-1">
            <div
              className={`rounded-2xl px-4 py-3 ${
                isUser
                  ? 'neu-raised bg-primary/10 text-foreground rounded-br-none'
                  : 'neu-inset text-foreground rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              
              {/* Documents attachés */}
              {message.metadata?.documents && message.metadata.documents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                  {message.metadata.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      download={doc.name}
                      className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs flex-1 truncate">{doc.name}</span>
                      <Download className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                <span className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {!isUser && message.metadata?.responseStyle && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {message.metadata.responseStyle === 'concis' && '⚡ Concis'}
                    {message.metadata.responseStyle === 'detaille' && '📊 Détaillé'}
                    {message.metadata.responseStyle === 'strategique' && '🎯 Stratégique'}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isUser && (
            <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const IAstedChatModal: React.FC<IAstedChatModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialiser la session au montage
  useEffect(() => {
    if (isOpen) {
      initializeSession();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    try {
      console.log('🔄 [IAstedChatModal] Initialisation session...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Chercher ou créer une session
      const { data: existingSession } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        setSessionId(existingSession.id);
        await loadSessionMessages(existingSession.id);
      } else {
        const { data: newSession, error } = await supabase
          .from('conversation_sessions')
          .insert({
            user_id: user.id,
            settings: { mode: 'text' },
            focus_mode: null,
          })
          .select()
          .single();

        if (error) throw error;
        setSessionId(newSession.id);
        
        // Message de bienvenue
        const greetingMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Bonjour Monsieur le Président,\n\nJe suis iAsted, votre assistant stratégique. Comment puis-je vous aider aujourd'hui ?`,
          timestamp: new Date().toISOString(),
          metadata: { responseStyle: 'strategique' },
        };
        setMessages([greetingMessage]);
        await saveMessage(newSession.id, greetingMessage);
      }
      
      console.log('✅ [IAstedChatModal] Session prête');
    } catch (error) {
      console.error('❌ [IAstedChatModal] Erreur initialisation:', error);
      toast({
        title: 'Erreur de session',
        description: 'Impossible d\'initialiser la conversation',
        variant: 'destructive',
      });
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    const { data: msgs, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && msgs) {
      setMessages(msgs.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at,
      })));
    }
  };

  const saveMessage = async (sessId: string, message: Message) => {
    try {
      await supabase.from('conversation_messages').insert({
        id: message.id,
        session_id: sessId,
        role: message.role,
        content: message.content,
        created_at: message.timestamp,
      });
    } catch (error) {
      console.error('Erreur sauvegarde message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing || !sessionId) return;

    setIsProcessing(true);

    try {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: inputText,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      await saveMessage(sessionId, userMessage);
      setInputText('');

      // Appeler l'API pour obtenir la réponse
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
        body: {
          sessionId,
          transcriptOverride: userMessage.content,
          conversationHistory: [...conversationHistory, { role: 'user', content: userMessage.content }],
          userRole: 'president',
          settings: { responseStyle: 'strategique' },
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Je suis désolé, je ne peux pas répondre pour le moment.',
        timestamp: new Date().toISOString(),
        metadata: {
          responseStyle: 'strategique',
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(sessionId, assistantMessage);

    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="neu-card w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="neu-card p-6 rounded-t-2xl rounded-b-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="neu-raised w-14 h-14 rounded-full flex items-center justify-center p-3">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">iAsted - Chat Stratégique</h2>
                <p className="text-sm text-muted-foreground">Assistant Présidentiel</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="neu-raised p-2 rounded-lg hover:shadow-neo-md transition-all"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">iAsted réfléchit...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="neu-card rounded-t-none rounded-b-2xl p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question à iAsted..."
                className="w-full p-3 neu-inset rounded-xl resize-none focus:ring-2 focus:ring-primary"
                rows={2}
                disabled={isProcessing}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className="neu-raised p-4 bg-success text-success-foreground rounded-xl hover:shadow-neo-lg transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-3">
            {isProcessing ? '🧠 iAsted analyse...' : '💬 Conversation stratégique'}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
