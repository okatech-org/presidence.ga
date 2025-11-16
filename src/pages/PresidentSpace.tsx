import React, { useState } from "react";
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

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  trend?: string;
  theme: ThemeConfig;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color, trend, theme }) => {
  return (
    <div
      style={{
        backgroundColor: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: "16px",
        padding: "24px",
        boxShadow: theme.shadow,
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: theme.textSecondary, fontSize: "14px", marginBottom: "8px", fontWeight: "500" }}>{title}</p>
          <h2 style={{ color: theme.text, fontSize: "32px", fontWeight: 700, marginBottom: "4px" }}>{value}</h2>
          {subtitle && <p style={{ color: theme.textTertiary, fontSize: "13px" }}>{subtitle}</p>}
          {trend && (
            <div style={{ display: "flex", alignItems: "center", marginTop: "8px", gap: "4px" }}>
              <TrendingUpIcon size={16} style={{ color: theme.success }} />
              <span style={{ color: theme.success, fontSize: "13px", fontWeight: 500 }}>{trend}</span>
            </div>
          )}
        </div>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: `${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

type CircularProgressProps = {
  percentage: number;
  label: string;
  color: string;
  theme: ThemeConfig;
};

const CircularProgress: React.FC<CircularProgressProps> = ({ percentage, label, color, theme }) => {
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg height={radius * 2} width={radius * 2} style={{ transform: "rotate(-90deg)" }}>
        <circle stroke={theme.border} fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{ marginTop: "-100px", paddingTop: "35px" }}>
        <div style={{ fontSize: "28px", fontWeight: 700, color: theme.text }}>{percentage}%</div>
        <div style={{ fontSize: "14px", color: theme.textSecondary, marginTop: "4px" }}>{label}</div>
      </div>
    </div>
  );
};

type ActivityItemProps = {
  type: "decree" | "meeting" | "nomination" | "other";
  title: string;
  time: string;
  status: "completed" | "pending" | "urgent" | "info";
  theme: ThemeConfig;
};

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, time, status, theme }) => {
  const getIcon = () => {
    switch (type) {
      case "decree":
        return <FileText size={16} />;
      case "meeting":
        return <Users size={16} />;
      case "nomination":
        return <Award size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return theme.success;
      case "pending":
        return theme.warning;
      case "urgent":
        return theme.danger;
      default:
        return theme.info;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: theme.bgSecondary,
        borderRadius: "8px",
        marginBottom: "8px",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.bgTertiary)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.bgSecondary)}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          backgroundColor: `${getStatusColor()}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "12px",
        }}
      >
        {React.cloneElement(getIcon(), { style: { color: getStatusColor() } })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: theme.text, fontSize: "14px", fontWeight: 500 }}>{title}</div>
        <div style={{ color: theme.textTertiary, fontSize: "12px", marginTop: "2px" }}>{time}</div>
      </div>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getStatusColor() }} />
    </div>
  );
};

export default function PresidentSpace() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["gouvernance"]);
  const theme = darkMode ? themes.dark : themes.light;

  const stats = {
    population: 2341179,
    ministeres: 42,
    projetsActifs: 127,
    budgetNational: "4.2T FCFA",
    croissancePIB: 3.2,
    tauxChomage: 19.8,
    decretsSemaine: 7,
    reunionsPrevues: 12,
  };

  const navigationItems = [
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
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => (prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        transition: "all 0.3s ease",
      }}
    >
      <header
        style={{
          backgroundColor: theme.bgCard,
          borderBottom: `1px solid ${theme.border}`,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: theme.shadow,
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

      <div style={{ display: "flex", height: "calc(100vh - 73px)" }}>
        <aside
          style={{
            width: sidebarOpen ? "280px" : "0",
            backgroundColor: theme.bgSecondary,
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
                    padding: "12px 16px",
                    marginBottom: "4px",
                    backgroundColor: activeSection === item.id ? theme.bgTertiary : "transparent",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== item.id) {
                      e.currentTarget.style.backgroundColor = `${theme.bgTertiary}50`;
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
                          backgroundColor: theme.danger,
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
                          backgroundColor: activeSection === child.id ? `${theme.bgTertiary}60` : "transparent",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (activeSection !== child.id) {
                            e.currentTarget.style.backgroundColor = `${theme.bgTertiary}30`;
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
            backgroundColor: theme.bgSecondary,
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
                <StatCard title="Budget National" value={stats.budgetNational} subtitle="Exercice 2025" icon={DollarSign} color={theme.success} theme={theme} />
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
                    backgroundColor: theme.bgCard,
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
                    backgroundColor: theme.bgCard,
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
                  backgroundColor: theme.bgCard,
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
                        backgroundColor: theme.bgSecondary,
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
                        e.currentTarget.style.backgroundColor = theme.bgSecondary;
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                backgroundColor: theme.bgCard,
                borderRadius: "16px",
                border: `1px solid ${theme.border}`,
              }}
            >
              <Building2 size={48} color={theme.textTertiary} />
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: theme.text, marginTop: "16px" }}>
                Section: {activeSection.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </h3>
              <p style={{ color: theme.textSecondary, marginTop: "8px" }}>Cette section est en cours de développement</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


