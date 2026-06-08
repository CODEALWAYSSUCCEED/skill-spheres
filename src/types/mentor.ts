export type MentorProfile = {
  id: string;
  user_id: string;
  bio: string;
  specialties: string[];
  availability: string;
  created_at: string;
};

export type MentorAssignment = {
  id: string;
  mentor_id: string;
  learner_id: string;
  skill_id: string | null;
  studio_id: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
};
