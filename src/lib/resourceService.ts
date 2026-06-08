import { supabase } from './supabase';
import type { Resource, CreateResourceData } from '../types/resource';

export const resourceService = {
  async getUserResources(userId: string, skillId?: string): Promise<Resource[]> {
    let query = supabase
      .from('skill_resources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (skillId) {
      query = query.eq('skill_id', skillId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createResource(userId: string, resourceData: CreateResourceData): Promise<Resource> {
    const { data, error } = await supabase
      .from('skill_resources')
      .insert({ user_id: userId, ...resourceData })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateResource(resourceId: string, updates: Partial<CreateResourceData>): Promise<Resource> {
    const { data, error } = await supabase
      .from('skill_resources')
      .update(updates)
      .eq('id', resourceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteResource(resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('skill_resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
  },

  async toggleVisibility(resourceId: string, currentVisibility: string): Promise<Resource> {
    const newVisibility = currentVisibility === 'private' ? 'shared' : 'private';
    const { data, error } = await supabase
      .from('skill_resources')
      .update({ visibility: newVisibility })
      .eq('id', resourceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};
