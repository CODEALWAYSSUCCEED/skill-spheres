import { supabase } from './supabase';
import type { ReflectionGroup, ReflectionGroupMember, Reflection } from '../types/reflection';

export const reflectionService = {
  async createReflectionGroup(
    mentorId: string,
    studioId: string,
    name: string,
    description: string,
    skillId?: string,
    visibility: 'public' | 'private' = 'public'
  ): Promise<ReflectionGroup | null> {
    const { data, error } = await supabase
      .from('reflection_groups')
      .insert({
        mentor_id: mentorId,
        studio_id: studioId,
        skill_id: skillId || null,
        name,
        description,
        visibility,
      })
      .select()
      .single();

    if (error) throw error;

    if (data) {
      await supabase.from('reflection_group_members').insert({
        group_id: data.id,
        user_id: mentorId,
        role: 'mentor',
        status: 'active',
      });
    }

    return data;
  },

  async getStudioReflectionGroups(studioId: string): Promise<ReflectionGroup[]> {
    const { data } = await supabase
      .from('reflection_groups')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false });

    return data || [];
  },

  async getReflectionGroup(groupId: string): Promise<ReflectionGroup | null> {
    const { data } = await supabase
      .from('reflection_groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();

    return data;
  },

  async getGroupMembers(groupId: string): Promise<any[]> {
    const { data } = await supabase
      .from('reflection_group_members')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    return data || [];
  },

  async joinReflectionGroup(userId: string, groupId: string): Promise<void> {
    const { error } = await supabase
      .from('reflection_group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
        status: 'active',
      });

    if (error) throw error;
  },

  async leaveReflectionGroup(userId: string, groupId: string): Promise<void> {
    const { error } = await supabase
      .from('reflection_group_members')
      .update({ status: 'left' })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getStudioLearnerProgress(studioId: string): Promise<any[]> {
    const { data: enrollments } = await supabase
      .from('studio_enrollments')
      .select(`
        user_id,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq('studio_id', studioId)
      .eq('role', 'learner')
      .eq('status', 'active');

    if (!enrollments) return [];

    const learnerProgress = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const userId = enrollment.user_id;

        const { count: completedTasks } = await supabase
          .from('studio_task_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        const { data: allTasks } = await supabase
          .from('studio_tasks')
          .select(`
            id,
            studio_phases!inner (
              studio_id
            )
          `)
          .eq('studio_phases.studio_id', studioId);

        const { count: reflectionsCount } = await supabase
          .from('reflections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('studio_id', studioId);

        const { data: lastActivity } = await supabase
          .from('studio_task_completions')
          .select('completed_at')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const totalTasks = allTasks?.length || 0;
        const progressPercentage = totalTasks > 0 ? Math.round(((completedTasks || 0) / totalTasks) * 100) : 0;

        return {
          user_id: userId,
          full_name: enrollment.users.full_name,
          email: enrollment.users.email,
          skills_progress: progressPercentage,
          completed_tasks: completedTasks || 0,
          total_tasks: totalTasks,
          reflections_count: reflectionsCount || 0,
          last_activity: lastActivity?.completed_at || enrollment.enrolled_at,
        };
      })
    );

    return learnerProgress;
  },

  async getLearnerStudioDetails(learnerId: string, studioId: string): Promise<any> {
    const [completions, submissions, reflections] = await Promise.all([
      supabase
        .from('studio_task_completions')
        .select(`
          *,
          studio_tasks (
            title,
            phase_id,
            studio_phases (
              phase_number,
              title
            )
          )
        `)
        .eq('user_id', learnerId),

      supabase
        .from('studio_submissions')
        .select(`
          *,
          studio_deliverables (
            title,
            type,
            studio_id
          )
        `)
        .eq('user_id', learnerId)
        .eq('studio_deliverables.studio_id', studioId),

      supabase
        .from('reflections')
        .select('*')
        .eq('user_id', learnerId)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false }),
    ]);

    return {
      completions: completions.data || [],
      submissions: submissions.data || [],
      reflections: reflections.data || [],
    };
  },
};
