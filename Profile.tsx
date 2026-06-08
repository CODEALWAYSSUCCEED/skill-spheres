import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, TrendingUp, GraduationCap } from 'lucide-react';

type Skill = {
  id: string;
  title: string;
  description: string;
  impact_statement: string;
  category: string;
  subcategory: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  stage: 'foundation' | 'exploration' | 'application' | 'integration';
  stage_number: number;
};

type CategoryViewProps = {
  category: string;
  stage: string;
  onBack: () => void;
  onSelectSkill: (skillId: string) => void;
};

const difficultyColors = {
  beginner: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
  intermediate: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  advanced: 'bg-gradient-to-r from-rose-500 to-red-600 text-white',
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

const categoryBorders: { [key: string]: string } = {
  'Creative Basics': 'border-pink-400',
  'Cognitive Development': 'border-cyan-400',
  'Digital Literacy': 'border-violet-400',
  'Personal Development': 'border-green-400',
  'Creative & Media': 'border-fuchsia-400',
  'Professional Foundation': 'border-blue-400',
  'Digital & Strategic': 'border-cyan-400',
  'Wealth & Leadership': 'border-amber-400',
  'Inner & Societal Impact': 'border-rose-400',
  'Core AI & Intelligent Systems': 'border-violet-400',
  'Technology & Engineering': 'border-slate-400',
  'Business & Finance': 'border-emerald-400',
  'Healthcare & BioTech': 'border-red-400',
  'Sustainability & Climate Tech': 'border-lime-400',
  'Creative & Media AI': 'border-fuchsia-400',
  'Governance & Policy': 'border-stone-400',
  'Human Advantage Skills': 'border-orange-400',
  'Academic Foundations': 'border-blue-400',
  'Sports & Athletics': 'border-red-400',
  'Handyman & Practical Skills': 'border-yellow-400',
  'Deep Cognitive Skills': 'border-teal-400',
  'Advanced Technology': 'border-purple-400',
  'Human-Centered Design': 'border-pink-400',
  'Value Creation & Impact': 'border-green-400',
  'Climate Solutions': 'border-lime-400',
  'Mental Health Solutions': 'border-blue-400',
  'Special Education Solutions': 'border-amber-400',
  'Cybersecurity Solutions': 'border-slate-400',
  'Pandemic Preparedness': 'border-red-400',
  'Collaborative Leadership': 'border-orange-400',
  'Inner Development': 'border-violet-400',
};

export function CategoryView({ category, stage, onBack, onSelectSkill }: CategoryViewProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategorySkills();
  }, [category, stage]);

  const loadCategorySkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('category', category)
      .eq('stage', stage)
      .order('skill_number', { ascending: true });

    if (data && !error) {
      setSkills(data);
    }
    setLoading(false);
  };

  const gradient = categoryGradients[category] || 'from-gray-600 via-gray-700 to-gray-800';
  const borderColor = categoryBorders[category] || 'border-amber-400';

  const groupedBySubcategory = skills.reduce((acc, skill) => {
    const subcat = skill.subcategory || 'Core Skills';
    if (!acc[subcat]) {
      acc[subcat] = [];
    }
    acc[subcat].push(skill);
    return acc;
  }, {} as { [key: string]: Skill[] });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-blue-200 animate-pulse">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-7xl mx-auto page-enter">
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm flex-wrap">
          <li>
            <button
              onClick={onBack}
              className="text-blue-200 hover:text-amber-300 transition-colors font-medium"
            >
              Curriculum
            </button>
          </li>
          <li className="text-blue-400">/</li>
          <li>
            <span className="text-blue-200 font-medium capitalize">{stage}</span>
          </li>
          <li className="text-blue-400">/</li>
          <li>
            <span className="text-amber-300 font-bold">{category}</span>
          </li>
        </ol>
      </nav>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white hover:text-amber-300 mb-6 font-bold transition-colors"
        aria-label="Back to curriculum overview"
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        Back to Curriculum
      </button>

      <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 md:p-8 mb-8 shadow-2xl`}>
        <div className="flex items-center gap-4 mb-3">
          <GraduationCap className="w-10 h-10 text-white" aria-hidden="true" />
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">{category}</h1>
            <p className="text-white/90 font-semibold capitalize">{stage} Stage</p>
          </div>
        </div>
        <p className="text-white/80 text-base md:text-lg leading-relaxed">
          {skills.length} skills in this category
        </p>
      </div>

      {Object.entries(groupedBySubcategory).map(([subcategory, subcategorySkills]) => (
        <div key={subcategory} className="mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-amber-300 mb-6">
            {subcategory}
            <span className="text-blue-200 text-lg ml-3">({subcategorySkills.length} skills)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcategorySkills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => onSelectSkill(skill.id)}
                className="group relative rounded-2xl shadow-xl overflow-hidden card-hover btn-press cursor-pointer border border-white/10 hover:border-white/25 text-left w-full"
                style={{
                  background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)`,
                }}
                aria-label={`View details for ${skill.title}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-80`} aria-hidden="true"></div>

                <div className="relative p-5">
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full shadow-lg ${difficultyColors[skill.difficulty_level]} border border-white/20`}>
                      {skill.difficulty_level.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-blue-200 px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                      Skill #{skill.stage_number}.{skill.skill_number}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white mb-2 group-hover:text-amber-300 transition-all duration-300 leading-tight">
                    {skill.title}
                  </h3>

                  <p className="text-blue-100 text-sm mb-3 line-clamp-2 leading-relaxed">
                    {skill.description}
                  </p>

                  <div className="flex items-start gap-2 bg-white/5 rounded-lg p-2.5 border border-white/10">
                    <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p className="text-blue-100 text-xs leading-relaxed line-clamp-2 font-semibold">
                      {skill.impact_statement}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {skills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-amber-300 text-lg font-semibold">No skills found in this category.</p>
        </div>
      )}
    </div>
  );
}
