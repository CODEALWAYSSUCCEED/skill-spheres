import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Upload, Calendar, CheckCircle, Clock, Star, MessageSquare, ExternalLink, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { capstoneService } from '../lib/capstoneService';
import type {
  CapstoneProjectWithDetails,
  CreateCapstoneProjectData,
  UpdateCapstoneProjectData,
  CreateWeeklyUpdateData,
  CapstoneStatus,
} from '../types/capstone';

interface CapstoneProjectProps {
  skillId: string;
  skillTitle: string;
}

export default function CapstoneProject({ skillId, skillTitle }: CapstoneProjectProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CapstoneProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<CapstoneProjectWithDetails | null>(null);
  const [selectedProject, setSelectedProject] = useState<CapstoneProjectWithDetails | null>(null);
  const [showWeeklyUpdate, setShowWeeklyUpdate] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [formData, setFormData] = useState<CreateCapstoneProjectData>({
    skill_id: skillId,
    title: '',
    description: '',
    status: 'planning',
    github_repo_url: '',
    live_demo_url: '',
    notes: '',
    visibility: 'private',
  });
  const [weeklyUpdateData, setWeeklyUpdateData] = useState<CreateWeeklyUpdateData>({
    capstone_project_id: '',
    week_number: 1,
    update_text: '',
    challenges: '',
    learnings: '',
    next_steps: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, skillId]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      const data = await capstoneService.getProjectsBySkill(skillId, user.id);
      setProjects(data);

      if (data.length > 0 && data[0].status === 'in_progress') {
        setSelectedProject(data[0]);
        setCurrentWeek(capstoneService.getWeekNumber(data[0].start_date));
      }
    } catch (error: any) {
      console.error('Error loading capstone projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setToastMessage(message);
    setToastType('success');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const showError = (message: string) => {
    setToastMessage(message);
    setToastType('error');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProject) {
        await capstoneService.updateProject(editingProject.id, formData as UpdateCapstoneProjectData);
        showSuccess('Capstone project updated');
      } else {
        await capstoneService.createProject(user.id, formData);
        showSuccess('Capstone project created');
      }

      resetForm();
      await loadProjects();
    } catch (error: any) {
      showError(error.message || 'Failed to save project');
    }
  };

  const handleEdit = (project: CapstoneProjectWithDetails) => {
    setEditingProject(project);
    setFormData({
      skill_id: project.skill_id,
      title: project.title,
      description: project.description,
      status: project.status,
      github_repo_url: project.github_repo_url || '',
      live_demo_url: project.live_demo_url || '',
      notes: project.notes,
      visibility: project.visibility,
    });
    setShowForm(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this capstone project?')) {
      return;
    }

    try {
      await capstoneService.deleteProject(projectId);
      showSuccess('Project deleted');
      await loadProjects();
    } catch (error: any) {
      showError(error.message || 'Failed to delete project');
    }
  };

  const handleStartProject = async (projectId: string) => {
    try {
      await capstoneService.updateProject(projectId, {
        status: 'in_progress',
        start_date: new Date().toISOString(),
      });
      showSuccess('Project started! Good luck!');
      await loadProjects();
    } catch (error: any) {
      showError(error.message || 'Failed to start project');
    }
  };

  const handleCompleteProject = async (projectId: string) => {
    try {
      await capstoneService.updateProject(projectId, {
        status: 'completed',
        actual_end_date: new Date().toISOString(),
      });
      showSuccess('Congratulations on completing your project!');
      await loadProjects();
    } catch (error: any) {
      showError(error.message || 'Failed to complete project');
    }
  };

  const handleSubmitProject = async (projectId: string) => {
    try {
      await capstoneService.updateProject(projectId, {
        status: 'submitted',
        visibility: 'shared',
      });
      showSuccess('Project submitted successfully!');
      await loadProjects();
    } catch (error: any) {
      showError(error.message || 'Failed to submit project');
    }
  };

  const handleWeeklyUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await capstoneService.createWeeklyUpdate(weeklyUpdateData);
      showSuccess(`Week ${weeklyUpdateData.week_number} update saved!`);
      setShowWeeklyUpdate(false);
      await loadProjects();
    } catch (error: any) {
      showError(error.message || 'Failed to save weekly update');
    }
  };

  const openWeeklyUpdateForm = (project: CapstoneProjectWithDetails, week: number) => {
    setWeeklyUpdateData({
      capstone_project_id: project.id,
      week_number: week,
      update_text: '',
      challenges: '',
      learnings: '',
      next_steps: '',
    });
    setShowWeeklyUpdate(true);
  };

  const resetForm = () => {
    setFormData({
      skill_id: skillId,
      title: '',
      description: '',
      status: 'planning',
      github_repo_url: '',
      live_demo_url: '',
      notes: '',
      visibility: 'private',
    });
    setEditingProject(null);
    setShowForm(false);
  };

  const getStatusColor = (status: CapstoneStatus) => {
    const colors = {
      planning: 'bg-blue-500/20 text-blue-300 border-blue-400/50',
      in_progress: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50',
      completed: 'bg-green-500/20 text-green-300 border-green-400/50',
      submitted: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
    };
    return colors[status];
  };

  const getStatusLabel = (status: CapstoneStatus) => {
    const labels = {
      planning: 'Planning',
      in_progress: 'In Progress',
      completed: 'Completed',
      submitted: 'Submitted',
    };
    return labels[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-blue-200">Loading capstone projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${
          toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-bold`}>
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-amber-300">Capstone Project</h2>
          <p className="text-blue-200 text-sm mt-1">4-Week Project to Demonstrate Mastery</p>
        </div>
        {projects.length === 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Start Capstone
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingProject ? 'Edit Capstone Project' : 'Plan Your Capstone Project'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Project Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder={`e.g., Building an AI-Powered ${skillTitle} Application`}
                required
              />
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Project Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder="Describe what you plan to build and how it demonstrates your mastery of this skill..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">
                  GitHub Repository (optional)
                </label>
                <input
                  type="url"
                  value={formData.github_repo_url}
                  onChange={(e) => setFormData({ ...formData, github_repo_url: e.target.value })}
                  className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">
                  Live Demo URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.live_demo_url}
                  onChange={(e) => setFormData({ ...formData, live_demo_url: e.target.value })}
                  className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                  placeholder="https://your-demo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Planning Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder="Key milestones, resources needed, timeline notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all"
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showWeeklyUpdate && (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">
            Week {weeklyUpdateData.week_number} Progress Update
          </h3>

          <form onSubmit={handleWeeklyUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                What did you accomplish this week?
              </label>
              <textarea
                value={weeklyUpdateData.update_text}
                onChange={(e) => setWeeklyUpdateData({ ...weeklyUpdateData, update_text: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder="Describe your progress..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Challenges Faced
              </label>
              <textarea
                value={weeklyUpdateData.challenges}
                onChange={(e) => setWeeklyUpdateData({ ...weeklyUpdateData, challenges: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder="What obstacles did you encounter?"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Key Learnings
              </label>
              <textarea
                value={weeklyUpdateData.learnings}
                onChange={(e) => setWeeklyUpdateData({ ...weeklyUpdateData, learnings: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder="What did you learn?"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Next Steps
              </label>
              <textarea
                value={weeklyUpdateData.next_steps}
                onChange={(e) => setWeeklyUpdateData({ ...weeklyUpdateData, next_steps: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder="What's your plan for next week?"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowWeeklyUpdate(false)}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all"
              >
                Save Update
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 && !showForm ? (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
          <Upload className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Ready to Showcase Your Skills?</h3>
          <p className="text-blue-200 mb-2">
            A capstone project is a 4-week intensive project where you demonstrate mastery of {skillTitle}.
          </p>
          <p className="text-blue-300 text-sm mb-6">
            You'll track weekly progress, upload your final presentation, and share your work with the community.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all"
          >
            Start Planning Your Capstone
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const daysRemaining = capstoneService.getDaysRemaining(project.target_end_date);
            const weeksCompleted = project.weekly_updates?.length || 0;

            return (
              <div key={project.id} className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                      {project.status === 'in_progress' && (
                        <span className="text-sm text-blue-200 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Due today!'}
                        </span>
                      )}
                      <span className="text-sm text-blue-200 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Started {formatDate(project.start_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {project.status === 'planning' && (
                      <button
                        onClick={() => handleStartProject(project.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition text-sm"
                      >
                        Start Project
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 text-amber-300 hover:bg-amber-500/20 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-blue-200 mb-4">{project.description}</p>

                {project.status === 'in_progress' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-amber-300">Weekly Progress</h4>
                      <span className="text-sm text-blue-200">{weeksCompleted} / 4 weeks completed</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[1, 2, 3, 4].map((week) => {
                        const hasUpdate = project.weekly_updates?.some(u => u.week_number === week);
                        return (
                          <button
                            key={week}
                            onClick={() => !hasUpdate && openWeeklyUpdateForm(project, week)}
                            className={`p-3 rounded-xl border-2 transition ${
                              hasUpdate
                                ? 'bg-green-500/20 border-green-400/50 text-green-300'
                                : week === currentWeek
                                ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/30'
                                : 'bg-blue-500/10 border-blue-400/30 text-blue-300 opacity-50'
                            }`}
                            disabled={hasUpdate || week > currentWeek}
                          >
                            <div className="text-center">
                              {hasUpdate ? (
                                <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                              ) : (
                                <div className="w-6 h-6 mx-auto mb-1 rounded-full border-2 border-current" />
                              )}
                              <div className="text-xs font-bold">Week {week}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {weeksCompleted === 4 && project.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteProject(project.id)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all"
                      >
                        Mark Project as Completed
                      </button>
                    )}
                  </div>
                )}

                {project.weekly_updates && project.weekly_updates.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h4 className="text-sm font-bold text-amber-300 mb-3">Progress Updates</h4>
                    {project.weekly_updates
                      .sort((a, b) => a.week_number - b.week_number)
                      .map((update) => (
                        <div key={update.id} className="bg-blue-950/40 rounded-xl p-4 border border-blue-400/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-cyan-300">Week {update.week_number}</span>
                            <span className="text-xs text-blue-300">{formatDate(update.created_at)}</span>
                          </div>
                          {update.update_text && (
                            <p className="text-sm text-blue-200 mb-2">{update.update_text}</p>
                          )}
                          {update.learnings && (
                            <p className="text-sm text-green-300">
                              <strong>Learnings:</strong> {update.learnings}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-amber-400/30">
                  {project.github_repo_url && (
                    <a
                      href={project.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-white transition"
                    >
                      <Github className="w-4 h-4" />
                      View Code
                    </a>
                  )}
                  {project.live_demo_url && (
                    <a
                      href={project.live_demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  )}
                  {project.status === 'completed' && project.visibility === 'private' && (
                    <button
                      onClick={() => handleSubmitProject(project.id)}
                      className="ml-auto bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition text-sm"
                    >
                      Submit & Share
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
