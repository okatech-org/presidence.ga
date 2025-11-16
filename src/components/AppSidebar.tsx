import { 
  Home, 
  Shield, 
  User, 
  Mic, 
  ChevronRight,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Target,
  FileText,
  Bell,
  Eye,
  TrendingUp,
  Scale
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import emblemGabon from "@/assets/emblem_gabon.png";
import { usePresidentRole } from "@/hooks/usePresidentRole";
import { Badge } from "@/components/ui/badge";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { 
    title: "Tableau de Bord", 
    url: "/dashboard", 
    icon: Home,
    description: "Vue d'ensemble"
  },
  { 
    title: "Président", 
    url: "/president", 
    icon: Shield,
    description: "Espace présidentiel"
  },
  { 
    title: "Administration", 
    url: "/admin-dashboard", 
    icon: User,
    description: "Gestion admin"
  },
  { 
    title: "iAsted", 
    url: "/iasted", 
    icon: Mic,
    description: "Assistant vocal"
  },
];

const presidentMenuItems = [
  { 
    title: "Vue d'Ensemble", 
    hash: "#vue-ensemble",
    icon: LayoutDashboard,
    description: "KPIs & Situation Nationale",
    badge: null
  },
  { 
    title: "Opinion Publique", 
    hash: "#opinion-publique",
    icon: Users,
    description: "Pouls du Pays",
    badge: null
  },
  { 
    title: "Situations Critiques", 
    hash: "#situations-critiques",
    icon: AlertTriangle,
    description: "Décisions Présidentielles",
    badge: { text: "23", variant: "destructive" as const }
  },
  { 
    title: "Vision Nationale", 
    hash: "#vision-nationale",
    icon: Target,
    description: "Gabon Émergent 2025",
    badge: null
  },
];

const actionsPresidentielles = [
  { 
    title: "Protocole XR-7", 
    hash: "#module-xr7",
    icon: Shield,
    description: "Urgence Nationale",
    badge: { text: "CRITIQUE", variant: "destructive" as const }
  },
  { 
    title: "Rapports Officiels", 
    hash: "#rapports",
    icon: FileText,
    description: "Documents Présidence",
    badge: null
  },
  { 
    title: "Audit Trail", 
    hash: "#audit",
    icon: Eye,
    description: "Traçabilité Complète",
    badge: null
  },
];

const outils = [
  { 
    title: "iAsted Présidentiel", 
    url: "/iasted",
    icon: Mic,
    description: "Assistant Stratégique",
    badge: { text: "IA", variant: "default" as const }
  },
  { 
    title: "Performance Institutions", 
    hash: "#institutions",
    icon: TrendingUp,
    description: "Conseil Numérique",
    badge: null
  },
  { 
    title: "Cadre Juridique", 
    hash: "#juridique",
    icon: Scale,
    description: "Références Légales",
    badge: null
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const currentHash = location.hash;
  const { isPresident, loading } = usePresidentRole();

  const isActive = (path: string) => currentPath === path || currentHash === path;

  const handleHashNavigation = (hash: string) => {
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <img 
              src={emblemGabon} 
              alt="Emblème" 
              className="h-8 w-8 object-contain"
            />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Présidence</span>
              <span className="text-xs text-muted-foreground">République Gabonaise</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{item.title}</span>
                        {open && (
                          <span className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {open && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sections Présidentielles (visible uniquement pour le président) */}
        {isPresident && (
          <>
            {/* Les 4 Piliers Stratégiques */}
            <SidebarGroup>
              <SidebarGroupLabel>Les 4 Piliers Stratégiques</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {presidentMenuItems.map((item) => (
                    <SidebarMenuItem key={item.hash}>
                      <SidebarMenuButton 
                        onClick={() => handleHashNavigation(item.hash)}
                        tooltip={item.title}
                        isActive={isActive(item.hash)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{item.title}</span>
                          {open && (
                            <span className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </span>
                          )}
                        </div>
                        {item.badge && open && (
                          <Badge variant={item.badge.variant} className="ml-auto shrink-0">
                            {item.badge.text}
                          </Badge>
                        )}
                        {open && isActive(item.hash) && (
                          <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Actions Présidentielles */}
            <SidebarGroup>
              <SidebarGroupLabel>Actions Présidentielles</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {actionsPresidentielles.map((item) => (
                    <SidebarMenuItem key={item.hash}>
                      <SidebarMenuButton 
                        onClick={() => handleHashNavigation(item.hash)}
                        tooltip={item.title}
                        isActive={isActive(item.hash)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{item.title}</span>
                          {open && (
                            <span className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </span>
                          )}
                        </div>
                        {item.badge && open && (
                          <Badge variant={item.badge.variant} className="ml-auto shrink-0">
                            {item.badge.text}
                          </Badge>
                        )}
                        {open && isActive(item.hash) && (
                          <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Outils & Assistants */}
            <SidebarGroup>
              <SidebarGroupLabel>Outils & Assistants</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {outils.map((item) => (
                    <SidebarMenuItem key={item.url || item.hash}>
                      <SidebarMenuButton 
                        {...(item.url ? {
                          asChild: true
                        } : {
                          onClick: () => item.hash && handleHashNavigation(item.hash)
                        })}
                        tooltip={item.title}
                        isActive={isActive(item.url || item.hash || "")}
                      >
                        {item.url ? (
                          <NavLink to={item.url} className="flex items-center gap-3 w-full">
                            <item.icon className="h-4 w-4 shrink-0" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium truncate">{item.title}</span>
                              {open && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.badge && open && (
                              <Badge variant={item.badge.variant} className="ml-auto shrink-0">
                                {item.badge.text}
                              </Badge>
                            )}
                          </NavLink>
                        ) : (
                          <>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium truncate">{item.title}</span>
                              {open && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.badge && open && (
                              <Badge variant={item.badge.variant} className="ml-auto shrink-0">
                                {item.badge.text}
                              </Badge>
                            )}
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Alertes Actives */}
            <SidebarGroup>
              <SidebarGroupLabel>Alertes Actives</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => handleHashNavigation("#situations-critiques")}
                      className="bg-destructive/10 hover:bg-destructive/20"
                    >
                      <Bell className="h-4 w-4 shrink-0 text-destructive animate-pulse" />
                      {open && (
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium text-destructive">23 cas critiques</span>
                          <span className="text-xs text-muted-foreground">
                            nécessitent votre arbitrage
                          </span>
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
