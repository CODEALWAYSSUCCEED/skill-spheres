import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, ExternalLink, Share2, Lock, FileText, Link as LinkIcon, Calendar, Tag as TagIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { resourceService } from '../lib/resourceService';
import { getSkillMilestones } from '../lib/milestoneService';
import type { ResourceWithUser, ResourceType, CreateResourceData } from '../types/resource';
import type { SkillMilestone } from '../lib/milestoneService';

interface MyResourcesProps {
  studioId?: string;
  skillId?: string;
}

export default function MyResources({ studioId, skillId }: MyResourcesProps) {
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceWithUser[]>([]);
  const [milestones, setMilestones] = useState<SkillMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceWithUser | null>(null);
  const [formData, setFormData] = useState<CreateResourceData>({
    title: '',
    url: '',
    description: '',
    type: 'article',
    tags: [],
    linked_skill_id: skillId || null,
    linked_studio_id: studioId || null,
    milestone_id: null,
    visibility: 'private',
  });
  const [tagInput, setTagInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [urlError, setUrlError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, skillId]);

  const loadData = async () => {
    if (!user) return;

    try {
      const data = await resourceService.getUserResources(user.id);
      setResources(data);

      if (skillId) {
        const milestonesData = await getSkillMilestones(skillId);
        setMilestones(milestonesData);
      }
    } catch (error: any) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('URL is required');
      return false;
    }

    if (!resourceService.isValidUrl(url)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }

    setUrlError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim()) {
      setToastMessage('Title is required');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (!validateUrl(formData.url)) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingResource) {
        await resourceService.updateResource(editingResource.id, formData);
        setToastMessage('Resource updated successfully');
      } else {
        await resourceService.createResource(user.id, formData);
        setToastMessage('Resource added successfully');
      }

      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      resetForm();
      await loadData();
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to save resource');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (resource: ResourceWithUser) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      url: resource.url,
      description: resource.description,
      type: resource.type,
      tags: resource.tags || [],
      linked_skill_id: resource.linked_skill_id,
      linked_studio_id: resource.linked_studio_id,
      milestone_id: resource.milestone_id,
      visibility: resource.visibility,
    });
    setShowForm(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await resourceService.deleteResource(resourceId);
      setToastMessage('Resource deleted');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      await loadData();
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to delete resource');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleToggleVisibility = async (resource: ResourceWithUser) => {
    try {
      await resourceService.toggleVisibility(resource.id, resource.visibility);
      const action = resource.visibility === 'private' ? 'shared to community' : 'made private';
      setToastMessage(`Resource ${action}`);
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      await loadData();
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to update visibility');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      type: 'article',
      tags: [],
      linked_skill_id: skillId || null,
      linked_studio_id: studioId || null,
      milestone_id: null,
      visibility: 'private',
    });
    setTagInput('');
    setUrlError('');
    setEditingResource(null);
    setShowForm(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
  };

  const getTypeColor = (type: ResourceType) => {
    const colors = {
      article: 'bg-blue-500/20 text-blue-300 border-blue-400/50',
      video: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
      research_paper: 'bg-green-500/20 text-green-300 border-green-400/50',
      tool: 'bg-orange-500/20 text-orange-300 border-orange-400/50',
      template: 'bg-pink-500/20 text-pink-300 border-pink-400/50',
      other: 'bg-gray-500/20 text-gray-300 border-gray-400/50',
    };
    return colors[type];
  };

  const getTypeLabel = (type: ResourceType) => {
    const labels = {
      article: 'Article',
      video: 'Video',
      research_paper: 'Research',
      tool: 'Tool',
      template: 'Template',
      other: 'Other',
    };
    return labels[type];
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
        <div className="text-blue-200">Loading resources...</div>
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
        <h2 className="text-2xl font-bold text-amber-300">My Resources</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingResource ? 'Edit Resource' : 'Add New Resource'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder="e.g., Introduction to Machine Learning"
                required
              />
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => {
                  setFormData({ ...formData, url: e.target.value });
                  if (urlError) validateUrl(e.target.value);
                }}
                onBlur={(e) => validateUrl(e.target.value)}
                className={`w-full bg-white/10 border rounded-xl p-3 text-white placeholder-blue-300/50 ${
                  urlError ? 'border-red-400' : 'border-amber-400/30'
                }`}
                placeholder="https://example.com/resource"
                required
              />
              {urlError && (
                <p className="text-red-400 text-sm mt-1">{urlError}</p>
              )}
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                placeholder="Brief description of the resource..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white"
                required
              >
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="research_paper">Research Paper</option>
                <option value="tool">Tool</option>
                <option value="template">Template</option>
                <option value="other">Other</option>
              </select>
            </div>

            {skillId && milestones.length > 0 && (
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">
                  Link to Milestone (optional)
                </label>
                <select
                  value={formData.milestone_id || ''}
                  onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value || null })}
                  className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white"
                >
                  <option value="">No milestone</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-blue-200 text-sm font-semibold mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  Add
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg text-sm border border-amber-400/50 flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-amber-300 hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingResource ? 'Update Resource' : 'Add Resource'}
              </button>
            </div>
          </form>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
          <p className="text-blue-200 text-lg">You haven't added any resources yet.</p>
          <p className="text-blue-300 text-sm mt-2">Click "Add Resource" to get started!</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-blue-900/60 backdrop-blur-md rounded-2xl border-3 border-amber-400/60 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-amber-400/30 bg-blue-950/40">
                    <th className="text-left py-4 px-4 font-bold text-amber-300">Title</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-300">Type</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-300">Skill</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-300">Milestone</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-300">Tags</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-300">Added</th>
                    <th className="text-right py-4 px-4 font-bold text-amber-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id} className="border-b border-amber-400/20 hover:bg-blue-950/30 transition">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{resource.title}</div>
                        {resource.description && (
                          <div className="text-sm text-blue-200 mt-1">{resource.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(resource.type)}`}>
                          {getTypeLabel(resource.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {resource.skill ? (
                          <span className="text-sm font-semibold text-cyan-300">
                            {resource.skill.title}
                          </span>
                        ) : (
                          <span className="text-blue-400/40">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {resource.milestone ? (
                          <span className="text-sm font-semibold text-green-300 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/50">
                            {resource.milestone.title}
                          </span>
                        ) : (
                          <span className="text-blue-400/40">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {resource.tags && resource.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/50">
                                {tag}
                              </span>
                            ))}
                            {resource.tags.length > 2 && (
                              <span className="text-xs font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                                +{resource.tags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-blue-400/40">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-blue-200">
                        {formatDate(resource.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition"
                            title="Open resource"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleToggleVisibility(resource)}
                            className={`p-2 rounded-lg transition ${
                              resource.visibility === 'shared'
                                ? 'text-green-300 hover:bg-green-500/20'
                                : 'text-gray-300 hover:bg-gray-500/20'
                            }`}
                            title={resource.visibility === 'shared' ? 'Make Private' : 'Share'}
                          >
                            {resource.visibility === 'shared' ? (
                              <Share2 className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(resource)}
                            className="p-2 text-amber-300 hover:bg-amber-500/20 rounded-lg transition"
                            title="Edit resource"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(resource.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
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
          </div>

          <div className="md:hidden space-y-4">
            {resources.map((resource) => (
              <div key={resource.id} className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-4 border-3 border-amber-400/60 shadow-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{resource.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold border ${getTypeColor(resource.type)}`}>
                        {getTypeLabel(resource.type)}
                      </span>
                      <span className="text-xs text-blue-300">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(resource.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {resource.description && (
                  <p className="text-sm text-blue-200 mb-3">{resource.description}</p>
                )}

                {resource.skill && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded-full border border-cyan-400/50">
                      {resource.skill.title}
                    </span>
                  </div>
                )}

                {resource.milestone && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-green-300 bg-green-500/20 px-2 py-1 rounded-full border border-green-400/50">
                      {resource.milestone.title}
                    </span>
                  </div>
                )}

                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {resource.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-600 transition text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                  <button
                    onClick={() => handleToggleVisibility(resource)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm ${
                      resource.visibility === 'shared'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {resource.visibility === 'shared' ? (
                      <Share2 className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(resource)}
                    className="flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-600 transition text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
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
  );
}
