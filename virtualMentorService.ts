import { supabase } from './supabase';
import type { Resource, ResourceWithUser, CreateResourceData, UpdateResourceData } from '../types/resource';

export const resourceService = {
  async getUserResources(userId: string): Promise<ResourceWithUser[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        skill:linked_skill_id (
          id,
          title
        ),
        milestone:milestone_id (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSharedResources(filters?: {
    skillId?: string;
    studioId?: string;
    type?: string;
    searchQuery?: string;
  }): Promise<ResourceWithUser[]> {
    let query = supabase
      .from('resources')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .eq('visibility', 'shared');

    if (filters?.skillId) {
      query = query.eq('linked_skill_id', filters.skillId);
    }

    if (filters?.studioId) {
      query = query.eq('linked_studio_id', filters.studioId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createResource(userId: string, resourceData: CreateResourceData): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        user_id: userId,
        title: resourceData.title,
        url: resourceData.url,
        description: resourceData.description || '',
        type: resourceData.type,
        tags: resourceData.tags || [],
        linked_skill_id: resourceData.linked_skill_id || null,
        linked_studio_id: resourceData.linked_studio_id || null,
        milestone_id: resourceData.milestone_id || null,
        visibility: resourceData.visibility || 'private',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateResource(resourceId: string, updates: UpdateResourceData): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resourceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleVisibility(resourceId: string, currentVisibility: string): Promise<Resource> {
    const newVisibility = currentVisibility === 'private' ? 'shared' : 'private';

    const { data, error } = await supabase
      .from('resources')
      .update({
        visibility: newVisibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resourceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteResource(resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
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
