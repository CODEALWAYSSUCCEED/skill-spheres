export type RubricCriterion = {
  id: string;
  title: string;
  description: string;
  max_score: number;
  weight: number;
  order_index: number;
  skill_id: string | null;
  is_universal: boolean;
};

export type CapstoneEvaluation = {
  id: string;
  project_id: string;
  mentor_id: string;
  criterion_id: string;
  score: number;
  feedback: string | null;
  created_at: string;
};

export type CapstoneFinalScore = {
  id: string;
  project_id: string;
  mentor_id: string;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  letter_grade: string;
  is_visible_to_learner: boolean;
  feedback: string | null;
  evaluated_at: string;
};

export type EvaluationWithCriterion = CapstoneEvaluation & {
  rubric_criteria: RubricCriterion;
};

export type FinalScoreWithEvaluator = CapstoneFinalScore & {
  users: {
    full_name: string;
    email: string;
  };
};
