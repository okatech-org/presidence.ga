import { Home, Shield, User, Mic, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import emblemGabon from "@/assets/emblem_gabon.png";

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

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

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
      </SidebarContent>
    </Sidebar>
  );
}
