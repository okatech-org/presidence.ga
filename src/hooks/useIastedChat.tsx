import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateOfficialPDF } from '@/utils/generateOfficialPDF';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedDocument {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  fileName: string;
  pdfBlob: Blob;
  timestamp: Date;
}

interface UseIastedChatProps {
  userRole?: 'president' | 'minister' | 'default';
  sessionId?: string;
}

export const useIastedChat = ({ userRole = 'default', sessionId }: UseIastedChatProps) => {
  const { toast } = useToast();
  
  // Clé de stockage unique par utilisateur et rôle
  const storageKey = `iasted-chat-${userRole}-${sessionId || 'default'}`;
  
  // Initialiser depuis localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('[useIastedChat] Erreur lecture localStorage:', error);
    }
    return [];
  });
  
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sauvegarder dans localStorage à chaque changement de messages
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          })),
          lastUpdated: new Date().toISOString()
        }));
      } catch (error) {
        console.error('[useIastedChat] Erreur sauvegarde localStorage:', error);
      }
    }
  }, [messages, storageKey]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Préparer l'historique des messages pour l'API
      const messageHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Appeler l'edge function chat-iasted avec streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-iasted`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: messageHistory,
            userRole,
            userGender: 'male',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      // Accumulation des tool calls par index
      const toolCallsMap = new Map<number, {
        id?: string;
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>();

      const assistantMessageId = `assistant-${Date.now()}`;
      
      // Ajouter le message assistant vide qui sera mis à jour
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                const finishReason = parsed.choices?.[0]?.finish_reason;

                // Gérer le contenu texte
                if (delta?.content) {
                  assistantContent += delta.content;
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }

                // Gérer les tool calls (accumulation progressive)
                if (delta?.tool_calls) {
                  for (const toolCallDelta of delta.tool_calls) {
                    const index = toolCallDelta.index;
                    const existing = toolCallsMap.get(index) || {};
                    
                    // Fusionner les données du tool call
                    if (toolCallDelta.id) {
                      existing.id = toolCallDelta.id;
                    }
                    if (toolCallDelta.type) {
                      existing.type = toolCallDelta.type;
                    }
                    if (toolCallDelta.function) {
                      if (!existing.function) {
                        existing.function = {};
                      }
                      if (toolCallDelta.function.name) {
                        existing.function.name = toolCallDelta.function.name;
                      }
                      if (toolCallDelta.function.arguments) {
                        existing.function.arguments = (existing.function.arguments || '') + toolCallDelta.function.arguments;
                      }
                    }
                    
                    toolCallsMap.set(index, existing);
                  }
                }

                // Gérer la fin du message avec tool calls
                if (finishReason === 'tool_calls') {
                  console.log('[useIastedChat] Tool calls détectés:', Array.from(toolCallsMap.values()));
                  
                  // Traiter tous les tool calls accumulés et collecter les résultats
                  const toolResults: Array<{
                    tool_call_id: string;
                    output: string;
                  }> = [];
                  
                  for (const toolCall of toolCallsMap.values()) {
                    if (toolCall.function?.name === 'generate_document' && toolCall.function.arguments && toolCall.id) {
                      try {
                        const result = await handleDocumentGeneration(toolCall.function.arguments);
                        toolResults.push({
                          tool_call_id: toolCall.id,
                          output: result,
                        });
                      } catch (error) {
                        console.error('[useIastedChat] Erreur lors du traitement du tool call:', error);
                        toolResults.push({
                          tool_call_id: toolCall.id,
                          output: JSON.stringify({ error: 'Échec de la génération du document' }),
                        });
                        toast({
                          title: "Erreur",
                          description: "Impossible de générer le document",
                          variant: "destructive",
                        });
                      }
                    }
                  }
                  
                  // Envoyer les résultats des tool calls à l'API pour continuer la conversation
                  if (toolResults.length > 0) {
                    // Construire l'historique avec le message utilisateur et le message assistant avec tool calls
                    const fullHistory = [
                      ...messages,
                      userMessage,
                      {
                        role: 'assistant',
                        content: assistantContent,
                        tool_calls: Array.from(toolCallsMap.values()).map(tc => ({
                          id: tc.id,
                          type: tc.type,
                          function: tc.function,
                        })),
                      },
                    ];
                    await continueConversationWithToolResults(fullHistory, toolResults);
                  }
                }
              } catch (e) {
                // Ligne non-JSON, ignorer silencieusement
                console.debug('[useIastedChat] Ligne non-JSON ignorée:', line);
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message à iAsted",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, userRole, toast]);

  const handleDocumentGeneration = async (argsString: string): Promise<string> => {
    try {
      const args = JSON.parse(argsString);
      
      // Générer le PDF
      const pdfBlob = await generateOfficialPDF({
        type: args.type || 'lettre',
        recipient: args.recipient,
        subject: args.subject,
        content_points: args.content_points || [],
        date: new Date().toLocaleDateString('fr-FR'),
      });

      // Créer le nom du fichier
      const fileName = `${args.type}_${args.recipient.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

      // Ajouter le document généré
      const newDocument: GeneratedDocument = {
        id: `doc-${Date.now()}`,
        type: args.type,
        recipient: args.recipient,
        subject: args.subject,
        fileName,
        pdfBlob,
        timestamp: new Date(),
      };

      setGeneratedDocuments(prev => [...prev, newDocument]);

      toast({
        title: "Document généré",
        description: `${args.type} pour ${args.recipient} créé avec succès`,
      });

      // Retourner le résultat pour l'envoyer à l'API
      return JSON.stringify({
        success: true,
        document: {
          type: args.type,
          recipient: args.recipient,
          subject: args.subject,
          fileName,
        },
      });

    } catch (error) {
      console.error('Erreur génération document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le document PDF",
        variant: "destructive",
      });
      throw error;
    }
  };

  const continueConversationWithToolResults = useCallback(async (
    fullHistory: any[],
    toolResults: Array<{ tool_call_id: string; output: string }>
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      console.log('[useIastedChat] Envoi des résultats des tool calls:', toolResults);

      // Préparer l'historique avec les résultats des tool calls
      const messageHistory = fullHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
      }));

      // Ajouter les résultats des tool calls
      for (const result of toolResults) {
        messageHistory.push({
          role: 'tool',
          content: result.output,
          tool_call_id: result.tool_call_id,
        } as any);
      }

      // Appeler l'API avec les résultats
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-iasted`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: messageHistory,
            userRole,
            userGender: 'male',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      // Traiter la réponse en streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessageId = `assistant-continuation-${Date.now()}`;
      
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;

                if (delta?.content) {
                  assistantContent += delta.content;
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.debug('[useIastedChat] Ligne non-JSON ignorée:', line);
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('[useIastedChat] Erreur continuation conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de continuer la conversation",
        variant: "destructive",
      });
    }
  }, [userRole, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setGeneratedDocuments([]);
    
    // Supprimer du localStorage
    try {
      localStorage.removeItem(storageKey);
      console.log('[useIastedChat] Chat effacé du localStorage');
    } catch (error) {
      console.error('[useIastedChat] Erreur suppression localStorage:', error);
    }
  }, [storageKey]);

  return {
    messages,
    generatedDocuments,
    isLoading,
    sendMessage,
    clearChat,
  };
};
