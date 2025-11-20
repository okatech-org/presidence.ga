import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IAstedButtonFullProps {
    onSingleClick?: () => void;
    onDoubleClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
    voiceListening?: boolean;
    voiceSpeaking?: boolean;
    voiceProcessing?: boolean;
    isInterfaceOpen?: boolean;
    isVoiceModeActive?: boolean;
    className?: string;
}

const IAstedButtonFull: React.FC<IAstedButtonFullProps> = ({
    onSingleClick,
    onDoubleClick,
    size = 'md',
    voiceListening = false,
    voiceSpeaking = false,
    voiceProcessing = false,
    isInterfaceOpen = false,
    isVoiceModeActive = false,
    className,
}) => {
    const [clickCount, setClickCount] = useState(0);
    const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

    // Déterminer la taille du bouton
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-20 h-20',
    };

    const iconSizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    };

    // Gérer les clics simples et doubles
    const handleClick = () => {
        setClickCount((prev) => prev + 1);

        if (clickTimer) {
            clearTimeout(clickTimer);
        }

        const timer = setTimeout(() => {
            if (clickCount === 0) {
                // Single click
                onSingleClick?.();
            } else {
                // Double click
                onDoubleClick?.();
            }
            setClickCount(0);
        }, 300);

        setClickTimer(timer);
    };

    useEffect(() => {
        return () => {
            if (clickTimer) {
                clearTimeout(clickTimer);
            }
        };
    }, [clickTimer]);

    // Déterminer l'icône et l'état
    const getButtonState = () => {
        if (voiceProcessing) {
            return {
                icon: Sparkles,
                color: 'text-yellow-500',
                bgColor: 'bg-yellow-500/20',
                borderColor: 'border-yellow-500',
                label: 'Traitement...',
            };
        }
        if (voiceSpeaking) {
            return {
                icon: Mic,
                color: 'text-blue-500',
                bgColor: 'bg-blue-500/20',
                borderColor: 'border-blue-500',
                label: 'iAsted parle',
            };
        }
        if (voiceListening) {
            return {
                icon: Mic,
                color: 'text-green-500',
                bgColor: 'bg-green-500/20',
                borderColor: 'border-green-500',
                label: 'En écoute',
            };
        }
        if (isVoiceModeActive || isInterfaceOpen) {
            return {
                icon: MessageSquare,
                color: 'text-primary',
                bgColor: 'bg-primary/20',
                borderColor: 'border-primary',
                label: 'Connecté',
            };
        }
        return {
            icon: MicOff,
            color: 'text-muted-foreground',
            bgColor: 'bg-muted',
            borderColor: 'border-border',
            label: 'Démarrer',
        };
    };

    const state = getButtonState();
    const Icon = state.icon;

    return (
        <div className={cn('fixed bottom-6 right-6 z-50', className)}>
            <motion.button
                onClick={handleClick}
                className={cn(
                    'relative rounded-full shadow-2xl transition-all duration-300 ease-in-out',
                    'flex items-center justify-center',
                    'border-2',
                    sizeClasses[size],
                    state.bgColor,
                    state.borderColor,
                    'hover:scale-110 active:scale-95',
                    'focus:outline-none focus:ring-4 focus:ring-primary/50'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: voiceListening || voiceSpeaking
                        ? [
                            '0 0 0 0 rgba(59, 130, 246, 0.4)',
                            '0 0 0 20px rgba(59, 130, 246, 0)',
                            '0 0 0 0 rgba(59, 130, 246, 0)',
                        ]
                        : '0 10px 30px rgba(0, 0, 0, 0.2)',
                }}
                transition={{
                    duration: voiceListening || voiceSpeaking ? 1.5 : 0.3,
                    repeat: voiceListening || voiceSpeaking ? Infinity : 0,
                    ease: 'easeInOut',
                }}
            >
                {/* Icône */}
                <motion.div
                    animate={{
                        rotate: voiceProcessing ? [0, 360] : 0,
                        scale: voiceSpeaking ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                        rotate: {
                            duration: 2,
                            repeat: voiceProcessing ? Infinity : 0,
                            ease: 'linear',
                        },
                        scale: {
                            duration: 0.5,
                            repeat: voiceSpeaking ? Infinity : 0,
                            ease: 'easeInOut',
                        },
                    }}
                >
                    <Icon className={cn(iconSizeClasses[size], state.color)} />
                </motion.div>

                {/* Indicateur d'activité vocale */}
                {(voiceListening || voiceSpeaking) && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )}
            </motion.button>

            {/* Tooltip */}
            <motion.div
                className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md whitespace-nowrap"
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {state.label}
                <div className="text-[10px] text-muted-foreground mt-0.5">
                    Clic: vocal | Double-clic: chat
                </div>
            </motion.div>
        </div>
    );
};

export default IAstedButtonFull;
