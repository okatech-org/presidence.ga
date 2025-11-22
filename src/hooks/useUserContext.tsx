import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasIAstedAccess, getRoleContext, SPACE_CONTEXTS, type AppRole, type RoleContext, type SpaceContext } from '@/config/role-contexts';

export interface UserProfile {
    id: string;
    user_id: string;
    gender: 'male' | 'female' | 'other';
    preferred_title: string | null;
    full_name: string | null;
    tone_preference: 'formal' | 'professional';
}

export interface UserContext {
    userId: string | null;
    role: AppRole | null;
    profile: UserProfile | null;
    roleContext: RoleContext | null;
    spaceContext: SpaceContext | null;
    hasIAstedAccess: boolean;
    isLoading: boolean;
}

interface UseUserContextOptions {
    spaceName?: string; // e.g., 'PresidentSpace', 'CabinetDirectorSpace'
}

/**
 * Hook to get user context (role, profile, permissions)
 * This provides all necessary information for personalizing iAsted
 */
export function useUserContext(options: UseUserContextOptions = {}): UserContext {
    const { spaceName } = options;
    const [userId, setUserId] = useState<string | null>(null);
    const [role, setRole] = useState<AppRole | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user, role, and profile
    useEffect(() => {
        async function fetchUserContext() {
            try {
                setIsLoading(true);

                // 1. Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setUserId(null);
                    setRole(null);
                    setProfile(null);
                    setIsLoading(false);
                    return;
                }

                setUserId(user.id);

                // 2. Get user role (fetch first role, prioritize highest)
                const { data: roles } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id);

                if (roles && roles.length > 0) {
                    // Priority order for roles
                    const rolePriority: AppRole[] = [
                        'president',
                        'admin',
                        'dgr',
                        'cabinet_private',
                        'sec_gen',
                        'dgss',
                        'protocol',
                        'minister',
                        'courrier',
                        'reception',
                        'user'
                    ];

                    const userRole = rolePriority.find(r =>
                        roles.some(roleData => roleData.role === r)
                    ) || roles[0].role;

                    setRole(userRole);
                } else {
                    setRole(null);
                }

                // 3. Get user profile
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                setProfile(profileData as UserProfile | null);

            } catch (error) {
                console.error('[useUserContext] Error fetching user context:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUserContext();
    }, []);

    // Derived values
    const roleContext = useMemo(() => getRoleContext(role), [role]);
    const spaceContext = useMemo(() => {
        if (!spaceName) return null;
        return SPACE_CONTEXTS[spaceName] || null;
    }, [spaceName]);

    const hasAccess = useMemo(() => hasIAstedAccess(role), [role]);

    return {
        userId,
        role,
        profile,
        roleContext,
        spaceContext,
        hasIAstedAccess: hasAccess,
        isLoading
    };
}
