import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, FileText, MessageSquare, Clock } from 'lucide-react';
import { reflectionService } from '../lib/reflectionService';
import { supabase } from '../lib/supabase';

interface MentorLearnerDetailProps {
  learnerId: string;
  studioId: string;
  onBack: () => void;
}

export function MentorLearnerDetail({ learnerId, studioId, onBack }: MentorLearnerDetailProps) {
  const [learnerData, setLearnerData] = useState<any>(null);
  const [learner, setLearner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    loadLearnerDetails();
  }, [learnerId, studioId]);

  const loadLearnerDetails = async () => {
    try {
      const [details, userInfo] = await Promise.all([
        reflectionService.getLearnerStudioDetails(learnerId, studioId),
        supabase.from('users').select('*').eq('id', learnerId).single(),
      ]);

      setLearnerData(details);
      setLearner(userInfo.data);
    } catch (error) {
      console.error('Failed to load learner details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;

    try {
      setSubmittingFeedback(true);
      console.log('Submitting feedback:', feedback);
      setFeedback('');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-blue-200 animate-pulse">Loading learner details...</div>
      </div>
    );
  }

  if (!learnerData || !learner) {
    return (
      <div className="text-center text-white py-12">
        <p>Failed to load learner details</p>
        <button onClick={onBack} className="mt-4 text-amber-300 hover:underline">
          Go Back
        </button>
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
        Back to Progress
      </button>

      <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 backdrop-blur-md rounded-2xl p-8 border-3 border-amber-400/60 shadow-2xl mb-6">
        <h1 className="text-4xl font-black text-white mb-2">{learner.full_name}</h1>
        <p className="text-lg text-white/90">{learner.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
          <h2 className="text-2xl font-bold text-amber-300 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Completed Tasks
          </h2>
          {learnerData.completions.length === 0 ? (
            <p className="text-blue-200 text-center py-8">No tasks completed yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {learnerData.completions.map((completion: any) => (
                <div key={completion.id} className="bg-white/10 rounded-xl p-3 border border-green-400/30">
                  <p className="text-white font-semibold">{completion.studio_tasks?.title}</p>
                  <p className="text-blue-200 text-xs">
                    Phase {completion.studio_tasks?.studio_phases?.phase_number}: {completion.studio_tasks?.studio_phases?.title}
                  </p>
                  <p className="text-green-300 text-xs mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(completion.completed_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
          <h2 className="text-2xl font-bold text-amber-300 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Deliverable Submissions
          </h2>
          {learnerData.submissions.length === 0 ? (
            <p className="text-blue-200 text-center py-8">No submissions yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {learnerData.submissions.map((submission: any) => (
                <div key={submission.id} className="bg-white/10 rounded-xl p-4 border border-amber-400/30">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-semibold">{submission.studio_deliverables?.title}</p>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      submission.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                      submission.status === 'reviewed' ? 'bg-blue-500/20 text-blue-300' :
                      submission.status === 'submitted' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {submission.status}
                    </span>
                  </div>
                  {submission.submission_url && (
                    <a href={submission.submission_url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline text-sm block mb-1">
                      View Submission
                    </a>
                  )}
                  {submission.submission_text && (
                    <p className="text-blue-200 text-sm mb-2">{submission.submission_text}</p>
                  )}
                  {submission.mentor_feedback && (
                    <div className="bg-green-500/10 border border-green-400/30 rounded p-2 mt-2">
                      <p className="text-green-300 text-xs font-bold mb-1">Your Feedback:</p>
                      <p className="text-blue-100 text-sm">{submission.mentor_feedback}</p>
                    </div>
                  )}
                  <p className="text-gray-400 text-xs mt-2">{formatDate(submission.submitted_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl mb-6">
        <h2 className="text-2xl font-bold text-amber-300 mb-4 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Reflections
        </h2>
        {learnerData.reflections.length === 0 ? (
          <p className="text-blue-200 text-center py-8">No reflections yet</p>
        ) : (
          <div className="space-y-3">
            {learnerData.reflections.map((reflection: any) => (
              <div key={reflection.id} className="bg-white/10 rounded-xl p-4 border border-amber-400/30">
                <p className="text-blue-100 leading-relaxed mb-2">{reflection.content}</p>
                {reflection.rating && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-300 text-sm font-bold">Rating:</span>
                    <span className="text-white">{reflection.rating}/5</span>
                  </div>
                )}
                {reflection.hours_spent > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-300 text-sm font-bold">Hours:</span>
                    <span className="text-white">{reflection.hours_spent}</span>
                  </div>
                )}
                <p className="text-gray-400 text-xs mt-2">{formatDate(reflection.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
        <h2 className="text-2xl font-bold text-amber-300 mb-4">Provide Feedback</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Write your feedback for this learner..."
          className="w-full h-32 px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-amber-400/50 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
        />
        <button
          onClick={handleSubmitFeedback}
          disabled={!feedback.trim() || submittingFeedback}
          className="w-full mt-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 shadow-lg border-2 border-amber-300 disabled:opacity-50"
        >
          {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}
