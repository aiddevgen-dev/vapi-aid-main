import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser } from '@/types/ecommerce';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role?: 'customer' | 'agent' | 'company', phoneNumber?: string, companyName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid callback issues
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data as AppUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // const signUp = async (email: string, password: string, fullName: string, role: 'customer' | 'agent' = 'customer', phoneNumber?: string) => {
  //   const redirectUrl = `${window.location.origin}/`;
    
  //   const { error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: {
  //       emailRedirectTo: redirectUrl,
  //       data: {
  //         full_name: fullName,
  //         role: role,
  //         phone_number: phoneNumber
  //       }
  //     }
  //   });

  //   return { error };
  // };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'customer' | 'agent' | 'company' = 'customer',
    phoneNumber?: string,
    companyName?: string
  ) => {
    try {
      console.log('🔵 Starting signup for:', email, 'role:', role);

      // Step 1: Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: role,
            phone_number: phoneNumber,
            company_name: companyName
          }
        }
      });

      if (error) {
        console.error('❌ Auth signup error:', error);
        return { error };
      }

      if (!data.user) {
        console.error('❌ No user data returned');
        return { error: new Error('No user data returned from signup') };
      }

      console.log('✅ Auth user created:', data.user.id);

      // Small delay to ensure auth user is committed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Insert into users table
      console.log('🔵 Creating user profile...');
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          user_id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
          phone_number: phoneNumber
        });

      if (profileError) {
        console.error('❌ User profile error:', profileError);
        return { error: profileError };
      }

      console.log('✅ User profile created');

      // Step 3: If company, create company record
      if (role === 'company') {
        console.log('🔵 Creating company record...');
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            user_id: data.user.id,
            company_name: companyName || fullName,
            email: email,
            phone: phoneNumber
          });

        if (companyError) {
          console.error('❌ Company record error:', companyError);
          return { error: companyError };
        }

        console.log('✅ Company record created');
      }

      console.log('✅ Signup complete!');
      return { error: null };
    } catch (err: any) {
      console.error('❌ Unexpected signup error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};