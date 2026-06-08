import { supabase } from './supabase';
import type { UserSkill, Milestone, UserMilestone, SkillProgress, MilestoneWithCompletion } from '../types/progression';

export const progressionService = {
  async startSkill(userId: string, skillId: string): Promise<UserSkill | null> {
    const { data: existing } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'not_started') {
        const { data, error } = await supabase
          .from('user_skills')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        return data;
      }
      return existing;
    }

    const { data, error } = await supabase
      .from('user_skills')
      .insert({
        user_id: userId,
        skill_id: skillId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    return data;
  },

  async getUserSkill(userId: string, skillId: string): Promise<UserSkill | null> {
    const { data } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .maybeSingle();

    return data;
  },

  async getSkillProgress(userId: string, skillId: string): Promise<SkillProgress | null> {
    const userSkill = await this.getUserSkill(userId, skillId);

    const { data: milestones } = await supabase
      .from('skill_milestones')
      .select('*')
      .eq('skill_id', skillId);

    if (!milestones || milestones.length === 0) {
      return {
        skill_id: skillId,
        status: userSkill?.status || 'not_started',
        total_milestones: 0,
        completed_milestones: 0,
        required_milestones: 0,
        completed_required_milestones: 0,
        progress_percentage: 0,
        started_at: userSkill?.started_at || null,
        completed_at: userSkill?.completed_at || null,
      };
    }

    const requiredMilestones = milestones.filter(m => m.is_required);

    const { data: completedMilestones } = await supabase
      .from('user_skill_milestones')
      .select('milestone_id, status')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .eq('status', 'completed');

    const completedIds = new Set(completedMilestones?.map(cm => cm.milestone_id) || []);
    const completedRequiredCount = requiredMilestones.filter(m => completedIds.has(m.id)).length;

    const progressPercentage = requiredMilestones.length > 0
      ? Math.round((completedRequiredCount / requiredMilestones.length) * 100)
      : 0;

    return {
      skill_id: skillId,
      status: userSkill?.status || 'not_started',
      total_milestones: milestones.length,
      completed_milestones: completedIds.size,
      required_milestones: requiredMilestones.length,
      completed_required_milestones: completedRequiredCount,
      progress_percentage: progressPercentage,
      started_at: userSkill?.started_at || null,
      completed_at: userSkill?.completed_at || null,
    };
  },

  async getMilestonesWithCompletion(userId: string, skillId: string): Promise<MilestoneWithCompletion[]> {
    const { data: milestones } = await supabase
      .from('skill_milestones')
      .select('*')
      .eq('skill_id', skillId)
      .order('order_index', { ascending: true });

    if (!milestones) {
      return [];
    }

    const { data: userMilestones } = await supabase
      .from('user_skill_milestones')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    const completionMap = new Map(
      userMilestones?.map(um => [um.milestone_id, um]) || []
    );

    return milestones.map(milestone => ({
      id: milestone.id,
      skill_id: milestone.skill_id,
      title: milestone.title,
      description: milestone.description || '',
      milestone_type: milestone.type || 'reading',
      type: milestone.type || 'reading',
      required: milestone.is_required,
      is_required: milestone.is_required,
      order_index: milestone.order_index,
      estimated_minutes: milestone.estimated_minutes,
      is_completed: completionMap.get(milestone.id)?.status === 'completed',
      completed_at: completionMap.get(milestone.id)?.completed_at || null,
    }));
  },

  async toggleMilestone(userId: string, milestoneId: string): Promise<boolean> {
    const { data: milestone } = await supabase
      .from('skill_milestones')
      .select('skill_id')
      .eq('id', milestoneId)
      .maybeSingle();

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    const { data: existing } = await supabase
      .from('user_skill_milestones')
      .select('*')
      .eq('user_id', userId)
      .eq('milestone_id', milestoneId)
      .maybeSingle();

    if (existing) {
      const newStatus = existing.status === 'completed' ? 'not_started' : 'completed';
      await supabase
        .from('user_skill_milestones')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', existing.id);
      return newStatus === 'completed';
    } else {
      await supabase
        .from('user_skill_milestones')
        .insert({
          user_id: userId,
          skill_id: milestone.skill_id,
          milestone_id: milestoneId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      return true;
    }
  },

  async getUserInProgressSkills(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('user_skills')
      .select(`
        *,
        skills (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false });

    if (!data) return [];

    const progressPromises = data.map(async (userSkill) => {
      const progress = await this.getSkillProgress(userId, userSkill.skill_id);
      return {
        ...userSkill,
        progress,
      };
    });

    return Promise.all(progressPromises);
  },

  async getUserCompletedSkills(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('user_skills')
      .select(`
        *,
        skills (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    return data || [];
  },

  async getDashboardStats(userId: string): Promise<{
    in_progress_count: number;
    completed_count: number;
    average_progress: number;
  }> {
    const inProgress = await this.getUserInProgressSkills(userId);
    const completed = await this.getUserCompletedSkills(userId);

    const totalProgress = inProgress.reduce((sum, skill) => {
      return sum + (skill.progress?.progress_percentage || 0);
    }, 0);

    const averageProgress = inProgress.length > 0
      ? Math.round(totalProgress / inProgress.length)
      : 0;

    return {
      in_progress_count: inProgress.length,
      completed_count: completed.length,
      average_progress: averageProgress,
    };
  },
};
