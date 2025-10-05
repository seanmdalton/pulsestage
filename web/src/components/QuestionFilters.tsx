import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface QuestionFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  search?: string;
  tagId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function QuestionFilters({ onFilterChange, currentFilters }: QuestionFiltersProps) {
  const [search, setSearch] = useState(currentFilters.search || '');
  const [selectedTagId, setSelectedTagId] = useState(currentFilters.tagId || '');
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(currentFilters.dateTo || '');
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Load tags for filter dropdown
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagsData = await apiClient.getTags();
        setTags(tagsData);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  // Update filters when debounced search or other filters change
  useEffect(() => {
    const filters: FilterState = {};
    if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
    if (selectedTagId) filters.tagId = selectedTagId;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    onFilterChange(filters);
  }, [debouncedSearch, selectedTagId, dateFrom, dateTo, onFilterChange]);

  const clearFilters = () => {
    setSearch('');
    setSelectedTagId('');
    setDateFrom('');
    setDateTo('');
  };

  const activeFilterCount = [
    debouncedSearch,
    selectedTagId,
    dateFrom,
    dateTo
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="flex gap-3 items-start">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Tag Filter */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Tag
              </label>
              <select
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {debouncedSearch && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search: "{debouncedSearch}"
              <button
                onClick={() => setSearch('')}
                className="ml-2 hover:text-blue-900 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          )}

          {selectedTagId && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              Tag: {tags.find(t => t.id === selectedTagId)?.name}
              <button
                onClick={() => setSelectedTagId('')}
                className="ml-2 hover:text-purple-900 dark:hover:text-purple-100"
              >
                ×
              </button>
            </span>
          )}

          {dateFrom && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              From: {new Date(dateFrom).toLocaleDateString()}
              <button
                onClick={() => setDateFrom('')}
                className="ml-2 hover:text-green-900 dark:hover:text-green-100"
              >
                ×
              </button>
            </span>
          )}

          {dateTo && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              To: {new Date(dateTo).toLocaleDateString()}
              <button
                onClick={() => setDateTo('')}
                className="ml-2 hover:text-green-900 dark:hover:text-green-100"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

