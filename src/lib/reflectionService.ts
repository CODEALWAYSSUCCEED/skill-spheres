import { supabase } from './supabase';
import type { LearnerProgress } from '../types/reflection';

export const reflectionService = {
  async createReflectionGroup(userId: string, skillId: string, groupName: string) {
    const { data, error } = await supabase
      .from('reflection_groups')
      .insert({ user_id: userId, skill_id: skillId, group_name: groupName })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStudioLearnerProgress(studioId: string): Promise<LearnerProgress[]> {
    const { data: enrollments, error } = await supabase
      .from('studio_enrollments')
      .select('user_id, users(full_name, email)')
      .eq('studio_id', studioId)
      .eq('role', 'learner')
      .eq('status', 'active');

    if (error || !enrollments) return [];

    const { data: allTasks } = await supabase
      .from('studio_tasks')
      .select('id, studio_phases!inner(studio_id)')
      .eq('studio_phases.studio_id', studioId);

    const totalTasks = allTasks?.length ?? 0;

    const progress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const userId = enrollment.user_id;
        const user = enrollment.users as any;

        const { data: completions } = await supabase
          .from('studio_task_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('studio_id', studioId);

        const { data: reflections } = await supabase
          .from('reflections')
          .select('id, created_at')
          .eq('user_id', userId);

        const completedTasks = completions?.length ?? 0;
        const reflectionsCount = reflections?.length ?? 0;
        const lastActivity = reflections?.[0]?.created_at ?? enrollment.user_id;
        const skillsProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          user_id: userId,
          full_name: user?.full_name ?? 'Unknown',
          email: user?.email ?? '',
          skills_progress: skillsProgress,
          completed_tasks: completedTasks,
          total_tasks: totalTasks,
          reflections_count: reflectionsCount,
          last_activity: lastActivity,
        } as LearnerProgress;
      })
    );

    return progress;
  },

  async getLearnerStudioDetails(learnerId: string, studioId: string) {
    const [{ data: completions }, { data: submissions }, { data: reflections }] = await Promise.all([
      supabase
        .from('studio_task_completions')
        .select('*, studio_tasks(title, studio_phases(phase_number, title))')
        .eq('user_id', learnerId)
        .eq('studio_id', studioId),
      supabase
        .from('studio_submissions')
        .select('*, studio_deliverables(title)')
        .eq('user_id', learnerId)
        .eq('studio_id', studioId),
      supabase
        .from('reflections')
        .select('*')
        .eq('user_id', learnerId)
        .order('created_at', { ascending: false }),
    ]);

    return {
      completions: completions ?? [],
      submissions: submissions ?? [],
      reflections: reflections ?? [],
    };
  },
};
