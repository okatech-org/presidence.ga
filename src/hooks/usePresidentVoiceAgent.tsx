/**
 * Hook principal pour la gestion des interactions vocales de l'agent iAsted présidentiel
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audioUrl?: string;
  metadata?: {
    intent?: string;
    tokens?: number;
    latency?: number;
    focusDepth?: number;
    responseStyle?: string;
  };
}

interface VoiceSettings {
  voiceId: string;
  silenceDuration: number;
  silenceThreshold: number;
  continuousMode: boolean;
  autoGreeting: boolean;
  language: string;
  responseStyle: 'concis' | 'detaille' | 'strategique';
}

interface Session {
  id: string;
  user_id: string;
  settings: any;
  focus_mode: string | null;
  focus_topic: string | null;
  memory_summary: string | null;
  created_at: string;
  updated_at: string;
}

// Types pour les réponses des edge functions
interface IntentAnalysisResponse {
  intent: string;
  responseStyle: string;
  continuousMode: boolean;
  reasoning?: string;
}

interface ChatResponse {
  response: string;
  tokensUsed?: number;
}

interface SpeechToTextResponse {
  text: string;
}

interface TextToSpeechResponse {
  audio?: string;
  audioContent?: string;
}

// Utilitaire pour retry automatique avec backoff exponentiel
const invokeWithRetry = async <T,>(
  functionName: string,
  body: any,
  maxRetries = 3,
  initialDelay = 1000
): Promise<{ data: T | null; error: any }> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 [invokeWithRetry] Tentative ${attempt + 1}/${maxRetries} pour ${functionName}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });
      
      if (!error) {
        console.log(`✅ [invokeWithRetry] Succès pour ${functionName}`);
        return { data, error: null };
      }
      
      lastError = error;
      
      // Erreurs non retriables (4xx sauf 429)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        console.error(`❌ [invokeWithRetry] Erreur client non retriable pour ${functionName}:`, error);
        break;
      }
      
      // Attendre avant retry avec backoff exponentiel
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⏳ [invokeWithRetry] Attente de ${delay}ms avant retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (err) {
      console.error(`❌ [invokeWithRetry] Exception sur ${functionName}:`, err);
      lastError = err;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { data: null, error: lastError };
};

// Utilitaire pour formater les messages d'erreur
const getErrorMessage = (error: any, functionName: string): { title: string; description: string } => {
  // Erreurs réseau
  if (!navigator.onLine) {
    return {
      title: 'Connexion perdue',
      description: 'Vérifiez votre connexion internet et réessayez.',
    };
  }
  
  // Erreurs HTTP spécifiques
  if (error.status) {
    switch (error.status) {
      case 429:
        return {
          title: 'Trop de requêtes',
          description: 'Le système est temporairement surchargé. Veuillez patienter quelques instants.',
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          title: 'Erreur serveur',
          description: 'Le service iAsted rencontre des difficultés temporaires. Nouvelle tentative en cours...',
        };
      case 401:
      case 403:
        return {
          title: 'Authentification requise',
          description: 'Veuillez vous reconnecter à votre session.',
        };
      default:
        return {
          title: 'Erreur de communication',
          description: `Code ${error.status}: ${error.message || 'Erreur inconnue'}`,
        };
    }
  }
  
  // Erreurs de timeout
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return {
      title: 'Délai dépassé',
      description: 'La requête a pris trop de temps. Nouvelle tentative...',
    };
  }
  
  // Erreur générique
  return {
    title: `Erreur ${functionName}`,
    description: error.message || 'Une erreur inattendue s\'est produite.',
  };
};

export const usePresidentVoiceAgent = (settings: VoiceSettings) => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    initializeSession();
    return () => {
      cleanupAudioResources();
    };
  }, []);

  const initializeSession = async () => {
    try {
      console.log('🔄 [initializeSession] Début initialisation...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data: existingSession } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        setSession({
          ...existingSession,
          focus_topic: existingSession.focus_mode === 'active' ? (existingSession.memory_summary || null) : null,
        });
        await loadSessionMessages(existingSession.id);
      } else {
        const { data: newSession, error } = await supabase
          .from('conversation_sessions')
          .insert({
            user_id: user.id,
            settings: settings as any,
            focus_mode: null,
          })
          .select()
          .single();

        if (error) throw error;
        setSession({
          ...newSession,
          focus_topic: null,
        });

        if (settings.autoGreeting) {
          await generateGreeting();
        }
      }
      
      setIsSessionReady(true);
      console.log('✅ [initializeSession] Session prête!');
    } catch (error) {
      console.error('❌ [initializeSession] Erreur:', error);
      toast({
        title: 'Erreur de session',
        description: 'Impossible d\'initialiser la session iAsted',
        variant: 'destructive',
      });
      setIsSessionReady(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    const { data: msgs, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && msgs) {
      setMessages(msgs.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at,
        audioUrl: m.audio_url || undefined,
      })));
    }
  };

  const generateGreeting = async () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Bonjour';
    if (hour >= 12 && hour < 18) timeGreeting = 'Bon après-midi';
    else if (hour >= 18) timeGreeting = 'Bonsoir';

    const greetingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `${timeGreeting} Monsieur le Président,\n\nJe suis iAsted, votre assistant stratégique. Comment puis-je vous aider ?`,
      timestamp: new Date().toISOString(),
      metadata: { intent: 'greeting' },
    };

    setMessages([greetingMessage]);
    await saveMessage(greetingMessage);
  };

  const saveMessage = async (message: Message) => {
    if (!session) return;

    try {
      await supabase.from('conversation_messages').insert({
        id: message.id,
        session_id: session.id,
        role: message.role,
        content: message.content,
        audio_url: message.audioUrl,
        created_at: message.timestamp,
      });
    } catch (error) {
      console.error('Erreur sauvegarde message:', error);
    }
  };

  const startListening = useCallback(async () => {
    if (!isSessionReady || !session) {
      console.warn('⚠️ [startListening] Session non prête, attente...');
      toast({
        title: 'Initialisation en cours',
        description: 'iAsted se prépare, veuillez patienter...',
      });
      return;
    }
    
    try {
      console.log('🎤 [startListening] Démarrage de l\'écoute...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioInput(audioBlob);
      };

      mediaRecorder.start(100);
      setVoiceState('listening');
      setTranscript('');

      analyzeAudioLevel();

      toast({
        title: 'Écoute active',
        description: 'Je vous écoute, Monsieur le Président...',
      });

    } catch (error) {
      console.error('Erreur accès microphone:', error);
      toast({
        title: 'Accès microphone refusé',
        description: 'Veuillez autoriser l\'accès au microphone.',
        variant: 'destructive',
      });
      setVoiceState('idle');
    }
  }, [toast]);

  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkLevel = () => {
      if (!analyserRef.current || voiceState !== 'listening') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(Math.min(100, average * 2));

      if (average < settings.silenceThreshold) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            if (mediaRecorderRef.current?.state === 'recording') {
              stopListening();
            }
          }, settings.silenceDuration);
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }, [settings.silenceDuration, settings.silenceThreshold, voiceState]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    cleanupAudioResources();
    setVoiceState('thinking');
    setAudioLevel(0);
  }, []);

  const cleanupAudioResources = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    // Vérifier que la session est prête
    if (!session?.id) {
      toast({
        title: 'Session non prête',
        description: 'Veuillez patienter pendant l\'initialisation...',
        variant: 'destructive',
      });
      setVoiceState('idle');
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      setVoiceState('thinking');
      console.log('🎙️ [processAudioInput] Transcription audio, taille:', audioBlob.size, 'bytes');
      
      const transcribedText = await transcribeAudio(audioBlob);
      
      if (!transcribedText || transcribedText.trim().length < 2) {
        console.warn('⚠️ [processAudioInput] Transcription vide ou trop courte:', transcribedText);
        toast({
          title: 'Audio non détecté',
          description: 'Je n\'ai pas capté votre message.',
          variant: 'destructive',
        });
        setVoiceState('idle');
        setIsProcessing(false);
        return;
      }

      console.log('✅ [processAudioInput] Transcription:', transcribedText);
      setTranscript(transcribedText);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: transcribedText,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      await saveMessage(userMessage);

      console.log('🧠 [processAudioInput] Génération réponse...');
      const response = await generatePresidentResponse(transcribedText);
      console.log('✅ [processAudioInput] Réponse:', response.text.substring(0, 100) + '...');
      
      console.log('🎵 [processAudioInput] Génération audio...');
      const audioBase64 = await generateSpeech(response.text);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
        audioUrl: audioBase64,
        metadata: {
          intent: response.intent,
          tokens: response.tokensUsed,
          latency: Date.now() - startTime,
          responseStyle: response.detectedStyle,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);

      if (audioBase64) {
        console.log('▶️ [processAudioInput] Lecture audio...');
        await playAudioResponse(audioBase64);
      } else {
        console.warn('⚠️ [processAudioInput] Pas d\'audio à jouer');
      }

      if (settings.continuousMode && voiceState === 'idle') {
        console.log('🔄 [processAudioInput] Mode continu activé, relance écoute...');
        setTimeout(() => {
          startListening();
        }, 1000);
      }

    } catch (error) {
      console.error('❌ [processAudioInput] Erreur traitement audio:', error);
      toast({
        title: 'Erreur de traitement',
        description: 'Une erreur est survenue.',
        variant: 'destructive',
      });
      setVoiceState('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const { data, error } = await invokeWithRetry<SpeechToTextResponse>('speech-to-text', {
      audio: base64Audio,
      language: settings.language,
    });

    if (error) {
      const errorMsg = getErrorMessage(error, 'speech-to-text');
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: 'destructive',
      });
      throw error;
    }
    
    if (!data) {
      throw new Error('Pas de données reçues de speech-to-text');
    }
    
    return data.text;
  };

  const generatePresidentResponse = async (userInput: string): Promise<{
    text: string;
    intent: string;
    tokensUsed: number;
    detectedStyle: string;
  }> => {
    // CRITIQUE : Vérifier que la session est initialisée
    if (!session?.id) {
      console.error('❌ [generatePresidentResponse] Session non initialisée');
      toast({
        title: 'Session non prête',
        description: 'Veuillez patienter pendant l\'initialisation de la session...',
        variant: 'destructive',
      });
      throw new Error('Session non initialisée');
    }

    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // 1. Analyse automatique de l'intention et du style optimal
    const { data: intentAnalysis, error: intentError } = await invokeWithRetry<IntentAnalysisResponse>('analyze-intent', {
      userMessage: userInput,
      conversationHistory,
    });

    if (intentError) {
      console.warn('⚠️ [generatePresidentResponse] Erreur analyse intention, utilisation valeurs par défaut');
    }

    const detectedStyle = intentAnalysis?.responseStyle || 'strategique';
    const detectedIntent = intentAnalysis?.intent || 'query';
    const shouldUseContinuousMode = intentAnalysis?.continuousMode || false;

    console.log('🤖 iAsted Auto-Analysis:', {
      intent: detectedIntent,
      style: detectedStyle,
      continuous: shouldUseContinuousMode,
      reasoning: intentAnalysis?.reasoning
    });

    // 2. Adaptation automatique du mode continu si nécessaire
    if (shouldUseContinuousMode && !settings.continuousMode) {
      toast({
        title: 'Mode continu activé automatiquement',
        description: intentAnalysis?.reasoning || 'Contexte de conversation prolongée détecté',
      });
    }

    // 3. Génération de la réponse avec le style adapté
    console.log('📤 [generatePresidentResponse] Appel chat-with-iasted avec sessionId:', session.id);
    const { data, error } = await invokeWithRetry<ChatResponse>('chat-with-iasted', {
      sessionId: session.id,
      transcriptOverride: userInput,
      conversationHistory,
      userRole: 'president',
      settings: {
        responseStyle: detectedStyle,
        maxTokens: detectedStyle === 'concis' ? 150 : detectedStyle === 'detaille' ? 400 : 300,
        temperature: 0.7,
        intent: detectedIntent,
      },
    }, 3, 1500); // 3 tentatives avec délai initial de 1.5s

    if (error) {
      const errorMsg = getErrorMessage(error, 'chat-with-iasted');
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: 'destructive',
      });
      throw error;
    }

    if (!data) {
      throw new Error('Pas de données reçues de chat-with-iasted');
    }

    return {
      text: data.response,
      intent: detectedIntent,
      tokensUsed: data.tokensUsed || 0,
      detectedStyle,
    };
  };

  const generateSpeech = async (text: string): Promise<string> => {
    console.log('🎤 [generateSpeech] Génération audio pour:', text.substring(0, 50) + '...');
    console.log('🎤 [generateSpeech] VoiceId utilisé:', settings.voiceId);
    
    const { data, error } = await invokeWithRetry<TextToSpeechResponse>('text-to-speech', {
      text,
      voiceId: settings.voiceId,
      userRole: 'president', // Important: permet à l'edge function de sélectionner la bonne voix
    }, 2, 1000); // 2 tentatives pour TTS

    if (error) {
      console.error('❌ [generateSpeech] Erreur:', error);
      const errorMsg = getErrorMessage(error, 'text-to-speech');
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: 'destructive',
      });
      throw error;
    }

    if (!data || (!data.audio && !data.audioContent)) {
      console.error('❌ [generateSpeech] Pas de données audio dans la réponse');
      throw new Error('Pas de données audio');
    }

    const audioData = data.audio || data.audioContent || '';
    console.log('✅ [generateSpeech] Audio généré, taille:', audioData.length, 'caractères');
    return audioData;
  };

  const playAudioResponse = async (base64Audio: string) => {
    return new Promise<void>((resolve, reject) => {
      console.log('🔊 [playAudioResponse] Début lecture audio, longueur:', base64Audio.length);
      setVoiceState('speaking');

      // Utiliser audio/mpeg au lieu de audio/mp3 (MIME type correct pour MP3)
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioElementRef.current = audio;

      audio.onloadedmetadata = () => {
        console.log('✅ [playAudioResponse] Métadonnées chargées, durée:', audio.duration, 's');
      };

      audio.oncanplaythrough = () => {
        console.log('✅ [playAudioResponse] Audio prêt à être joué');
      };

      audio.onended = () => {
        console.log('✅ [playAudioResponse] Lecture terminée');
        setVoiceState('idle');
        audioElementRef.current = null;
        resolve();
      };

      audio.onerror = (e) => {
        console.error('❌ [playAudioResponse] Erreur lecture audio:', e);
        console.error('❌ [playAudioResponse] Audio error details:', audio.error);
        setVoiceState('idle');
        audioElementRef.current = null;
        toast({
          title: 'Erreur audio',
          description: 'Impossible de lire la réponse audio',
          variant: 'destructive',
        });
        resolve(); // Résoudre quand même pour ne pas bloquer
      };

      audio.play().catch(error => {
        console.error('❌ [playAudioResponse] Erreur play():', error);
        toast({
          title: 'Erreur de lecture',
          description: 'Impossible de démarrer la lecture audio',
          variant: 'destructive',
        });
        setVoiceState('idle');
        resolve();
      });
    });
  };

  const sendTextMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    // Vérifier que la session est prête
    if (!session?.id) {
      toast({
        title: 'Session non prête',
        description: 'Veuillez patienter pendant l\'initialisation...',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      console.log('📤 [sendTextMessage] Envoi message:', text);
      
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      await saveMessage(userMessage);

      setVoiceState('thinking');
      const response = await generatePresidentResponse(text);

      console.log('💬 [sendTextMessage] Réponse reçue:', response.text.substring(0, 100) + '...');

      // Générer l'audio de la réponse
      const audioBase64 = await generateSpeech(response.text);
      console.log('🎵 [sendTextMessage] Audio généré pour la réponse');

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
        audioUrl: audioBase64,
        metadata: {
          intent: response.intent,
          tokens: response.tokensUsed,
          latency: Date.now() - startTime,
          responseStyle: response.detectedStyle,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);

      // Jouer l'audio de la réponse
      if (audioBase64) {
        console.log('▶️ [sendTextMessage] Lecture audio de la réponse...');
        await playAudioResponse(audioBase64);
      } else {
        console.warn('⚠️ [sendTextMessage] Pas d\'audio à jouer');
      }

      setVoiceState('idle');

    } catch (error) {
      console.error('❌ [sendTextMessage] Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer votre message.',
        variant: 'destructive',
      });
      setVoiceState('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFocusMode = async (topic?: string) => {
    if (!session) return;

    const newFocusMode = session.focus_mode === 'active' ? null : 'active';

    await supabase
      .from('conversation_sessions')
      .update({
        focus_mode: newFocusMode,
      })
      .eq('id', session.id);

    setSession(prev => prev ? {
      ...prev,
      focus_mode: newFocusMode,
      focus_topic: newFocusMode ? (topic || null) : null,
    } : null);

    toast({
      title: newFocusMode ? 'Mode Focus activé' : 'Mode Focus désactivé',
      description: newFocusMode
        ? `Approfondissement sur : ${topic || 'sujet à définir'}`
        : 'Retour au mode conversation libre',
    });
  };

  const clearSessionHistory = async () => {
    if (!session) return;

    await supabase
      .from('conversation_messages')
      .delete()
      .eq('session_id', session.id);

    setMessages([]);
    await generateGreeting();

    toast({
      title: 'Historique effacé',
      description: 'La conversation a été réinitialisée.',
    });
  };

  const cancelOperation = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    cleanupAudioResources();
    setVoiceState('idle');
    setIsProcessing(false);
  };

  return {
    voiceState,
    messages,
    session,
    audioLevel,
    transcript,
    isProcessing,
    isSessionReady,
    startListening,
    stopListening,
    sendTextMessage,
    toggleFocusMode,
    clearSessionHistory,
    cancelOperation,
  };
};
