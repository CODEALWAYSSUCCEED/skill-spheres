export type ReflectionGroup = {
  id: string;
  skill_id: string;
  user_id: string;
  group_name: string;
  created_at: string;
};

export type LearnerProgress = {
  user_id: string;
  full_name: string;
  email: string;
  skills_progress: number;
  completed_tasks: number;
  total_tasks: number;
  reflections_count: number;
  last_activity: string;
};

export type Reflection = {
  id: string;
  user_id: string;
  skill_id: string;
  content: string;
  rating: number | null;
  hours_spent: number;
  created_at: string;
};
