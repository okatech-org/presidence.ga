import { useConversation } from '@elevenlabs/react';
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const IASTED_AGENT_ID = 'vSbBo3f3ZpM5ycX2UtPe'; // ID de l'agent iAsted configuré sur ElevenLabs

export const useIastedConversation = () => {
  const { toast } = useToast();
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ [iAsted] Connecté');
      toast({
        title: "iAsted prêt",
        description: "Vous pouvez parler",
      });
    },
    onDisconnect: () => {
      console.log('🔌 [iAsted] Déconnecté');
    },
    onError: (error) => {
      console.error('❌ [iAsted] Erreur:', error);
      toast({
        title: "Erreur",
        description: typeof error === 'string' ? error : 'Une erreur est survenue',
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log('📨 [iAsted] Message:', message);
    },
  });

  const startConversation = useCallback(async () => {
    try {
      console.log('🎤 [iAsted] Démarrage conversation...');
      
      // Demander l'accès au microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Obtenir l'URL signée pour l'agent
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId: IASTED_AGENT_ID }
      });
      
      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Aucune URL signée reçue');
      
      console.log('✅ [iAsted] URL signée obtenue');
      
      // Démarrer la conversation
      await conversation.startSession({
        signedUrl: data.signedUrl,
      });
      
    } catch (error) {
      console.error('❌ [iAsted] Erreur démarrage:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Impossible de démarrer',
        variant: "destructive",
      });
    }
  }, [conversation, toast]);

  const stopConversation = useCallback(async () => {
    try {
      console.log('🛑 [iAsted] Arrêt conversation...');
      await conversation.endSession();
    } catch (error) {
      console.error('❌ [iAsted] Erreur arrêt:', error);
    }
  }, [conversation]);

  const toggleConversation = useCallback(async () => {
    if (conversation.status === 'connected') {
      await stopConversation();
    } else {
      await startConversation();
    }
  }, [conversation.status, startConversation, stopConversation]);

  return {
    isConnected: conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    startConversation,
    stopConversation,
    toggleConversation,
  };
};
