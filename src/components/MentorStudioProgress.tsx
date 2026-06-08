import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, User, Calendar, MessageSquare } from 'lucide-react';
import { reflectionService } from '../lib/reflectionService';
import type { LearnerProgress } from '../types/reflection';

interface MentorStudioProgressProps {
  studioId: string;
  studioTitle: string;
  onBack: () => void;
  onViewLearner: (learnerId: string) => void;
}

export function MentorStudioProgress({ studioId, studioTitle, onBack, onViewLearner }: MentorStudioProgressProps) {
  const [learners, setLearners] = useState<LearnerProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearnerProgress();
  }, [studioId]);

  const loadLearnerProgress = async () => {
    try {
      const progress = await reflectionService.getStudioLearnerProgress(studioId);
      setLearners(progress);
    } catch (error) {
      console.error('Failed to load learner progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-blue-200 animate-pulse">Loading learner progress...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white hover:text-amber-300 mb-6 font-bold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Studio
      </button>

      <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 backdrop-blur-md rounded-2xl p-8 border-3 border-amber-400/60 shadow-2xl mb-6">
        <h1 className="text-4xl font-black text-white mb-3">Learner Progress</h1>
        <p className="text-lg text-white/90">{studioTitle}</p>
      </div>

      {learners.length === 0 ? (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
          <User className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-white font-bold text-lg">No learners enrolled yet</p>
          <p className="text-blue-200 mt-2">Learner progress will appear here once they join</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {learners.map((learner) => (
            <div key={learner.user_id} className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{learner.full_name}</h3>
                  <p className="text-blue-200 text-sm">{learner.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-300">{learner.skills_progress}%</p>
                  <p className="text-blue-200 text-sm">Progress</p>
                </div>
              </div>

              <div className="bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${learner.skills_progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 rounded-xl p-3 border border-amber-400/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-300" />
                    <p className="text-xs text-amber-300 font-bold">Tasks</p>
                  </div>
                  <p className="text-white font-semibold">{learner.completed_tasks}/{learner.total_tasks}</p>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-amber-400/30">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-blue-300" />
                    <p className="text-xs text-blue-300 font-bold">Reflections</p>
                  </div>
                  <p className="text-white font-semibold">{learner.reflections_count}</p>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-amber-400/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-green-300" />
                    <p className="text-xs text-green-300 font-bold">Last Active</p>
                  </div>
                  <p className="text-white font-semibold text-xs">{formatDate(learner.last_activity)}</p>
                </div>
              </div>

              <button
                onClick={() => onViewLearner(learner.user_id)}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 shadow-lg border-2 border-amber-300"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
