import { supabase } from './supabase';

export interface SkillMilestone {
  id: string;
  skill_id: string;
  title: string;
  description: string | null;
  type: 'reading' | 'practice' | 'exercise' | 'upload' | 'reflection' | 'quiz' | 'project' | null;
  is_required: boolean;
  order_index: number;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserSkillMilestone {
  id: string;
  user_id: string;
  skill_id: string;
  milestone_id: string;
  status: 'not_started' | 'completed';
  completed_at: string | null;
  updated_at: string;
}

export interface MilestoneWithCompletion extends SkillMilestone {
  user_completion?: UserSkillMilestone | null;
}

export async function getSkillMilestones(skillId: string): Promise<SkillMilestone[]> {
  const { data, error } = await supabase
    .from('skill_milestones')
    .select('*')
    .eq('skill_id', skillId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getSkillMilestonesWithCompletion(
  skillId: string,
  userId: string
): Promise<MilestoneWithCompletion[]> {
  const milestones = await getSkillMilestones(skillId);

  const { data: completions } = await supabase
    .from('user_skill_milestones')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId);

  const completionMap = new Map(
    (completions || []).map(c => [c.milestone_id, c])
  );

  return milestones.map(milestone => ({
    ...milestone,
    user_completion: completionMap.get(milestone.id) || null
  }));
}

export async function toggleMilestoneCompletion(
  userId: string,
  skillId: string,
  milestoneId: string,
  currentStatus: 'not_started' | 'completed'
): Promise<UserSkillMilestone> {
  const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';

  const { data: existing } = await supabase
    .from('user_skill_milestones')
    .select('*')
    .eq('user_id', userId)
    .eq('milestone_id', milestoneId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('user_skill_milestones')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('user_skill_milestones')
      .insert({
        user_id: userId,
        skill_id: skillId,
        milestone_id: milestoneId,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function calculateSkillProgress(
  userId: string,
  skillId: string
): Promise<number> {
  const { data, error } = await supabase
    .rpc('calculate_skill_progress', {
      p_user_id: userId,
      p_skill_id: skillId
    });

  if (error) throw error;
  return data || 0;
}

export async function getUserSkillsProgress(userId: string): Promise<Map<string, number>> {
  const { data: userSkills } = await supabase
    .from('user_skill_milestones')
    .select('skill_id')
    .eq('user_id', userId);

  if (!userSkills || userSkills.length === 0) {
    return new Map();
  }

  const uniqueSkillIds = [...new Set(userSkills.map(us => us.skill_id))];
  const progressMap = new Map<string, number>();

  await Promise.all(
    uniqueSkillIds.map(async (skillId) => {
      const progress = await calculateSkillProgress(userId, skillId);
      progressMap.set(skillId, progress);
    })
  );

  return progressMap;
}

export async function getOverallProgress(userId: string): Promise<number> {
  const progressMap = await getUserSkillsProgress(userId);

  if (progressMap.size === 0) {
    return 0;
  }

  const total = Array.from(progressMap.values()).reduce((sum, val) => sum + val, 0);
  return Math.round(total / progressMap.size);
}
