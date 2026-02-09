import { useState } from 'react';
import { galleryService, type PublishArchitectureRequest } from '../../services/gallery.service';
import { showError, showSuccess } from '../../utils/toast';

interface PublishDialogProps {
  architectureId: string;
  currentTitle: string;
  currentDescription?: string;
  isOpen: boolean;
  onClose: () => void;
  onPublished?: () => void;
}

const CATEGORIES = [
  { value: '', label: 'Select a category...' },
  { value: 'e-commerce', label: 'E-Commerce' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'api', label: 'API Backend' },
  { value: 'ml-pipeline', label: 'ML Pipeline' },
  { value: 'real-time', label: 'Real-Time' },
  { value: 'data-processing', label: 'Data Processing' },
];

const COMPLEXITY_LEVELS = [
  { value: '', label: 'Select complexity...' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const PublishDialog = ({
  architectureId,
  currentTitle,
  currentDescription,
  isOpen,
  onClose,
  onPublished,
}: PublishDialogProps) => {
  const [formData, setFormData] = useState<PublishArchitectureRequest>({
    architecture_id: architectureId,
    title: currentTitle || '',
    description: currentDescription || '',
    tags: [],
    category: '',
    complexity: undefined,
  });
  const [tagInput, setTagInput] = useState('');
  const [publishing, setPublishing] = useState(false);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags?.includes(tag) && (formData.tags?.length || 0) < 5) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showError('Title is required');
      return;
    }

    setPublishing(true);
    try {
      await galleryService.publishArchitecture({
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        category: formData.category || undefined,
      });
      showSuccess('Architecture published to gallery!');
      onPublished?.();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to publish:', error);
      const errorResponse = error as { response?: { data?: { error?: string } } };
      if (errorResponse.response?.data?.error?.includes('already published')) {
        showError('This architecture is already published');
      } else {
        showError('Failed to publish architecture');
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#252526] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3e3e3e] flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#cccccc]">
              🚀 Publish to Gallery
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-[#9ca3af] dark:hover:text-[#cccccc]"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 Share your architecture with the community! Your design will be visible to all users in the public gallery.
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
                placeholder="e.g., High-Traffic E-Commerce Platform"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
                rows={4}
                placeholder="Describe your architecture, its use case, and key features..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Complexity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
                Complexity Level
              </label>
              <select
                value={formData.complexity || ''}
                onChange={(e) => setFormData({ ...formData, complexity: e.target.value as 'beginner' | 'intermediate' | 'advanced' | undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
              >
                {COMPLEXITY_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
                Tags (max 5)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
                  placeholder="e.g., microservices, aws, high-availability"
                  disabled={(formData.tags?.length || 0) >= 5}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={(formData.tags?.length || 0) >= 5}
                  className="px-4 py-2 bg-gray-200 dark:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4] rounded-lg hover:bg-gray-300 dark:hover:bg-[#3e3e3e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-primary-900 dark:hover:text-primary-300"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-[#3e3e3e] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={publishing || !formData.title.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? 'Publishing...' : 'Publish to Gallery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
