import { supabase } from './supabase';
import type { RubricCriterion, CapstoneEvaluation, CapstoneFinalScore, EvaluationWithCriterion, FinalScoreWithEvaluator } from '../types/rubric';

function mapToRubricCategory(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('ai') || cat.includes('machine learning') || cat.includes('data science') || cat.includes('intelligent')) return 'AI';
  if (cat.includes('spiritual') || cat.includes('inner') || cat.includes('mindfulness') || cat.includes('faith')) return 'Spiritual';
  if (
    cat.includes('humanities') || cat.includes('arts') || cat.includes('creative') ||
    cat.includes('social') || cat.includes('governance') || cat.includes('policy') ||
    cat.includes('mental health') || cat.includes('human') || cat.includes('leadership') ||
    cat.includes('communication') || cat.includes('expression')
  ) return 'Humanities';
  if (
    cat.includes('math') || cat.includes('science') || cat.includes('engineering') ||
    cat.includes('technology') || cat.includes('computer') || cat.includes('coding') ||
    cat.includes('cyber') || cat.includes('cloud') || cat.includes('biotech') ||
    cat.includes('stem') || cat.includes('academic') || cat.includes('digital')
  ) return 'STEM';
  return 'Universal';
}

export async function getRubricCriteria(category: string): Promise<RubricCriterion[]> {
  const rubricCategory = mapToRubricCategory(category);

  const { data, error } = await supabase
    .from('capstone_rubric_criteria')
    .select('*')
    .eq('category', rubricCategory)
    .order('order_index');

  if (error) throw error;

  if (!data || data.length === 0) {
    const { data: universal, error: uErr } = await supabase
      .from('capstone_rubric_criteria')
      .select('*')
      .eq('category', 'Universal')
      .order('order_index');
    if (uErr) throw uErr;
    return universal || [];
  }

  return data;
}

export async function getUniversalRubricCriteria(): Promise<RubricCriterion[]> {
  return getRubricCriteria('Universal');
}

export async function getCapstoneEvaluations(capstoneId: string): Promise<EvaluationWithCriterion[]> {
  const { data, error } = await supabase
    .from('capstone_evaluations')
    .select(`
      *,
      criterion:capstone_rubric_criteria(*)
    `)
    .eq('capstone_id', capstoneId)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

export async function saveEvaluation(
  capstoneId: string,
  criterionId: string,
  score: number,
  feedbackText: string
): Promise<CapstoneEvaluation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('capstone_evaluations')
    .upsert({
      capstone_id: capstoneId,
      mentor_id: user.id,
      criterion_id: criterionId,
      score,
      feedback_text: feedbackText,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'capstone_id,criterion_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function calculateAndSaveFinalScore(
  capstoneId: string,
  evaluationNotes: string = ''
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('calculate_capstone_final_score', {
    p_capstone_id: capstoneId,
    p_mentor_id: user.id,
    p_evaluation_notes: evaluationNotes
  });

  if (error) throw error;
}

export async function getFinalScore(capstoneId: string): Promise<FinalScoreWithEvaluator | null> {
  const { data, error } = await supabase
    .from('capstone_final_scores')
    .select(`
      *,
      evaluator:users!capstone_final_scores_evaluated_by_fkey(full_name, email)
    `)
    .eq('capstone_id', capstoneId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateScoreVisibility(
  capstoneId: string,
  isPublic: boolean
): Promise<void> {
  const { error } = await supabase
    .from('capstone_final_scores')
    .update({ is_public: isPublic })
    .eq('capstone_id', capstoneId);

  if (error) throw error;
}

export async function getUserBadges(userId: string): Promise<{ skillTitle: string; badge: string; score: number }[]> {
  const { data, error } = await supabase
    .from('capstone_final_scores')
    .select(`
      final_score,
      badge_level,
      capstone:capstone_projects!inner(
        skill:skills!inner(title)
      )
    `)
    .eq('capstone_projects.user_id', userId)
    .gte('final_score', 2.25);

  if (error) throw error;

  return (data || []).map(item => ({
    skillTitle: item.capstone?.skill?.title || 'Unknown Skill',
    badge: item.badge_level,
    score: item.final_score
  }));
}

export function getBadgeColor(badge: string): string {
  switch (badge) {
    case 'Platinum':
      return 'from-purple-500 to-pink-500';
    case 'Gold':
      return 'from-yellow-400 to-orange-500';
    case 'Silver':
      return 'from-gray-300 to-gray-500';
    case 'Bronze':
      return 'from-orange-400 to-amber-600';
    default:
      return 'from-red-400 to-red-600';
  }
}

export function getBadgeIcon(badge: string): string {
  switch (badge) {
    case 'Platinum':
      return '💎';
    case 'Gold':
      return '🥇';
    case 'Silver':
      return '🥈';
    case 'Bronze':
      return '🥉';
    default:
      return '📝';
  }
}
