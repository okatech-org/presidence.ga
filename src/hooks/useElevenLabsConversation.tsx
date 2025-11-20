import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { forceResumeAllAudioContexts } from '@/utils/audioContextManager';

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
      
      // Forcer activation audio immédiate via le gestionnaire global
      setTimeout(() => {
        console.log('🔊 [ElevenLabs] Forçage activation audio via gestionnaire global...');
        
        // Forcer tous les AudioContext
        forceResumeAllAudioContexts();
        
        // Activer aussi les éléments audio HTML
        const audioElements = document.querySelectorAll('audio');
        console.log('🔊 [ElevenLabs] Nombre d\'éléments audio trouvés:', audioElements.length);
        
        audioElements.forEach((audio, index) => {
          audio.volume = 1.0;
          audio.muted = false;
          audio.play().catch(err => {
            console.warn(`⚠️ [ElevenLabs] Erreur play audio ${index}:`, err);
          });
          console.log(`✅ [ElevenLabs] Audio ${index} activé - volume:`, audio.volume, 'muted:', audio.muted);
        });
      }, 100);
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
    onModeChange: (mode) => {
      console.log('🎙️ [ElevenLabs] Mode changé:', mode);
      if (mode.mode === 'speaking') {
        setConversationState('speaking');
        onStateChange?.('speaking');
      } else if (mode.mode === 'listening') {
        setConversationState('connected');
        onStateChange?.('connected');
      }
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
      console.log('🔍 [ElevenLabs] Agent ID fourni:', targetAgentId);
      console.log('🔍 [ElevenLabs] Agent ID actuel:', agentId);
      
      setConversationState('connecting');
      onStateChange?.('connecting');

      const finalAgentId = targetAgentId || agentId;
      if (!finalAgentId) {
        console.error('❌ [ElevenLabs] Aucun agent ID disponible');
        throw new Error('Aucun agent ID disponible');
      }
      
      console.log('✅ [ElevenLabs] Agent ID final:', finalAgentId);

      // 1. Demander accès micro avec interaction utilisateur
      console.log('🎤 [ElevenLabs] Demande accès micro...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        } 
      });
      console.log('✅ [ElevenLabs] Accès micro autorisé');
      console.log('🎤 [ElevenLabs] Pistes audio:', stream.getAudioTracks().length);

      // 2. Activer AudioContext AVANT la connexion
      console.log('🔊 [ElevenLabs] Activation AudioContext...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🔊 [ElevenLabs] État AudioContext initial:', audioContext.state);
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('✅ [ElevenLabs] AudioContext activé');
      }
      
      // Jouer un son silencieux pour débloquer
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0.001;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.001);
        console.log('✅ [ElevenLabs] Son silencieux joué');
      } catch (err) {
        console.warn('⚠️ [ElevenLabs] Erreur son silencieux:', err);
      }

      // 3. Obtenir le signed URL
      const url = await getSignedUrl(finalAgentId);
      if (!url) {
        setConversationState('disconnected');
        onStateChange?.('disconnected');
        return;
      }

      // 4. Démarrer la session
      console.log('🚀 [ElevenLabs] Démarrage session avec agent:', finalAgentId);
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
        description: error instanceof Error ? error.message : "Impossible de démarrer la conversation",
        variant: "destructive",
      });
    }
  }, [agentId, conversation, getSignedUrl, onStateChange, toast]);

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
