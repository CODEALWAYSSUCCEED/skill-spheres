export interface MentorProfile {
  id: string;
  user_id: string;
  bio: string;
  expertise_tags: string[];
  availability: string;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = 'active' | 'completed' | 'paused';

export interface MentorAssignment {
  id: string;
  mentor_id: string;
  learner_id: string;
  skill_id: string | null;
  status: AssignmentStatus;
  assigned_at: string;
  completed_at: string | null;
}

export interface MentorFeedback {
  id: string;
  mentor_id: string;
  reflection_id: string;
  feedback_text: string;
  rating: number;
  created_at: string;
}

export interface MentorStats {
  active_mentees: number;
  pending_reviews: number;
  total_feedback: number;
}
