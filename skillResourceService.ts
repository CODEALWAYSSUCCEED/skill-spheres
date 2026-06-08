import { supabase } from './supabase';
import type { MentorProfile, MentorAssignment, MentorFeedback, MentorStats } from '../types/mentor';

export const mentorService = {
  async getMentorProfile(userId: string): Promise<MentorProfile | null> {
    const { data } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return data;
  },

  async createOrUpdateMentorProfile(userId: string, profile: Partial<MentorProfile>): Promise<MentorProfile | null> {
    const existing = await this.getMentorProfile(userId);

    if (existing) {
      const { data } = await supabase
        .from('mentor_profiles')
        .update(profile)
        .eq('user_id', userId)
        .select()
        .single();
      return data;
    } else {
      const { data } = await supabase
        .from('mentor_profiles')
        .insert({ ...profile, user_id: userId })
        .select()
        .single();
      return data;
    }
  },

  async getMentorAssignments(mentorId: string, status?: string): Promise<any[]> {
    let query = supabase
      .from('mentor_assignments')
      .select(`
        *,
        learner:learner_id (
          full_name,
          email
        ),
        skill:skill_id (
          title
        )
      `)
      .eq('mentor_id', mentorId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query.order('assigned_at', { ascending: false });
    return data || [];
  },

  async getLearnerAssignments(learnerId: string): Promise<any[]> {
    const { data } = await supabase
      .from('mentor_assignments')
      .select(`
        *,
        mentor:mentor_id (
          full_name,
          email
        ),
        skill:skill_id (
          title
        )
      `)
      .eq('learner_id', learnerId)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false });

    return data || [];
  },

  async createAssignment(mentorId: string, learnerId: string, skillId?: string): Promise<MentorAssignment | null> {
    const { data } = await supabase
      .from('mentor_assignments')
      .insert({
        mentor_id: mentorId,
        learner_id: learnerId,
        skill_id: skillId || null,
        status: 'active',
      })
      .select()
      .single();

    return data;
  },

  async updateAssignmentStatus(assignmentId: string, status: string): Promise<void> {
    await supabase
      .from('mentor_assignments')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', assignmentId);
  },

  async addFeedback(
    mentorId: string,
    reflectionId: string,
    feedbackText: string,
    rating?: number
  ): Promise<MentorFeedback | null> {
    const { data } = await supabase
      .from('mentor_feedback')
      .insert({
        mentor_id: mentorId,
        reflection_id: reflectionId,
        feedback_text: feedbackText,
        rating: rating || null,
      })
      .select()
      .single();

    return data;
  },

  async getFeedbackForReflection(reflectionId: string): Promise<MentorFeedback | null> {
    const { data } = await supabase
      .from('mentor_feedback')
      .select('*')
      .eq('reflection_id', reflectionId)
      .maybeSingle();

    return data;
  },

  async getMentorStats(mentorId: string): Promise<MentorStats> {
    const assignments = await this.getMentorAssignments(mentorId, 'active');
    const activeMentees = new Set(assignments.map(a => a.learner_id)).size;

    const { data: feedback } = await supabase
      .from('mentor_feedback')
      .select('id')
      .eq('mentor_id', mentorId);

    const learnerIds = assignments.map(a => a.learner_id);

    let pendingReviews = 0;
    if (learnerIds.length > 0) {
      const { data: reflections } = await supabase
        .from('reflections')
        .select('id')
        .in('user_id', learnerIds);

      const reflectionIds = reflections?.map(r => r.id) || [];

      if (reflectionIds.length > 0) {
        const { data: existingFeedback } = await supabase
          .from('mentor_feedback')
          .select('reflection_id')
          .eq('mentor_id', mentorId)
          .in('reflection_id', reflectionIds);

        const feedbackReflectionIds = new Set(existingFeedback?.map(f => f.reflection_id) || []);
        pendingReviews = reflectionIds.filter(id => !feedbackReflectionIds.has(id)).length;
      }
    }

    return {
      active_mentees: activeMentees,
      pending_reviews: pendingReviews,
      total_feedback: feedback?.length || 0,
    };
  },

  async getRecentReflectionsForMentor(mentorId: string, limit: number = 5): Promise<any[]> {
    const assignments = await this.getMentorAssignments(mentorId, 'active');
    const learnerIds = assignments.map(a => a.learner_id);

    if (learnerIds.length === 0) {
      return [];
    }

    const { data: reflections } = await supabase
      .from('reflections')
      .select(`
        *,
        skills (title),
        users (full_name)
      `)
      .in('user_id', learnerIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    return reflections || [];
  },
};
