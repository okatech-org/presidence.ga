import { VoiceState } from '@/hooks/useVoiceInteraction';

interface IAstedListeningOverlayProps {
  voiceState: VoiceState;
  audioLevel: number;
}

const IAstedListeningOverlay = ({ voiceState, audioLevel }: IAstedListeningOverlayProps) => {
  const isActive = voiceState === 'listening';

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
      {/* Message principal */}
      <div className="mb-12 text-center space-y-4">
        <h2 className="text-4xl font-bold">Je vous écoute</h2>
        <p className="text-muted-foreground">Parlez naturellement...</p>
      </div>

      {/* Indicateur circulaire animé */}
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
    </div>
  );
};

export default IAstedListeningOverlay;
