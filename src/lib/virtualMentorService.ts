import { supabase } from './supabase';
import type { VirtualMentor, VirtualMentorFormData, MentorMilestoneJourney, MentorMilestoneJourneyFormData, MentorJourneyWithMilestone } from '../types/virtualMentor';

export async function getVirtualMentor(userId: string, skillId: string): Promise<VirtualMentor | null> {
  const { data, error } = await supabase
    .from('skill_virtual_mentors')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching virtual mentor:', error);
    return null;
  }

  return data;
}

export async function getSkillVirtualMentors(userId: string, skillId: string): Promise<VirtualMentor[]> {
  const { data, error } = await supabase
    .from('skill_virtual_mentors')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching skill virtual mentors:', error);
    return [];
  }

  return data || [];
}

export async function getAllVirtualMentors(userId: string): Promise<VirtualMentor[]> {
  const { data, error } = await supabase
    .from('skill_virtual_mentors')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching virtual mentors:', error);
    return [];
  }

  return data || [];
}

export async function createVirtualMentor(
  userId: string,
  skillId: string,
  formData: VirtualMentorFormData
): Promise<VirtualMentor | null> {
  const { data, error } = await supabase
    .from('skill_virtual_mentors')
    .insert({
      user_id: userId,
      skill_id: skillId,
      ...formData,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating virtual mentor:', error);
    return null;
  }

  return data;
}

export async function updateVirtualMentor(
  mentorId: string,
  formData: Partial<VirtualMentorFormData>
): Promise<VirtualMentor | null> {
  const { data, error } = await supabase
    .from('skill_virtual_mentors')
    .update(formData)
    .eq('id', mentorId)
    .select()
    .single();

  if (error) {
    console.error('Error updating virtual mentor:', error);
    return null;
  }

  return data;
}

export async function deleteVirtualMentor(mentorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('skill_virtual_mentors')
    .delete()
    .eq('id', mentorId);

  if (error) {
    console.error('Error deleting virtual mentor:', error);
    return false;
  }

  return true;
}

export async function deactivateVirtualMentor(mentorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('skill_virtual_mentors')
    .update({ is_active: false })
    .eq('id', mentorId);

  if (error) {
    console.error('Error deactivating virtual mentor:', error);
    return false;
  }

  return true;
}

export async function getMentorJourneys(mentorId: string): Promise<MentorJourneyWithMilestone[]> {
  const { data, error } = await supabase
    .from('mentor_milestone_journeys')
    .select(`
      *,
      milestone:skill_milestones(
        id,
        skill_id,
        title,
        description,
        type,
        order_index
      )
    `)
    .eq('virtual_mentor_id', mentorId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching mentor journeys:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    title: row.title || row.milestone?.title || '',
  })) as MentorJourneyWithMilestone[];
}

export async function getMentorJourneyForMilestone(
  mentorId: string,
  milestoneId: string
): Promise<MentorMilestoneJourney | null> {
  const { data, error } = await supabase
    .from('mentor_milestone_journeys')
    .select('*')
    .eq('virtual_mentor_id', mentorId)
    .eq('milestone_id', milestoneId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching mentor journey:', error);
    return null;
  }

  return data;
}

export async function createMentorJourney(
  mentorId: string,
  formData: MentorMilestoneJourneyFormData
): Promise<MentorMilestoneJourney | null> {
  const journeys = await getMentorJourneys(mentorId);
  const nextOrderIndex = journeys.length;

  const { data, error } = await supabase
    .from('mentor_milestone_journeys')
    .insert({
      virtual_mentor_id: mentorId,
      ...formData,
      order_index: nextOrderIndex
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating mentor journey:', error);
    return null;
  }

  return data;
}

export async function updateMentorJourney(
  journeyId: string,
  formData: Partial<MentorMilestoneJourneyFormData>
): Promise<MentorMilestoneJourney | null> {
  const { data, error } = await supabase
    .from('mentor_milestone_journeys')
    .update(formData)
    .eq('id', journeyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating mentor journey:', error);
    return null;
  }

  return data;
}

export async function deleteMentorJourney(journeyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('mentor_milestone_journeys')
    .delete()
    .eq('id', journeyId);

  if (error) {
    console.error('Error deleting mentor journey:', error);
    return false;
  }

  return true;
}
