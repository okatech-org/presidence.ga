import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, History, Settings as SettingsIcon } from 'lucide-react';
import { IAstedVoiceButton } from '@/components/IAstedVoiceButton';
import { ChatDock } from '@/components/ChatDock';
import { ConversationHistory } from '@/components/ConversationHistory';
import { VoiceSettings } from '@/components/VoiceSettings';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';

const IAsted = () => {
  const [activeTab, setActiveTab] = useState<string>('conversation');
  const { conversationMessages } = useVoiceInteraction();

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            iAsted - Assistant Vocal Intelligent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conversation">
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversation
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                Historique
              </TabsTrigger>
              <TabsTrigger value="settings">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Paramètres
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Zone de contrôle vocal */}
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <IAstedVoiceButton size="lg" />
                  </CardContent>
                </Card>

                {/* ChatDock - Transcriptions */}
                <ChatDock messages={conversationMessages} className="h-[500px]" />
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ConversationHistory />
            </TabsContent>

            <TabsContent value="settings">
              <VoiceSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default IAsted;
