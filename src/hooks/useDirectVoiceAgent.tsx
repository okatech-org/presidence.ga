import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseDirectVoiceAgentProps {
  userRole: 'president' | 'minister' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export const useDirectVoiceAgent = ({ 
  userRole,
  onSpeakingChange 
}: UseDirectVoiceAgentProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped, processing...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      toast({
        title: "Erreur microphone",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // 1. Transcription avec speech-to-text
      console.log('📝 Transcribing audio...');
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const { data: transcription, error: transcriptionError } = await supabase.functions.invoke(
        'speech-to-text',
        {
          body: formData,
        }
      );

      if (transcriptionError) throw transcriptionError;
      if (!transcription?.text) throw new Error('No transcription received');

      const userText = transcription.text;
      console.log('✅ Transcription:', userText);

      // Ajouter à l'historique
      conversationHistoryRef.current.push({
        role: 'user',
        content: userText,
      });

      // 2. Générer la réponse avec chat-iasted
      console.log('🤖 Generating response...');
      const { data: chatResponse, error: chatError } = await supabase.functions.invoke(
        'chat-iasted',
        {
          body: {
            messages: conversationHistoryRef.current,
            userRole,
          },
        }
      );

      if (chatError) throw chatError;
      if (!chatResponse?.response) throw new Error('No response received');

      const assistantText = chatResponse.response;
      console.log('✅ Response:', assistantText);

      // Ajouter à l'historique
      conversationHistoryRef.current.push({
        role: 'assistant',
        content: assistantText,
      });

      // 3. Synthèse vocale avec text-to-speech
      console.log('🔊 Generating speech...');
      const { data: audioData, error: ttsError } = await supabase.functions.invoke(
        'text-to-speech',
        {
          body: {
            text: assistantText,
            userRole,
          },
        }
      );

      if (ttsError) throw ttsError;
      if (!audioData) throw new Error('No audio data received');

      // 4. Jouer l'audio
      await playAudio(audioData);

    } catch (error) {
      console.error('❌ Error processing audio:', error);
      toast({
        title: "Erreur de traitement",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (audioData: ArrayBuffer | Blob) => {
    try {
      console.log('🎵 Playing audio response...');
      setIsSpeaking(true);
      onSpeakingChange?.(true);

      // Créer un blob si nécessaire
      const blob = audioData instanceof Blob 
        ? audioData 
        : new Blob([audioData], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        console.log('✅ Audio playback finished');
        setIsSpeaking(false);
        onSpeakingChange?.(false);
        URL.revokeObjectURL(audioUrl);
        
        // Si la conversation est active, recommencer l'enregistrement
        if (conversationActive) {
          setTimeout(() => {
            startRecording();
          }, 500);
        }
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        setIsSpeaking(false);
        onSpeakingChange?.(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    }
  };

  const startConversation = useCallback(async () => {
    console.log('🚀 Starting conversation...');
    
    try {
      // Demander l'accès au microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setConversationActive(true);
      conversationHistoryRef.current = [];
      
      toast({
        title: "Conversation démarrée",
        description: "Parlez maintenant, je vous écoute",
      });

      // Démarrer l'enregistrement
      await startRecording();
      
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la conversation",
        variant: "destructive",
      });
    }
  }, [startRecording, toast]);

  const stopConversation = useCallback(() => {
    console.log('⏹️ Stopping conversation...');
    
    setConversationActive(false);
    
    // Arrêter l'enregistrement si actif
    if (isRecording) {
      stopRecording();
    }
    
    // Arrêter l'audio si en cours
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Nettoyer l'historique
    conversationHistoryRef.current = [];
    
    setIsSpeaking(false);
    setIsProcessing(false);
    onSpeakingChange?.(false);
    
    toast({
      title: "Conversation terminée",
      description: "iAsted est en veille",
    });
  }, [isRecording, stopRecording, onSpeakingChange, toast]);

  return {
    // États
    isConnected: conversationActive,
    isSpeaking,
    isRecording,
    isProcessing,
    
    // Actions
    startConversation,
    stopConversation,
    startRecording,
    stopRecording,
  };
};
