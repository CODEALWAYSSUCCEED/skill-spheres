import { useAuth } from '../contexts/AuthContext';
import { skillResourceService } from '../lib/skillResourceService';
import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Globe, Lock, Upload } from 'lucide-react';
import type { SkillResource, CreateSkillResourceData } from '../types/resource';

interface SkillResourcesProps {
  skillId: string;
}

export default function SkillResources({ skillId }: SkillResourcesProps) {
  const { user } = useAuth();
  const [resources, setResources] = useState<SkillResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateSkillResourceData>({
    skill_id: skillId,
    title: '',
    description: '',
    type: 'link',
    resource_kind: 'resource',
    url: '',
    tags: [],
    visibility: 'private',
  });

  useEffect(() => {
    if (user) loadResources();
  }, [skillId, user]);

  const loadResources = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await skillResourceService.getUserResourcesForSkill(user.id, skillId);
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await skillResourceService.createResource(user.id, form);
      setShowForm(false);
      setForm({ skill_id: skillId, title: '', description: '', type: 'link', resource_kind: 'resource', url: '', tags: [], visibility: 'private' });
      await loadResources();
    } catch (err) {
      console.error('Failed to create resource:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resource: SkillResource) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await skillResourceService.deleteResource(resource.id, resource.file_url);
      await loadResources();
    } catch (err) {
      console.error('Failed to delete resource:', err);
    }
  };

  const handleToggleVisibility = async (resource: SkillResource) => {
    try {
      await skillResourceService.toggleVisibility(resource.id, resource.visibility);
      await loadResources();
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  if (loading) return <div className="text-blue-200 text-sm py-4">Loading resources...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-blue-300/60 text-xs">{resources.length} resources</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-lg text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Resource
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text"
            required
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white text-sm placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
          <input
            type="url"
            placeholder="URL (optional)"
            value={form.url ?? ''}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white text-sm placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 bg-amber-500 hover:bg-amber-400 text-blue-900 font-bold py-2 rounded-lg text-sm disabled:opacity-50">
              {submitting ? 'Saving...' : 'Add'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {resources.length === 0 ? (
        <p className="text-blue-300/40 text-sm text-center py-6">No resources yet. Add links or files to support your learning.</p>
      ) : (
        <div className="space-y-2">
          {resources.map(resource => (
            <div key={resource.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{resource.title}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleToggleVisibility(resource)} className="p-1.5 text-blue-400/60 hover:text-amber-300 rounded transition" title={resource.visibility}>
                  {resource.visibility === 'shared' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </button>
                {resource.url && (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400/60 hover:text-blue-300 rounded transition">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={() => handleDelete(resource)} className="p-1.5 text-blue-400/40 hover:text-red-400 rounded transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
