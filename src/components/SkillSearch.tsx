import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { Search, X, Filter } from 'lucide-react';

type Skill = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  stage: string;
  difficulty_level: string;
};

type SkillSearchProps = {
  skills: Skill[];
  onSelectSkill: (skillId: string) => void;
  onFilterChange?: (filters: {
    stage: string;
    difficulty: string;
    category: string;
  }) => void;
};

export function SkillSearch({ skills, onSelectSkill, onFilterChange }: SkillSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    stage: 'all',
    difficulty: 'all',
    category: 'all',
  });

  const fuse = new Fuse(skills, {
    keys: ['title', 'description', 'category', 'subcategory'],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = fuse.search(searchQuery);
      setSearchResults(results.map(r => r.item).slice(0, 8));
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, skills]);

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const categories = Array.from(new Set(skills.map(s => s.category))).sort();

  return (
    <div className="mb-8">
      <div className="relative max-w-2xl mx-auto mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills (e.g., 'cyber securty', 'mentl helth')..."
            className="w-full pl-12 pr-24 py-4 text-base bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-lg"
            aria-label="Search for skills"
            aria-expanded={showResults}
            aria-controls="search-results"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition ${
              showFilters ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <Filter className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {showResults && (
          <div
            id="search-results"
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-h-96 overflow-y-auto"
            role="listbox"
            aria-label="Search results"
          >
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="font-semibold">No results found</p>
                <p className="text-sm mt-1">Try different keywords or check spelling</p>
              </div>
            ) : (
              <div className="py-2">
                {searchResults.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => {
                      onSelectSkill(skill.id);
                      clearSearch();
                    }}
                    className="w-full px-4 py-3 hover:bg-amber-50 transition text-left border-b border-gray-100 last:border-0"
                    role="option"
                    aria-label={`Select ${skill.title}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 mb-1 text-base">{skill.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{skill.description}</p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-100 text-amber-800 text-center">
                          {skill.category}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800 capitalize text-center">
                          {skill.stage}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl border-2 border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Filter Skills</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => handleFilterChange('stage', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-base"
                aria-label="Filter by stage"
              >
                <option value="all">All Stages</option>
                <option value="foundation">Foundation</option>
                <option value="exploration">Exploration</option>
                <option value="application">Application</option>
                <option value="integration">Integration</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-base"
                aria-label="Filter by difficulty"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-base"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilters({ stage: 'all', difficulty: 'all', category: 'all' });
                onFilterChange?.({ stage: 'all', difficulty: 'all', category: 'all' });
              }}
              className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-gray-900 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
