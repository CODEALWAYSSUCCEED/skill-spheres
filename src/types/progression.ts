export type UserSkill = {
  id: string;
  user_id: string;
  skill_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Milestone = {
  id: string;
  skill_id: string;
  title: string;
  description: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
};

export type UserMilestone = {
  id: string;
  user_id: string;
  milestone_id: string;
  completed_at: string;
};

export type MilestoneWithCompletion = Milestone & {
  completed: boolean;
  completed_at: string | null;
};

export type SkillProgress = {
  skill_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  total_milestones: number;
  completed_milestones: number;
  required_milestones: number;
  completed_required_milestones: number;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
};
