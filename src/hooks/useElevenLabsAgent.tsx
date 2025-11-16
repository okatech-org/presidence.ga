import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseElevenLabsAgentProps {
  agentId: string | null;
  userRole: 'president' | 'minister' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
  autoStart?: boolean;
}

export const useElevenLabsAgent = ({ 
  agentId, 
  userRole, 
  onSpeakingChange,
  autoStart = false 
}: UseElevenLabsAgentProps) => {
  const { toast } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);

  // Configuration de l'agent ElevenLabs
  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Connecté à l\'agent iAsted');
      setConversationStarted(true);
      toast({
        title: "Connexion établie",
        description: "Agent iAsted prêt à converser",
      });
    },
    onDisconnect: () => {
      console.log('🔌 Déconnexion de l\'agent iAsted');
      setConversationStarted(false);
    },
    onMessage: (message) => {
      console.log('📨 Message reçu:', message);
    },
    onError: (error) => {
      console.error('❌ Erreur agent iAsted:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à l'agent iAsted",
        variant: "destructive",
      });
    },
  });

  // Récupérer l'URL signée depuis l'edge function
  const getSignedUrl = useCallback(async () => {
    if (!agentId) {
      console.warn('⚠️ Agent ID manquant');
      return null;
    }

    setIsLoadingUrl(true);
    try {
      console.log('🔑 Récupération du signed URL pour agent:', agentId);
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId }
      });

      if (error) {
        console.error('❌ Erreur lors de la récupération du signed URL:', error);
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error('URL signée non reçue');
      }

      console.log('✅ Signed URL reçu');
      setSignedUrl(data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('❌ Erreur getSignedUrl:', error);
      toast({
        title: "Erreur d'initialisation",
        description: "Impossible d'obtenir l'accès à l'agent",
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
        title: "Agent non configuré",
        description: "Veuillez configurer l'agent iAsted dans les paramètres",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Démarrage de la conversation...');
      
      // Obtenir l'URL signée
      const url = signedUrl || await getSignedUrl();
      if (!url) {
        throw new Error('Impossible d\'obtenir l\'URL signée');
      }

      // Demander l'accès au microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Démarrer la session avec l'URL signée
      console.log('🎤 Démarrage de la session ElevenLabs...');
      const conversationId = await conversation.startSession({ 
        signedUrl: url 
      });
      
      console.log('✅ Session démarrée:', conversationId);
      
    } catch (error) {
      console.error('❌ Erreur lors du démarrage:', error);
      if (error instanceof Error && error.message.includes('Permission denied')) {
        toast({
          title: "Accès au microphone refusé",
          description: "Veuillez autoriser l'accès au microphone",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur de démarrage",
          description: "Impossible de démarrer la conversation",
          variant: "destructive",
        });
      }
    }
  }, [agentId, signedUrl, conversation, getSignedUrl, toast]);

  // Arrêter la conversation
  const stopConversation = useCallback(async () => {
    try {
      console.log('⏹️ Arrêt de la conversation...');
      await conversation.endSession();
      setConversationStarted(false);
    } catch (error) {
      console.error('❌ Erreur lors de l\'arrêt:', error);
    }
  }, [conversation]);

  // Ajuster le volume
  const setVolume = useCallback(async (volume: number) => {
    try {
      await conversation.setVolume({ volume });
    } catch (error) {
      console.error('❌ Erreur lors du changement de volume:', error);
    }
  }, [conversation]);

  // Auto-démarrer si demandé
  useEffect(() => {
    if (autoStart && agentId && !conversationStarted && !isLoadingUrl) {
      startConversation();
    }
  }, [autoStart, agentId, conversationStarted, isLoadingUrl, startConversation]);

  // Notifier les changements de speaking state
  useEffect(() => {
    if (onSpeakingChange) {
      onSpeakingChange(conversation.isSpeaking);
    }
  }, [conversation.isSpeaking, onSpeakingChange]);

  return {
    // États
    isConnected: conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    isLoading: isLoadingUrl,
    conversationStarted,
    
    // Actions
    startConversation,
    stopConversation,
    setVolume,
  };
};
