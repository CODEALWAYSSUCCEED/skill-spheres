import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, ExternalLink, Download, CreditCard as Edit, Trash2, FileText, Link as LinkIcon, Tag, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getSkillMilestones } from '../lib/milestoneService';
import type { SkillMilestone } from '../lib/milestoneService';
import Modal from '../components/Modal';

interface SkillResourcesPageProps {
  skillId: string;
  onBack: () => void;
}

interface SkillResource {
  id: string;
  user_id: string;
  skill_id: string;
  milestone_id: string | null;
  title: string;
  url: string | null;
  file_path: string | null;
  resource_type: 'link' | 'file';
  tags: string[];
  notes: string | null;
  created_at: string;
  milestone?: {
    id: string;
    title: string;
  } | null;
}

interface Skill {
  id: string;
  title: string;
}

export function SkillResourcesPage({ skillId, onBack }: SkillResourcesPageProps) {
  const { user } = useAuth();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [resources, setResources] = useState<SkillResource[]>([]);
  const [milestones, setMilestones] = useState<SkillMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<SkillResource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    resource_type: 'link' as 'link' | 'file',
    tags: '',
    notes: '',
    milestone_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [skillId, user]);

  const loadData = async () => {
    setLoading(true);

    const { data: skillData } = await supabase
      .from('skills')
      .select('id, title')
      .eq('id', skillId)
      .maybeSingle();

    if (skillData) {
      setSkill(skillData);
    }

    const milestonesData = await getSkillMilestones(skillId);
    setMilestones(milestonesData);

    if (user) {
      const { data: resourcesData } = await supabase
        .from('skill_resources')
        .select('*')
        .eq('skill_id', skillId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (resourcesData) {
        const resourcesWithMilestones = await Promise.all(
          resourcesData.map(async (resource) => {
            if (resource.milestone_id) {
              const milestone = milestonesData.find(m => m.id === resource.milestone_id);
              return {
                ...resource,
                milestone: milestone ? { id: milestone.id, title: milestone.title } : null,
              };
            }
            return { ...resource, milestone: null };
          })
        );
        setResources(resourcesWithMilestones);
      }
    }

    setLoading(false);
  };

  const handleOpenAddModal = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      url: '',
      resource_type: 'link',
      tags: '',
      notes: '',
      milestone_id: '',
    });
    setShowAddModal(true);
  };

  const handleEditResource = (resource: SkillResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      url: resource.url || '',
      resource_type: resource.resource_type,
      tags: resource.tags.join(', '),
      notes: resource.notes || '',
      milestone_id: resource.milestone_id || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const resourceData = {
      skill_id: skillId,
      user_id: user.id,
      title: formData.title,
      url: formData.resource_type === 'link' ? formData.url : null,
      file_path: formData.resource_type === 'file' ? formData.url : null,
      resource_type: formData.resource_type,
      tags: tagsArray,
      notes: formData.notes || null,
      milestone_id: formData.milestone_id || null,
    };

    if (editingResource) {
      await supabase
        .from('skill_resources')
        .update(resourceData)
        .eq('id', editingResource.id);
    } else {
      await supabase
        .from('skill_resources')
        .insert(resourceData);
    }

    setSubmitting(false);
    setShowAddModal(false);
    loadData();
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Delete this resource?')) return;

    await supabase
      .from('skill_resources')
      .delete()
      .eq('id', resourceId);

    loadData();
  };

  const handleOpenResource = (resource: SkillResource) => {
    if (resource.resource_type === 'link' && resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.file_path) {
      window.open(resource.file_path, '_blank');
    }
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading resources...</div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white hover:text-amber-300 mb-6 font-semibold transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Skill
      </button>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-amber-200 p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              {skill?.title} Resources
            </h1>
            <p className="text-gray-600">Manage your learning resources for this skill</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Resource
          </button>
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-gray-200">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold mb-2">No resources yet</p>
            <p className="text-gray-500 mb-6">You haven't added any resources for this skill yet.</p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Your First Resource
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Title</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Type</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Milestone</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Tags</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Added</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{resource.title}</div>
                        {resource.notes && (
                          <div className="text-sm text-gray-600 mt-1">{resource.notes}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                          {resource.resource_type === 'link' ? (
                            <>
                              <LinkIcon className="w-3 h-3" />
                              Link
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              File
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {resource.milestone ? (
                          <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            {resource.milestone.title}
                          </span>
                        ) : (
                          <span className="text-blue-400/40">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {resource.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                {tag}
                              </span>
                            ))}
                            {resource.tags.length > 2 && (
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                +{resource.tags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-blue-400/40">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDate(resource.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenResource(resource)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Open resource"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditResource(resource)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit resource"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete resource"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {resources.map((resource) => (
                <div key={resource.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-amber-300 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{resource.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                          {resource.resource_type === 'link' ? (
                            <>
                              <LinkIcon className="w-3 h-3" />
                              Link
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              File
                            </>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(resource.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {resource.notes && (
                    <p className="text-sm text-gray-600 mb-3">{resource.notes}</p>
                  )}

                  {resource.milestone && (
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                        {resource.milestone.title}
                      </span>
                    </div>
                  )}

                  {resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resource.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenResource(resource)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      onClick={() => handleEditResource(resource)}
                      className="flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-600 transition text-sm"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource.id)}
                      className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingResource ? 'Edit Resource' : 'Add Resource'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Resource title"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Type *</label>
              <select
                value={formData.resource_type}
                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value as 'link' | 'file' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="link">Link</option>
                <option value="file">File</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {formData.resource_type === 'link' ? 'URL *' : 'File Path *'}
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder={formData.resource_type === 'link' ? 'https://...' : '/path/to/file'}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Link to Milestone (optional)
              </label>
              <select
                value={formData.milestone_id}
                onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">No milestone</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="tutorial, beginner, reference"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Additional notes about this resource..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingResource ? 'Update' : 'Add Resource'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
