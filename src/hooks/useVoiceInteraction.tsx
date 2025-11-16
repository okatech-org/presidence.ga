import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface UseVoiceInteractionOptions {
  onSpeakingChange?: (isSpeaking: boolean) => void;
  silenceDuration?: number;
  silenceThreshold?: number;
  continuousMode?: boolean;
}

export function useVoiceInteraction(options: UseVoiceInteractionOptions = {}) {
  const { toast } = useToast();
  const {
    onSpeakingChange,
    silenceDuration = 2000,
    silenceThreshold = 10,
    continuousMode = false,
  } = options;

  // États
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>(undefined);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    loadUser();
  }, []);

  // Créer une nouvelle session
  const createSession = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversation_sessions')
      .insert({
        user_id: user.id,
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

    if (error) throw error;
    return data.id;
  };

  // Analyser le niveau audio en temps réel
  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 255) * 100);
    setAudioLevel(normalizedLevel);

    // Détection de silence
    if (normalizedLevel < silenceThreshold) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          if (voiceState === 'listening') {
            console.log('🔇 Silence détecté, arrêt automatique');
            stopListening();
          }
        }, silenceDuration);
      }
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }

    if (voiceState === 'listening') {
      requestAnimationFrame(analyzeAudioLevel);
    }
  }, [voiceState, silenceThreshold, silenceDuration]);

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

      // Appeler chat-with-iasted
      const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
        body: {
          sessionId,
          userId,
          audioBase64,
          langHint: 'fr',
          voiceId: selectedVoiceId,
          generateAudio: true,
        },
      });

      if (error) throw error;

      console.log('✅ Réponse reçue:', data);

      // Vérifier le routage
      if (data.route?.category === 'voice_command') {
        handleVoiceCommand(data.route.command, data.route.args);
        return;
      }

      // Jouer l'audio
      if (data.audioContent) {
        await playAudioResponse(data.audioContent);
      }

      // Mode continu
      if (continuousMode && !isPaused) {
        setTimeout(() => {
          startListening();
        }, 500);
      } else {
        setVoiceState('idle');
      }

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
    try {
      console.log('🔊 Lecture de la réponse...');
      setVoiceState('speaking');
      onSpeakingChange?.(true);

      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      currentAudioRef.current = audio;

      audio.onended = () => {
        console.log('✅ Lecture terminée');
        setVoiceState('idle');
        onSpeakingChange?.(false);
      };

      audio.onerror = (error) => {
        console.error('❌ Erreur lecture audio:', error);
        setVoiceState('idle');
        onSpeakingChange?.(false);
      };

      await audio.play();
    } catch (error) {
      console.error('❌ Erreur playback:', error);
      setVoiceState('idle');
      onSpeakingChange?.(false);
    }
  };

  // Gérer les commandes vocales
  const handleVoiceCommand = (command: string, args: any) => {
    console.log('🎙️ Commande vocale:', command, args);
    
    switch (command) {
      case 'stop_listening':
        stopConversation();
        break;
      case 'pause':
        setIsPaused(true);
        break;
      case 'resume':
        setIsPaused(false);
        startListening();
        break;
      case 'new_question':
        startListening();
        break;
      default:
        console.warn('Commande non reconnue:', command);
    }
  };

  // Démarrer la conversation
  const startConversation = useCallback(async () => {
    try {
      console.log('🚀 Démarrage de la conversation...');

      // Créer une session
      const newSessionId = await createSession();
      setSessionId(newSessionId);

      // Message de bienvenue
      const welcomeMessage = "Bonjour, je suis iAsted, votre assistant vocal. Comment puis-je vous aider ?";

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: welcomeMessage,
          voiceId: selectedVoiceId,
        },
      });

      if (error) throw error;

      // Jouer le message de bienvenue
      await playAudioResponse(data.audioContent);

      // Démarrer l'écoute après le message de bienvenue
      setTimeout(() => {
        startListening();
      }, 500);

      toast({
        title: "Conversation démarrée",
        description: "iAsted est à votre écoute",
      });

    } catch (error) {
      console.error('❌ Erreur démarrage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la conversation",
        variant: "destructive",
      });
    }
  }, [selectedVoiceId, startListening, toast]);

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

  // Nouvelle question
  const newQuestion = useCallback(() => {
    if (voiceState === 'speaking' && currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    startListening();
  }, [voiceState, startListening]);

  return {
    // États
    voiceState,
    sessionId,
    audioLevel,
    isPaused,
    
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
    newQuestion,
    setSelectedVoiceId,
    togglePause: () => setIsPaused(prev => !prev),
  };
}
