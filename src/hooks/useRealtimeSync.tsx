import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeSyncOptions {
  table: string;
  queryKey: string[];
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  enabled?: boolean;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

/**
 * Hook pour synchroniser automatiquement React Query avec Supabase Realtime
 * Invalide le cache et rafraîchit les données quand des changements se produisent
 */
export const useRealtimeSync = ({
  table,
  queryKey,
  event = "*",
  schema = "public",
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeSyncOptions) => {
  const queryClient = useQueryClient();

  // Utiliser des refs pour les callbacks afin d'éviter de déclencher l'effet quand ils changent
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    if (!enabled) return;

    console.log(`[Realtime Sync] Subscribing to ${table} table changes...`);

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes" as any,
        {
          event,
          schema,
          table,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[Realtime Sync] Change detected in ${table}:`, payload.eventType);

          // Exécuter les callbacks via refs
          if (payload.eventType === "INSERT" && onInsertRef.current) {
            onInsertRef.current(payload);
          } else if (payload.eventType === "UPDATE" && onUpdateRef.current) {
            onUpdateRef.current(payload);
          } else if (payload.eventType === "DELETE" && onDeleteRef.current) {
            onDeleteRef.current(payload);
          }

          // Invalider le cache React Query pour forcer un refresh
          queryClient.invalidateQueries({ queryKey });
          console.log(`[Realtime Sync] Cache invalidated for:`, queryKey);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime Sync] ✓ Successfully subscribed to ${table}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[Realtime Sync] ✗ Failed to subscribe to ${table}`);
        }
      });

    // Cleanup: se désabonner au démontage
    return () => {
      console.log(`[Realtime Sync] Unsubscribing from ${table}...`);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, event, schema, enabled, queryClient, JSON.stringify(queryKey)]);
};

/**
 * Hook pour synchroniser les KPIs nationaux en temps réel
 */
export const useRealtimeNationalKPIs = (enabled = true) => {
  const queryClient = useQueryClient();

  useRealtimeSync({
    table: "national_kpis",
    queryKey: ["national-kpis"],
    enabled,
    onInsert: () => {
      // Aussi invalider les tendances mensuelles
      queryClient.invalidateQueries({ queryKey: ["monthly-trends"] });
    },
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-trends"] });
    },
  });
};

/**
 * Hook pour synchroniser les signalements en temps réel
 */
export const useRealtimeSignalements = (enabled = true) => {
  useRealtimeSync({
    table: "signalements",
    queryKey: ["signalements"],
    enabled,
  });
};

/**
 * Hook pour synchroniser l'opinion publique en temps réel
 */
export const useRealtimeOpinionPublique = (enabled = true) => {
  useRealtimeSync({
    table: "opinion_publique",
    queryKey: ["opinion-publique"],
    enabled,
  });
};

/**
 * Hook pour synchroniser les feedbacks en temps réel
 */
export const useRealtimeFeedbacks = (enabled = true) => {
  useRealtimeSync({
    table: "role_feedback",
    queryKey: ["feedbacks"],
    enabled,
  });
};

/**
 * Hook pour synchroniser la config iAsted en temps réel
 */
export const useRealtimeIAstedConfig = (enabled = true) => {
  useRealtimeSync({
    table: "iasted_config",
    queryKey: ["iasted-config"],
    enabled,
  });
};

/**
 * Hook pour synchroniser les messages de conversation en temps réel
 */
export const useRealtimeConversationMessages = (
  sessionId: string | null,
  enabled = true
) => {
  useRealtimeSync({
    table: "conversation_messages",
    queryKey: ["conversation-messages", sessionId],
    enabled: enabled && !!sessionId,
  });
};

/**
 * Hook pour synchroniser les décisions présidentielles en temps réel
 */
export const useRealtimePresidentialDecisions = (enabled = true) => {
  useRealtimeSync({
    table: "presidential_decisions",
    queryKey: ["presidential-decisions"],
    enabled,
  });
};

/**
 * Hook pour synchroniser les rôles utilisateur en temps réel
 */
export const useRealtimeUserRoles = (userId: string | null, enabled = true) => {
  useRealtimeSync({
    table: "user_roles",
    queryKey: ["user-roles", userId],
    enabled: enabled && !!userId,
  });
};

/**
 * Hook combiné pour synchroniser toutes les données du dashboard présidentiel
 */
export const useRealtimePresidentDashboard = (enabled = true) => {
  useRealtimeNationalKPIs(enabled);
  useRealtimeSignalements(enabled);
  useRealtimeOpinionPublique(enabled);
  useRealtimePresidentialDecisions(enabled);

  console.log("[Realtime Sync] President dashboard realtime sync active");
};

/**
 * Hook combiné pour synchroniser toutes les données du dashboard admin
 */
export const useRealtimeAdminDashboard = (enabled = true) => {
  useRealtimeFeedbacks(enabled);

  console.log("[Realtime Sync] Admin dashboard realtime sync active");
};
