import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Tag, ArrowRight, ArrowLeft, BookOpen, Search, X, ChevronLeft, User } from 'lucide-react';
import { PiLogo } from '../components/Layout';

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

const categoryConfig: Record<string, { bg: string; text: string; border: string; accent: string; dot: string }> = {
  'Mathematics':      { bg: 'bg-amber-400/15',  text: 'text-amber-300',  border: 'border-amber-400/30',  accent: 'from-amber-500/20',  dot: 'bg-amber-400' },
  'Computer Science': { bg: 'bg-blue-400/15',   text: 'text-blue-300',   border: 'border-blue-400/30',   accent: 'from-blue-500/20',   dot: 'bg-blue-400' },
  'AI & Technology':  { bg: 'bg-green-400/15',  text: 'text-green-300',  border: 'border-green-400/30',  accent: 'from-green-500/20',  dot: 'bg-green-400' },
  'Test Prep':        { bg: 'bg-orange-400/15', text: 'text-orange-300', border: 'border-orange-400/30', accent: 'from-orange-500/20', dot: 'bg-orange-400' },
  'Community':        { bg: 'bg-cyan-400/15',   text: 'text-cyan-300',   border: 'border-cyan-400/30',   accent: 'from-cyan-500/20',   dot: 'bg-cyan-400' },
  'General':          { bg: 'bg-white/8',        text: 'text-blue-200',   border: 'border-white/15',       accent: 'from-white/10',      dot: 'bg-white/50' },
};

function getCat(cat: string) {
  return categoryConfig[cat] || categoryConfig['General'];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderContent(content: string) {
  const blocks = content.split('\n\n').filter(Boolean);
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl font-black text-white mt-8 mb-3 leading-tight">
          {block.replace(/^## /, '')}
        </h2>
      );
    }
    if (block.startsWith('### ') || (block.startsWith('**') && block.endsWith('**') && !block.slice(2, -2).includes('**'))) {
      const text = block.replace(/^###? /, '').replace(/\*\*/g, '');
      return <h3 key={i} className="text-base font-black text-amber-300 mt-6 mb-2">{text}</h3>;
    }
    if (block.startsWith('- ') || /^\d+\. /.test(block)) {
      const items = block.split('\n').filter(Boolean);
      const isOrdered = /^\d+\. /.test(items[0]);
      return (
        <ul key={i} className={`space-y-2.5 my-4 ${isOrdered ? 'list-none' : ''}`}>
          {items.map((item, j) => {
            const clean = item.replace(/^[-\d.]+\s/, '').replace(/\*\*(.*?)\*\*/g, '$1');
            return (
              <li key={j} className="flex items-start gap-3 text-blue-100/80 text-sm leading-relaxed">
                <span className={`flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400`} />
                <span dangerouslySetInnerHTML={{ __html: clean.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
              </li>
            );
          })}
        </ul>
      );
    }
    const html = block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    return <p key={i} className="text-blue-100/75 leading-[1.8] text-sm my-3" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

function FeaturedCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  const cat = getCat(post.category);
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-3xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
      style={{ background: 'linear-gradient(135deg, rgba(15,36,96,0.9) 0%, rgba(10,25,75,0.95) 100%)' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {post.cover_image_url && (
          <div className="lg:col-span-2 h-52 lg:h-auto overflow-hidden relative">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
          </div>
        )}
        <div className={`lg:col-span-3 p-7 flex flex-col justify-between relative overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${cat.accent} to-transparent rounded-full -translate-y-12 translate-x-12 blur-2xl`} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                {post.category}
              </span>
              <span className="text-xs bg-amber-400/15 text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/25 font-bold">Featured</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-3 group-hover:text-amber-300 transition-colors leading-tight">{post.title}</h2>
            <p className="text-blue-200/65 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
          </div>
          <div className="relative flex items-center justify-between mt-5 pt-4 border-t border-white/8">
            <div className="flex items-center gap-4 text-xs text-blue-300/50">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDateShort(post.created_at)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{post.read_time_minutes} min read</span>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:gap-2.5 transition-all">
              Read article <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function PostCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  const cat = getCat(post.category);
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-2xl border border-white/8 overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
      style={{ background: 'linear-gradient(160deg, rgba(15,36,96,0.85) 0%, rgba(10,25,75,0.9) 100%)' }}
    >
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${cat.accent} to-blue-900/50 flex items-center justify-center`}>
            <BookOpen className="w-10 h-10 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border} backdrop-blur-sm`}>
          {post.category}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-sm font-black text-white mb-2 group-hover:text-amber-300 transition-colors leading-snug line-clamp-2 flex-1">{post.title}</h3>
        <p className="text-blue-200/55 text-xs leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/8">
          <div className="flex items-center gap-3 text-xs text-blue-300/40">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateShort(post.created_at)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_minutes} min</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </button>
  );
}

function PostDetail({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  const cat = getCat(post.category);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-300/60 hover:text-amber-400 text-sm font-semibold mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Blog
      </button>

      {/* Hero image */}
      {post.cover_image_url && (
        <div className="rounded-2xl overflow-hidden mb-8 h-56 md:h-72 relative">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
          {post.category}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-blue-300/50"><Calendar className="w-3.5 h-3.5" />{formatDate(post.created_at)}</span>
        <span className="flex items-center gap-1.5 text-xs text-blue-300/50"><Clock className="w-3.5 h-3.5" />{post.read_time_minutes} min read</span>
        {post.author_name && (
          <span className="flex items-center gap-1.5 text-xs text-blue-300/50"><User className="w-3.5 h-3.5" />by {post.author_name}</span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-black text-white mb-6 leading-tight">{post.title}</h1>

      {/* Excerpt callout */}
      <div className={`rounded-xl p-4 border ${cat.border} mb-6`} style={{ background: 'rgba(255,255,255,0.04)' }}>
        <p className={`text-sm leading-relaxed ${cat.text} font-medium`}>{post.excerpt}</p>
      </div>

      {/* Content */}
      <div ref={contentRef} className="space-y-1">
        {renderContent(post.content)}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/8 flex items-center gap-2 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-blue-300/40" />
          {post.tags.map(tag => (
            <span key={tag} className="text-xs bg-white/5 border border-white/10 text-blue-300/60 px-2.5 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className={`mt-8 rounded-2xl p-6 border ${cat.border} overflow-hidden relative`} style={{ background: 'rgba(15,36,96,0.6)' }}>
        <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${cat.accent} to-transparent rounded-full -translate-y-10 translate-x-10 blur-2xl`} />
        <div className="relative flex items-start gap-4">
          <PiLogo size="sm" />
          <div className="flex-1">
            <p className="text-white font-black text-base mb-1">Want to learn more?</p>
            <p className="text-blue-200/65 text-sm mb-4">Join 317 Solutions: 1-on-1 tutoring, small groups, evenings and weekends.</p>
            <a href="tel:xxxxxxxxxx" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-blue-900 font-black px-5 py-2 rounded-xl text-sm transition-all hover:scale-[1.02]">
              Call xxx-xxx-xxxx
            </a>
          </div>
        </div>
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
    supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data && !error) setPosts(data);
        setLoading(false);
      });
  }, []);

  const filtered = posts.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q));
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
          className="flex items-center gap-1.5 text-blue-300/60 hover:text-white text-sm font-semibold mb-6 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Home
        </button>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 bg-amber-400/15 rounded-xl flex items-center justify-center border border-amber-400/25">
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>317 Solutions Blog</h1>
        </div>
        <p className="text-blue-300/60 text-sm ml-10.5">Insights on AI, Technology, Engineering, CS & Mathematics.</p>
        <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.4), rgba(59,130,246,0.2), transparent)' }} />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-7">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-white placeholder-blue-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 border border-white/10 focus:border-amber-400/30 transition-colors"
            style={{ background: 'rgba(15,36,96,0.7)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => {
            const c = getCat(cat);
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  active
                    ? `bg-amber-400 text-blue-900 border-amber-400`
                    : 'text-blue-200/60 border-white/8 hover:border-white/20 hover:text-white'
                }`}
                style={active ? {} : { background: 'rgba(255,255,255,0.04)' }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-white/8 h-72 animate-pulse" style={{ background: 'rgba(15,36,96,0.5)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-blue-300/20 mx-auto mb-3" />
          <p className="text-blue-200/40 text-sm">No articles found.</p>
          {searchQuery && <button onClick={() => setSearchQuery('')} className="text-amber-400 text-xs mt-2 hover:text-amber-300">Clear search</button>}
        </div>
      ) : (
        <div className="space-y-8">
          {featured.length > 0 && (
            <div className="space-y-4">
              {featured.map(post => (
                <FeaturedCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
              ))}
            </div>
          )}
          {regular.length > 0 && (
            <>
              {featured.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-blue-300/40 font-semibold uppercase tracking-wider">More Articles</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {regular.map(post => (
                  <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
