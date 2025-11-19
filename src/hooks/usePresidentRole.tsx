import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePresidentRole = () => {
  const [isPresident, setIsPresident] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkPresidentRole = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsPresident(false);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      // Une seule requête avec OR pour optimiser
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['president', 'admin']);

      // Only trust database roles, never client-controllable metadata
      const hasPresidentRole = roles?.some(r => r.role === 'president') || false;
      const hasAdminRole = roles?.some(r => r.role === 'admin') || false;

      setIsPresident(hasPresidentRole || hasAdminRole);
      setIsSuperAdmin(hasAdminRole);
      setLoading(false);
    } catch (error) {
      console.error("Error checking president role:", error);
      setIsPresident(false);
      setIsSuperAdmin(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPresidentRole();
  }, [checkPresidentRole]);

  return { isPresident, isSuperAdmin, loading };
};
