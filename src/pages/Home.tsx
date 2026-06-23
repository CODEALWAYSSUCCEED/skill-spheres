import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SkillSearch } from '../components/SkillSearch';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight, Globe, Users, Lightbulb, Zap, BookOpen, Play,
  CheckCircle, XCircle, GraduationCap, BarChart3, FlaskConical,
  Network, Rocket, ChevronRight, TrendingUp
} from 'lucide-react';
import { useScrollRevealAll } from '../hooks/useScrollReveal';

type CategorySummary = {
  category: string;
  count: number;
  stage: string;
};

type Skill = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  stage: string;
  difficulty_level: string;
};

const stageInfo: {
  [key: string]: {
    title: string;
    subtitle: string;
    description: string;
    color: string;
    border: string;
    stageNumber: number;
  };
} = {
  foundation: {
    title: 'Foundation',
    subtitle: 'Self & Expression (Ages 13-18)',
    description: 'Build core skills in communication, creativity, and digital literacy',
    color: 'from-emerald-400 via-teal-400 to-emerald-500',
    border: 'border-emerald-400',
    borderColor: 'rgba(52,211,153,0.3)',
    stageNumber: 1,
  },
  exploration: {
    title: 'Exploration',
    subtitle: 'Skill Discovery (Ages 18-25)',
    description: 'Discover strengths and build portfolio skills',
    color: 'from-blue-400 via-cyan-400 to-blue-500',
    border: 'border-blue-400',
    borderColor: 'rgba(96,165,250,0.3)',
    stageNumber: 2,
  },
  application: {
    title: 'Application',
    subtitle: 'Leadership & Strategy (Ages 25-40)',
    description: 'Specialize, lead, and create wealth',
    color: 'from-orange-400 via-amber-400 to-orange-500',
    border: 'border-orange-400',
    borderColor: 'rgba(251,146,60,0.3)',
    stageNumber: 3,
  },
  integration: {
    title: 'Integration',
    subtitle: 'Purpose & Impact (Ages 40+)',
    description: 'Build wisdom, impact, and legacy',
    color: 'from-rose-400 via-pink-400 to-rose-500',
    border: 'border-rose-400',
    borderColor: 'rgba(251,113,133,0.3)',
    stageNumber: 4,
  }
};

const categoryGradients: { [key: string]: string } = {
  'Creative Basics': 'from-pink-400 via-rose-400 to-pink-500',
  'Cognitive Development': 'from-cyan-400 via-blue-400 to-cyan-500',
  'Digital Literacy': 'from-violet-400 via-purple-400 to-violet-500',
  'Personal Development': 'from-green-400 via-emerald-400 to-green-500',
  'Creative & Media': 'from-fuchsia-400 via-pink-400 to-fuchsia-500',
  'Professional Foundation': 'from-blue-400 via-indigo-400 to-blue-500',
  'Digital & Strategic': 'from-cyan-400 via-sky-400 to-cyan-500',
  'Wealth & Leadership': 'from-amber-400 via-yellow-400 to-amber-500',
  'Inner & Societal Impact': 'from-rose-400 via-red-400 to-rose-500',
  'Core AI & Intelligent Systems': 'from-violet-400 via-purple-400 to-violet-500',
  'Technology & Engineering': 'from-slate-400 via-gray-400 to-slate-500',
  'Business & Finance': 'from-emerald-400 via-green-400 to-emerald-500',
  'Healthcare & BioTech': 'from-red-400 via-pink-400 to-red-500',
  'Sustainability & Climate Tech': 'from-lime-400 via-green-400 to-lime-500',
  'Creative & Media AI': 'from-fuchsia-400 via-purple-400 to-fuchsia-500',
  'Governance & Policy': 'from-stone-400 via-neutral-400 to-stone-500',
  'Human Advantage Skills': 'from-orange-400 via-amber-400 to-orange-500',
  'Academic Foundations': 'from-blue-400 via-sky-400 to-blue-500',
  'Sports & Athletics': 'from-red-400 via-orange-400 to-red-500',
  'Handyman & Practical Skills': 'from-yellow-400 via-amber-400 to-yellow-500',
  'Deep Cognitive Skills': 'from-teal-400 via-cyan-400 to-teal-500',
  'Advanced Technology': 'from-purple-400 via-violet-400 to-purple-500',
  'Human-Centered Design': 'from-pink-400 via-rose-400 to-pink-500',
  'Value Creation & Impact': 'from-green-400 via-emerald-400 to-green-500',
  'Climate Solutions': 'from-lime-400 via-green-400 to-lime-500',
  'Mental Health Solutions': 'from-blue-400 via-sky-400 to-blue-500',
  'Special Education Solutions': 'from-amber-400 via-yellow-400 to-amber-500',
  'Cybersecurity Solutions': 'from-slate-400 via-gray-400 to-slate-500',
  'Pandemic Preparedness': 'from-red-400 via-pink-400 to-red-500',
  'Collaborative Leadership': 'from-orange-400 via-amber-400 to-orange-500',
  'Inner Development': 'from-violet-400 via-purple-400 to-violet-500',
};

const categoryBorderColors: { [key: string]: string } = {
  'Creative Basics': 'rgba(244,114,182,0.35)',
  'Cognitive Development': 'rgba(34,211,238,0.35)',
  'Digital Literacy': 'rgba(167,139,250,0.35)',
  'Personal Development': 'rgba(74,222,128,0.35)',
  'Creative & Media': 'rgba(232,121,249,0.35)',
  'Professional Foundation': 'rgba(96,165,250,0.35)',
  'Digital & Strategic': 'rgba(34,211,238,0.35)',
  'Wealth & Leadership': 'rgba(251,191,36,0.35)',
  'Inner & Societal Impact': 'rgba(251,113,133,0.35)',
  'Core AI & Intelligent Systems': 'rgba(167,139,250,0.35)',
  'Technology & Engineering': 'rgba(148,163,184,0.35)',
  'Business & Finance': 'rgba(52,211,153,0.35)',
  'Healthcare & BioTech': 'rgba(248,113,113,0.35)',
  'Sustainability & Climate Tech': 'rgba(163,230,53,0.35)',
  'Creative & Media AI': 'rgba(232,121,249,0.35)',
  'Governance & Policy': 'rgba(168,162,158,0.35)',
  'Human Advantage Skills': 'rgba(251,146,60,0.35)',
  'Academic Foundations': 'rgba(96,165,250,0.35)',
  'Sports & Athletics': 'rgba(248,113,113,0.35)',
  'Handyman & Practical Skills': 'rgba(250,204,21,0.35)',
  'Deep Cognitive Skills': 'rgba(45,212,191,0.35)',
  'Advanced Technology': 'rgba(192,132,252,0.35)',
  'Human-Centered Design': 'rgba(244,114,182,0.35)',
  'Value Creation & Impact': 'rgba(74,222,128,0.35)',
  'Climate Solutions': 'rgba(163,230,53,0.35)',
  'Mental Health Solutions': 'rgba(96,165,250,0.35)',
  'Special Education Solutions': 'rgba(251,191,36,0.35)',
  'Cybersecurity Solutions': 'rgba(148,163,184,0.35)',
  'Pandemic Preparedness': 'rgba(248,113,113,0.35)',
  'Collaborative Leadership': 'rgba(251,146,60,0.35)',
  'Inner Development': 'rgba(167,139,250,0.35)',
  'Academics': 'rgba(96,165,250,0.35)',
  'Computer Science & AI Systems': 'rgba(34,211,238,0.35)',
  'Spiritual Development & Inner Growth': 'rgba(167,139,250,0.35)',
};


type HomeProps = {
  onSelectSkill: (skillId: string) => void;
  onSelectCategory: (category: string, stage: string) => void;
  onNavigate: (page: 'home' | 'profile' | 'studios' | 'groups' | 'blog' | 'contact') => void;
};

export function Home({ onSelectSkill, onSelectCategory, onNavigate }: HomeProps) {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [inProgressSkills, setInProgressSkills] = useState<Skill[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollRevealAll('.reveal', pageRef.current);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadData = async () => {
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('id, title, description, category, subcategory, stage, difficulty_level');

    if (skillsData && !skillsError) {
      setSkills(skillsData);

      const categoryCounts = skillsData.reduce((acc, skill) => {
        const key = `${skill.stage}:${skill.category}`;
        if (!acc[key]) {
          acc[key] = { category: skill.category, stage: skill.stage, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {} as { [key: string]: CategorySummary });

      setCategories(Object.values(categoryCounts));
    }
    setLoading(false);
  };

  const loadUserProgress = async () => {
    if (!user) return;

    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('skill_id, status')
      .eq('user_id', user.id)
      .in('status', ['in_progress', 'started']);

    if (userSkills && userSkills.length > 0) {
      const skillIds = userSkills.map(us => us.skill_id);
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, title, description, category, subcategory, stage, difficulty_level')
        .in('id', skillIds)
        .limit(3);

      if (skillsData) {
        setInProgressSkills(skillsData);
      }
    }
  };

  const handleBrowseSkills = () => {
    setSelectedStage('foundation');
    setTimeout(() => {
      const curriculumSection = document.getElementById('curriculum');
      if (curriculumSection) {
        curriculumSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleExploreStudios = () => {
    onNavigate('studios');
  };

  const groupedByStage = categories.reduce((acc, item) => {
    if (!acc[item.stage]) {
      acc[item.stage] = [];
    }
    acc[item.stage].push(item);
    return acc;
  }, {} as { [key: string]: CategorySummary[] });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-blue-200/85 text-sm">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter" ref={pageRef}>

      {/* Page header */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-400/15 border border-amber-400/25 rounded-lg p-2">
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>Skill Sphere</h1>
            <p className="text-blue-200/70 text-xs">by 317 Solutions, your interactive learning dashboard</p>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-amber-400/20 via-blue-400/10 to-transparent" />
      </section>

      {/* ── LEARNER: Continue / Start ── */}
      {user && profile?.role === 'learner' && (
        <section className="mb-10">
          {inProgressSkills.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-label text-amber-400/60 mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>PICK UP WHERE YOU LEFT OFF</p>
                  <h2 className="text-xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>Continue Learning</h2>
                </div>
                <button
                  onClick={handleBrowseSkills}
                  className="text-xs font-semibold text-blue-300/60 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  Browse all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {inProgressSkills.map((skill, i) => (
                  <button
                    key={skill.id}
                    onClick={() => onSelectSkill(skill.id)}
                    className="w-full text-left group flex items-center gap-4 p-4 rounded-xl border border-blue-400/15 hover:border-amber-400/30 transition-all skill-row-hover"
                    style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 60}ms` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate" style={{ letterSpacing: '-0.01em' }}>{skill.title}</p>
                      <p className="text-blue-200/70 text-xs mt-0.5">{skill.category}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-amber-400/70 bg-amber-400/8 px-2 py-0.5 rounded-full border border-amber-400/15">In Progress</span>
                      <Play className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-amber-400/20" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="p-6">
                <p className="text-label text-amber-400/60 mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>READY TO BEGIN</p>
                <h2 className="text-xl font-extrabold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Start your first skill</h2>
                <p className="text-blue-200/80 text-sm mb-5">Choose from 220+ skills across Math, CS, AI, and more.</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleBrowseSkills}
                    className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-blue-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/20 btn-press"
                  >
                    <Play className="w-4 h-4" />
                    Browse Skills
                  </button>
                  <button
                    onClick={handleExploreStudios}
                    className="flex items-center gap-2 border border-white/15 text-white/70 hover:text-white hover:border-white/25 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                  >
                    <Users className="w-4 h-4" />
                    Explore Studios
                  </button>
                </div>
              </div>
              <div className="border-t border-white/6 px-6 py-3 flex gap-6">
                {[['220+', 'Skills'], ['4', 'Stages'], ['30+', 'Categories']].map(([val, lbl]) => (
                  <div key={lbl}>
                    <span className="text-amber-400 font-extrabold text-sm" style={{ letterSpacing: '-0.02em' }}>{val}</span>
                    <span className="text-blue-300/40 text-xs ml-1.5">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── MENTOR: Dashboard ── */}
      {user && profile?.role === 'mentor' && (
        <section className="mb-10">
          <div className="rounded-2xl border border-sky-400/20 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-label text-sky-400/60 mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>MENTOR WORKSPACE</p>
            <h2 className="text-xl font-extrabold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>Guide your learners</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExploreStudios}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20"
              >
                <Globe className="w-4 h-4" /> View Studios
              </button>
              <button
                onClick={handleBrowseSkills}
                className="flex items-center gap-2 border border-white/15 text-white/70 hover:text-white hover:border-white/25 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                <BookOpen className="w-4 h-4" /> Browse Curriculum
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Search */}
      <section className="mb-10">
        <SkillSearch skills={skills} onSelectSkill={onSelectSkill} />
      </section>

      {/* ── PROBLEM STUDIO ── */}
      <section className="mb-10 sm:mb-14">
        <div className="mb-6">
          <p className="text-label text-amber-400/60 mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>HOW WE LEARN</p>
          <h2 className="text-2xl font-extrabold text-white mb-2" style={{ letterSpacing: '-0.025em' }}>The Problem Studio Model</h2>
          <p className="text-blue-200/85 text-sm max-w-lg">
            Not isolated courses. Real interdisciplinary studios where skills combine to solve actual problems.
          </p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* Traditional */}
          <div className="rounded-xl p-5 border border-red-400/20" style={{ background: 'rgba(239,68,68,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-red-500/15 border border-red-400/25 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <h4 className="font-bold text-white/70 text-sm">Traditional Education</h4>
            </div>
            <ul className="space-y-2.5">
              {['Subject-based silos', 'Theory-heavy lectures', 'Individual exams', 'Passive consumption'].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-blue-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/15 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Studio approach */}
          <div className="rounded-xl p-5 border border-emerald-400/20" style={{ background: 'rgba(52,211,153,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h4 className="font-bold text-emerald-300 text-sm">Problem Studio Approach</h4>
            </div>
            <ul className="space-y-2.5">
              {['Interdisciplinary integration', 'Real-world application', 'Team capstone projects', 'Practitioner mentorship'].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-emerald-200/70">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Studio pillars */}
        <div className="rounded-xl p-5 border border-amber-400/15" style={{ background: 'rgba(245,158,11,0.04)' }}>
          <p className="text-label text-amber-400/60 mb-4" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>EACH STUDIO INCLUDES</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: FlaskConical, label: 'Applied Research', sub: 'Real problem context' },
              { icon: Network, label: 'Systems Mapping', sub: 'Holistic analysis' },
              { icon: BarChart3, label: 'Domain Deep Dive', sub: 'Specialized expertise' },
              { icon: Users, label: 'Peer Collaboration', sub: 'Team co-creation' },
              { icon: TrendingUp, label: 'Skill Progression', sub: 'Tracked milestones' },
              { icon: Rocket, label: 'Capstone Launch', sub: 'Real-world deployment' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white/80 font-semibold text-xs" style={{ letterSpacing: '-0.01em' }}>{label}</p>
                  <p className="text-blue-300/40 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IT MATTERS ── */}
      <section className="mb-10 sm:mb-14 px-0">
        <div className="mb-6">
          <p className="text-label text-sky-400/60 mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>PHILOSOPHY</p>
          <h2 className="text-2xl font-extrabold text-white" style={{ letterSpacing: '-0.025em' }}>Why This Matters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { Icon: Globe, iconColor: 'text-emerald-400', borderColor: 'border-emerald-400/20', iconBg: 'bg-emerald-400/10', bg: 'rgba(52,211,153,0.04)', title: 'Systems Thinking', body: 'Understand complex interconnected problems like climate change, inequality, and public health as whole living systems.' },
            { Icon: Zap, iconColor: 'text-sky-400', borderColor: 'border-sky-400/20', iconBg: 'bg-sky-400/10', bg: 'rgba(56,189,248,0.04)', title: 'Technology as Tool', body: 'Use modern tech as collaborative intelligence to explore solutions and model complex scenarios.' },
            { Icon: Users, iconColor: 'text-rose-400', borderColor: 'border-rose-400/20', iconBg: 'bg-rose-400/10', bg: 'rgba(251,113,133,0.04)', title: 'Human-Centered', body: 'Design with empathy and inclusion. Build solutions that are compassionate and serve everyone.' },
            { Icon: Lightbulb, iconColor: 'text-amber-400', borderColor: 'border-amber-400/20', iconBg: 'bg-amber-400/10', bg: 'rgba(251,191,36,0.04)', title: 'Real Impact', body: 'Learn to measure impact, navigate policy, and deploy solutions that create lasting value.' },
          ].map(({ Icon, iconColor, borderColor, iconBg, bg, title, body }) => (
            <div
              key={title}
              className={`p-4 sm:p-5 rounded-xl border ${borderColor} card-hover float-card`}
              style={{ background: bg }}
            >
              <div className={`w-9 h-9 rounded-xl ${iconBg} border ${borderColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <h3 className="font-extrabold text-white text-sm mb-2" style={{ letterSpacing: '-0.01em' }}>{title}</h3>
              <p className="text-blue-200/80 text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CURRICULUM ── */}
      <section id="curriculum" className="mb-16 scroll-mt-20">
        <div className="mb-6">
          <p className="text-label text-blue-400/60 mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>CURRICULUM</p>
          <h2 className="text-2xl font-extrabold text-white mb-1" style={{ letterSpacing: '-0.025em' }}>Explore by Learning Stage</h2>
          <p className="text-blue-200/80 text-sm">Choose a stage, then pick a category to see all skills and learning paths.</p>
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
          {selectedStage ? (
            <>
              <button
                onClick={() => setSelectedStage(null)}
                className="flex items-center gap-2 text-blue-300/60 hover:text-amber-400 mb-4 font-semibold transition-colors text-sm"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                All Stages
              </button>

              {Object.entries(stageInfo).map(([stage, info]) => {
                if (stage !== selectedStage) return null;
                const stageCategories = groupedByStage[stage] || [];

                return (
                  <div key={stage}>
                    <div className={`bg-gradient-to-r ${info.color} rounded-2xl px-6 py-5 mb-6 shadow-xl`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="bg-white/20 text-white font-extrabold text-xs px-3 py-1 rounded-full" style={{ letterSpacing: '0.04em' }}>
                          STAGE {info.stageNumber}
                        </span>
                        <div>
                          <h3 className="text-2xl font-extrabold text-white" style={{ letterSpacing: '-0.025em' }}>{info.title}</h3>
                          <p className="text-white/70 text-xs mt-0.5">{info.subtitle}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stageCategories.map((item) => {
                        const gradient = categoryGradients[item.category] || 'from-gray-600 via-gray-700 to-gray-800';
                        const borderColor = categoryBorderColors[item.category] || 'rgba(251,191,36,0.35)';

                        return (
                          <button
                            key={`${item.stage}-${item.category}`}
                            onClick={() => onSelectCategory(item.category, item.stage)}
                            className="group relative rounded-xl overflow-hidden card-hover btn-press text-left p-4"
                            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${borderColor}` }}
                          >
                            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors leading-tight" style={{ letterSpacing: '-0.01em' }}>
                                {item.category}
                              </h4>
                              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-blue-300/40 text-xs mt-1">{item.count} skills</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stageInfo).map(([stage, info], idx) => {
                const stageCategories = groupedByStage[stage] || [];
                const totalSkills = stageCategories.reduce((sum, cat) => sum + cat.count, 0);
                const staggerClass = `reveal-delay-${Math.min(idx + 1, 4)}`;

                return (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    className="group relative rounded-2xl overflow-hidden card-hover btn-press text-left"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${info.borderColor}` }}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${info.color}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full bg-gradient-to-r ${info.color} text-white`} style={{ letterSpacing: '0.02em' }}>
                          Stage {info.stageNumber}
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-1 transition-all mt-0.5" />
                      </div>
                      <h3 className="text-xl font-extrabold text-white mb-1" style={{ letterSpacing: '-0.025em' }}>{info.title}</h3>
                      <p className="text-blue-200/70 text-xs mb-3">{info.subtitle}</p>
                      <p className="text-blue-200/85 text-sm leading-relaxed mb-4">{info.description}</p>
                      <div className="flex gap-3">
                        <span className="text-xs font-semibold text-white/60 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${info.borderColor}` }}>
                          {stageCategories.length} categories
                        </span>
                        <span className="text-xs font-semibold text-white/60 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${info.borderColor}` }}>
                          {totalSkills} skills
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
