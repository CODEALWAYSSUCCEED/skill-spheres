import { useState, useEffect } from 'react';
import { BookOpen, Plus, CreditCard as Edit2, Trash2, CheckCircle, X, Calendar, Clock, Star, Award, MapPin } from 'lucide-react';
import Modal from './Modal';
import type { VirtualMentor, MentorJourneyWithMilestone, MentorMilestoneJourneyFormData } from '../types/virtualMentor';
import {
  getMentorJourneys,
  createMentorJourney,
  updateMentorJourney,
  deleteMentorJourney
} from '../lib/virtualMentorService';

interface MentorJourneyManagerProps {
  mentor: VirtualMentor;
  onUpdate?: () => void;
}

const BLANK_FORM: MentorMilestoneJourneyFormData = {
  title: '',
  story: '',
  completion_age: undefined,
  completion_year: undefined,
  lesson_learned: '',
  difficulty_rating: 3,
  time_invested: '',
  resources_used: []
};

export default function MentorJourneyManager({ mentor, onUpdate }: MentorJourneyManagerProps) {
  const [journeys, setJourneys] = useState<MentorJourneyWithMilestone[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingJourney, setEditingJourney] = useState<MentorJourneyWithMilestone | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MentorMilestoneJourneyFormData>(BLANK_FORM);
  const [resourceInput, setResourceInput] = useState('');

  useEffect(() => { loadJourneys(); }, [mentor.id]);

  async function loadJourneys() {
    setJourneys(await getMentorJourneys(mentor.id));
  }

  function openModal(journey?: MentorJourneyWithMilestone) {
    if (journey) {
      setEditingJourney(journey);
      setFormData({
        title: journey.title || '',
        story: journey.story,
        completion_age: journey.completion_age,
        completion_year: journey.completion_year,
        lesson_learned: journey.lesson_learned || '',
        difficulty_rating: journey.difficulty_rating || 3,
        time_invested: journey.time_invested || '',
        resources_used: journey.resources_used || []
      });
    } else {
      setEditingJourney(null);
      setFormData(BLANK_FORM);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingJourney(null);
    setResourceInput('');
  }

  function addResource() {
    if (resourceInput.trim()) {
      setFormData({ ...formData, resources_used: [...(formData.resources_used || []), resourceInput.trim()] });
      setResourceInput('');
    }
  }

  function removeResource(index: number) {
    const updated = [...(formData.resources_used || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, resources_used: updated });
  }

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.story.trim()) return;
    setLoading(true);
    try {
      if (editingJourney) {
        await updateMentorJourney(editingJourney.id, formData);
      } else {
        await createMentorJourney(mentor.id, formData);
      }
      await loadJourneys();
      closeModal();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving journey:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(journeyId: string) {
    if (!confirm('Delete this milestone from the mentor\'s journey?')) return;
    setLoading(true);
    try {
      await deleteMentorJourney(journeyId);
      await loadJourneys();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting journey:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDifficultyColor = (rating: number) => {
    if (rating <= 2) return 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30';
    if (rating <= 3) return 'bg-amber-400/15 text-amber-300 border-amber-400/30';
    return 'bg-red-400/15 text-red-300 border-red-400/30';
  };

  const getDifficultyLabel = (rating: number) => {
    if (rating <= 2) return 'Easy';
    if (rating <= 3) return 'Moderate';
    return 'Challenging';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            {mentor.mentor_name}'s Journey to Mastery
          </h3>
          <p className="text-xs text-blue-300/70 mt-0.5">
            Document the real-world milestones {mentor.mentor_name} achieved on their path
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-blue-900 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      {journeys.length === 0 ? (
        <div className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <BookOpen className="w-10 h-10 text-blue-300/40 mx-auto mb-3" />
          <p className="text-white/70 font-medium mb-1">No journey milestones yet</p>
          <p className="text-sm text-blue-300/50 mb-4">
            Add the real achievements, breakthroughs, and turning points in {mentor.mentor_name}'s life
          </p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-blue-900 rounded-lg transition-colors inline-flex items-center gap-2 font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add First Milestone
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {journeys.map((journey, index) => (
            <div
              key={journey.id}
              className="rounded-xl p-5 border border-amber-400/20 hover:border-amber-400/40 transition-all"
              style={{ background: 'rgba(245,158,11,0.05)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-9 h-9 bg-amber-400 text-blue-900 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base mb-1 leading-snug">
                      {journey.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {journey.completion_age && (
                        <span className="text-xs text-blue-300/70 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Age {journey.completion_age}
                        </span>
                      )}
                      {journey.completion_year && (
                        <span className="text-xs text-blue-300/50">({journey.completion_year})</span>
                      )}
                      {journey.time_invested && (
                        <span className="text-xs text-blue-300/70 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {journey.time_invested}
                        </span>
                      )}
                      {journey.difficulty_rating && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getDifficultyColor(journey.difficulty_rating)}`}>
                          <Star className="w-3 h-3 inline mr-0.5" />
                          {getDifficultyLabel(journey.difficulty_rating)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openModal(journey)}
                    className="p-1.5 text-blue-300/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(journey.id)}
                    className="p-1.5 text-red-400/50 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="ml-12 space-y-2.5">
                <div className="rounded-lg p-3 border border-white/8" style={{ background: 'rgba(255,255,255,0.05)' }}>
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
                  <div className="flex flex-wrap gap-1.5">
                    {journey.resources_used.map((resource, idx) => (
                      <span key={idx} className="text-xs bg-blue-400/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/20">
                        {resource}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingJourney ? 'Update Milestone' : 'Add a Milestone to Their Journey'}
        >
          <div className="space-y-4">
            {/* Free-text milestone title */}
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-1.5 uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>
                Milestone / Achievement *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={`e.g. "Performed at Carnegie Hall", "Published first book", "Won Olympic gold"`}
                className="form-input"
                autoFocus
              />
              <p className="text-xs text-blue-300/50 mt-1">Name a real milestone from {mentor.mentor_name}'s life</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5 uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>
                  Their Age When Achieved
                </label>
                <input
                  type="number"
                  value={formData.completion_age || ''}
                  onChange={(e) => setFormData({ ...formData, completion_age: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Optional"
                  min="1" max="120"
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5 uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>
                  Year This Occurred
                </label>
                <input
                  type="number"
                  value={formData.completion_year || ''}
                  onChange={(e) => setFormData({ ...formData, completion_year: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Optional"
                  min="1800" max={new Date().getFullYear()}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-1.5 uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>
                How They Achieved It *
              </label>
              <textarea
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                placeholder="Tell the story: what did they do, what challenges did they face, and what made their approach unique?"
                rows={5}
                className="form-input resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-1.5 uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>
                Key Lessons & Insights
              </label>
              <textarea
                value={formData.lesson_learned}
                onChange={(e) => setFormData({ ...formData, lesson_learned: e.target.value })}
                placeholder="What wisdom or lesson comes from this milestone?"
                rows={3}
                className="form-input resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5 uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>
                  How Hard Was It
                </label>
                <select
                  value={formData.difficulty_rating || 3}
                  onChange={(e) => setFormData({ ...formData, difficulty_rating: parseInt(e.target.value) })}
                  className="form-input"
                >
                  <option value="1">1: Minimal Challenge</option>
                  <option value="2">2: Some Obstacles</option>
                  <option value="3">3: Moderate Difficulty</option>
                  <option value="4">4: Significant Struggle</option>
                  <option value="5">5: Extreme Adversity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5 uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>
                  Time They Spent
                </label>
                <input
                  type="text"
                  value={formData.time_invested}
                  onChange={(e) => setFormData({ ...formData, time_invested: e.target.value })}
                  placeholder="e.g. 3 months, 2 years"
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-1.5 uppercase tracking-wide" style={{ fontSize: '0.7rem' }}>
                Resources They Used
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={resourceInput}
                  onChange={(e) => setResourceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                  placeholder="Books, coaches, places, experiences..."
                  className="form-input"
                />
                <button
                  onClick={addResource}
                  type="button"
                  className="px-3 py-2 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white rounded-lg transition-colors border border-white/15 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.resources_used && formData.resources_used.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.resources_used.map((resource, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-blue-400/10 text-blue-300 px-2 py-1 rounded-full border border-blue-400/20">
                      {resource}
                      <button onClick={() => removeResource(idx)} className="hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.title.trim() || !formData.story.trim()}
                className="flex-1 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-blue-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Saving...' : editingJourney ? 'Update Milestone' : 'Add to Journey'}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
