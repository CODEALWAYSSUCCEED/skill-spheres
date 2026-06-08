export interface RubricCriterion {
  id: string;
  category: string;
  criterion_name: string;
  description: string;
  weight: number;
  max_score: number;
  order_index: number;
  created_at: string;
}

export interface CapstoneEvaluation {
  id: string;
  capstone_id: string;
  mentor_id: string;
  criterion_id: string;
  score: number;
  feedback_text: string;
  created_at: string;
  updated_at: string;
}

export interface CapstoneFinalScore {
  id: string;
  capstone_id: string;
  final_score: number;
  percentage: number;
  badge_level: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Revision Required';
  evaluated_by: string;
  evaluation_notes: string;
  evaluated_at: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvaluationWithCriterion extends CapstoneEvaluation {
  criterion: RubricCriterion;
}

export interface FinalScoreWithEvaluator extends CapstoneFinalScore {
  evaluator?: {
    full_name: string;
    email: string;
  };
}
