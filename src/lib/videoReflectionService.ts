import { supabase } from './supabase';
import type {
  VideoReflection,
  VideoReflectionWithUser,
  CreateVideoReflectionData,
  UpdateVideoReflectionData
} from '../types/resource';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
];

const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

export const videoReflectionService = {
  async getUserReflectionsForSkill(userId: string, skillId: string): Promise<VideoReflection[]> {
    const { data, error } = await supabase
      .from('video_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSharedReflectionsForSkill(skillId: string): Promise<VideoReflectionWithUser[]> {
    const { data, error } = await supabase
      .from('video_reflections')
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

  async createReflection(userId: string, reflectionData: CreateVideoReflectionData): Promise<VideoReflection> {
    const { data, error } = await supabase
      .from('video_reflections')
      .insert({
        user_id: userId,
        skill_id: reflectionData.skill_id,
        studio_id: reflectionData.studio_id || null,
        title: reflectionData.title,
        notes: reflectionData.notes || '',
        video_kind: reflectionData.video_kind,
        external_url: reflectionData.external_url || null,
        video_url: reflectionData.video_url || null,
        file_name: reflectionData.file_name || null,
        file_type: reflectionData.file_type || null,
        file_size: reflectionData.file_size || null,
        visibility: reflectionData.visibility || 'private',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateReflection(reflectionId: string, updates: UpdateVideoReflectionData): Promise<VideoReflection> {
    const { data, error } = await supabase
      .from('video_reflections')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reflectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleVisibility(reflectionId: string, currentVisibility: string): Promise<VideoReflection> {
    const newVisibility = currentVisibility === 'private' ? 'shared' : 'private';

    const { data, error } = await supabase
      .from('video_reflections')
      .update({
        visibility: newVisibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reflectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteReflection(reflectionId: string, videoUrl?: string | null): Promise<void> {
    if (videoUrl) {
      const { error: storageError } = await supabase.storage
        .from('video-reflections-uploads')
        .remove([videoUrl]);

      if (storageError) {
        console.error('Error deleting video from storage:', storageError);
      }
    }

    const { error } = await supabase
      .from('video_reflections')
      .delete()
      .eq('id', reflectionId);

    if (error) throw error;
  },

  async uploadVideo(userId: string, file: File): Promise<{ url: string; name: string; type: string; size: number }> {
    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error(`Video size must be less than ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
    }

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(fileExt)) {
      throw new Error(`Video type not allowed. Allowed types: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`);
    }

    if (!ALLOWED_VIDEO_TYPES.includes(file.type) && file.type !== '') {
      throw new Error(`Video type not allowed. Allowed types: MP4, MOV, WEBM`);
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('video-reflections-uploads')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return {
      url: filePath,
      name: file.name,
      type: file.type,
      size: file.size,
    };
  },

  async getVideoUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('video-reflections-uploads')
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

  extractVideoId(url: string): { platform: string; id: string } | null {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/;
    const loomRegex = /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/;

    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return { platform: 'youtube', id: youtubeMatch[1] };
    }

    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return { platform: 'vimeo', id: vimeoMatch[1] };
    }

    const loomMatch = url.match(loomRegex);
    if (loomMatch) {
      return { platform: 'loom', id: loomMatch[1] };
    }

    return null;
  },

  getEmbedUrl(url: string): string | null {
    const videoInfo = this.extractVideoId(url);
    if (!videoInfo) return null;

    switch (videoInfo.platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${videoInfo.id}`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${videoInfo.id}`;
      case 'loom':
        return `https://www.loom.com/embed/${videoInfo.id}`;
      default:
        return null;
    }
  },
};
