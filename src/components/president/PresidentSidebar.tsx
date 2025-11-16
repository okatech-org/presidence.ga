import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  Target,
  Shield,
  FileText,
  Bell,
  Settings,
  LogOut,
  Mic,
  ChevronRight,
  Eye,
  TrendingUp,
  Scale
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import emblemGabon from "@/assets/emblem_gabon.png";
import { supabase } from "@/integrations/supabase/client";
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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

export function PresidentSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const currentHash = location.hash;

  const isActive = (path: string) => currentPath === path || currentHash === path;

  const handleHashNavigation = (hash: string) => {
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-primary/20 p-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/30">
            <img 
              src={emblemGabon} 
              alt="Emblème" 
              className="h-8 w-8 object-contain"
            />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary">S.E. le Président</span>
              <span className="text-xs text-muted-foreground">Console de Pilotage</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Les 4 Piliers */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-primary">
            Les 4 Piliers Stratégiques
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {presidentMenuItems.map((item) => (
                <SidebarMenuItem key={item.hash}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    isActive={isActive(item.hash)}
                    onClick={() => handleHashNavigation(item.hash)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {open && (
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            {item.badge && (
                              <Badge variant={item.badge.variant} className="text-[10px] px-1 py-0">
                                {item.badge.text}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </span>
                        </div>
                      )}
                      {open && isActive(item.hash) && (
                        <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Actions Présidentielles */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-destructive">
            Actions Présidentielles
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actionsPresidentielles.map((item) => (
                <SidebarMenuItem key={item.hash}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    isActive={isActive(item.hash)}
                    onClick={() => handleHashNavigation(item.hash)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {open && (
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            {item.badge && (
                              <Badge variant={item.badge.variant} className="text-[10px] px-1 py-0">
                                {item.badge.text}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Outils & Assistants */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold">
            Outils & Assistants
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {outils.map((item) => (
                <SidebarMenuItem key={item.url || item.hash}>
                  <SidebarMenuButton 
                    asChild={!!item.url}
                    tooltip={item.title}
                    isActive={item.url ? isActive(item.url) : isActive(item.hash!)}
                    onClick={item.hash ? () => handleHashNavigation(item.hash!) : undefined}
                    className={item.hash ? "cursor-pointer" : ""}
                  >
                    {item.url ? (
                      <NavLink to={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {open && (
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{item.title}</span>
                              {item.badge && (
                                <Badge variant={item.badge.variant} className="text-[10px] px-1 py-0">
                                  {item.badge.text}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {open && (
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Notifications Critiques */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className={`${open ? 'p-3' : 'p-2'} bg-destructive/10 border border-destructive/20 rounded-lg`}>
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                {open && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-destructive">Alertes Actives</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      23 cas critiques nécessitent votre arbitrage
                    </p>
                  </div>
                )}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Paramètres">
              <Settings className="h-4 w-4" />
              {open && <span>Paramètres</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {open && <span>Déconnexion</span>}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
