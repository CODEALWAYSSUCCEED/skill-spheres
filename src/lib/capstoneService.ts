import { supabase } from './supabase';
import type { CapstoneProject, CapstoneProjectWithDetails, CreateCapstoneProjectData, UpdateCapstoneProjectData, CreateWeeklyUpdateData } from '../types/capstone';

export const capstoneService = {
  async getUserCapstoneForSkill(userId: string, skillId: string): Promise<CapstoneProject | null> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching capstone:', error);
      return null;
    }
    return data;
  },

  async getProjectById(projectId: string): Promise<CapstoneProjectWithDetails | null> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }
    return data;
  },

  async saveDraft(userId: string, projectId: string, updates: UpdateCapstoneProjectData): Promise<CapstoneProject | null> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error saving draft:', error);
      return null;
    }
    return data;
  },

  async submitForReview(projectId: string): Promise<CapstoneProject | null> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .update({ status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error submitting capstone:', error);
      return null;
    }
    return data;
  },

  async getProjectsBySkill(skillId: string): Promise<CapstoneProject[]> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .select('*')
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    return data || [];
  },

  async createProject(userId: string, projectData: CreateCapstoneProjectData): Promise<CapstoneProject | null> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .insert({
        user_id: userId,
        ...projectData,
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }
    return data;
  },

  async updateProject(projectId: string, updates: UpdateCapstoneProjectData): Promise<CapstoneProject | null> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return null;
    }
    return data;
  },

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('capstone_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },

  async createWeeklyUpdate(update: CreateWeeklyUpdateData) {
    const { data, error } = await supabase
      .from('capstone_weekly_updates')
      .upsert({
        ...update,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'project_id,week_number' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getDaysRemaining(createdAt: string, durationWeeks = 4): number {
    const start = new Date(createdAt);
    const end = new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  },

  getWeekNumber(createdAt: string): number {
    const start = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.min(4, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
  },
};
