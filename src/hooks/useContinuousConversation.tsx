import { useCallback, useState, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Language = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'pl' | 'nl' | 'sv' | 'cs';

interface ConversationOverrides {
  agent?: {
    prompt?: {
      prompt: string;
    };
    firstMessage?: string;
    language?: Language;
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
      language: 'fr' as Language,
    },
  };

  const conversation = useConversation({
    overrides,
    onConnect: () => {
      console.log('✅ [ElevenLabs Continuous] Connecté à l\'agent');
      toast({
        title: "Mode conversation activé",
        description: "iAsted vous écoute et va vous saluer...",
      });
      
      // Activer tous les éléments audio immédiatement
      setTimeout(async () => {
        try {
          console.log('🔊 [ElevenLabs Continuous] Activation audio post-connexion...');
          
          // S'assurer que le contexte audio est activé
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('🔊 [ElevenLabs Continuous] État contexte audio:', audioContext.state);
          if (audioContext.state === 'suspended') {
            console.log('🔊 [ElevenLabs Continuous] Réactivation du contexte audio...');
            await audioContext.resume();
            console.log('✅ [ElevenLabs Continuous] Contexte audio activé');
          }
          
          // Activer tous les éléments audio de la page
          const audioElements = document.querySelectorAll('audio');
          console.log('🔊 [ElevenLabs Continuous] Nombre d\'éléments audio trouvés:', audioElements.length);
          audioElements.forEach((audio, index) => {
            audio.volume = 1.0;
            audio.muted = false;
            console.log(`✅ [ElevenLabs Continuous] Audio ${index} activé - volume:`, audio.volume, 'muted:', audio.muted);
          });
          
          // Forcer l'activation avec un son test
          const testOscillator = audioContext.createOscillator();
          const testGain = audioContext.createGain();
          testOscillator.connect(testGain);
          testGain.connect(audioContext.destination);
          testGain.gain.value = 0.001;
          testOscillator.frequency.value = 440;
          testOscillator.start();
          testOscillator.stop(audioContext.currentTime + 0.001);
          console.log('[useContinuousConversation] Son test joué pour forcer activation');
          
          // Régler le volume immédiatement
          console.log('[useContinuousConversation] Réglage volume après connexion...');
          await conversation.setVolume({ volume: 0.8 });
          console.log('[useContinuousConversation] ✅ Volume initialisé à 80% après connexion');
          
          // Le firstMessage devrait être joué automatiquement par le SDK
          // Si ce n'est pas le cas, on attend un peu et on vérifie
          setTimeout(() => {
            console.log('[useContinuousConversation] Vérification après connexion:');
            console.log('  - Statut:', conversation.status);
            console.log('  - Agent parle:', conversation.isSpeaking);
            console.log('  - Contexte audio:', audioContext.state);
            
            if (!conversation.isSpeaking && conversation.status === 'connected') {
              console.log('[useContinuousConversation] ⚠️ Agent connecté mais ne parle pas - le firstMessage devrait se jouer automatiquement');
              console.log('[useContinuousConversation] Tentative de forcer la lecture du firstMessage...');
              
              // Essayer de déclencher manuellement le firstMessage
              // Le SDK devrait le faire automatiquement, mais on peut essayer de forcer
              try {
                // Vérifier si on peut accéder aux méthodes internes
                console.log('[useContinuousConversation] Méthodes disponibles:', Object.keys(conversation));
              } catch (e) {
                console.error('[useContinuousConversation] Erreur accès méthodes:', e);
              }
            }
          }, 2000);
        } catch (error) {
          console.error('[useContinuousConversation] ❌ Erreur activation audio:', error);
        }
      }, 100);
    },
    onDisconnect: () => {
      console.log('🔌 [ElevenLabs Continuous] Déconnecté');
      setConversationId(null);
      toast({ title: "Conversation terminée" });
    },
    onMessage: (message) => {
      console.log('📨 [ElevenLabs Continuous] Message reçu:', JSON.stringify(message));
      
      // L'API @elevenlabs/react envoie des messages avec source: 'user' ou 'ai'
      if (message.source === 'user' && message.message) {
        console.log('👤 [ElevenLabs Continuous] Message utilisateur:', message.message);
        setMessages(prev => [...prev, { role: 'user', content: message.message }]);
      } else if (message.source === 'ai' && message.message) {
        console.log('🤖 [ElevenLabs Continuous] Réponse IA:', message.message);
        setMessages(prev => [...prev, { role: 'assistant', content: message.message }]);
      }
    },
    onError: (message) => {
      console.error('❌ [ElevenLabs Continuous] Erreur:', message);
      toast({
        title: "Erreur de conversation",
        description: typeof message === 'string' ? message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
    onModeChange: (mode) => {
      console.log('🎙️ [ElevenLabs Continuous] Mode changé:', mode);
    },
  });

  const startContinuousMode = useCallback(async () => {
    if (!agentId) {
      console.error('❌ [ElevenLabs Continuous] Agent ID manquant');
      toast({
        title: "Agent non configuré",
        description: "Veuillez configurer un agent ElevenLabs dans les paramètres iAsted.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 [ElevenLabs Continuous] Démarrage avec agent:', agentId);
      
      // 1. Demander accès micro avec options optimales
      console.log('🎤 [ElevenLabs Continuous] Demande accès micro...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      console.log('✅ [ElevenLabs Continuous] Accès micro obtenu');

      // 2. Activer AudioContext AVANT connexion (critique!)
      console.log('🔊 [ElevenLabs Continuous] Activation AudioContext...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🔊 [ElevenLabs Continuous] État AudioContext:', audioContext.state);
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('✅ [ElevenLabs Continuous] AudioContext activé');
      }
      
      // Son test pour forcer activation (nécessaire certains navigateurs)
      try {
        const testOsc = audioContext.createOscillator();
        const testGain = audioContext.createGain();
        testOsc.connect(testGain);
        testGain.connect(audioContext.destination);
        testGain.gain.value = 0.001;
        testOsc.start();
        testOsc.stop(audioContext.currentTime + 0.001);
        console.log('✅ [ElevenLabs Continuous] Son test joué');
      } catch (audioError) {
        console.error('⚠️ [ElevenLabs Continuous] Erreur son test:', audioError);
      }

      // 3. Obtenir signed URL
      console.log('🔑 [ElevenLabs Continuous] Récupération signed URL...');
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId }
      });

      if (error) {
        console.error('❌ [ElevenLabs Continuous] Erreur signed URL:', error);
        throw new Error(`Erreur signed URL: ${error.message || 'Erreur inconnue'}`);
      }

      if (!data?.signedUrl) {
        console.error('❌ [ElevenLabs Continuous] Signed URL manquant');
        throw new Error('Impossible d\'obtenir l\'URL de conversation');
      }

      console.log('✅ [ElevenLabs Continuous] Signed URL obtenu');

      // 4. Démarrer la session
      console.log('🚀 [ElevenLabs Continuous] Démarrage session...');
      console.log('   - FirstMessage:', overrides.agent?.firstMessage);
      console.log('   - Prompt (100 chars):', overrides.agent?.prompt?.prompt?.substring(0, 100) + '...');
      
      const id = await conversation.startSession({ 
        signedUrl: data.signedUrl 
      });
      
      console.log('[useContinuousConversation] ✅ Session démarrée avec ID:', id);
      console.log('[useContinuousConversation] Statut conversation:', conversation.status);
      console.log('[useContinuousConversation] Agent parle?', conversation.isSpeaking);
      
      // Vérifier immédiatement après démarrage
      setTimeout(() => {
        console.log('[useContinuousConversation] 📊 Vérification immédiate après startSession:');
        console.log('  - Statut:', conversation.status);
        console.log('  - Agent parle:', conversation.isSpeaking);
        console.log('  - Session ID:', id);
        
        // Si l'agent ne parle pas après 1 seconde, il y a peut-être un problème
        if (!conversation.isSpeaking && conversation.status === 'connected') {
          console.warn('[useContinuousConversation] ⚠️ L\'agent est connecté mais ne parle pas. Le firstMessage devrait être joué automatiquement.');
        }
      }, 1000);
      
      // Régler le volume immédiatement après démarrage
      setTimeout(async () => {
        try {
          console.log('[useContinuousConversation] Configuration volume initial...');
          await conversation.setVolume({ volume: 0.8 });
          console.log('[useContinuousConversation] ✅ Volume initialisé à 80%');
          
          // Forcer l'activation audio après un court délai
          setTimeout(async () => {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              if (audioContext.state === 'suspended') {
                await audioContext.resume();
                console.log('[useContinuousConversation] ✅ Contexte audio réactivé après démarrage');
              }
              
              // Vérifier le statut
              console.log('[useContinuousConversation] 📊 Vérification finale:');
              console.log('  - Statut:', conversation.status);
              console.log('  - Agent parle:', conversation.isSpeaking);
              console.log('  - Conversation ID:', id);
              console.log('  - Contexte audio:', audioContext.state);
            } catch (error) {
              console.error('[useContinuousConversation] Erreur vérification finale:', error);
            }
          }, 1000);
        } catch (volError) {
          console.error('[useContinuousConversation] ❌ Erreur réglage volume initial:', volError);
        }
      }, 300);
      
      setConversationId(id);
      setMessages([]);

      // Libérer le stream micro (le SDK gère sa propre connexion)
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ [ElevenLabs Continuous] Stream micro libéré');

    } catch (error) {
      console.error('[useContinuousConversation] Erreur démarrage conversation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de démarrer le mode conversation",
        variant: "destructive",
      });
      throw error;
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
      const clampedVolume = Math.max(0, Math.min(1, volume));
      console.log('[useContinuousConversation] Réglage du volume à:', clampedVolume * 100 + '%');
      await conversation.setVolume({ volume: clampedVolume });
      console.log('[useContinuousConversation] Volume réglé avec succès');
    } catch (error) {
      console.error('[useContinuousConversation] Erreur réglage volume:', error);
    }
  }, [conversation]);

  // Log du statut de la conversation pour débogage
  useEffect(() => {
    const interval = setInterval(() => {
      if (conversationId) {
        console.log('[useContinuousConversation] 📊 Statut conversation:');
        console.log('  - ID:', conversationId);
        console.log('  - Statut:', conversation.status);
        console.log('  - Agent parle:', conversation.isSpeaking);
        console.log('  - Messages:', messages.length);
      }
    }, 3000); // Log toutes les 3 secondes si actif
    
    return () => clearInterval(interval);
  }, [conversationId, conversation.status, conversation.isSpeaking, messages.length]);

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
