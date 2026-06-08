export type ResourceType = 'link' | 'file' | 'article' | 'video' | 'tool' | 'other';
export type VideoKind = 'upload' | 'link' | 'youtube' | 'loom';

export type SkillResource = {
  id: string;
  user_id: string;
  skill_id: string;
  studio_id: string | null;
  title: string;
  description: string;
  type: ResourceType;
  tags: string[];
  resource_kind: 'resource';
  url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  visibility: 'private' | 'shared';
  created_at: string;
  updated_at: string;
};

export type SkillResourceWithUser = SkillResource & {
  users?: {
    full_name: string;
    email: string;
  };
};

export type CreateSkillResourceData = {
  skill_id: string;
  studio_id?: string;
  title: string;
  description?: string;
  type: ResourceType;
  tags?: string[];
  resource_kind: 'resource';
  url?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  visibility?: 'private' | 'shared';
};

export type UpdateSkillResourceData = Partial<CreateSkillResourceData>;

export type VideoReflection = {
  id: string;
  user_id: string;
  skill_id: string;
  studio_id: string | null;
  title: string;
  description: string;
  kind: VideoKind;
  url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  visibility: 'private' | 'shared';
  created_at: string;
  updated_at: string;
};

export type VideoReflectionWithUser = VideoReflection & {
  users?: {
    full_name: string;
    email: string;
  };
};

export type CreateVideoReflectionData = {
  skill_id: string;
  studio_id?: string;
  title: string;
  description?: string;
  kind: VideoKind;
  url?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  thumbnail_url?: string;
  duration_seconds?: number;
  visibility?: 'private' | 'shared';
};

export type UpdateVideoReflectionData = Partial<CreateVideoReflectionData>;

export type Resource = {
  id: string;
  user_id: string;
  skill_id: string | null;
  title: string;
  url: string | null;
  file_path: string | null;
  resource_type: 'link' | 'file';
  tags: string[];
  notes: string | null;
  milestone_id: string | null;
  created_at: string;
};

export type ResourceWithUser = Resource & {
  users?: {
    full_name: string;
    email: string;
  };
};

export type CreateResourceData = {
  skill_id?: string;
  title: string;
  url?: string;
  file_path?: string;
  resource_type: 'link' | 'file';
  tags?: string[];
  notes?: string;
  milestone_id?: string;
};
