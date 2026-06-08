import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { studioService } from '../lib/studioService';
import { StudioDetail } from '../components/StudioDetail';
import type { Studio } from '../types/studio';
import { Users, Plus, CircleUser as UserCircle, ArrowLeft, Lightbulb, Target, Globe, BookOpen, CheckCircle, Send, Trash2, CornerDownRight } from 'lucide-react';

type Post = {
  id: string;
  group_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: { full_name: string } | null;
};

type Group = {
  id: string;
  name: string;
  description: string;
  skill_id: string;
  mentor_id: string;
  max_members: number;
  meeting_schedule: string;
  created_at: string;
  skills: {
    title: string;
  };
  mentor: {
    full_name: string;
  } | null;
};

type GroupWithMembers = Group & {
  member_count: number;
  is_member: boolean;
};

type Skill = {
  id: string;
  title: string;
};

const problemStudios = [
  {
    id: 'climate',
    title: 'Climate Action Studio',
    description: 'Design solutions for climate change mitigation, adaptation, and renewable energy systems.',
    icon: Globe,
    color: 'from-green-900/40 to-emerald-900/40',
    border: 'border-green-400',
    domains: ['Climate Systems Modeling', 'Renewable Energy', 'Carbon Accounting', 'Circular Supply Chains'],
    realWorldProblems: ['Rising global temperatures', 'Extreme weather events', 'Energy transition', 'Sustainable cities'],
    outcomes: 'Deploy climate solutions with measurable carbon impact',
  },
  {
    id: 'mental-health',
    title: 'Mental Health Innovation Studio',
    description: 'Create digital therapeutics, early detection systems, and compassionate mental health interventions.',
    icon: Users,
    color: 'from-blue-900/40 to-sky-900/40',
    border: 'border-blue-400',
    domains: ['Digital Therapeutics', 'AI for Mental Health Detection', 'Trauma-Informed Design', 'Behavioral Science'],
    realWorldProblems: ['Mental health crisis', 'Limited access to therapy', 'Early intervention gaps', 'Stigma reduction'],
    outcomes: 'Launch mental health tools that improve wellbeing',
  },
  {
    id: 'education',
    title: 'Special Education Studio',
    description: 'Build assistive technologies and adaptive learning systems that empower all learners.',
    icon: Lightbulb,
    color: 'from-amber-900/40 to-orange-900/40',
    border: 'border-amber-400',
    domains: ['Assistive Technology', 'Adaptive Learning Systems', 'Neurodiversity Awareness', 'Sensory-Inclusive Design'],
    realWorldProblems: ['Learning accessibility gaps', 'Limited assistive tools', 'One-size-fits-all education', 'Sensory needs'],
    outcomes: 'Create inclusive learning experiences for all',
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity & AI Safety Studio',
    description: 'Develop zero-trust architectures, AI threat models, and quantum-resistant security systems.',
    icon: Target,
    color: 'from-slate-900/40 to-gray-900/40',
    border: 'border-slate-400',
    domains: ['Zero-Trust Architecture', 'AI Threat Modeling', 'Post-Quantum Cryptography', 'Digital Identity'],
    realWorldProblems: ['AI-powered attacks', 'Data breaches', 'Quantum computing threats', 'Privacy erosion'],
    outcomes: 'Build unhackable security for the AI age',
  },
];

export function Groups() {
  const { profile, user } = useAuth();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skill_id: '',
    max_members: 10,
  });

  const [skills, setSkills] = useState<Skill[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [leavingGroup, setLeavingGroup] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGroups([]);
    setShowToast(false);
    setToastMessage('');

    loadGroups();
    loadSkills();
    loadStudios();
  }, [user]);

  const loadStudios = async () => {
    const studiosData = await studioService.getActiveStudios();
    setStudios(studiosData);
  };

  const loadSkills = async () => {
    const { data } = await supabase
      .from('skills')
      .select('id, title')
      .order('title');

    if (data) {
      setSkills(data);
    }
  };

  const loadGroups = async () => {
    const { data: groupsData, error } = await supabase
      .from('groups')
      .select(`
        *,
        skills (
          title
        ),
        mentor:mentor_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (groupsData && !error) {
      const groupsWithDetails = await Promise.all(
        groupsData.map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('status', 'active');

          let isMember = false;
          if (user) {
            const { data: memberData } = await supabase
              .from('group_members')
              .select('id')
              .eq('group_id', group.id)
              .eq('user_id', user.id)
              .eq('status', 'active')
              .maybeSingle();

            isMember = !!memberData;
          }

          return {
            ...group,
            member_count: count || 0,
            is_member: isMember,
          };
        })
      );

      setGroups(groupsWithDetails);
    }

    setLoading(false);
  };

  const loadPosts = async (groupId: string) => {
    setPostsLoading(true);
    const { data } = await supabase
      .from('group_posts')
      .select('*, author:user_id(full_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    setPosts(data ?? []);
    setPostsLoading(false);
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroup(groupId);
    setNewPost('');
    setReplyingTo(null);
    setReplyContent('');
    const group = groups.find(g => g.id === groupId);
    if (group && (group.is_member || group.mentor_id === user?.id)) {
      loadPosts(groupId);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!user || !selectedGroup) return;
    const content = parentId ? replyContent.trim() : newPost.trim();
    if (!content) return;
    setSubmittingPost(true);
    const { error } = await supabase.from('group_posts').insert({
      group_id: selectedGroup,
      user_id: user.id,
      parent_id: parentId ?? null,
      content,
    });
    if (!error) {
      if (parentId) { setReplyContent(''); setReplyingTo(null); }
      else setNewPost('');
      await loadPosts(selectedGroup);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setSubmittingPost(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!selectedGroup) return;
    await supabase.from('group_posts').delete().eq('id', postId);
    await loadPosts(selectedGroup);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('groups')
      .insert({
        ...formData,
        mentor_id: user.id,
        max_members: Number(formData.max_members),
        meeting_schedule: '',
      });

    if (error) {
      alert('Failed to create group: ' + error.message);
    } else {
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        skill_id: '',
        max_members: 10,
      });
      loadGroups();
    }

    setSubmitting(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    setGroups(prevGroups =>
      prevGroups.map(g =>
        g.id === groupId
          ? { ...g, is_member: true, member_count: g.member_count + 1 }
          : g
      )
    );

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          status: 'active',
        });

      if (error) throw error;

      setToastMessage('You joined the group!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      await loadGroups();
    } catch (error: any) {
      setGroups(prevGroups =>
        prevGroups.map(g =>
          g.id === groupId
            ? { ...g, is_member: false, member_count: g.member_count - 1 }
            : g
        )
      );

      setToastMessage(error.message || 'Failed to join group. You may already be a member.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (group.mentor_id === user.id) {
      setToastMessage('You cannot leave a group you created. Delete the group instead.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to leave "${group.name}"?`);
    if (!confirmed) return;

    setLeavingGroup(groupId);

    setGroups(prevGroups =>
      prevGroups.map(g =>
        g.id === groupId
          ? { ...g, is_member: false, member_count: g.member_count - 1 }
          : g
      )
    );

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      setToastMessage('You left the group.');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      await loadGroups();
    } catch (error: any) {
      setGroups(prevGroups =>
        prevGroups.map(g =>
          g.id === groupId
            ? { ...g, is_member: true, member_count: g.member_count + 1 }
            : g
        )
      );

      setToastMessage(error.message || 'Failed to leave group. Please try again.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setLeavingGroup(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-blue-200 animate-pulse">Loading problem studios...</div>
      </div>
    );
  }

  if (selectedStudio) {
    return <StudioDetail studioId={selectedStudio} onBack={() => setSelectedStudio(null)} />;
  }

  if (false && selectedStudio) {
    const studio = problemStudios.find(s => s.id === selectedStudio);
    if (!studio) return null;

    const StudioIcon = studio.icon;

    return (
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => setSelectedStudio(null)}
          className="flex items-center gap-2 text-white hover:text-amber-300 mb-6 font-bold transition-colors"
          aria-label="Back to all studios"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          Back to Studios
        </button>

        <div className={`bg-gradient-to-br ${studio.color} backdrop-blur-md rounded-2xl p-8 md:p-10 border-3 ${studio.border} shadow-2xl mb-8`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`bg-white/20 p-4 rounded-2xl border-2 ${studio.border}`}>
              <StudioIcon className="w-12 h-12 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{studio.title}</h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">{studio.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-2 border-amber-400/50 shadow-xl">
            <h2 className="text-2xl font-black text-amber-300 mb-4">Core Domains</h2>
            <ul className="space-y-3">
              {studio.domains.map((domain, index) => (
                <li key={index} className="flex items-start gap-3 text-white">
                  <span className="text-green-400 font-bold mt-1">✓</span>
                  <span className="leading-relaxed">{domain}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-2 border-rose-400/50 shadow-xl">
            <h2 className="text-2xl font-black text-rose-300 mb-4">Real-World Problems</h2>
            <ul className="space-y-3">
              {studio.realWorldProblems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3 text-white">
                  <span className="text-rose-400 font-bold mt-1">→</span>
                  <span className="leading-relaxed">{problem}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-md rounded-2xl p-6 border-2 border-green-400/50 shadow-xl mb-8">
          <h2 className="text-2xl font-black text-green-300 mb-3">Expected Outcomes</h2>
          <p className="text-lg text-green-100 leading-relaxed">{studio.outcomes}</p>
        </div>

        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-8 border-2 border-amber-400/50 shadow-xl">
          <h2 className="text-2xl font-black text-amber-300 mb-6">Studio Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-amber-300 font-bold mb-2">1. AI + Quantum Core</p>
              <p className="text-blue-100 leading-relaxed">Master advanced technology foundations</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-amber-300 font-bold mb-2">2. Systems Mapping</p>
              <p className="text-blue-100 leading-relaxed">Analyze problems holistically</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-amber-300 font-bold mb-2">3. Domain Deep Dive</p>
              <p className="text-blue-100 leading-relaxed">Build specialized expertise</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-amber-300 font-bold mb-2">4. Ethical Framework</p>
              <p className="text-blue-100 leading-relaxed">Apply responsible innovation</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-amber-300 font-bold mb-2">5. Human Validation</p>
              <p className="text-blue-100 leading-relaxed">Co-create with communities</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-amber-300 font-bold mb-2">6. Deployment</p>
              <p className="text-blue-100 leading-relaxed">Launch real-world solutions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => setShowCreateForm(false)}
          className="flex items-center gap-2 text-white hover:text-amber-300 mb-6 font-bold transition-colors"
          aria-label="Back to studios"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          Back to Studios
        </button>

        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-6 md:p-8">
          <h2 className="text-3xl font-black text-white mb-1">Create a Study Group</h2>
          <p className="text-blue-300/70 text-sm mb-6">Gather peers who are learning the same skill. No sessions required. Just a shared space to connect and grow together.</p>

          <form onSubmit={handleCreateGroup} className="space-y-5">
            <div>
              <label htmlFor="group-name" className="block text-sm font-bold text-amber-300 mb-2">
                Group Name
              </label>
              <input
                id="group-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-amber-400/50 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                placeholder="e.g., Guitar Beginners, Python Study Circle"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold text-amber-300 mb-2">
                What is this group about?
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-amber-400/50 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                placeholder="Describe the group's focus, what you're hoping to learn together, who should join..."
              />
            </div>

            <div>
              <label htmlFor="skill" className="block text-sm font-bold text-amber-300 mb-2">
                Skill Focus
              </label>
              <select
                id="skill"
                value={formData.skill_id}
                onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-amber-400/50 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              >
                <option value="" className="bg-blue-900">Select a skill</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id} className="bg-blue-900">
                    {skill.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="max-members" className="block text-sm font-bold text-amber-300 mb-2">
                Max Members
              </label>
              <input
                id="max-members"
                type="number"
                value={formData.max_members}
                onChange={(e) => setFormData({ ...formData, max_members: Number(e.target.value) })}
                required
                min="2"
                max="100"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-amber-400/50 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-4 rounded-xl font-black hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 shadow-xl border-2 border-amber-300 disabled:opacity-50 text-lg"
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (selectedGroup) {
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return null;

    return (
      <div className="max-w-4xl mx-auto px-4 page-enter">
        <button
          onClick={() => setSelectedGroup(null)}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 font-semibold transition-colors text-sm"
          aria-label="Back to all groups"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Groups
        </button>

        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-2 border-amber-400/40 p-6 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">{group.name}</h2>
              {group.skills?.title && (
                <span className="text-sm font-bold text-amber-300 bg-amber-900/40 inline-block px-3 py-1 rounded-full border border-amber-400/40">
                  Skill: {group.skills.title}
                </span>
              )}
            </div>
            {user && group.mentor_id !== user.id && (
              group.is_member ? (
                <button
                  onClick={() => handleLeaveGroup(group.id)}
                  disabled={leavingGroup === group.id}
                  className="bg-white/10 hover:bg-white/20 text-white/70 border border-white/20 px-4 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
                >
                  {leavingGroup === group.id ? 'Leaving...' : 'Leave Group'}
                </button>
              ) : (
                <button
                  onClick={() => handleJoinGroup(group.id)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-blue-900 px-5 py-2 rounded-xl text-sm font-bold hover:from-amber-400 hover:to-yellow-400 transition shadow"
                >
                  Join Group
                </button>
              )
            )}
          </div>
          <p className="text-blue-200 text-sm leading-relaxed mb-4">{group.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-white/8 rounded-xl p-3 border border-white/10">
              <p className="text-amber-400/70 text-xs font-bold uppercase tracking-wide mb-1">Members</p>
              <p className="text-white font-bold">{group.member_count} / {group.max_members}</p>
            </div>
            {group.mentor && (
              <div className="bg-white/8 rounded-xl p-3 border border-white/10 col-span-2">
                <p className="text-amber-400/70 text-xs font-bold uppercase tracking-wide mb-1">Created by</p>
                <p className="text-white font-semibold">{group.mentor.full_name}</p>
              </div>
            )}
          </div>
        </div>

        {!group.is_member && user && group.mentor_id !== user.id && (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-5 text-center">
            <p className="text-amber-200 font-semibold mb-1">Join to read and post in the group discussion</p>
            <p className="text-blue-300/70 text-sm mb-4">Ask questions, share tips, and learn together with people working on the same skill.</p>
            <button
              onClick={() => handleJoinGroup(group.id)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-blue-900 px-8 py-3 rounded-xl font-bold hover:from-amber-400 hover:to-yellow-400 transition shadow-lg"
            >
              Join Group
            </button>
          </div>
        )}

        {(group.is_member || group.mentor_id === user?.id) && (
          <div className="space-y-4">
            <div className="bg-blue-900/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h4 className="text-white font-bold text-sm">Discussion</h4>
                <span className="ml-auto text-blue-400/60 text-xs">{posts.filter(p => !p.parent_id).length} posts</span>
              </div>

              {postsLoading ? (
                <div className="p-8 text-center text-blue-300/60 text-sm animate-pulse">Loading discussion...</div>
              ) : posts.filter(p => !p.parent_id).length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-blue-300/50 text-sm">No posts yet. Be the first to start the conversation.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
                  {posts.filter(p => !p.parent_id).map(post => {
                    const replies = posts.filter(p => p.parent_id === post.id);
                    return (
                      <div key={post.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-300 text-xs font-bold">
                              {post.author?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-semibold text-sm">{post.author?.full_name ?? 'Member'}</span>
                              <span className="text-blue-400/50 text-xs">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              {post.group_id && group.mentor_id === post.user_id && (
                                <span className="text-amber-400 text-xs font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">organizer</span>
                              )}
                            </div>
                            <p className="text-blue-100 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                                className="text-blue-400/60 hover:text-amber-300 text-xs font-semibold transition"
                              >
                                Reply
                              </button>
                              {post.user_id === user?.id && (
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-red-400/40 hover:text-red-400 text-xs transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {replyingTo === post.id && (
                              <form onSubmit={(e) => handleSubmitPost(e, post.id)} className="mt-3 flex gap-2">
                                <input
                                  value={replyContent}
                                  onChange={e => setReplyContent(e.target.value)}
                                  placeholder="Write a reply..."
                                  maxLength={2000}
                                  autoFocus
                                  className="flex-1 px-3 py-2 bg-white/8 border border-white/15 rounded-xl text-white text-sm placeholder-blue-400/50 focus:outline-none focus:border-amber-400/60"
                                />
                                <button
                                  type="submit"
                                  disabled={submittingPost || !replyContent.trim()}
                                  className="bg-amber-500 hover:bg-amber-400 text-blue-900 px-3 py-2 rounded-xl text-sm font-bold transition disabled:opacity-40"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </form>
                            )}

                            {replies.length > 0 && (
                              <div className="mt-3 space-y-3 pl-3 border-l-2 border-white/10">
                                {replies.map(reply => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <CornerDownRight className="w-3 h-3 text-blue-400/40 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-white/80 font-semibold text-xs">{reply.author?.full_name ?? 'Member'}</span>
                                        <span className="text-blue-400/40 text-xs">{new Date(reply.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                      </div>
                                      <p className="text-blue-200/80 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                      {reply.user_id === user?.id && (
                                        <button
                                          onClick={() => handleDeletePost(reply.id)}
                                          className="text-red-400/40 hover:text-red-400 text-xs mt-1 transition"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}

              <form onSubmit={(e) => handleSubmitPost(e)} className="flex gap-3 p-4 border-t border-white/10">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitPost(e as any); }
                  }}
                  placeholder="Share a tip, ask a question, post a resource..."
                  maxLength={2000}
                  rows={2}
                  className="flex-1 px-4 py-3 bg-white/8 border border-white/15 rounded-xl text-white text-sm placeholder-blue-400/50 focus:outline-none focus:border-amber-400/60 resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingPost || !newPost.trim()}
                  className="self-end bg-amber-500 hover:bg-amber-400 text-blue-900 px-4 py-3 rounded-xl font-bold transition disabled:opacity-40 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {group.is_member && group.mentor_id !== user?.id && (
              <div className="flex items-center gap-3 bg-green-500/8 border border-green-400/20 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-green-200/80 text-xs font-semibold">{group.member_count} member{group.member_count !== 1 ? 's' : ''} focusing on <span className="text-amber-300">{group.skills?.title}</span></p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 page-enter">
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl border-2 font-bold animate-fade-in ${
          toastType === 'success'
            ? 'bg-green-500 text-white border-green-300'
            : 'bg-red-500 text-white border-red-300'
        }`}>
          {toastMessage}
        </div>
      )}

      <section className="mb-12 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Problem Studios</h1>
        <p className="text-lg md:text-xl text-blue-200 leading-relaxed mb-8">
          Learn through integrated problem-solving experiences that combine AI, systems thinking, and domain expertise to tackle real-world challenges.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-black text-amber-300 mb-8 text-center">Live Learning Studios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {studios.map((studio) => {
            const getStudioIcon = (category: string) => {
              switch (category) {
                case 'climate': return Globe;
                case 'mental-health': return Users;
                case 'education': return Lightbulb;
                case 'cybersecurity': return Target;
                default: return Target;
              }
            };
            const StudioIcon = getStudioIcon(studio.category);

            const colorMap: Record<string, string> = {
              'climate': 'from-green-900/40 to-emerald-900/40',
              'mental-health': 'from-blue-900/40 to-sky-900/40',
              'education': 'from-amber-900/40 to-orange-900/40',
              'cybersecurity': 'from-slate-900/40 to-gray-900/40',
            };

            const borderMap: Record<string, string> = {
              'climate': 'border-green-400',
              'mental-health': 'border-blue-400',
              'education': 'border-amber-400',
              'cybersecurity': 'border-slate-400',
            };

            return (
              <button
                key={studio.id}
                onClick={() => setSelectedStudio(studio.id)}
                className={`bg-gradient-to-br ${colorMap[studio.category] || 'from-blue-900/40 to-indigo-900/40'} backdrop-blur-md rounded-2xl p-6 md:p-8 border-3 ${borderMap[studio.category] || 'border-amber-400'} shadow-xl card-hover btn-press text-left w-full`}
                aria-label={`View ${studio.title} details`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`bg-white/20 p-3 rounded-xl border-2 ${borderMap[studio.category] || 'border-amber-400'}`}>
                    <StudioIcon className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2">{studio.title}</h3>
                  </div>
                </div>
                <p className="text-base md:text-lg text-white/90 leading-relaxed mb-4">{studio.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span>Explore Studio</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-white/70">{studio.duration_weeks} weeks</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}
