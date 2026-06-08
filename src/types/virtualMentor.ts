export type MentorType = 'coach' | 'tutor' | 'guide' | 'challenger';

export type VirtualMentor = {
  id: string;
  user_id: string;
  skill_id: string;
  name: string;
  mentor_type: MentorType;
  personality: string;
  expertise_areas: string[];
  communication_style: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MentorMilestoneJourney = {
  id: string;
  mentor_id: string;
  milestone_id: string;
  journey_content: string;
  resources: string[];
  exercises: string[];
  estimated_hours: number;
  created_at: string;
  updated_at: string;
};

export type MentorJourneyWithMilestone = MentorMilestoneJourney & {
  skill_milestones?: {
    title: string;
    description: string;
    order_index: number;
  };
};

export type VirtualMentorFormData = {
  name: string;
  mentor_type: MentorType;
  personality: string;
  expertise_areas: string[];
  communication_style: string;
};

export type MentorMilestoneJourneyFormData = {
  milestone_id: string;
  journey_content: string;
  resources: string[];
  exercises: string[];
  estimated_hours: number;
};
