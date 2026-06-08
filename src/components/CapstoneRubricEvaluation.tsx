import { useState, useEffect } from 'react';
import { Award, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  getRubricCriteria,
  getCapstoneEvaluations,
  saveEvaluation,
  calculateAndSaveFinalScore,
  getFinalScore,
  getBadgeColor,
  getBadgeIcon
} from '../lib/rubricService';
import type { RubricCriterion, EvaluationWithCriterion, FinalScoreWithEvaluator } from '../types/rubric';

interface CapstoneRubricEvaluationProps {
  capstoneId: string;
  category: string;
  isMentor: boolean;
  onScoreUpdated?: () => void;
}

export function CapstoneRubricEvaluation({
  capstoneId,
  category,
  isMentor,
  onScoreUpdated
}: CapstoneRubricEvaluationProps) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, EvaluationWithCriterion>>(new Map());
  const [finalScore, setFinalScore] = useState<FinalScoreWithEvaluator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluationNotes, setEvaluationNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [capstoneId, category]);

  async function loadData() {
    try {
      setLoading(true);

      const [criteriaData, evaluationsData, scoreData] = await Promise.all([
        getRubricCriteria(category),
        getCapstoneEvaluations(capstoneId),
        getFinalScore(capstoneId)
      ]);

      setCriteria(criteriaData);

      const evalMap = new Map();
      evaluationsData.forEach(e => {
        evalMap.set(e.criterion_id, e);
      });
      setEvaluations(evalMap);

      setFinalScore(scoreData);
      if (scoreData?.evaluation_notes) {
        setEvaluationNotes(scoreData.evaluation_notes);
      }
    } catch (error) {
      console.error('Error loading rubric data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleScoreChange(criterionId: string, score: number, feedback: string) {
    if (!isMentor) return;

    try {
      setSaving(true);
      await saveEvaluation(capstoneId, criterionId, score, feedback);
      await loadData();
      onScoreUpdated?.();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (!isMentor) return;

    const allEvaluated = criteria.every(c => evaluations.has(c.id));
    if (!allEvaluated) {
      alert('Please evaluate all criteria before finalizing');
      return;
    }

    try {
      setSaving(true);
      await calculateAndSaveFinalScore(capstoneId, evaluationNotes);
      await loadData();
      onScoreUpdated?.();
      alert('Final score calculated and saved successfully!');
    } catch (error) {
      console.error('Error finalizing score:', error);
      alert('Failed to finalize score');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading rubric...</div>;
  }

  if (criteria.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No rubric criteria found for this category. Using Universal criteria as fallback.
      </div>
    );
  }

  const progress = (evaluations.size / criteria.length) * 100;

  return (
    <div className="space-y-6">
      {finalScore && (
        <div className={`bg-gradient-to-r ${getBadgeColor(finalScore.badge_level)} p-6 rounded-2xl text-white shadow-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{getBadgeIcon(finalScore.badge_level)}</div>
              <div>
                <h3 className="text-2xl font-bold">{finalScore.badge_level} Badge</h3>
                <p className="text-white/90 text-lg">
                  Score: {finalScore.final_score.toFixed(2)}/4.0 ({finalScore.percentage.toFixed(1)}%)
                </p>
                {finalScore.evaluator && (
                  <p className="text-white/80 text-sm mt-1">
                    Evaluated by {finalScore.evaluator.full_name}
                  </p>
                )}
              </div>
            </div>
            <Award className="w-16 h-16 text-white/30" />
          </div>
          {finalScore.evaluation_notes && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white/90 text-sm">{finalScore.evaluation_notes}</p>
            </div>
          )}
        </div>
      )}

      {!finalScore && isMentor && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-blue-900">Evaluation Progress</h4>
              <div className="mt-2 bg-white rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-blue-700 mt-2">
                {evaluations.size} of {criteria.length} criteria evaluated
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500" />
          Evaluation Criteria
        </h3>

        {criteria.map((criterion) => {
          const evaluation = evaluations.get(criterion.id);

          return (
            <CriterionCard
              key={criterion.id}
              criterion={criterion}
              evaluation={evaluation}
              isMentor={isMentor}
              onSave={(score, feedback) => handleScoreChange(criterion.id, score, feedback)}
              saving={saving}
            />
          );
        })}
      </div>

      {isMentor && (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 space-y-4">
          <label className="block">
            <span className="font-bold text-gray-900 mb-2 block">Overall Evaluation Notes</span>
            <textarea
              value={evaluationNotes}
              onChange={(e) => setEvaluationNotes(e.target.value)}
              placeholder="Provide overall feedback and comments about this capstone project..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
              rows={4}
            />
          </label>

          <button
            onClick={handleFinalize}
            disabled={saving || evaluations.size !== criteria.length}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {finalScore ? 'Update Final Score' : 'Finalize Evaluation'}
          </button>
        </div>
      )}
    </div>
  );
}

interface CriterionCardProps {
  criterion: RubricCriterion;
  evaluation?: EvaluationWithCriterion;
  isMentor: boolean;
  onSave: (score: number, feedback: string) => void;
  saving: boolean;
}

function CriterionCard({ criterion, evaluation, isMentor, onSave, saving }: CriterionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [score, setScore] = useState(evaluation?.score || 0);
  const [feedback, setFeedback] = useState(evaluation?.feedback_text || '');

  const handleSave = async () => {
    if (score < 1 || score > 4) {
      alert('Please select a score between 1 and 4');
      return;
    }
    await onSave(score, feedback);
    setIsEditing(false);
  };

  const scoreLabels = ['', 'Beginning', 'Developing', 'Proficient', 'Exemplary'];
  const scoreColors = ['', 'text-red-600', 'text-orange-600', 'text-blue-600', 'text-green-600'];

  return (
    <div className={`border-2 rounded-xl p-5 transition-all ${
      evaluation ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-lg text-gray-900">{criterion.criterion_name}</h4>
            <span className="text-sm font-semibold text-gray-500">
              (Weight: {(criterion.weight * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{criterion.description}</p>
        </div>
        {evaluation && (
          <div className="ml-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className={`text-xl font-bold ${scoreColors[evaluation.score]}`}>
              {evaluation.score}/4
            </span>
          </div>
        )}
      </div>

      {evaluation && !isEditing && (
        <div className="bg-white border border-green-200 rounded-lg p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-gray-700">Score:</span>
            <span className={`font-bold ${scoreColors[evaluation.score]}`}>
              {scoreLabels[evaluation.score]}
            </span>
          </div>
          {evaluation.feedback_text && (
            <div>
              <span className="font-bold text-gray-700 block mb-1">Feedback:</span>
              <p className="text-gray-600 text-sm leading-relaxed">{evaluation.feedback_text}</p>
            </div>
          )}
        </div>
      )}

      {isMentor && (
        <>
          {isEditing ? (
            <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div>
                <label className="block font-bold text-gray-900 mb-2">Score (1-4)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScore(s)}
                      className={`flex-1 py-3 rounded-lg font-bold transition ${
                        score === s
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                      }`}
                    >
                      {s} - {scoreLabels[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-2">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide specific feedback for this criterion..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setScore(evaluation?.score || 0);
                    setFeedback(evaluation?.feedback_text || '');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              {evaluation ? 'Edit Evaluation' : 'Evaluate This Criterion'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
