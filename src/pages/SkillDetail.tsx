import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { progressionService } from '../lib/progressionService';
import SkillResources from '../components/SkillResources';
import VideoReflections from '../components/VideoReflections';
import CapstoneProject from '../components/CapstoneProject';
import UniversalCapstone from '../components/UniversalCapstone';
import VirtualMentorSelector from '../components/VirtualMentorSelector';
import { ArrowLeft, Globe as Globe2, TrendingUp, Star, Clock, Users, Award, Target, CheckCircle2, Circle, Play, Trophy, BookOpen, Video, FileCheck, Lightbulb, Globe, Lock, MessageSquare } from 'lucide-react';
import type { SkillProgress, MilestoneWithCompletion } from '../types/progression';

const sdgNames: { [key: number]: string } = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health', 4: 'Quality Education',
  5: 'Gender Equality', 6: 'Clean Water', 7: 'Affordable Energy', 8: 'Decent Work',
  9: 'Innovation', 10: 'Reduced Inequalities', 11: 'Sustainable Cities',
  12: 'Responsible Consumption', 13: 'Climate Action', 14: 'Life Below Water',
  15: 'Life on Land', 16: 'Peace & Justice', 17: 'Partnerships',
};

type Skill = {
  id: string;
  title: string;
  description: string;
  sdg_numbers: number[];
  impact_statement: string;
  category: string;
  subcategory: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  stage: 'foundation' | 'exploration' | 'application' | 'integration';
  stage_number: number;
  proficiency_levels: { foundation: string; practitioner: string; mastery: string };
  real_world_application: string;
};

type SkillDetailProps = {
  skillId: string;
  onBack: () => void;
  onViewResources: (skillId: string) => void;
};

const card = 'rounded-2xl shadow-lg border border-white/10 p-5 sm:p-8 mb-6';
const cardBg = 'bg-white/8 backdrop-blur-sm';

export function SkillDetail({ skillId, onBack, onViewResources }: SkillDetailProps) {
  const { user, profile } = useAuth();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [hoursSpent, setHoursSpent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [publicReflections, setPublicReflections] = useState<{ id: string; content: string; rating: number; created_at: string; users: { full_name: string } | null }[]>([]);
  const [progress, setProgress] = useState<SkillProgress | null>(null);
  const [milestones, setMilestones] = useState<MilestoneWithCompletion[]>([]);
  const [startingSkill, setStartingSkill] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showUndo, setShowUndo] = useState(false);
  const [lastToggledMilestone, setLastToggledMilestone] = useState<{ id: string; wasCompleted: boolean } | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'milestones' | 'capstone' | 'resources' | 'videos' | 'reflections'>('milestones');

  useEffect(() => {
    setMilestones([]);
    setProgress(null);
    setActiveTab('milestones');
    loadSkillData();
  }, [skillId, user]);

  const loadSkillData = async () => {
    const { data: skillData, error: skillError } = await supabase.from('skills').select('*').eq('id', skillId).maybeSingle();
    if (skillData && !skillError) setSkill(skillData);


    if (user) {
      const progressData = await progressionService.getSkillProgress(user.id, skillId);
      setProgress(progressData);
      const milestonesData = await progressionService.getMilestonesWithCompletion(user.id, skillId);
      setMilestones(milestonesData);
    }

    const { data: pubRef } = await supabase
      .from('reflections')
      .select('id, content, rating, created_at, users(full_name)')
      .eq('skill_id', skillId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);
    setPublicReflections((pubRef ?? []) as any);

    setLoading(false);
  };

  const handleStartSkill = async () => {
    if (!user) return;
    setStartingSkill(true);
    const userSkill = await progressionService.startSkill(user.id, skillId);
    if (userSkill) {
      const progressData = await progressionService.getSkillProgress(user.id, skillId);
      setProgress(progressData);
    }
    setStartingSkill(false);
  };

  const handleToggleMilestone = async (milestoneId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    if (!user || progress?.status === 'not_started') return;
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    const wasCompleted = milestone.is_completed;
    if (wasCompleted) {
      const confirmed = window.confirm('Mark this milestone as incomplete?');
      if (!confirmed) return;
    }
    setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, is_completed: !m.is_completed } : m));
    try {
      await progressionService.toggleMilestone(user.id, milestoneId);
      const [progressData, milestonesData] = await Promise.all([
        progressionService.getSkillProgress(user.id, skillId),
        progressionService.getMilestonesWithCompletion(user.id, skillId)
      ]);
      setProgress(progressData);
      setMilestones(milestonesData);
      if (!wasCompleted) {
        setLastToggledMilestone({ id: milestoneId, wasCompleted });
        setShowUndo(true);
        if (undoTimeoutId) clearTimeout(undoTimeoutId);
        const timeoutId = setTimeout(() => { setShowUndo(false); setLastToggledMilestone(null); }, 5000);
        setUndoTimeoutId(timeoutId);
        setToastMessage('Milestone completed!');
      } else {
        setToastMessage('Milestone marked incomplete');
      }
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, is_completed: wasCompleted } : m));
      setToastMessage('Failed to update milestone. Please try again.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleUndoMilestone = async () => {
    if (!lastToggledMilestone || !user) return;
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    setShowUndo(false);
    setMilestones(prev => prev.map(m => m.id === lastToggledMilestone.id ? { ...m, is_completed: lastToggledMilestone.wasCompleted } : m));
    try {
      await progressionService.toggleMilestone(user.id, lastToggledMilestone.id);
      const progressData = await progressionService.getSkillProgress(user.id, skillId);
      setProgress(progressData);
      const milestonesData = await progressionService.getMilestonesWithCompletion(user.id, skillId);
      setMilestones(milestonesData);
      setToastMessage('Milestone completion undone');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      setToastMessage('Failed to undo. Please try again.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
    setLastToggledMilestone(null);
  };

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    const { error: insertError } = await supabase.from('reflections').insert({
      user_id: user.id, skill_id: skillId, content, rating, hours_spent: parseFloat(hoursSpent) || 0, is_public: isPublic,
    });
    if (insertError) {
      setError('Failed to save reflection. Please try again.');
    } else {
      setSuccess(isPublic ? 'Reflection saved and shared publicly!' : 'Reflection saved privately.');
      setContent('');
      setRating(5);
      setHoursSpent('');
      setIsPublic(false);
      await loadSkillData();
    }
    setSubmitting(false);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-200">Loading skill details...</div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="text-center py-12">
        <p className="text-blue-200">Skill not found.</p>
        <button onClick={onBack} className="mt-4 text-amber-300 hover:text-amber-200 font-semibold">Go back</button>
      </div>
    );
  }

  const stageConfig = {
    foundation: { label: 'Foundation', gradient: 'from-emerald-400 to-teal-500' },
    exploration: { label: 'Exploration', gradient: 'from-sky-400 to-cyan-500' },
    application: { label: 'Application', gradient: 'from-orange-400 to-amber-500' },
    integration: { label: 'Integration', gradient: 'from-rose-400 to-pink-500' },
  };

  const milestoneTypeStyle: Record<string, string> = {
    reading: 'bg-sky-500/20 text-sky-200 border border-sky-400/30',
    practice: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
    project: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
    quiz: 'bg-orange-500/20 text-orange-200 border border-orange-400/30',
    reflection: 'bg-rose-500/20 text-rose-200 border border-rose-400/30',
  };

  return (
    <div className="page-enter">
      {/* Toast */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl font-bold animate-fade-in text-sm ${
          toastType === 'success' ? 'bg-emerald-500/90 text-white border border-emerald-400/50' : 'bg-red-500/90 text-white border border-red-400/50'
        }`}>
          {toastMessage}
        </div>
      )}

      {/* Undo bar */}
      {showUndo && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-900/90 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl border border-amber-400/40 font-bold animate-fade-in flex items-center gap-4">
          <span className="text-blue-100">Milestone completed!</span>
          <button onClick={handleUndoMilestone} className="bg-amber-500 hover:bg-amber-400 text-blue-900 px-4 py-1.5 rounded-lg font-bold text-sm transition">
            Undo
          </button>
        </div>
      )}



      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-amber-300 mb-6 font-semibold transition group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Skills
      </button>

      {/* Header card */}
      <div className={`${card} ${cardBg}`}>
        <div className="mb-5">
          <span className={`inline-flex text-sm font-bold text-white bg-gradient-to-r ${stageConfig[skill.stage].gradient} px-4 py-1.5 rounded-full shadow-md mb-4`}>
            Stage {skill.stage_number}: {stageConfig[skill.stage].label}
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3">{skill.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-amber-900 bg-gradient-to-r from-amber-400 to-yellow-400 px-3 py-1 rounded-full">
              {skill.category}
            </span>
            {skill.subcategory && (
              <span className="text-sm font-medium text-blue-200 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
                {skill.subcategory}
              </span>
            )}
            <span className="text-sm font-medium text-blue-200 bg-white/10 border border-white/15 px-3 py-1 rounded-full capitalize">
              {skill.difficulty_level}
            </span>
          </div>
        </div>

        <p className="text-blue-100 text-lg leading-relaxed mb-6">{skill.description}</p>

        {/* Real-world application */}
        {skill.real_world_application && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-400/25 rounded-xl p-5 mb-5">
            <Lightbulb className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-amber-200 text-sm mb-1">Real-World Application</h3>
              <p className="text-blue-100 text-sm leading-relaxed">{skill.real_world_application}</p>
            </div>
          </div>
        )}

        {/* Proficiency levels */}
        <div className="bg-white/6 border border-white/10 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-sky-300" />
            <h3 className="font-bold text-sky-200 text-base">Proficiency Levels</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Level 1: Foundation', text: skill.proficiency_levels.foundation, color: 'text-emerald-300', dot: 'bg-emerald-400' },
              { label: 'Level 2: Practitioner', text: skill.proficiency_levels.practitioner, color: 'text-amber-300', dot: 'bg-amber-400' },
              { label: 'Level 3: Mastery', text: skill.proficiency_levels.mastery, color: 'text-rose-300', dot: 'bg-rose-400' },
            ].map(({ label, text, color, dot }) => (
              <div key={label} className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${dot} mt-1.5 flex-shrink-0`} />
                <div>
                  <h4 className={`font-bold text-sm ${color} mb-0.5`}>{label}</h4>
                  <p className="text-blue-200 text-sm leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SDGs */}
        {skill.sdg_numbers.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe2 className="w-4 h-4 text-amber-300" />
              <h3 className="font-bold text-amber-200 text-sm">Sustainable Goals</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {skill.sdg_numbers.map(sdg => (
                <span key={sdg} className="bg-amber-400/15 border border-amber-400/30 text-amber-200 text-xs font-semibold px-3 py-1 rounded-lg">
                  {sdgNames[sdg] || `Goal ${sdg}`}
                </span>
              ))}
            </div>
          </div>
        )}

        <VirtualMentorSelector skillId={skillId} skillName={skill.title} />

        {/* Impact statement */}
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-5 mt-5">
          <TrendingUp className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-emerald-200 text-sm mb-1">Impact Statement</h3>
            <p className="text-blue-100 text-sm leading-relaxed">{skill.impact_statement}</p>
          </div>
        </div>
      </div>

      {/* Progress card (learner) */}
      {profile?.role === 'learner' && user && progress && (
        <div className={`${card} ${cardBg}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-300" />
              <h2 className="text-2xl font-bold text-white">Your Progress</h2>
            </div>
            {progress.status === 'completed' && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-4 py-1.5 rounded-full text-sm font-bold">
                Completed
              </span>
            )}
          </div>

          {progress.status === 'not_started' ? (
            <div className="text-center py-8">
              <p className="text-blue-200 mb-6">Ready to begin your learning journey?</p>
              <button
                onClick={handleStartSkill}
                disabled={startingSkill}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-blue-900 px-8 py-3.5 rounded-xl font-bold hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 text-base"
              >
                <Play className="w-5 h-5" />
                {startingSkill ? 'Starting...' : 'Start Skill'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-200">
                  {progress.completed_required_milestones} of {progress.required_milestones} required milestones
                </span>
                <span className="text-sm font-bold text-amber-300">{progress.progress_percentage}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-yellow-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.progress_percentage}%` }}
                  role="progressbar"
                  aria-valuenow={progress.progress_percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
        </div>
      )}



      {/* Tabs */}
      <div className={`${cardBg} rounded-2xl shadow-lg border border-white/10 mb-6`}>
        <div className="border-b border-white/10 px-2 pt-2 flex gap-1 overflow-x-auto">
          {[
            { key: 'milestones', icon: Trophy, label: 'Milestones' },
            { key: 'capstone', icon: FileCheck, label: 'Capstone' },
            { key: 'resources', icon: BookOpen, label: 'Resources' },
            { key: 'reflections', icon: MessageSquare, label: 'Reflections', badge: publicReflections.length || undefined },
            { key: 'videos', icon: Video, label: 'Video Reflections' },
          ].map(({ key, icon: Icon, label, badge }: any) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-blue-900 shadow'
                  : 'text-blue-300 hover:text-white hover:bg-white/6'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge ? <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === key ? 'bg-blue-900/30' : 'bg-amber-400/20 text-amber-300'}`}>{badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'milestones' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="w-5 h-5 text-amber-300" />
                <h2 className="text-xl font-bold text-white">Learning Milestones</h2>
              </div>
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      milestone.is_completed
                        ? 'bg-emerald-500/8 border-emerald-400/20'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <button
                      onClick={e => handleToggleMilestone(milestone.id, e)}
                      className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                      disabled={!user || progress?.status === 'not_started'}
                    >
                      {milestone.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-blue-400/50 hover:text-amber-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-blue-400">Step {index + 1}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${milestoneTypeStyle[milestone.type] || 'bg-white/10 text-blue-200 border border-white/10'}`}>
                          {milestone.type}
                        </span>
                        {milestone.is_required && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-400/25">Required</span>
                        )}
                      </div>
                      <h3 className={`font-bold mb-1 text-sm ${milestone.is_completed ? 'text-blue-300 line-through' : 'text-white'}`}>
                        {milestone.title}
                      </h3>
                      <p className="text-blue-300 text-xs leading-relaxed">{milestone.description}</p>
                      {milestone.estimated_minutes && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{milestone.estimated_minutes} minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {milestones.length === 0 && !loading && (
                  <p className="text-blue-300 text-center py-8">No milestones available for this skill yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'capstone' && skill && (
            <UniversalCapstone skillId={skillId} skillTitle={skill.title} skillCategory={skill.category} />
          )}

          {activeTab === 'resources' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-300" />
                  <h2 className="text-xl font-bold text-white">Resources</h2>
                </div>
                <button
                  onClick={() => onViewResources(skillId)}
                  className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 px-4 py-2 rounded-xl font-semibold transition text-sm"
                >
                  View All Resources
                </button>
              </div>
              <SkillResources skillId={skillId} />
            </div>
          )}

          {activeTab === 'reflections' && (
            <div className="space-y-6">
              {/* Write form */}
              {profile?.role === 'learner' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4">Write a Reflection</h3>
                  <form onSubmit={handleSubmitReflection} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-blue-200 mb-2">Your Reflection</label>
                      <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/50 transition-all text-sm resize-none"
                        placeholder="Share your learning experience, challenges, and insights..."
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-blue-200 mb-2">
                          <Star className="w-4 h-4 inline mr-1 text-amber-400" />Rating (1-5)
                        </label>
                        <select
                          value={rating}
                          onChange={e => setRating(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all text-sm appearance-none"
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n} className="bg-blue-900">{n} {n === 1 ? 'Star' : 'Stars'}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-200 mb-2">
                          <Clock className="w-4 h-4 inline mr-1 text-amber-400" />Hours Spent
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={hoursSpent}
                          onChange={e => setHoursSpent(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all text-sm"
                          placeholder="e.g., 2.5"
                        />
                      </div>
                    </div>
                    {/* Visibility toggle */}
                    <button
                      type="button"
                      onClick={() => setIsPublic(v => !v)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-semibold ${
                        isPublic
                          ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                          : 'bg-white/6 border-white/15 text-blue-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {isPublic ? 'Public: visible to all learners' : 'Private: only you can see this'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isPublic ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-white/40'}`}>
                        {isPublic ? 'ON' : 'OFF'}
                      </span>
                    </button>
                    {error && <div className="bg-red-500/15 text-red-300 px-4 py-3 rounded-xl text-sm border border-red-400/30">{error}</div>}
                    {success && <div className="bg-emerald-500/15 text-emerald-300 px-4 py-3 rounded-xl text-sm border border-emerald-400/30">{success}</div>}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-blue-900 py-3 rounded-xl font-bold hover:from-amber-400 hover:to-yellow-400 transition shadow-lg disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save Reflection'}
                    </button>
                  </form>
                </div>
              )}

              {/* Community reflections */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-amber-300" />
                  <h3 className="text-base font-bold text-white">Community Reflections</h3>
                  <span className="ml-auto text-blue-400/50 text-xs">{publicReflections.length} shared</span>
                </div>
                {publicReflections.length === 0 ? (
                  <div className="text-center py-10">
                    <Globe className="w-10 h-10 text-blue-400/20 mx-auto mb-3" />
                    <p className="text-blue-300/50 text-sm">No public reflections yet for this skill.</p>
                    <p className="text-blue-300/30 text-xs mt-1">Write a reflection above and set it to Public to be the first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {publicReflections.map(r => (
                      <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-300 text-xs font-bold">{(r.users as any)?.full_name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                          </div>
                          <span className="text-white/80 font-semibold text-sm">{(r.users as any)?.full_name ?? 'Learner'}</span>
                          <span className="text-blue-400/40 text-xs">{new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="ml-auto flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </span>
                        </div>
                        <p className="text-blue-100 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Video className="w-5 h-5 text-amber-300" />
                <h2 className="text-xl font-bold text-white">Video Reflections</h2>
              </div>
              <VideoReflections skillId={skillId} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
