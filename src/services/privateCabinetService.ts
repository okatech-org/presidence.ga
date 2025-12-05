import { supabase } from "@/integrations/supabase/client";
import type {
    PrivateAudience,
    EncryptedMessage,
    PersonalCorrespondence,
    VIPContact,
    PrivateTrip
} from "@/types/private-cabinet-types";

export class PrivateCabinetService {
    // ==================== AUDIENCES ====================

    async getAudiences(userId: string): Promise<PrivateAudience[]> {
        const { data, error } = await supabase
            .from("private_audiences")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: true });

        if (error) throw error;
        return data as PrivateAudience[];
    }

    async createAudience(audience: Omit<PrivateAudience, "id" | "created_at">): Promise<PrivateAudience> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from("private_audiences")
            .insert({
                ...audience,
                user_id: user.id,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as PrivateAudience;
    }

    async updateAudience(id: string, updates: Partial<PrivateAudience>): Promise<PrivateAudience> {
        const { data, error } = await supabase
            .from("private_audiences")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as PrivateAudience;
    }

    async deleteAudience(id: string): Promise<void> {
        const { error } = await supabase
            .from("private_audiences")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }

    // ==================== MESSAGES ====================

    async getMessages(userId: string): Promise<EncryptedMessage[]> {
        const { data, error } = await supabase
            .from("encrypted_messages")
            .select("*")
            .eq("recipient_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as EncryptedMessage[];
    }

    async createMessage(message: Omit<EncryptedMessage, "id" | "created_at" | "sender_id">): Promise<EncryptedMessage> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from("encrypted_messages")
            .insert({
                ...message,
                sender_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as EncryptedMessage;
    }

    async markMessageAsRead(id: string): Promise<void> {
        const { error } = await supabase
            .from("encrypted_messages")
            .update({ is_read: true })
            .eq("id", id);

        if (error) throw error;
    }

    async deleteMessage(id: string): Promise<void> {
        const { error } = await supabase
            .from("encrypted_messages")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }

    // ==================== CORRESPONDENCE ====================

    async getCorrespondence(userId: string): Promise<PersonalCorrespondence[]> {
        const { data, error } = await supabase
            .from("personal_correspondence")
            .select("*")
            .eq("user_id", userId)
            .order("received_date", { ascending: false });

        if (error) throw error;
        return data as PersonalCorrespondence[];
    }

    async updateCorrespondenceStatus(
        id: string,
        status: PersonalCorrespondence["status"]
    ): Promise<PersonalCorrespondence> {
        const { data, error } = await supabase
            .from("personal_correspondence")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as PersonalCorrespondence;
    }

    async archiveCorrespondence(id: string): Promise<void> {
        await this.updateCorrespondenceStatus(id, "archive");
    }

    async updateCorrespondence(
        id: string,
        updates: Partial<PersonalCorrespondence>
    ): Promise<PersonalCorrespondence> {
        const { data, error } = await supabase
            .from("personal_correspondence")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as PersonalCorrespondence;
    }

    // ==================== VIP CONTACTS ====================

    async getVIPContacts(userId: string): Promise<VIPContact[]> {
        const { data, error } = await supabase
            .from("vip_contacts")
            .select("*")
            .eq("user_id", userId)
            .order("is_favorite", { ascending: false })
            .order("name", { ascending: true });

        if (error) throw error;
        return data as VIPContact[];
    }

    async createVIPContact(contact: Omit<VIPContact, "id" | "created_at">): Promise<VIPContact> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from("vip_contacts")
            .insert({
                ...contact,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as VIPContact;
    }

    async updateVIPContact(id: string, updates: Partial<VIPContact>): Promise<VIPContact> {
        const { data, error } = await supabase
            .from("vip_contacts")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as VIPContact;
    }

    async deleteVIPContact(id: string): Promise<void> {
        const { error } = await supabase
            .from("vip_contacts")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }

    async toggleContactFavorite(id: string, isFavorite: boolean): Promise<VIPContact> {
        return this.updateVIPContact(id, { is_favorite: isFavorite });
    }

    // ==================== TRIPS ====================

    async getTrips(userId: string): Promise<PrivateTrip[]> {
        const { data, error } = await supabase
            .from("private_trips")
            .select("*")
            .eq("user_id", userId)
            .order("start_date", { ascending: true });

        if (error) throw error;
        return data as PrivateTrip[];
    }

    async createTrip(trip: Omit<PrivateTrip, "id" | "created_at">): Promise<PrivateTrip> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from("private_trips")
            .insert({
                ...trip,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as PrivateTrip;
    }

    async updateTrip(id: string, updates: Partial<PrivateTrip>): Promise<PrivateTrip> {
        const { data, error } = await supabase
            .from("private_trips")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as PrivateTrip;
    }

    async deleteTrip(id: string): Promise<void> {
        const { error } = await supabase
            .from("private_trips")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
}

// Export singleton instance
export const privateCabinetService = new PrivateCabinetService();
