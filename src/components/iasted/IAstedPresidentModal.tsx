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
          className="w-1.5 bg-green-500 rounded-full"
          animate={{
            height: state === 'listening' ? `${20 + (level / 100) * (i + 1) * 10}px` : '20px',
            backgroundColor: state === 'speaking' ? '#3B82F6' : '#22C55E',
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </div>
    <span className="text-xs text-gray-500">
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
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-opacity-20">
              <span className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {isUser && (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
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
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">iAsted - Assistant Présidentiel</h2>
                <p className="text-sm opacity-90">Niveau d'accès : TOP SECRET</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {session?.focus_mode && (
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Focus Actif
                </span>
              )}
              <AudioLevelIndicator level={audioLevel} state={voiceState} />
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'chat', label: 'Conversation', icon: MessageSquare },
              { id: 'settings', label: 'Paramètres', icon: Settings },
              { id: 'analytics', label: 'Analytique', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-green-700 font-semibold'
                    : 'bg-white/20 hover:bg-white/30'
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
                    className="flex items-center gap-2 text-gray-500"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">iAsted réfléchit...</span>
                  </motion.div>
                )}

                {transcript && voiceState === 'thinking' && (
                  <div className="text-sm text-gray-500 italic">
                    Transcription : "{transcript}"
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Controls */}
              <div className="border-t dark:border-gray-800 p-4 space-y-4">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowFocusModal(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      session?.focus_mode
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    {session?.focus_mode ? 'Focus actif' : 'Activer Focus'}
                  </button>

                  <button
                    onClick={() => sendTextMessage('Protocole XR-7 : statut actuel')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Protocole XR-7
                  </button>

                  <button
                    onClick={() => sendTextMessage('Synthèse nationale du jour')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Synthèse nationale
                  </button>

                  <button
                    onClick={clearSessionHistory}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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
                      placeholder="Écrivez votre message ou utilisez le micro..."
                      className="w-full p-3 border rounded-xl resize-none dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500"
                      rows={2}
                      disabled={isProcessing}
                    />
                  </div>

                  <button
                    onClick={voiceState === 'listening' ? stopListening : startListening}
                    disabled={isProcessing && voiceState !== 'listening'}
                    className={`p-4 rounded-xl transition-all ${
                      voiceState === 'listening'
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : voiceState === 'speaking'
                        ? 'bg-blue-500'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white shadow-lg`}
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
                    className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 shadow-lg"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </button>
                </div>

                <div className="text-center text-sm text-gray-500">
                  {voiceState === 'idle' && 'Prêt à vous assister'}
                  {voiceState === 'listening' && '🎙️ Je vous écoute...'}
                  {voiceState === 'thinking' && '🧠 Analyse en cours...'}
                  {voiceState === 'speaking' && '🔊 iAsted parle...'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 overflow-y-auto h-full space-y-4">
              <h3 className="text-lg font-semibold mb-4">Configuration vocale</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Style de réponse</label>
                <select
                  value={voiceSettings.responseStyle}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, responseStyle: e.target.value as any })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800"
                >
                  <option value="concis">Concis</option>
                  <option value="detaille">Détaillé</option>
                  <option value="strategique">Stratégique</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode continu</span>
                <button
                  onClick={() => setVoiceSettings({ ...voiceSettings, continuousMode: !voiceSettings.continuousMode })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    voiceSettings.continuousMode ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                      voiceSettings.continuousMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-6 overflow-y-auto h-full">
              <h3 className="text-lg font-semibold mb-4">Analytique de Session</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Messages</span>
                  </div>
                  <p className="text-3xl font-bold">{messages.length}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Durée</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {session
                      ? Math.round((Date.now() - new Date(session.created_at).getTime()) / 60000)
                      : 0} min
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
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-md m-4"
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
