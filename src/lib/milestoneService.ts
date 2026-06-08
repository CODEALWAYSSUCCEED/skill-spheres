import { supabase } from './supabase';

export type SkillMilestone = {
  id: string;
  skill_id: string;
  title: string;
  description: string;
  order_index: number;
  is_required: boolean;
  type: string;
  estimated_minutes: number | null;
  created_at: string;
};

export async function getSkillMilestones(skillId: string): Promise<SkillMilestone[]> {
  const { data, error } = await supabase
    .from('skill_milestones')
    .select('*')
    .eq('skill_id', skillId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching milestones:', error);
    return [];
  }

  return data || [];
}
