import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
}

interface UseVoiceInteractionOptions {
  onSpeakingChange?: (isSpeaking: boolean) => void;
  silenceDuration?: number;
  silenceThreshold?: number;
  continuousMode?: boolean;
  voiceId?: string;
}

export function useVoiceInteraction(options: UseVoiceInteractionOptions = {}) {
  const { toast } = useToast();
  const {
    onSpeakingChange,
    silenceDuration = 2000,
    silenceThreshold = 10,
    continuousMode = false,
    voiceId,
  } = options;

  // États
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Utiliser le voiceId fourni ou la voix iAsted Pro par défaut
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(voiceId || 'EV6XgOdBELK29O2b4qyM');
  
  // Log pour debug
  useEffect(() => {
    console.log('🎙️ [useVoiceInteraction] VoiceId actuel:', selectedVoiceId);
  }, [selectedVoiceId]);
  const [silenceDetected, setSilenceDetected] = useState(false);
  const [silenceTimeRemaining, setSilenceTimeRemaining] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [continuousModePaused, setContinuousModePaused] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: Date }>>([]);

  // Refs pour l'enregistrement audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Charger l'utilisateur
  useEffect(() => {
    const loadUser = async () => {
      // Essayer d'abord avec getSession qui est plus fiable
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        console.log('[useVoiceInteraction] ✅ Utilisateur chargé via getSession:', session.user.id);
      } else {
        // Fallback sur getUser
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          console.log('[useVoiceInteraction] ✅ Utilisateur chargé via getUser:', user.id);
        } else {
          console.warn('[useVoiceInteraction] ⚠️ Aucun utilisateur trouvé');
        }
      }
    };
    loadUser();
  }, []);

  // Mettre à jour selectedVoiceId quand voiceId change
  useEffect(() => {
    if (voiceId) {
      console.log('[useVoiceInteraction] 🎙️ Mise à jour voice ID:', voiceId);
      setSelectedVoiceId(voiceId);
    }
  }, [voiceId]);

  // Créer une nouvelle session
  const createSession = useCallback(async (): Promise<string> => {
    // Vérifier d'abord si userId est déjà chargé
    let currentUserId = userId;
    
    // Si userId n'est pas encore chargé, essayer de le récupérer
    if (!currentUserId) {
      // Essayer d'abord avec getSession qui est plus fiable
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        // Si getSession échoue, essayer getUser
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('[createSession] Erreur authentification:', { sessionError, authError });
          throw new Error('User not authenticated. Please log in first.');
        }
        currentUserId = user.id;
        setUserId(currentUserId);
      } else {
        currentUserId = session.user.id;
        setUserId(currentUserId);
      }
    }

    const { data, error } = await supabase
      .from('conversation_sessions')
      .insert({
        user_id: currentUserId,
        started_at: new Date().toISOString(),
        settings: {
          voiceId: selectedVoiceId,
          silenceDuration,
          silenceThreshold,
          continuousMode,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[createSession] Erreur création session:', error);
      throw error;
    }
    return data.id;
  }, [userId, selectedVoiceId, silenceDuration, silenceThreshold, continuousMode]);

  // Détecter le silence et mettre à jour les états
  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 255) * 100);
    setAudioLevel(normalizedLevel);

    // Détection de silence automatique
    if (normalizedLevel < silenceThreshold) {
      if (!silenceTimerRef.current) {
        console.log('🔇 Début de silence détecté');
        setSilenceDetected(true);
        let timeRemaining = silenceDuration;
        
        silenceTimerRef.current = setInterval(() => {
          timeRemaining -= 100;
          setSilenceTimeRemaining(timeRemaining);
          
          // Quand le silence atteint la durée configurée, arrêter l'écoute automatiquement
          if (timeRemaining <= 0 && voiceState === 'listening') {
            console.log('🔇 Silence confirmé - arrêt automatique de l\'écoute');
            clearInterval(silenceTimerRef.current!);
            silenceTimerRef.current = null;
            setSilenceDetected(false);
            setSilenceTimeRemaining(0);
            // Arrêter l'enregistrement - ceci va déclencher processAudio via mediaRecorder.onstop
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
              setVoiceState('thinking');
            }
          }
        }, 100);
      }
    } else {
      // L'utilisateur parle à nouveau, réinitialiser le timer
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
        setSilenceDetected(false);
        setSilenceTimeRemaining(0);
      }
    }

    if (voiceState === 'listening') {
      requestAnimationFrame(analyzeAudioLevel);
    }
  }, [voiceState, silenceThreshold, silenceDuration]); // stopListening n'est pas inclus car on utilise directement mediaRecorderRef

  // Démarrer l'écoute
  const startListening = useCallback(async () => {
    try {
      console.log('🎤 Démarrage de l\'écoute...');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Créer le contexte audio pour l'analyse
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Créer le MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Enregistrement arrêté');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Nettoyer
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setVoiceState('listening');
      
      // Démarrer l'analyse audio
      analyzeAudioLevel();

    } catch (error) {
      console.error('❌ Erreur microphone:', error);
      toast({
        title: "Erreur microphone",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, [analyzeAudioLevel, toast]);

  // Arrêter l'écoute
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('🛑 Arrêt de l\'enregistrement...');
      mediaRecorderRef.current.stop();
      setVoiceState('thinking');
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Traiter l'audio
  const processAudio = async (audioBlob: Blob) => {
    if (!sessionId) {
      console.error('❌ Pas de sessionId');
      return;
    }

    try {
      console.log('📝 Traitement de l\'audio...');
      setVoiceState('thinking');

      // Convertir en base64
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Calculer la durée de l'audio pour estimer la complexité
      const audioDurationMs = audioBlob.size / 16; // Estimation approximative
      
      // Temps de réflexion adaptatif (2-5 secondes selon la longueur)
      // Audio court (< 2s) = 2s de réflexion
      // Audio moyen (2-5s) = 3s de réflexion  
      // Audio long (> 5s) = 4-5s de réflexion
      let thinkingTime = 2000; // minimum 2 secondes
      if (audioDurationMs > 2000) thinkingTime = 3000;
      if (audioDurationMs > 5000) thinkingTime = Math.min(5000, 4000 + (audioDurationMs - 5000) / 10);
      
      console.log(`🤔 Temps de réflexion: ${thinkingTime}ms (durée audio estimée: ${audioDurationMs}ms)`);

      // Appeler chat-with-iasted
      const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
        body: {
          sessionId,
          userId,
          audioBase64,
          langHint: 'fr',
          voiceId: selectedVoiceId,
          generateAudio: true,
          userRole: 'president', // Application dédiée à la présidence
        },
      });

      if (error) throw error;

      console.log('✅ Réponse reçue:', data);

      // Simuler le temps de réflexion avant de répondre
      await new Promise(resolve => setTimeout(resolve, thinkingTime));

      // Ajouter les messages à l'historique de la conversation
      if (data.transcript) {
        setConversationMessages(prev => [...prev, { 
          role: 'user', 
          text: data.transcript, 
          timestamp: new Date() 
        }]);
      }
      
      if (data.answer) {
        setConversationMessages(prev => [...prev, { 
          role: 'assistant', 
          text: data.answer, 
          timestamp: new Date() 
        }]);
      }

      // Vérifier le routage
      if (data.route?.category === 'voice_command') {
        console.log('🎙️ Commande vocale détectée:', data.route.command);
        handleVoiceCommand(data.route.command, data.route.args);
        
        // Mode continu - relancer l'écoute si non-pause
        if (continuousMode && !isPaused) {
          setTimeout(() => {
            startListening();
          }, 500);
        } else {
          setVoiceState('idle');
        }
        return;
      }

      // Si demande de résumé
      if (data.route?.category === 'ask_resume') {
        console.log('📋 Demande de résumé détectée');
        toast({
          title: "Résumé de session",
          description: "Génération du résumé en cours...",
        });
        // TODO: Appeler debrief-session
        setVoiceState('idle');
        return;
      }

      // Réponses normales (query ou small_talk)
      console.log('💬 Réponse:', data.answer);

      // Jouer l'audio
      if (data.audioContent) {
        await playAudioResponse(data.audioContent);
      }

      // Mode continu - relancer l'écoute après avoir parlé
      console.log('🔄 Mode continu activé, relance de l\'écoute...');
      setTimeout(() => {
        startListening();
      }, 500);

    } catch (error) {
      console.error('❌ Erreur traitement:', error);
      toast({
        title: "Erreur de traitement",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      setVoiceState('idle');
    }
  };

  // Jouer la réponse audio
  const playAudioResponse = async (audioBase64: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('🔊 [playAudioResponse] Démarrage lecture audio');
        console.log('📊 [playAudioResponse] Longueur base64:', audioBase64.length);
        console.log('🔍 [playAudioResponse] Premiers chars:', audioBase64.substring(0, 50));
        
        setVoiceState('speaking');
        onSpeakingChange?.(true);

        const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
        currentAudioRef.current = audio;

        audio.onloadeddata = () => {
          console.log('✅ [playAudioResponse] Audio chargé, durée:', audio.duration);
        };

        audio.onended = () => {
          console.log('✅ [playAudioResponse] Lecture terminée');
          onSpeakingChange?.(false);
          currentAudioRef.current = null;
          resolve();
        };

        audio.onerror = (error) => {
          console.error('❌ [playAudioResponse] Erreur audio:', error);
          console.error('❌ [playAudioResponse] Audio error code:', audio.error?.code);
          console.error('❌ [playAudioResponse] Audio error message:', audio.error?.message);
          onSpeakingChange?.(false);
          currentAudioRef.current = null;
          reject(error);
        };

        console.log('▶️ [playAudioResponse] Appel audio.play()...');
        audio.play().then(() => {
          console.log('🎵 [playAudioResponse] Audio en lecture');
        }).catch(reject);
      } catch (error) {
        console.error('❌ [playAudioResponse] Exception:', error);
        onSpeakingChange?.(false);
        reject(error);
      }
    });
  };

  // Gérer les commandes vocales
  const handleVoiceCommand = (command: string, args: any) => {
    console.log('🎙️ Commande vocale:', command, args);
    
    switch (command) {
      case 'stop_listening':
        console.log('⏹️ Commande: Arrêter l\'écoute');
        stopConversation();
        toast({
          title: "Écoute arrêtée",
          description: "Conversation terminée",
        });
        break;
        
      case 'pause':
        console.log('⏸️ Commande: Pause');
        setIsPaused(true);
        setVoiceState('idle');
        toast({
          title: "Pause activée",
          description: "Dites 'continue' pour reprendre",
        });
        break;
        
      case 'resume':
        console.log('▶️ Commande: Reprendre');
        setIsPaused(false);
        startListening();
        toast({
          title: "Reprise",
          description: "Je vous écoute à nouveau",
        });
        break;
        
      case 'new_question':
        console.log('🔄 Commande: Nouvelle question');
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        startListening();
        toast({
          title: "Nouvelle question",
          description: "Je vous écoute",
        });
        break;
        
      case 'show_history':
        console.log('📜 Commande: Afficher historique');
        toast({
          title: "Historique",
          description: "Cette fonctionnalité arrive bientôt",
        });
        break;
        
      case 'change_voice':
        console.log('🎵 Commande: Changer de voix');
        toast({
          title: "Changement de voix",
          description: "Utilisez les paramètres pour changer de voix",
        });
        break;
        
      default:
        console.warn('⚠️ Commande non reconnue:', command);
    }
  };

  // Démarrer la conversation
  const startConversation = useCallback(async () => {
    try {
      console.log('🚀 [startConversation] Début...');
      console.log('🔧 [startConversation] selectedVoiceId:', selectedVoiceId);
      console.log('👤 [startConversation] userId actuel:', userId);
      console.log('📊 [startConversation] État actuel voiceState:', voiceState);

      // Vérifier l'authentification avant de créer la session
      if (!userId) {
        console.log('⏳ [startConversation] userId non chargé, récupération...');
        // Essayer d'abord avec getSession qui est plus fiable
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          // Si getSession échoue, essayer getUser
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
            console.error('❌ [startConversation] Erreur authentification:', { sessionError, authError });
            throw new Error('Vous devez être connecté pour utiliser iAsted. Veuillez vous connecter.');
          }
          setUserId(user.id);
          console.log('✅ [startConversation] Utilisateur chargé via getUser:', user.id);
        } else {
          setUserId(session.user.id);
          console.log('✅ [startConversation] Utilisateur chargé via getSession:', session.user.id);
        }
      }

      // Créer une session
      console.log('📝 [startConversation] Création session...');
      const newSessionId = await createSession();
      console.log('✅ [startConversation] Session créée:', newSessionId);
      setSessionId(newSessionId);

      // Message de bienvenue contextuel
      const hour = new Date().getHours();
      const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
      const welcomeMessage = `${greeting} Excellence, je suis iAsted, votre assistant vocal intelligent. Comment puis-je vous être utile ?`;

      console.log('🎙️ [startConversation] Message de bienvenue:', welcomeMessage);
      console.log('🎤 [startConversation] Appel text-to-speech...');
      console.log('🎙️ [startConversation] VoiceId envoyé:', selectedVoiceId);

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: welcomeMessage,
          voiceId: selectedVoiceId,
        },
      });

      console.log('📊 [startConversation] Réponse text-to-speech:', { data, error });

      if (error) {
        console.error('❌ [startConversation] Erreur text-to-speech:', error);
        throw new Error(`Erreur text-to-speech: ${error.message || 'Inconnue'}`);
      }

      if (!data) {
        console.error('❌ [startConversation] Pas de data dans la réponse');
        throw new Error('Pas de données dans la réponse text-to-speech');
      }

      console.log('✅ [startConversation] Audio généré, data:', data);

      // Jouer le message de bienvenue
      if (data?.audioContent) {
        console.log('🔊 [startConversation] Lecture audio, longueur:', data.audioContent.length);
        await playAudioResponse(data.audioContent);
        console.log('✅ [startConversation] Audio joué avec succès');
      } else {
        console.error('❌ [startConversation] Pas de audioContent:', data);
        throw new Error('Pas d\'audioContent dans la réponse');
      }

      // Démarrer l'écoute après le message de bienvenue
      console.log('👂 [startConversation] Démarrage écoute dans 500ms...');
      setTimeout(() => {
        startListening();
      }, 500);

      toast({
        title: "Conversation démarrée",
        description: "iAsted est à votre écoute",
      });

    } catch (error) {
      console.error('❌ [startConversation] Erreur complète:', error);
      console.error('❌ [startConversation] Stack:', error instanceof Error ? error.stack : 'N/A');
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de démarrer la conversation",
        variant: "destructive",
      });
      setVoiceState('idle');
    }
  }, [createSession, selectedVoiceId, startListening, toast, userId]);

  // Arrêter la conversation
  const stopConversation = useCallback(async () => {
    console.log('⏹️ Arrêt de la conversation...');

    stopListening();

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Terminer la session
    if (sessionId) {
      await supabase
        .from('conversation_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    setVoiceState('idle');
    setSessionId(null);
    onSpeakingChange?.(false);

    toast({
      title: "Conversation terminée",
      description: "iAsted est en veille",
    });
  }, [sessionId, stopListening, onSpeakingChange, toast]);

  // Fonction pour interrompre et démarrer une nouvelle interaction
  const handleInteraction = useCallback(async () => {
    console.log('🎯 [handleInteraction] État actuel:', voiceState);
    
    try {
      if (voiceState === 'idle') {
        console.log('▶️ [handleInteraction] Démarrage conversation...');
        await startConversation();
      } else if (voiceState === 'listening') {
        console.log('⏸️ [handleInteraction] Arrêt écoute...');
        stopListening();
      } else if (voiceState === 'speaking' && currentAudioRef.current) {
        console.log('⏭️ [handleInteraction] Interruption + nouvelle écoute...');
        currentAudioRef.current.pause();
        startListening();
      } else {
        console.log('⏹️ [handleInteraction] Arrêt conversation...');
        stopConversation();
      }
    } catch (error) {
      console.error('❌ [handleInteraction] Erreur:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      setVoiceState('idle');
    }
  }, [voiceState, startConversation, stopConversation, stopListening, startListening, toast]);

  // Fonction pour annuler l'interaction en cours
  const cancelInteraction = useCallback(() => {
    console.log('❌ Annulation de l\'interaction');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    setSilenceDetected(false);
    setSilenceTimeRemaining(0);
    setVoiceState('idle');
    onSpeakingChange?.(false);
    
    toast({
      title: "Interaction annulée",
      description: "L'interaction vocale a été interrompue",
    });
  }, [toast, onSpeakingChange]);

  // Toggle pause en mode continu
  const toggleContinuousPause = useCallback(() => {
    setContinuousModePaused(prev => !prev);
    toast({
      title: continuousModePaused ? "Mode continu repris" : "Mode continu en pause",
      description: continuousModePaused ? "iAsted recommence à écouter" : "iAsted ne relancera pas automatiquement",
    });
  }, [continuousModePaused, toast]);

  return {
    // États
    voiceState,
    sessionId,
    audioLevel,
    isPaused,
    silenceDetected,
    silenceTimeRemaining,
    silenceDuration,
    liveTranscript,
    continuousMode,
    continuousModePaused,
    conversationMessages,
    
    // Getters
    isIdle: voiceState === 'idle',
    isListening: voiceState === 'listening',
    isThinking: voiceState === 'thinking',
    isSpeaking: voiceState === 'speaking',
    isActive: voiceState !== 'idle',
    
    // Actions
    startConversation,
    stopConversation,
    startListening,
    stopListening,
    handleInteraction,
    cancelInteraction,
    toggleContinuousPause,
    setSelectedVoiceId,
    togglePause: () => setIsPaused(prev => !prev),
    clearMessages: () => setConversationMessages([]),
  };
}
