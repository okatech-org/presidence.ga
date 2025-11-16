import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePresidentRole = () => {
  const [isPresident, setIsPresident] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPresidentRole();
  }, []);

  const checkPresidentRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsPresident(false);
        setLoading(false);
        return;
      }

      // Vérifier le rôle president dans user_roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'president')
        .maybeSingle();

      setIsPresident(!!roles);
      setLoading(false);
    } catch (error) {
      console.error("Error checking president role:", error);
      setIsPresident(false);
      setLoading(false);
    }
  };

  return { isPresident, loading };
};
