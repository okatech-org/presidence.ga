import React, { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { StatCard, CircularProgress, TimelineItem, SectionCard } from "@/components/president/PresidentSpaceComponents";
import { ActivityItem } from "@/components/president/ActivityItem";
import { VoiceConversationPanel } from "@/components/VoiceConversationPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["gouvernance"]);
  const [iastedOpen, setIastedOpen] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const voiceConversationRef = useRef<any>(null);
  const navigate = useNavigate();
  const theme = useMemo(() => darkMode ? themes.dark : themes.light, [darkMode]);

  const stats = useMemo(() => ({
    population: 2341179,
    ministeres: 42,
    projetsActifs: 127,
    budgetNational: "4.2T FCFA",
    croissancePIB: 3.2,
    tauxChomage: 19.8,
    decretsSemaine: 7,
    reunionsPrevues: 12,
  }), []);

  const navigationItems = useMemo(() => [
    { id: "dashboard", label: "Tableau de Bord", icon: Home, badge: null as string | null },
    {
      id: "gouvernance",
      label: "Gouvernance",
      icon: Building2,
      expandable: true,
      children: [
        { id: "conseil-ministres", label: "Conseil des Ministres", icon: Users },
        { id: "ministeres", label: "Ministères & Directions", icon: Building2 },
        { id: "decrets", label: "Décrets & Ordonnances", icon: FileText },
        { id: "nominations", label: "Nominations", icon: Award },
      ],
    },
    {
      id: "economie",
      label: "Économie & Finances",
      icon: TrendingUpIcon,
      expandable: true,
      children: [
        { id: "budget", label: "Budget National", icon: DollarSign },
        { id: "indicateurs", label: "Indicateurs Économiques", icon: BarChart3 },
        { id: "investissements", label: "Investissements", icon: Briefcase },
      ],
    },
    {
      id: "social",
      label: "Affaires Sociales",
      icon: Heart,
      expandable: true,
      children: [
        { id: "education", label: "Éducation", icon: GraduationCap },
        { id: "sante", label: "Santé Publique", icon: Activity },
        { id: "emploi", label: "Emploi & Formation", icon: Briefcase },
      ],
    },
    { id: "international", label: "Relations Internationales", icon: Globe, badge: "3" },
    { id: "securite", label: "Sécurité & Défense", icon: Shield },
    { id: "agenda", label: "Agenda Présidentiel", icon: Calendar, badge: "8" },
  ], []);

  const toggleMenu = useCallback((menuId: string) => {
    setExpandedMenus((prev) => (prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]));
  }, []);

  const handleLogout = useCallback(async () => {
    navigate("/auth");
  }, [navigate]);

  return (
      <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F7F8FA",
        color: theme.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        transition: "all 0.3s ease",
      }}
    >
      <header
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: `1px solid ${theme.border}`,
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.bgSecondary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Menu size={24} color={theme.text} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryGold})`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flag size={20} color="white" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryGold})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "2px",
                }}
              >
                Espace Président
              </h1>
              <p style={{ fontSize: "12px", color: theme.textSecondary }}>République Gabonaise — Super-Admin</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: theme.bgSecondary,
              border: "none",
              cursor: "pointer",
              padding: "10px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.bgTertiary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.bgSecondary)}
          >
            {darkMode ? <Sun size={20} color={theme.primaryGold} /> : <Moon size={20} color={theme.text} />}
          </button>

          <div style={{ position: "relative" }}>
            <button
              style={{
                background: theme.bgSecondary,
                border: "none",
                cursor: "pointer",
                padding: "10px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.bgTertiary)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.bgSecondary)}
            >
              <Bell size={20} color={theme.text} />
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: theme.danger,
                  borderRadius: "50%",
                  border: `2px solid ${theme.bgCard}`,
                }}
              />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 12px",
              backgroundColor: theme.bgSecondary,
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${theme.primaryBlue}, ${theme.primary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 600,
              }}
            >
              PE
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: theme.text }}>Président</div>
              <div style={{ fontSize: "12px", color: theme.textSecondary }}>Chef de l'État</div>
            </div>
            <ChevronDown size={16} color={theme.textSecondary} />
          </div>
        </div>
      </header>

      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
        <aside
          style={{
            width: sidebarOpen ? "280px" : "0",
            backgroundColor: "#FFFFFF",
            borderRight: `1px solid ${theme.border}`,
            overflowY: "auto",
            overflowX: "hidden",
            transition: "width 0.3s ease",
            position: "relative",
          }}
        >
          <nav style={{ padding: sidebarOpen ? "20px" : "0" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: theme.textTertiary,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "12px",
                opacity: sidebarOpen ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            >
              Navigation
            </div>

            {navigationItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if ((item as any).expandable) {
                      toggleMenu(item.id);
                    } else {
                      setActiveSection(item.id);
                    }
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    marginBottom: "4px",
                    backgroundColor: activeSection === item.id ? "#F3F4F6" : "transparent",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== item.id) {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== item.id) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <item.icon size={20} color={activeSection === item.id ? theme.primary : theme.textSecondary} />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: activeSection === item.id ? 600 : 400,
                        color: activeSection === item.id ? theme.text : theme.textSecondary,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {(item as any).badge && (
                      <span
                        style={{
                          backgroundColor: "#EF4444",
                          color: "white",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "10px",
                        }}
                      >
                        {(item as any).badge}
                      </span>
                    )}
                    {(item as any).expandable && (
                      <ChevronRight
                        size={16}
                        color={theme.textTertiary}
                        style={{
                          transform: expandedMenus.includes(item.id) ? "rotate(90deg)" : "rotate(0)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    )}
                  </div>
                </button>

                {(item as any).expandable && expandedMenus.includes(item.id) && (item as any).children && (
                  <div
                    style={{
                      marginLeft: "32px",
                      marginBottom: "8px",
                      opacity: sidebarOpen ? 1 : 0,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {(item as any).children.map((child: any) => (
                      <button
                        key={child.id}
                        onClick={() => setActiveSection(child.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          marginBottom: "2px",
                          backgroundColor: activeSection === child.id ? "#F3F4F6" : "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (activeSection !== child.id) {
                            e.currentTarget.style.backgroundColor = "#F3F4F6";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeSection !== child.id) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        <child.icon size={16} color={activeSection === child.id ? theme.primary : theme.textTertiary} />
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: activeSection === child.id ? 500 : 400,
                            color: activeSection === child.id ? theme.text : theme.textSecondary,
                          }}
                        >
                          {child.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div
              style={{
                borderTop: `1px solid ${theme.border}`,
                marginTop: "20px",
                paddingTop: "20px",
                opacity: sidebarOpen ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            >
              <button
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  marginBottom: "4px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${theme.bgTertiary}50`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Settings size={20} color={theme.textSecondary} />
                <span style={{ fontSize: "14px", color: theme.textSecondary }}>Paramètres</span>
              </button>

              <button
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${theme.danger}20`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <LogOut size={20} color={theme.danger} />
                <span style={{ fontSize: "14px", color: theme.danger }}>Déconnexion</span>
              </button>
            </div>
          </nav>
        </aside>

        <main
          style={{
            flex: 1,
            padding: "32px",
            overflowY: "auto",
            backgroundColor: "#F7F8FA",
          }}
        >
          {activeSection === "dashboard" && (
            <div>
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "28px", fontWeight: 700, color: theme.text, marginBottom: "8px" }}>
                  Tableau de Bord Présidentiel
                </h2>
                <p style={{ color: theme.textSecondary }}>
                  Vue d'ensemble de la République -{" "}
                  {new Date().toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                <StatCard title="Population Nationale" value={stats.population.toLocaleString("fr-FR")} subtitle="Recensement 2025" icon={Users} color={theme.primary} theme={theme} />
                <StatCard title="Ministères & Institutions" value={stats.ministeres} subtitle="Structures gouvernementales" icon={Building2} color={theme.primaryBlue} theme={theme} />
                <StatCard title="Projets en Cours" value={stats.projetsActifs} subtitle="Projets nationaux actifs" icon={Briefcase} color={theme.primaryGold} theme={theme} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <StatCard title="Budget National" value={stats.budgetNational} subtitle="Exercice 2025" icon={DollarSign} color={theme.success} theme={theme} />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${theme.border}`,
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: theme.shadow,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: theme.text }}>Indicateurs Économiques</h3>
                    <BarChart3 size={20} color={theme.textSecondary} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <CircularProgress percentage={stats.croissancePIB} label="Croissance PIB" color={theme.success} theme={theme} />
                    <CircularProgress percentage={100 - stats.tauxChomage} label="Taux d'Emploi" color={theme.primaryBlue} theme={theme} />
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${theme.border}`,
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: theme.shadow,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: theme.text }}>Activités Récentes</h3>
                    <Activity size={20} color={theme.textSecondary} />
                  </div>
                  <div>
                    <ActivityItem type="decree" title="Décret N°2025/047 - Nomination au Ministère" time="Il y a 2 heures" status="completed" theme={theme} />
                    <ActivityItem type="meeting" title="Conseil des Ministres Extraordinaire" time="Demain à 10h00" status="pending" theme={theme} />
                    <ActivityItem type="nomination" title="Nomination Directeur Général SEEG" time="Il y a 1 jour" status="completed" theme={theme} />
                    <ActivityItem type="decree" title="Ordonnance Budget Rectificatif" time="En attente de signature" status="urgent" theme={theme} />
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${theme.border}`,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: theme.shadow,
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: theme.text, marginBottom: "20px" }}>Actions Rapides</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {[
                    { label: "Nouveau Décret", icon: FileText, color: theme.primaryBlue },
                    { label: "Convoquer Conseil", icon: Users, color: theme.primary },
                    { label: "Planifier Réunion", icon: Calendar, color: theme.primaryGold },
                    { label: "Voir Rapports", icon: BarChart3, color: theme.info },
                    { label: "Messages Urgents", icon: Bell, color: theme.danger },
                    { label: "Nominations", icon: Award, color: theme.success },
                  ].map((action, index) => (
                    <button
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 18px",
                        backgroundColor: "#F7F8FA",
                        border: `1px solid ${theme.border}`,
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${action.color}20`;
                        e.currentTarget.style.borderColor = action.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#F7F8FA";
                        e.currentTarget.style.borderColor = theme.border;
                      }}
                    >
                      <action.icon size={18} color={action.color} />
                      <span style={{ fontSize: "14px", fontWeight: 500, color: theme.text }}>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection !== "dashboard" && (
            <>
              {activeSection === "conseil-ministres" && <ConseilMinistres theme={theme} />}
              {activeSection === "ministeres" && <MinisteresDirections theme={theme} />}
              {activeSection === "decrets" && <DecretsOrdonnances theme={theme} />}
              {activeSection === "nominations" && <Nominations theme={theme} />}
              {activeSection === "budget" && <BudgetNationalSection theme={theme} />}
              {activeSection === "indicateurs" && <IndicateursEconomiquesSection theme={theme} />}
              {activeSection === "investissements" && <InvestissementsSection theme={theme} />}
              {activeSection === "education" && <EducationSection theme={theme} />}
              {activeSection === "sante" && <SantePubliqueSection theme={theme} />}
              {activeSection === "emploi" && <EmploiFormationSection theme={theme} />}
              {activeSection === "international" && <RelationsInternationalesSection theme={theme} />}
              {activeSection === "securite" && <SecuriteDefenseSection theme={theme} />}
              {activeSection === "agenda" && <AgendaPresidentielSection theme={theme} />}
            </>
          )}
        </main>
        {/* Bouton iAsted - visible sur toutes les pages de l'espace Président */}
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 200,
          }}
        >
          <IAstedButtonFull
            onSingleClick={() => {
              if (voiceOnlyMode) {
                // Mode vocal pur actif : fermer
                setIastedOpen(false);
                setVoiceOnlyMode(false);
              } else if (iastedOpen && !voiceOnlyMode) {
                // Modal déjà ouvert en mode texte : basculer le mode vocal
                voiceConversationRef.current?.toggleVoiceMode();
              } else {
                // Modal fermé : activer le mode vocal pur
                setVoiceOnlyMode(true);
                setIastedOpen(true);
              }
            }}
            onDoubleClick={() => {
              // Ouvrir le modal en mode texte
              setVoiceOnlyMode(false);
              setIastedOpen(true);
            }}
            size="lg"
            voiceListening={false}
            voiceSpeaking={isAgentSpeaking}
            voiceProcessing={false}
            isInterfaceOpen={iastedOpen && !voiceOnlyMode}
            isVoiceModeActive={isVoiceModeActive}
          />
        </div>
        
        {/* Interface iAsted avec conversation vocale */}
        <Dialog open={iastedOpen} onOpenChange={(open) => {
          setIastedOpen(open);
          if (!open) {
            setVoiceOnlyMode(false);
          }
        }}>
          <DialogContent className={cn("max-w-3xl", voiceOnlyMode && "opacity-0 pointer-events-none absolute")}>
            <VoiceConversationPanel 
              ref={voiceConversationRef}
              userRole="president"
              onSpeakingChange={setIsAgentSpeaking}
              autoActivate={voiceOnlyMode}
              onVoiceModeChange={setIsVoiceModeActive}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function ConseilMinistres({ theme }: { theme: ThemeConfig }) {
  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <SectionCard
        title="Prochaine Session"
        theme={theme}
        right={<Calendar size={18} color={theme.textSecondary} />}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <StatCard title="Date" value={new Date().toLocaleDateString("fr-FR")} icon={Calendar} color={theme.primary} theme={theme} />
          <StatCard title="Heure" value="10:00" icon={Clock} color={theme.primaryBlue} theme={theme} />
          <StatCard title="Lieu" value="Palais Rénovation" icon={Building2} color={theme.primaryGold} theme={theme} />
        </div>
      </SectionCard>
      <SectionCard title="Ordre du Jour" theme={theme}>
        <ul style={{ display: "grid", gap: "12px" }}>
          {["Projet de décret – Nomination DG", "Ordonnance – Budget rectificatif", "Communication – Affaires étrangères"].map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: "#F7F8FA", borderRadius: 10, border: `1px solid ${theme.border}` }}>
              <FileText size={16} color={theme.primary} />
              <span style={{ color: theme.text }}>{item}</span>
            </li>
          ))}
        </ul>
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

export function DecretsOrdonnances({ theme }: { theme: ThemeConfig }) {
  const rows = [
    { ref: "2025/047", objet: "Nomination au Ministère", statut: "Signé", couleur: theme.success },
    { ref: "2025/051", objet: "Budget rectificatif", statut: "En attente", couleur: theme.warning },
    { ref: "2025/059", objet: "Réorganisation DG", statut: "À réviser", couleur: theme.info },
  ];
  return (
    <SectionCard title="Décrets & Ordonnances" theme={theme} right={<FileText size={18} color={theme.textSecondary} />}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: "#F7F8FA" }}>
              {["Référence", "Objet", "Statut"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 14px", color: theme.textSecondary, fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ref} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ padding: "12px 14px", color: theme.text, fontWeight: 600 }}>{r.ref}</td>
                <td style={{ padding: "12px 14px", color: theme.text }}>{r.objet}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ background: `${r.couleur}20`, color: r.couleur, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    {r.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function Nominations({ theme }: { theme: ThemeConfig }) {
  const items = [
    { poste: "Directeur Général SEEG", ministere: "Énergie", date: "15/11/2025" },
    { poste: "Secrétaire Général", ministere: "Intérieur", date: "12/11/2025" },
  ];
  return (
    <SectionCard title="Nominations Récentes" theme={theme} right={<Award size={18} color={theme.textSecondary} />}>
      <div style={{ display: "grid", gap: "12px" }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, padding: "12px 14px", background: "#F7F8FA", border: `1px solid ${theme.border}`, borderRadius: 10 }}>
            <span style={{ color: theme.text, fontWeight: 600 }}>{it.poste}</span>
            <span style={{ color: theme.textSecondary }}>{it.ministere}</span>
            <span style={{ color: theme.textSecondary }}>{it.date}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function BudgetNationalSection({ theme }: { theme: ThemeConfig }) {
  const chiffres = {
    budget: "4.2T FCFA",
    depenses: "2.7T FCFA",
    execution: 64,
    solde: "1.5T FCFA",
  };
  const repartition = [
    { ministere: "Éducation", montant: "620B FCFA" },
    { ministere: "Santé", montant: "480B FCFA" },
    { ministere: "Défense", montant: "720B FCFA" },
    { ministere: "Infrastructures", montant: "950B FCFA" },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Budget National" theme={theme} right={<DollarSign size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <StatCard title="Montant Alloué" value={chiffres.budget} icon={DollarSign} color={theme.success} theme={theme} />
          <StatCard title="Dépenses Engagées" value={chiffres.depenses} icon={Briefcase} color={theme.primaryBlue} theme={theme} />
          <StatCard title="Exécution" value={`${chiffres.execution}%`} icon={TrendingUpIcon} color={theme.primary} theme={theme} />
          <StatCard title="Solde" value={chiffres.solde} icon={Scale} color={theme.primaryGold} theme={theme} />
        </div>
      </SectionCard>
      <SectionCard title="Répartition par Ministère" theme={theme}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {repartition.map((r, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#F7F8FA", border: `1px solid ${theme.border}`, borderRadius: 10 }}>
              <span style={{ color: theme.text }}>{r.ministere}</span>
              <span style={{ color: theme.text, fontWeight: 600 }}>{r.montant}</span>
            </div>
          ))}
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


