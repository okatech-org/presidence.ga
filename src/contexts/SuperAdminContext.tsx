import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '@/hooks/useUserContext';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { useToast } from '@/hooks/use-toast';
import IAstedButtonFull from '@/components/iasted/IAstedButtonFull';
import { generateSystemPrompt } from '@/utils/generateSystemPrompt';
import { resolveRoute } from '@/utils/route-mapping';
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminContextValue {
    isAdmin: boolean;
    originRoute: string | null;
    handleNavigation: (query: string) => void;
    returnToBase: () => void;
    returnToOrigin: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextValue | null>(null);

export const useSuperAdmin = () => {
    const context = useContext(SuperAdminContext);
    if (!context) {
        throw new Error('useSuperAdmin must be used within SuperAdminProvider');
    }
    return context;
};

interface SuperAdminProviderProps {
    children: ReactNode;
}

export const SuperAdminProvider: React.FC<SuperAdminProviderProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Detect current space from route
    const currentSpaceName = useMemo(() => {
        const path = location.pathname;
        if (path.includes('/president-space')) return 'PresidentSpace';
        if (path.includes('/admin-space')) return 'AdminSpace';
        if (path.includes('/cabinet-director')) return 'CabinetDirectorSpace';
        if (path.includes('/dgss')) return 'DgssSpace';
        if (path.includes('/protocol')) return 'ProtocolDirectorSpace';
        if (path.includes('/private-cabinet')) return 'PrivateCabinetDirectorSpace';
        if (path.includes('/secretariat-general')) return 'SecretariatGeneralSpace';
        return 'Global';
    }, [location.pathname]);

    // Get user context with current space
    const userContext = useUserContext({ spaceName: currentSpaceName });
    const { profile, role, isLoading } = userContext;

    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('echo');
    const [originRoute, setOriginRoute] = useState<string | null>(null);
    const [securityOverrideActive, setSecurityOverrideActive] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false); // For UI tools
    const [pendingDocument, setPendingDocument] = useState<any>(null); // For document generation

    const isAdmin = useMemo(() => {
        return !isLoading && (role === 'admin' || role === 'president');
    }, [role, isLoading]);

    const handleToolCall = useCallback(async (toolName: string, args: any): Promise<{ success: boolean; message: string } | void> => {
        switch (toolName) {
            case 'global_navigate':
                const query = args.query || args.route;
                console.log('🦭 [Super Admin Context] Navigation request:', query);

                const resolvedRoute = resolveRoute(query);
                if (resolvedRoute) {
                    setOriginRoute(window.location.pathname);
                    console.log('✅ [Super Admin Context] Resolved to:', resolvedRoute);
                    navigate(resolvedRoute);
                    return { success: true, message: `Navigation vers ${resolvedRoute}` };
                } else {
                    console.error('❌ [Super Admin Context] Route not found for:', query);
                    toast({
                        title: 'Route inconnue',
                        description: `Impossible de trouver la route pour "${query}"`,
                        variant: 'destructive'
                    });
                    return { success: false, message: "Route inconnue" };
                }
            case 'return_to_base':
                console.log('🏠 [Super Admin Context] Returning to base');
                setOriginRoute(window.location.pathname);
                navigate('/admin-space');
                toast({
                    title: 'Retour à la base',
                    description: 'Navigation vers l\'AdminSpace',
                });
                return { success: true, message: "Retour à la base" };
            case 'return_to_origin':
                if (originRoute) {
                    console.log('⏮️ [Super Admin Context] Returning to origin:', originRoute);
                    navigate(originRoute);
                    const route = originRoute;
                    toast({
                        title: 'Retour à l\'origine',
                        description: `Navigation vers ${originRoute}`,
                    });
                    setOriginRoute(null);
                    return { success: true, message: `Retour à ${route}` };
                } else {
                    toast({
                        title: 'Pas d\'origine',
                        description: 'Aucune page d\'origine enregistrée',
                        variant: 'destructive'
                    });
                    return { success: false, message: "Pas d'origine enregistrée" };
                }
            case 'security_override':
                if (args.action === 'unlock_admin_access') {
                    console.log('🔓 [Super Admin Context] Security override');
                    setSecurityOverrideActive(true);
                    toast({
                        title: '🔐 Accès déverrouillé',
                        description: 'Mode God: Tous les accès sont autorisés',
                        duration: 3000,
                    });
                    setTimeout(() => setSecurityOverrideActive(false), 3000);
                    return { success: true, message: 'Sécurité outrepassée' };
                }
                return { success: false, message: 'Action de sécurité inconnue' };

            // Document Generation
            case 'generate_document':
                console.log('📝 [Super Admin Context] Génération document:', args);
                // Determine service context based on role or args
                // Default to 'president' if not specified, or 'admin' if in admin space
                const serviceContext = args.service_context || (isAdmin ? 'admin' : 'president');
                const requestedFormat = args.format || 'pdf';

                setPendingDocument({
                    type: args.type,
                    recipient: args.recipient,
                    subject: args.subject,
                    contentPoints: args.content_points || [],
                    format: requestedFormat,
                    serviceContext: serviceContext
                });
                setIsChatOpen(true);
                toast({
                    title: "Génération",
                    description: `Création de ${args.type} pour ${args.recipient}...`
                });

                // Message spécifique selon le format
                if (requestedFormat === 'docx') {
                    return {
                        success: true,
                        message: `Document Word (DOCX) généré et téléchargé automatiquement : ${args.type} pour ${args.recipient}. Le fichier est maintenant disponible dans vos téléchargements.`
                    };
                } else {
                    return {
                        success: true,
                        message: `Document PDF généré : ${args.type} pour ${args.recipient}. Le document est affiché dans le chat et téléchargé automatiquement.`
                    };
                }

            // UI Tools
            case 'open_chat':
                console.log('💬 [Super Admin Context] Opening chat');
                setIsChatOpen(true);
                return { success: true, message: 'Chat ouvert' };

            case 'close_chat':
                console.log('❌ [Super Admin Context] Closing chat');
                setIsChatOpen(false);
                return { success: true, message: 'Chat fermé' };

            case 'stop_conversation':
                console.log('🛑 [Super Admin Context] Stopping conversation');
                setIsChatOpen(false);
                // Note: Can't disconnect from here, would need openaiRTC reference
                return { success: true, message: 'Conversation arrêtée' };

            // Local Section Navigation
            case 'navigate_to_section':
                const sectionId = args.section_id;
                console.log(`📍 [Super Admin Context] Section navigation: ${sectionId}`);

                // Dispatch a custom event that spaces can listen to
                const navEvent = new CustomEvent('iasted-navigate-section', {
                    detail: { sectionId }
                });
                window.dispatchEvent(navEvent);

                toast({
                    title: 'Navigation',
                    description: `Ouverture de la section ${sectionId}`,
                });
                return { success: true, message: `Section ${sectionId} ouverte` };

            // Intelligence Search (RAG)
            case 'search_knowledge':
                console.log('🧠 [Super Admin Context] Searching intelligence:', args.query);
                try {
                    const { data, error } = await supabase.functions.invoke('search-intelligence', {
                        body: { query: args.query }
                    });

                    if (error) throw error;

                    if (data.results && data.results.length > 0) {
                        const formattedResults = data.results.map((r: any) =>
                            `- [${r.category?.toUpperCase() || 'INFO'}] ${r.summary || r.content.substring(0, 100)}... (Source: ${r.author})`
                        ).join('\n');
                        return { success: true, message: `Voici les informations trouvées :\n${formattedResults}` };
                    } else {
                        return { success: true, message: "Aucune information pertinente trouvée dans la base de connaissances." };
                    }
                } catch (err: any) {
                    console.error('❌ [Super Admin Context] Search error:', err);
                    return { success: false, message: "Erreur lors de la recherche d'informations." };
                }

            // UI Control
            case 'control_ui':
                console.log('🎨 [Super Admin Context] UI Control:', args);

                // Dispatch event for theme changes
                if (args.action === 'toggle_theme' || args.action === 'set_theme_dark' || args.action === 'set_theme_light') {
                    const themeEvent = new CustomEvent('iasted-control-ui', {
                        detail: { action: args.action, value: args.value }
                    });
                    window.dispatchEvent(themeEvent);

                    const actionMsg = args.action === 'set_theme_dark' ? 'Mode sombre activé' :
                        args.action === 'set_theme_light' ? 'Mode clair activé' :
                            'Thème basculé';
                    toast({
                        title: 'Thème',
                        description: actionMsg,
                    });
                    return { success: true, message: actionMsg };
                }

                // Sidebar toggle
                if (args.action === 'toggle_sidebar') {
                    window.dispatchEvent(new CustomEvent('iasted-sidebar-toggle'));
                    return { success: true, message: 'Menu latéral basculé' };
                }

                return { success: false, message: 'Action UI non reconnue' };

            default:
                console.log('[Super Admin Context] Tool call forwardé:', toolName, args);
                // Return undefined for unknown tools (let them be handled elsewhere)
                return undefined;
        }
    }, [navigate, toast, originRoute, isAdmin]);

    const openaiRTC = useRealtimeVoiceWebRTC(handleToolCall);

    const handleNavigation = useCallback((query: string) => {
        handleToolCall('global_navigate', { query });
    }, [handleToolCall]);

    const returnToBase = useCallback(() => {
        handleToolCall('return_to_base', {});
    }, [handleToolCall]);

    const returnToOrigin = useCallback(() => {
        handleToolCall('return_to_origin', {});
    }, [handleToolCall]);



    const contextValue = useMemo<SuperAdminContextValue>(() => ({
        isAdmin,
        originRoute,
        handleNavigation,
        returnToBase,
        returnToOrigin
    }), [isAdmin, originRoute, handleNavigation, returnToBase, returnToOrigin]);

    return (
        <SuperAdminContext.Provider value={contextValue}>
            {children}
            {/* Render global iAsted button for all users with access */}
            {userContext.hasIAstedAccess && ReactDOM.createPortal(
                <div className="fixed bottom-6 right-6 z-[9999]" style={{ pointerEvents: 'auto' }}>
                    <IAstedButtonFull
                        onClick={async () => {
                            if (openaiRTC.isConnected) {
                                openaiRTC.disconnect();
                            } else {
                                // Generate contextual system prompt based on current user and space
                                const systemPrompt = generateSystemPrompt(userContext);
                                console.log(`🎯 [iAsted Global] Connexion pour ${role} dans ${currentSpaceName}`);
                                await openaiRTC.connect(selectedVoice, systemPrompt);
                            }
                        }}
                        onDoubleClick={() => {
                            console.log('🖱️🖱️ [Super Admin Context] Double clic - Opening chat');
                            setIsChatOpen(true);
                        }}
                        audioLevel={openaiRTC.audioLevel}
                        voiceListening={openaiRTC.voiceState === 'listening'}
                        voiceSpeaking={openaiRTC.voiceState === 'speaking'}
                        voiceProcessing={openaiRTC.voiceState === 'connecting' || openaiRTC.voiceState === 'thinking'}
                        pulsing={securityOverrideActive}
                    />
                </div>,
                document.body
            )}

            {/* IAsted Chat Modal */}
            {isAdmin && (
                <IAstedChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    openaiRTC={openaiRTC}
                    currentVoice={selectedVoice}
                    pendingDocument={pendingDocument}
                    onClearPendingDocument={() => setPendingDocument(null)}
                />
            )}
        </SuperAdminContext.Provider>
    );
};
