import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { progressionService } from '../lib/progressionService';
import { getUserBadges, getBadgeColor, getBadgeIcon } from '../lib/rubricService';
import { useScrollRevealAll } from '../hooks/useScrollReveal';
import { Star, Clock, Calendar, BookOpen, TrendingUp, CheckCircle, Users, MessageSquare, Award } from 'lucide-react';

type Reflection = {
  id: string;
  skill_id: string;
  content: string;
  rating: number;
  hours_spent: number;
  created_at: string;
  skills: {
    title: string;
  };
};

export function Profile() {
  const { profile } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReflections: 0,
    totalHours: 0,
    averageRating: 0,
  });
  const [dashboardStats, setDashboardStats] = useState({
    in_progress_count: 0,
    completed_count: 0,
    average_progress: 0,
  });
  const [inProgressSkills, setInProgressSkills] = useState<any[]>([]);
  const [completedSkills, setCompletedSkills] = useState<any[]>([]);
  const [mentorStats, setMentorStats] = useState({
    active_mentees: 0,
    pending_reviews: 0,
    total_feedback: 0,
  });
  const [mentorAssignments, setMentorAssignments] = useState<any[]>([]);
  const [recentReflections, setRecentReflections] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    setReflections([]);
    setInProgressSkills([]);
    setCompletedSkills([]);
    setMentorAssignments([]);
    setRecentReflections([]);

    if (profile) {
      loadBadges();
      if (profile.role === 'learner') {
        loadReflections();
        loadProgressData();
      } else if (profile.role === 'mentor') {
        loadMentorData();
      }
    }
  }, [profile]);

  const loadBadges = async () => {
    if (!profile) return;

    try {
      const badgeData = await getUserBadges(profile.id);
      setBadges(badgeData);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const loadReflections = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('reflections')
      .select(`
        *,
        skills (
          title
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setReflections(data);

      const totalHours = data.reduce((sum, r) => sum + Number(r.hours_spent), 0);
      const averageRating = data.length > 0
        ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
        : 0;

      setStats({
        totalReflections: data.length,
        totalHours,
        averageRating,
      });
    }

    setLoading(false);
  };

  const loadProgressData = async () => {
    if (!profile) return;

    try {
      const stats = await progressionService.getDashboardStats(profile.id);
      setDashboardStats(stats);

      const inProgress = await progressionService.getUserInProgressSkills(profile.id);
      setInProgressSkills(inProgress);

      const completed = await progressionService.getUserCompletedSkills(profile.id);
      setCompletedSkills(completed);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const loadMentorData = async () => {
    if (!profile) return;

    try {
      const { data: assignments } = await supabase
        .from('mentor_assignments')
        .select(`
          *,
          learner:learner_id (
            full_name,
            email
          ),
          skill:skill_id (
            title
          )
        `)
        .eq('mentor_id', profile.id)
        .eq('status', 'active');

      setMentorAssignments(assignments || []);

      const { data: feedback } = await supabase
        .from('mentor_feedback')
        .select('id')
        .eq('mentor_id', profile.id);

      const activeMentees = new Set(assignments?.map(a => a.learner_id) || []).size;

      const { data: reflectionsNeedingFeedback } = await supabase
        .from('reflections')
        .select(`
          *,
          skills (title),
          users (full_name)
        `)
        .in('user_id', assignments?.map(a => a.learner_id) || [])
        .order('created_at', { ascending: false })
        .limit(5);

      const reflectionsWithoutFeedback = reflectionsNeedingFeedback?.filter(r => {
        return !feedback?.some(f => (f as any).reflection_id === r.id);
      }) || [];

      setRecentReflections(reflectionsWithoutFeedback);

      setMentorStats({
        active_mentees: activeMentees,
        pending_reviews: reflectionsWithoutFeedback.length,
        total_feedback: feedback?.length || 0,
      });
    } catch (error) {
      console.error('Error loading mentor data:', error);
    }

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const pageRef = useRef<HTMLDivElement>(null);
  useScrollRevealAll('.reveal', pageRef.current);

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 page-enter" ref={pageRef}>
      <div className="space-y-6">
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-5 sm:p-8 reveal">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-6 text-center break-words">
            {profile.full_name}
          </h2>

          <div className="space-y-3 text-center">
            <div>
              <label className="text-sm font-semibold text-amber-300">Email</label>
              <p className="text-sm sm:text-base text-blue-100 break-all">{profile.email}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-amber-300">Role</label>
              <p className="text-sm sm:text-base font-bold text-white capitalize bg-amber-900/40 inline-block px-4 py-1.5 rounded-full border border-amber-400/50">{profile.role}</p>
            </div>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-8 reveal reveal-delay-1">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-7 h-7 text-amber-300" />
              <h3 className="text-2xl font-bold text-amber-300">Capstone Badges</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-r ${getBadgeColor(badge.badge)} p-4 sm:p-6 rounded-xl shadow-lg border-2 border-white/30`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl sm:text-4xl">{getBadgeIcon(badge.badge)}</div>
                    <div className="text-white">
                      <div className="font-bold text-base sm:text-lg">{badge.badge}</div>
                      <div className="text-sm text-white/90">{badge.score.toFixed(2)}/4.0</div>
                    </div>
                  </div>
                  <div className="text-white/90 font-medium text-sm border-t border-white/20 pt-3">
                    {badge.skillTitle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.role === 'learner' && (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-5 sm:p-8 reveal reveal-delay-2">
            <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-4 sm:mb-6">Progress Overview</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border-2 border-amber-400/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardStats.completed_count}</p>
                <p className="text-xs sm:text-sm text-blue-200">Completed</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border-2 border-amber-400/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardStats.in_progress_count}</p>
                <p className="text-xs sm:text-sm text-blue-200">In Progress</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border-2 border-amber-400/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{dashboardStats.average_progress}%</p>
                <p className="text-xs sm:text-sm text-blue-200">Avg Progress</p>
              </div>
            </div>
          </div>
        )}

        {profile.role === 'learner' && (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-6 reveal reveal-delay-3">
            <h3 className="text-xl font-bold text-amber-300 mb-4">Skills in Progress</h3>
            {inProgressSkills.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 text-center">
                <p className="text-blue-200">You haven't started any skills yet.</p>
                <p className="text-sm text-blue-300 mt-2">Start exploring the curriculum to begin your learning journey!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressSkills.map((userSkill) => (
                  <div key={userSkill.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30">
                    <h4 className="font-bold text-white mb-2">{userSkill.skills?.title}</h4>
                    <div className="bg-gray-700 rounded-full h-3 mb-2">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-yellow-500 h-3 rounded-full transition-all"
                        style={{ width: `${userSkill.progress?.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-200">{userSkill.progress?.progress_percentage || 0}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {profile.role === 'learner' && (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-6 reveal reveal-delay-4">
            <h3 className="text-xl font-bold text-amber-300 mb-4">Completed Skills</h3>
            {completedSkills.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 text-center">
                <p className="text-blue-200">No completed skills yet.</p>
                <p className="text-sm text-blue-300 mt-2">Keep working on your in-progress skills to see them here!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedSkills.map((userSkill) => (
                  <div key={userSkill.id} className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-3 text-white font-bold text-center border-2 border-green-400 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {userSkill.skills?.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {profile.role === 'mentor' && (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-5 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-4 sm:mb-6">Mentor Overview</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border-2 border-amber-400/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{mentorStats.active_mentees}</p>
                <p className="text-xs sm:text-sm text-blue-200">Active Mentees</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border-2 border-amber-400/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{mentorStats.pending_reviews}</p>
                <p className="text-xs sm:text-sm text-blue-200">Pending Reviews</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border-2 border-amber-400/30 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{mentorStats.total_feedback}</p>
                <p className="text-xs sm:text-sm text-blue-200">Total Feedback</p>
              </div>
            </div>
          </div>
        )}

        {profile.role === 'mentor' && (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-6">
            <h3 className="text-xl font-bold text-amber-300 mb-4">My Mentees</h3>
            {mentorAssignments.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-amber-400/30 text-center">
                <Users className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                <p className="text-blue-200 font-semibold">No mentees assigned yet</p>
                <p className="text-sm text-blue-300 mt-2">You'll see your assigned learners here once they're connected to you</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mentorAssignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">{assignment.learner?.full_name}</h4>
                        <p className="text-sm text-blue-200">{assignment.learner?.email}</p>
                        {assignment.skill && (
                          <p className="text-xs text-amber-300 mt-1">Skill: {assignment.skill.title}</p>
                        )}
                      </div>
                      <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold border border-green-400/50">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {profile.role === 'mentor' && recentReflections.length > 0 && (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-6">
            <h3 className="text-xl font-bold text-amber-300 mb-4">Recent Reflections</h3>
            <div className="space-y-3">
              {recentReflections.slice(0, 3).map((reflection: any) => (
                <div key={reflection.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{reflection.users?.full_name}</h4>
                      <p className="text-xs text-amber-300">{reflection.skills?.title}</p>
                    </div>
                    <MessageSquare className="w-4 h-4 text-blue-300" />
                  </div>
                  <p className="text-sm text-blue-200 line-clamp-2">{reflection.content}</p>
                  <p className="text-xs text-blue-300 mt-2">{formatDate(reflection.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl shadow-xl border-3 border-amber-400/60 p-5 sm:p-8 reveal reveal-delay-2">
        {profile.role === 'learner' ? (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-4 sm:mb-6">
              Reflection History
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-blue-200">Loading reflections...</p>
              </div>
            ) : reflections.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <p className="text-white font-semibold">No reflections yet. Start learning and share your journey!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {reflections.map((reflection) => (
                  <div
                    key={reflection.id}
                    className="rounded-xl p-5 border-2 border-amber-400/50 hover:border-amber-400 hover:shadow-lg transition-all duration-200 bg-white/10 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg mb-2">
                          {reflection.skills?.title || 'Unknown Skill'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg font-medium text-blue-100">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            {formatDate(reflection.created_at)}
                          </span>
                          <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg font-medium text-blue-100">
                            <Clock className="w-4 h-4 text-amber-400" />
                            {reflection.hours_spent}h
                          </span>
                          <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg font-medium text-blue-100">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            {reflection.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-amber-400/30">
                      <p className="text-blue-100 leading-relaxed">{reflection.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-3 rounded-xl shadow-lg border-2 border-amber-300">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Mentor Dashboard
              </h2>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed">
              As a mentor, you can create and manage learning groups from the Groups page.
              Help learners achieve their goals by organizing structured learning experiences.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
