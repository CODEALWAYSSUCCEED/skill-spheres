import { useState, useEffect } from 'react';
import { Star, Heart, BookOpen, Users, User, Lightbulb, Award, CreditCard as Edit2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';
import {
  getSkillVirtualMentors,
  createVirtualMentor,
  updateVirtualMentor,
  deleteVirtualMentor
} from '../lib/virtualMentorService';
import type { VirtualMentor, VirtualMentorFormData, MentorType } from '../types/virtualMentor';
import { MENTOR_TYPE_LABELS, MENTOR_TYPE_DESCRIPTIONS } from '../types/virtualMentor';

import MentorJourneyManager from './MentorJourneyManager';

interface VirtualMentorSelectorProps {
  skillId: string;
  skillName: string;
}

const MENTOR_TYPE_ICONS: Record<MentorType, typeof Star> = {
  historic_figure: BookOpen,
  deity: Star,
  concept: Lightbulb,
  philosophy: BookOpen,
  friend: Users,
  relative: Heart,
  expert: Award,
  other: User
};

export default function VirtualMentorSelector({ skillId, skillName }: VirtualMentorSelectorProps) {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<VirtualMentor[]>([]);
  const [expandedMentorId, setExpandedMentorId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState<VirtualMentor | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VirtualMentorFormData>({
    mentor_name: '',
    mentor_type: 'expert',
    mentor_description: '',
    mentor_quote: ''
  });

  useEffect(() => {
    if (user) {
      loadMentors();
    }
  }, [user, skillId]);

  async function loadMentors() {
    if (!user) return;
    const data = await getSkillVirtualMentors(user.id, skillId);
    setMentors(data);
    if (data.length === 1) {
      setExpandedMentorId(data[0].id);
    }
  }

  function openModal(mentor?: VirtualMentor) {
    setEditingMentor(mentor || null);
    if (mentor) {
      setFormData({
        mentor_name: mentor.mentor_name,
        mentor_type: mentor.mentor_type,
        mentor_description: mentor.mentor_description,
        mentor_quote: mentor.mentor_quote || ''
      });
    } else {
      setFormData({
        mentor_name: '',
        mentor_type: 'expert',
        mentor_description: '',
        mentor_quote: ''
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingMentor(null);
    setFormData({
      mentor_name: '',
      mentor_type: 'expert',
      mentor_description: '',
      mentor_quote: ''
    });
  }

  async function handleSubmit() {
    if (!user || !formData.mentor_name.trim() || !formData.mentor_description.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (editingMentor) {
        await updateVirtualMentor(editingMentor.id, formData);
      } else {
        const newMentor = await createVirtualMentor(user.id, skillId, formData);
        if (newMentor) {
          setExpandedMentorId(newMentor.id);
        }
      }
      await loadMentors();
      closeModal();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(mentorId: string) {
    if (!confirm('Are you sure you want to delete this mentor? All associated journey entries will be lost.')) {
      return;
    }

    const success = await deleteVirtualMentor(mentorId);
    if (success) {
      await loadMentors();
      if (expandedMentorId === mentorId) {
        setExpandedMentorId(null);
      }
    }
  }

  function toggleMentor(mentorId: string) {
    setExpandedMentorId(expandedMentorId === mentorId ? null : mentorId);
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/50 rounded-xl p-6 border border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold text-white">Virtual Mentors</h3>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">
              Learn from the journey of mentors who mastered <span className="font-semibold text-amber-300">{skillName}</span>.
              Add multiple mentors and document their milestone achievements, challenges, and lessons learned.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-blue-900 rounded-lg transition-colors font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Mentor
          </button>
        </div>

        {mentors.length === 0 ? (
          <div className="bg-white/5 rounded-lg p-8 text-center border border-dashed border-white/20">
            <Star className="w-12 h-12 text-amber-400/50 mx-auto mb-3" />
            <p className="text-blue-200 mb-4">
              No virtual mentors yet. Add a mentor to start documenting their learning journey.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mentors.map((mentor) => {
              const Icon = MENTOR_TYPE_ICONS[mentor.mentor_type];
              const isExpanded = expandedMentorId === mentor.id;

              return (
                <div key={mentor.id} className="bg-white/8 rounded-lg border border-white/15 overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleMentor(mentor.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-lg">{mentor.mentor_name}</h4>
                          <p className="text-sm text-amber-300 font-medium mb-1">
                            {MENTOR_TYPE_LABELS[mentor.mentor_type]}
                          </p>
                          {!isExpanded && (
                            <p className="text-sm text-blue-200 line-clamp-2">
                              {mentor.mentor_description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(mentor);
                          }}
                          className="p-2 text-white/50 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(mentor.id);
                          }}
                          className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-white/40" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white/40" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/10 p-6 space-y-6 bg-white/3">
                      <div>
                        <h5 className="font-semibold text-white mb-2">About</h5>
                        <p className="text-blue-200 leading-relaxed">{mentor.mentor_description}</p>
                      </div>

                      {mentor.mentor_quote && (
                        <div className="bg-white/5 rounded-lg p-4 border-l-4 border-amber-400">
                          <p className="text-blue-100 italic">"{mentor.mentor_quote}"</p>
                        </div>
                      )}

                      <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <MentorJourneyManager
                          mentor={mentor}
                          onUpdate={loadMentors}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingMentor ? 'Edit Virtual Mentor' : 'Add Virtual Mentor'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">
                Mentor Name *
              </label>
              <input
                type="text"
                value={formData.mentor_name}
                onChange={(e) => setFormData({ ...formData, mentor_name: e.target.value })}
                placeholder="e.g., Marie Curie, My Grandmother, Dr. Smith"
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">
                Mentor Type *
              </label>
              <select
                value={formData.mentor_type}
                onChange={(e) => setFormData({ ...formData, mentor_type: e.target.value as MentorType })}
                className="form-input"
              >
                {Object.entries(MENTOR_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-300/70 mt-1">
                {MENTOR_TYPE_DESCRIPTIONS[formData.mentor_type]}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">
                Description *
              </label>
              <textarea
                value={formData.mentor_description}
                onChange={(e) => setFormData({ ...formData, mentor_description: e.target.value })}
                placeholder="Describe who this mentor is and why they inspire you..."
                rows={4}
                className="form-input resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-200 mb-2">
                Inspirational Quote (Optional)
              </label>
              <textarea
                value={formData.mentor_quote}
                onChange={(e) => setFormData({ ...formData, mentor_quote: e.target.value })}
                placeholder="A memorable quote from or about this mentor..."
                rows={2}
                className="form-input resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.mentor_name.trim() || !formData.mentor_description.trim()}
                className="flex-1 px-4 py-2 bg-amber-500 text-blue-900 rounded-lg hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
              >
                {loading ? 'Saving...' : (editingMentor ? 'Update Mentor' : 'Add Mentor')}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
