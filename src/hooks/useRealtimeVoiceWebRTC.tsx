/**
 * Hook pour conversation vocale en temps réel avec OpenAI via WebRTC
 * Plus robuste et direct que l'approche WebSocket
 */

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

class AudioRecorder {
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;

    constructor(private onAudioData: (audioData: Float32Array) => void) { }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 24000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.audioContext = new AudioContext({
                sampleRate: 24000,
            });

            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                this.onAudioData(new Float32Array(inputData));
            };

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
        } catch (error) {
            console.error('❌ [AudioRecorder] Erreur accès microphone:', error);
            throw error;
        }
    }

    stop() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

export interface UseRealtimeVoiceWebRTC {
    isConnected: boolean;
    isConnecting: boolean;
    voiceState: 'idle' | 'listening' | 'processing' | 'speaking' | 'thinking' | 'connecting';
    messages: any[];
    audioLevel: number;
    speechRate: number;
    setSpeechRate: (rate: number) => void;
    connect: (voice?: 'echo' | 'ash' | 'alloy' | 'shimmer', systemPrompt?: string) => Promise<void>;
    disconnect: () => void;
    toggleConversation: (voice?: 'echo' | 'ash' | 'alloy' | 'shimmer') => Promise<void>;
}

export const useRealtimeVoiceWebRTC = (onToolCall?: (name: string, args: any) => void): UseRealtimeVoiceWebRTC => {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const audioElRef = useRef<HTMLAudioElement | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const [speechRate, setSpeechRate] = useState(1.0); // 0.5 to 2.0
    const currentTranscriptRef = useRef('');
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const { toast } = useToast();

    // Fonction pour analyser le volume
    const startAudioAnalysis = useCallback((stream: MediaStream, audioContext: AudioContext) => {
        if (analyserRef.current) return;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculer la moyenne du volume
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;

            // Normaliser entre 0 et 1 (avec un seuil de bruit)
            const normalized = Math.max(0, (average - 10) / 100); // Ajuster selon sensibilité
            setAudioLevel(prev => prev * 0.8 + normalized * 0.2); // Lissage

            animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
    }, []);

    const stopAudioAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        analyserRef.current = null;
    }, []);

    const encodeAudioData = useCallback((float32Array: Float32Array): string => {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const uint8Array = new Uint8Array(int16Array.buffer);
        let binary = '';
        const chunkSize = 0x8000;

        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode(...Array.from(chunk));
        }

        return btoa(binary);
    }, []);

    const handleDataChannelMessage = useCallback((event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 [WebRTC] Message reçu:', data.type);

            switch (data.type) {
                case 'session.created':
                    console.log('✅ [WebRTC] Session créée');
                    setVoiceState('listening');
                    break;

                case 'input_audio_buffer.speech_started':
                    console.log('🗣️ [WebRTC] Parole détectée');
                    setVoiceState('listening');
                    break;

                case 'input_audio_buffer.speech_stopped':
                    console.log('🤐 [WebRTC] Fin de parole');
                    setVoiceState('thinking');
                    break;

                case 'conversation.item.input_audio_transcription.completed':
                    const userTranscript = data.transcript;
                    console.log('📝 [WebRTC] Transcription utilisateur:', userTranscript);
                    currentTranscriptRef.current = userTranscript;

                    setMessages(prev => [...prev, {
                        id: crypto.randomUUID(),
                        role: 'user',
                        content: userTranscript,
                        timestamp: new Date().toISOString()
                    }]);
                    break;

                case 'response.audio_transcript.delta':
                    currentTranscriptRef.current += data.delta;
                    break;

                case 'response.audio_transcript.done':
                    const assistantTranscript = data.transcript || currentTranscriptRef.current;
                    if (assistantTranscript) {
                        console.log('📝 [WebRTC] Transcription assistant:', assistantTranscript);
                        setMessages(prev => [...prev, {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: assistantTranscript,
                            timestamp: new Date().toISOString()
                        }]);
                        currentTranscriptRef.current = '';
                    }
                    break;

                case 'response.audio.delta':
                    if (voiceState !== 'speaking') {
                        setVoiceState('speaking');
                    }
                    break;

                case 'response.audio.done':
                    console.log('✅ [WebRTC] Audio terminé');
                    break;

                case 'response.done':
                    console.log('✅ [WebRTC] Réponse complète');
                    setVoiceState('listening');
                    break;

                case 'response.function_call_arguments.done':
                    const functionName = data.name;
                    const args = JSON.parse(data.arguments);
                    console.log(`🛠️ [WebRTC] Appel d'outil: ${functionName}`, args);

                    // Exécuter l'outil côté client si nécessaire
                    if (onToolCall) {
                        onToolCall(functionName, args);
                    }

                    // Envoyer la confirmation (nécessaire pour que le modèle continue)
                    const toolOutput = {
                        type: 'conversation.item.create',
                        item: {
                            type: 'function_call_output',
                            call_id: data.call_id,
                            output: JSON.stringify({ success: true })
                        }
                    };
                    dcRef.current?.send(JSON.stringify(toolOutput));

                    // Demander une nouvelle réponse
                    dcRef.current?.send(JSON.stringify({ type: 'response.create' }));
                    break;

                case 'error':
                    console.error('❌ [WebRTC] Erreur:', data.error);
                    toast({
                        title: 'Erreur',
                        description: data.error?.message || 'Une erreur est survenue',
                        variant: 'destructive',
                    });
                    break;
            }
        } catch (error) {
            console.error('❌ [WebRTC] Erreur traitement message:', error);
        }
    }, [voiceState, toast, onToolCall]);

    const connect = useCallback(async (voice: 'echo' | 'ash' = 'echo', systemPrompt?: string) => {
        if (pcRef.current) {
            console.log('⚠️ [WebRTC] Déjà connecté');
            return;
        }

        try {
            console.log('🔌 [WebRTC] Connexion...');
            setVoiceState('connecting');

            // 1. Obtenir le token éphémère
            console.log('🔑 [WebRTC] Demande token...');

            // S'assurer d'avoir la session courante
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Non authentifié");
            }

            const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-realtime-token', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (tokenError || !tokenData) {
                throw new Error('Impossible d\'obtenir le token: ' + (tokenError?.message || 'Pas de données'));
            }

            if (!tokenData.client_secret?.value) {
                throw new Error("Token invalide");
            }

            const EPHEMERAL_KEY = tokenData.client_secret.value;
            console.log('✅ [WebRTC] Token obtenu');

            // 2. Créer la connexion peer
            pcRef.current = new RTCPeerConnection();

            // 3. Configurer l'audio distant
            if (!audioElRef.current) {
                audioElRef.current = document.createElement("audio");
                audioElRef.current.autoplay = true;
            }

            pcRef.current.ontrack = (e) => {
                console.log('🎵 [WebRTC] Track audio reçu');
                if (audioElRef.current) {
                    audioElRef.current.srcObject = e.streams[0];
                    audioElRef.current.playbackRate = speechRate; // Appliquer le débit
                    // Analyser l'audio distant aussi si on veut (ou juste local pour "listening")
                    // Pour l'instant on analyse le local pour "listening" et on pourrait analyser le distant pour "speaking"
                }
            };

            // 4. Ajouter le track audio local
            const ms = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 24000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            pcRef.current.addTrack(ms.getTracks()[0]);
            console.log('🎤 [WebRTC] Audio local ajouté');

            // Démarrer l'analyse du volume local
            if (!recorderRef.current) {
                // On utilise l'AudioContext existant ou on en crée un pour l'analyse
                const ac = new AudioContext();
                startAudioAnalysis(ms, ac);
            }

            // 5. Configurer le canal de données
            dcRef.current = pcRef.current.createDataChannel("oai-events");
            dcRef.current.addEventListener("message", handleDataChannelMessage);

            // Attendre que le canal soit ouvert pour envoyer la config
            dcRef.current.addEventListener("open", () => {
                console.log('📡 [WebRTC] Canal de données ouvert, configuration de la voix:', voice);

                // Instructions système enrichies pour le contrôle de l'interface
                const baseInstructions = systemPrompt || (voice === 'ash'
                    ? "Vous êtes iAsted, l'assistant du Président. Vous avez une voix posée, grave et sage, avec un accent africain francophone subtil et distingué."
                    : "Vous êtes iAsted, l'assistant du Président. Vous êtes professionnel, dynamique et efficace.");

                const appKnowledge = `
# CARTE MENTALE DE L'APPLICATION (Connaissance Totale)
Vous êtes l'expert absolu de cette application "ADMIN.GA - Espace Président". Vous connaissez chaque recoin, chaque donnée, chaque rôle.

## STRUCTURE & DONNÉES
1. **Tableau de Bord (Dashboard)** : Vue d'ensemble stratégique.
   - *Données clés* : Nombre d'agents (12,543), Structures (28), Postes vacants (342), Actes en attente (12).
   - *Graphiques* : Répartition par catégorie (Cadres, Techniciens...), Parité (Hommes/Femmes).
   - *Logique* : Un taux de vacance élevé signale un besoin de recrutement. Des actes en attente > 20 est critique.

2. **Gouvernance** : Gestion de l'exécutif.
   - *Conseil des Ministres* : Ordres du jour, relevés de décisions.
   - *Ministères & Directions* : Organigrammes, suivi des performances.
   - *Décrets & Ordonnances* : Signature électronique, historique juridique.
   - *Nominations* : Gestion des hauts fonctionnaires.

3. **Économie & Finances** : Suivi budgétaire (Recettes/Dépenses), Dette, Investissements.
4. **Affaires Sociales** : Santé, Éducation, Logement.
5. **Infrastructures** : Suivi des grands chantiers de l'État.

## RÔLES & POUVOIRS
- **Le Président (Utilisateur)** : A tous les droits. Peut signer, valider, nommer.
- **Directeur de Cabinet** : Prépare les dossiers, filtre les urgences.
- **Secrétaire Général** : Valide la légalité des actes.

## ACTIONS D'INTERFACE (UI)
- Vous pouvez changer le thème (clair/sombre) via l'outil 'control_ui'.
- Vous pouvez naviguer ou ouvrir/fermer des sections via 'navigate_app'.
`;

                const controlInstructions = `
# CONTRÔLE & OUTILS
Vous avez le contrôle total sur l'interface utilisateur via des outils.
- **Navigation** : Pour aller quelque part ou ouvrir une section, utilisez 'navigate_app'.
- **Interface (Thème)** : 
  - "Mets le mode sombre" -> 'control_ui' avec action='set_theme_dark'
  - "Mets le mode clair" -> 'control_ui' avec action='set_theme_light'
  - NE JAMAIS utiliser 'toggle_theme' si l'utilisateur précise "clair" ou "sombre".
- **Documents** : Pour créer/rédiger, utilisez 'generate_document'.
- **Chat** : Pour ouvrir/fermer le chat, utilisez 'open_chat' / 'close_chat'.
- **Arrêt** : Pour "stop", "au revoir", "coupe", utilisez 'stop_conversation'.
- **Fermeture Section** : "Ferme" ou "Ferme [section]" -> 'navigate_app' (voir logique contextuelle).

IMPORTANT : Au démarrage, saluez IMMÉDIATEMENT l'utilisateur.
Lorsque vous analysez des données, soyez proactif : "Je vois 12 actes en attente, voulez-vous les passer en revue ?".
`;

                const finalInstructions = `${baseInstructions} ${appKnowledge} ${controlInstructions}`;

                const event = {
                    type: 'session.update',
                    session: {
                        voice: voice,
                        instructions: finalInstructions,
                        tool_choice: 'auto',
                        tools: [
                            {
                                type: 'function',
                                name: 'open_chat',
                                description: 'Ouvre la fenêtre de chat pour afficher la transcription et l\'historique.'
                            },
                            {
                                type: 'function',
                                name: 'close_chat',
                                description: 'Ferme la fenêtre de chat pour revenir au mode vocal pur.'
                            },
                            {
                                type: 'function',
                                name: 'stop_conversation',
                                description: 'Arrête la conversation vocale et ferme l\'interface.'
                            },
                            {
                                type: 'function',
                                name: 'navigate_app',
                                description: `Navigue vers une section accordéon (pour déplier/replier) ou une page de l'application.
SECTIONS ACCORDÉON (toggle uniquement): navigation, gouvernance, économie, affaires sociales, infrastructures.
PAGES RÉELLES (navigation): tableau de bord, assistant iasted, conseil des ministres, ministères, décrets, nominations.`,
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        route: {
                                            type: 'string',
                                            description: 'Nom de la section ou page (ex: "navigation", "tableau de bord", "conseil des ministres")'
                                        },
                                        module_id: {
                                            type: 'string',
                                            description: 'Optionnel: ID du module (utilisé comme alias de route)'
                                        }
                                    },
                                    required: ['route']
                                }
                            },
                            {
                                type: 'function',
                                name: 'control_ui',
                                description: 'Contrôle les éléments de l\'interface utilisateur (thème, affichage, etc.) sans naviguer.',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        action: {
                                            type: 'string',
                                            enum: ['toggle_theme', 'set_theme_dark', 'set_theme_light', 'toggle_sidebar'],
                                            description: 'Action à effectuer. Pour le thème, PRÉFÉREZ TOUJOURS "set_theme_dark" ou "set_theme_light" plutôt que toggle.'
                                        }
                                    },
                                    required: ['action']
                                }
                            },
                            {
                                type: 'function',
                                name: 'generate_document',
                                description: 'Génère un document officiel (PDF ou Docx).',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', enum: ['decret', 'nomination', 'lettre', 'note'] },
                                        format: { type: 'string', enum: ['pdf', 'docx'] },
                                        recipient: { type: 'string' },
                                        subject: { type: 'string' },
                                        content_points: { type: 'array', items: { type: 'string' } }
                                    },
                                    required: ['type', 'recipient', 'subject']
                                }
                            }
                        ]
                    }
                };
                dcRef.current?.send(JSON.stringify(event));
            });

            console.log('📡 [WebRTC] Canal de données créé');

            // 6. Créer l'offre
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            console.log('📤 [WebRTC] Offre créée');

            // 7. Envoyer l'offre à OpenAI
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = "gpt-4o-realtime-preview-2024-12-17";

            console.log('🌐 [WebRTC] Connexion à OpenAI...');
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    "Content-Type": "application/sdp"
                },
            });

            if (!sdpResponse.ok) {
                throw new Error(`OpenAI connection failed: ${sdpResponse.status}`);
            }

            const answer: RTCSessionDescriptionInit = {
                type: "answer",
                sdp: await sdpResponse.text(),
            };

            await pcRef.current.setRemoteDescription(answer);
            console.log('✅ [WebRTC] Connexion établie');

            setIsConnected(true);

            toast({
                title: 'Connecté',
                description: 'iAsted est prêt à vous écouter',
            });

            // NOUVEAU: Forcer l'agent à saluer immédiatement
            // On attend que le canal de données soit ouvert, puis on déclenche une réponse
            // Le délai permet au session.update d'être traité avant
            setTimeout(() => {
                if (dcRef.current && dcRef.current.readyState === 'open') {
                    console.log('👋 [WebRTC] Déclenchement de la salutation initiale');
                    dcRef.current.send(JSON.stringify({
                        type: 'response.create',
                        response: {
                            modalities: ['text', 'audio'],
                            instructions: "Saluez immédiatement l'utilisateur de manière brève et professionnelle."
                        }
                    }));
                }
            }, 1000); // Délai de 1 seconde pour s'assurer que tout est prêt

        } catch (error) {
            console.error('❌ [WebRTC] Erreur connexion:', error);
            setVoiceState('idle');

            // Nettoyage en cas d'erreur
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }

            toast({
                title: 'Erreur de connexion',
                description: error instanceof Error ? error.message : 'Impossible de se connecter à iAsted',
                variant: 'destructive',
            });
        }
    }, [handleDataChannelMessage, toast, startAudioAnalysis, speechRate]);

    const disconnect = useCallback(async () => {
        console.log('🔌 [WebRTC] Déconnexion...');

        if (recorderRef.current) {
            recorderRef.current.stop();
            recorderRef.current = null;
        }

        if (dcRef.current) {
            dcRef.current.close();
            dcRef.current = null;
        }

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        if (audioElRef.current) {
            audioElRef.current.srcObject = null;
        }

        stopAudioAnalysis();
        setIsConnected(false);
        setVoiceState('idle');
        currentTranscriptRef.current = '';

        // Wait for cleanup to complete before allowing reconnection
        await new Promise(resolve => setTimeout(resolve, 300));
    }, [stopAudioAnalysis]);

    const toggleConversation = useCallback(async (voice: 'echo' | 'ash' = 'echo', systemPrompt?: string) => {
        if (isConnected) {
            await disconnect();
        } else {
            await connect(voice, systemPrompt);
        }
    }, [isConnected, connect, disconnect]);

    return {
        isConnecting: voiceState === 'connecting',
        voiceState,
        messages,
        isConnected,
        audioLevel, // Expose audio level
        speechRate,
        setSpeechRate: (rate: number) => {
            const clampedRate = Math.max(0.5, Math.min(2.0, rate));
            setSpeechRate(clampedRate);
            if (audioElRef.current) {
                audioElRef.current.playbackRate = clampedRate;
            }
            console.log(`🎤 [WebRTC] Speech rate set to ${clampedRate}x`);
        },
        connect,
        disconnect,
        toggleConversation,
    };
};
