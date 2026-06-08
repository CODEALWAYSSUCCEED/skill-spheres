import { useState, useEffect } from 'react';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { resourceService } from '../lib/resourceService';
import type { ResourceWithUser, ResourceType } from '../types/resource';

interface SharedResourceBankProps {
  studioId?: string;
  skillId?: string;
}

export default function SharedResourceBank({ studioId, skillId }: SharedResourceBankProps) {
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceWithUser[]>([]);
  const [filteredResources, setFilteredResources] = useState<ResourceWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      loadResources();
    }
  }, [user, studioId, skillId]);

  useEffect(() => {
    applyFilters();
  }, [resources, searchQuery, filterType]);

  const loadResources = async () => {
    try {
      const data = await resourceService.getSharedResources({
        studioId,
        skillId,
      });
      setResources(data);
    } catch (error: any) {
      console.error('Error loading shared resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...resources];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((r) => r.type === filterType);
    }

    setFilteredResources(filtered);
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
      research_paper: 'Research Paper',
      tool: 'Tool',
      template: 'Template',
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
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
                filterType === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              All
            </button>
            {(['article', 'video', 'research_paper', 'tool', 'template', 'other'] as ResourceType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  filterType === type
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-300">
          Shared Resource Bank
          <span className="text-blue-200 text-sm ml-3 font-normal">
            ({filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'})
          </span>
        </h2>
      </div>

      {filteredResources.length === 0 ? (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
          {resources.length === 0 ? (
            <>
              <p className="text-blue-200 text-lg">No community resources shared yet.</p>
              <p className="text-blue-300 text-sm mt-2">
                Be the first to share a valuable resource with the community!
              </p>
            </>
          ) : (
            <>
              <p className="text-blue-200 text-lg">No resources match your filters.</p>
              <p className="text-blue-300 text-sm mt-2">Try adjusting your search or filters.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl hover:border-amber-400/80 transition-all"
            >
              <div className="mb-3">
                <h3 className="text-lg font-bold text-white mb-2">{resource.title}</h3>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(resource.type)}`}>
                  {getTypeLabel(resource.type)}
                </span>
              </div>

              {resource.description && (
                <p className="text-blue-200 text-sm mb-3 line-clamp-3">{resource.description}</p>
              )}

              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs border border-blue-400/50"
                    >
                      {tag}
                    </span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="text-blue-300 text-xs px-2 py-1">
                      +{resource.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-amber-400/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-blue-300">
                    <div className="font-semibold text-amber-300">
                      {resource.users?.full_name || 'Anonymous'}
                    </div>
                    <div className="text-xs">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:from-amber-600 hover:to-yellow-700 transition-all text-center flex items-center justify-center gap-2"
                >
                  View Resource
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
