import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, FileText, Link as LinkIcon, Upload, Eye, EyeOff, Save, MessageSquare, Star, Award, CheckSquare, Square, Paperclip, X as XIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { capstoneService } from '../lib/capstoneService';
import { useAuth } from '../contexts/AuthContext';
import { CapstoneRubricEvaluation } from './CapstoneRubricEvaluation';
import Modal from './Modal';
import { getRubricCriteria } from '../lib/rubricService';
import type { CapstoneProject, CapstoneFeedback } from '../types/capstone';
import type { RubricCriterion } from '../types/rubric';

interface UniversalCapstoneProps {
  skillId: string;
  skillTitle: string;
  skillCategory?: string;
}

type DeliverableType = 'file' | 'link' | 'text';
type VisibilityType = 'private' | 'mentor' | 'studio' | 'public';

const VISIBILITY_OPTIONS: { value: VisibilityType; label: string; description: string }[] = [
  { value: 'private', label: 'Private', description: 'Only you can see this. You can change visibility later.' },
  { value: 'mentor', label: 'Mentor Review (Recommended)', description: 'Any 317 Solutions mentor can view and grade your capstone. You will receive written feedback and a badge (Platinum / Gold / Silver / Bronze) once reviewed.' },
  { value: 'studio', label: 'Studio Members', description: 'Visible to members of any studio you are enrolled in, plus mentors.' },
  { value: 'public', label: 'Public Portfolio', description: 'Visible to everyone. Great for showcasing your work to future employers or collaborators.' },
];

export default function UniversalCapstone({ skillId, skillTitle, skillCategory }: UniversalCapstoneProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capstone, setCapstone] = useState<CapstoneProject | null>(null);
  const [feedback, setFeedback] = useState<CapstoneFeedback[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    problem_statement: '',
    context_summary: '',
    implementation_summary: '',
    deliverable_type: 'text' as DeliverableType,
    deliverable_url: '',
    reflection_text: '',
    visibility: 'mentor' as VisibilityType,
  });

  useEffect(() => {
    loadCapstone();
    loadRubric();
  }, [skillId, user?.id]);

  const loadRubric = async () => {
    try {
      const criteria = await getRubricCriteria(skillCategory || 'Universal');
      setRubricCriteria(criteria);

      const savedChecks = localStorage.getItem(`capstone-checklist-${skillId}`);
      if (savedChecks) {
        setCheckedCriteria(JSON.parse(savedChecks));
      }
    } catch (error) {
      console.error('Error loading rubric:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem(`capstone-checklist-${skillId}`, JSON.stringify(checkedCriteria));
  }, [checkedCriteria, skillId]);

  const loadCapstone = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await capstoneService.getUserCapstoneForSkill(skillId, user.id);

      if (data) {
        setCapstone(data);
        setFormData({
          title: data.title || '',
          problem_statement: data.problem_statement || '',
          context_summary: data.context_summary || '',
          implementation_summary: data.implementation_summary || '',
          deliverable_type: (data.deliverable_type as DeliverableType) || 'text',
          deliverable_url: data.deliverable_url || '',
          reflection_text: data.reflection_text || '',
          visibility: (data.visibility as VisibilityType) || 'mentor',
        });

        const fullData = await capstoneService.getProjectById(data.id);
        if (fullData?.feedback) {
          setFeedback(fullData.feedback as CapstoneFeedback[]);
        }
      }
    } catch (error) {
      console.error('Error loading capstone:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setUploadError('');

      let deliverableUrl = formData.deliverable_url;

      if (selectedFile && formData.deliverable_type === 'file') {
        setUploadProgress(10);
        const uploadedUrl = await uploadCapstoneFile();
        if (uploadedUrl) {
          deliverableUrl = uploadedUrl;
          updateField('deliverable_url', uploadedUrl);
          setSelectedFile(null);
        }
        setUploadProgress(100);
      }

      const saved = await capstoneService.saveDraft(user.id, skillId, {
        ...formData,
        deliverable_url: deliverableUrl,
      });
      setCapstone(saved);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error: any) {
      console.error('Error saving draft:', error);
      setUploadError(error.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const submitCapstone = async () => {
    if (!capstone?.id) {
      await saveDraft();
      return;
    }

    try {
      setSaving(true);
      await capstoneService.submitForReview(capstone.id);
      await loadCapstone();
      alert('Capstone submitted successfully!');
    } catch (error) {
      console.error('Error submitting capstone:', error);
      alert('Failed to submit capstone. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 50MB');
      return;
    }
    setUploadError('');
    setSelectedFile(file);
    updateField('deliverable_url', '');
  };

  const uploadCapstoneFile = async (): Promise<string | null> => {
    if (!selectedFile || !user?.id) return null;

    const timestamp = Date.now();
    const fileName = `${timestamp}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${user.id}/${skillId}/${fileName}`;

    const { error } = await supabase.storage
      .from('capstone-uploads')
      .upload(filePath, selectedFile);

    if (error) throw new Error('File upload failed: ' + error.message);

    const { data } = supabase.storage.from('capstone-uploads').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-white/10 text-white/60 border border-white/20', label: 'Draft' },
      submitted: { color: 'bg-blue-500/20 text-blue-300 border border-blue-400/40', label: 'Submitted' },
      approved: { color: 'bg-green-500/20 text-green-300 border border-green-400/40', label: 'Approved' },
      revision_requested: { color: 'bg-amber-500/20 text-amber-300 border border-amber-400/40', label: 'Needs Revision' },
    };

    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'private' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />;
  };

  const steps = [
    { number: 1, title: 'Project Overview', icon: FileText },
    { number: 2, title: 'Context & Research', icon: FileText },
    { number: 3, title: 'Implementation', icon: FileText },
    { number: 4, title: 'Deliverable', icon: Upload },
    { number: 5, title: 'Reflection', icon: CheckCircle },
  ];

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return formData.title.trim().length > 0 && formData.problem_statement.trim().length > 0;
      case 2:
        return formData.context_summary.trim().length > 0;
      case 3:
        return formData.implementation_summary.trim().length > 0;
      case 4:
        return formData.deliverable_url.trim().length > 0 || formData.deliverable_type === 'text';
      case 5:
        return formData.reflection_text.trim().length > 0;
      default:
        return false;
    }
  };

  const canSubmit = () => {
    return steps.every(step => isStepComplete(step.number));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-blue-200 animate-pulse">Loading capstone project...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500/20 border border-green-400/40 text-green-200 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50 backdrop-blur-sm">
          <Save className="w-5 h-5 text-green-400" />
          <span className="font-semibold">Draft saved successfully!</span>
        </div>
      )}

      <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl border border-white/10 mb-6 p-6">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">
              Capstone Project: {skillTitle}
            </h2>
            <p className="text-blue-200 text-sm">
              Demonstrate your mastery by completing a comprehensive capstone project
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRubricModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-amber-400/50 text-amber-300 rounded-xl hover:bg-amber-400/10 transition-colors font-semibold text-sm"
            >
              <Award className="w-4 h-4" />
              View Rubric
            </button>
            {capstone && getStatusBadge(capstone.status)}
          </div>
        </div>

        {/* Step navigator */}
        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => setCurrentStep(step.number)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all w-full text-left ${
                  currentStep === step.number
                    ? 'bg-blue-500/25 text-blue-200 border border-blue-400/50'
                    : isStepComplete(step.number)
                    ? 'bg-green-500/15 text-green-300 border border-green-400/30'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {isStepComplete(step.number) ? (
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <step.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span className="text-xs font-semibold truncate">{step.title}</span>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className="w-2 h-px bg-white/15 flex-shrink-0 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Quality checklist */}
        {(!capstone || capstone.status === 'draft') && rubricCriteria.length > 0 && (
          <div className="border border-amber-400/30 bg-amber-400/8 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Award className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-300 mb-1">Quality Checklist</h3>
                <p className="text-sm text-amber-200/70">
                  Check off criteria as you complete them to ensure a strong submission.
                </p>
              </div>
              <button
                onClick={() => setShowRubricModal(true)}
                className="text-amber-400 hover:text-amber-300 text-xs font-semibold whitespace-nowrap underline"
              >
                View Full Rubric
              </button>
            </div>

            <div className="space-y-2">
              {rubricCriteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className={`bg-white/5 border rounded-lg p-3 hover:bg-white/8 transition-all cursor-pointer ${
                    checkedCriteria[criterion.id] ? 'border-green-400/30' : 'border-white/10'
                  }`}
                  onClick={() => {
                    setCheckedCriteria(prev => ({
                      ...prev,
                      [criterion.id]: !prev[criterion.id]
                    }));
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {checkedCriteria[criterion.id] ? (
                        <CheckSquare className="w-4 h-4 text-green-400" />
                      ) : (
                        <Square className="w-4 h-4 text-white/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-white text-sm">
                          {criterion.criterion_name}
                        </h4>
                        <span className="text-xs font-medium text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-full">
                          {(criterion.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-blue-200/60 leading-relaxed">
                        {criterion.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-amber-200/70 text-xs">
                  {Object.values(checkedCriteria).filter(Boolean).length} of {rubricCriteria.length} criteria checked
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-28 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-300"
                      style={{
                        width: `${(Object.values(checkedCriteria).filter(Boolean).length / rubricCriteria.length) * 100}%`
                      }}
                    />
                  </div>
                  {Object.values(checkedCriteria).filter(Boolean).length === rubricCriteria.length && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
              {Object.values(checkedCriteria).filter(Boolean).length === rubricCriteria.length && (
                <div className="bg-green-500/10 border border-green-400/25 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-200">
                    <span className="font-semibold">All criteria addressed.</span> Review your work once more, then submit when ready.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="border-t border-white/10 pt-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Give your capstone project a compelling title"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5">
                  Problem Statement *
                </label>
                <textarea
                  value={formData.problem_statement}
                  onChange={(e) => updateField('problem_statement', e.target.value)}
                  placeholder="What problem are you solving? Why is it important? Who does it impact?"
                  rows={6}
                  className="form-input resize-none"
                />
                <p className="text-xs text-blue-300/50 mt-1">
                  Clearly articulate the challenge or opportunity you're addressing
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5">
                  Context & Research *
                </label>
                <textarea
                  value={formData.context_summary}
                  onChange={(e) => updateField('context_summary', e.target.value)}
                  placeholder="Describe your research process, existing solutions you explored, and the background context that informed your approach..."
                  rows={10}
                  className="form-input resize-none"
                />
                <p className="text-xs text-blue-300/50 mt-1">
                  Share your research findings, domain knowledge, and the context that shaped your project
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5">
                  Implementation & Approach *
                </label>
                <textarea
                  value={formData.implementation_summary}
                  onChange={(e) => updateField('implementation_summary', e.target.value)}
                  placeholder="Describe your solution approach, methods used, key decisions made, challenges overcome, and the final outcome..."
                  rows={10}
                  className="form-input resize-none"
                />
                <p className="text-xs text-blue-300/50 mt-1">
                  Explain your implementation process, methodology, and how you brought your solution to life
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">
                  Deliverable Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'link', icon: LinkIcon, label: 'Link' },
                    { value: 'file', icon: Upload, label: 'File Upload' },
                    { value: 'text', icon: FileText, label: 'Text Only' },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => updateField('deliverable_type', value)}
                      className={`p-4 border rounded-xl transition-all text-center ${
                        formData.deliverable_type === value
                          ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/25 hover:bg-white/8'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-2" />
                      <div className="text-xs font-semibold">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.deliverable_type === 'link' && (
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-1.5">Project URL *</label>
                  <input
                    type="url"
                    value={formData.deliverable_url}
                    onChange={(e) => updateField('deliverable_url', e.target.value)}
                    placeholder="https://github.com/username/project or https://your-demo.com"
                    className="form-input"
                  />
                  <p className="text-xs text-blue-300/50 mt-1">Share a link to your project (GitHub, live demo, presentation, etc.)</p>
                </div>
              )}

              {formData.deliverable_type === 'file' && (
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-1.5">Upload File *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.webp,.txt"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/15 border border-blue-400/30 rounded-xl">
                      <Paperclip className="w-5 h-5 text-blue-300 flex-shrink-0" />
                      <span className="flex-1 text-sm text-blue-200 font-medium truncate">{selectedFile.name}</span>
                      <span className="text-xs text-blue-300/60">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-white/40 hover:text-red-400 transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : formData.deliverable_url ? (
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-400/25 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-green-200 font-medium">File uploaded</span>
                      <button
                        type="button"
                        onClick={() => { updateField('deliverable_url', ''); }}
                        className="text-green-400/60 hover:text-red-400 transition-colors text-xs font-semibold"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-white/20 rounded-xl p-8 text-center hover:border-amber-400/50 hover:bg-amber-400/5 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-white/25 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-white/60">Click to select a file</p>
                      <p className="text-xs text-white/30 mt-1">PDF, DOC, DOCX, PPT, PPTX, ZIP, PNG, JPG (max 50MB)</p>
                    </button>
                  )}
                  {uploadError && <p className="text-sm text-red-400 mt-1">{uploadError}</p>}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  <p className="text-xs text-blue-300/40 mt-2">File will be uploaded securely when you save your draft.</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5">
                  Learning Reflection *
                </label>
                <textarea
                  value={formData.reflection_text}
                  onChange={(e) => updateField('reflection_text', e.target.value)}
                  placeholder="Reflect on what you learned through this project... What skills did you develop? What challenges did you overcome? How has this changed your understanding of the topic? What would you do differently next time?"
                  rows={10}
                  className="form-input resize-none"
                />
                <p className="text-xs text-blue-300/50 mt-1">
                  Share your growth journey and key takeaways from this capstone experience
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">
                  Privacy Settings
                </label>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                        formData.visibility === option.value
                          ? 'border-amber-400/50 bg-amber-400/8'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={formData.visibility === option.value}
                        onChange={(e) => updateField('visibility', e.target.value)}
                        className="mt-1 accent-amber-400"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-semibold text-white text-sm">
                          {getVisibilityIcon(option.value)}
                          {option.label}
                        </div>
                        <div className="text-xs text-blue-200/60 mt-1 leading-relaxed">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="border-t border-white/10 mt-6 pt-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 border border-white/15 text-white/60 hover:text-white hover:border-white/30 rounded-xl transition-colors text-sm font-semibold"
              >
                Previous
              </button>
            )}
            {currentStep < steps.length && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 bg-white/8 text-white/70 hover:bg-white/15 hover:text-white rounded-xl transition-colors text-sm font-semibold"
              >
                Next
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveDraft}
              disabled={saving || capstone?.status === 'approved'}
              className="px-4 py-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            {capstone?.status !== 'approved' && (
              <button
                onClick={submitCapstone}
                disabled={!canSubmit() || saving || capstone?.status === 'submitted'}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-blue-900 font-black rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-lg shadow-amber-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                {capstone?.status === 'submitted' ? 'Submitted' : 'Submit for Review'}
              </button>
            )}
          </div>
        </div>

        {!canSubmit() && (
          <div className="mt-4 p-4 bg-amber-400/8 border border-amber-400/25 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-semibold mb-0.5">Complete all sections to submit</p>
              <p className="text-amber-200/70">Fill out all required fields in each step before submitting your capstone for review.</p>
            </div>
          </div>
        )}

        {capstone?.status === 'submitted' && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-400/25 rounded-xl flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-0.5">Capstone submitted for review</p>
              <p className="text-blue-200/70">A 317 Solutions mentor will review your capstone and provide written feedback with a score. You will see your evaluation results and badge level here once the review is complete. Reviews typically take 3-5 business days.</p>
            </div>
          </div>
        )}
      </div>

      {capstone && (capstone.status === 'submitted' || capstone.status === 'approved') && (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-6">
          <h3 className="text-xl font-black text-white mb-6">Evaluation & Grading</h3>
          <CapstoneRubricEvaluation
            capstoneId={capstone.id}
            category={skillCategory || 'Universal'}
            isMentor={profile?.role === 'mentor'}
            onScoreUpdated={loadCapstone}
          />
        </div>
      )}

      {feedback.length > 0 && (
        <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-black text-white">Mentor Feedback</h3>
          </div>
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="border border-white/10 rounded-xl p-4 bg-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-400/15 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Mentor</p>
                      <p className="text-xs text-blue-300/50">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {item.rating && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">{item.feedback_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRubricModal && (
        <Modal isOpen={showRubricModal} onClose={() => setShowRubricModal(false)} title="Evaluation Rubric">
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-400/25 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-base mb-2">How Your Capstone Will Be Evaluated</h4>
                  <p className="text-blue-200 text-sm leading-relaxed mb-3">
                    Your capstone will be evaluated using the criteria below. Each criterion has a weight that contributes to your final score.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h5 className="font-bold text-white text-sm mb-2">Badge Levels</h5>
                    <div className="space-y-1.5 text-sm">
                      {[
                        { emoji: '💎', label: 'Platinum', color: 'text-cyan-300', range: '3.75 – 4.0 (Exceptional)' },
                        { emoji: '🥇', label: 'Gold', color: 'text-amber-300', range: '3.25 – 3.74 (Excellent)' },
                        { emoji: '🥈', label: 'Silver', color: 'text-blue-200', range: '2.75 – 3.24 (Proficient)' },
                        { emoji: '🥉', label: 'Bronze', color: 'text-orange-300', range: '2.25 – 2.74 (Competent)' },
                        { emoji: '📝', label: 'Revision Required', color: 'text-red-300', range: 'Below 2.25' },
                      ].map(({ emoji, label, color, range }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span>{emoji}</span>
                          <span className={`font-semibold ${color}`}>{label}:</span>
                          <span className="text-blue-200/70">{range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                Evaluation Criteria
              </h4>
              {rubricCriteria.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-blue-200 text-sm">Loading evaluation criteria...</p>
                </div>
              ) : (
                rubricCriteria.map((criterion, index) => (
                  <div key={criterion.id} className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-white/5 p-5 border-b border-white/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-amber-400/20 text-amber-300 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="font-black text-white">{criterion.criterion_name}</h5>
                            <p className="text-blue-200/70 text-sm leading-relaxed mt-1">{criterion.description}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-300 bg-amber-400/15 px-2.5 py-1 rounded-full border border-amber-400/30 flex-shrink-0">
                          {(criterion.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2 bg-blue-950/30">
                      <p className="text-xs text-blue-300/40 font-bold uppercase tracking-wide mb-2">Scoring Guide:</p>
                      {[
                        { score: 4, color: 'border-green-400/30 bg-green-500/8', titleColor: 'text-green-300', title: 'Exemplary: Exceeds Expectations', body: 'Outstanding work that goes beyond requirements. Shows exceptional depth, creativity, and mastery.' },
                        { score: 3, color: 'border-blue-400/30 bg-blue-500/8', titleColor: 'text-blue-300', title: 'Proficient: Meets Expectations', body: 'Solid work that meets all requirements. Shows clear understanding and competent execution.' },
                        { score: 2, color: 'border-amber-400/30 bg-amber-500/8', titleColor: 'text-amber-300', title: 'Developing: Approaching Expectations', body: 'Basic work that meets some requirements. Shows emerging understanding but needs further development.' },
                        { score: 1, color: 'border-red-400/30 bg-red-500/8', titleColor: 'text-red-300', title: 'Beginning: Below Expectations', body: 'Incomplete or inadequate work. Does not meet basic requirements. Requires significant revision.' },
                      ].map(({ score, color, titleColor, title, body }) => (
                        <div key={score} className={`border ${color} rounded-lg p-3 flex items-start gap-3`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${titleColor} bg-white/10`}>
                            {score}
                          </div>
                          <div>
                            <div className={`font-bold text-sm ${titleColor}`}>{title}</div>
                            <p className="text-xs text-blue-200/60 leading-relaxed mt-0.5">{body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Tips for Success
                </h4>
                <div className="space-y-2.5">
                  {[
                    { n: 1, text: 'Check each criterion carefully as you work. Use the checklist to ensure you address all requirements.' },
                    { n: 2, text: 'Aim for Proficient or higher on each criterion. Creativity and depth will help you achieve higher scores.' },
                    { n: 3, text: 'Document your process thoroughly. Show your thinking, research, and learning journey. Mentors value seeing your growth.' },
                    { n: 4, text: 'Review before submitting. Read through your entire capstone with fresh eyes before finalizing.' },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-3 bg-white/3 rounded-lg p-3">
                      <div className="w-5 h-5 bg-amber-400/15 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-amber-300 font-black text-xs">{n}</span>
                      </div>
                      <p className="text-blue-200/80 text-sm leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
