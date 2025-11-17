/**
 * Hook pour conversation vocale avec ElevenLabs Conversational AI
 * Utilise l'agent configuré dans la base de données pour une voix française naturelle
 */

import { useState, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const useElevenLabsVoice = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Charger la configuration de l'agent depuis la base de données
  useEffect(() => {
    const loadAgentConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('iasted_config')
          .select('agent_id, agent_name')
          .single();

        if (error) throw error;

        if (!data.agent_id) {
          console.warn('⚠️ [useElevenLabsVoice] Aucun agent_id configuré');
          toast({
            title: "Configuration manquante",
            description: "L'agent vocal n'est pas configuré. Veuillez configurer ElevenLabs.",
            variant: "destructive",
          });
          return;
        }

        console.log('✅ [useElevenLabsVoice] Agent chargé:', data.agent_name, data.agent_id);
        setAgentId(data.agent_id);
      } catch (error) {
        console.error('❌ [useElevenLabsVoice] Erreur chargement config:', error);
      }
    };

    loadAgentConfig();
  }, [toast]);

  // Configuration du hook useConversation d'ElevenLabs
  const conversation = useConversation({
    onConnect: () => {
      console.log('🎤 [useElevenLabsVoice] Connexion établie');
      setVoiceState('listening');
      toast({
        title: "iAsted connecté",
        description: "Vous pouvez maintenant parler",
      });
    },
    onDisconnect: () => {
      console.log('🔌 [useElevenLabsVoice] Déconnexion');
      setVoiceState('idle');
      setSignedUrl(null);
    },
    onMessage: (message) => {
      console.log('💬 [useElevenLabsVoice] Message reçu:', message);
      
      // Gestion des messages utilisateur (transcription)
      if (message.source === 'user' && message.message) {
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: message.message,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
      }
      
      // Gestion des messages de l'assistant
      if (message.source === 'ai' && message.message) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: message.message,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    },
    onError: (error) => {
      console.error('❌ [useElevenLabsVoice] Erreur:', error);
      const errorObj = error as any;
      toast({
        title: "Erreur",
        description: errorObj?.message || 'Une erreur est survenue',
        variant: "destructive",
      });
      setVoiceState('idle');
    },
  });

  // Suivre l'état de la conversation
  useEffect(() => {
    if (conversation.isSpeaking) {
      setVoiceState('speaking');
    } else if (conversation.status === 'connected' && !conversation.isSpeaking) {
      setVoiceState('listening');
    }
  }, [conversation.isSpeaking, conversation.status]);

  // Obtenir l'URL signée depuis l'edge function
  const getSignedUrl = useCallback(async () => {
    if (!agentId) {
      toast({
        title: "Configuration manquante",
        description: "L'agent vocal n'est pas configuré",
        variant: "destructive",
      });
      return null;
    }

    setIsLoadingUrl(true);
    try {
      console.log('🔑 [useElevenLabsVoice] Demande URL signée...');
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation', {
        body: { agentId }
      });

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL received');

      console.log('✅ [useElevenLabsVoice] URL signée reçue');
      setSignedUrl(data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('❌ [useElevenLabsVoice] Erreur obtention URL:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à iAsted",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingUrl(false);
    }
  }, [agentId, toast]);

  // Démarrer la conversation
  const startConversation = useCallback(async () => {
    if (!agentId) {
      toast({
        title: "Configuration manquante",
        description: "L'agent vocal n'est pas configuré",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🎙️ [useElevenLabsVoice] Démarrage conversation...');
      setVoiceState('connecting');

      // Demander accès au microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Obtenir l'URL signée
      const url = signedUrl || await getSignedUrl();
      if (!url) {
        setVoiceState('idle');
        return;
      }

      // Démarrer la session ElevenLabs
      const conversationId = await conversation.startSession({ signedUrl: url });
      console.log('✅ [useElevenLabsVoice] Conversation démarrée:', conversationId);

    } catch (error) {
      console.error('❌ [useElevenLabsVoice] Erreur démarrage:', error);
      
      const errorObj = error as any;
      if (errorObj?.name === 'NotAllowedError') {
        toast({
          title: "Accès microphone refusé",
          description: "Veuillez autoriser l'accès au microphone",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de démarrer la conversation",
          variant: "destructive",
        });
      }
      
      setVoiceState('idle');
    }
  }, [agentId, signedUrl, getSignedUrl, conversation, toast]);

  // Arrêter la conversation
  const stopConversation = useCallback(async () => {
    console.log('🛑 [useElevenLabsVoice] Arrêt conversation...');
    try {
      await conversation.endSession();
      setVoiceState('idle');
      setMessages([]);
    } catch (error) {
      console.error('❌ [useElevenLabsVoice] Erreur arrêt:', error);
    }
  }, [conversation]);

  // Toggle conversation (démarrer ou arrêter)
  const toggleConversation = useCallback(async () => {
    if (conversation.status === 'connected') {
      await stopConversation();
    } else {
      await startConversation();
    }
  }, [conversation.status, startConversation, stopConversation]);

  // Ajuster le volume
  const setVolume = useCallback(async (volume: number) => {
    try {
      await conversation.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
    } catch (error) {
      console.error('❌ [useElevenLabsVoice] Erreur volume:', error);
    }
  }, [conversation]);

  return {
    voiceState,
    messages,
    isConnected: conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    isLoading: isLoadingUrl || voiceState === 'connecting',
    agentConfigured: !!agentId,
    toggleConversation,
    startConversation,
    stopConversation,
    setVolume,
  };
};
