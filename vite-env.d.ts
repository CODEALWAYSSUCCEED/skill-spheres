export type CapstoneStatus = 'planning' | 'in_progress' | 'completed' | 'submitted';
export type CapstoneVisibility = 'private' | 'shared';

export interface CapstoneProject {
  id: string;
  skill_id: string;
  user_id: string;
  title: string;
  description: string;
  start_date: string;
  target_end_date: string;
  actual_end_date: string | null;
  status: CapstoneStatus;
  presentation_url: string | null;
  presentation_file_name: string | null;
  presentation_file_type: string | null;
  presentation_file_size: number | null;
  github_repo_url: string | null;
  live_demo_url: string | null;
  notes: string;
  visibility: CapstoneVisibility;
  created_at: string;
  updated_at: string;
}

export interface CapstoneProjectWithDetails extends CapstoneProject {
  skill?: {
    id: string;
    title: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  weekly_updates?: CapstoneWeeklyUpdate[];
  feedback?: CapstoneFeedback[];
}

export interface CapstoneWeeklyUpdate {
  id: string;
  capstone_project_id: string;
  week_number: number;
  update_text: string;
  challenges: string;
  learnings: string;
  next_steps: string;
  created_at: string;
  updated_at: string;
}

export interface CapstoneFeedback {
  id: string;
  capstone_project_id: string;
  reviewer_id: string;
  feedback_text: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  reviewer?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface CreateCapstoneProjectData {
  skill_id: string;
  title: string;
  description?: string;
  start_date?: string;
  status?: CapstoneStatus;
  github_repo_url?: string;
  live_demo_url?: string;
  notes?: string;
  visibility?: CapstoneVisibility;
}

export interface UpdateCapstoneProjectData {
  title?: string;
  description?: string;
  start_date?: string;
  actual_end_date?: string | null;
  status?: CapstoneStatus;
  presentation_url?: string | null;
  presentation_file_name?: string | null;
  presentation_file_type?: string | null;
  presentation_file_size?: number | null;
  github_repo_url?: string | null;
  live_demo_url?: string | null;
  notes?: string;
  visibility?: CapstoneVisibility;
}

export interface CreateWeeklyUpdateData {
  capstone_project_id: string;
  week_number: number;
  update_text?: string;
  challenges?: string;
  learnings?: string;
  next_steps?: string;
}

export interface UpdateWeeklyUpdateData {
  update_text?: string;
  challenges?: string;
  learnings?: string;
  next_steps?: string;
}

export interface CreateFeedbackData {
  capstone_project_id: string;
  feedback_text: string;
  rating?: number | null;
}

export interface UpdateFeedbackData {
  feedback_text?: string;
  rating?: number | null;
}
