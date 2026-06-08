import { supabase } from './supabase';
import type {
  CapstoneProject,
  CapstoneProjectWithDetails,
  CapstoneWeeklyUpdate,
  CapstoneFeedback,
  CreateCapstoneProjectData,
  UpdateCapstoneProjectData,
  CreateWeeklyUpdateData,
  UpdateWeeklyUpdateData,
  CreateFeedbackData,
  UpdateFeedbackData,
} from '../types/capstone';

export const capstoneService = {
  async getUserProjects(userId: string): Promise<CapstoneProjectWithDetails[]> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .select(`
        *,
        skill:skill_id (
          id,
          title
        ),
        weekly_updates:capstone_weekly_updates (
          *
        ),
        feedback:capstone_feedback (
          *,
          mentor:mentor_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProjectsBySkill(skillId: string, userId: string): Promise<CapstoneProjectWithDetails[]> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .select(`
        *,
        skill:skill_id (
          id,
          title
        ),
        weekly_updates:capstone_weekly_updates (
          *
        ),
        feedback:capstone_feedback (
          *,
          mentor:mentor_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('skill_id', skillId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserCapstoneForSkill(skillId: string, userId: string): Promise<CapstoneProject | null> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .select('*')
      .eq('skill_id', skillId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getProjectById(projectId: string): Promise<CapstoneProjectWithDetails | null> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .select(`
        *,
        skill:skill_id (
          id,
          title
        ),
        user:user_id (
          id,
          full_name,
          email
        ),
        weekly_updates:capstone_weekly_updates (
          *
        ),
        feedback:capstone_feedback (
          *,
          mentor:mentor_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', projectId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getSharedProjects(): Promise<CapstoneProjectWithDetails[]> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .select(`
        *,
        skill:skill_id (
          id,
          title
        ),
        user:user_id (
          id,
          full_name,
          email
        ),
        weekly_updates:capstone_weekly_updates (
          *
        ),
        feedback:capstone_feedback (
          *,
          mentor:mentor_id (
            id,
            full_name,
            email
          )
        )
      `)
      .in('visibility', ['shared', 'public'])
      .in('status', ['submitted', 'approved'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createProject(userId: string, projectData: CreateCapstoneProjectData): Promise<CapstoneProject> {
    const startDate = projectData.start_date || new Date().toISOString();
    const targetEndDate = new Date(startDate);
    targetEndDate.setDate(targetEndDate.getDate() + 28);

    const { data, error } = await supabase
      .from('capstone_projects')
      .insert({
        user_id: userId,
        skill_id: projectData.skill_id,
        title: projectData.title,
        description: projectData.description || '',
        problem_statement: projectData.problem_statement || '',
        context_summary: projectData.context_summary || '',
        implementation_summary: projectData.implementation_summary || '',
        deliverable_type: projectData.deliverable_type || 'text',
        deliverable_url: projectData.deliverable_url || null,
        file_path: projectData.file_path || null,
        reflection_text: projectData.reflection_text || '',
        start_date: startDate,
        target_end_date: targetEndDate.toISOString(),
        status: projectData.status || 'draft',
        github_repo_url: projectData.github_repo_url || null,
        live_demo_url: projectData.live_demo_url || null,
        notes: projectData.notes || '',
        visibility: projectData.visibility || 'mentor',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(projectId: string, updates: UpdateCapstoneProjectData): Promise<CapstoneProject> {
    const { data, error } = await supabase
      .from('capstone_projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('capstone_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },

  async createWeeklyUpdate(updateData: CreateWeeklyUpdateData): Promise<CapstoneWeeklyUpdate> {
    const { data, error } = await supabase
      .from('capstone_weekly_updates')
      .insert({
        capstone_project_id: updateData.capstone_project_id,
        week_number: updateData.week_number,
        update_text: updateData.update_text || '',
        challenges: updateData.challenges || '',
        learnings: updateData.learnings || '',
        next_steps: updateData.next_steps || '',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWeeklyUpdate(updateId: string, updates: UpdateWeeklyUpdateData): Promise<CapstoneWeeklyUpdate> {
    const { data, error } = await supabase
      .from('capstone_weekly_updates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWeeklyUpdate(updateId: string): Promise<void> {
    const { error } = await supabase
      .from('capstone_weekly_updates')
      .delete()
      .eq('id', updateId);

    if (error) throw error;
  },

  async createFeedback(userId: string, feedbackData: CreateFeedbackData): Promise<CapstoneFeedback> {
    const { data, error } = await supabase
      .from('capstone_feedback')
      .insert({
        capstone_id: feedbackData.capstone_project_id,
        mentor_id: userId,
        feedback_text: feedbackData.feedback_text,
        rating: feedbackData.rating || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async saveDraft(userId: string, skillId: string, draftData: Partial<CreateCapstoneProjectData>): Promise<CapstoneProject> {
    const existing = await this.getUserCapstoneForSkill(skillId, userId);

    if (existing) {
      return this.updateProject(existing.id, draftData as UpdateCapstoneProjectData);
    } else {
      return this.createProject(userId, {
        skill_id: skillId,
        title: draftData.title || 'Untitled Capstone',
        status: 'draft',
        ...draftData,
      } as CreateCapstoneProjectData);
    }
  },

  async submitForReview(projectId: string): Promise<CapstoneProject> {
    return this.updateProject(projectId, {
      status: 'submitted',
    });
  },

  async approveCapstone(projectId: string): Promise<CapstoneProject> {
    return this.updateProject(projectId, {
      status: 'approved',
      actual_end_date: new Date().toISOString(),
    });
  },

  async requestRevisions(projectId: string): Promise<CapstoneProject> {
    return this.updateProject(projectId, {
      status: 'revision_requested',
    });
  },

  async updateFeedback(feedbackId: string, updates: UpdateFeedbackData): Promise<CapstoneFeedback> {
    const { data, error } = await supabase
      .from('capstone_feedback')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFeedback(feedbackId: string): Promise<void> {
    const { error } = await supabase
      .from('capstone_feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) throw error;
  },

  getDaysRemaining(targetEndDate: string): number {
    const target = new Date(targetEndDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  getWeekNumber(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.min(Math.ceil(days / 7), 4);
  },
};
