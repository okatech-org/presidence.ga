import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { generateOfficialPDFWithURL } from '@/utils/generateOfficialPDF';
import {
  Send,
  Loader2,
  X,
  Bot,
  User,
  FileText,
  Download,
  Brain,
  Mic,
  MicOff,
  Navigation,
  Settings,
  FileCheck,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useElevenLabsAgent } from '@/hooks/useElevenLabsAgent';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';

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

const MessageBubble: React.FC<{
  message: Message;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onCopy?: (content: string) => void;
}> = ({ message, onDelete, onEdit, onCopy }) => {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const { toast } = useToast();

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim() !== message.content) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleDownloadDocument = (doc: any) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "📥 Téléchargement",
      description: `${doc.name} téléchargé`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'} relative`}>
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-success/10">
              <Bot className="w-4 h-4 text-success" />
            </div>
          )}
          <div className="flex-1">
            <div
              className={`rounded-2xl px-4 py-3 ${isUser
                ? 'neu-raised bg-primary/10 text-foreground rounded-br-none'
                : 'neu-inset text-foreground rounded-bl-none'
                }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[80px] p-2 bg-background/50 border border-border rounded text-sm resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs rounded bg-background/50 hover:bg-background transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              )}

              {/* Documents attachés avec prévisualisation PDF */}
              {message.metadata?.documents && message.metadata.documents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/20 space-y-3">
                  {message.metadata.documents.map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      {/* Nom et bouton téléchargement */}
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{doc.name}</span>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Télécharger</span>
                        </button>
                      </div>
                      
                      {/* Prévisualisation PDF */}
                      <div className="relative rounded-lg overflow-hidden border border-border/30 bg-background/30">
                        <iframe
                          src={doc.url}
                          className="w-full h-[400px]"
                          title={doc.name}
                        />
                      </div>
                    </div>
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

            {/* Actions au survol */}
            <AnimatePresence>
              {showActions && !isEditing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-2 right-0 flex gap-1 bg-background border border-border rounded-lg shadow-lg p-1"
                >
                  {isUser && onEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                      title="Éditer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onCopy && (
                    <button
                      onClick={() => onCopy(message.content)}
                      className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                      title="Copier"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(message.id)}
                      className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
  const [voiceMode, setVoiceMode] = useState<'elevenlabs' | 'openai'>(() => {
    return (localStorage.getItem('iasted-voice-mode') as 'elevenlabs' | 'openai') || 'elevenlabs';
  });
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  // ElevenLabs integration
  const elevenLabs = useElevenLabsAgent({
    agentId: 'EV6XgOdBELK29O2b4qyM', // iAsted Pro voice
    userRole: 'president',
    onSpeakingChange: (speaking) => {
      console.log('🎙️ ElevenLabs speaking:', speaking);
    },
  });

  // OpenAI WebRTC integration
  const openaiRTC = useRealtimeVoiceWebRTC();

  // Sync messages from OpenAI WebRTC
  useEffect(() => {
    if (voiceMode === 'openai' && openaiRTC.messages.length > 0) {
      const lastMsg = openaiRTC.messages[openaiRTC.messages.length - 1];
      setMessages(prev => {
        const existing = prev.find(m => m.id === lastMsg.id);
        if (!existing) {
          return [...prev, lastMsg];
        }
        return prev.map(m => m.id === lastMsg.id ? lastMsg : m);
      });
    }
  }, [openaiRTC.messages, voiceMode]);

  // === Fonctions de gestion de messages ===

  const handleDeleteMessage = async (messageId: string) => {
    try {
      setMessages(prev => prev.filter(m => m.id !== messageId));

      // Supprimer aussi de la base de données
      if (sessionId) {
        const { error } = await supabase
          .from('conversation_messages')
          .delete()
          .eq('id', messageId);

        if (error) console.error('Erreur suppression message:', error);
      }

      toast({
        title: "Message supprimé",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, content: newContent } : m
      ));

      // Mettre à jour dans la base de données
      if (sessionId) {
        const { error } = await supabase
          .from('conversation_messages')
          .update({ content: newContent })
          .eq('id', messageId);

        if (error) console.error('Erreur modification message:', error);
      }

      toast({
        title: "Message modifié",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "📋 Copié",
      description: "Message copié dans le presse-papiers",
      duration: 2000,
    });
  };

  const handleClearConversation = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toute la conversation ?')) {
      setMessages([]);
      if (sessionId) {
        // Supprimer tous les messages de la session
        const { error: deleteError } = await supabase
          .from('conversation_messages')
          .delete()
          .eq('session_id', sessionId);

        if (deleteError) {
          console.error('Erreur suppression messages:', deleteError);
        }

        // Marquer la session comme terminée pour ne plus la recharger
        const { error: updateError } = await supabase
          .from('conversation_sessions')
          .update({
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        if (updateError) {
          console.error('Erreur mise à jour session:', updateError);
        }
      }
      toast({
        title: "Conversation effacée",
        duration: 2000,
      });
    }
  };

  const handleNewConversation = async () => {
    setMessages([]);
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    // Créer nouvelle session
    await supabase.from('conversation_sessions').insert({
      session_id: newSessionId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      started_at: new Date().toISOString(),
    });

    toast({
      title: "✨ Nouvelle conversation",
      duration: 2000,
    });
  };


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
        .is('ended_at', null)
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

  // Fonction d'exécution des tool calls
  const executeToolCall = async (toolCall: any) => {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      console.log('🔧 [executeToolCall]', toolCall.function.name, args);

      switch (toolCall.function.name) {
        case 'navigate_app':
          toast({
            title: "Navigation",
            description: `Redirection vers ${args.route}...`,
            duration: 2000,
          });
          navigate(args.route);

          // Si un module spécifique est demandé, scroller vers lui
          if (args.module_id) {
            setTimeout(() => {
              const element = document.getElementById(args.module_id);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-primary', 'animate-pulse');
                setTimeout(() => {
                  element.classList.remove('ring-2', 'ring-primary', 'animate-pulse');
                }, 3000);
              }
            }, 500);
          }
          break;

        case 'generate_document':
          // Générer un VRAI PDF avec pdfmake
          console.log('📄 [generatePDF] Génération du document...', args);

          try {
            const { blob, url, filename } = await generateOfficialPDFWithURL({
              type: args.type,
              recipient: args.recipient,
              subject: args.subject,
              content_points: args.content_points || [],
              signature_authority: args.signature_authority,
            });

            console.log('✅ [generatePDF] Document généré:', filename);

            // Créer l'objet document pour le chat
            const docPreview = {
              id: crypto.randomUUID(),
              name: filename,
              url: url,  // URL blob pour téléchargement
              type: 'application/pdf',
            };

            // Ajouter le document au dernier message assistant
            setMessages(prev => {
              const lastAssistantIdx = prev.length - 1;
              if (lastAssistantIdx >= 0 && prev[lastAssistantIdx].role === 'assistant') {
                const updated = [...prev];
                updated[lastAssistantIdx] = {
                  ...updated[lastAssistantIdx],
                  metadata: {
                    ...updated[lastAssistantIdx].metadata,
                    documents: [
                      ...(updated[lastAssistantIdx].metadata?.documents || []),
                      docPreview
                    ]
                  }
                };
                return updated;
              }
              return prev;
            });

            // Toast de succès
            toast({
              title: "📄 Document généré",
              description: `${args.type.toUpperCase()} pour ${args.recipient}`,
              duration: 3000,
            });

            // Télécharger automatiquement le PDF au lieu de l'ouvrir (évite ERR_BLOCKED_BY_CLIENT)
            const isVoiceInteraction = isVoiceActive || voiceMode === 'elevenlabs';

            if (isVoiceInteraction) {
              console.log('🔊 [generatePDF] Téléchargement automatique (demande vocale)');
              setTimeout(() => {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }, 500);
            }

          } catch (error) {
            console.error('❌ [generatePDF] Erreur:', error);
            toast({
              title: "Erreur de génération",
              description: "Impossible de créer le document PDF",
              variant: "destructive",
            });
          }
          break;

        case 'manage_system_settings':
          if (args.setting === 'voice_mode') {
            const newMode = args.value as 'elevenlabs' | 'openai';
            setVoiceMode(newMode);
            localStorage.setItem('iasted-voice-mode', newMode);
            toast({
              title: "Mode vocal changé",
              description: `Nouveau mode: ${newMode === 'elevenlabs' ? 'iAsted Pro' : 'OpenAI RT'}`,
            });
          } else if (args.setting === 'theme') {
            setTheme(args.value);
            toast({
              title: "Thème changé",
              description: `Nouveau thème: ${args.value}`,
            });
          }
          break;

        case 'query_knowledge_base':
          toast({
            title: `Base de connaissances: ${args.domain}`,
            description: "Interrogation en cours...",
            duration: 2000,
          });
          // La réponse sera dans le message de l'assistant
          break;

        default:
          console.warn('⚠️ [executeToolCall] Outil non reconnu:', toolCall.function.name);
      }
    } catch (error) {
      console.error('❌ [executeToolCall] Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter l'action",
        variant: "destructive",
      });
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
          userGender: 'male', // À récupérer du profil utilisateur
          settings: { responseStyle: 'strategique' },
        },
      });

      if (error) throw error;

      // Traiter les tool_calls si présents
      if (data.tool_calls && data.tool_calls.length > 0) {
        console.log('🔧 [handleSendMessage] Tool calls détectés:', data.tool_calls);
        for (const toolCall of data.tool_calls) {
          await executeToolCall(toolCall);
        }
      }

      // Générer un message de confirmation si un document a été créé
      let responseContent = data.answer || data.response || '';
      
      // Si pas de contenu mais qu'un document a été généré, créer un message de confirmation
      if (!responseContent && data.tool_calls?.some((tc: any) => tc.function.name === 'generate_document')) {
        const docTool = data.tool_calls.find((tc: any) => tc.function.name === 'generate_document');
        const args = JSON.parse(docTool.function.arguments);
        responseContent = `Document généré, Excellence.\n\n📄 ${args.type.toUpperCase()} pour ${args.recipient}\nObjet : ${args.subject}\n\nLe document est prêt et a été téléchargé automatiquement.`;
      }

      // Message par défaut seulement si vraiment aucun contenu
      if (!responseContent) {
        responseContent = 'Je suis désolé, je ne peux pas répondre pour le moment.';
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        metadata: {
          responseStyle: 'strategique',
        },
      };

      console.log('📨 [handleSendMessage] Réponse reçue:', {
        hasAnswer: !!data.answer,
        hasResponse: !!data.response,
        hasError: !!data.error,
        hasToolCalls: data.tool_calls?.length || 0,
        finalContent: assistantMessage.content.substring(0, 100)
      });

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

  const toggleVoiceMode = async () => {
    if (isVoiceActive) {
      // Stop current voice session
      if (voiceMode === 'elevenlabs') {
        await elevenLabs.stopConversation();
      } else {
        openaiRTC.disconnect();
      }
      setIsVoiceActive(false);
    } else {
      // Start voice session
      try {
        if (voiceMode === 'elevenlabs') {
          await elevenLabs.startConversation();
          setIsVoiceActive(true);
        } else {
          await openaiRTC.connect();
          setIsVoiceActive(true);
        }
      } catch (error) {
        console.error('❌ Erreur démarrage vocal:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de démarrer le mode vocal',
          variant: 'destructive',
        });
      }
    }
  };

  // Clean up voice connections on unmount
  useEffect(() => {
    return () => {
      if (isVoiceActive) {
        if (voiceMode === 'elevenlabs') {
          elevenLabs.stopConversation();
        } else {
          openaiRTC.disconnect();
        }
      }
    };
  }, []);

  // Handle voice mode switch - stop current session if active
  useEffect(() => {
    if (isVoiceActive) {
      // Stop current session and restart with new mode
      const switchMode = async () => {
        if (voiceMode === 'elevenlabs') {
          openaiRTC.disconnect();
        } else {
          await elevenLabs.stopConversation();
        }
        setIsVoiceActive(false);
      };
      switchMode();
    }
    // Sauvegarder le mode dans localStorage pour synchroniser avec le bouton
    localStorage.setItem('iasted-voice-mode', voiceMode);
  }, [voiceMode]);

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
                <p className="text-sm text-muted-foreground">Agent de Commande Totale</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Boutons de gestion de conversation */}
              <button
                onClick={handleNewConversation}
                className="neu-button-sm flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                title="Nouvelle conversation"
              > <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Nouvelle</span>
              </button>

              <button
                onClick={handleClearConversation}
                className="neu-button-sm flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                title="Effacer la conversation"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Effacer</span>
              </button>

              {/* Mode selector */}
              <div className="neu-inset rounded-lg p-1 flex items-center gap-1">
                <button
                  onClick={() => setVoiceMode('elevenlabs')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${voiceMode === 'elevenlabs'
                    ? 'neu-raised bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  title="ElevenLabs iAsted Pro - Voix de haute qualité"
                >
                  🎙️ iAsted Pro
                </button>
                <button
                  onClick={() => setVoiceMode('openai')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${voiceMode === 'openai'
                    ? 'neu-raised bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  title="OpenAI Temps Réel - Latence ultra-faible"
                >
                  ⚡ OpenAI RT
                </button>
              </div>

              <button
                onClick={onClose}
                className="neu-raised p-2 rounded-lg hover:shadow-neo-md transition-all"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
                onCopy={handleCopyMessage}
              />
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
            <button
              onClick={toggleVoiceMode}
              className={`neu-raised p-4 rounded-xl hover:shadow-neo-lg transition-all ${isVoiceActive ? 'bg-primary text-primary-foreground' : ''
                }`}
              title={isVoiceActive ? 'Arrêter le mode vocal' : 'Activer le mode vocal'}
            >
              {isVoiceActive ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question à iAsted..."
                className="w-full p-3 neu-inset rounded-xl resize-none focus:ring-2 focus:ring-primary"
                rows={2}
                disabled={isProcessing || isVoiceActive}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing || isVoiceActive}
              className="neu-raised p-4 bg-primary text-white rounded-xl hover:bg-primary/90 hover:shadow-neo-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <Send className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-3">
            {isProcessing ? '🧠 iAsted analyse...' :
              isVoiceActive ? `🎙️ Mode vocal actif (${voiceMode === 'elevenlabs' ? 'iAsted Pro' : 'OpenAI RT'})` :
                '💬 Conversation stratégique'}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
