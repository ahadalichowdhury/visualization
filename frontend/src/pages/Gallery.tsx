import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { galleryService, type GalleryFilters, type PublicArchitecture } from '../services/gallery.service';
import { showError } from '../utils/toast';

const CATEGORIES = [
  { value: 'e-commerce', label: 'E-Commerce' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'api', label: 'API Backend' },
  { value: 'ml-pipeline', label: 'ML Pipeline' },
  { value: 'real-time', label: 'Real-Time' },
  { value: 'data-processing', label: 'Data Processing' },
];

const COMPLEXITY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-500' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'liked', label: 'Most Liked' },
  { value: 'viewed', label: 'Most Viewed' },
];

export const Gallery = () => {
  const navigate = useNavigate();
  const [architectures, setArchitectures] = useState<PublicArchitecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GalleryFilters>({
    page: 1,
    limit: 12,
    sort_by: 'recent',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      const response = await galleryService.browseGallery(filters);
      setArchitectures(response.architectures);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Failed to load gallery:', error);
      showError('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const handleCategoryFilter = (category: string) => {
    setFilters({ 
      ...filters, 
      category: filters.category === category ? undefined : category,
      page: 1 
    });
  };

  const handleComplexityFilter = (complexity: string) => {
    setFilters({ 
      ...filters, 
      complexity: filters.complexity === complexity ? undefined : complexity,
      page: 1 
    });
  };

  const handleSort = (sortBy: string) => {
    setFilters({ ...filters, sort_by: sortBy as 'recent' | 'popular' | 'liked' | 'viewed', page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e]">
      {/* Header */}
      <div className="bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e3e]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-[#cccccc]">
                🎨 Architecture Gallery
              </h1>
              <p className="text-gray-600 dark:text-[#9ca3af] mt-1">
                Discover, learn, and clone system architectures from the community
              </p>
            </div>
            <button
              onClick={() => navigate('/canvas')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              + Create New
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search architectures..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-4 sticky top-4">
              {/* Sort By */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-2">
                  Sort By
                </h3>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-2">
                  Category
                </h3>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategoryFilter(cat.value)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filters.category === cat.value
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complexity Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-2">
                  Complexity
                </h3>
                <div className="space-y-2">
                  {COMPLEXITY_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => handleComplexityFilter(level.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        filters.complexity === level.value
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4]'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${level.color}`} />
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.category || filters.complexity || filters.search) && (
                <button
                  onClick={() => {
                    setFilters({ page: 1, limit: 12, sort_by: 'recent' });
                    setSearchInput('');
                  }}
                  className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Architecture Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-4 animate-pulse">
                    <div className="h-40 bg-gray-200 dark:bg-[#3e3e3e] rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-[#3e3e3e] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-[#3e3e3e] rounded w-full" />
                  </div>
                ))}
              </div>
            ) : architectures.length === 0 ? (
              <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-[#cccccc] mb-2">
                  No architectures found
                </h3>
                <p className="text-gray-600 dark:text-[#9ca3af] mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={() => {
                    setFilters({ page: 1, limit: 12, sort_by: 'recent' });
                    setSearchInput('');
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {architectures.map(arch => (
                    <ArchitectureCard key={arch.id} architecture={arch} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2d2d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-[#d4d4d4]">
                      Page {filters.page} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2d2d] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Architecture Card Component
const ArchitectureCard = ({ architecture }: { architecture: PublicArchitecture }) => {
  const navigate = useNavigate();

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      onClick={() => navigate(`/gallery/${architecture.id}`)}
      className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
    >
      {/* Thumbnail Placeholder */}
      <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-4xl mb-2">🏗️</div>
            <div className="text-sm font-medium">
              {architecture.node_count} Components
            </div>
          </div>
        </div>
        {architecture.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            ⭐ Featured
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#cccccc] mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
          {architecture.title}
        </h3>

        {/* Description */}
        {architecture.description && (
          <p className="text-sm text-gray-600 dark:text-[#9ca3af] mb-3 line-clamp-2">
            {architecture.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[#9ca3af] mb-3">
          <span className="flex items-center gap-1">
            👁️ {architecture.view_count}
          </span>
          <span className="flex items-center gap-1">
            ❤️ {architecture.like_count}
          </span>
          <span className="flex items-center gap-1">
            📋 {architecture.clone_count}
          </span>
        </div>

        {/* Tags & Complexity */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {architecture.complexity && (
            <span className={`px-2 py-1 rounded-full text-xs text-white font-medium ${getComplexityColor(architecture.complexity)}`}>
              {architecture.complexity}
            </span>
          )}
          {architecture.category && (
            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
              {architecture.category}
            </span>
          )}
        </div>

        {/* Author */}
        {architecture.author && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-[#3e3e3e]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {architecture.author.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-600 dark:text-[#9ca3af]">
              {architecture.author.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
