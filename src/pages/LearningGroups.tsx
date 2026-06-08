import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, BookOpen, Users, Send, Trash2, CornerDownRight, Flag, CheckCircle, ArrowLeft, Lock } from 'lucide-react';

type GroupSummary = {
  id: string;
  name: string;
  skill_id: string;
  member_count: number;
  is_member: boolean;
  skills: { title: string; stage: string } | null;
};

type Post = {
  id: string;
  group_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: { full_name: string } | null;
};

export function LearningGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [filtered, setFiltered] = useState<GroupSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadGroups(); }, [user]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? groups.filter(g =>
      g.name.toLowerCase().includes(q) || g.skills?.title.toLowerCase().includes(q)
    ) : groups);
  }, [search, groups]);

  const loadGroups = async () => {
    setLoading(true);

    // Single query: get all auto groups with skill info
    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name, skill_id, skills(title, stage)')
      .eq('is_auto_group', true)
      .order('created_at', { ascending: true });

    if (!groupsData) { setLoading(false); return; }

    // Batch: member counts for all groups in one query
    const groupIds = groupsData.map((g: any) => g.id);

    const { data: memberCounts } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds.length ? groupIds : ['none'])
      .eq('status', 'active');

    const countMap: Record<string, number> = {};
    (memberCounts ?? []).forEach((r: any) => {
      countMap[r.group_id] = (countMap[r.group_id] ?? 0) + 1;
    });

    // Batch: which groups does the current user belong to
    let memberSet = new Set<string>();
    if (user) {
      const { data: myMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds.length ? groupIds : ['none'])
        .eq('user_id', user.id)
        .eq('status', 'active');
      memberSet = new Set((myMemberships ?? []).map((r: any) => r.group_id));
    }

    const enriched: GroupSummary[] = groupsData.map((g: any) => ({
      ...g,
      member_count: countMap[g.id] ?? 0,
      is_member: memberSet.has(g.id),
    }));

    setGroups(enriched);
    setLoading(false);
  };

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    setJoining(groupId);
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, status: 'active' });
    if (!error) {
      // Optimistically update state instead of full reload
      setGroups(prev => prev.map(g => g.id === groupId
        ? { ...g, is_member: true, member_count: g.member_count + 1 }
        : g
      ));
      const updated = groups.find(g => g.id === groupId);
      if (updated) openGroup({ ...updated, is_member: true, member_count: updated.member_count + 1 });
      showToast('You joined the group!');
    } else {
      showToast('Failed to join group', 'error');
    }
    setJoining(null);
  };

  const handleLeave = async (groupId: string) => {
    if (!user) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    setGroups(prev => prev.map(g => g.id === groupId
      ? { ...g, is_member: false, member_count: Math.max(0, g.member_count - 1) }
      : g
    ));
    setSelectedGroup(null);
    showToast('You left the group.');
  };

  const openGroup = async (group: GroupSummary) => {
    setSelectedGroup(group);
    setNewPost('');
    setReplyingTo(null);
    setReplyContent('');
    if (group.is_member) await loadPosts(group.id);
  };

  const loadPosts = async (groupId: string) => {
    setPostsLoading(true);
    const { data } = await supabase
      .from('group_posts')
      .select('*, author:user_id(full_name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (user && data) {
      const postIds = (data as any[]).map(p => p.id);
      const { data: myReports } = await supabase
        .from('group_post_reports')
        .select('post_id')
        .eq('reported_by', user.id)
        .in('post_id', postIds.length ? postIds : ['none']);
      setReportedIds(new Set((myReports ?? []).map((r: any) => r.post_id)));
    }

    setPosts((data ?? []) as Post[]);
    setPostsLoading(false);
  };

  const handlePost = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!user || !selectedGroup) return;
    const content = parentId ? replyContent.trim() : newPost.trim();
    if (!content) return;
    setSubmitting(true);
    const { error } = await supabase.from('group_posts').insert({
      group_id: selectedGroup.id, user_id: user.id, parent_id: parentId ?? null, content,
    });
    if (!error) {
      parentId ? (setReplyContent(''), setReplyingTo(null)) : setNewPost('');
      await loadPosts(selectedGroup.id);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    if (!selectedGroup) return;
    await supabase.from('group_posts').delete().eq('id', postId);
    await loadPosts(selectedGroup.id);
  };

  const handleReport = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase.from('group_post_reports').insert({ post_id: postId, reported_by: user.id, reason: 'inappropriate' });
    if (!error) {
      setReportedIds(prev => new Set([...prev, postId]));
      showToast('Post reported. Thank you.');
    }
  };

  const stageColors: Record<string, string> = {
    foundation: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30',
    exploration: 'text-sky-300 bg-sky-500/15 border-sky-400/30',
    application: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
    integration: 'text-rose-300 bg-rose-500/15 border-rose-400/30',
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl text-white text-sm placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/50 transition-all border border-white/15 resize-none';
  const inputBg = { background: 'rgba(255,255,255,0.08)' };

  // Group detail view
  if (selectedGroup) {
    const topLevelPosts = posts.filter(p => !p.parent_id);

    return (
      <div className="page-enter max-w-3xl mx-auto px-4">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.msg}
          </div>
        )}

        <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-blue-200 hover:text-amber-300 mb-6 font-semibold transition group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          All Groups
        </button>

        {/* Header */}
        <div className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">{selectedGroup.name}</h2>
              {selectedGroup.skills && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border inline-block ${stageColors[selectedGroup.skills.stage] ?? 'text-blue-300 bg-blue-500/15 border-blue-400/30'}`}>
                  {selectedGroup.skills.title} · {selectedGroup.skills.stage}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-300/60 text-xs font-semibold">{selectedGroup.member_count} member{selectedGroup.member_count !== 1 ? 's' : ''}</span>
              {selectedGroup.is_member && (
                <button onClick={() => handleLeave(selectedGroup.id)} className="text-xs text-white/40 hover:text-red-400 font-semibold transition border border-white/10 hover:border-red-400/30 px-3 py-1.5 rounded-lg">
                  Leave
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Gate */}
        {!selectedGroup.is_member && (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-6 text-center mb-5">
            <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-amber-200 font-semibold mb-1">Join this group to read and post in the discussion</p>
            <p className="text-blue-300/60 text-sm mb-4">Share tips, ask questions, and learn with others working on this skill.</p>
            <button
              onClick={() => handleJoin(selectedGroup.id)}
              disabled={joining === selectedGroup.id}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-blue-900 px-8 py-3 rounded-xl font-bold hover:from-amber-400 hover:to-yellow-400 transition shadow-lg disabled:opacity-50"
            >
              {joining === selectedGroup.id ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        )}

        {/* Discussion board */}
        {selectedGroup.is_member && (
          <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(15,30,80,0.5)' }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h4 className="text-white font-bold text-sm">Discussion</h4>
              <span className="ml-auto text-blue-400/50 text-xs">{topLevelPosts.length} post{topLevelPosts.length !== 1 ? 's' : ''}</span>
            </div>

            {postsLoading ? (
              <div className="p-10 text-center text-blue-300/50 text-sm animate-pulse">Loading...</div>
            ) : topLevelPosts.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-blue-300/40 text-sm">No posts yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[560px] overflow-y-auto">
                {topLevelPosts.map(post => {
                  const replies = posts.filter(p => p.parent_id === post.id);
                  const isReported = reportedIds.has(post.id);
                  return (
                    <div key={post.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <span className="text-white/70 text-xs font-bold">
                            {post.author?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-white font-semibold text-sm">{post.author?.full_name ?? 'Member'}</span>
                            <span className="text-blue-400/40 text-xs">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <p className="text-blue-100 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="text-blue-400/50 hover:text-amber-300 text-xs font-semibold transition">
                              Reply
                            </button>
                            {post.user_id === user?.id ? (
                              <button onClick={() => handleDelete(post.id)} className="text-red-400/30 hover:text-red-400 text-xs transition">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                onClick={() => !isReported && handleReport(post.id)}
                                disabled={isReported}
                                className={`text-xs transition flex items-center gap-1 ${isReported ? 'text-amber-400/40 cursor-default' : 'text-white/20 hover:text-amber-400/60'}`}
                                title={isReported ? 'Already reported' : 'Report this post'}
                              >
                                <Flag className="w-3 h-3" />
                                {isReported && <span>Reported</span>}
                              </button>
                            )}
                          </div>

                          {replyingTo === post.id && (
                            <form onSubmit={(e) => handlePost(e, post.id)} className="mt-3 flex gap-2">
                              <input
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                maxLength={2000}
                                autoFocus
                                className="flex-1 px-3 py-2 rounded-xl text-white text-sm placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 border border-white/15"
                                style={{ background: 'rgba(255,255,255,0.08)' }}
                              />
                              <button type="submit" disabled={submitting || !replyContent.trim()} className="bg-amber-500 hover:bg-amber-400 text-blue-900 px-3 py-2 rounded-xl font-bold transition disabled:opacity-40">
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          )}

                          {replies.length > 0 && (
                            <div className="mt-3 space-y-3 pl-3 border-l-2 border-white/8">
                              {replies.map(reply => (
                                <div key={reply.id} className="flex items-start gap-2">
                                  <CornerDownRight className="w-3 h-3 text-blue-400/30 mt-1 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                      <span className="text-white/70 font-semibold text-xs">{reply.author?.full_name ?? 'Member'}</span>
                                      <span className="text-blue-400/30 text-xs">{new Date(reply.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <p className="text-blue-200/70 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      {reply.user_id === user?.id ? (
                                        <button onClick={() => handleDelete(reply.id)} className="text-red-400/30 hover:text-red-400 text-xs transition">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => !reportedIds.has(reply.id) && handleReport(reply.id)}
                                          disabled={reportedIds.has(reply.id)}
                                          className={`text-xs transition flex items-center gap-1 ${reportedIds.has(reply.id) ? 'text-amber-400/40 cursor-default' : 'text-white/20 hover:text-amber-400/60'}`}
                                        >
                                          <Flag className="w-3 h-3" />
                                          {reportedIds.has(reply.id) && <span>Reported</span>}
                                        </button>
                                      )}
                                    </div>
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

            {/* Compose */}
            <form onSubmit={(e) => handlePost(e)} className="flex gap-3 p-4 border-t border-white/10">
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(e as any); } }}
                placeholder="Share a tip, question, or resource... (Enter to send)"
                maxLength={2000}
                rows={2}
                className={inputClass}
                style={inputBg}
              />
              <button type="submit" disabled={submitting || !newPost.trim()} className="self-end bg-amber-500 hover:bg-amber-400 text-blue-900 px-4 py-3 rounded-xl font-bold transition disabled:opacity-40 flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Flag className="w-3 h-3 text-blue-400/30" />
              <p className="text-blue-400/40 text-xs">Use the report button on any post to flag inappropriate content for review.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Group list view
  const stages = ['foundation', 'exploration', 'application', 'integration'];
  const groupedByStage = stages.map(stage => ({
    stage,
    items: filtered.filter(g => g.skills?.stage === stage),
  })).filter(s => s.items.length > 0);

  return (
    <div className="page-enter px-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <section className="mb-10 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Learning Groups</h1>
        <p className="text-blue-200/80 text-lg leading-relaxed">
          Every skill has its own group. Join to discuss, share resources, and learn with others at your own pace.
        </p>
      </section>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-10 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by skill or group name..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl text-white text-sm placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 border border-white/15"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-blue-300/50 animate-pulse">Loading groups...</div>
      ) : groupedByStage.length === 0 ? (
        <div className="text-center py-16 text-blue-300/50">No groups found.</div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-10">
          {groupedByStage.map(({ stage, items }) => (
            <div key={stage}>
              <h2 className="text-xs font-black text-white/50 mb-4 uppercase tracking-widest pl-1">
                {stage.charAt(0).toUpperCase() + stage.slice(1)} Stage
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(group => (
                  <div
                    key={group.id}
                    className="backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:border-amber-400/30 transition-all cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    onClick={() => openGroup(group)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-white font-bold text-sm leading-snug">{group.skills?.title ?? group.name}</h3>
                      {group.is_member && (
                        <span className="flex-shrink-0 flex items-center gap-1 text-green-300 text-xs font-bold bg-green-500/15 px-2 py-0.5 rounded-full border border-green-400/20">
                          <CheckCircle className="w-3 h-3" /> Joined
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-between">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stageColors[stage]}`}>
                        {stage}
                      </span>
                      <span className="flex items-center gap-1 text-blue-400/50 text-xs">
                        <Users className="w-3 h-3" /> {group.member_count}
                      </span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); group.is_member ? openGroup(group) : handleJoin(group.id); }}
                      disabled={joining === group.id}
                      className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition ${
                        group.is_member
                          ? 'text-white/70 hover:text-white border border-white/15 hover:border-white/25'
                          : 'bg-amber-500 hover:bg-amber-400 text-blue-900'
                      }`}
                      style={group.is_member ? { background: 'rgba(255,255,255,0.06)' } : undefined}
                    >
                      {joining === group.id ? 'Joining...' : group.is_member ? 'Open Discussion' : 'Join Group'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
