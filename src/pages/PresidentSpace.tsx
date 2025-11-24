import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Building2,
  FileText,
  TrendingUp as TrendingUpIcon,
  Globe,
  Shield,
  Activity,
  Calendar,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Award,
  Flag,
  Scale,
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  Menu,
  AlertTriangle,
  Clock,
  DollarSign,
  Crown,
  FileCheck,
  MapPin,
  CheckCircle2,
  LayoutDashboard,
  Bot,
  History,
  UserCog,
  Landmark,
  Stethoscope,
  Hammer,
  Wrench,
  Target,
  Inbox,
} from "lucide-react";
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import { MailInbox } from '@/components/iasted/MailInbox';
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { DocumentsSection } from '@/components/documents/DocumentsSection';
import { SettingsModal } from '@/components/president/SettingsModal';
import { DocumentSignerModal } from '@/components/president/DocumentSignerModal';
import { NominationDetailsModal } from '@/components/president/NominationDetailsModal';
import { ConseilSessionModal } from '@/components/president/ConseilSessionModal';
import { ProjectDetailsModal, ProjectType } from '@/components/president/ProjectDetailsModal';
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { useRealtimePresidentDashboard } from '@/hooks/useRealtimeSync';
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SectionCard, StatCard, CircularProgress } from "@/components/president/PresidentSpaceComponents";
import { useTheme } from "next-themes";
import emblemGabon from "@/assets/emblem_gabon.png";
import { IASTED_SYSTEM_PROMPT } from "@/config/iasted-config";
import { soundManager } from "@/utils/SoundManager";
import { useUserContext } from "@/hooks/useUserContext";
import { generateSystemPrompt } from "@/utils/generateSystemPrompt";


type ThemeConfig = {
  primary: string;
  primaryGold: string;
  primaryBlue: string;
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderMedium: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  shadow: string;
  shadowLg: string;
};

const themes: Record<"light" | "dark", ThemeConfig> = {
  light: {
    primary: "#10B981",
    primaryGold: "#F59E0B",
    primaryBlue: "#3B82F6",
    bg: "#FFFFFF",
    bgSecondary: "#F3F4F6",
    bgTertiary: "#E5E7EB",
    bgCard: "#FFFFFF",
    text: "#111827",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    border: "#E5E7EB",
    borderMedium: "#D1D5DB",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    shadowLg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  },
  dark: {
    primary: "#34D399",
    primaryGold: "#FCD34D",
    primaryBlue: "#60A5FA",
    bg: "#0F172A",
    bgSecondary: "#1E293B",
    bgTertiary: "#334155",
    bgCard: "#1E293B",
    text: "#F1F5F9",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    border: "#334155",
    borderMedium: "#475569",
    success: "#34D399",
    warning: "#FCD34D",
    danger: "#F87171",
    info: "#60A5FA",
    shadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
    shadowLg: "0 10px 15px -3px rgb(0 0 0 / 0.3)",
  },
};

export default function PresidentSpace() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    navigation: false,
    gouvernance: false,
    economie: false,
    affaires: false,
    infrastructures: false,
  });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [iastedOpen, setIastedOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signerOpen, setSignerOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [nominationModalOpen, setNominationModalOpen] = useState(false);
  const [selectedNominationId, setSelectedNominationId] = useState<string | null>(null);
  const [conseilModalOpen, setConseilModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType>('presidential');
  const [pendingDocument, setPendingDocument] = useState<any>(null);
  const [voiceMode, setVoiceMode] = useState<'elevenlabs' | 'openai'>(() => {
    return (localStorage.getItem('iasted-voice-mode') as 'elevenlabs' | 'openai') || 'elevenlabs';
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Activer la synchronisation temps réel pour le dashboard présidentiel
  useRealtimePresidentDashboard();

  // Calculer la salutation en fonction de l'heure
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 5 && hour < 18 ? "Bonjour" : "Bonsoir";
  }, []);

  // Formater le prompt système avec les variables contextuelles
  const formattedSystemPrompt = useMemo(() => {
    return IASTED_SYSTEM_PROMPT
      .replace(/{USER_TITLE}/g, "Excellence Monsieur le Président")
      .replace(/{CURRENT_TIME_OF_DAY}/g, timeOfDay)
      .replace(/{APPELLATION_COURTE}/g, "Monsieur le Président");
  }, [timeOfDay]);

  // État pour la voix sélectionnée
  const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('ash');

  // État pour la pulsation du bouton
  const [isPulsing, setIsPulsing] = useState(false);

  // Context utilisateur pour personnalisation
  const userContext = useUserContext({ spaceName: 'PresidentSpace' });

  // Ref pour tracker la dernière section ouverte (pour contexte intelligent)
  const lastOpenedSectionRef = useRef<keyof typeof expandedSections | null>(null);

  // Hook pour la conversation OpenAI WebRTC
  const openaiRTC = useRealtimeVoiceWebRTC((toolName, args) => {
    console.log(`🔧 [PresidentSpace] Tool call: ${toolName}`, args);
    switch (toolName) {
      case 'control_ui':
        console.log('🎛️ [PresidentSpace] Contrôle UI demandé:', args);
        if (args.action === 'toggle_theme') {
          const newTheme = theme === 'dark' ? 'light' : 'dark';
          console.log(`🎨 Basculement thème: ${theme} -> ${newTheme}`);
          setTheme(newTheme);
          toast({ title: "Thème", description: `Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé` });
          return { success: true, message: `Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé` };
        } else if (args.action === 'set_theme_dark') {
          console.log('🎨 Activation mode sombre');
          setTheme("dark");
          toast({ title: "Thème", description: "Mode sombre activé" });
          return { success: true, message: "Mode sombre activé" };
        } else if (args.action === 'set_theme_light') {
          console.log('🎨 Activation mode clair');
          setTheme("light");
          toast({ title: "Thème", description: "Mode clair activé" });
          return { success: true, message: "Mode clair activé" };
        } else if (args.action === 'toggle_sidebar') {
          window.dispatchEvent(new CustomEvent('iasted-sidebar-toggle'));
          return { success: true, message: 'Menu latéral basculé' };
        } else if (args.action === 'set_volume') {
          toast({ title: "Volume", description: `Volume ajusté à ${args.value || 'niveau demandé'}` });
          return { success: true, message: 'Volume ajusté' };
        } else if (args.action === 'set_speech_rate') {
          if (args.value) openaiRTC.setSpeechRate(parseFloat(args.value));
          toast({ title: "Vitesse", description: `Vitesse de parole ajustée` });
          return { success: true, message: 'Vitesse ajustée' };
        }
        return { success: false, message: 'Action UI non reconnue' };

      case 'change_voice':
        console.log('🎙️ [PresidentSpace] Changement de voix demandé:', args);
        if (args.voice_id) {
          const voiceName = args.voice_id === 'ash' ? 'Homme (Ash)' : args.voice_id === 'shimmer' ? 'Femme (Shimmer)' : 'Standard (Echo)';
          setSelectedVoice(args.voice_id as any);
          toast({
            title: "Voix modifiée",
            description: `Passage à la voix ${voiceName}`,
          });
          return { success: true, message: `Voix modifiée : ${voiceName}` };
        } else {
          // Alternance automatique homme ↔ femme
          const isCurrentlyMale = selectedVoice === 'ash' || selectedVoice === 'echo';
          const newVoice = isCurrentlyMale ? 'shimmer' : 'ash';
          const voiceName = newVoice === 'shimmer' ? 'Femme (Shimmer)' : 'Homme (Ash)';
          console.log(`🎙️ Alternance: ${selectedVoice} (${isCurrentlyMale ? 'homme' : 'femme'}) -> ${newVoice}`);
          setSelectedVoice(newVoice);
          toast({
            title: "Voix modifiée",
            description: `Passage à la voix ${voiceName}`,
          });
          return { success: true, message: `Voix changée : ${voiceName}` };
        }

      case 'navigate_to_section':
        console.log('🧭 [PresidentSpace] Navigation demandée:', args);
        const sectionId = args.section_id;

        // Sections accordéon (toggle ou ouverture explicite)
        const accordionSections = ['navigation', 'gouvernance', 'economie', 'affaires', 'infrastructures'];

        if (accordionSections.includes(sectionId)) {
          // Vérifier l'état actuel et basculer
          const currentState = expandedSections[sectionId as keyof typeof expandedSections];
          const newState = !currentState;
          console.log(`📂 Section "${sectionId}": ${currentState ? 'fermée' : 'ouverte'} -> ${newState ? 'ouverte' : 'fermée'}`);
          
          setExpandedSections(prev => ({
            ...prev,
            [sectionId]: newState,
          }));
          
          const actionMsg = newState ? 'dépliée' : 'repliée';
          toast({ title: "Navigation", description: `Section ${sectionId} ${actionMsg}` });
          return { success: true, message: `Section ${sectionId} ${actionMsg}` };
        } else {
          // Pages (navigation directe)
          console.log(`📄 Navigation vers page: ${sectionId}`);
          setActiveSection(sectionId);

          // Ouvrir la section parente si nécessaire
          const parentSectionMap: Record<string, keyof typeof expandedSections> = {
            'dashboard': 'navigation',
            'iasted': 'navigation',
            'documents': 'navigation',
            'courriers': 'navigation',
            'conseil-ministres': 'gouvernance',
            'ministeres': 'gouvernance',
            'decrets': 'gouvernance',
            'nominations': 'gouvernance',
            'budget': 'economie',
            'indicateurs': 'economie',
            'investissements': 'economie',
            'education': 'affaires',
            'sante': 'affaires',
            'emploi': 'affaires',
            'chantiers': 'infrastructures',
            'projets-presidentiels': 'infrastructures',
            'projets-etat': 'infrastructures'
          };

          const parent = parentSectionMap[sectionId];
          if (parent) {
            console.log(`📂 Ouverture section parente: ${parent}`);
            setExpandedSections(prev => ({ ...prev, [parent]: true }));
          }

          toast({ title: "Navigation", description: `Ouverture de ${sectionId}` });
          return { success: true, message: `Section ${sectionId} ouverte` };
        }

      case 'control_document':
        console.log('📄 [PresidentSpace] Contrôle document:', args);
        toast({
          title: "Document",
          description: `Action ${args.action} demandée sur ${args.document_id || 'le document'}`
        });
        return { success: true, message: `Action ${args.action} exécutée` };

      case 'generate_document':
        console.log('📝 [PresidentSpace] Génération document:', args);
        setPendingDocument({
          type: args.type,
          recipient: args.recipient,
          subject: args.subject,
          contentPoints: args.content_points || [],
          format: args.format || 'pdf'
        });
        setIastedOpen(true);
        toast({
          title: "Génération",
          description: `Création de ${args.type} pour ${args.recipient}...`
        });
        return { success: true, message: `Génération de ${args.type} lancée` };

      case 'open_chat':
        setIastedOpen(true);
        return { success: true, message: 'Interface chat ouverte' };

      case 'close_chat':
        setIastedOpen(false);
        return { success: true, message: 'Interface chat fermée' };

      case 'stop_conversation':
        openaiRTC.disconnect();
        setIastedOpen(false);
        return { success: true, message: 'Conversation arrêtée' };
    }
  });

  // Initialiser la voix depuis le localStorage
  useEffect(() => {
    const savedVoice = localStorage.getItem('iasted-voice-selection') as 'echo' | 'ash';
    if (savedVoice) setSelectedVoice(savedVoice);
  }, []);

  // Écouter les changements du mode vocal depuis localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newMode = localStorage.getItem('iasted-voice-mode') as 'elevenlabs' | 'openai';
      if (newMode && newMode !== voiceMode) {
        console.log('🔄 [PresidentSpace] Mode vocal changé:', newMode);
        setVoiceMode(newMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Vérifier périodiquement (pour les changements dans le même onglet)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [voiceMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Écouter les événements de navigation et contrôle UI depuis iAsted
  useEffect(() => {
    const handleNavigationEvent = (e: CustomEvent) => {
      const { sectionId } = e.detail;
      console.log('📍 [PresidentSpace] Événement navigation reçu:', sectionId);

      // Sections accordéon
      const accordionSections = ['navigation', 'gouvernance', 'economie', 'affaires', 'infrastructures'];
      
      if (accordionSections.includes(sectionId)) {
        setExpandedSections(prev => ({
          ...prev,
          [sectionId]: !prev[sectionId as keyof typeof prev]
        }));
      } else {
        // Pages
        setActiveSection(sectionId);
        
        // Ouvrir la section parente si nécessaire
        const parentMap: Record<string, keyof typeof expandedSections> = {
          'dashboard': 'navigation',
          'iasted': 'navigation',
          'documents': 'navigation',
          'courriers': 'navigation',
          'conseil-ministres': 'gouvernance',
          'ministeres': 'gouvernance',
          'decrets': 'gouvernance',
          'nominations': 'gouvernance',
          'budget': 'economie',
          'indicateurs': 'economie',
          'investissements': 'economie',
          'education': 'affaires',
          'sante': 'affaires',
          'emploi': 'affaires',
          'chantiers': 'infrastructures',
          'projets-presidentiels': 'infrastructures',
          'projets-etat': 'infrastructures'
        };
        
        const parent = parentMap[sectionId];
        if (parent) {
          setExpandedSections(prev => ({ ...prev, [parent]: true }));
        }
      }
    };

    const handleUIControlEvent = (e: CustomEvent) => {
      const { action, value } = e.detail;
      console.log('🎨 [PresidentSpace] Événement UI Control reçu:', action);
      
      if (action === 'toggle_theme') {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      } else if (action === 'set_theme_dark') {
        setTheme('dark');
      } else if (action === 'set_theme_light') {
        setTheme('light');
      }
    };

    window.addEventListener('iasted-navigate-section', handleNavigationEvent as EventListener);
    window.addEventListener('iasted-control-ui', handleUIControlEvent as EventListener);

    return () => {
      window.removeEventListener('iasted-navigate-section', handleNavigationEvent as EventListener);
      window.removeEventListener('iasted-control-ui', handleUIControlEvent as EventListener);
    };
  }, [theme, setTheme]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const currentTheme = useMemo(() => {
    const isDark = theme === "dark";
    return isDark ? themes.dark : themes.light;
  }, [theme]);

  const stats = useMemo(() => ({
    totalAgents: 12543,
    structures: 28,
    postesVacants: 342,
    actesEnAttente: 12,
  }), []);

  const agentTypesData = useMemo(() => [
    { name: "Cadres", value: 35, color: "hsl(var(--primary))" },
    { name: "Techniciens", value: 28, color: "hsl(var(--secondary))" },
    { name: "Agents", value: 22, color: "hsl(var(--accent))" },
    { name: "Ouvriers", value: 15, color: "hsl(var(--warning))" },
  ], []);

  const genderData = useMemo(() => [
    { name: "Hommes", value: 58, color: "hsl(var(--primary))" },
    { name: "Femmes", value: 42, color: "hsl(var(--accent))" },
  ], []);


  const navigationItems = useMemo(() => [
    { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard, section: "navigation" },
    { id: "documents", label: "Documents", icon: FileText, section: "navigation" },
    { id: "courriers", label: "Courriers", icon: Inbox, section: "navigation" },
    { id: "iasted", label: "iAsted", icon: Bot, section: "navigation" },
  ], []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex gap-6 max-w-[1600px] mx-auto">
        {/* Sidebar détachée */}
        <aside className="neu-card w-60 flex-shrink-0 p-6 flex flex-col min-h-[calc(100vh-3rem)] overflow-hidden">
          {/* Logo et titre */}
          <div className="flex items-center gap-3 mb-8">
            <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center p-2">
              <img
                src={emblemGabon}
                alt="Emblème de la République Gabonaise"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-sm">ADMIN.GA</div>
              <div className="text-xs text-muted-foreground">Espace Président</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('navigation')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              NAVIGATION
              {expandedSections.navigation ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.navigation && (
              <nav className="space-y-1 ml-2">
                {navigationItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (item.id === "iasted") {
                        setIastedOpen(true);
                      } else {
                        setActiveSection(item.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === item.id || (item.id === "iasted" && iastedOpen)
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Gouvernance */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('gouvernance')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              GOUVERNANCE
              {expandedSections.gouvernance ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.gouvernance && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("conseil-ministres")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "conseil-ministres"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <UserCog className="w-4 h-4" />
                  Conseil des Ministres
                </button>
                <button
                  onClick={() => setActiveSection("ministeres")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "ministeres"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <Building2 className="w-4 h-4" />
                  Ministères & Directions
                </button>
                <button
                  onClick={() => setActiveSection("decrets")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "decrets"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <FileCheck className="w-4 h-4" />
                  Décrets & Ordonnances
                </button>
                <button
                  onClick={() => setActiveSection("nominations")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "nominations"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <Users className="w-4 h-4" />
                  Nominations
                </button>
              </nav>
            )}
          </div>

          {/* Économie & Finances */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('economie')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              ÉCONOMIE & FINANCES
              {expandedSections.economie ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.economie && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("budget")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "budget"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Budget National
                </button>
                <button
                  onClick={() => setActiveSection("indicateurs")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "indicateurs"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <TrendingUpIcon className="w-4 h-4" />
                  Indicateurs Économiques
                </button>
                <button
                  onClick={() => setActiveSection("investissements")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "investissements"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <Landmark className="w-4 h-4" />
                  Investissements
                </button>
              </nav>
            )}
          </div>

          {/* Affaires Sociales */}
          <div className="mb-4 flex-1">
            <button
              onClick={() => toggleSection('affaires')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              AFFAIRES SOCIALES
              {expandedSections.affaires ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.affaires && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("education")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "education"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Éducation
                </button>
                <button
                  onClick={() => setActiveSection("sante")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "sante"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Santé Publique
                </button>
                <button
                  onClick={() => setActiveSection("emploi")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "emploi"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Emploi & Formation
                </button>
              </nav>
            )}
          </div>

          {/* Infrastructures & Projets */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('infrastructures')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              INFRASTRUCTURES & PROJETS
              {expandedSections.infrastructures ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expandedSections.infrastructures && (
              <nav className="space-y-1 ml-2">
                <button
                  onClick={() => setActiveSection("chantiers")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "chantiers"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <Hammer className="w-4 h-4" />
                  Suivi des Chantiers
                </button>
                <button
                  onClick={() => setActiveSection("projets-presidentiels")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "projets-presidentiels"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <Crown className="w-4 h-4" />
                  Projets Présidentiels
                </button>
                <button
                  onClick={() => setActiveSection("projets-etat")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "projets-etat"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    }`}
                >
                  <Target className="w-4 h-4" />
                  Projets d'État
                </button>
              </nav>
            )}
          </div>

          {/* Paramètres et Déconnexion */}
          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm neu-raised hover:shadow-neo-md transition-all mb-1"
            >
              {mounted && theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4" />
                  Mode clair
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  Mode sombre
                </>
              )}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm neu-raised hover:shadow-neo-md transition-all mb-1"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive neu-raised hover:shadow-neo-md transition-all"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1">
          <div className="neu-card p-8 min-h-[calc(100vh-3rem)]">
            {/* En-tête */}
            <div className="flex items-start gap-4 mb-10">
              <div className="neu-raised w-20 h-20 rounded-full flex items-center justify-center p-3 shrink-0">
                <img
                  src={emblemGabon}
                  alt="Emblème de la République Gabonaise"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Espace Président
                </h1>
                <p className="text-base text-muted-foreground">
                  Présidence de la République - République Gabonaise
                </p>
              </div>
            </div>

            {/* Statistiques principales - Style avec séparateurs */}
            <div className="neu-card p-6 mb-8">
              <div className="grid grid-cols-4 divide-x divide-border">
                <div className="px-6 first:pl-0">
                  <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {stats.totalAgents}
                  </div>
                  <div className="text-sm font-medium">Total Agents</div>
                  <div className="text-xs text-muted-foreground">Fonction publique gabonaise</div>
                </div>

                <div className="px-6">
                  <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {stats.structures}
                  </div>
                  <div className="text-sm font-medium">Structures</div>
                  <div className="text-xs text-muted-foreground">Ministères et directions</div>
                </div>

                <div className="px-6">
                  <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4">
                    <UserCog className="w-6 h-6 text-warning" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {stats.postesVacants}
                  </div>
                  <div className="text-sm font-medium">Postes Vacants</div>
                  <div className="text-xs text-muted-foreground">Sur 0 postes</div>
                </div>

                <div className="px-6 last:pr-0">
                  <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4">
                    <FileCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {stats.actesEnAttente}
                  </div>
                  <div className="text-sm font-medium">Actes en attente</div>
                  <div className="text-xs text-muted-foreground">Nécessitent votre validation</div>
                </div>
              </div>
            </div>

            {/* Contenu conditionnel selon la section active */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Agents" value={stats.totalAgents.toLocaleString()} icon={Users} color={currentTheme.primary} theme={currentTheme} />
                  <StatCard title="Structures" value={stats.structures} icon={Building2} color={currentTheme.primaryBlue} theme={currentTheme} />
                  <StatCard title="Postes Vacants" value={stats.postesVacants} icon={UserCog} color={currentTheme.warning} theme={currentTheme} />
                  <StatCard title="Actes en Attente" value={stats.actesEnAttente} icon={FileText} color={currentTheme.danger} theme={currentTheme} />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SectionCard title="Répartition par Catégorie" theme={currentTheme}>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={agentTypesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {agentTypesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.border, color: currentTheme.text }}
                            itemStyle={{ color: currentTheme.text }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>

                  <SectionCard title="Répartition Genre" theme={currentTheme}>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={genderData}>
                          <XAxis dataKey="name" stroke={currentTheme.textSecondary} />
                          <YAxis stroke={currentTheme.textSecondary} />
                          <Tooltip
                            cursor={{ fill: currentTheme.bgTertiary }}
                            contentStyle={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.border, color: currentTheme.text }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {genderData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>
                </div >
              </div >
            )
            }

            {
              activeSection === "documents" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <DocumentsSection userRole="president" />
                </div>
              )
            }

            {
              activeSection === "courriers" && (
                <MailInbox />
              )
            }

            {
              activeSection === "conseil-ministres" && (
                <div className="space-y-6">
                  <ConseilMinistres
                    theme={currentTheme}
                    onOpenSession={(id) => {
                      setSelectedSessionId(id);
                      setConseilModalOpen(true);
                    }}
                  />
                </div>
              )
            }

            {
              activeSection === "ministeres" && (
                <div className="space-y-6">
                  <MinisteresDirections theme={currentTheme} />
                </div>
              )
            }

            {
              activeSection === "decrets" && (
                <div className="space-y-6">
                  <DecretsOrdonnances
                    theme={currentTheme}
                    onOpenDocument={(id) => {
                      setSelectedDocId(id);
                      setSignerOpen(true);
                    }}
                  />
                </div>
              )
            }

            {
              activeSection === "nominations" && (
                <div className="space-y-6">
                  <Nominations
                    theme={currentTheme}
                    onOpenNomination={(id) => {
                      setSelectedNominationId(id);
                      setNominationModalOpen(true);
                    }}
                  />
                </div>
              )
            }

            {
              activeSection === "budget" && (
                <div className="space-y-6">
                  <BudgetNationalSection theme={currentTheme} />
                </div>
              )
            }

            {
              activeSection === "indicateurs" && (
                <div className="space-y-6">
                  <IndicateursEconomiquesSection theme={currentTheme} />
                </div>
              )
            }

            {
              activeSection === "investissements" && (
                <div className="space-y-6">
                  <InvestissementsSection theme={currentTheme} />
                </div>
              )
            }

            {
              activeSection === "education" && (
                <div className="space-y-6">
                  <EducationSection theme={currentTheme} />
                </div>
              )
            }

            {
              activeSection === "sante" && (
                <div className="space-y-6">
                  <SantePubliqueSection theme={currentTheme} />
                </div>
              )
            }

            {
              activeSection === "emploi" && (
                <div className="space-y-6">
                  <EmploiFormationSection theme={currentTheme} />
                </div>
              )
            }

            {
              activeSection === "chantiers" && (
                <div className="space-y-6">
                  <ChantiersSection
                    theme={currentTheme}
                    onOpenProject={(id) => {
                      setSelectedProjectId(id);
                      setSelectedProjectType('construction');
                      setProjectModalOpen(true);
                    }}
                  />
                </div>
              )
            }
            {
              activeSection === "projets-presidentiels" && (
                <div className="space-y-6">
                  <ProjetsPresidentielsSection
                    theme={currentTheme}
                    onOpenProject={(id) => {
                      setSelectedProjectId(id);
                      setSelectedProjectType('presidential');
                      setProjectModalOpen(true);
                    }}
                  />
                </div>
              )
            }
            {
              activeSection === "projets-etat" && (
                <div className="space-y-6">
                  <ProjetsEtatSection
                    theme={currentTheme}
                    onOpenProject={(id) => {
                      setSelectedProjectId(id);
                      setSelectedProjectType('state');
                      setProjectModalOpen(true);
                    }}
                  />
                </div>
              )
            }
          </div >
        </main >
      </div >



      {/* Interface iAsted avec chat et documents */}
      <IAstedChatModal
        isOpen={iastedOpen}
        onClose={() => setIastedOpen(false)}
        openaiRTC={openaiRTC}
        pendingDocument={pendingDocument}
        onClearPendingDocument={() => setPendingDocument(null)}
        currentVoice={selectedVoice}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userRole="president"
      />

      {/* Document Signer Modal */}
      <DocumentSignerModal
        isOpen={signerOpen}
        onClose={() => {
          setSignerOpen(false);
          setSelectedDocId(null);
        }}
        documentId={selectedDocId}
        onSigned={() => {
          // Refresh data if needed, handled by realtime subscription in component
          toast({ title: "Succès", description: "Liste des documents mise à jour" });
        }}
      />

      {/* Nomination Details Modal */}
      <NominationDetailsModal
        isOpen={nominationModalOpen}
        onClose={() => {
          setNominationModalOpen(false);
          setSelectedNominationId(null);
        }}
        nominationId={selectedNominationId}
        onDecided={() => {
          toast({ title: "Succès", description: "Statut de la nomination mis à jour" });
        }}
      />

      {/* Conseil Session Modal */}
      <ConseilSessionModal
        isOpen={conseilModalOpen}
        onClose={() => {
          setConseilModalOpen(false);
          setSelectedSessionId(null);
        }}
        sessionId={selectedSessionId}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setSelectedProjectId(null);
        }}
        projectId={selectedProjectId}
        projectType={selectedProjectType}
      />
    </div >
  );
}

// Fonctions de sections exportées pour compatibilité (utilisées dans d'autres parties de l'application)
export function ConseilMinistres({ theme, onOpenSession }: { theme: ThemeConfig, onOpenSession: (id: string) => void }) {
  const [nextSession, setNextSession] = useState<any>(null);
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      // Fetch next scheduled session
      const { data: session, error } = await supabase
        .from('conseil_ministres_sessions')
        .select('*')
        .eq('status', 'scheduled')
        .order('date', { ascending: true })
        .limit(1)
        .single();

      if (session) {
        setNextSession(session);

        // Fetch agenda items for this session
        const { data: agenda } = await supabase
          .from('ordre_du_jour')
          .select('*')
          .eq('session_id', session.id)
          .limit(3);

        if (agenda) setAgendaItems(agenda);
      }
      setLoading(false);
    };

    fetchSessionData();
  }, []);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <SectionCard
        title="Prochaine Session"
        theme={theme}
        right={<Calendar size={18} color={theme.textSecondary} />}
      >
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</div>
        ) : nextSession ? (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => onOpenSession(nextSession.id)}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <StatCard
                title="Date"
                value={new Date(nextSession.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}
                icon={Calendar}
                color={theme.primary}
                theme={theme}
              />
              <StatCard
                title="Heure"
                value={nextSession.time?.slice(0, 5)}
                icon={Clock}
                color={theme.primaryBlue}
                theme={theme}
              />
              <StatCard
                title="Lieu"
                value={nextSession.location || "Palais"}
                icon={Building2}
                color={theme.primaryGold}
                theme={theme}
              />
            </div>
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Aucune session programmée</div>
        )}
      </SectionCard>

      <SectionCard title="Ordre du Jour (Aperçu)" theme={theme}>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</div>
        ) : agendaItems.length > 0 ? (
          <ul style={{ display: "grid", gap: "12px" }}>
            {agendaItems.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: theme.bgSecondary, borderRadius: 10, border: `1px solid ${theme.border}` }}>
                <FileText size={16} color={theme.primary} />
                <span style={{ color: theme.text }}>{item.title}</span>
              </li>
            ))}
            {nextSession && (
              <li
                style={{ textAlign: 'center', fontSize: '13px', color: theme.primary, cursor: 'pointer', padding: '8px' }}
                onClick={() => onOpenSession(nextSession.id)}
              >
                Voir tout l'ordre du jour
              </li>
            )}
          </ul>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Aucun point à l'ordre du jour</div>
        )}
      </SectionCard>
    </div>
  );
}

export function MinisteresDirections({ theme }: { theme: ThemeConfig }) {
  const cards = [
    { title: "Défense Nationale", kpi: "Niveau d’alerte: Rouge", icon: Shield, color: theme.danger },
    { title: "Économie & Finances", kpi: "Solde budgétaire: -2.8%", icon: Briefcase, color: theme.primaryGold },
    { title: "Affaires Étrangères", kpi: "Visites diplomatiques: 4", icon: Globe, color: theme.info },
    { title: "Justice", kpi: "Congestion tribunaux: 68%", icon: Scale, color: theme.warning },
  ];
  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <SectionCard title="Vue d’ensemble des Ministères" theme={theme}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          {cards.map((c, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <c.icon size={18} color={c.color} />
                <h4 style={{ color: theme.text, fontWeight: 600 }}>{c.title}</h4>
              </div>
              <p style={{ color: theme.textSecondary, fontSize: 14 }}>{c.kpi}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function DecretsOrdonnances({ theme, onOpenDocument }: { theme: ThemeConfig, onOpenDocument: (id: string) => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from('decrets_ordonnances')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setDocuments(data);
      setLoading(false);
    };

    fetchDocuments();

    // Subscribe to changes
    const channel = supabase
      .channel('decrets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decrets_ordonnances' }, () => {
        fetchDocuments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return theme.success;
      case 'pending': return theme.warning;
      case 'revision_needed': return theme.danger;
      default: return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed': return 'Signé';
      case 'pending': return 'En attente';
      case 'revision_needed': return 'Révision';
      default: return status;
    }
  };

  return (
    <SectionCard title="Décrets & Ordonnances" theme={theme} right={<FileText size={18} color={theme.textSecondary} />}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: theme.bgSecondary }}>
              {["Référence", "Objet", "Type", "Statut"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 14px", color: theme.textSecondary, fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Aucun document récent</td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr
                  key={doc.id}
                  style={{ borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}
                  onClick={() => onOpenDocument(doc.id)}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td style={{ padding: "12px 14px", color: theme.text, fontWeight: 600 }}>{doc.reference}</td>
                  <td style={{ padding: "12px 14px", color: theme.text }}>{doc.title}</td>
                  <td style={{ padding: "12px 14px", color: theme.textSecondary }}>
                    {doc.type === 'decree' ? 'Décret' : 'Ordonnance'}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      background: `${getStatusColor(doc.status)}20`,
                      color: getStatusColor(doc.status),
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function Nominations({ theme, onOpenNomination }: { theme: ThemeConfig, onOpenNomination: (id: string) => void }) {
  const [nominations, setNominations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNominations = async () => {
      const { data, error } = await supabase
        .from('nominations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setNominations(data);
      setLoading(false);
    };

    fetchNominations();

    // Subscribe to changes
    const channel = supabase
      .channel('nominations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nominations' }, () => {
        fetchNominations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.success;
      case 'pending': return theme.warning;
      case 'rejected': return theme.danger;
      default: return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  return (
    <SectionCard title="Nominations en Attente" theme={theme} right={<Users size={18} color={theme.textSecondary} />}>
      <div style={{ display: "grid", gap: "12px" }}>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</div>
        ) : nominations.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Aucune nomination en attente</div>
        ) : (
          nominations.map((nom) => (
            <div
              key={nom.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: theme.bgSecondary, borderRadius: 10, border: `1px solid ${theme.border}`, cursor: 'pointer' }}
              onClick={() => onOpenNomination(nom.id)}
              className="hover:shadow-md transition-all"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.bgTertiary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: theme.text }}>
                  {nom.candidate_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{nom.poste}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{nom.candidate_name}</div>
                </div>
              </div>
              <span style={{ background: `${getStatusColor(nom.status)}20`, color: getStatusColor(nom.status), padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                {getStatusLabel(nom.status)}
              </span>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

export function BudgetNationalSection({ theme }: { theme: ThemeConfig }) {
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    budget: 0,
    depenses: 0,
    solde: 0,
    execution: 0
  });

  useEffect(() => {
    const fetchBudgetData = async () => {
      const { data, error } = await supabase
        .from('budget_national')
        .select('*')
        .order('total_budget', { ascending: false });

      if (data) {
        setBudgetData(data);

        // Calculate totals
        const totalBudget = data.reduce((acc, curr) => acc + Number(curr.total_budget), 0);
        const totalDepenses = data.reduce((acc, curr) => acc + Number(curr.executed_amount), 0);

        setTotals({
          budget: totalBudget,
          depenses: totalDepenses,
          solde: totalBudget - totalDepenses,
          execution: totalBudget > 0 ? Math.round((totalDepenses / totalBudget) * 100) : 0
        });
      }
      setLoading(false);
    };

    fetchBudgetData();

    // Subscribe to changes
    const channel = supabase
      .channel('budget_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_national' }, () => {
        fetchBudgetData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000000) {
      return `${(amount / 1000000000000).toFixed(1)}T FCFA`;
    } else if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B FCFA`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M FCFA`;
    }
    return `${amount.toLocaleString()} FCFA`;
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Budget National" theme={theme} right={<DollarSign size={18} color={theme.textSecondary} />}>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <StatCard title="Montant Alloué" value={formatCurrency(totals.budget)} icon={DollarSign} color={theme.success} theme={theme} />
            <StatCard title="Dépenses Engagées" value={formatCurrency(totals.depenses)} icon={Briefcase} color={theme.primaryBlue} theme={theme} />
            <StatCard title="Exécution" value={`${totals.execution}%`} icon={TrendingUpIcon} color={theme.primary} theme={theme} />
            <StatCard title="Solde" value={formatCurrency(totals.solde)} icon={Scale} color={theme.primaryGold} theme={theme} />
          </div>
        )}
      </SectionCard>
      <SectionCard title="Répartition par Ministère" theme={theme}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</div>
          ) : budgetData.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Aucune donnée budgétaire</div>
          ) : (
            budgetData.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 10 }}>
                <div>
                  <div style={{ color: theme.text, fontWeight: 500 }}>{item.ministry}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>
                    {Math.round((item.executed_amount / item.total_budget) * 100)}% exécuté
                  </div>
                </div>
                <span style={{ color: theme.text, fontWeight: 600 }}>{formatCurrency(item.total_budget)}</span>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export function IndicateursEconomiquesSection({ theme }: { theme: ThemeConfig }) {
  const data = {
    croissance: 3.2,
    inflation: 4.8,
    emploi: 80.2,
    balance: "+120B FCFA",
  };
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Indicateurs Économiques" theme={theme} right={<BarChart3 size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
            <CircularProgress percentage={data.croissance} label="Croissance PIB" color={theme.success} theme={theme} />
          </div>
          <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
            <CircularProgress percentage={data.emploi} label="Taux d'Emploi" color={theme.primaryBlue} theme={theme} />
          </div>
          <StatCard title="Inflation" value={`${data.inflation}%`} icon={Activity} color={theme.warning} theme={theme} />
          <StatCard title="Balance Commerciale" value={data.balance} icon={Globe} color={theme.info} theme={theme} />
        </div>
      </SectionCard>
    </div>
  );
}

export function InvestissementsSection({ theme }: { theme: ThemeConfig }) {
  const projets = [
    { nom: "Port en eau profonde", secteur: "Infrastructures", montant: "380B FCFA", statut: "En cours", couleur: theme.primary },
    { nom: "Parc solaire Estuaire", secteur: "Énergie", montant: "210B FCFA", statut: "Lancé", couleur: theme.success },
    { nom: "Fibre nationale", secteur: "Télécom", montant: "145B FCFA", statut: "Étude", couleur: theme.warning },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Investissements Stratégiques" theme={theme} right={<Briefcase size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 12 }}>
          {projets.map((p, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, padding: "12px 14px", background: "#FFFFFF", border: `1px solid ${theme.border}`, borderRadius: 12 }}>
              <div>
                <div style={{ color: theme.text, fontWeight: 600 }}>{p.nom}</div>
                <div style={{ color: theme.textSecondary, fontSize: 13 }}>{p.secteur}</div>
              </div>
              <div style={{ color: theme.text }}>{p.montant}</div>
              <div>
                <span style={{ background: `${p.couleur}20`, color: p.couleur, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {p.statut}
                </span>
              </div>
              <div style={{ textAlign: "right", color: theme.textSecondary, fontSize: 13 }}>Maj: {new Date().toLocaleDateString("fr-FR")}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function EducationSection({ theme }: { theme: ThemeConfig }) {
  const kpis = [
    { title: "Taux de scolarisation", value: "92%", icon: GraduationCap, color: theme.primary },
    { title: "Classes construites (YTD)", value: "1 240", icon: Building2, color: theme.primaryBlue },
    { title: "Échecs examens (∆)", value: "-3.2 pts", icon: Activity, color: theme.success },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Éducation — Indicateurs Clés" theme={theme}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {kpis.map((k, idx) => (
            <StatCard key={idx} title={k.title} value={k.value} icon={k.icon} color={k.color} theme={theme} />
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Projets Prioritaires" theme={theme}>
        <div style={{ display: "grid", gap: 12 }}>
          {["Réhabilitation des lycées provinciaux", "Programme cantines scolaires", "Numérisation des bibliothèques"].map((p, i) => (
            <div key={i} style={{ padding: "12px 14px", background: "#F7F8FA", borderRadius: 10, border: `1px solid ${theme.border}` }}>
              <span style={{ color: theme.text }}>{p}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function SantePubliqueSection({ theme }: { theme: ThemeConfig }) {
  const kpis = [
    { title: "Couverture vaccinale", value: "88%", icon: Activity, color: theme.success },
    { title: "Centres de santé opérationnels", value: "312", icon: Building2, color: theme.primaryBlue },
    { title: "Taux de mortalité infantile", value: "24‰", icon: Heart, color: theme.warning },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Santé Publique — Indicateurs" theme={theme}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {kpis.map((k, idx) => (
            <StatCard key={idx} title={k.title} value={k.value} icon={k.icon} color={k.color} theme={theme} />
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Campagnes en cours" theme={theme}>
        <ul style={{ display: "grid", gap: 12 }}>
          {["Prévention paludisme", "Dépistage cancers féminins", "Vaccination grippe saisonnière"].map((c, i) => (
            <li key={i} style={{ padding: "12px 14px", background: "#FFFFFF", borderRadius: 10, border: `1px solid ${theme.border}` }}>{c}</li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

export function EmploiFormationSection({ theme }: { theme: ThemeConfig }) {
  const kpis = [
    { title: "Taux d'emploi", value: "80.2%", icon: Briefcase, color: theme.primary },
    { title: "Formations actives", value: "146", icon: GraduationCap, color: theme.primaryBlue },
    { title: "Insertion 6 mois", value: "62%", icon: TrendingUpIcon, color: theme.success },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Emploi & Formation — Indicateurs" theme={theme}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {kpis.map((k, idx) => (
            <StatCard key={idx} title={k.title} value={k.value} icon={k.icon} color={k.color} theme={theme} />
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Programmes" theme={theme}>
        <div style={{ display: "grid", gap: 12 }}>
          {["Apprentissage numérique", "Certification BTP", "Reconversion mines/industrie"].map((p, i) => (
            <div key={i} style={{ padding: "12px 14px", background: "#F7F8FA", borderRadius: 10, border: `1px solid ${theme.border}` }}>{p}</div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function RelationsInternationalesSection({ theme }: { theme: ThemeConfig }) {
  const visites = [
    { pays: "France", type: "Visite officielle", date: "20/11/2025" },
    { pays: "Congo", type: "Sommet CEMAC", date: "05/12/2025" },
    { pays: "Chine", type: "Mission économique", date: "18/12/2025" },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Relations Internationales" theme={theme} right={<Globe size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 12 }}>
          {visites.map((v, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 12, padding: "12px 14px", background: "#FFFFFF", border: `1px solid ${theme.border}`, borderRadius: 12 }}>
              <span style={{ color: theme.text, fontWeight: 600 }}>{v.pays}</span>
              <span style={{ color: theme.textSecondary }}>{v.type}</span>
              <span style={{ color: theme.textSecondary }}>{v.date}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function SecuriteDefenseSection({ theme }: { theme: ThemeConfig }) {
  const kpis = [
    { title: "Niveau d'alerte", value: "ROUGE", icon: Shield, color: theme.danger },
    { title: "Effectifs opérationnels", value: "95%", icon: Users, color: theme.primary },
    { title: "Incidents (24h)", value: "1", icon: AlertTriangle, color: theme.warning },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Sécurité & Défense — Indicateurs" theme={theme}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {kpis.map((k, idx) => (
            <StatCard key={idx} title={k.title} value={k.value} icon={k.icon} color={k.color} theme={theme} />
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Priorités Opérationnelles" theme={theme}>
        <ul style={{ display: "grid", gap: 12 }}>
          {["Surveillance frontières Nord-Est", "Patrouilles côtières Ogooué-Maritime", "Plan Vigipresidence"].map((t, i) => (
            <li key={i} style={{ padding: "12px 14px", background: "#F7F8FA", borderRadius: 10, border: `1px solid ${theme.border}` }}>{t}</li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

export function AgendaPresidentielSection({ theme }: { theme: ThemeConfig }) {
  const evenements = [
    { titre: "Conseil des Ministres", heure: "10:00", lieu: "Palais", type: "Réunion" },
    { titre: "Audience Ambassadeur", heure: "12:30", lieu: "Palais", type: "Diplomatie" },
    { titre: "Inauguration hôpital", heure: "15:00", lieu: "Libreville", type: "Santé" },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Agenda Présidentiel (Jour)" theme={theme} right={<Calendar size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 12 }}>
          {evenements.map((e, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, padding: "12px 14px", background: "#FFFFFF", border: `1px solid ${theme.border}`, borderRadius: 12 }}>
              <span style={{ color: theme.text, fontWeight: 600 }}>{e.titre}</span>
              <span style={{ color: theme.textSecondary }}>{e.heure}</span>
              <span style={{ color: theme.textSecondary }}>{e.lieu}</span>
              <span style={{ color: theme.textSecondary }}>{e.type}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function ChantiersSection({ theme, onOpenProject }: { theme: ThemeConfig, onOpenProject: (id: string) => void }) {
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChantiers = async () => {
      const { data } = await supabase
        .from('chantiers')
        .select('*')
        .order('progress', { ascending: false });
      if (data) setChantiers(data);
      setLoading(false);
    };
    fetchChantiers();
  }, []);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Suivi des Chantiers" theme={theme} right={<Hammer size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 16 }}>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</div>
          ) : chantiers.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Aucun chantier actif</div>
          ) : (
            chantiers.map((c) => (
              <div
                key={c.id}
                style={{ padding: "16px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, cursor: 'pointer' }}
                onClick={() => onOpenProject(c.id)}
                className="hover:shadow-md transition-all"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <div>
                    <h4 style={{ color: theme.text, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{c.name}</h4>
                    <p style={{ color: theme.textSecondary, fontSize: 13 }}>{c.location}</p>
                  </div>
                  <span style={{ background: `${c.status === "completed" ? theme.success : theme.primary}20`, color: c.status === "completed" ? theme.success : theme.primary, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    {c.status === "completed" ? "Terminé" : c.status === "in_progress" ? "En cours" : c.status}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div>
                    <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Avancement</p>
                    <div style={{ width: "100%", height: 8, background: theme.bgTertiary, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${c.progress}%`, height: "100%", background: theme.primary, transition: "width 0.3s ease" }} />
                    </div>
                    <p style={{ color: theme.text, fontSize: 14, fontWeight: 600, marginTop: 4 }}>{c.progress}%</p>
                  </div>
                  <div>
                    <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Budget</p>
                    <p style={{ color: theme.text, fontSize: 14, fontWeight: 600 }}>
                      {c.budget >= 1000000000 ? `${(c.budget / 1000000000).toFixed(1)}B` : `${(c.budget / 1000000).toFixed(1)}M`}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Début</p>
                    <p style={{ color: theme.text, fontSize: 14 }}>{new Date(c.start_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Fin prévue</p>
                    <p style={{ color: theme.text, fontSize: 14 }}>{new Date(c.end_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export function ProjetsPresidentielsSection({ theme, onOpenProject }: { theme: ThemeConfig, onOpenProject: (id: string) => void }) {
  const [projets, setProjets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjets = async () => {
      const { data } = await supabase
        .from('projets_presidentiels')
        .select('*')
        .order('priority', { ascending: true });
      if (data) setProjets(data);
      setLoading(false);
    };
    fetchProjets();
  }, []);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Projets Présidentiels" theme={theme} right={<Crown size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 16 }}>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</div>
          ) : projets.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Aucun projet présidentiel</div>
          ) : (
            projets.map((p) => (
              <div
                key={p.id}
                style={{ padding: "16px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, cursor: 'pointer' }}
                onClick={() => onOpenProject(p.id)}
                className="hover:shadow-md transition-all"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: theme.text, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{p.title}</h4>
                    <p style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 8 }}>{p.description}</p>
                    <p style={{ color: theme.textTertiary, fontSize: 12 }}>Responsable: {p.manager}</p>
                  </div>
                  <span style={{ background: `${p.priority === "critical" ? theme.danger : theme.warning}20`, color: p.priority === "critical" ? theme.danger : theme.warning, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, marginLeft: 12 }}>
                    {p.priority === "critical" ? "Critique" : "Haute"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                  <div>
                    <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Budget</p>
                    <p style={{ color: theme.text, fontSize: 14, fontWeight: 600 }}>
                      {p.budget >= 1000000000 ? `${(p.budget / 1000000000).toFixed(1)}B FCFA` : `${(p.budget / 1000000).toFixed(1)}M FCFA`}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Statut</p>
                    <span style={{ background: `${p.status === "in_progress" ? theme.primary : p.status === "completed" ? theme.success : theme.warning}20`, color: p.status === "in_progress" ? theme.primary : p.status === "completed" ? theme.success : theme.warning, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      {p.status === "in_progress" ? "En cours" : p.status === "completed" ? "Terminé" : "Planifié"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export function ProjetsEtatSection({ theme, onOpenProject }: { theme: ThemeConfig, onOpenProject: (id: string) => void }) {
  const [projets, setProjets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjets = async () => {
      const { data } = await supabase
        .from('projets_etat')
        .select('*')
        .order('end_date', { ascending: true });
      if (data) setProjets(data);
      setLoading(false);
    };
    fetchProjets();
  }, []);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Projets d'État" theme={theme} right={<Target size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 12 }}>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Chargement...</div>
          ) : projets.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>Aucun projet d'état</div>
          ) : (
            projets.map((p) => (
              <div
                key={p.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "14px 16px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, cursor: 'pointer' }}
                onClick={() => onOpenProject(p.id)}
                className="hover:shadow-md transition-all"
              >
                <div>
                  <div style={{ color: theme.text, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ color: theme.textSecondary, fontSize: 12 }}>{p.ministry}</div>
                </div>
                <div style={{ color: theme.text, fontSize: 14, fontWeight: 600 }}>
                  {p.budget >= 1000000000 ? `${(p.budget / 1000000000).toFixed(1)}B` : `${(p.budget / 1000000).toFixed(1)}M`}
                </div>
                <div>
                  <span style={{ background: `${p.status === "in_progress" ? theme.primary : p.status === "completed" ? theme.success : theme.info}20`, color: p.status === "in_progress" ? theme.primary : p.status === "completed" ? theme.success : theme.info, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    {p.status === "in_progress" ? "En cours" : p.status === "completed" ? "Terminé" : "Planifié"}
                  </span>
                </div>
                <div>
                  <div style={{ width: "100%", height: 6, background: theme.bgTertiary, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ width: `${p.progress}%`, height: "100%", background: theme.primary }} />
                  </div>
                  <div style={{ color: theme.textSecondary, fontSize: 11 }}>{p.progress}%</div>
                </div>
                <div style={{ textAlign: "right", color: theme.textSecondary, fontSize: 12 }}>{new Date(p.end_date).toLocaleDateString('fr-FR')}</div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}


