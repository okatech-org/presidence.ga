import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import IAstedMainButton from "@/components/iasted/IAstedMainButton";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SectionCard, StatCard, CircularProgress } from "@/components/president/PresidentSpaceComponents";
import { useTheme } from "next-themes";
import emblemGabon from "@/assets/emblem_gabon.png";

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
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [voiceModeToggleTimestamp, setVoiceModeToggleTimestamp] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard, active: true },
    { id: "iasted", label: "Assistant iAsted", icon: Bot, active: false },
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      activeSection === item.id || (item.id === "iasted" && iastedOpen)
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "conseil-ministres"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <UserCog className="w-4 h-4" />
                  Conseil des Ministres
                </button>
                <button
                  onClick={() => setActiveSection("ministeres")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "ministeres"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Ministères & Directions
                </button>
                <button
                  onClick={() => setActiveSection("decrets")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "decrets"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  Décrets & Ordonnances
                </button>
                <button
                  onClick={() => setActiveSection("nominations")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "nominations"
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "budget"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Budget National
                </button>
                      <button
                  onClick={() => setActiveSection("indicateurs")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "indicateurs"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <TrendingUpIcon className="w-4 h-4" />
                  Indicateurs Économiques
                </button>
                <button
                  onClick={() => setActiveSection("investissements")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "investissements"
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "education"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Éducation
              </button>
                <button
                  onClick={() => setActiveSection("sante")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "sante"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Santé Publique
                      </button>
                <button
                  onClick={() => setActiveSection("emploi")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "emploi"
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "chantiers"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  Suivi des Chantiers
              </button>
                <button
                  onClick={() => setActiveSection("projets-presidentiels")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "projets-presidentiels"
                      ? "neu-inset text-primary font-semibold"
                      : "neu-raised hover:shadow-neo-md"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  Projets Présidentiels
                </button>
                <button
                  onClick={() => setActiveSection("projets-etat")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === "projets-etat"
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
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm neu-raised hover:shadow-neo-md transition-all mb-1">
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
              <>
                {/* Sections de données */}
                <div className="grid gap-6 md:grid-cols-2">
              <div className="neu-card p-6 min-h-[300px]">
                <h3 className="text-xl font-semibold mb-2">
                  Répartition par Type d'Agent
                </h3>
                <p className="text-sm text-muted-foreground">
                  Catégories de personnels
                </p>
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={agentTypesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {agentTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="neu-card p-6 min-h-[300px]">
                <h3 className="text-xl font-semibold mb-2">
                  Équilibre Homme/Femme
                </h3>
                <p className="text-sm text-muted-foreground">
                  Répartition par genre
                </p>
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
            </div>
              </div>
            </div>
              </>
            )}

            {activeSection === "conseil-ministres" && (
              <div className="space-y-6">
                <ConseilMinistres theme={currentTheme} />
              </div>
            )}

            {activeSection === "ministeres" && (
              <div className="space-y-6">
                <MinisteresDirections theme={currentTheme} />
              </div>
            )}

            {activeSection === "decrets" && (
              <div className="space-y-6">
                <DecretsOrdonnances theme={currentTheme} />
              </div>
            )}

            {activeSection === "nominations" && (
              <div className="space-y-6">
                <Nominations theme={currentTheme} />
        </div>
            )}

            {activeSection === "budget" && (
              <div className="space-y-6">
                <BudgetNationalSection theme={currentTheme} />
              </div>
            )}

            {activeSection === "indicateurs" && (
              <div className="space-y-6">
                <IndicateursEconomiquesSection theme={currentTheme} />
              </div>
            )}

            {activeSection === "investissements" && (
              <div className="space-y-6">
                <InvestissementsSection theme={currentTheme} />
              </div>
            )}

            {activeSection === "education" && (
              <div className="space-y-6">
                <EducationSection theme={currentTheme} />
              </div>
            )}

            {activeSection === "sante" && (
              <div className="space-y-6">
                <SantePubliqueSection theme={currentTheme} />
              </div>
            )}

            {activeSection === "emploi" && (
              <div className="space-y-6">
                <EmploiFormationSection theme={currentTheme} />
              </div>
            )}

            {activeSection === "chantiers" && (
              <div className="space-y-6">
                <ChantiersSection theme={currentTheme} />
              </div>
            )}

            {activeSection === "projets-presidentiels" && (
              <div className="space-y-6">
                <ProjetsPresidentielsSection theme={currentTheme} />
              </div>
            )}

            {activeSection === "projets-etat" && (
              <div className="space-y-6">
                <ProjetsEtatSection theme={currentTheme} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bouton IAsted flottant */}
      <IAstedMainButton className="fixed bottom-8 right-8 z-50" />
    </div>
  );
}

// Fonctions de sections exportées pour compatibilité (utilisées dans d'autres parties de l'application)
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

export function ChantiersSection({ theme }: { theme: ThemeConfig }) {
  const chantiers = [
    { nom: "Hôpital de Libreville", localisation: "Libreville", avancement: 75, statut: "En cours", budget: "45B FCFA", dateDebut: "01/2024", dateFin: "06/2025" },
    { nom: "Route nationale N1", localisation: "Libreville - Port-Gentil", avancement: 42, statut: "En cours", budget: "120B FCFA", dateDebut: "03/2024", dateFin: "12/2026" },
    { nom: "Aéroport international", localisation: "Libreville", avancement: 28, statut: "En cours", budget: "280B FCFA", dateDebut: "06/2024", dateFin: "03/2027" },
    { nom: "Palais présidentiel", localisation: "Libreville", avancement: 90, statut: "Finalisation", budget: "85B FCFA", dateDebut: "01/2023", dateFin: "03/2025" },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Suivi des Chantiers" theme={theme} right={<Hammer size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 16 }}>
          {chantiers.map((c, idx) => (
            <div key={idx} style={{ padding: "16px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <h4 style={{ color: theme.text, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{c.nom}</h4>
                  <p style={{ color: theme.textSecondary, fontSize: 13 }}>{c.localisation}</p>
                </div>
                <span style={{ background: `${c.statut === "Finalisation" ? theme.success : theme.primary}20`, color: c.statut === "Finalisation" ? theme.success : theme.primary, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {c.statut}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                  <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Avancement</p>
                  <div style={{ width: "100%", height: 8, background: theme.bgTertiary, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${c.avancement}%`, height: "100%", background: theme.primary, transition: "width 0.3s ease" }} />
                  </div>
                  <p style={{ color: theme.text, fontSize: 14, fontWeight: 600, marginTop: 4 }}>{c.avancement}%</p>
                </div>
                <div>
                  <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Budget</p>
                  <p style={{ color: theme.text, fontSize: 14, fontWeight: 600 }}>{c.budget}</p>
                </div>
                <div>
                  <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Début</p>
                  <p style={{ color: theme.text, fontSize: 14 }}>{c.dateDebut}</p>
                </div>
                <div>
                  <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Fin prévue</p>
                  <p style={{ color: theme.text, fontSize: 14 }}>{c.dateFin}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function ProjetsPresidentielsSection({ theme }: { theme: ThemeConfig }) {
  const projets = [
    { nom: "Gabon Numérique 2025", description: "Transformation digitale de l'administration", priorite: "Haute", budget: "150B FCFA", statut: "En cours", responsable: "Ministère du Numérique" },
    { nom: "Énergie Renouvelable", description: "Transition vers les énergies vertes", priorite: "Critique", budget: "320B FCFA", statut: "Lancé", responsable: "Ministère de l'Énergie" },
    { nom: "Éducation pour Tous", description: "Accès universel à l'éducation", priorite: "Haute", budget: "95B FCFA", statut: "Planification", responsable: "Ministère de l'Éducation" },
    { nom: "Santé Publique Renforcée", description: "Amélioration du système de santé", priorite: "Haute", budget: "180B FCFA", statut: "En cours", responsable: "Ministère de la Santé" },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Projets Présidentiels" theme={theme} right={<Crown size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 16 }}>
          {projets.map((p, idx) => (
            <div key={idx} style={{ padding: "16px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: theme.text, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{p.nom}</h4>
                  <p style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 8 }}>{p.description}</p>
                  <p style={{ color: theme.textTertiary, fontSize: 12 }}>Responsable: {p.responsable}</p>
                </div>
                <span style={{ background: `${p.priorite === "Critique" ? theme.danger : theme.warning}20`, color: p.priorite === "Critique" ? theme.danger : theme.warning, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, marginLeft: 12 }}>
                  {p.priorite}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                <div>
                  <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Budget</p>
                  <p style={{ color: theme.text, fontSize: 14, fontWeight: 600 }}>{p.budget}</p>
                </div>
                <div>
                  <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Statut</p>
                  <span style={{ background: `${p.statut === "En cours" ? theme.primary : p.statut === "Lancé" ? theme.success : theme.warning}20`, color: p.statut === "En cours" ? theme.primary : p.statut === "Lancé" ? theme.success : theme.warning, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    {p.statut}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function ProjetsEtatSection({ theme }: { theme: ThemeConfig }) {
  const projets = [
    { nom: "Port en eau profonde", secteur: "Infrastructures", montant: "380B FCFA", statut: "En cours", avancement: 65, echeance: "12/2026" },
    { nom: "Parc solaire Estuaire", secteur: "Énergie", montant: "210B FCFA", statut: "Lancé", avancement: 35, echeance: "09/2027" },
    { nom: "Fibre nationale", secteur: "Télécom", montant: "145B FCFA", statut: "Étude", avancement: 15, echeance: "06/2028" },
    { nom: "Autoroute côtière", secteur: "Infrastructures", montant: "520B FCFA", statut: "Planification", avancement: 5, echeance: "12/2029" },
    { nom: "Centres de santé ruraux", secteur: "Santé", montant: "95B FCFA", statut: "En cours", avancement: 48, echeance: "03/2026" },
  ];
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionCard title="Projets d'État" theme={theme} right={<Target size={18} color={theme.textSecondary} />}>
        <div style={{ display: "grid", gap: 12 }}>
          {projets.map((p, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 12, padding: "14px 16px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12 }}>
              <div>
                <div style={{ color: theme.text, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.nom}</div>
                <div style={{ color: theme.textSecondary, fontSize: 12 }}>{p.secteur}</div>
              </div>
              <div style={{ color: theme.text, fontSize: 14, fontWeight: 600 }}>{p.montant}</div>
              <div>
                <span style={{ background: `${p.statut === "En cours" ? theme.primary : p.statut === "Lancé" ? theme.success : p.statut === "Étude" ? theme.warning : theme.info}20`, color: p.statut === "En cours" ? theme.primary : p.statut === "Lancé" ? theme.success : p.statut === "Étude" ? theme.warning : theme.info, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {p.statut}
                </span>
              </div>
              <div>
                <div style={{ width: "100%", height: 6, background: theme.bgTertiary, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ width: `${p.avancement}%`, height: "100%", background: theme.primary }} />
                </div>
                <div style={{ color: theme.textSecondary, fontSize: 11 }}>{p.avancement}%</div>
              </div>
              <div style={{ textAlign: "right", color: theme.textSecondary, fontSize: 12 }}>{p.echeance}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}


