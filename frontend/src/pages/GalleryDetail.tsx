import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { galleryService, type GalleryComment, type PublicArchitectureDetail } from '../services/gallery.service';
import { useAuthStore } from '../store/authStore';
import { showError, showSuccess } from '../utils/toast';

export const GalleryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [architecture, setArchitecture] = useState<PublicArchitectureDetail | null>(null);
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadArchitecture = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await galleryService.getPublicArchitecture(id);
      setArchitecture(data);
    } catch (error) {
      console.error('Failed to load architecture:', error);
      showError('Failed to load architecture');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      const response = await galleryService.getComments(id);
      setComments(response.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadArchitecture();
      loadComments();
    }
  }, [id, loadArchitecture, loadComments]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      showError('Please sign in to like architectures');
      return;
    }
    if (!id) return;

    try {
      const result = await galleryService.likeArchitecture(id);
      setArchitecture(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          is_liked_by_user: result.liked,
          like_count: prev.like_count + (result.liked ? 1 : -1),
        };
      });
    } catch (error) {
      console.error('Failed to like:', error);
      showError('Failed to like architecture');
    }
  };

  const handleClone = async () => {
    if (!isAuthenticated) {
      showError('Please sign in to clone architectures');
      return;
    }
    if (!id) return;

    setCloning(true);
    try {
      await galleryService.cloneArchitecture(id);
      showSuccess('Architecture cloned successfully!');
      navigate('/canvas');
    } catch (error) {
      console.error('Failed to clone:', error);
      showError('Failed to clone architecture');
    } finally {
      setCloning(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      showError('Please sign in to comment');
      return;
    }
    if (!id || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await galleryService.addComment(id, commentText.trim());
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      setArchitecture(prev => {
        if (!prev) return prev;
        return { ...prev, comment_count: prev.comment_count + 1 };
      });
      showSuccess('Comment added!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      showError('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-500 text-white';
      case 'intermediate': return 'bg-yellow-500 text-white';
      case 'advanced': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-[#9ca3af]">Loading architecture...</p>
        </div>
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#cccccc] mb-2">
            Architecture not found
          </h2>
          <button
            onClick={() => navigate('/gallery')}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  // Fullscreen mode - show only canvas
  if (isFullscreen && architecture?.canvas_data) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <ReactFlow
          nodes={architecture.canvas_data.nodes}
          edges={architecture.canvas_data.edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#4a5568" />
          <Controls showInteractive={false} />
          <MiniMap 
            nodeColor={() => '#3b82f6'} 
            maskColor="rgba(0, 0, 0, 0.6)"
          />
        </ReactFlow>
        {/* Exit Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 z-10"
        >
          <span>✕</span>
          <span>Exit Fullscreen (ESC)</span>
        </button>
        {/* Architecture Title Overlay */}
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg z-10">
          <h2 className="font-semibold text-gray-900 dark:text-white">{architecture.title}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e]">
      {/* Header */}
      <div className="bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e3e] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/gallery')}
              className="flex items-center gap-2 text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-[#cccccc]"
            >
              ← Back to Gallery
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                disabled={!isAuthenticated}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  architecture.is_liked_by_user
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-200 dark:hover:bg-[#3e3e3e]'
                }`}
              >
                {architecture.is_liked_by_user ? '❤️' : '🤍'} {architecture.like_count}
              </button>
              <button
                onClick={handleClone}
                disabled={!isAuthenticated || cloning}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cloning ? 'Cloning...' : '📋 Clone to Workspace'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Canvas Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] overflow-hidden">
              {/* Architecture Info */}
              <div className="p-6 border-b border-gray-200 dark:border-[#3e3e3e]">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-[#cccccc] mb-3">
                  {architecture.title}
                </h1>
                
                {architecture.description && (
                  <p className="text-gray-600 dark:text-[#9ca3af] mb-4">
                    {architecture.description}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {architecture.complexity && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplexityColor(architecture.complexity)}`}>
                      {architecture.complexity}
                    </span>
                  )}
                  {architecture.category && (
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                      {architecture.category}
                    </span>
                  )}
                  {architecture.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4]">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-6 mt-4 text-sm text-gray-500 dark:text-[#9ca3af]">
                  <span className="flex items-center gap-1">
                    👁️ {architecture.view_count} views
                  </span>
                  <span className="flex items-center gap-1">
                    📋 {architecture.clone_count} clones
                  </span>
                  <span className="flex items-center gap-1">
                    💬 {architecture.comment_count} comments
                  </span>
                </div>
              </div>

              {/* Canvas Preview */}
              <div className="h-[500px] bg-gray-50 dark:bg-[#1e1e1e] relative">
                {architecture.canvas_data && (
                  <>
                    <ReactFlow
                      nodes={architecture.canvas_data.nodes}
                      edges={architecture.canvas_data.edges}
                      fitView
                      attributionPosition="bottom-right"
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable={false}
                    >
                      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                      <Controls showInteractive={false} />
                      <MiniMap nodeColor={() => '#3b82f6'} />
                    </ReactFlow>

                    {/* Fullscreen Button - placed after ReactFlow for better layering */}
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="absolute top-4 right-4 px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 z-[100] border border-gray-200 dark:border-gray-700"
                      title="Enter Fullscreen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span className="text-sm font-medium">Fullscreen</span>
                    </button>
                  </>
                )}
              </div>

              {/* Architecture Stats */}
              <div className="p-6 border-t border-gray-200 dark:border-[#3e3e3e]">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#cccccc] mb-3">
                  Architecture Composition
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {architecture.node_count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-[#9ca3af]">
                      Components
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {architecture.edge_count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-[#9ca3af]">
                      Connections
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6 bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#cccccc] mb-4">
                Comments ({comments.length})
              </h3>

              {/* Add Comment */}
              {isAuthenticated ? (
                <div className="mb-6">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submittingComment}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg text-center">
                  <p className="text-gray-600 dark:text-[#9ca3af]">
                    Please sign in to comment
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-[#9ca3af] py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="border-b border-gray-200 dark:border-[#3e3e3e] pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {comment.author?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-[#cccccc]">
                              {comment.author?.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-[#9ca3af]">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-[#d4d4d4]">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Author & Metadata */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#cccccc] mb-4">
                Created By
              </h3>
              
              {architecture.author && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                    {architecture.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-[#cccccc]">
                      {architecture.author.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-[#9ca3af]">
                      {architecture.author.email}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-[#3e3e3e]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-[#9ca3af]">Published</span>
                  <span className="font-medium text-gray-900 dark:text-[#cccccc]">
                    {new Date(architecture.published_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-[#9ca3af]">Last Updated</span>
                  <span className="font-medium text-gray-900 dark:text-[#cccccc]">
                    {new Date(architecture.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {architecture.is_featured && (
                <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
                    ⭐ Featured Architecture
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
