export type CapstoneStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'needs_revision';

export type CapstoneProject = {
  id: string;
  user_id: string;
  skill_id: string;
  title: string;
  description: string;
  status: CapstoneStatus;
  visibility: 'private' | 'mentor_only' | 'community';
  github_url: string | null;
  demo_url: string | null;
  presentation_url: string | null;
  submission_notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CapstoneFeedback = {
  id: string;
  project_id: string;
  mentor_id: string;
  content: string;
  created_at: string;
};

export type CapstoneProjectWithDetails = CapstoneProject & {
  weekly_updates?: CapstoneWeeklyUpdate[];
  feedback?: CapstoneFeedback[];
};

export type CapstoneWeeklyUpdate = {
  id: string;
  project_id: string;
  week_number: number;
  summary: string;
  challenges: string;
  next_steps: string;
  hours_worked: number;
  created_at: string;
  updated_at: string;
};

export type CreateCapstoneProjectData = {
  skill_id: string;
  title: string;
  description: string;
  visibility?: 'private' | 'mentor_only' | 'community';
  github_url?: string;
  demo_url?: string;
  presentation_url?: string;
};

export type UpdateCapstoneProjectData = Partial<CreateCapstoneProjectData> & {
  status?: CapstoneStatus;
  submission_notes?: string;
};

export type CreateWeeklyUpdateData = {
  project_id: string;
  week_number: number;
  summary: string;
  challenges: string;
  next_steps: string;
  hours_worked: number;
};
