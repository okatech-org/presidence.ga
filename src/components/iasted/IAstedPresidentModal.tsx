import React, { useState, useRef, useEffect } from 'react';
import { usePresidentVoiceAgent } from '@/hooks/usePresidentVoiceAgent';
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  Loader2,
  Settings,
  Activity,
  Target,
  Shield,
  Globe,
  RotateCcw,
  MessageSquare,
  Bot,
  User,
  Clock,
  Zap,
  Brain,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_SETTINGS = {
  voiceId: 'alloy',
  silenceDuration: 2500,
  silenceThreshold: 15,
  continuousMode: false,
  autoGreeting: true,
  language: 'fr',
  responseStyle: 'strategique' as const,
};

interface IAstedPresidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AudioLevelIndicator: React.FC<{ level: number; state: string }> = ({ level, state }) => (
  <div className="flex items-center gap-2">
    <div className="flex gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full"
          animate={{
            height: state === 'listening' ? `${20 + (level / 100) * (i + 1) * 10}px` : '20px',
            backgroundColor: state === 'speaking' ? 'hsl(var(--primary))' : 'hsl(var(--success))',
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </div>
    <span className="text-xs text-muted-foreground">
      {state === 'listening' && 'Écoute...'}
      {state === 'thinking' && 'Analyse...'}
      {state === 'speaking' && 'Parle...'}
    </span>
  </div>
);

const MessageBubble: React.FC<{ message: any }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-success/10">
              <Bot className="w-4 h-4 text-success" />
            </div>
          )}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'neu-raised bg-primary/10 text-foreground rounded-br-none'
                : 'neu-inset text-foreground rounded-bl-none'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
              <span className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {isUser && (
            <div className="neu-raised w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const IAstedPresidentModal: React.FC<IAstedPresidentModalProps> = ({ isOpen, onClose }) => {
  const [voiceSettings, setVoiceSettings] = useState(DEFAULT_SETTINGS);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'settings' | 'analytics'>('chat');
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [focusTopic, setFocusTopic] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    voiceState,
    messages,
    session,
    audioLevel,
    transcript,
    isProcessing,
    startListening,
    stopListening,
    sendTextMessage,
    toggleFocusMode,
    clearSessionHistory,
  } = usePresidentVoiceAgent(voiceSettings);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      sendTextMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActivateFocus = () => {
    toggleFocusMode(focusTopic);
    setShowFocusModal(false);
    setFocusTopic('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="neu-card w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="neu-card p-6 rounded-t-2xl rounded-b-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="neu-raised w-14 h-14 rounded-full flex items-center justify-center p-3">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">iAsted - Assistant Présidentiel</h2>
                <p className="text-sm text-muted-foreground">Niveau d'accès : TOP SECRET</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {session?.focus_mode && (
                <span className="neu-raised bg-warning/10 text-warning px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Focus Actif
                </span>
              )}
              <AudioLevelIndicator level={audioLevel} state={voiceState} />
              <button
                onClick={onClose}
                className="neu-raised p-2 rounded-lg hover:shadow-neo-md transition-all"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'chat', label: 'Conversation', icon: MessageSquare },
              { id: 'analytics', label: 'Analytique', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'neu-inset text-primary font-semibold'
                    : 'neu-raised hover:shadow-neo-md'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <AnimatePresence>
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </AnimatePresence>

                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">iAsted réfléchit...</span>
                  </motion.div>
                )}

                {transcript && voiceState === 'thinking' && (
                  <div className="text-sm text-muted-foreground italic">
                    Transcription : "{transcript}"
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Controls */}
              <div className="neu-card rounded-t-none rounded-b-2xl p-4 space-y-4">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowFocusModal(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      session?.focus_mode
                        ? 'neu-inset bg-warning/10 text-warning'
                        : 'neu-raised hover:shadow-neo-md'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    {session?.focus_mode ? 'Focus actif' : 'Activer Focus'}
                  </button>

                  <button
                    onClick={() => sendTextMessage('Protocole XR-7 : statut actuel')}
                    className="neu-raised flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:shadow-neo-md transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    Protocole XR-7
                  </button>

                  <button
                    onClick={() => sendTextMessage('Synthèse nationale du jour')}
                    className="neu-raised flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:shadow-neo-md transition-all"
                  >
                    <Globe className="w-4 h-4" />
                    Synthèse nationale
                  </button>

                  <button
                    onClick={clearSessionHistory}
                    className="neu-raised flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium hover:shadow-neo-md transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>

                {/* Input */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Écrivez votre message..."
                      className="w-full p-3 neu-inset rounded-xl resize-none focus:ring-2 focus:ring-primary"
                      rows={2}
                      disabled={isProcessing}
                    />
                  </div>

                  <button
                    onClick={voiceState === 'listening' ? stopListening : startListening}
                    disabled={isProcessing && voiceState !== 'listening'}
                    className={`neu-raised p-4 rounded-xl transition-all ${
                      voiceState === 'listening'
                        ? 'bg-destructive text-destructive-foreground animate-pulse shadow-neo-lg'
                        : voiceState === 'speaking'
                        ? 'bg-primary text-primary-foreground shadow-neo-md'
                        : 'bg-success text-success-foreground hover:shadow-neo-lg'
                    }`}
                  >
                    {voiceState === 'listening' ? (
                      <MicOff className="w-6 h-6" />
                    ) : voiceState === 'speaking' ? (
                      <Volume2 className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isProcessing}
                    className="neu-raised p-4 bg-success text-success-foreground rounded-xl hover:shadow-neo-lg transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {voiceState === 'idle' && 'Prêt à vous assister'}
                  {voiceState === 'listening' && '🎙️ Je vous écoute...'}
                  {voiceState === 'thinking' && '🧠 Analyse en cours...'}
                  {voiceState === 'speaking' && '🔊 iAsted parle...'}
                </div>
              </div>
            </div>
          )}


          {activeTab === 'analytics' && (
            <div className="p-6 overflow-y-auto h-full">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Analytique de Session</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="neu-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Messages</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{messages.length}</p>
                </div>

                <div className="neu-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Durée</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {session ? Math.round((Date.now() - new Date(session.created_at).getTime()) / 60000) : 0} min
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Focus Modal */}
        <AnimatePresence>
          {showFocusModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
              onClick={() => setShowFocusModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="neu-card p-6 w-full max-w-md m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">Mode Focus</h3>
                
                {session?.focus_mode ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <p className="font-medium">Sujet : {session.focus_topic}</p>
                    </div>
                    <button
                      onClick={() => {
                        toggleFocusMode();
                        setShowFocusModal(false);
                      }}
                      className="w-full py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                    >
                      Désactiver
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={focusTopic}
                      onChange={(e) => setFocusTopic(e.target.value)}
                      placeholder="Ex: Politique énergétique"
                      className="w-full p-3 border rounded-lg dark:bg-gray-800"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFocusModal(false)}
                        className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleActivateFocus}
                        disabled={!focusTopic.trim()}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                      >
                        Activer
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
