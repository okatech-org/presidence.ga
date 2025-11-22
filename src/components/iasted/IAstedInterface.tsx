import React, { useMemo } from 'react';
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { IASTED_SYSTEM_PROMPT } from '@/config/iasted-config';

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
        // Tool calls are handled by the chat modal and individual pages
        // This is just a logging point
    });

    return (
        <IAstedChatModal
            isOpen={isOpen}
            onClose={onClose}
            openaiRTC={openaiRTC}
        />
    );
}
