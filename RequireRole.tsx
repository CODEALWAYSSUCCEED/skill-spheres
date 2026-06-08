import { useState, useEffect } from 'react';
import { Award, Trophy, Calendar, Clock, Star, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import type { VirtualMentor, MentorJourneyWithMilestone } from '../types/virtualMentor';
import { getMentorJourneys } from '../lib/virtualMentorService';

interface MentorProgressComparisonProps {
  mentor: VirtualMentor;
  milestones?: unknown[];
}

export default function MentorProgressComparison({ mentor }: MentorProgressComparisonProps) {
  const [journeys, setJourneys] = useState<MentorJourneyWithMilestone[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getMentorJourneys(mentor.id).then(setJourneys);
  }, [mentor.id]);

  const getDifficultyLabel = (r: number) => {
    if (r <= 2) return { label: 'Easy', color: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' };
    if (r <= 3) return { label: 'Moderate', color: 'text-amber-300 bg-amber-400/10 border-amber-400/20' };
    return { label: 'Challenging', color: 'text-red-300 bg-red-400/10 border-red-400/20' };
  };

  if (journeys.length === 0) {
    return (
      <div className="rounded-xl p-5 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white mb-1">{mentor.mentor_name}'s Milestone Insights</h3>
            <p className="text-sm text-blue-300/70 leading-relaxed">
              Add milestones above to document {mentor.mentor_name}'s real-world achievements. Their stories, lessons, and approach will appear here as a reference.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-xl p-4 border border-amber-400/20 flex items-center gap-4" style={{ background: 'rgba(245,158,11,0.05)' }}>
        <div className="w-9 h-9 bg-amber-400/15 rounded-full flex items-center justify-center flex-shrink-0">
          <Trophy className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">{mentor.mentor_name}'s Milestone Insights</p>
          <p className="text-blue-300/60 text-xs mt-0.5">Click any milestone to read their story</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-amber-400 font-black text-lg">{journeys.length}</p>
          <p className="text-blue-300/50 text-xs">milestones</p>
        </div>
      </div>

      {/* Journey list */}
      <div className="space-y-2">
        {journeys.map((journey, index) => {
          const isExpanded = expanded === journey.id;
          return (
            <div
              key={journey.id}
              className="rounded-xl border border-amber-400/20 cursor-pointer hover:border-amber-400/40 transition-all overflow-hidden"
              style={{ background: 'rgba(245,158,11,0.03)' }}
            >
              <div className="p-3.5 flex items-start gap-3" onClick={() => setExpanded(isExpanded ? null : journey.id)}>
                <div className="w-6 h-6 bg-amber-400/20 text-amber-300 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug">{journey.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {journey.time_invested && (
                      <span className="text-xs text-blue-300/60 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {journey.time_invested}
                      </span>
                    )}
                    {journey.difficulty_rating && (() => {
                      const d = getDifficultyLabel(journey.difficulty_rating!);
                      return (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${d.color}`}>
                          <Star className="w-2.5 h-2.5 inline mr-0.5" />{d.label}
                        </span>
                      );
                    })()}
                    {journey.completion_age && (
                      <span className="text-xs text-blue-300/60 flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" /> Age {journey.completion_age}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-blue-300/40">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-amber-400/15 px-4 pb-4 pt-3 space-y-3">
                  <div className="rounded-lg p-3 border border-white/8" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs font-bold text-blue-300/60 uppercase tracking-wide mb-1.5">How They Achieved It</p>
                    <p className="text-sm text-blue-100/90 leading-relaxed">{journey.story}</p>
                  </div>

                  {journey.lesson_learned && (
                    <div className="rounded-lg p-3 border border-amber-400/20" style={{ background: 'rgba(245,158,11,0.06)' }}>
                      <div className="flex items-start gap-2">
                        <Award className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-400/80 uppercase tracking-wide mb-1">Key Lesson</p>
                          <p className="text-sm text-amber-100/90 leading-relaxed">{journey.lesson_learned}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {journey.resources_used && journey.resources_used.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-blue-300/60 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Resources They Used
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {journey.resources_used.map((r, i) => (
                          <span key={i} className="text-xs bg-blue-400/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/20">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
