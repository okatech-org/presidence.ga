import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour récupérer les feedbacks avec cache optimisé
 */
export const useFeedbacks = () => {
  return useQuery({
    queryKey: ["feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook pour récupérer les KPIs nationaux avec cache
 */
export const useNationalKPIs = () => {
  return useQuery({
    queryKey: ["national-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("national_kpis")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - données moins volatiles
  });
};

/**
 * Hook pour récupérer les tendances mensuelles avec cache
 */
export const useMonthlyTrends = (months: number = 12) => {
  return useQuery({
    queryKey: ["monthly-trends", months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("national_kpis")
        .select("*")
        .order("date", { ascending: false })
        .limit(months);

      if (error) throw error;
      return (data || []).reverse();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer les signalements avec cache
 */
export const useSignalements = () => {
  return useQuery({
    queryKey: ["signalements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signalements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook pour récupérer la configuration iAsted avec cache
 */
export const useIAstedConfig = () => {
  return useQuery({
    queryKey: ["iasted-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iasted_config")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - configuration change rarement
  });
};

/**
 * Hook pour mettre à jour la configuration iAsted avec invalidation du cache
 */
export const useUpdateIAstedConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: any) => {
      const { data, error } = await supabase
        .from("iasted_config")
        .update(config)
        .eq("id", config.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalider le cache pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: ["iasted-config"] });
    },
  });
};

/**
 * Hook pour récupérer les messages de conversation avec cache
 */
export const useConversationMessages = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["conversation-messages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId, // Ne pas exécuter si pas de sessionId
    staleTime: 1 * 60 * 1000, // 1 minute - données conversationnelles
  });
};

/**
 * Hook pour récupérer les rôles utilisateur avec cache
 */
export const useUserRoles = (userId: string | null) => {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes - les rôles changent rarement
  });
};

/**
 * Hook pour récupérer les données d'opinion publique avec cache
 */
export const useOpinionPublique = () => {
  return useQuery({
    queryKey: ["opinion-publique"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opinion_publique")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour invalider manuellement tout le cache (utile après un changement majeur)
 */
export const useInvalidateAllQueries = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries();
  };
};
