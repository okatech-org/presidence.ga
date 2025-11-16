import { VoiceState } from '@/hooks/useVoiceInteraction';

interface IAstedListeningOverlayProps {
  voiceState: VoiceState;
  audioLevel: number;
}

const IAstedListeningOverlay = ({ voiceState, audioLevel }: IAstedListeningOverlayProps) => {
  const isActive = voiceState === 'listening' || voiceState === 'thinking' || voiceState === 'speaking';

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
      {/* Message principal */}
      <div className="mb-12 text-center space-y-4">
        <h2 className="text-4xl font-bold">
          {voiceState === 'listening' && 'Je vous écoute'}
          {voiceState === 'thinking' && 'Analyse en cours'}
          {voiceState === 'speaking' && 'iAsted parle'}
        </h2>
        <p className="text-muted-foreground">
          {voiceState === 'listening' && 'Parlez naturellement...'}
          {voiceState === 'thinking' && 'Traitement de votre demande...'}
          {voiceState === 'speaking' && 'Écoute de la réponse...'}
        </p>
      </div>

      {/* Indicateur circulaire animé */}
      {voiceState === 'listening' && (
        <>
          <div className="relative">
            <div
              className="w-48 h-48 rounded-full border-4 border-primary/30"
              style={{
                transform: `scale(${1 + audioLevel / 150})`,
                transition: 'transform 0.1s',
              }}
            />
            <div className="absolute inset-0 w-48 h-48 rounded-full border-4 border-primary animate-pulse" />
            
            {/* Cercle central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full bg-primary/80 flex items-center justify-center"
                style={{
                  transform: `scale(${1 + audioLevel / 300})`,
                  transition: 'transform 0.05s',
                }}
              >
                <div className="text-3xl font-bold text-white">
                  {Math.round(audioLevel)}%
                </div>
              </div>
            </div>
          </div>

          {/* Barres verticales animées */}
          <div className="flex items-end gap-2 mt-12 h-20">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-primary rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(10, (audioLevel * (0.5 + Math.random() * 0.5)) / 2)}%`,
                }}
              />
            ))}
          </div>

          {/* Barre de niveau horizontale */}
          <div className="mt-8 w-80 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            L'enregistrement s'arrêtera automatiquement après un silence
          </p>
        </>
      )}

      {/* Animation de traitement */}
      {voiceState === 'thinking' && (
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      )}

      {/* Animation de parole */}
      {voiceState === 'speaking' && (
        <div className="flex items-center gap-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-primary rounded-full animate-pulse"
              style={{
                height: `${20 + Math.random() * 40}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IAstedListeningOverlay;
