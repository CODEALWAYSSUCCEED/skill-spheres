import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { studioService } from '../lib/studioService';
import { reflectionService } from '../lib/reflectionService';
import { MentorStudioProgress } from './MentorStudioProgress';
import { MentorLearnerDetail } from './MentorLearnerDetail';
import MyResources from '../components/MyResources';
import SharedResourceBank from '../components/SharedResourceBank';
import type { Studio, StudioPhase, StudioTask, StudioDeliverable, StudioSession, StudioModule, StudioEnrollment, StudioProgress } from '../types/studio';
import { ArrowLeft, CheckCircle, Circle, Calendar, Users, FileText, Video, BookOpen, TrendingUp, Clock, ExternalLink, Upload, MessageSquare, Plus, BarChart, Folder, Share2 } from 'lucide-react';

type Tab = 'overview' | 'roadmap' | 'modules' | 'deliverables' | 'sessions' | 'team' | 'activity' | 'my-resources' | 'resource-bank';
type MentorView = 'studio' | 'progress' | 'learner-detail';

interface StudioDetailProps {
  studioId: string;
  onBack: () => void;
}

export function StudioDetail({ studioId, onBack }: StudioDetailProps) {
  const { user, profile } = useAuth();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [phases, setPhases] = useState<StudioPhase[]>([]);
  const [tasks, setTasks] = useState<Record<string, StudioTask[]>>({});
  const [deliverables, setDeliverables] = useState<StudioDeliverable[]>([]);
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [modules, setModules] = useState<StudioModule[]>([]);
  const [enrollment, setEnrollment] = useState<StudioEnrollment | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progress, setProgress] = useState<StudioProgress | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mentorView, setMentorView] = useState<MentorView>('studio');
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private',
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<StudioDeliverable | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionMethod, setSubmissionMethod] = useState<'file' | 'link'>('file');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setEnrollment(null);
    setProgress(null);
    setCompletedTaskIds(new Set());
    setSubmissions({});
    setShowToast(false);
    setToastMessage('');

    loadStudioData();
  }, [studioId, user]);

  const loadStudioData = async () => {
    const [studioData, phasesData, delivsData, sessionsData, modulesData] = await Promise.all([
      studioService.getStudioById(studioId),
      studioService.getStudioPhases(studioId),
      studioService.getStudioDeliverables(studioId),
      studioService.getStudioSessions(studioId),
      studioService.getStudioModules(studioId),
    ]);

    setStudio(studioData);
    setPhases(phasesData);
    setDeliverables(delivsData);
    setSessions(sessionsData);
    setModules(modulesData);

    const tasksMap: Record<string, StudioTask[]> = {};
    for (const phase of phasesData) {
      const phaseTasks = await studioService.getPhaseTasks(phase.id);
      tasksMap[phase.id] = phaseTasks;
    }
    setTasks(tasksMap);

    if (user) {
      const enrollmentData = await studioService.getUserEnrollment(user.id, studioId);
      setEnrollment(enrollmentData);

      if (enrollmentData) {
        const progressData = await studioService.getStudioProgress(user.id, studioId);
        setProgress(progressData);

        const completions = await studioService.getUserTaskCompletions(user.id, studioId);
        const completedIds = new Set(completions.map(c => c.task_id));
        setCompletedTaskIds(completedIds);

        const submissionsData = await studioService.getUserSubmissions(user.id, studioId);
        const submissionsMap: Record<string, any> = {};
        submissionsData.forEach(sub => {
          submissionsMap[sub.deliverable_id] = sub;
        });
        setSubmissions(submissionsMap);
      }

      const allEnrollments = await studioService.getStudioEnrollments(studioId);
      setEnrollments(allEnrollments);
    }

    setLoading(false);
  };

  const handleEnroll = async () => {
    if (!user) {
      setToastMessage('Please log in to join this studio');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (enrollment) {
      setToastMessage('You are already enrolled in this studio');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setEnrolling(true);

    try {
      const result = await studioService.enrollUser(user.id, studioId, 'learner');
      if (result) {
        setToastMessage("You've joined this studio!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        await loadStudioData();
      }
    } catch (error: any) {
      console.error('Enrollment error:', error);

      let message = 'Failed to join studio';
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        message = "You're already enrolled in this studio";
        await loadStudioData();
      } else if (error.message && !error.message.includes('violates')) {
        message = error.message;
      }

      setToastMessage(message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setEnrolling(false);
    }
  };

  const handleLeaveStudio = async () => {
    if (!user || !enrollment) return;

    const confirmed = window.confirm('Are you sure you want to leave this studio? Your progress will be saved, but you will lose access to the content.');
    if (!confirmed) return;

    setEnrollment(null);

    try {
      await studioService.leaveStudio(enrollment.id);
      setToastMessage('You have left this studio');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      await loadStudioData();
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to leave studio');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      await loadStudioData();
    }
  };

  const handleCreateReflectionGroup = async () => {
    if (!user || !groupFormData.name.trim()) return;

    try {
      await reflectionService.createReflectionGroup(
        user.id,
        studioId,
        groupFormData.name,
        groupFormData.description,
        undefined,
        groupFormData.visibility
      );
      setToastMessage('Reflection group created successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setShowCreateGroupModal(false);
      setGroupFormData({ name: '', description: '', visibility: 'public' });
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to create group');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleViewLearnerProgress = () => {
    setMentorView('progress');
  };

  const handleOpenSubmitModal = (deliverable: StudioDeliverable) => {
    setSelectedDeliverable(deliverable);
    const existing = submissions[deliverable.id];
    if (existing) {
      setSubmissionLink(existing.link_url || '');
      setSubmissionNotes(existing.notes || '');
      setSubmissionMethod(existing.file_url ? 'file' : 'link');
    } else {
      setSubmissionLink('');
      setSubmissionNotes('');
      setSubmissionFile(null);
      setSubmissionMethod('file');
    }
    setShowSubmitModal(true);
  };

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
    setSelectedDeliverable(null);
    setSubmissionFile(null);
    setSubmissionLink('');
    setSubmissionNotes('');
    setSubmissionMethod('file');
  };

  const handleSubmitDeliverable = async () => {
    if (!user || !selectedDeliverable) return;

    if (submissionMethod === 'file' && !submissionFile && !submissions[selectedDeliverable.id]?.file_url) {
      setToastMessage('Please select a file to upload');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (submissionMethod === 'link' && !submissionLink.trim()) {
      setToastMessage('Please enter a valid URL');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setUploading(true);

    try {
      let fileData = {};

      if (submissionMethod === 'file' && submissionFile) {
        const uploaded = await studioService.uploadDeliverableFile(
          user.id,
          studioId,
          selectedDeliverable.id,
          submissionFile
        );
        fileData = {
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          fileType: uploaded.fileType,
          fileSize: uploaded.fileSize,
        };
      }

      const submissionData = {
        ...fileData,
        linkUrl: submissionMethod === 'link' ? submissionLink : undefined,
        notes: submissionNotes,
      };

      await studioService.createOrUpdateSubmission(
        user.id,
        selectedDeliverable.id,
        submissionData,
        'submitted'
      );

      setToastMessage('Deliverable submitted successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      handleCloseSubmitModal();
      await loadStudioData();
    } catch (error: any) {
      console.error('Submission error:', error);
      setToastMessage(error.message || 'Failed to submit deliverable');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleViewLearnerDetail = (learnerId: string) => {
    setSelectedLearnerId(learnerId);
    setMentorView('learner-detail');
  };

  const handleTaskToggle = async (taskId: string) => {
    if (!user) return;
    await studioService.toggleTaskCompletion(user.id, taskId);
    await loadStudioData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading || !studio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-blue-200 animate-pulse">Loading studio...</div>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'roadmap', label: 'Roadmap', icon: TrendingUp },
    { id: 'modules', label: 'Modules', icon: FileText },
    { id: 'deliverables', label: 'Deliverables', icon: Upload },
    { id: 'sessions', label: 'Live Sessions', icon: Video },
    { id: 'my-resources', label: 'My Resources', icon: Folder },
    { id: 'resource-bank', label: 'Resource Bank', icon: Share2 },
    { id: 'team', label: 'Team & Mentor', icon: Users },
  ];

  if (mentorView === 'progress' && profile?.role === 'mentor') {
    return (
      <MentorStudioProgress
        studioId={studioId}
        studioTitle={studio?.title || ''}
        onBack={() => setMentorView('studio')}
        onViewLearner={handleViewLearnerDetail}
      />
    );
  }

  if (mentorView === 'learner-detail' && selectedLearnerId && profile?.role === 'mentor') {
    return (
      <MentorLearnerDetail
        learnerId={selectedLearnerId}
        studioId={studioId}
        onBack={() => setMentorView('progress')}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl border-2 border-green-300 font-bold animate-fade-in">
          {toastMessage}
        </div>
      )}

      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900 rounded-2xl p-6 max-w-md w-full border-3 border-amber-400/60 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Create Reflection Group</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-amber-300 font-bold mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border-2 border-amber-400/50 rounded-xl text-white placeholder-blue-300"
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-amber-300 font-bold mb-2">Description</label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border-2 border-amber-400/50 rounded-xl text-white placeholder-blue-300"
                  rows={3}
                  placeholder="Describe the group's purpose"
                />
              </div>
              <div>
                <label className="block text-amber-300 font-bold mb-2">Visibility</label>
                <select
                  value={groupFormData.visibility}
                  onChange={(e) => setGroupFormData({ ...groupFormData, visibility: e.target.value as 'public' | 'private' })}
                  className="w-full px-4 py-2 bg-white/10 border-2 border-amber-400/50 rounded-xl text-white"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReflectionGroup}
                  disabled={!groupFormData.name.trim()}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white hover:text-amber-300 mb-6 font-bold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Studios
      </button>

      <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 backdrop-blur-md rounded-2xl p-5 sm:p-8 border-3 border-amber-400/60 shadow-2xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-3">{studio.title}</h1>
            <p className="text-base sm:text-lg text-white/90 leading-relaxed">{studio.description}</p>
          </div>
          <div className="flex flex-row sm:flex-col gap-2 flex-wrap">
            {!enrollment && user && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 shadow-lg border-2 border-amber-300 disabled:opacity-50 text-sm sm:text-base"
              >
                {enrolling ? 'Joining...' : 'Join Studio'}
              </button>
            )}
            {!enrollment && !user && (
              <button
                onClick={handleEnroll}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 shadow-lg border-2 border-amber-300 text-sm sm:text-base"
              >
                Join Studio
              </button>
            )}
            {enrollment && (
              <>
                <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-bold border border-green-400/50 text-center">
                  Enrolled
                </div>
                <button
                  onClick={() => setActiveTab('roadmap')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg border-2 border-blue-300"
                >
                  Go to Roadmap
                </button>
                <button
                  onClick={handleLeaveStudio}
                  className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-600 transition border-2 border-gray-500"
                >
                  Leave Studio
                </button>
              </>
            )}
          </div>
        </div>

        {enrollment && progress && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-300 font-bold">Your Progress</span>
              <span className="text-white font-bold">{progress.progress_percentage}%</span>
            </div>
            <div className="bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-500 h-3 rounded-full transition-all"
                style={{ width: `${progress.progress_percentage}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <span className="text-blue-200">Tasks: </span>
                <span className="text-white font-bold">{progress.completed_tasks}/{progress.total_tasks}</span>
              </div>
              <div>
                <span className="text-blue-200">Deliverables: </span>
                <span className="text-white font-bold">{progress.submitted_deliverables}/{progress.total_deliverables}</span>
              </div>
            </div>
          </div>
        )}

        {profile?.role === 'mentor' && (
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition border-2 border-blue-400 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Reflection Group
            </button>
            <button
              onClick={handleViewLearnerProgress}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 transition border-2 border-green-400 text-sm"
            >
              <BarChart className="w-4 h-4" />
              View Learner Progress
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl border-3 border-amber-400/60 shadow-xl mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-6 py-3 sm:py-4 font-bold transition-all whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border-b-4 border-amber-400'
                    : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">Studio Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-amber-300 font-bold mb-2">Duration</p>
                <p className="text-white text-lg">{studio.duration_weeks} weeks</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-amber-300 font-bold mb-2">Enrollment</p>
                <p className="text-white text-lg">Open Enrollment</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-amber-300 font-bold mb-2">Category</p>
                <p className="text-white text-lg capitalize">{studio.category}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">Learning Journey</h2>
            <p className="text-blue-100 leading-relaxed mb-4">
              This studio follows a structured 4-phase approach: Understand, Define, Build, and Deploy.
              You'll work through hands-on tasks, create real deliverables, and receive guidance from
              experienced mentors throughout your journey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {phases.map((phase) => (
                <div key={phase.id} className="bg-white/10 rounded-xl p-3 border border-amber-400/30">
                  <p className="text-amber-300 font-bold text-sm">Phase {phase.phase_number}</p>
                  <p className="text-white font-semibold">{phase.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {phases.length === 0 ? (
            <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
              <TrendingUp className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <p className="text-white font-bold text-lg">No roadmap available yet</p>
              <p className="text-blue-200 mt-2">Check back soon for the learning roadmap</p>
            </div>
          ) : (
            phases.map((phase) => {
            const phaseTasks = tasks[phase.id] || [];
            const completedCount = phaseTasks.filter(t => completedTaskIds.has(t.id)).length;
            const phaseProgress = phaseTasks.length > 0 ? Math.round((completedCount / phaseTasks.length) * 100) : 0;

            return (
              <div key={phase.id} className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm font-bold border border-amber-400/50">
                        Phase {phase.phase_number}
                      </span>
                      <h3 className="text-2xl font-bold text-white">{phase.title}</h3>
                    </div>
                    <p className="text-blue-200 leading-relaxed">{phase.description}</p>
                  </div>
                  {enrollment && (
                    <div className="text-right">
                      <p className="text-white font-bold text-2xl">{phaseProgress}%</p>
                      <p className="text-blue-200 text-sm">{completedCount}/{phaseTasks.length} tasks</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {phaseTasks.map((task) => {
                    const isCompleted = completedTaskIds.has(task.id);
                    const isMentor = profile?.role === 'mentor';
                    const canInteract = enrollment && enrollment.role === 'learner';

                    return (
                      <button
                        key={task.id}
                        onClick={() => canInteract && handleTaskToggle(task.id)}
                        disabled={!canInteract && !isMentor}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                          isCompleted
                            ? 'bg-green-500/10 border-green-400/50'
                            : 'bg-white/10 border-amber-400/30 hover:border-amber-400/60'
                        } ${canInteract || isMentor ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 text-left">
                          <p className={`font-bold ${isCompleted ? 'text-green-300 line-through' : 'text-white'}`}>
                            {task.title}
                          </p>
                          <p className="text-blue-200 text-sm">{task.description}</p>
                          {task.estimated_hours && (
                            <p className="text-amber-300 text-xs mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimated_hours}h estimated
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {phase.deliverable_title && (
                  <div className="bg-amber-500/10 border-2 border-amber-400/50 rounded-xl p-4">
                    <p className="text-amber-300 font-bold text-sm mb-1">Phase Deliverable</p>
                    <p className="text-white font-semibold mb-1">{phase.deliverable_title}</p>
                    <p className="text-blue-200 text-sm">{phase.deliverable_description}</p>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="space-y-6">
          {modules.length === 0 ? (
            <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
              <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <p className="text-white font-bold text-lg">No modules available yet</p>
              <p className="text-blue-200 mt-2">Learning modules will be added soon</p>
            </div>
          ) : (
            modules.map((module) => (
            <div key={module.id} className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-amber-500/20 p-3 rounded-xl border-2 border-amber-400/50">
                  <BookOpen className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{module.title}</h3>
                  <p className="text-blue-200 text-sm">{module.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                {module.resources.map((resource, idx) => {
                  const isPlaceholder = !resource.url || resource.url === '#';

                  if (isPlaceholder) {
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-gray-400/30 opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded border border-gray-400/50 uppercase font-bold">
                            {resource.type}
                          </span>
                          <span className="text-white font-semibold">{resource.title}</span>
                        </div>
                        <span className="text-xs text-gray-400">Coming Soon</span>
                      </div>
                    );
                  }

                  return (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-amber-400/30 hover:border-amber-400/60 hover:bg-white/15 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-400/50 uppercase font-bold">
                          {resource.type}
                        </span>
                        <span className="text-white font-semibold">{resource.title}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                    </a>
                  );
                })}
              </div>
            </div>
          ))
          )}
        </div>
      )}

      {activeTab === 'deliverables' && (
        <div className="space-y-4">
          {deliverables.length === 0 ? (
            <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
              <Upload className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <p className="text-white font-bold text-lg">No deliverables yet</p>
              <p className="text-blue-200 mt-2">Deliverables will be assigned as you progress</p>
            </div>
          ) : (
            deliverables.map((deliverable) => {
            const submission = submissions[deliverable.id];
            return (
              <div key={deliverable.id} className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{deliverable.title}</h3>
                    <p className="text-blue-200 text-sm">{deliverable.description}</p>
                  </div>
                  {submission && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      submission.status === 'approved' ? 'bg-green-500/20 text-green-300 border-green-400/50' :
                      submission.status === 'reviewed' ? 'bg-blue-500/20 text-blue-300 border-blue-400/50' :
                      submission.status === 'submitted' ? 'bg-amber-500/20 text-amber-300 border-amber-400/50' :
                      'bg-gray-500/20 text-gray-300 border-gray-400/50'
                    }`}>
                      {submission.status}
                    </span>
                  )}
                </div>

                {submission ? (
                  <div className="bg-white/10 rounded-xl p-4 border border-amber-400/30">
                    {submission.file_name && (
                      <div className="mb-3">
                        <p className="text-blue-200 text-xs mb-1">File Submitted:</p>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-300" />
                          <span className="text-white text-sm">{submission.file_name}</span>
                          {submission.file_size && (
                            <span className="text-blue-200 text-xs">({(submission.file_size / 1024).toFixed(1)} KB)</span>
                          )}
                        </div>
                      </div>
                    )}
                    {submission.link_url && (
                      <p className="text-white mb-2">
                        <span className="text-blue-200 text-sm">Link: </span>
                        <a href={submission.link_url} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline">
                          {submission.link_url}
                        </a>
                      </p>
                    )}
                    {submission.notes && (
                      <p className="text-blue-100 text-sm mb-3">{submission.notes}</p>
                    )}
                    {submission.submitted_at && (
                      <p className="text-blue-300 text-xs mb-3">
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    )}
                    {submission.mentor_feedback && (
                      <div className="mt-3 pt-3 border-t border-amber-400/30">
                        <p className="text-amber-300 font-bold text-sm mb-1">Mentor Feedback:</p>
                        <p className="text-blue-100 text-sm">{submission.mentor_feedback}</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleOpenSubmitModal(deliverable)}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    >
                      Replace Submission
                    </button>
                  </div>
                ) : enrollment ? (
                  <div className="bg-white/10 rounded-xl p-4 border border-amber-400/30 text-center">
                    <p className="text-blue-200 text-sm mb-3">No submission yet</p>
                    <button
                      onClick={() => handleOpenSubmitModal(deliverable)}
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:from-amber-600 hover:to-yellow-700 transition-all"
                    >
                      Submit Deliverable
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/10 rounded-xl p-4 border border-amber-400/30 text-center">
                    <p className="text-blue-200 text-sm">Enroll in studio to submit deliverables</p>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
              <Video className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <p className="text-white font-bold text-lg">No sessions scheduled yet</p>
              <p className="text-blue-200 mt-2">Check back later for live session announcements</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isPast = new Date(session.session_date) < new Date();
              return (
                <div key={session.id} className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{session.title}</h3>
                      <p className="text-blue-200 text-sm">{session.description}</p>
                    </div>
                    {!isPast && (
                      <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold border border-green-400/50">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/10 rounded-xl p-3 border border-amber-400/30">
                      <p className="text-amber-300 text-xs font-bold mb-1">Date</p>
                      <p className="text-white font-semibold">{formatDate(session.session_date)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-amber-400/30">
                      <p className="text-amber-300 text-xs font-bold mb-1">Time</p>
                      <p className="text-white font-semibold">{formatTime(session.session_date)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-amber-400/30">
                      <p className="text-amber-300 text-xs font-bold mb-1">Duration</p>
                      <p className="text-white font-semibold">{session.duration_minutes} min</p>
                    </div>
                  </div>

                  {session.meeting_link && !isPast && (
                    <a
                      href={session.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold text-center hover:from-amber-600 hover:to-yellow-700 transition-all mb-3"
                    >
                      Join Session
                    </a>
                  )}

                  {session.recording_url && isPast && (
                    <a
                      href={session.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-center hover:bg-blue-700 transition-all mb-3"
                    >
                      Watch Recording
                    </a>
                  )}

                  {session.notes && (
                    <div className="bg-white/10 rounded-xl p-4 border border-amber-400/30">
                      <p className="text-amber-300 font-bold text-sm mb-2">Session Notes</p>
                      <p className="text-blue-100 text-sm whitespace-pre-wrap">{session.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Mentors: coming soon */}
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
            <h2 className="text-2xl font-bold text-amber-300 mb-1">Mentors</h2>
            <p className="text-blue-300/60 text-sm mb-4">Dedicated mentors for this studio are being onboarded.</p>
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-400/20 rounded-xl px-5 py-4">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-amber-200 font-semibold text-sm">Coming Soon: Mentor support is being set up for this studio.</p>
            </div>
          </div>

          {/* Participants: count only, no names */}
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">Enrolled Participants</h2>
            {enrollments.length === 0 ? (
              <p className="text-blue-200 text-center py-8">No participants yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {enrollments.filter(e => e.role !== 'mentor').map((enroll, i) => (
                  <div key={enroll.id} className="bg-white/8 rounded-xl p-3 border border-white/10 text-center">
                    <div className="w-9 h-9 rounded-full bg-blue-700/60 border border-white/10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-white/60 text-sm font-bold">{i + 1}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      enroll.role === 'facilitator' ? 'text-blue-300 bg-blue-500/20' : 'text-green-300 bg-green-500/20'
                    }`}>
                      {enroll.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-blue-400/40 text-xs mt-4 text-center">Participant names are kept private.</p>
          </div>
        </div>
      )}

      {activeTab === 'my-resources' && (
        <div className="space-y-6">
          <MyResources studioId={studioId} />
        </div>
      )}

      {activeTab === 'resource-bank' && (
        <div className="space-y-6">
          <SharedResourceBank studioId={studioId} />
        </div>
      )}

      {showSubmitModal && selectedDeliverable && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-blue-900 rounded-2xl p-6 max-w-2xl w-full border-3 border-amber-400/60 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-300">Submit Deliverable</h2>
              <button
                onClick={handleCloseSubmitModal}
                className="text-blue-200 hover:text-white transition-colors"
                disabled={uploading}
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{selectedDeliverable.title}</h3>
              <p className="text-blue-200 text-sm mb-1">{selectedDeliverable.description}</p>
              <p className="text-blue-300 text-xs">Studio: {studio?.title}</p>
            </div>

            <div className="mb-6">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setSubmissionMethod('file')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                    submissionMethod === 'file'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/10 text-blue-200 hover:bg-white/20'
                  }`}
                  disabled={uploading}
                >
                  <Upload className="w-5 h-5 inline mr-2" />
                  Upload File
                </button>
                <button
                  onClick={() => setSubmissionMethod('link')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                    submissionMethod === 'link'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/10 text-blue-200 hover:bg-white/20'
                  }`}
                  disabled={uploading}
                >
                  <ExternalLink className="w-5 h-5 inline mr-2" />
                  Paste Link
                </button>
              </div>

              {submissionMethod === 'file' && (
                <div>
                  <label className="block text-blue-200 text-sm mb-2">
                    Select File (PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, MP4, ZIP - Max 50MB)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.mp4,.zip"
                    className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white"
                    disabled={uploading}
                  />
                  {submissionFile && (
                    <p className="text-green-300 text-sm mt-2">
                      Selected: {submissionFile.name} ({(submissionFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  {submissions[selectedDeliverable.id]?.file_name && !submissionFile && (
                    <p className="text-blue-200 text-sm mt-2">
                      Current: {submissions[selectedDeliverable.id].file_name}
                    </p>
                  )}
                </div>
              )}

              {submissionMethod === 'link' && (
                <div>
                  <label className="block text-blue-200 text-sm mb-2">
                    Enter URL
                  </label>
                  <input
                    type="url"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                    disabled={uploading}
                  />
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-blue-200 text-sm mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder="Add any additional notes about your submission..."
                rows={3}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                disabled={uploading}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseSubmitModal}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDeliverable}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
