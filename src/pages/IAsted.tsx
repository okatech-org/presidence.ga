import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Mic } from 'lucide-react';
import { useVoiceInteraction, VoiceSettings, VoiceMessage } from '@/hooks/useVoiceInteraction';

const IAsted = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    silenceDuration: 2000,
    silenceThreshold: 10,
    continuousMode: false,
  });

  const {
    voiceState,
    messages,
    audioLevel,
    handleInteraction,
    newQuestion,
    cancelInteraction,
  } = useVoiceInteraction(voiceSettings);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold mb-2">iAsted</h1>
          <p className="text-muted-foreground">Assistant Vocal Intelligent</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={activeTab === 'chat' ? 'default' : 'outline'}
            onClick={() => setActiveTab('chat')}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Conversation
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('settings')}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            {/* Voice Button */}
            <Card className="p-8">
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={handleInteraction}
                  disabled={voiceState === 'thinking' || voiceState === 'speaking'}
                  className={`
                    relative w-32 h-32 rounded-full flex items-center justify-center
                    transition-all duration-300 transform hover:scale-105
                    ${voiceState === 'listening' ? 'animate-pulse bg-red-500' : 'bg-primary'}
                    ${voiceState === 'thinking' ? 'animate-spin' : ''}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Mic className="w-12 h-12 text-white" />
                  
                  {voiceState === 'listening' && (
                    <div
                      className="absolute inset-0 rounded-full border-4 border-white/30"
                      style={{
                        transform: `scale(${1 + audioLevel / 200})`,
                        transition: 'transform 0.1s',
                      }}
                    />
                  )}
                </button>

                <div className="text-center">
                  <p className="text-lg font-semibold capitalize">{voiceState}</p>
                  {voiceState === 'listening' && (
                    <p className="text-sm text-muted-foreground">
                      Niveau audio: {Math.round(audioLevel)}%
                    </p>
                  )}
                </div>

                {voiceState === 'listening' && (
                  <Button variant="outline" onClick={cancelInteraction}>
                    Annuler
                  </Button>
                )}

                {voiceState === 'idle' && messages.length > 0 && (
                  <Button onClick={newQuestion}>
                    Nouvelle question
                  </Button>
                )}
              </div>
            </Card>

            {/* Messages */}
            {messages.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Conversation</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary/10 ml-8'
                          : 'bg-secondary mr-8'
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1 capitalize">
                        {msg.role === 'user' ? 'Vous' : 'iAsted'}
                      </p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {msg.timestamp.toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Paramètres Vocaux</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Durée de silence (ms)
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={voiceSettings.silenceDuration}
                  onChange={(e) =>
                    setVoiceSettings(prev => ({
                      ...prev,
                      silenceDuration: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {voiceSettings.silenceDuration}ms
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sensibilité du microphone
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={voiceSettings.silenceThreshold}
                  onChange={(e) =>
                    setVoiceSettings(prev => ({
                      ...prev,
                      silenceThreshold: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {voiceSettings.silenceThreshold}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mode continu</label>
                <input
                  type="checkbox"
                  checked={voiceSettings.continuousMode}
                  onChange={(e) =>
                    setVoiceSettings(prev => ({
                      ...prev,
                      continuousMode: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IAsted;
