
import { supabase } from "@/integrations/supabase/client";
import { OfficialEvent, Guest, ProtocolProcedure } from "@/types/protocol";

export const protocolService = {
    // Events
    async getEvents() {
        const { data, error } = await supabase
            .from("official_events")
            .select("*")
            .order("date", { ascending: true });

        if (error) throw error;
        return data as OfficialEvent[];
    },

    async createEvent(event: Omit<OfficialEvent, "id" | "created_at">) {
        const { data, error } = await supabase
            .from("official_events")
            .insert(event)
            .select()
            .single();

        if (error) throw error;
        return data as OfficialEvent;
    },

    async updateEvent(id: string, updates: Partial<OfficialEvent>) {
        const { data, error } = await supabase
            .from("official_events")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as OfficialEvent;
    },

    async deleteEvent(id: string) {
        const { error } = await supabase
            .from("official_events")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    // Guests
    async getGuests(eventId?: string) {
        let query = supabase
            .from("guest_lists")
            .select("*")
            .order("created_at", { ascending: false });

        if (eventId) {
            query = query.eq("event_id", eventId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Guest[];
    },

    async addGuest(guest: Omit<Guest, "id" | "created_at">) {
        const { data, error } = await supabase
            .from("guest_lists")
            .insert(guest)
            .select()
            .single();

        if (error) throw error;
        return data as Guest;
    },

    async updateGuest(id: string, updates: Partial<Guest>) {
        const { data, error } = await supabase
            .from("guest_lists")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as Guest;
    },

    async deleteGuest(id: string) {
        const { error } = await supabase
            .from("guest_lists")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    // Procedures
    async getProcedures() {
        const { data, error } = await supabase
            .from("protocol_procedures")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as ProtocolProcedure[];
    },

    async createProcedure(procedure: Omit<ProtocolProcedure, "id" | "created_at">) {
        const { data, error } = await supabase
            .from("protocol_procedures")
            .insert(procedure)
            .select()
            .single();

        if (error) throw error;
        return data as ProtocolProcedure;
    },

    async updateProcedure(id: string, updates: Partial<ProtocolProcedure>) {
        const { data, error } = await supabase
            .from("protocol_procedures")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as ProtocolProcedure;
    },

    async deleteProcedure(id: string) {
        const { error } = await supabase
            .from("protocol_procedures")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
};
