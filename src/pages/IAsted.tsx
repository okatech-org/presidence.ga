import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Settings, History } from 'lucide-react';
import { useVoiceInteraction, VoiceSettings as VoiceSettingsType } from '@/hooks/useVoiceInteraction';
import IAstedButtonAdvanced from '@/components/iasted/IAstedButtonAdvanced';
import IAstedListeningOverlay from '@/components/iasted/IAstedListeningOverlay';
import IAstedVoiceControls from '@/components/iasted/IAstedVoiceControls';
import ChatDock from '@/components/iasted/ChatDock';
import VoiceSettings from '@/components/iasted/VoiceSettings';
import ConversationHistory from '@/components/iasted/ConversationHistory';
import VoicePresets from '@/components/iasted/VoicePresets';

const IAsted = () => {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsType>({
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
    stopListening,
  } = useVoiceInteraction(voiceSettings);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            iAsted
          </h1>
          <p className="text-muted-foreground text-lg">
            Assistant Vocal Intelligent de la Présidence
          </p>
        </div>

        {/* Listening Overlay */}
        <IAstedListeningOverlay voiceState={voiceState} audioLevel={audioLevel} />

        {/* Voice Controls */}
        <IAstedVoiceControls
          voiceState={voiceState}
          onStop={stopListening}
          onCancel={cancelInteraction}
          onRestart={newQuestion}
        />

        {/* Tabs */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Chat Area */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-center">
                  <IAstedButtonAdvanced
                    voiceState={voiceState}
                    audioLevel={audioLevel}
                    onClick={handleInteraction}
                    continuousMode={voiceSettings.continuousMode}
                  />
                </div>
              </div>

              {/* Chat Dock */}
              <div className="lg:col-span-1">
                <ChatDock messages={messages} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ConversationHistory />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <VoicePresets
                currentSettings={voiceSettings}
                onLoadPreset={setVoiceSettings}
              />
              
              <VoiceSettings
                settings={voiceSettings}
                onSettingsChange={setVoiceSettings}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IAsted;
