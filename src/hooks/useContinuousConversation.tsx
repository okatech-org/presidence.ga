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
      console.log('[useContinuousConversation] ✅ Connecté à l\'agent');
      toast({
        title: "Mode conversation activé",
        description: "iAsted vous écoute et va vous saluer...",
      });
      
      // Activer l'audio immédiatement après connexion
      setTimeout(async () => {
        try {
          console.log('[useContinuousConversation] Activation audio post-connexion...');
          
          // S'assurer que le contexte audio est activé
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('[useContinuousConversation] État contexte audio au connect:', audioContext.state);
          if (audioContext.state === 'suspended') {
            console.log('[useContinuousConversation] Réactivation du contexte audio...');
            await audioContext.resume();
            console.log('[useContinuousConversation] ✅ Contexte audio activé');
          }
          
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
      console.log('[useContinuousConversation] ❌ Déconnecté de l\'agent');
      setConversationId(null);
      toast({
        title: "Conversation terminée",
      });
    },
    onMessage: (message) => {
      console.log('[useContinuousConversation] 📨 Message reçu:', message);
      
      // L'API @elevenlabs/react envoie des messages avec source: 'user' ou 'ai'
      if (message.source === 'user' && message.message) {
        setMessages(prev => [...prev, { role: 'user', content: message.message }]);
      } else if (message.source === 'ai' && message.message) {
        console.log('[useContinuousConversation] 🔊 Réponse de l\'IA:', message.message);
        setMessages(prev => [...prev, { role: 'assistant', content: message.message }]);
      }
    },
    onError: (message) => {
      console.error('[useContinuousConversation] ❌ Erreur de conversation:', message);
      toast({
        title: "Erreur de conversation",
        description: typeof message === 'string' ? message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const startContinuousMode = useCallback(async () => {
    if (!agentId) {
      console.error('[useContinuousConversation] Agent ID manquant');
      toast({
        title: "Agent non configuré",
        description: "Veuillez configurer un agent ElevenLabs dans les paramètres iAsted.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('[useContinuousConversation] Démarrage de la conversation avec agent:', agentId);
      
      // Demander l'accès au microphone
      console.log('[useContinuousConversation] Demande d\'accès au microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[useContinuousConversation] Accès microphone obtenu');

      // Obtenir l'URL signée depuis notre edge function
      console.log('[useContinuousConversation] Récupération de l\'URL signée...');
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId }
      });

      if (error) {
        console.error('[useContinuousConversation] Erreur récupération URL signée:', error);
        throw new Error(`Erreur lors de la récupération de l'URL: ${error.message || 'Erreur inconnue'}`);
      }

      if (!data?.signedUrl) {
        console.error('[useContinuousConversation] URL signée non reçue');
        throw new Error('Impossible d\'obtenir l\'URL de conversation');
      }

      console.log('[useContinuousConversation] URL signée obtenue, démarrage de la session...');

      // Activer le contexte audio AVANT de démarrer la session (critique pour Chrome/Firefox)
      console.log('[useContinuousConversation] Activation du contexte audio avant démarrage...');
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('[useContinuousConversation] État contexte audio initial:', audioContext.state);
        if (audioContext.state === 'suspended') {
          console.log('[useContinuousConversation] Réactivation du contexte audio suspendu...');
          await audioContext.resume();
          console.log('[useContinuousConversation] ✅ Contexte audio activé avant démarrage');
        }
        
        // Créer un son test très court pour forcer l'activation (nécessaire pour certains navigateurs)
        const testOscillator = audioContext.createOscillator();
        const testGain = audioContext.createGain();
        testOscillator.connect(testGain);
        testGain.connect(audioContext.destination);
        testGain.gain.value = 0.001; // Très silencieux
        testOscillator.frequency.value = 440;
        testOscillator.start();
        testOscillator.stop(audioContext.currentTime + 0.001);
        console.log('[useContinuousConversation] Son test joué pour activation audio');
      } catch (audioError) {
        console.error('[useContinuousConversation] Erreur activation contexte audio:', audioError);
      }

      // Démarrer la conversation avec le volume par défaut
      console.log('[useContinuousConversation] Démarrage de la session avec URL signée...');
      console.log('[useContinuousConversation] FirstMessage configuré:', overrides.agent?.firstMessage);
      console.log('[useContinuousConversation] Prompt configuré:', overrides.agent?.prompt?.prompt?.substring(0, 100) + '...');
      
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

      // Libérer le stream audio après démarrage (le SDK gère sa propre connexion)
      stream.getTracks().forEach(track => track.stop());

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
