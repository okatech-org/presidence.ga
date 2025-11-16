import { Button } from '@/components/ui/button';
import { MicOff, XCircle, RotateCcw } from 'lucide-react';
import { VoiceState } from '@/hooks/useVoiceInteraction';

interface IAstedVoiceControlsProps {
  voiceState: VoiceState;
  onStop: () => void;
  onCancel: () => void;
  onRestart: () => void;
}

const IAstedVoiceControls = ({ 
  voiceState, 
  onStop, 
  onCancel, 
  onRestart 
}: IAstedVoiceControlsProps) => {
  const isListening = voiceState === 'listening';
  const canRestart = voiceState === 'idle';

  if (!isListening && !canRestart) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-4 p-4 bg-card border rounded-full shadow-lg">
        {isListening && (
          <>
            <Button
              size="lg"
              variant="destructive"
              onClick={onStop}
              className="rounded-full gap-2"
            >
              <MicOff className="w-5 h-5" />
              Arrêter
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={onCancel}
              className="rounded-full gap-2"
            >
              <XCircle className="w-5 h-5" />
              Annuler
            </Button>
          </>
        )}

        {canRestart && (
          <Button
            size="lg"
            variant="default"
            onClick={onRestart}
            className="rounded-full gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Nouvelle question
          </Button>
        )}
      </div>
    </div>
  );
};

export default IAstedVoiceControls;
