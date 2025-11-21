import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ConversationState = 'disconnected' | 'connecting' | 'connected' | 'speaking';

interface UseElevenLabsConversationProps {
  agentId?: string;
  onMessage?: (message: any) => void;
  onStateChange?: (state: ConversationState) => void;
}

export const useElevenLabsConversation = ({
  agentId: providedAgentId,
  onMessage,
  onStateChange
}: UseElevenLabsConversationProps = {}) => {
  const { toast } = useToast();
  const [conversationState, setConversationState] = useState<ConversationState>('disconnected');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | undefined>(providedAgentId);
  const conversationIdRef = useRef<string | null>(null);

  // Créer automatiquement l'agent si nécessaire
  useEffect(() => {
    const ensureAgent = async () => {
      if (providedAgentId) return;
      if (agentId) return; // Déjà chargé

      try {
        console.log('🔍 [ElevenLabs] Vérification agent...');
        
        // Vérifier si un agent existe
        const { data: existingConfig, error: configError } = await supabase
          .from('iasted_config')
          .select('agent_id')
          .maybeSingle();

        if (configError) {
          console.log('ℹ️ [ElevenLabs] Pas de config, création automatique...');
        }

        if (existingConfig?.agent_id) {
          console.log('✅ [ElevenLabs] Agent existant trouvé:', existingConfig.agent_id);
          setAgentId(existingConfig.agent_id);
          return;
        }

        // Créer l'agent automatiquement
        console.log('🚀 [ElevenLabs] Création automatique de l\'agent iAsted Pro...');
        const { data: createData, error: createError } = await supabase.functions.invoke('create-elevenlabs-agent');

        if (createError) {
          console.error('❌ [ElevenLabs] Erreur création agent:', createError);
          return;
        }

        if (createData?.agentId) {
          console.log('✅ [ElevenLabs] Agent créé automatiquement:', createData.agentId);
          setAgentId(createData.agentId);
        }
      } catch (error) {
        console.error('❌ [ElevenLabs] Erreur setup agent:', error);
      }
    };

    ensureAgent();
  }, [providedAgentId, agentId]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ [ElevenLabs] Connecté à l\'agent');
      setConversationState('connected');
      onStateChange?.('connected');
      
      // L'agent va automatiquement dire son first_message
      console.log('🎙️ [ElevenLabs] En attente du message de bienvenue...');
    },
    onDisconnect: () => {
      console.log('🔌 [ElevenLabs] Déconnecté de l\'agent');
      setConversationState('disconnected');
      onStateChange?.('disconnected');
      conversationIdRef.current = null;
    },
    onMessage: (message) => {
      console.log('📨 [ElevenLabs] Message reçu:', JSON.stringify(message, null, 2));
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
    agentId,
    hasAgent: !!agentId,
  };
};
