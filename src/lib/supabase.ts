import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'learner' | 'mentor';
          bio: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: 'learner' | 'mentor';
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'learner' | 'mentor';
          bio?: string;
          updated_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          title: string;
          description: string;
          sdg_numbers: number[];
          impact_statement: string;
          category: string;
          difficulty_level: 'beginner' | 'intermediate' | 'advanced';
          created_at: string;
        };
      };
      reflections: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          content: string;
          rating: number;
          hours_spent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          content: string;
          rating: number;
          hours_spent: number;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          skill_id: string;
          mentor_id: string;
          max_members: number;
          meeting_schedule: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          skill_id: string;
          mentor_id: string;
          max_members?: number;
          meeting_schedule: string;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
          status: 'active' | 'pending' | 'left';
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          joined_at?: string;
          status?: 'active' | 'pending' | 'left';
        };
      };
    };
  };
};
