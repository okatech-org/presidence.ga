import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePresidentRole = () => {
  const [isPresident, setIsPresident] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkPresidentRole();
  }, []);

  const checkPresidentRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsPresident(false);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      // Vérifier le rôle president/admin dans user_roles
      const { data: rolePresident } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'president')
        .maybeSingle();
      const { data: roleAdmin } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      // Métadonnées (fallback)
      const metaRole = (user.user_metadata?.role as string | undefined) || '';
      const metaLooksPresident = /président/i.test(metaRole);
      const metaLooksSuperAdmin = /super[- ]?admin/i.test(metaRole);

      const hasPresident = !!rolePresident || metaLooksPresident;
      const hasAdmin = !!roleAdmin || metaLooksSuperAdmin;

      setIsPresident(hasPresident || hasAdmin);
      setIsSuperAdmin(hasAdmin);
      setLoading(false);
    } catch (error) {
      console.error("Error checking president role:", error);
      setIsPresident(false);
      setIsSuperAdmin(false);
      setLoading(false);
    }
  };

  return { isPresident, isSuperAdmin, loading };
};
