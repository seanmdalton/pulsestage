import { useState, useEffect } from 'react';
import { apiClient, type Tag } from '../lib/api';

export function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [submitting, setSubmitting] = useState(false);

  // Predefined color palette
  const colorPalette = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Cyan', value: '#06B6D4' },
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getTags();
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.name.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const createdTag = await apiClient.createTag({
        name: newTag.name.trim(),
        color: newTag.color
      });
      setTags([...tags, createdTag]);
      setNewTag({ name: '', color: '#3B82F6' });
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading tags...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tag Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage tags for organizing questions
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Tag</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-300">{error}</div>
        </div>
      )}

      {/* Create Tag Form */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Tag</h3>
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div>
              <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tag Name *
              </label>
              <input
                id="tagName"
                type="text"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="e.g., Important, Urgent, Reviewed"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
                autoComplete="off"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewTag({ ...newTag, color: color.value })}
                    className={`h-10 rounded-md transition-all ${
                      newTag.color === color.value
                        ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800'
                        : 'hover:opacity-80'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    disabled={submitting}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: newTag.color }}
                >
                  {newTag.name || 'Tag Name'}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTag({ name: '', color: '#3B82F6' });
                  setError(null);
                }}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTag.name.trim() || submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Tag'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tags List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {tags.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tags</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new tag
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tags.filter(t => t && typeof t.name === 'string').map((tag) => (
              <div
                key={tag.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Created {new Date(tag.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {tag.color}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium mb-2">About Tags:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Tags help organize and categorize questions</li>
          <li>Moderators and admins can add/remove tags on questions</li>
          <li>Tags are visible to all users</li>
          <li>Common tags: Important, Urgent, Reviewed, Follow-up</li>
        </ul>
      </div>
    </div>
  );
}

