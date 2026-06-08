import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Share2, Lock, Upload, Link as LinkIcon, Video as VideoIcon, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { videoReflectionService } from '../lib/videoReflectionService';
import type { VideoReflection, VideoReflectionWithUser, VideoKind } from '../types/resource';
import Modal from './Modal';

interface VideoReflectionsProps {
  skillId: string;
  studioId?: string;
}

export default function VideoReflections({ skillId, studioId }: VideoReflectionsProps) {
  const { user } = useAuth();
  const [myReflections, setMyReflections] = useState<VideoReflection[]>([]);
  const [sharedReflections, setSharedReflections] = useState<VideoReflectionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReflection, setEditingReflection] = useState<VideoReflection | null>(null);
  const [activeView, setActiveView] = useState<'my' | 'shared'>('my');

  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    video_kind: 'link' as VideoKind,
    external_url: '',
    visibility: 'private' as 'private' | 'shared',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [urlError, setUrlError] = useState('');
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    if (user) {
      loadReflections();
    }
  }, [user, skillId]);

  const loadReflections = async () => {
    if (!user) return;

    try {
      const [myData, sharedData] = await Promise.all([
        videoReflectionService.getUserReflectionsForSkill(user.id, skillId),
        videoReflectionService.getSharedReflectionsForSkill(skillId),
      ]);

      setMyReflections(myData);
      setSharedReflections(sharedData);
    } catch (error: any) {
      console.error('Error loading reflections:', error);
      showToastMessage('Failed to load video reflections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('URL is required');
      return false;
    }

    if (!videoReflectionService.isValidUrl(url)) {
      setUrlError('Please enter a valid URL');
      return false;
    }

    setUrlError('');
    return true;
  };

  const validateFile = (file: File | null): boolean => {
    if (!file) {
      setFileError('Please select a video file');
      return false;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('Video size must be less than 100MB');
      return false;
    }

    const allowedExtensions = ['.mp4', '.mov', '.webm'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setFileError('Video type not allowed. Allowed: MP4, MOV, WEBM');
      return false;
    }

    setFileError('');
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) return;

    if (!formData.title.trim()) {
      showToastMessage('Title is required', 'error');
      return;
    }

    if (formData.video_kind === 'link') {
      if (!validateUrl(formData.external_url)) return;
    } else {
      if (!editingReflection && !validateFile(selectedFile)) return;
    }

    setUploading(true);

    try {
      let videoData = null;

      if (formData.video_kind === 'upload' && selectedFile && !editingReflection) {
        videoData = await videoReflectionService.uploadVideo(user.id, selectedFile);
      }

      const reflectionData = {
        skill_id: skillId,
        studio_id: studioId || null,
        title: formData.title,
        notes: formData.notes,
        video_kind: formData.video_kind,
        external_url: formData.video_kind === 'link' ? formData.external_url : null,
        video_url: videoData?.url || editingReflection?.video_url || null,
        file_name: videoData?.name || editingReflection?.file_name || null,
        file_type: videoData?.type || editingReflection?.file_type || null,
        file_size: videoData?.size || editingReflection?.file_size || null,
        visibility: formData.visibility,
      };

      if (editingReflection) {
        await videoReflectionService.updateReflection(editingReflection.id, {
          title: formData.title,
          notes: formData.notes,
          visibility: formData.visibility,
        });
        showToastMessage('Video reflection updated', 'success');
      } else {
        await videoReflectionService.createReflection(user.id, reflectionData);
        showToastMessage('Video reflection saved', 'success');
      }

      resetForm();
      await loadReflections();
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to save video reflection', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (reflection: VideoReflection) => {
    setEditingReflection(reflection);
    setFormData({
      title: reflection.title,
      notes: reflection.notes,
      video_kind: reflection.video_kind,
      external_url: reflection.external_url || '',
      visibility: reflection.visibility,
    });
    setShowModal(true);
  };

  const handleDelete = async (reflection: VideoReflection) => {
    if (!window.confirm('Are you sure you want to delete this video reflection?')) return;

    try {
      await videoReflectionService.deleteReflection(reflection.id, reflection.video_url);
      showToastMessage('Video reflection deleted', 'success');
      await loadReflections();
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to delete video reflection', 'error');
    }
  };

  const handleToggleVisibility = async (reflection: VideoReflection) => {
    try {
      await videoReflectionService.toggleVisibility(reflection.id, reflection.visibility);
      const action = reflection.visibility === 'private' ? 'shared to community' : 'made private';
      showToastMessage(`Video reflection ${action}`, 'success');
      await loadReflections();
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to update visibility', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      notes: '',
      video_kind: 'link',
      external_url: '',
      visibility: 'private',
    });
    setSelectedFile(null);
    setUrlError('');
    setFileError('');
    setEditingReflection(null);
    setShowModal(false);
  };

  const renderVideoPlayer = (reflection: VideoReflection | VideoReflectionWithUser) => {
    if (reflection.video_kind === 'link' && reflection.external_url) {
      const embedUrl = videoReflectionService.getEmbedUrl(reflection.external_url);

      if (embedUrl) {
        return (
          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      } else {
        return (
          <div className="aspect-video w-full bg-blue-800/50 rounded-xl flex items-center justify-center">
            <a
              href={reflection.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-amber-300 hover:text-amber-200"
            >
              <Play className="w-12 h-12" />
              <span className="font-bold">Watch Video</span>
            </a>
          </div>
        );
      }
    } else if (reflection.video_kind === 'upload' && reflection.video_url) {
      return (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
          <video
            controls
            className="w-full h-full"
            src={videoReflectionService.getVideoUrl(reflection.video_url) as any}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-blue-200">Loading video reflections...</div>
      </div>
    );
  }

  const ReflectionCard = ({ reflection, isOwner }: { reflection: VideoReflection | VideoReflectionWithUser; isOwner: boolean }) => (
    <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-6 border-3 border-amber-400/60 shadow-xl">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex-1">{reflection.title}</h3>
        {isOwner && (
          <button
            onClick={() => handleToggleVisibility(reflection as VideoReflection)}
            className={`p-2 rounded-lg transition-all ${
              reflection.visibility === 'shared'
                ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
            }`}
            title={reflection.visibility === 'shared' ? 'Make Private' : 'Share to Community'}
          >
            {reflection.visibility === 'shared' ? <Share2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </button>
        )}
      </div>

      <div className="mb-4">
        {renderVideoPlayer(reflection)}
      </div>

      {reflection.notes && (
        <p className="text-blue-200 text-sm mb-3">{reflection.notes}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-amber-400/30">
        <div className="text-sm">
          {!isOwner && 'users' in reflection && reflection.users && (
            <div className="text-amber-300 font-semibold mb-1">
              {reflection.users.full_name}
            </div>
          )}
          <div className="text-blue-300 text-xs">
            {new Date(reflection.created_at).toLocaleDateString()}
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(reflection as VideoReflection)}
              className="text-blue-300 hover:text-white transition-colors p-2"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(reflection as VideoReflection)}
              className="text-red-400 hover:text-red-300 transition-colors p-2"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl ${
          toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-bold`}>
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('my')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeView === 'my'
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            My Video Reflections
          </button>
          <button
            onClick={() => setActiveView('shared')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeView === 'shared'
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            Shared Video Reflections
          </button>
        </div>

        {activeView === 'my' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Video Reflection
          </button>
        )}
      </div>

      {activeView === 'my' ? (
        myReflections.length === 0 ? (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
            <p className="text-blue-200 text-lg">You haven't added any video reflections yet.</p>
            <p className="text-blue-300 text-sm mt-2">Share your learning experiences through video!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myReflections.map((reflection) => (
              <ReflectionCard key={reflection.id} reflection={reflection} isOwner={true} />
            ))}
          </div>
        )
      ) : (
        sharedReflections.length === 0 ? (
          <div className="bg-blue-900/60 backdrop-blur-md rounded-2xl p-12 border-3 border-amber-400/60 shadow-xl text-center">
            <p className="text-blue-200 text-lg">No shared video reflections for this skill yet.</p>
            <p className="text-blue-300 text-sm mt-2">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sharedReflections.map((reflection) => (
              <ReflectionCard key={reflection.id} reflection={reflection} isOwner={false} />
            ))}
          </div>
        )
      )}

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingReflection ? 'Edit Video Reflection' : 'Add Video Reflection'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                  placeholder="e.g., My Experience Learning React"
                  required
                />
              </div>

              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Notes / Description</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white placeholder-blue-300/50"
                  placeholder="Share your thoughts, what you learned, challenges faced..."
                  rows={4}
                />
              </div>

              {!editingReflection && (
                <div>
                  <label className="block text-blue-200 text-sm font-semibold mb-2">Video Input Type</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, video_kind: 'link' });
                        setSelectedFile(null);
                        setFileError('');
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.video_kind === 'link'
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5" />
                      Video Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, video_kind: 'upload' });
                        setUrlError('');
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.video_kind === 'upload'
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      <Upload className="w-5 h-5" />
                      Upload Video
                    </button>
                  </div>
                </div>
              )}

              {formData.video_kind === 'link' ? (
                <div>
                  <label className="block text-blue-200 text-sm font-semibold mb-2">
                    Video URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.external_url}
                    onChange={(e) => {
                      setFormData({ ...formData, external_url: e.target.value });
                      if (urlError) validateUrl(e.target.value);
                    }}
                    onBlur={(e) => validateUrl(e.target.value)}
                    className={`w-full bg-white/10 border rounded-xl p-3 text-white placeholder-blue-300/50 ${
                      urlError ? 'border-red-400' : 'border-amber-400/30'
                    }`}
                    placeholder="YouTube, Vimeo, or Loom URL"
                    required
                  />
                  {urlError && <p className="text-red-400 text-sm mt-1">{urlError}</p>}
                  <p className="text-blue-300 text-xs mt-1">
                    Supports YouTube, Vimeo, and Loom videos
                  </p>
                </div>
              ) : (
                !editingReflection && (
                  <div>
                    <label className="block text-blue-200 text-sm font-semibold mb-2">
                      Video File <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        if (file) validateFile(file);
                      }}
                      className="w-full bg-white/10 border border-amber-400/30 rounded-xl p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                      accept=".mp4,.mov,.webm"
                    />
                    <p className="text-blue-300 text-xs mt-1">
                      Allowed: MP4, MOV, WEBM (Max 100MB)
                    </p>
                    {fileError && <p className="text-red-400 text-sm mt-1">{fileError}</p>}
                  </div>
                )
              )}

              <div>
                <label className="flex items-center gap-2 text-blue-200 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.visibility === 'shared'}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.checked ? 'shared' : 'private' })}
                    className="w-4 h-4"
                  />
                  Share to Community
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-700 transition-all disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Saving...' : editingReflection ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
