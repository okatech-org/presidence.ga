import { useState, useRef, useEffect } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { VoiceState } from '@/hooks/useVoiceInteraction';

interface IAstedButtonAdvancedProps {
  voiceState: VoiceState;
  audioLevel: number;
  onClick: () => void;
  continuousMode: boolean;
}

interface Shockwave {
  id: number;
}

interface Position {
  x: number;
  y: number;
}

const styles = `
/* Styling de base avec perspective améliorée */
.perspective-container {
  perspective: 1500px;
  position: relative;
  z-index: 10;
  width: fit-content;
  margin: 0 auto;
}

.perspective-container.grabbing {
  cursor: grabbing !important;
}

.thick-matter-button.grabbing {
  cursor: grabbing !important;
}

.perspective {
  perspective: 1200px;
  position: relative;
  transform-style: preserve-3d;
}

/* Style pour le bouton avec matière épaisse et battement de cœur global */
.thick-matter-button {
  transform-style: preserve-3d;
  border-radius: 50%;
  will-change: transform, box-shadow, border-radius, filter;
  transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  animation: 
    global-heartbeat 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    shadow-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    rhythm-variation 15s ease-in-out infinite,
    micro-breathing 4s ease-in-out infinite,
    subtle-rotation 20s linear infinite;
}

/* Micro respiration pour effet plus organique */
@keyframes micro-breathing {
  0%, 100% { transform: scale(1) translateZ(0); }
  25% { transform: scale(1.02) translateZ(2px); }
  50% { transform: scale(0.98) translateZ(-2px); }
  75% { transform: scale(1.01) translateZ(1px); }
}

/* Rotation subtile continue */
@keyframes subtle-rotation {
  from { transform: rotateY(0deg) rotateX(0deg); }
  to { transform: rotateY(360deg) rotateX(10deg); }
}

/* État hover - intensification des battements */
.thick-matter-button:hover {
  animation: 
    global-heartbeat-intense 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    shadow-pulse-intense 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    rhythm-variation 15s ease-in-out infinite,
    hover-glow 1.4s ease-in-out infinite,
    hover-expansion 2s ease-in-out infinite;
}

/* Expansion au survol */
@keyframes hover-expansion {
  0%, 100% { transform: scale(1) translateZ(0); }
  50% { transform: scale(1.05) translateZ(10px); }
}

/* État actif - contraction musculaire */
.thick-matter-button:active {
  animation: muscle-contraction-organic 1.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
}

@keyframes muscle-contraction-organic {
  0% { transform: scale3d(1, 1, 1); filter: brightness(1) saturate(1.7); border-radius: 50%; }
  15% { transform: scale3d(0.94, 0.92, 0.96) rotateX(2deg) rotateY(-1deg); filter: brightness(0.88) saturate(2) hue-rotate(5deg); border-radius: 54% 46% 47% 53% / 46% 54% 45% 55%; }
  35% { transform: scale3d(0.82, 0.78, 0.86) rotateX(4deg) rotateY(-3deg); filter: brightness(0.78) saturate(2.5) hue-rotate(12deg); border-radius: 62% 38% 41% 59% / 40% 60% 39% 61%; }
  65% { transform: scale3d(0.95, 0.94, 0.96) rotateX(1deg) rotateY(0deg); filter: brightness(0.98) saturate(2.3) hue-rotate(5deg); border-radius: 54% 46% 47% 53% / 46% 54% 45% 55%; }
  100% { transform: scale3d(1, 1, 1); filter: brightness(1) saturate(1.7); border-radius: 50%; }
}

@keyframes rhythm-variation {
  0%, 100% { animation-timing-function: cubic-bezier(0.68, -0.2, 0.265, 1.55); }
  15% { animation-timing-function: cubic-bezier(0.58, -0.1, 0.365, 1.45); }
  30% { animation-timing-function: cubic-bezier(0.78, -0.3, 0.165, 1.65); }
  45% { animation-timing-function: cubic-bezier(0.48, -0.15, 0.465, 1.35); }
  60% { animation-timing-function: cubic-bezier(0.88, -0.35, 0.065, 1.75); }
  75% { animation-timing-function: cubic-bezier(0.38, -0.05, 0.565, 1.25); }
  90% { animation-timing-function: cubic-bezier(0.98, -0.4, 0.265, 1.85); }
}

/* Battement de cœur global */
@keyframes global-heartbeat {
  0%, 20%, 100% { 
    transform: scale3d(1, 1, 1) translateZ(0px) rotateX(0deg) rotateY(0deg); 
    box-shadow: 
      0 0 40px rgba(59, 130, 246, 0.8),
      0 0 80px rgba(59, 130, 246, 0.6),
      0 0 120px rgba(59, 130, 246, 0.4),
      inset 0 0 60px rgba(59, 130, 246, 0.3);
  }
  6% { 
    transform: scale3d(1.08, 1.08, 1.02) translateZ(8px) rotateX(2deg) rotateY(2deg); 
    box-shadow: 
      0 0 60px rgba(59, 130, 246, 0.95),
      0 0 100px rgba(59, 130, 246, 0.75),
      0 0 140px rgba(59, 130, 246, 0.55),
      inset 0 0 80px rgba(59, 130, 246, 0.4);
  }
  12% { 
    transform: scale3d(1.15, 1.15, 1.05) translateZ(15px) rotateX(4deg) rotateY(-2deg); 
    box-shadow: 
      0 0 80px rgba(59, 130, 246, 1),
      0 0 120px rgba(59, 130, 246, 0.85),
      0 0 160px rgba(59, 130, 246, 0.65),
      inset 0 0 100px rgba(59, 130, 246, 0.5);
  }
  18% { 
    transform: scale3d(0.92, 0.92, 0.98) translateZ(2px) rotateX(1deg) rotateY(1deg); 
    box-shadow: 
      0 0 35px rgba(59, 130, 246, 0.7),
      0 0 70px rgba(59, 130, 246, 0.5),
      0 0 100px rgba(59, 130, 246, 0.3),
      inset 0 0 50px rgba(59, 130, 246, 0.25);
  }
}

@keyframes global-heartbeat-intense {
  0%, 20%, 100% { 
    transform: scale3d(1, 1, 1) translateZ(0px); 
    box-shadow: 
      0 0 60px rgba(59, 130, 246, 0.9),
      0 0 100px rgba(59, 130, 246, 0.7),
      0 0 140px rgba(59, 130, 246, 0.5);
  }
  6% { 
    transform: scale3d(1.12, 1.12, 1.04) translateZ(12px); 
    box-shadow: 
      0 0 80px rgba(59, 130, 246, 1),
      0 0 120px rgba(59, 130, 246, 0.85),
      0 0 160px rgba(59, 130, 246, 0.65);
  }
  12% { 
    transform: scale3d(1.2, 1.2, 1.08) translateZ(20px); 
    box-shadow: 
      0 0 100px rgba(59, 130, 246, 1),
      0 0 150px rgba(59, 130, 246, 0.95),
      0 0 200px rgba(59, 130, 246, 0.75);
  }
  18% { 
    transform: scale3d(0.88, 0.88, 0.96) translateZ(3px); 
    box-shadow: 
      0 0 50px rgba(59, 130, 246, 0.8),
      0 0 90px rgba(59, 130, 246, 0.6),
      0 0 120px rgba(59, 130, 246, 0.4);
  }
}

@keyframes shadow-pulse {
  0%, 20%, 100% { 
    box-shadow: 
      0 0 40px rgba(59, 130, 246, 0.8),
      0 0 80px rgba(59, 130, 246, 0.6),
      inset 0 0 60px rgba(59, 130, 246, 0.3);
  }
  6% { 
    box-shadow: 
      0 0 60px rgba(59, 130, 246, 0.95),
      0 0 100px rgba(59, 130, 246, 0.75),
      inset 0 0 80px rgba(59, 130, 246, 0.4);
  }
  12% { 
    box-shadow: 
      0 0 80px rgba(59, 130, 246, 1),
      0 0 120px rgba(59, 130, 246, 0.85),
      inset 0 0 100px rgba(59, 130, 246, 0.5);
  }
}

@keyframes shadow-pulse-intense {
  0%, 20%, 100% { 
    box-shadow: 
      0 0 60px rgba(59, 130, 246, 0.9),
      0 0 100px rgba(59, 130, 246, 0.7);
  }
  6% { 
    box-shadow: 
      0 0 80px rgba(59, 130, 246, 1),
      0 0 120px rgba(59, 130, 246, 0.85);
  }
  12% { 
    box-shadow: 
      0 0 100px rgba(59, 130, 246, 1),
      0 0 150px rgba(59, 130, 246, 0.95);
  }
}

@keyframes hover-glow {
  0%, 100% { filter: brightness(1.2) saturate(1.5); }
  50% { filter: brightness(1.4) saturate(2); }
}

/* Background morphing */
.morphing-bg {
  background: 
    radial-gradient(circle at 20% 80%, hsl(var(--primary)) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, hsl(var(--accent)) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.8) 0%, transparent 50%),
    linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
  background-size: 200% 200%, 200% 200%, 200% 200%, 400% 400%;
  animation: fluid-mix-organic 25s ease-in-out infinite, bg-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  filter: saturate(2) brightness(1.2);
  box-shadow: inset 0 0 50px rgba(255, 255, 255, 0.3);
  transform-style: preserve-3d;
}

@keyframes fluid-mix-organic {
  0%, 100% { background-position: 0% 50%, 100% 50%, 50% 50%, 0% 0%; }
  25% { background-position: 50% 80%, 50% 20%, 25% 75%, 100% 30%; }
  50% { background-position: 100% 50%, 0% 50%, 75% 25%, 60% 100%; }
  75% { background-position: 50% 20%, 50% 80%, 50% 50%, 20% 50%; }
}

@keyframes bg-pulse {
  0%, 20%, 100% { opacity: 0.85; transform: scale(1) translateZ(0); }
  6% { opacity: 0.95; transform: scale(1.05) translateZ(5px); }
  12% { opacity: 1; transform: scale(1.1) translateZ(10px); }
  18% { opacity: 0.75; transform: scale(0.95) translateZ(-2px); }
}

/* Ondes d'énergie */
.wave-layer {
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.4);
  opacity: 0;
  transform: scale(0.95);
  animation: wave-expansion 3s ease-out infinite;
}

.wave-layer-1 { animation-delay: 0s; }
.wave-layer-2 { animation-delay: 0.5s; }
.wave-layer-3 { animation-delay: 1s; }

@keyframes wave-expansion {
  0% { transform: scale(0.95); opacity: 0; }
  50% { opacity: 0.6; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* État écoute */
.listening {
  animation: 
    listening-pulse 1.5s ease-in-out infinite,
    global-heartbeat-intense 1s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite !important;
}

@keyframes listening-pulse {
  0%, 100% { transform: scale(1); filter: hue-rotate(0deg) brightness(1.3); }
  50% { transform: scale(1.1); filter: hue-rotate(20deg) brightness(1.5); }
}

/* État parle */
.speaking {
  animation: 
    speaking-wave 2s ease-in-out infinite,
    global-heartbeat-intense 0.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite !important;
}

@keyframes speaking-wave {
  0%, 100% { transform: scale(1); filter: hue-rotate(0deg) brightness(1.2); }
  25% { transform: scale(1.08); filter: hue-rotate(90deg) brightness(1.4); }
  50% { transform: scale(0.92); filter: hue-rotate(180deg) brightness(1); }
  75% { transform: scale(1.05); filter: hue-rotate(270deg) brightness(1.3); }
}

/* État traitement */
.processing {
  animation: 
    processing-pulse 2s ease-in-out infinite,
    global-heartbeat-intense 1s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite !important;
}

@keyframes processing-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg) brightness(1); }
  25% { transform: scale(1.1) rotate(90deg); filter: hue-rotate(90deg) brightness(1.2); }
  50% { transform: scale(0.9) rotate(180deg); filter: hue-rotate(180deg) brightness(0.8); }
  75% { transform: scale(1.05) rotate(270deg); filter: hue-rotate(270deg) brightness(1.1); }
}

/* Shockwave */
.shockwave {
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  border: 3px solid rgba(59, 130, 246, 0.8);
  opacity: 0;
  animation: shockwave-expand 1s ease-out forwards;
}

@keyframes shockwave-expand {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

/* Responsive */
@media (max-width: 640px) {
  .thick-matter-button {
    width: 96px !important;
    height: 96px !important;
  }
}
`;

export const IAstedButtonAdvanced: React.FC<IAstedButtonAdvancedProps> = ({ 
  voiceState, 
  audioLevel, 
  onClick, 
  continuousMode 
}) => {
  const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
  const [isClicked, setIsClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shockwaveIdRef = useRef(0);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleClick = () => {
    // Créer shockwave
    const newShockwave: Shockwave = { id: shockwaveIdRef.current++ };
    setShockwaves(prev => [...prev, newShockwave]);
    
    setTimeout(() => {
      setShockwaves(prev => prev.filter(sw => sw.id !== newShockwave.id));
    }, 1000);

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);

    onClick();
  };

  const isListening = voiceState === 'listening';
  const isThinking = voiceState === 'thinking';
  const isSpeaking = voiceState === 'speaking';

  const buttonClasses = [
    'thick-matter-button',
    'relative',
    'cursor-pointer',
    isListening && 'listening',
    isSpeaking && 'speaking',
    isThinking && 'processing',
  ].filter(Boolean).join(' ');

  return (
    <div className="perspective-container" ref={containerRef}>
      <div className="perspective">
        <button
          onClick={handleClick}
          className={buttonClasses}
          style={{
            width: '128px',
            height: '128px',
            position: 'relative',
            overflow: 'visible',
          }}
          disabled={isThinking}
        >
          {/* Background morphing */}
          <div className="morphing-bg absolute inset-0 rounded-full" />

          {/* Ondes d'énergie */}
          {isListening && (
            <>
              <div className="wave-layer wave-layer-1" />
              <div className="wave-layer wave-layer-2" />
              <div className="wave-layer wave-layer-3" />
            </>
          )}

          {/* Shockwaves */}
          {shockwaves.map(sw => (
            <div key={sw.id} className="shockwave" />
          ))}

          {/* Icône */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {isSpeaking ? (
              <Volume2 className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Badge mode continu */}
          {continuousMode && (
            <div className="absolute -top-2 -right-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full shadow-lg z-20">
              Continu
            </div>
          )}

          {/* Niveau audio */}
          {isListening && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap z-20">
              Audio: {Math.round(audioLevel)}%
            </div>
          )}
        </button>

        {/* État textuel */}
        <div className="text-center mt-6">
          <p className="text-lg font-semibold capitalize">
            {voiceState === 'idle' && 'En attente'}
            {voiceState === 'listening' && "Je vous écoute, Monsieur le Président"}
            {voiceState === 'thinking' && 'Réflexion en cours...'}
            {voiceState === 'speaking' && 'iAsted parle'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IAstedButtonAdvanced;
