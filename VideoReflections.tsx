import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, ExternalLink, Share2, Lock, Upload, Link as LinkIcon, Download, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { skillResourceService } from '../lib/skillResourceService';
import type { SkillResource, SkillResourceWithUser, SkillResourceType, ResourceKind } from '../types/resource';
import Modal from './Modal';

interface SkillResourcesProps {
  skillId: string;
  studioId?: string;
}

export default function SkillResources({ skillId, studioId }: SkillResourcesProps) {
  const { user } = useAuth();
  const [myResources, setMyResources] = useState<SkillResource[]>([]);
  const [sharedResources, setSharedResources] = useState<SkillResourceWithUser[]>([]);
  const [filteredShared, setFilteredShared] = useState<SkillResourceWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<SkillResource | null>(null);
  const [activeView, setActiveView] = useState<'my' | 'shared'>('my');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article' as SkillResourceType,
    tags: [] as string[],
    resource_kind: 'link' as ResourceKind,
    url: '',
    visibility: 'private' as 'private' | 'shared',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [urlError, setUrlError] = useState('');
  const [fileError, setFileError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<SkillResourceType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      loadResources();
    }
  }, [user, skillId]);

  useEffect(() => {
    applyFilters();
  }, [sharedResources, searchQuery, filterType]);

  const loadResources = async () => {
    if (!user) return;

    try {
      const [myData, sharedData] = await Promise.all([
        skillResourceService.getUserResourcesForSkill(user.id, skillId),
        skillResourceService.getSharedResourcesForSkill(skillId),
      ]);

      setMyResources(myData);
      setSharedResources(sharedData);
    } catch (error: any) {
      console.error('Error loading resources:', error);
      showToastMessage('Failed to load resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sharedResources];

    if (searchQuery.trim()) {
      filtered = skillResourceService.fuzzySearch(filtered, searchQuery);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    setFilteredShared(filtered);
  };

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('URL is required');
      return false;
    }

    if (!skillResourceService.isValidUrl(url)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }

    setUrlError('');
    return true;
  };

  const validateFile = (file: File | null): boolean => {
    if (!file) {
      setFileError('Please select a file');
      return false;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('File size must be less than 20MB');
      return false;
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.webp', '.txt'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setFileError('File type not allowed. Allowed: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, WEBP, TXT');
      return false;
    }

    setFileError('');
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) return;

    if (!formData.title.trim()) {
      showToastMessage('Title is required', 'error');
      return;
    }

    if (formData.resource_kind === 'link') {
      if (!validateUrl(formData.url)) return;
    } else {
      if (!editingResource && !validateFile(selectedFile)) return;
    }

    setUploading(true);

    try {
      let fileData = null;

      if (formData.resource_kind === 'upload' && selectedFile && !editingResource) {
        fileData = await skillResourceService.uploadFile(user.id, selectedFile);
      }

      const resourceData = {
        skill_id: skillId,
        studio_id: studioId || null,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        tags: formData.tags,
        resource_kind: formData.resource_kind,
        url: formData.resource_kind === 'link' ? formData.url : null,
        file_url: fileData?.url || editingResource?.file_url || null,
        file_name: fileData?.name || editingResource?.file_name || null,
        file_type: fileData?.type || editingResource?.file_type || null,
        file_size: fileData?.size || editingResource?.file_size || null,
        visibility: formData.visibility,
      };

      if (editingResource) {
        await skillResourceService.updateResource(editingResource.id, {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          tags: formData.tags,
          visibility: formData.visibility,
        });
        showToastMessage('Resource updated successfully', 'success');
      } else {
        await skillResourceService.createResource(user.id, resourceData);
        showToastMessage('Resource saved', 'success');
      }

      resetForm();
      await loadResources();
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to save resource', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (resource: SkillResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      tags: resource.tags || [],
      resource_kind: resource.resource_kind,
      url: resource.url || '',
      visibility: resource.visibility,
    });
    setShowModal(true);
  };

  const handleDelete = async (resource: SkillResource) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      await skillResourceService.deleteResource(resource.id, resource.file_url);
      showToastMessage('Resource deleted', 'success');
      await loadResources();
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to delete resource', 'error');
    }
  };

  const handleToggleVisibility = async (resource: SkillResource) => {
    try {
      await skillResourceService.toggleVisibility(resource.id, resource.visibility);
      const action = resource.visibility === 'private' ? 'shared to community' : 'made private';
      showToastMessage(`Resource ${action}`, 'success');
      await loadResources();
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to update visibility', 'error');
    }
  };

  const handleOpenResource = async (resource: SkillResource | SkillResourceWithUser) => {
    if (resource.resource_kind === 'link' && resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.resource_kind === 'upload' && resource.file_url) {
      const url = await skillResourceService.getFileUrl(resource.file_url);
      window.open(url, '_blank');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'article',
      tags: [],
      resource_kind: 'link',
      url: '',
      visibility: 'private',
    });
    setSelectedFile(null);
    setTagInput('');
    setUrlError('');
    setFileError('');
    setEditingResource(null);
    setShowModal(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const getTypeColor = (type: SkillResourceType) => {
    const colors = {
      article: 'bg-blue-500/20 text-blue-300 border-blue-400/50',
      video: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
      tool: 'bg-orange-500/20 text-orange-300 border-orange-400/50',
      template: 'bg-pink-500/20 text-pink-300 border-pink-400/50',
      dataset: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
      paper: 'bg-green-500/20 text-green-300 border-green-400/50',
      notes: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50',
      other: 'bg-gray-500/20 text-gray-300 border-gray-400/50',
    };
    return colors[type];
  };

  const getTypeLabel = (type: SkillResourceType) => {
    const labels = {
      article: 'Article',
      video: 'Video',
      tool: 'Tool',
      template: 'Template',
      dataset: 'Dataset',
      paper: 'Paper',
      notes: 'Notes',
      other: 'Other',
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-blue-200">Loading resources...</div>
      </div>
    );
  }

  const ResourceCard = ({ resource, isOwner }: { resource: SkillResource | SkillResourceWithUser; isOwner: boolean }) => (
    <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">{resource.title}</h3>
          <div className="flex gap-2 flex-wrap">
            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(resource.type)}`}>
              {getTypeLabel(resource.type)}
            </span>
            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${
              resource.resource_kind === 'link'
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/50'
                : 'bg-green-500/20 text-green-300 border-green-400/50'
            }`}>
              {resource.resource_kind === 'link' ? 'Link' : 'File'}
            </span>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => handleToggleVisibility(resource as SkillResource)}
            className={`p-2 rounded-lg transition-all ${
              resource.visibility === 'shared'
                ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
            }`}
            title={resource.visibility === 'shared' ? 'Make Private' : 'Share to Community'}
          >
            {resource.visibility === 'shared' ? <Share2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </button>
        )}
      </div>

      {resource.description && (
        <p className="text-blue-200 text-sm mb-3">{resource.description}</p>
      )}

      {resource.tags && resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {resource.tags.map((tag) => (
            <span key={tag} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs border border-blue-400/50">
              {tag}
            </span>
          ))}
        </div>
      )}

      {!isOwner && 'users' in resource && resource.users && (
        <div className="text-sm text-amber-300 mb-3">
          Shared by {resource.users.full_name}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-amber-400/30">
        <button
          onClick={() => handleOpenResource(resource)}
          className="text-amber-300 hover:text-amber-200 font-semibold text-sm flex items-center gap-1"
        >
          {resource.resource_kind === 'link' ? 'Open Link' : 'Open File'}
          {resource.resource_kind === 'link' ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        </button>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(resource as SkillResource)}
              className="text-blue-300 hover:text-white transition-colors p-2"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(resource as SkillResource)}
              className="text-red-400 hover:text-red-300 transition-colors p-2"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-blue-300">
        {new Date(resource.created_at).toLocaleDateString()}
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${
          toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-bold`}>
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('my')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeView === 'my'
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            My Resources
          </button>
          <button
            onClick={() => setActiveView('shared')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeView === 'shared'
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            Shared Resource Bank
          </button>
        </div>

        {activeView === 'my' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Resource
          </button>
        )}
      </div>

      {activeView === 'my' ? (
        myResources.length === 0 ? (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
            <p className="text-blue-200 text-lg">You haven't added any resources for this skill yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-5)' }}>
            {myResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} isOwner={true} />
            ))}
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col sm:flex-row" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-amber-400/30 rounded-xl text-white placeholder-blue-300/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 justify-center"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Filter by Type</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    filterType === 'all' ? 'bg-amber-500 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20'
                  }`}
                >
                  All
                </button>
                {(['article', 'video', 'tool', 'template', 'dataset', 'paper', 'notes', 'other'] as SkillResourceType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      filterType === type ? 'bg-amber-500 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20'
                    }`}
                  >
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredShared.length === 0 ? (
            <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
              {sharedResources.length === 0 ? (
                <>
                  <p className="text-blue-200 text-lg">No shared resources for this skill yet.</p>
                  <p className="text-blue-300 text-sm mt-2">Be the first to share.</p>
                </>
              ) : (
                <>
                  <p className="text-blue-200 text-lg">No resources match your search.</p>
                  <p className="text-blue-300 text-sm mt-2">Try adjusting your filters.</p>
                </>
              )}
            </div>
          ) : (
            <div>
              <p className="text-blue-200 text-sm" style={{ marginBottom: 'var(--space-4)' }}>
                Showing {filteredShared.length} {filteredShared.length === 1 ? 'resource' : 'resources'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-5)' }}>
                {filteredShared.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} isOwner={false} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingResource ? 'Edit Resource' : 'Add Resource'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                  placeholder="e.g., Intro to Machine Learning"
                  required
                />
              </div>

              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SkillResourceType })}
                  className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white"
                >
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="tool">Tool</option>
                  <option value="template">Template</option>
                  <option value="dataset">Dataset</option>
                  <option value="paper">Paper</option>
                  <option value="notes">Notes</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Tags</label>
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
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg text-sm border border-amber-400/50 flex items-center gap-2">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-amber-300 hover:text-white">
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {!editingResource && (
                <div>
                  <label className="block text-blue-200 text-sm font-semibold mb-2">Resource Input Type</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, resource_kind: 'link' });
                        setSelectedFile(null);
                        setFileError('');
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.resource_kind === 'link'
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5" />
                      Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, resource_kind: 'upload' });
                        setUrlError('');
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.resource_kind === 'upload'
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      <Upload className="w-5 h-5" />
                      Upload
                    </button>
                  </div>
                </div>
              )}

              {formData.resource_kind === 'link' ? (
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
                  {urlError && <p className="text-red-400 text-sm mt-1">{urlError}</p>}
                </div>
              ) : (
                !editingResource && (
                  <div>
                    <label className="block text-blue-200 text-sm font-semibold mb-2">
                      File <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        if (file) validateFile(file);
                      }}
                      className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt"
                    />
                    <p className="text-blue-300 text-xs mt-1">
                      Allowed: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, WEBP, TXT (Max 20MB)
                    </p>
                    {fileError && <p className="text-red-400 text-sm mt-1">{fileError}</p>}
                  </div>
                )
              )}

              <div>
                <label className="flex items-center gap-2 text-blue-200 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.visibility === 'shared'}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.checked ? 'shared' : 'private' })}
                    className="w-4 h-4"
                  />
                  Share to Skill Bank
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Saving...' : editingResource ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
