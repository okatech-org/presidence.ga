import { useState, useRef, useCallback } from 'react';
import { useVoiceInteraction, VoiceSettings as VoiceSettingsType } from '@/hooks/useVoiceInteraction';
import IAstedButtonFull from '@/components/iasted/IAstedButtonFull';
import IAstedListeningOverlay from '@/components/iasted/IAstedListeningOverlay';
import IAstedVoiceControls from '@/components/iasted/IAstedVoiceControls';
import IAstedModal from '@/components/iasted/IAstedModal';

const IAsted = () => {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsType>({
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    silenceDuration: 2000,
    silenceThreshold: 10,
    continuousMode: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    voiceState,
    messages,
    audioLevel,
    handleInteraction,
    newQuestion,
    cancelInteraction,
    stopListening,
  } = useVoiceInteraction(voiceSettings);

  const handleButtonClick = useCallback(() => {
    if (clickTimeoutRef.current) {
      // Double clic détecté - ouvrir le modal
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setIsModalOpen(true);
    } else {
      // Premier clic - attendre pour voir si double clic
      clickTimeoutRef.current = setTimeout(() => {
        // Simple clic confirmé - lancer l'interaction vocale
        handleInteraction();
        clickTimeoutRef.current = null;
      }, 250);
    }
  }, [handleInteraction]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      {/* Listening Overlay */}
      <IAstedListeningOverlay voiceState={voiceState} audioLevel={audioLevel} />

      {/* Voice Controls */}
      <IAstedVoiceControls
        voiceState={voiceState}
        onStop={stopListening}
        onCancel={cancelInteraction}
        onRestart={newQuestion}
      />

      {/* Contenu principal */}
      <div className="w-full max-w-7xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            iAsted
          </h1>
          <p className="text-muted-foreground text-xl mb-2">
            Assistant Vocal Intelligent de la Présidence
          </p>
          <p className="text-sm text-muted-foreground">
            1 clic pour parler • 2 clics pour ouvrir l'interface
          </p>
        </div>

        {/* Bouton Principal */}
        <div className="flex justify-center">
          <IAstedButtonFull
            onClick={handleButtonClick}
            size="lg"
            voiceListening={voiceState === 'listening'}
            voiceSpeaking={voiceState === 'speaking'}
            voiceProcessing={voiceState === 'thinking'}
            isInterfaceOpen={isModalOpen}
          />
        </div>

        {/* État vocal */}
        {voiceState !== 'idle' && !isModalOpen && (
          <div className="mt-8 animate-fade-in">
            <p className="text-lg font-semibold">
              {voiceState === 'listening' && 'Je vous écoute, Monsieur le Président...'}
              {voiceState === 'thinking' && 'Analyse en cours...'}
              {voiceState === 'speaking' && 'iAsted parle...'}
            </p>
          </div>
        )}
      </div>

      {/* Modal avec Tabs */}
      <IAstedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        messages={messages}
        voiceSettings={voiceSettings}
        onSettingsChange={setVoiceSettings}
      />
    </div>
  );
};

export default IAsted;
