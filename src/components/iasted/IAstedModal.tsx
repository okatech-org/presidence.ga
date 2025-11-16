import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, History, Settings } from 'lucide-react';
import ChatDock from './ChatDock';
import ConversationHistory from './ConversationHistory';
import VoiceSettings from './VoiceSettings';
import VoicePresets from './VoicePresets';
import { VoiceSettings as VoiceSettingsType } from '@/hooks/useVoiceInteraction';

interface IAstedModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  voiceSettings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
}

const IAstedModal = ({ 
  isOpen, 
  onClose, 
  messages, 
  voiceSettings, 
  onSettingsChange 
}: IAstedModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="py-4">
          <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            iAsted
          </h2>
          
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
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
              <ChatDock messages={messages} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <ConversationHistory />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="space-y-6">
                <VoicePresets
                  currentSettings={voiceSettings}
                  onLoadPreset={onSettingsChange}
                />
                
                <VoiceSettings
                  settings={voiceSettings}
                  onSettingsChange={onSettingsChange}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IAstedModal;
