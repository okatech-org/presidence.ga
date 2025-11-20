import { useState, useCallback } from 'react';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      let toolCalls: any[] = [];

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

                // Gérer les tool calls
                if (delta?.tool_calls) {
                  toolCalls.push(...delta.tool_calls);
                }

                // Gérer la fin du message avec tool calls
                if (parsed.choices?.[0]?.finish_reason === 'tool_calls') {
                  // Traiter les tool calls
                  for (const toolCall of toolCalls) {
                    if (toolCall.function?.name === 'generate_document') {
                      await handleDocumentGeneration(toolCall.function.arguments);
                    }
                  }
                }
              } catch (e) {
                // Ligne non-JSON, ignorer
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

  const handleDocumentGeneration = async (argsString: string) => {
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

    } catch (error) {
      console.error('Erreur génération document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le document PDF",
        variant: "destructive",
      });
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setGeneratedDocuments([]);
  }, []);

  return {
    messages,
    generatedDocuments,
    isLoading,
    sendMessage,
    clearChat,
  };
};
