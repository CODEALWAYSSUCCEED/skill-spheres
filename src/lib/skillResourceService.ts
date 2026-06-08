import { supabase } from './supabase';
import type {
  SkillResource,
  SkillResourceWithUser,
  CreateSkillResourceData,
  UpdateSkillResourceData
} from '../types/resource';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
];

const ALLOWED_FILE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.webp', '.txt'
];

export const skillResourceService = {
  async getUserResourcesForSkill(userId: string, skillId: string): Promise<SkillResource[]> {
    const { data, error } = await supabase
      .from('skill_resources')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSharedResourcesForSkill(skillId: string): Promise<SkillResourceWithUser[]> {
    const { data, error } = await supabase
      .from('skill_resources')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .eq('skill_id', skillId)
      .eq('visibility', 'shared')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createResource(userId: string, resourceData: CreateSkillResourceData): Promise<SkillResource> {
    const { data, error } = await supabase
      .from('skill_resources')
      .insert({
        user_id: userId,
        skill_id: resourceData.skill_id,
        studio_id: resourceData.studio_id || null,
        title: resourceData.title,
        description: resourceData.description || '',
        type: resourceData.type,
        tags: resourceData.tags || [],
        resource_kind: resourceData.resource_kind,
        url: resourceData.url || null,
        file_url: resourceData.file_url || null,
        file_name: resourceData.file_name || null,
        file_type: resourceData.file_type || null,
        file_size: resourceData.file_size || null,
        visibility: resourceData.visibility || 'private',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateResource(resourceId: string, updates: UpdateSkillResourceData): Promise<SkillResource> {
    const { data, error } = await supabase
      .from('skill_resources')
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

  async toggleVisibility(resourceId: string, currentVisibility: string): Promise<SkillResource> {
    const newVisibility = currentVisibility === 'private' ? 'shared' : 'private';

    const { data, error } = await supabase
      .from('skill_resources')
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

  async deleteResource(resourceId: string, fileUrl?: string | null): Promise<void> {
    if (fileUrl) {
      const { error: storageError } = await supabase.storage
        .from('skill-resources-uploads')
        .remove([fileUrl]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
    }

    const { error } = await supabase
      .from('skill_resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
  },

  async uploadFile(userId: string, file: File): Promise<{ url: string; name: string; type: string; size: number }> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExt)) {
      throw new Error(`File type not allowed. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
      throw new Error(`File type not allowed. Allowed types: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, WEBP, TXT`);
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('skill-resources-uploads')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return {
      url: filePath,
      name: file.name,
      type: file.type,
      size: file.size,
    };
  },

  async getFileUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('skill-resources-uploads')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  fuzzySearch(items: SkillResourceWithUser[], query: string): SkillResourceWithUser[] {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();

    return items
      .map(item => {
        let score = 0;
        const title = item.title.toLowerCase();
        const description = item.description.toLowerCase();
        const tags = item.tags.map(t => t.toLowerCase()).join(' ');

        if (title.includes(lowerQuery)) score += 10;
        if (description.includes(lowerQuery)) score += 5;
        if (tags.includes(lowerQuery)) score += 3;

        const words = lowerQuery.split(' ').filter(w => w.length > 0);
        words.forEach(word => {
          if (title.includes(word)) score += 2;
          if (description.includes(word)) score += 1;
        });

        return { item, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  },
};
