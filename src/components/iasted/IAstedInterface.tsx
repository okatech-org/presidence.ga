import React, { useMemo, useState, useEffect } from 'react';
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { IASTED_SYSTEM_PROMPT } from '@/config/iasted-config';
import { toast } from 'sonner';

interface IAstedInterfaceProps {
    isOpen: boolean;
    onClose: () => void;
    userRole?: string;
}

/**
 * Wrapper component for iAsted chat interface.
 * Manages the OpenAI RTC connection and provides the chat modal.
 */
export default function IAstedInterface({ isOpen, onClose, userRole = 'user' }: IAstedInterfaceProps) {
    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('ash');

    // Initialize voice from localStorage
    useEffect(() => {
        const savedVoice = localStorage.getItem('iasted-voice-selection') as 'echo' | 'ash' | 'shimmer';
        if (savedVoice) setSelectedVoice(savedVoice);
    }, []);

    // Calculate time-based greeting
    const timeOfDay = useMemo(() => {
        const hour = new Date().getHours();
        return hour >= 5 && hour < 18 ? "Bonjour" : "Bonsoir";
    }, []);

    // Map user role to appropriate title
    const userTitle = useMemo(() => {
        switch (userRole) {
            case 'president':
                return 'Excellence Monsieur le Président';
            case 'minister':
                return 'Excellence Monsieur le Ministre';
            case 'director':
                return 'Monsieur le Directeur';
            case 'dgss':
                return 'Directeur Général';
            default:
                return 'Monsieur';
        }
    }, [userRole]);

    // Format system prompt with context
    const formattedSystemPrompt = useMemo(() => {
        return IASTED_SYSTEM_PROMPT
            .replace(/{USER_TITLE}/g, userTitle)
            .replace(/{CURRENT_TIME_OF_DAY}/g, timeOfDay)
            .replace(/{APPELLATION_COURTE}/g, userTitle.split(' ').slice(-1)[0] || 'Monsieur');
    }, [timeOfDay, userTitle]);

    // Initialize OpenAI RTC with tool call handler
    const openaiRTC = useRealtimeVoiceWebRTC((toolName, args) => {
        console.log(`🔧 [IAstedInterface] Tool call: ${toolName}`, args);

        if (toolName === 'change_voice' && args.voice_id) {
            console.log('🎙️ [IAstedInterface] Changement de voix demandé:', args.voice_id);
            setSelectedVoice(args.voice_id as any);
            toast.success(`Voix modifiée : ${args.voice_id === 'ash' ? 'Homme (Ash)' : args.voice_id === 'shimmer' ? 'Femme (Shimmer)' : 'Standard (Echo)'}`);
        }
    });

    return (
        <IAstedChatModal
            isOpen={isOpen}
            onClose={onClose}
            openaiRTC={openaiRTC}
            currentVoice={selectedVoice}
        />
    );
}
