import { useAuth } from '../contexts/AuthContext';
import { skillResourceService } from '../lib/skillResourceService';
import { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, Tag } from 'lucide-react';
import type { SkillResourceWithUser } from '../types/resource';

interface SharedResourceBankProps {
  skillId: string;
}

export default function SharedResourceBank({ skillId }: SharedResourceBankProps) {
  const { user } = useAuth();
  const [resources, setResources] = useState<SkillResourceWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadResources();
  }, [skillId]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await skillResourceService.getSharedResourcesForSkill(skillId);
      setResources(data);
    } catch (err) {
      console.error('Failed to load shared resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = searchQuery ? skillResourceService.fuzzySearch(resources, searchQuery) : resources;

  if (loading) {
    return <div className="text-blue-200 text-sm py-4">Loading shared resources...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-amber-300" />
        <h3 className="text-base font-bold text-white">Shared Resource Bank</h3>
        <span className="ml-auto text-blue-400/40 text-xs">{resources.length} resources</span>
      </div>

      {resources.length > 3 && (
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search resources..."
          className="w-full px-3 py-2 mb-4 bg-white/10 border border-white/15 rounded-xl text-white text-sm placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-blue-300/50 text-sm text-center py-6">No shared resources yet for this skill.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(resource => (
            <div key={resource.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm mb-1">{resource.title}</h4>
                  {resource.description && (
                    <p className="text-blue-200/60 text-xs mb-2 line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs text-blue-300/50">
                      by {resource.users?.full_name ?? 'Community Member'}
                    </span>
                    {resource.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="flex items-center gap-0.5 text-xs bg-amber-400/10 text-amber-300/70 px-1.5 py-0.5 rounded-full">
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                </div>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
