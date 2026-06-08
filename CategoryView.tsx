import { supabase } from './supabase';
import type {
  Studio,
  StudioPhase,
  StudioTask,
  StudioDeliverable,
  StudioSession,
  StudioEnrollment,
  StudioTaskCompletion,
  StudioSubmission,
  StudioModule,
  StudioProgress,
} from '../types/studio';

export const studioService = {
  async getActiveStudios(): Promise<Studio[]> {
    const { data } = await supabase
      .from('studios')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return data || [];
  },

  async getStudioById(studioId: string): Promise<Studio | null> {
    const { data } = await supabase
      .from('studios')
      .select('*')
      .eq('id', studioId)
      .maybeSingle();

    return data;
  },

  async getStudioPhases(studioId: string): Promise<StudioPhase[]> {
    const { data } = await supabase
      .from('studio_phases')
      .select('*')
      .eq('studio_id', studioId)
      .order('phase_number', { ascending: true });

    return data || [];
  },

  async getPhaseTasks(phaseId: string): Promise<StudioTask[]> {
    const { data } = await supabase
      .from('studio_tasks')
      .select('*')
      .eq('phase_id', phaseId)
      .order('order_index', { ascending: true });

    return data || [];
  },

  async getAllStudioTasks(studioId: string): Promise<Array<StudioTask & { phase_id: string }>> {
    const { data } = await supabase
      .from('studio_tasks')
      .select(`
        *,
        studio_phases!inner (
          studio_id
        )
      `)
      .eq('studio_phases.studio_id', studioId)
      .order('order_index', { ascending: true });

    return data || [];
  },

  async getStudioDeliverables(studioId: string): Promise<StudioDeliverable[]> {
    const { data } = await supabase
      .from('studio_deliverables')
      .select('*')
      .eq('studio_id', studioId)
      .order('order_index', { ascending: true });

    return data || [];
  },

  async getStudioSessions(studioId: string): Promise<StudioSession[]> {
    const { data } = await supabase
      .from('studio_sessions')
      .select('*')
      .eq('studio_id', studioId)
      .order('session_date', { ascending: true });

    return data || [];
  },

  async getUpcomingSessions(studioId: string): Promise<StudioSession[]> {
    const { data } = await supabase
      .from('studio_sessions')
      .select('*')
      .eq('studio_id', studioId)
      .gte('session_date', new Date().toISOString())
      .order('session_date', { ascending: true });

    return data || [];
  },

  async getStudioModules(studioId: string): Promise<StudioModule[]> {
    const { data } = await supabase
      .from('studio_modules')
      .select('*')
      .eq('studio_id', studioId)
      .order('order_index', { ascending: true });

    return data || [];
  },

  async getUserEnrollment(userId: string, studioId: string): Promise<StudioEnrollment | null> {
    const { data } = await supabase
      .from('studio_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .maybeSingle();

    return data;
  },

  async getStudioEnrollments(studioId: string): Promise<Array<StudioEnrollment & { users: any }>> {
    const { data } = await supabase
      .from('studio_enrollments')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: true });

    return data || [];
  },

  async enrollUser(userId: string, studioId: string, role: 'learner' | 'mentor' | 'facilitator' = 'learner'): Promise<StudioEnrollment | null> {
    const existing = await this.getUserEnrollment(userId, studioId);
    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('studio_enrollments')
      .upsert({
        user_id: userId,
        studio_id: studioId,
        role,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      }, {
        onConflict: 'studio_id,user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Enrollment error:', error);
      throw new Error('Unable to join studio. Please try again.');
    }
    return data;
  },

  async leaveStudio(enrollmentId: string): Promise<void> {
    const { error } = await supabase
      .from('studio_enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) throw error;
  },

  async getUserTaskCompletions(userId: string, studioId: string): Promise<StudioTaskCompletion[]> {
    const { data } = await supabase
      .from('studio_task_completions')
      .select(`
        *,
        studio_tasks!inner (
          id,
          phase_id,
          studio_phases!inner (
            studio_id
          )
        )
      `)
      .eq('user_id', userId)
      .eq('studio_tasks.studio_phases.studio_id', studioId);

    return data || [];
  },

  async toggleTaskCompletion(userId: string, taskId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('studio_task_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('studio_task_completions')
        .delete()
        .eq('id', existing.id);
      return false;
    } else {
      await supabase
        .from('studio_task_completions')
        .insert({
          user_id: userId,
          task_id: taskId,
        });
      return true;
    }
  },

  async getUserSubmissions(userId: string, studioId: string): Promise<StudioSubmission[]> {
    const { data } = await supabase
      .from('studio_submissions')
      .select(`
        *,
        studio_deliverables!inner (
          studio_id
        )
      `)
      .eq('user_id', userId)
      .eq('studio_deliverables.studio_id', studioId);

    return data || [];
  },

  async getSubmissionForDeliverable(userId: string, deliverableId: string): Promise<StudioSubmission | null> {
    const { data } = await supabase
      .from('studio_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('deliverable_id', deliverableId)
      .maybeSingle();

    return data;
  },

  async uploadDeliverableFile(
    userId: string,
    studioId: string,
    deliverableId: string,
    file: File
  ): Promise<{ fileUrl: string; fileName: string; fileType: string; fileSize: number }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${studioId}/${deliverableId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('deliverables')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('deliverables')
      .getPublicUrl(filePath);

    return {
      fileUrl: filePath,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    };
  },

  async createOrUpdateSubmission(
    userId: string,
    deliverableId: string,
    data: {
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      linkUrl?: string;
      notes?: string;
      submissionText?: string;
    },
    status: 'draft' | 'submitted' = 'submitted'
  ): Promise<StudioSubmission | null> {
    const existing = await this.getSubmissionForDeliverable(userId, deliverableId);

    const submissionData = {
      file_url: data.fileUrl,
      file_name: data.fileName,
      file_type: data.fileType,
      file_size: data.fileSize,
      link_url: data.linkUrl,
      notes: data.notes,
      submission_text: data.submissionText,
      status,
      updated_at: new Date().toISOString(),
      submitted_at: status === 'submitted' ? new Date().toISOString() : existing?.submitted_at,
    };

    if (existing) {
      const { data: result, error } = await supabase
        .from('studio_submissions')
        .update(submissionData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } else {
      const { data: result, error } = await supabase
        .from('studio_submissions')
        .insert({
          user_id: userId,
          deliverable_id: deliverableId,
          ...submissionData,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    }
  },

  async getDeliverableFileUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('deliverables')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async downloadDeliverableFile(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('deliverables')
      .download(filePath);

    if (error) throw error;
    return data;
  },

  async getStudioProgress(userId: string, studioId: string): Promise<StudioProgress> {
    const tasks = await this.getAllStudioTasks(studioId);
    const completions = await this.getUserTaskCompletions(userId, studioId);
    const deliverables = await this.getStudioDeliverables(studioId);
    const submissions = await this.getUserSubmissions(userId, studioId);

    const completedTasks = completions.length;
    const submittedDeliverables = submissions.filter(s => s.status !== 'draft').length;

    const totalItems = tasks.length + deliverables.length;
    const completedItems = completedTasks + submittedDeliverables;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      total_tasks: tasks.length,
      completed_tasks: completedTasks,
      total_deliverables: deliverables.length,
      submitted_deliverables: submittedDeliverables,
      progress_percentage: progressPercentage,
    };
  },

  async addFeedbackToSubmission(
    submissionId: string,
    feedback: string,
    status: 'reviewed' | 'approved'
  ): Promise<void> {
    await supabase
      .from('studio_submissions')
      .update({
        mentor_feedback: feedback,
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
  },
};
