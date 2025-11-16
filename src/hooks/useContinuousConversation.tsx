import { useCallback, useState } from 'react';
import { useConversation } from '@11labs/react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationOverrides {
  agent?: {
    prompt?: {
      prompt: string;
    };
    firstMessage?: string;
    language?: string;
  };
}

export const useContinuousConversation = (
  userRole: 'president' | 'minister' | 'default',
  agentId: string
) => {
  const { toast } = useToast();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const getRolePrompt = (role: string) => {
    switch (role) {
      case 'president':
        return `Vous êtes iAsted, l'assistant vocal intelligent officiel du Président de la République Gabonaise.
        
IDENTITÉ: Assistant personnel du Président avec niveau d'accès CONFIDENTIEL.
STYLE: Professionnel, respectueux, adresse "Monsieur le Président" ou "Excellence".
CAPACITÉS: Analyse stratégique, supervision nationale, gestion de crise, conseil stratégique.
DONNÉES: Accès aux données interministérielles, indicateurs nationaux, alertes critiques.

Répondez de manière concise et orientée décision.`;
        
      case 'minister':
        return `Vous êtes iAsted, l'assistant vocal intelligent officiel du Ministre de la Pêche et de l'Économie Maritime du Gabon.
        
IDENTITÉ: Assistant du Ministre avec niveau d'accès MINISTÉRIEL.
STYLE: Professionnel et technique, adresse "Excellence" ou "Monsieur le Ministre".
CAPACITÉS: Gestion halieutique, surveillance maritime, économie maritime, développement durable.
DONNÉES: Accès aux données sectorielles, monitoring des stocks, traçabilité, réglementation.

Répondez avec expertise technique et données chiffrées.`;
        
      default:
        return `Vous êtes iAsted, l'assistant intelligent de la République Gabonaise.
        
IDENTITÉ: Assistant gouvernemental polyvalent.
STYLE: Professionnel et courtois.
CAPACITÉS: Information générale, orientation, assistance administrative.

Répondez de manière claire et professionnelle.`;
    }
  };

  const getFirstMessage = (role: string) => {
    switch (role) {
      case 'president':
        return "Bonjour Monsieur le Président, je vous écoute.";
      case 'minister':
        return "Bonjour Excellence, je vous écoute.";
      default:
        return "Bonjour, je vous écoute.";
    }
  };

  const overrides: ConversationOverrides = {
    agent: {
      prompt: {
        prompt: getRolePrompt(userRole),
      },
      firstMessage: getFirstMessage(userRole),
      language: 'fr',
    },
  };

  const conversation = useConversation({
    overrides,
    onConnect: () => {
      toast({
        title: "Mode conversation activé",
        description: "Vous pouvez parler librement, l'agent vous écoute en continu",
      });
    },
    onDisconnect: () => {
      setConversationId(null);
      toast({
        title: "Conversation terminée",
      });
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      
      // L'API @11labs/react envoie des messages avec source: 'user' ou 'ai'
      if (message.source === 'user' && message.message) {
        setMessages(prev => [...prev, { role: 'user', content: message.message }]);
      } else if (message.source === 'ai' && message.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: message.message }]);
      }
    },
    onError: (message) => {
      console.error('Conversation error:', message);
      toast({
        title: "Erreur de conversation",
        description: typeof message === 'string' ? message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const startContinuousMode = useCallback(async () => {
    try {
      // Demander l'accès au microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Obtenir l'URL signée depuis notre edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId }
      });

      if (error || !data?.signedUrl) {
        throw new Error('Impossible d\'obtenir l\'URL de conversation');
      }

      // Démarrer la conversation
      const id = await conversation.startSession({ 
        signedUrl: data.signedUrl 
      });
      setConversationId(id);
      setMessages([]);

    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de démarrer le mode conversation",
        variant: "destructive",
      });
    }
  }, [agentId, conversation, toast]);

  const stopContinuousMode = useCallback(async () => {
    try {
      await conversation.endSession();
      setConversationId(null);
    } catch (error) {
      console.error('Error stopping conversation:', error);
    }
  }, [conversation]);

  const setVolume = useCallback(async (volume: number) => {
    try {
      await conversation.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [conversation]);

  return {
    isActive: !!conversationId && conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    status: conversation.status,
    messages,
    startContinuousMode,
    stopContinuousMode,
    setVolume,
  };
};
