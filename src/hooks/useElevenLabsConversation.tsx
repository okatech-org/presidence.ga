import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ConversationState = 'disconnected' | 'connecting' | 'connected' | 'speaking';

interface UseElevenLabsConversationProps {
  agentId?: string;
  onMessage?: (message: any) => void;
  onStateChange?: (state: ConversationState) => void;
}

export const useElevenLabsConversation = ({
  agentId,
  onMessage,
  onStateChange
}: UseElevenLabsConversationProps = {}) => {
  const { toast } = useToast();
  const [conversationState, setConversationState] = useState<ConversationState>('disconnected');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ [ElevenLabs] Connecté à l\'agent');
      setConversationState('connected');
      onStateChange?.('connected');
    },
    onDisconnect: () => {
      console.log('🔌 [ElevenLabs] Déconnecté de l\'agent');
      setConversationState('disconnected');
      onStateChange?.('disconnected');
      conversationIdRef.current = null;
    },
    onMessage: (message) => {
      console.log('📨 [ElevenLabs] Message reçu:', message);
      onMessage?.(message);
    },
    onError: (error) => {
      console.error('❌ [ElevenLabs] Erreur:', error);
      toast({
        title: "Erreur de conversation",
        description: "Une erreur s'est produite avec l'agent vocal",
        variant: "destructive",
      });
    },
  });

  // Fonction pour obtenir le signed URL
  const getSignedUrl = useCallback(async (targetAgentId?: string) => {
    try {
      console.log('🔑 [ElevenLabs] Demande de signed URL...');
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId: targetAgentId || agentId }
      });

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Pas de signed URL retourné');

      console.log('✅ [ElevenLabs] Signed URL obtenu');
      setSignedUrl(data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('❌ [ElevenLabs] Erreur signed URL:', error);
      toast({
        title: "Erreur d'authentification",
        description: "Impossible d'obtenir l'accès à l'agent vocal",
        variant: "destructive",
      });
      return null;
    }
  }, [agentId, toast]);

  // Démarrer la conversation
  const startConversation = useCallback(async (targetAgentId?: string) => {
    try {
      console.log('🚀 [ElevenLabs] Démarrage conversation...');
      setConversationState('connecting');
      onStateChange?.('connecting');

      // Obtenir le signed URL
      const url = await getSignedUrl(targetAgentId);
      if (!url) {
        setConversationState('disconnected');
        onStateChange?.('disconnected');
        return;
      }

      // Démarrer la session avec agentId
      const convId = await conversation.startSession({ 
        signedUrl: url 
      });
      conversationIdRef.current = convId;
      
      console.log('✅ [ElevenLabs] Conversation démarrée, ID:', convId);
      
      toast({
        title: "Conversation démarrée",
        description: "iAsted Pro est maintenant actif",
      });
    } catch (error) {
      console.error('❌ [ElevenLabs] Erreur démarrage:', error);
      setConversationState('disconnected');
      onStateChange?.('disconnected');
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la conversation",
        variant: "destructive",
      });
    }
  }, [conversation, getSignedUrl, onStateChange, toast]);

  // Arrêter la conversation
  const endConversation = useCallback(async () => {
    try {
      console.log('🛑 [ElevenLabs] Arrêt conversation...');
      await conversation.endSession();
      setConversationState('disconnected');
      onStateChange?.('disconnected');
      conversationIdRef.current = null;
      
      toast({
        title: "Conversation terminée",
        description: "iAsted Pro est maintenant inactif",
      });
    } catch (error) {
      console.error('❌ [ElevenLabs] Erreur arrêt:', error);
    }
  }, [conversation, onStateChange, toast]);

  // Changer le volume
  const setVolume = useCallback(async (volume: number) => {
    try {
      await conversation.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
    } catch (error) {
      console.error('❌ [ElevenLabs] Erreur volume:', error);
    }
  }, [conversation]);

  // Détecter quand l'agent parle
  useEffect(() => {
    if (conversation.isSpeaking) {
      setConversationState('speaking');
      onStateChange?.('speaking');
    } else if (conversation.status === 'connected') {
      setConversationState('connected');
      onStateChange?.('connected');
    }
  }, [conversation.isSpeaking, conversation.status, onStateChange]);

  return {
    conversationState,
    conversationId: conversationIdRef.current,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === 'connected',
    startConversation,
    endConversation,
    setVolume,
    status: conversation.status,
  };
};
