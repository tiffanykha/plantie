import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
    session: Session | null;
    user: User | null;
    isInitialized: boolean;
    setSession: (session: Session | null) => void;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    isInitialized: false,

    setSession: (session) => set({ session, user: session?.user || null, isInitialized: true }),

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user || null, isInitialized: true });

            supabase.auth.onAuthStateChange((_event, session) => {
                set({ session, user: session?.user || null, isInitialized: true });
            });
        } catch (e) {
            console.error('Error initializing auth:', e);
            set({ isInitialized: true });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
    },

    updateProfile: async (name: string) => {
        const { data, error } = await supabase.auth.updateUser({
            data: { displayName: name }
        });
        if (error) throw error;
        set({ user: data.user });
    }
}));
