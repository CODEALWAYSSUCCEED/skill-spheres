import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Tag, ArrowRight, ArrowLeft, BookOpen, Search, X, ChevronLeft } from 'lucide-react';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  category: string;
  tags: string[];
  cover_image_url: string;
  read_time_minutes: number;
  created_at: string;
  featured: boolean;
};

type BlogPageProps = {
  onBack?: () => void;
};

const CATEGORIES = ['All', 'Mathematics', 'Computer Science', 'AI & Technology', 'Test Prep', 'Community'];

const categoryColors: Record<string, string> = {
  'Mathematics': 'bg-amber-400/20 text-amber-300 border-amber-400/30',
  'Computer Science': 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  'AI & Technology': 'bg-green-400/20 text-green-300 border-green-400/30',
  'Test Prep': 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  'Community': 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
  'General': 'bg-white/10 text-blue-200 border-white/20',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function PostCard({ post, onClick, featured = false }: { post: BlogPost; onClick: () => void; featured?: boolean }) {
  const catColor = categoryColors[post.category] || categoryColors['General'];

  if (featured) {
    return (
      <button
        onClick={onClick}
        className="group w-full text-left bg-gradient-to-br from-blue-800/80 to-blue-900/80 rounded-2xl border border-white/10 overflow-hidden card-hover btn-press hover:border-amber-400/40"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {post.cover_image_url && (
            <div className="h-48 md:h-auto overflow-hidden">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catColor}`}>
                  {post.category}
                </span>
                <span className="text-xs text-blue-300/60 bg-amber-400/10 text-amber-300/80 px-2 py-0.5 rounded-full border border-amber-400/20 font-medium">Featured</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2 group-hover:text-amber-300 transition-colors leading-tight">{post.title}</h3>
              <p className="text-blue-200/70 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 text-xs text-blue-300/50">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.created_at)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_minutes} min read</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-gradient-to-br from-blue-800/60 to-blue-900/60 rounded-2xl border border-white/10 overflow-hidden card-hover btn-press hover:border-amber-400/40"
    >
      {post.cover_image_url && (
        <div className="h-40 overflow-hidden">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${catColor}`}>{post.category}</span>
        </div>
        <h3 className="text-base font-black text-white mb-2 group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">{post.title}</h3>
        <p className="text-blue-200/60 text-xs leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-blue-300/40">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.created_at)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_minutes} min</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400/60 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}

function PostDetail({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  const catColor = categoryColors[post.category] || categoryColors['General'];

  const paragraphs = post.content.split('\n\n').filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-300/70 hover:text-amber-400 text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </button>

      {post.cover_image_url && (
        <div className="rounded-2xl overflow-hidden mb-8 h-64 md:h-80">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catColor}`}>{post.category}</span>
        <span className="flex items-center gap-1 text-xs text-blue-300/50"><Calendar className="w-3 h-3" />{formatDate(post.created_at)}</span>
        <span className="flex items-center gap-1 text-xs text-blue-300/50"><Clock className="w-3 h-3" />{post.read_time_minutes} min read</span>
        <span className="text-xs text-blue-300/50">by {post.author_name}</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">{post.title}</h1>

      <div className="prose prose-invert max-w-none space-y-4">
        {paragraphs.map((para, i) => {
          if (para.startsWith('**') && para.endsWith('**') && para.split('**').length === 3) {
            return <h3 key={i} className="text-lg font-black text-amber-300 mt-6 mb-2">{para.replace(/\*\*/g, '')}</h3>;
          }
          if (para.startsWith('- ') || para.startsWith('1. ')) {
            const items = para.split('\n').filter(Boolean);
            return (
              <ul key={i} className="space-y-2">
                {items.map((item, j) => (
                  <li key={j} className="text-blue-100/85 text-sm leading-relaxed flex items-start gap-2">
                    <span className="text-amber-400 mt-1 flex-shrink-0">•</span>
                    <span>{item.replace(/^[-\d.]+\s/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                  </li>
                ))}
              </ul>
            );
          }
          const html = para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
          return <p key={i} className="text-blue-100/80 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: html }} />;
        })}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-blue-300/50" />
            {post.tags.map(tag => (
              <span key={tag} className="text-xs bg-white/5 border border-white/10 text-blue-300/60 px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 bg-gradient-to-br from-amber-400/10 to-blue-800/40 rounded-2xl p-6 border border-amber-400/20">
        <p className="text-white font-black text-base mb-1">Want to learn more?</p>
        <p className="text-blue-200/70 text-sm mb-4">Join 317 Solutions: 1-on-1 tutoring, small group sessions, and the Skill Sphere learning platform.</p>
        <a href="tel:xxxxxxxxxx" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-blue-900 font-black px-5 py-2 rounded-xl text-sm transition-all">
          Call xxx-xxx-xxxx
        </a>
      </div>
    </div>
  );
}

export function BlogPage({ onBack }: BlogPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (data && !error) setPosts(data);
    setLoading(false);
  };

  const filtered = posts.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const featured = filtered.filter(p => p.featured);
  const regular = filtered.filter(p => !p.featured);

  if (selectedPost) {
    return (
      <div className="py-4">
        <PostDetail post={selectedPost} onBack={() => setSelectedPost(null)} />
      </div>
    );
  }

  return (
    <div className="py-4 page-enter">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-blue-300/60 hover:text-white text-sm font-semibold mb-6 transition-colors"
          style={{ letterSpacing: '-0.01em' }}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Skill Sphere
        </button>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-black text-white">317 Solutions Blog</h1>
        </div>
        <p className="text-blue-300/70 text-sm">Insights on AI, Technology, Engineering, Computer Science & Mathematics from our team.</p>
        <div className="h-px bg-gradient-to-r from-amber-400/30 via-blue-400/20 to-transparent mt-4" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-blue-900/80 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-blue-900 border-amber-300'
                  : 'bg-white/5 text-blue-200/70 border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-blue-200/60 animate-pulse text-sm">Loading posts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-blue-300/30 mx-auto mb-3" />
          <p className="text-blue-200/50 text-sm">No posts found.</p>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <div className="mb-8 space-y-4">
              {featured.map(post => (
                <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} featured />
              ))}
            </div>
          )}
          {regular.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {regular.map(post => (
                <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
