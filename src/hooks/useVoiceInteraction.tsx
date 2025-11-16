import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface VoiceSettings {
  voiceId: string;
  silenceDuration: number;
  silenceThreshold: number;
  continuousMode: boolean;
}

export const useVoiceInteraction = (settings: VoiceSettings) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Créer une session au démarrage
  useEffect(() => {
    const createSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          settings: settings as any,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      setSessionId(data.id);
      console.log('Session created:', data.id);
    };

    createSession();
  }, []);

  const logAnalytics = async (eventType: string, data: any = {}) => {
    if (!sessionId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.functions.invoke('log-analytics', {
        body: {
          sessionId,
          userId: user.id,
          eventType,
          data,
        },
      });
    } catch (error) {
      console.error('Error logging analytics:', error);
    }
  };

  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(Math.min(100, average));

    // Détection de silence
    if (average < settings.silenceThreshold) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, settings.silenceDuration);
      }
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  }, [settings.silenceThreshold, settings.silenceDuration]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorderRef.current.start();
      setVoiceState('listening');
      await logAnalytics('voice_start');

      const levelInterval = setInterval(() => analyzeAudioLevel(), 100);
      
      return () => {
        clearInterval(levelInterval);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, [analyzeAudioLevel, logAnalytics, toast]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    if (!sessionId) {
      console.error('No session ID');
      return;
    }

    setVoiceState('thinking');
    await logAnalytics('voice_processing');

    try {
      // Get user session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Transcription avec Whisper via edge function
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription error:', errorText);
        throw new Error('Transcription failed');
      }

      const transcriptionData = await response.json();
      const transcript = transcriptionData.text;
      console.log('Transcript:', transcript);

      const userMessage: VoiceMessage = {
        role: 'user',
        content: transcript,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Obtenir la réponse AI
      const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
        body: {
          sessionId,
          transcript,
          voiceId: settings.voiceId,
        },
      });

      if (error) throw error;

      const assistantMessage: VoiceMessage = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Jouer l'audio
      if (data.audio) {
        await playAudioResponse(data.audio);
      }

      await logAnalytics('voice_complete', {
        transcript,
        response: data.text,
        latency: data.latency,
      });

      // Mode continu
      if (settings.continuousMode) {
        setTimeout(() => {
          if (voiceState !== 'idle') {
            startListening();
          }
        }, 1000);
      } else {
        setVoiceState('idle');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement audio",
        variant: "destructive",
      });
      setVoiceState('idle');
    }
  };

  const playAudioResponse = async (audioBase64: string) => {
    setVoiceState('speaking');
    
    return new Promise<void>((resolve) => {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }

      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => {
        setVoiceState('idle');
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audioElementRef.current.play();
    });
  };

  const handleInteraction = useCallback(async () => {
    if (voiceState === 'idle') {
      await startListening();
    } else if (voiceState === 'listening') {
      stopListening();
    }
  }, [voiceState, startListening, stopListening]);

  const newQuestion = useCallback(async () => {
    if (voiceState === 'idle') {
      await startListening();
    }
  }, [voiceState, startListening]);

  const cancelInteraction = useCallback(() => {
    stopListening();
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setVoiceState('idle');
    logAnalytics('voice_cancel');
  }, [stopListening, logAnalytics]);

  return {
    voiceState,
    messages,
    audioLevel,
    sessionId,
    handleInteraction,
    newQuestion,
    cancelInteraction,
    startListening,
    stopListening,
  };
};
