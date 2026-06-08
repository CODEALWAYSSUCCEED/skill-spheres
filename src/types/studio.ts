export type Studio = {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  max_learners: number;
  is_active: boolean;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
};

export type StudioPhase = {
  id: string;
  studio_id: string;
  title: string;
  description: string;
  phase_number: number;
  duration_weeks: number;
  created_at: string;
};

export type StudioTask = {
  id: string;
  phase_id: string;
  title: string;
  description: string;
  task_type: 'reading' | 'exercise' | 'project' | 'discussion' | 'quiz';
  is_required: boolean;
  order_index: number;
  estimated_minutes: number;
  created_at: string;
};

export type StudioDeliverable = {
  id: string;
  studio_id: string;
  phase_id: string | null;
  title: string;
  description: string;
  deliverable_type: 'file' | 'url' | 'text' | 'presentation';
  is_required: boolean;
  due_week: number | null;
  order_index: number;
  created_at: string;
};

export type StudioSession = {
  id: string;
  studio_id: string;
  title: string;
  description: string;
  session_date: string | null;
  duration_minutes: number;
  session_type: 'lecture' | 'workshop' | 'office_hours' | 'review';
  recording_url: string | null;
  notes: string | null;
  created_at: string;
};

export type StudioModule = {
  id: string;
  studio_id: string;
  title: string;
  description: string;
  order_index: number;
  content_url: string | null;
  content_type: 'video' | 'article' | 'interactive' | 'pdf';
  duration_minutes: number;
  created_at: string;
};

export type StudioEnrollment = {
  id: string;
  studio_id: string;
  user_id: string;
  role: 'learner' | 'mentor';
  status: 'active' | 'completed' | 'dropped';
  enrolled_at: string;
};

export type StudioTaskCompletion = {
  id: string;
  user_id: string;
  task_id: string;
  studio_id: string;
  completed_at: string;
};

export type StudioSubmission = {
  id: string;
  user_id: string;
  deliverable_id: string;
  studio_id: string;
  submission_url: string | null;
  submission_text: string | null;
  file_path: string | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  mentor_feedback: string | null;
  submitted_at: string;
  updated_at: string;
};

export type StudioProgress = {
  studio_id: string;
  total_tasks: number;
  completed_tasks: number;
  total_deliverables: number;
  submitted_deliverables: number;
  progress_percentage: number;
};
