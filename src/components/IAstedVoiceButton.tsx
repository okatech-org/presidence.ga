import { useRef, useEffect } from 'react';
import { IAstedButton } from './IAstedButton';
import { IAstedListeningOverlay } from './IAstedListeningOverlay';
import { IAstedVoiceControls } from './IAstedVoiceControls';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';
import { toast } from '@/lib/toast';

interface IAstedVoiceButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IAstedVoiceButton = ({ className = '', size = 'md' }: IAstedVoiceButtonProps) => {
  const { 
    voiceState, 
    handleInteraction, 
    isListening, 
    isThinking, 
    isSpeaking,
    audioLevel,
    continuousMode,
    continuousModePaused,
    toggleContinuousPause,
    stopListening,
    cancelInteraction,
    silenceDetected,
    silenceTimeRemaining,
    silenceDuration,
    liveTranscript,
  } = useVoiceInteraction();

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans un input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ': // Espace - démarrer/arrêter
          event.preventDefault();
          handleInteraction();
          toast.info(
            voiceState === 'idle' ? 'Démarrage iAsted' : 'Arrêt iAsted',
            'Raccourci: Espace'
          );
          break;
        case 'escape': // Échap - annuler
          event.preventDefault();
          if (voiceState !== 'idle') {
            cancelInteraction();
            toast.info('Interaction annulée', 'Raccourci: Échap');
          }
          break;
        case 'r': // R - redémarrer
          event.preventDefault();
          if (voiceState !== 'idle') {
            handleInteraction();
            toast.info('Nouvelle question', 'Raccourci: R');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, handleInteraction, cancelInteraction]);

  const handleClick = () => {
    console.log('🖱️ [IAstedVoiceButton] Clic détecté, voiceState:', voiceState);
    // Clic simple: démarrer/arrêter l'interaction vocale
    try {
      handleInteraction();
      console.log('✅ [IAstedVoiceButton] handleInteraction appelé');
    } catch (error) {
      console.error('❌ [IAstedVoiceButton] Erreur handleClick:', error);
      toast.error('Erreur', 'Impossible de démarrer iAsted');
    }
  };

  return (
    <>
      <IAstedButton
        onClick={handleClick}
        className={className}
        size={size}
        voiceListening={isListening}
        voiceSpeaking={isSpeaking}
        voiceProcessing={isThinking}
        isInterfaceOpen={false}
        audioLevel={audioLevel}
        continuousMode={continuousMode}
        continuousModePaused={continuousModePaused}
        onToggleContinuousPause={toggleContinuousPause}
      />
      
      {/* Overlay d'écoute */}
      <IAstedListeningOverlay 
        audioLevel={audioLevel}
        isVisible={isListening}
        silenceDetected={silenceDetected}
        silenceTimeRemaining={silenceTimeRemaining}
        silenceDuration={silenceDuration}
        onSendNow={stopListening}
        onCancel={cancelInteraction}
        liveTranscript={liveTranscript}
      />
      
      {/* Contrôles vocaux */}
      <IAstedVoiceControls
        voiceState={voiceState}
        onStop={stopListening}
        onCancel={cancelInteraction}
        onRestart={handleInteraction}
      />
    </>
  );
};

export default IAstedVoiceButton;
