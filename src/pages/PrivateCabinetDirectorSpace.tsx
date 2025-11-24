import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock, LogOut, Shield, Mail, Calendar, Users, MapPin, MessageSquare,
  ChevronDown, ChevronRight, LayoutDashboard, UserCheck, Plane, Settings,
  Moon, Sun, Plus, Search, Filter, Clock, AlertCircle, CheckCircle2,
  FileText, Phone, Globe, Loader2
} from "lucide-react";
import emblemGabon from "@/assets/emblem_gabon.png";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { generateSystemPrompt } from "@/utils/generateSystemPrompt";
import { useUserContext } from "@/hooks/useUserContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  PrivateAudience,
  EncryptedMessage,
  PersonalCorrespondence,
  VIPContact,
  PrivateTrip,
  ConfidentialityLevel,
  AudienceStatus,
  MessagePriority,
  SecurityLevel,
  CorrespondencePriority,
  CorrespondenceStatus,
  ContactCategory,
  TripType,
  TripStatus
} from "@/types/private-cabinet-types";
import { PrivateAudienceCard } from "@/components/cabinet/PrivateAudienceCard";
import { EncryptedMessageItem } from "@/components/cabinet/EncryptedMessageItem";
import { privateCabinetService } from "@/services/privateCabinetService";
import { useAsyncOperation, useFormValidation } from "@/hooks/useAsyncOperation";
import { validationUtils, errorMessages } from "@/utils/validation";


const PrivateCabinetDirectorSpace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [iastedOpen, setIastedOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    private: true,
    contacts: false,
  });

  const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('echo');
  const userContext = useUserContext({ spaceName: 'PrivateCabinetDirectorSpace' });

  // State for data
  const [audiences, setAudiences] = useState<PrivateAudience[]>([]);
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [correspondence, setCorrespondence] = useState<PersonalCorrespondence[]>([]);
  const [vipContacts, setVipContacts] = useState<VIPContact[]>([]);
  const [trips, setTrips] = useState<PrivateTrip[]>([]);

  // Audiences state management
  const [audienceDialogOpen, setAudienceDialogOpen] = useState(false);
  const [newAudience, setNewAudience] = useState({
    person_name: "",
    person_title: "",
    subject: "",
    date: "",
    time: "",
    location: "",
    confidentiality_level: "confidentiel" as ConfidentialityLevel,
    notes: "",
    status: "scheduled" as AudienceStatus,
  });

  const audienceOperation = useAsyncOperation<PrivateAudience>();

  const validateAudienceForm = useMemo(() => (data: typeof newAudience) => {
    const errors: Record<string, string> = {};

    if (validationUtils.isEmpty(data.person_name)) {
      errors.person_name = errorMessages.required("Le nom de la personne");
    }

    if (validationUtils.isEmpty(data.subject)) {
      errors.subject = errorMessages.required("Le sujet");
    }

    if (!data.date) {
      errors.date = errorMessages.required("La date");
    } else if (!data.time) {
      errors.time = errorMessages.required("L'heure");
    } else {
      const selectedDateTime = new Date(`${data.date}T${data.time}`);
      if (selectedDateTime < new Date()) {
        errors.date = "La date et l'heure doivent être dans le futur";
      }
    }

    return errors;
  }, []);

  const { errors: audienceErrors, validate: validateAudience, clearErrors: clearAudienceErrors } =
    useFormValidation(validateAudienceForm);

  // Mock data initialization (fallback if DB is empty)
  useEffect(() => {
    const initMockData = () => {
      setAudiences([
        {
          id: "1",
          person_name: "Ali Bongo Ondimba",
          person_title: "Ancien Président",
          subject: "Consultation privée",
          date: "2025-12-01T14:00:00",
          location: "Résidence présidentielle",
          confidentiality_level: "tres_confidentiel",
          status: "scheduled",
          created_at: "2025-11-15T10:00:00Z"
        },
        {
          id: "2",
          person_name: "Emmanuel Macron",
          person_title: "Président de la République Française",
          subject: "Entretien bilatéral informel",
          date: "2025-12-05T16:30:00",
          location: "Salon privé",
          confidentiality_level: "secret",
          status: "scheduled",
          created_at: "2025-11-18T14:30:00Z"
        },
      ]);

      setMessages([
        {
          id: "1",
          sender_id: "demo-sender-1",
          sender_name: "Secrétariat Élysée",
          recipient_id: "demo-recipient",
          subject: "Coordination visite d'État",
          content: "Concernant les modalités de la prochaine visite, nous souhaiterions aborder les points suivants en toute confidentialité...",
          created_at: "2025-11-19T15:30:00Z",
          is_read: false,
          priority: "high",
          security_level: "maximum"
        },
        {
          id: "2",
          sender_id: "demo-sender-2",
          sender_name: "Cabinet Présidence UA",
          recipient_id: "demo-recipient",
          subject: "Invitation sommet africain",
          content: "Le Président de la Commission vous invite personnellement au prochain sommet...",
          created_at: "2025-11-18T09:00:00Z",
          is_read: true,
          priority: "normal",
          security_level: "enhanced"
        },
      ]);

      setCorrespondence([
        {
          id: "1",
          sender_name: "Chambre de Commerce France-Gabon",
          type: "invitation",
          subject: "Dîner de gala annuel",
          received_date: "2025-11-17T10:00:00Z",
          priority: "moyenne",
          status: "en_traitement",
          deadline: "2025-11-25",
          created_at: "2025-11-17T10:00:00Z"
        },
        {
          id: "2",
          sender_name: "Fondation Pierre Savorgnan de Brazza",
          type: "lettre",
          subject: "Parrainage événement culturel",
          received_date: "2025-11-16T14:20:00Z",
          priority: "haute",
          status: "recu",
          deadline: "2025-11-30",
          created_at: "2025-11-16T14:20:00Z"
        },
      ]);

      setVipContacts([
        {
          id: "1",
          name: "Emmanuel Macron",
          title: "Président de la République",
          organization: "République Française",
          country: "France",
          category: "chef_etat",
          email: "contact@elysee.fr",
          phone: "+33 1 42 92 81 00",
          is_favorite: true,
          created_at: "2025-01-01T00:00:00Z"
        },
        {
          id: "2",
          name: "Moussa Faki Mahamat",
          title: "Président de la Commission",
          organization: "Union Africaine",
          country: "Tchad",
          category: "diplomate",
          is_favorite: false,
          created_at: "2025-01-01T00:00:00Z"
        },
      ]);

      setTrips([
        {
          id: "1",
          destination: "Paris",
          start_date: "2025-12-10T00:00:00Z",
          end_date: "2025-12-12T00:00:00Z",
          type: "prive",
          purpose: "Visite médicale et rencontres informelles",
          status: "confirmed",
          participants: ["Épouse", "Médecin personnel"],
          created_at: "2025-11-01T00:00:00Z"
        },
      ]);
    };

    initMockData();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Écouter les événements de navigation et contrôle UI depuis SuperAdminContext
  useEffect(() => {
    const handleNavigationEvent = (e: CustomEvent) => {
      const { sectionId } = e.detail;
      console.log('📍 [PrivateCabinetDirectorSpace] Événement navigation reçu:', sectionId);

      const accordionSections = ['navigation', 'private', 'contacts'];
      const sectionMap: Record<string, string> = {
        'dashboard': 'dashboard',
        'tableau-de-bord': 'dashboard',
        'audiences': 'audiences',
        'messages': 'messages',
        'messagerie': 'messages',
        'correspondence': 'correspondence',
        'courriers': 'correspondence',
        'contacts': 'contacts_list',
        'vip': 'contacts_list',
        'trips': 'trips',
        'voyages': 'trips',
        'déplacements': 'trips'
      };

      const targetSection = sectionMap[sectionId] || sectionId;

      if (accordionSections.includes(targetSection)) {
        toggleSection(targetSection);
      } else {
        setActiveSection(targetSection);
        const parentSectionMap: Record<string, string> = {
          'dashboard': 'navigation',
          'audiences': 'private',
          'messages': 'private',
          'correspondence': 'private',
          'contacts_list': 'contacts',
          'trips': 'private'
        };
        const parent = parentSectionMap[targetSection];
        if (parent) {
          setExpandedSections(prev => ({ ...prev, [parent]: true }));
        }
      }
    };

    const handleUIControlEvent = (e: CustomEvent) => {
      const { action } = e.detail;
      console.log('🎨 [PrivateCabinetDirectorSpace] Événement UI Control reçu:', action);
      
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
  }, [theme, setTheme, toast]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "cabinet_private");

        if (!roles || roles.length === 0) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions nécessaires",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        // Here we would fetch real data from Supabase
        // fetchRealData();

      } catch (error) {
        console.error("Error checking access:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Tool call handler for iAsted
  const handleToolCall = useCallback((toolName: string, args: any) => {
    console.log(`🔧 [PrivateCabinetDirectorSpace] Tool call: ${toolName}`, args);
    switch (toolName) {
      case 'control_ui':
        if (args.action === 'toggle_theme') toggleTheme();
        else if (args.action === 'set_theme_dark') setTheme("dark");
        else if (args.action === 'set_theme_light') setTheme("light");
        else if (args.action === 'set_volume') toast({ title: "Volume", description: `Volume ajusté` });
        else if (args.action === 'set_speech_rate') {
          if (args.value && openaiRTC) openaiRTC.setSpeechRate(parseFloat(args.value));
          toast({ title: "Vitesse", description: `Vitesse ajustée` });
        }
        break;

      case 'change_voice':
        if (args.voice_id) {
          setSelectedVoice(args.voice_id as any);
          toast({ title: "Voix modifiée", description: `Voix changée pour ${args.voice_id}` });
        }
        break;

      case 'navigate_to_section':
        const sectionId = args.section_id;
        const accordionSections = ['navigation', 'private', 'contacts'];

        const sectionMap: Record<string, string> = {
          'dashboard': 'dashboard',
          'tableau-de-bord': 'dashboard',
          'audiences': 'audiences',
          'audiences-privees': 'audiences',
          'audiences-privées': 'audiences',
          'rencontres': 'audiences',
          'messages': 'messages',
          'messagerie': 'messages',
          'correspondance': 'correspondence',
          'correspondances': 'correspondence',
          'courrier': 'correspondence',
          'courriers': 'correspondence',
          'contacts': 'vip_contacts',
          'vip': 'vip_contacts',
          'carnet': 'vip_contacts',
          'trips': 'trips',
          'voyages': 'trips',
          'deplacements': 'trips',
          'déplacements': 'trips'
        };

        const targetSection = sectionMap[sectionId] || sectionId;

        if (accordionSections.includes(targetSection)) {
          toggleSection(targetSection);
          toast({ title: "Navigation", description: `Section ${targetSection} basculée` });
          return { success: true, message: `Section ${targetSection} basculée` };
        } else {
          setActiveSection(targetSection);

          const parentSectionMap: Record<string, string> = {
            'dashboard': 'navigation',
            'audiences': 'private',
            'messages': 'private',
            'correspondence': 'private',
            'trips': 'private',
            'vip_contacts': 'contacts'
          };

          const parent = parentSectionMap[targetSection];
          if (parent) {
            setExpandedSections(prev => ({ ...prev, [parent]: true }));
          }
          toast({ title: "Navigation", description: `Ouverture de ${targetSection}` });
          return { success: true, message: `Section ${targetSection} ouverte` };
        }

      case 'open_chat':
        setIastedOpen(true);
        break;

      case 'close_chat':
        setIastedOpen(false);
        break;

      case 'stop_conversation':
        setIastedOpen(false);
        break;

      default:
        console.log('[PrivateCabinetDirectorSpace] Tool call not handled:', toolName);
    }
  }, [toast, theme, setTheme]);

  const openaiRTC = useRealtimeVoiceWebRTC(handleToolCall);

  // Audiences handlers
  const handleCreateAudience = async () => {
    if (!validateAudience(newAudience)) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs avant de continuer",
        variant: "destructive",
      });
      return;
    }

    const result = await audienceOperation.execute(async () => {
      const audienceData: Omit<PrivateAudience, "id" | "created_at"> = {
        person_name: newAudience.person_name,
        person_title: newAudience.person_title || undefined,
        subject: newAudience.subject,
        date: `${newAudience.date}T${newAudience.time}`,
        location: newAudience.location || undefined,
        confidentiality_level: newAudience.confidentiality_level,
        status: newAudience.status,
        notes: newAudience.notes || undefined,
      } as any;

      return await privateCabinetService.createAudience(audienceData);
    });

    if (result) {
      // Optimistic UI update
      setAudiences(prev => [...prev, result]);

      toast({
        title: "Succès",
        description: "Audience créée avec succès",
      });

      // Reset form and close dialog
      setNewAudience({
        person_name: "",
        person_title: "",
        subject: "",
        date: "",
        time: "",
        location: "",
        confidentiality_level: "confidentiel",
        notes: "",
        status: "scheduled",
      });
      clearAudienceErrors();
      setAudienceDialogOpen(false);
    } else if (audienceOperation.state.error) {
      toast({
        title: "Erreur",
        description: audienceOperation.state.error.message || "Impossible de créer l'audience",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAudienceField = (field: keyof typeof newAudience, value: any) => {
    setNewAudience(prev => ({ ...prev, [field]: value }));
  };

  // Messages state management
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient_id: "",
    subject: "",
    content: "",
    priority: "normal" as MessagePriority,
    security_level: "enhanced" as SecurityLevel,
    sender_name: "",
    sender_role: "",
  });

  const messageOperation = useAsyncOperation<EncryptedMessage>();

  const validateMessageForm = useMemo(() => (data: typeof newMessage) => {
    const errors: Record<string, string> = {};

    if (validationUtils.isEmpty(data.recipient_id)) {
      errors.recipient_id = errorMessages.required("Le destinataire");
    }

    if (validationUtils.isEmpty(data.subject)) {
      errors.subject = errorMessages.required("Le sujet");
    }

    if (validationUtils.isEmpty(data.content)) {
      errors.content = errorMessages.required("Le message");
    } else if (!validationUtils.meetsMinLength(data.content, 10)) {
      errors.content = errorMessages.minLength("Le message", 10);
    }

    return errors;
  }, []);

  const { errors: messageErrors, validate: validateMessage, clearErrors: clearMessageErrors } =
    useFormValidation(validateMessageForm);

  // Messages handlers
  const handleSendMessage = async () => {
    if (!validateMessage(newMessage)) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs avant de continuer",
        variant: "destructive",
      });
      return;
    }

    const result = await messageOperation.execute(async () => {
      const messageData: Omit<EncryptedMessage, "id" | "created_at"> = {
        recipient_id: newMessage.recipient_id,
        sender_name: newMessage.sender_name,
        sender_role: newMessage.sender_role || undefined,
        subject: newMessage.subject,
        content: newMessage.content,
        is_read: false,
        priority: newMessage.priority,
        security_level: newMessage.security_level,
      } as any;

      return await privateCabinetService.createMessage(messageData);
    });

    if (result) {
      setMessages(prev => [result, ...prev]);

      toast({
        title: "Succès",
        description: "Message envoyé avec succès",
      });

      setNewMessage({
        recipient_id: "",
        subject: "",
        content: "",
        priority: "normal",
        security_level: "enhanced",
        sender_name: "",
        sender_role: "",
      });
      clearMessageErrors();
      setMessageDialogOpen(false);
    } else if (messageOperation.state.error) {
      toast({
        title: "Erreur",
        description: messageOperation.state.error.message || "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMessageField = (field: keyof typeof newMessage, value: any) => {
    setNewMessage(prev => ({ ...prev, [field]: value }));
  };

  const handleMarkMessageAsRead = async (messageId: string) => {
    try {
      await privateCabinetService.markMessageAsRead(messageId);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // Correspondance handlers
  const handleUpdateCorrespondenceStatus = async (id: string, status: CorrespondenceStatus) => {
    try {
      await privateCabinetService.updateCorrespondenceStatus(id, status);
      setCorrespondence(prev => prev.map(item =>
        item.id === id ? { ...item, status } : item
      ));
      toast({
        title: "Succès",
        description: "Statut mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleArchiveCorrespondence = async (id: string) => {
    try {
      await privateCabinetService.archiveCorrespondence(id);
      setCorrespondence(prev => prev.map(item =>
        item.id === id ? { ...item, status: "archive" as CorrespondenceStatus } : item
      ));
      toast({
        title: "Succès",
        description: "Correspondance archivée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver",
        variant: "destructive",
      });
    }
  };

  // VIP Contacts state management
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    title: "",
    organization: "",
    country: "",
    category: "diplomate" as ContactCategory,
    email: "",
    phone: "",
    is_favorite: false,
    notes: "",
  });

  const contactOperation = useAsyncOperation<VIPContact>();

  const validateContactForm = useMemo(() => (data: typeof newContact) => {
    const errors: Record<string, string> = {};

    if (validationUtils.isEmpty(data.name)) {
      errors.name = errorMessages.required("Le nom");
    }

    if (data.email && !validationUtils.isValidEmail(data.email)) {
      errors.email = errorMessages.invalidEmail;
    }

    if (data.phone && !validationUtils.isValidPhone(data.phone)) {
      errors.phone = errorMessages.invalidPhone;
    }

    return errors;
  }, []);

  const { errors: contactErrors, validate: validateContact, clearErrors: clearContactErrors } =
    useFormValidation(validateContactForm);

  const handleCreateContact = async () => {
    if (!validateContact(newContact)) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs",
        variant: "destructive",
      });
      return;
    }

    const result = await contactOperation.execute(async () => {
      const contactData: Omit<VIPContact, "id" | "created_at"> = {
        name: newContact.name,
        title: newContact.title || undefined,
        organization: newContact.organization || undefined,
        country: newContact.country || undefined,
        category: newContact.category,
        email: newContact.email || undefined,
        phone: newContact.phone || undefined,
        is_favorite: newContact.is_favorite,
        notes: newContact.notes || undefined,
      } as any;

      return await privateCabinetService.createVIPContact(contactData);
    });

    if (result) {
      setVipContacts(prev => [...prev, result]);
      toast({
        title: "Succès",
        description: "Contact créé avec succès",
      });

      setNewContact({
        name: "",
        title: "",
        organization: "",
        country: "",
        category: "diplomate",
        email: "",
        phone: "",
        is_favorite: false,
        notes: "",
      });
      clearContactErrors();
      setContactDialogOpen(false);
    } else if (contactOperation.state.error) {
      toast({
        title: "Erreur",
        description: contactOperation.state.error.message || "Impossible de créer le contact",
        variant: "destructive",
      });
    }
  };

  const handleUpdateContactField = (field: keyof typeof newContact, value: any) => {
    setNewContact(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleFavorite = async (contactId: string) => {
    try {
      const contact = vipContacts.find(c => c.id === contactId);
      if (!contact) return;

      await privateCabinetService.toggleContactFavorite(contactId, !contact.is_favorite);
      setVipContacts(prev => prev.map(c =>
        c.id === contactId ? { ...c, is_favorite: !c.is_favorite } : c
      ));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Trips state management
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    destination: "",
    start_date: "",
    end_date: "",
    type: "prive" as TripType,
    purpose: "",
    status: "planned" as TripStatus,
    participants: [] as string[],
    notes: "",
  });

  const tripOperation = useAsyncOperation<PrivateTrip>();

  const validateTripForm = useMemo(() => (data: typeof newTrip) => {
    const errors: Record<string, string> = {};

    if (validationUtils.isEmpty(data.destination)) {
      errors.destination = errorMessages.required("La destination");
    }

    if (validationUtils.isEmpty(data.start_date)) {
      errors.start_date = errorMessages.required("La date de début");
    }

    if (validationUtils.isEmpty(data.end_date)) {
      errors.end_date = errorMessages.required("La date de fin");
    } else if (!validationUtils.isValidDateRange(data.start_date, data.end_date)) {
      errors.end_date = "La date de fin doit être après la date de début";
    }

    if (validationUtils.isEmpty(data.purpose)) {
      errors.purpose = errorMessages.required("L'objet");
    }

    return errors;
  }, []);

  const { errors: tripErrors, validate: validateTrip, clearErrors: clearTripErrors } =
    useFormValidation(validateTripForm);

  const handleCreateTrip = async () => {
    if (!validateTrip(newTrip)) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs",
        variant: "destructive",
      });
      return;
    }

    const result = await tripOperation.execute(async () => {
      const tripData: Omit<PrivateTrip, "id" | "created_at"> = {
        destination: newTrip.destination,
        start_date: `${newTrip.start_date}T00:00:00Z`,
        end_date: `${newTrip.end_date}T23:59:59Z`,
        type: newTrip.type,
        purpose: newTrip.purpose,
        status: newTrip.status,
        participants: newTrip.participants.length > 0 ? newTrip.participants : undefined,
        notes: newTrip.notes || undefined,
      } as any;

      return await privateCabinetService.createTrip(tripData);
    });

    if (result) {
      setTrips(prev => [...prev, result]);
      toast({
        title: "Succès",
        description: "Déplacement créé avec succès",
      });

      setNewTrip({
        destination: "",
        start_date: "",
        end_date: "",
        type: "prive",
        purpose: "",
        status: "planned",
        participants: [],
        notes: "",
      });
      clearTripErrors();
      setTripDialogOpen(false);
    } else if (tripOperation.state.error) {
      toast({
        title: "Erreur",
        description: tripOperation.state.error.message || "Impossible de créer le déplacement",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTripField = (field: keyof typeof newTrip, value: any) => {
    setNewTrip(prev => ({ ...prev, [field]: value }));
  };





  const getPriorityBadge = (priority: CorrespondencePriority) => {
    const variants = {
      basse: { label: "Basse", variant: "outline" as const, className: "text-gray-500" },
      moyenne: { label: "Moyenne", variant: "secondary" as const, className: "text-blue-600 bg-blue-100" },
      haute: { label: "Haute", variant: "destructive" as const, className: "bg-red-100 text-red-700 hover:bg-red-200" }
    };
    const config = variants[priority];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: CorrespondenceStatus) => {
    const variants = {
      recu: { label: "Reçu", variant: "outline" as const, className: "" },
      en_traitement: { label: "En traitement", variant: "default" as const, className: "bg-blue-500" },
      traite: { label: "Traité", variant: "secondary" as const, className: "bg-green-100 text-green-700" },
      archive: { label: "Archivé", variant: "outline" as const, className: "text-gray-400" }
    };
    const config = variants[status];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const stats = {
    audiencesThisMonth: audiences.length,
    unreadMessages: messages.filter(m => !m.is_read).length,
    pendingCorrespondence: correspondence.filter(c => c.status === "recu" || c.status === "en_traitement").length,
    upcomingTrips: trips.filter(t => t.status === "confirmed").length
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 transition-colors duration-300">
      <div className="flex gap-6 max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside className="neu-card w-64 flex-shrink-0 p-6 flex flex-col min-h-[calc(100vh-3rem)] overflow-hidden sticky top-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center p-2">
              <img
                src={emblemGabon}
                alt="Emblème de la République Gabonaise"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-sm">CABINET PRIVÉ</div>
              <div className="text-xs text-muted-foreground">Présidence</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('navigation')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              NAVIGATION
              {expandedSections.navigation ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
        {expandedSections.navigation && (
          <nav className="space-y-1 ml-2 animate-fade-in">
                <button
                  onClick={() => setActiveSection("dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "dashboard"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de Bord
                </button>
              </nav>
            )}
          </div>

          {/* Affaires Privées */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('private')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              AFFAIRES PRIVÉES
              {expandedSections.private ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
        {expandedSections.private && (
          <nav className="space-y-1 ml-2 animate-fade-in">
                <button
                  onClick={() => setActiveSection("audiences")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "audiences"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <UserCheck className="w-4 h-4" />
                  Audiences Privées
                </button>
                <button
                  onClick={() => setActiveSection("messages")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "messages"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <MessageSquare className="w-4 h-4" />
                  Messagerie Cryptée
                </button>
                <button
                  onClick={() => setActiveSection("correspondence")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "correspondence"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Mail className="w-4 h-4" />
                  Correspondance
                </button>
                <button
                  onClick={() => setActiveSection("trips")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "trips"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Plane className="w-4 h-4" />
                  Déplacements Privés
                </button>
              </nav>
            )}
          </div>

          {/* Contacts */}
          <div className="mb-4 flex-1">
            <button
              onClick={() => toggleSection('contacts')}
              className="neu-raised flex items-center justify-between w-full text-xs font-semibold text-primary mb-3 tracking-wider px-3 py-2 rounded-lg transition-all hover:shadow-neo-md"
            >
              CONTACTS VIP
              {expandedSections.contacts ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
        {expandedSections.contacts && (
          <nav className="space-y-1 ml-2 animate-fade-in">
                <button
                  onClick={() => setActiveSection("vip-contacts")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === "vip-contacts"
                    ? "neu-inset text-primary font-semibold"
                    : "neu-raised hover:shadow-neo-md"
                    } `}
                >
                  <Users className="w-4 h-4" />
                  Carnet d'Adresses
                </button>
              </nav>
            )}
          </div>

          {/* Settings */}
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
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive neu-raised hover:shadow-neo-md transition-all"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="neu-card p-8 min-h-[calc(100vh-3rem)]">
            {/* Header */}
            <div className="flex items-start gap-4 mb-10">
              <div className="neu-raised w-20 h-20 rounded-full flex items-center justify-center p-3 shrink-0">
                <img
                  src={emblemGabon}
                  alt="Emblème"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Espace Cabinet Privé
                </h1>
                <p className="text-base text-muted-foreground">
                  Gestion des Affaires Privées et Confidentielles - Présidence de la République
                </p>
              </div>
            </div>

            {/* Dashboard */}
            {activeSection === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* KPIs */}
                <div className="neu-card p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
                    <div className="px-6 first:pl-0">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <UserCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.audiencesThisMonth}</div>
                      <div className="text-sm font-medium">Audiences ce Mois</div>
                      <div className="text-xs text-muted-foreground">Programmées</div>
                    </div>
                    <div className="px-6">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.unreadMessages}</div>
                      <div className="text-sm font-medium">Messages Non Lus</div>
                      <div className="text-xs text-muted-foreground">Cryptés E2E</div>
                    </div>
                    <div className="px-6">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <Mail className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.pendingCorrespondence}</div>
                      <div className="text-sm font-medium">Correspondances</div>
                      <div className="text-xs text-muted-foreground">En attente</div>
                    </div>
                    <div className="px-6 last:pr-0">
                      <div className="neu-raised w-12 h-12 flex items-center justify-center mb-4 rounded-xl">
                        <Plane className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="text-4xl font-bold mb-2">{stats.upcomingTrips}</div>
                      <div className="text-sm font-medium">Déplacements Prévus</div>
                      <div className="text-xs text-muted-foreground">Confirmés</div>
                    </div>
                  </div>
                </div>

                {/* Quick Sections */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Upcoming Audiences */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary" />
                        Prochaines Audiences
                      </h3>
                      <Button onClick={() => setActiveSection("audiences")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {audiences.slice(0, 3).map(audience => (
                        <PrivateAudienceCard key={audience.id} audience={audience} />
                      ))}
                      {audiences.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Aucune audience programmée
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unread Messages */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        Messages Cryptés
                      </h3>
                      <Button onClick={() => setActiveSection("messages")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {messages.slice(0, 3).map(message => (
                        <EncryptedMessageItem key={message.id} message={message} />
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Aucun message
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Correspondence */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Mail className="w-5 h-5 text-orange-500" />
                        Correspondances
                      </h3>
                      <Button onClick={() => setActiveSection("correspondence")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {correspondence.slice(0, 3).map(item => (
                        <div key={item.id} className="neu-inset p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.subject}</p>
                              <p className="text-xs text-muted-foreground">{item.sender_name}</p>
                            </div>
                            {getPriorityBadge(item.priority)}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {item.deadline ? new Date(item.deadline).toLocaleDateString('fr-FR') : 'Aucune échéance'}
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Trips */}
                  <div className="neu-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Plane className="w-5 h-5 text-green-500" />
                        Déplacements
                      </h3>
                      <Button onClick={() => setActiveSection("trips")} variant="ghost" size="sm" className="text-xs">
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {trips.map(trip => (
                        <div key={trip.id} className="neu-raised p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <p className="font-medium">{trip.destination}</p>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{trip.purpose}</p>
                            </div>
                            <Badge variant="outline" className="capitalize">{trip.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(trip.start_date).toLocaleDateString('fr-FR')} - {new Date(trip.end_date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audiences Section */}
            {activeSection === "audiences" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Audiences Privées</h2>
                    <p className="text-muted-foreground">Gestion des rendez-vous confidentiels</p>
                  </div>
                  <Dialog open={audienceDialogOpen} onOpenChange={setAudienceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle audience
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Programmer une audience privée</DialogTitle>
                      </DialogHeader>
                      <div className="space-y4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="person_name">Personne *</Label>
                          <Input
                            id="person_name"
                            placeholder="Nom de la personne"
                            value={newAudience.person_name}
                            onChange={(e) => handleUpdateAudienceField("person_name", e.target.value)}
                          />
                          {audienceErrors.person_name && (
                            <p className="text-sm text-red-500">{audienceErrors.person_name}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="person_title">Fonction</Label>
                          <Input
                            id="person_title"
                            placeholder="Titre/Fonction"
                            value={newAudience.person_title}
                            onChange={(e) => handleUpdateAudienceField("person_title", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Sujet *</Label>
                          <Input
                            id="subject"
                            placeholder="Sujet de l'audience"
                            value={newAudience.subject}
                            onChange={(e) => handleUpdateAudienceField("subject", e.target.value)}
                          />
                          {audienceErrors.subject && (
                            <p className="text-sm text-red-500">{audienceErrors.subject}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                              id="date"
                              type="date"
                              value={newAudience.date}
                              onChange={(e) => handleUpdateAudienceField("date", e.target.value)}
                            />
                            {audienceErrors.date && (
                              <p className="text-sm text-red-500">{audienceErrors.date}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="time">Heure *</Label>
                            <Input
                              id="time"
                              type="time"
                              value={newAudience.time}
                              onChange={(e) => handleUpdateAudienceField("time", e.target.value)}
                            />
                            {audienceErrors.time && (
                              <p className="text-sm text-red-500">{audienceErrors.time}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Lieu</Label>
                          <Input
                            id="location"
                            placeholder="Lieu de l'audience"
                            value={newAudience.location}
                            onChange={(e) => handleUpdateAudienceField("location", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confidentiality">Niveau de confidentialité *</Label>
                          <Select
                            value={newAudience.confidentiality_level}
                            onValueChange={(value) => handleUpdateAudienceField("confidentiality_level", value as ConfidentialityLevel)}
                          >
                            <SelectTrigger id="confidentiality">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confidentiel">Confidentiel</SelectItem>
                              <SelectItem value="tres_confidentiel">Très Confidentiel</SelectItem>
                              <SelectItem value="secret">Secret</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Notes additionnelles..."
                            value={newAudience.notes}
                            onChange={(e) => handleUpdateAudienceField("notes", e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleCreateAudience}
                          disabled={audienceOperation.state.loading}
                        >
                          {audienceOperation.state.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {audienceOperation.state.loading ? "Enregistrement..." : "Programmer l'audience"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {audiences.map(audience => (
                    <PrivateAudienceCard key={audience.id} audience={audience} />
                  ))}
                </div>
              </div>
            )}

            {/* Messages Section */}
            {activeSection === "messages" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Messagerie Cryptée</h2>
                    <p className="text-muted-foreground">Communications sécurisées end-to-end</p>
                  </div>
                  <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau message
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Nouveau message crypté</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="recipient_id">Destinataire *</Label>
                          <Select
                            value={newMessage.recipient_id}
                            onValueChange={(value) => handleUpdateMessageField("recipient_id", value)}
                          >
                            <SelectTrigger id="recipient_id">
                              <SelectValue placeholder="Sélectionner un contact" />
                            </SelectTrigger>
                            <SelectContent>
                              {vipContacts.map(contact => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.name} - {contact.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {messageErrors.recipient_id && (
                            <p className="text-sm text-red-500">{messageErrors.recipient_id}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="msg_subject">Sujet *</Label>
                          <Input
                            id="msg_subject"
                            placeholder="Sujet du message"
                            value={newMessage.subject}
                            onChange={(e) => handleUpdateMessageField("subject", e.target.value)}
                          />
                          {messageErrors.subject && (
                            <p className="text-sm text-red-500">{messageErrors.subject}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="msg_content">Message *</Label>
                          <Textarea
                            id="msg_content"
                            placeholder="Votre message..."
                            rows={5}
                            value={newMessage.content}
                            onChange={(e) => handleUpdateMessageField("content", e.target.value)}
                          />
                          {messageErrors.content && (
                            <p className="text-sm text-red-500">{messageErrors.content}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Minimum 10 caractères
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Select
                              value={newMessage.priority}
                              onValueChange={(value) => handleUpdateMessageField("priority", value as MessagePriority)}
                            >
                              <SelectTrigger id="priority">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normale</SelectItem>
                                <SelectItem value="high">Haute</SelectItem>
                                <SelectItem value="critical">Critique</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="security_level">Sécurité</Label>
                            <Select
                              value={newMessage.security_level}
                              onValueChange={(value) => handleUpdateMessageField("security_level", value as SecurityLevel)}
                            >
                              <SelectTrigger id="security_level">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="enhanced">Renforcée</SelectItem>
                                <SelectItem value="maximum">Maximum</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleSendMessage}
                          disabled={messageOperation.state.loading}
                        >
                          {messageOperation.state.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {!messageOperation.state.loading && <Shield className="h-4 w-4 mr-2" />}
                          {messageOperation.state.loading ? "Envoi..." : "Envoyer (Crypté)"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="neu-card p-6">
                  {messages.map(message => (
                    <EncryptedMessageItem key={message.id} message={message} />
                  ))}
                </div>
              </div>
            )}

            {/* Correspondence Section */}
            {activeSection === "correspondence" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Correspondance Personnelle</h2>
                    <p className="text-muted-foreground">Gestion du courrier privé</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {correspondence.map(item => (
                    <div key={item.id} className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="neu-raised w-10 h-10 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{item.subject}</h4>
                            <p className="text-sm text-muted-foreground">{item.sender_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(item.priority)}
                          {getStatusBadge(item.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Reçu le: {new Date(item.received_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Échéance: {item.deadline ? new Date(item.deadline).toLocaleDateString('fr-FR') : 'Aucune'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Type: <span className="capitalize">{item.type}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchiveCorrespondence(item.id)}
                        >
                          Archiver
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateCorrespondenceStatus(item.id, "en_traitement")}
                        >
                          Traiter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIP Contacts Section */}
            {activeSection === "vip-contacts" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Carnet d'Adresses VIP</h2>
                    <p className="text-muted-foreground">Contacts privilégiés et confidentiels</p>
                  </div>
                  <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Nouveau contact VIP</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact_name">Nom complet *</Label>
                          <Input
                            id="contact_name"
                            placeholder="Nom du contact"
                            value={newContact.name}
                            onChange={(e) => handleUpdateContactField("name", e.target.value)}
                          />
                          {contactErrors.name && (
                            <p className="text-sm text-red-500">{contactErrors.name}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact_title">Titre/Fonction</Label>
                            <Input
                              id="contact_title"
                              placeholder="Ex: Président"
                              value={newContact.title}
                              onChange={(e) => handleUpdateContactField("title", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact_org">Organisation</Label>
                            <Input
                              id="contact_org"
                              placeholder="Ex: Union Africaine"
                              value={newContact.organization}
                              onChange={(e) => handleUpdateContactField("organization", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact_country">Pays</Label>
                            <Input
                              id="contact_country"
                              placeholder="Pays"
                              value={newContact.country}
                              onChange={(e) => handleUpdateContactField("country", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact_category">Catégorie</Label>
                            <Select
                              value={newContact.category}
                              onValueChange={(value) => handleUpdateContactField("category", value as ContactCategory)}
                            >
                              <SelectTrigger id="contact_category">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="chef_etat">Chef d'État</SelectItem>
                                <SelectItem value="diplomate">Diplomate</SelectItem>
                                <SelectItem value="famille">Famille</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_email">Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            placeholder="email@exemple.com"
                            value={newContact.email}
                            onChange={(e) => handleUpdateContactField("email", e.target.value)}
                          />
                          {contactErrors.email && (
                            <p className="text-sm text-red-500">{contactErrors.email}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_phone">Téléphone</Label>
                          <Input
                            id="contact_phone"
                            type="tel"
                            placeholder="+241 ..."
                            value={newContact.phone}
                            onChange={(e) => handleUpdateContactField("phone", e.target.value)}
                          />
                          {contactErrors.phone && (
                            <p className="text-sm text-red-500">{contactErrors.phone}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="checkbox"
                            id="is_favorite"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={newContact.is_favorite}
                            onChange={(e) => handleUpdateContactField("is_favorite", e.target.checked)}
                          />
                          <Label htmlFor="is_favorite">Ajouter aux favoris</Label>
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={handleCreateContact}
                          disabled={contactOperation.state.loading}
                        >
                          {contactOperation.state.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {contactOperation.state.loading ? "Création..." : "Créer le contact"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vipContacts.map(contact => (
                    <div key={contact.id} className="neu-card p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                          onClick={() => handleToggleFavorite(contact.id)}
                        >
                          <Badge className={contact.is_favorite ? "bg-yellow-500" : "bg-gray-300"}>
                            ★
                          </Badge>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="neu-raised w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-primary relative">
                          {contact.name.charAt(0)}
                          {contact.is_favorite && (
                            <span className="absolute -top-1 -right-1 text-yellow-500 text-xs">★</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">{contact.title}</p>
                          <p className="text-xs text-muted-foreground">{contact.organization}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {contact.country && (
                          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/5 transition-colors">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.country}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/5 transition-colors">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/5 transition-colors">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trips Section */}
            {activeSection === "trips" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Déplacements Privés</h2>
                    <p className="text-muted-foreground">Agenda des voyages personnels</p>
                  </div>
                  <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="neu-raised hover:shadow-neo-md transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Planifier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Planifier un déplacement</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="trip_destination">Destination *</Label>
                          <Input
                            id="trip_destination"
                            placeholder="Ville, Pays"
                            value={newTrip.destination}
                            onChange={(e) => handleUpdateTripField("destination", e.target.value)}
                          />
                          {tripErrors.destination && (
                            <p className="text-sm text-red-500">{tripErrors.destination}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trip_purpose">Objet du déplacement *</Label>
                          <Input
                            id="trip_purpose"
                            placeholder="Raison du voyage"
                            value={newTrip.purpose}
                            onChange={(e) => handleUpdateTripField("purpose", e.target.value)}
                          />
                          {tripErrors.purpose && (
                            <p className="text-sm text-red-500">{tripErrors.purpose}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_date">Date de début *</Label>
                            <Input
                              id="start_date"
                              type="date"
                              value={newTrip.start_date}
                              onChange={(e) => handleUpdateTripField("start_date", e.target.value)}
                            />
                            {tripErrors.start_date && (
                              <p className="text-sm text-red-500">{tripErrors.start_date}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="end_date">Date de fin *</Label>
                            <Input
                              id="end_date"
                              type="date"
                              value={newTrip.end_date}
                              onChange={(e) => handleUpdateTripField("end_date", e.target.value)}
                            />
                            {tripErrors.end_date && (
                              <p className="text-sm text-red-500">{tripErrors.end_date}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="trip_type">Type</Label>
                            <Select
                              value={newTrip.type}
                              onValueChange={(value) => handleUpdateTripField("type", value as TripType)}
                            >
                              <SelectTrigger id="trip_type">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="prive">Privé</SelectItem>
                                <SelectItem value="officiel">Officiel</SelectItem>
                                <SelectItem value="medical">Médical</SelectItem>
                                <SelectItem value="vacances">Vacances</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="trip_status">Statut</Label>
                            <Select
                              value={newTrip.status}
                              onValueChange={(value) => handleUpdateTripField("status", value as TripStatus)}
                            >
                              <SelectTrigger id="trip_status">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planned">Planifié</SelectItem>
                                <SelectItem value="confirmed">Confirmé</SelectItem>
                                <SelectItem value="completed">Terminé</SelectItem>
                                <SelectItem value="cancelled">Annulé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="participants">Participants</Label>
                          <Input
                            id="participants"
                            placeholder="Noms séparés par des virgules"
                            value={newTrip.participants.join(", ")}
                            onChange={(e) => handleUpdateTripField("participants", e.target.value.split(",").map(s => s.trim()))}
                          />
                          <p className="text-xs text-muted-foreground">Séparez les noms par des virgules</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trip_notes">Notes</Label>
                          <Textarea
                            id="trip_notes"
                            placeholder="Notes additionnelles..."
                            value={newTrip.notes}
                            onChange={(e) => handleUpdateTripField("notes", e.target.value)}
                          />
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={handleCreateTrip}
                          disabled={tripOperation.state.loading}
                        >
                          {tripOperation.state.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {tripOperation.state.loading ? "Planification..." : "Planifier le déplacement"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {trips.map(trip => (
                    <div key={trip.id} className="neu-card p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="neu-raised w-12 h-12 rounded-xl flex items-center justify-center">
                            <Plane className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{trip.destination}</h4>
                            <p className="text-sm text-muted-foreground">{trip.purpose}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{trip.type}</Badge>
                          <Badge className={trip.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {trip.status === 'confirmed' ? 'Confirmé' : trip.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-accent/5 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Dates</p>
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar className="h-4 w-4" />
                            {new Date(trip.start_date).toLocaleDateString('fr-FR')} - {new Date(trip.end_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Participants</p>
                          <div className="flex items-center gap-2 font-medium">
                            <Users className="h-4 w-4" />
                            {trip.participants?.join(", ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div >

      {/* IAsted Integration */}
      {userContext.hasIAstedAccess && (
        <IAstedButtonFull
          onClick={async () => {
            if (openaiRTC.isConnected) {
              openaiRTC.disconnect();
            } else {
              const systemPrompt = generateSystemPrompt(userContext);
              await openaiRTC.connect(selectedVoice, systemPrompt);
            }
          }}
          onDoubleClick={() => setIastedOpen(true)}
          audioLevel={openaiRTC.audioLevel}
          voiceListening={openaiRTC.voiceState === 'listening'}
          voiceSpeaking={openaiRTC.voiceState === 'speaking'}
          voiceProcessing={openaiRTC.voiceState === 'connecting' || openaiRTC.voiceState === 'thinking'}
        />
      )}

      {iastedOpen && (
        <IAstedChatModal
          isOpen={iastedOpen}
          onClose={() => setIastedOpen(false)}
          systemPrompt={generateSystemPrompt(userContext)}
          openaiRTC={openaiRTC}
        />
      )}
    </div >
  );
};

export default PrivateCabinetDirectorSpace;
