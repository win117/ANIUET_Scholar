import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Heart, 
  Share, 
  Plus,
  Search,
  Bookmark,
  Clock,
  Eye,
  TrendingUp,
  Star,
  Filter,
  Send,
  Loader2
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";

interface CommunityPageProps {
  onBack: () => void;
  session: any;
  userProfile: any;
  role: 'student' | 'teacher' | 'professional';
  onMessages?: () => void;
}

export function CommunityPage({ onBack, session, userProfile, role, onMessages }: CommunityPageProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'discussions' | 'leaderboard'>('feed');
  const [searchTerm, setSearchTerm] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [newDiscussionCategory, setNewDiscussionCategory] = useState('General');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isSubmittingDiscussion, setIsSubmittingDiscussion] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Data states
  const [posts, setPosts] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    postsToday: 0,
    activeDiscussions: 0
  });
  const [trendingTopics, setTrendingTopics] = useState([]);

  // Mock leaderboard for now
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Elena Vásquez', xp: 12450, level: 28, role: 'teacher', change: 0 },
    { rank: 2, name: 'Roberto Kim', xp: 11890, level: 26, role: 'professional', change: 1 },
    { rank: 3, name: 'Carmen Silva', xp: 11200, level: 25, role: 'student', change: -1 },
    { rank: 4, name: 'Diego Morales', xp: 10850, level: 24, role: 'teacher', change: 2 },
    { rank: 5, name: 'Sofía Ramírez', xp: 10400, level: 23, role: 'student', change: 0 },
  ]);

  // Load community data on component mount
  useEffect(() => {
    loadCommunityData();
  }, [session]);

  const loadCommunityData = async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      // Load all community data in parallel
      const [postsResponse, discussionsResponse, statsResponse, trendingResponse] = await Promise.all([
        apiHelpers.getCommunityPosts(session.access_token),
        apiHelpers.getCommunityDiscussions(session.access_token),
        apiHelpers.getCommunityStats(session.access_token),
        apiHelpers.getTrendingTopics(session.access_token)
      ]);

      if (postsResponse.success) {
        setPosts(postsResponse.posts);
      }

      if (discussionsResponse.success) {
        setDiscussions(discussionsResponse.discussions);
      }

      if (statsResponse.success) {
        setCommunityStats(statsResponse.stats);
      }

      if (trendingResponse.success) {
        setTrendingTopics(trendingResponse.trending);
      }

    } catch (error) {
      console.error('Error loading community data:', error);
      toast.error('Error cargando datos de la comunidad');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'student': return '#E3701B';
      case 'teacher': return '#4285F4';
      case 'professional': return '#C4423D';
      default: return '#4285F4';
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'student': return 'bg-orange-100 text-orange-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case 'student': return '🎓';
      case 'teacher': return '🧑‍🏫';
      case 'professional': return '👩‍💼';
      default: return '👤';
    }
  };

  const handleLike = async (postId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await apiHelpers.togglePostLike(session.access_token, postId);
      
      if (response.success) {
        // Update local state
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likesCount: response.likesCount,
                isLikedByUser: response.liked
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Error al dar me gusta');
    }
  };

  const handleNewPost = async () => {
    if (!newPostContent.trim() || !session?.access_token) return;

    setIsSubmittingPost(true);
    try {
      const response = await apiHelpers.createCommunityPost(
        session.access_token, 
        newPostContent,
        [], // tags (could be extracted from content or added via UI)
        'post' // type
      );
      
      if (response.success) {
        // Add the new post to the beginning of the list
        setPosts([response.post, ...posts]);
        setNewPostContent('');
        setShowNewPost(false);
        toast.success(`¡Post creado! +${response.xpGained} XP`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Error al crear el post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleNewDiscussion = async () => {
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim() || !session?.access_token) return;

    setIsSubmittingDiscussion(true);
    try {
      const response = await apiHelpers.createDiscussion(
        session.access_token,
        newDiscussionTitle,
        newDiscussionContent,
        newDiscussionCategory
      );
      
      if (response.success) {
        // Add the new discussion to the beginning of the list
        setDiscussions([response.discussion, ...discussions]);
        setNewDiscussionTitle('');
        setNewDiscussionContent('');
        setNewDiscussionCategory('General');
        setShowNewDiscussion(false);
        toast.success(`¡Discusión creada! +${response.xpGained} XP`);
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Error al crear la discusión');
    } finally {
      setIsSubmittingDiscussion(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !session?.access_token) return;

    setIsSubmittingComment(true);
    try {
      const response = await apiHelpers.addCommentToPost(
        session.access_token,
        postId,
        newComment
      );
      
      if (response.success) {
        // Update the post with the new comment
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                comments: [...(post.comments || []), response.comment],
                commentsCount: (post.commentsCount || 0) + 1
              }
            : post
        ));
        setNewComment('');
        setCommentingOnPost(null);
        toast.success(`¡Comentario añadido! +${response.xpGained} XP`);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al añadir comentario');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await apiHelpers.toggleCommentLike(session.access_token, postId, commentId);
      
      if (response.success) {
        // Update local state
        setPosts(posts.map(post => 
          post.id === postId 
            ? {
                ...post,
                comments: post.comments?.map(comment =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        likes: response.liked 
                          ? [...(comment.likes || []), session.user?.id]
                          : (comment.likes || []).filter(id => id !== session.user?.id)
                      }
                    : comment
                )
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast.error('Error al dar me gusta al comentario');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredDiscussions = discussions.filter(discussion =>
    discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative">
      <DynamicBackground variant="dashboard" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <img src={logo} alt="ANIUET Scholar" className="w-8 h-8" />
                <h1 className="text-2xl font-bold" style={{ color: getRoleColor() }}>
                  Comunidad ANIUET
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {onMessages && (
                <Button
                  onClick={onMessages}
                  style={{ backgroundColor: getRoleColor() }}
                  className="text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensajes
                </Button>
              )}
              <Badge style={{ backgroundColor: getRoleColor(), color: 'white' }}>
                {userProfile?.name || 'Usuario'}
              </Badge>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: getRoleColor() }} />
                <p className="text-gray-600">Cargando comunidad...</p>
              </div>
            </div>
          )}

          {!isLoading && (
            <>
          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <Button
              variant={activeTab === 'feed' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('feed')}
              className={activeTab === 'feed' ? 'text-white' : ''}
              style={{ backgroundColor: activeTab === 'feed' ? getRoleColor() : undefined }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Feed
            </Button>
            <Button
              variant={activeTab === 'discussions' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('discussions')}
              className={activeTab === 'discussions' ? 'text-white' : ''}
              style={{ backgroundColor: activeTab === 'discussions' ? getRoleColor() : undefined }}
            >
              <Users className="w-4 h-4 mr-2" />
              Discusiones
            </Button>
            <Button
              variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('leaderboard')}
              className={activeTab === 'leaderboard' ? 'text-white' : ''}
              style={{ backgroundColor: activeTab === 'leaderboard' ? getRoleColor() : undefined }}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Ranking
            </Button>
          </div>

          {/* Feed Tab */}
          {activeTab === 'feed' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Feed */}
              <div className="lg:col-span-2">
                {/* Search and New Post */}
                <div className="space-y-4 mb-6">
                  <div className="flex space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar en la comunidad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      onClick={() => setShowNewPost(!showNewPost)}
                      style={{ backgroundColor: getRoleColor() }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Post
                    </Button>
                  </div>

                  {/* New Post Form */}
                  {showNewPost && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Card className="bg-white/90">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <Textarea
                              placeholder="¿Qué quieres compartir con la comunidad?"
                              value={newPostContent}
                              onChange={(e) => setNewPostContent(e.target.value)}
                              rows={3}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowNewPost(false);
                                  setNewPostContent('');
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleNewPost}
                                style={{ backgroundColor: getRoleColor() }}
                                disabled={!newPostContent.trim() || isSubmittingPost}
                              >
                                {isSubmittingPost ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                {isSubmittingPost ? 'Publicando...' : 'Publicar'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>

                {/* Posts */}
                <div className="space-y-4">
                  {filteredPosts.length === 0 && !isLoading && (
                    <Card className="bg-white/90">
                      <CardContent className="p-8 text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          {searchTerm ? 'No se encontraron posts' : '¡Sé el primero en publicar!'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm 
                            ? `No hay posts que coincidan con "${searchTerm}"`
                            : 'Comparte tus experiencias, preguntas o logros con la comunidad'
                          }
                        </p>
                        {!searchTerm && (
                          <Button
                            onClick={() => setShowNewPost(true)}
                            style={{ backgroundColor: getRoleColor() }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Post
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-white/90 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          {/* Post Header */}
                          <div className="flex items-start space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-lg">
                              {getRoleIcon(post.author.role)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                                <Badge className={getRoleBadgeColor(post.author.role)}>
                                  Nivel {post.author.level}
                                </Badge>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(post.createdAt).toLocaleString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: 'short'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Post Content */}
                          <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

                          {/* Tags */}
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Post Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(post.id)}
                                className={`text-gray-600 hover:text-red-500 ${
                                  post.isLikedByUser ? 'text-red-500' : ''
                                }`}
                              >
                                <Heart className={`w-4 h-4 mr-1 ${post.isLikedByUser ? 'fill-current' : ''}`} />
                                {post.likesCount || 0}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                className="text-gray-600 hover:text-blue-500"
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                {post.commentsCount || 0}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-green-500"
                              >
                                <Share className="w-4 h-4 mr-1" />
                                Compartir
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-yellow-500"
                            >
                              <Bookmark className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Expanded Comments Section */}
                          {expandedPost === post.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-gray-100"
                            >
                              {/* Comments List */}
                              {post.comments && post.comments.length > 0 && (
                                <div className="space-y-3 mb-4">
                                  {post.comments.map((comment) => (
                                    <div key={comment.id} className="flex space-x-3">
                                      <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-sm">
                                        {getRoleIcon(comment.author.role)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-medium text-sm">{comment.author.name}</span>
                                            <Badge className={getRoleBadgeColor(comment.author.role)} variant="secondary">
                                              Nivel {comment.author.level || 1}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                              {new Date(comment.createdAt).toLocaleString('es-ES', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                day: '2-digit',
                                                month: 'short'
                                              })}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700">{comment.content}</p>
                                        </div>
                                        <div className="flex items-center mt-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCommentLike(post.id, comment.id)}
                                            className={`text-xs text-gray-500 hover:text-red-500 ${
                                              comment.likes?.includes(session?.user?.id) ? 'text-red-500' : ''
                                            }`}
                                          >
                                            <Heart className={`w-3 h-3 mr-1 ${
                                              comment.likes?.includes(session?.user?.id) ? 'fill-current' : ''
                                            }`} />
                                            {comment.likes?.length || 0}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add Comment Form */}
                              <div className="flex space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-sm">
                                  {getRoleIcon(role)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex space-x-2">
                                    <Input
                                      placeholder="Escribe un comentario..."
                                      value={commentingOnPost === post.id ? newComment : ''}
                                      onChange={(e) => {
                                        setNewComment(e.target.value);
                                        setCommentingOnPost(post.id);
                                      }}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAddComment(post.id);
                                        }
                                      }}
                                      disabled={isSubmittingComment}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddComment(post.id)}
                                      disabled={!newComment.trim() || isSubmittingComment}
                                      style={{ backgroundColor: getRoleColor() }}
                                    >
                                      {isSubmittingComment ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Send className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Community Stats */}
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" style={{ color: getRoleColor() }} />
                      <span>Estadísticas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Miembros totales</span>
                      <span className="font-semibold">{communityStats.totalMembers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Miembros activos</span>
                      <span className="font-semibold">{communityStats.activeMembers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posts hoy</span>
                      <span className="font-semibold">{communityStats.postsToday || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discusiones activas</span>
                      <span className="font-semibold">{communityStats.activeDiscussions || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Topics */}
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" style={{ color: getRoleColor() }} />
                      <span>Temas Populares</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {trendingTopics.length > 0 ? (
                      trendingTopics.map((topic, index) => (
                        <div key={index} className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            {topic.topic}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">{topic.count}</span>
                            {topic.trend === 'up' && (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Cargando temas populares...</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Discussions Tab */}
          {activeTab === 'discussions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Discusiones Activas</h2>
                <Button 
                  onClick={() => setShowNewDiscussion(!showNewDiscussion)}
                  style={{ backgroundColor: getRoleColor() }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Discusión
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar discusiones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* New Discussion Form */}
              {showNewDiscussion && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="bg-white/90">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <Input
                          placeholder="Título de la discusión"
                          value={newDiscussionTitle}
                          onChange={(e) => setNewDiscussionTitle(e.target.value)}
                        />
                        <select
                          value={newDiscussionCategory}
                          onChange={(e) => setNewDiscussionCategory(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="General">General</option>
                          <option value="IA">Inteligencia Artificial</option>
                          <option value="Machine Learning">Machine Learning</option>
                          <option value="Deep Learning">Deep Learning</option>
                          <option value="Data Science">Data Science</option>
                          <option value="NLP">Procesamiento de Lenguaje Natural</option>
                          <option value="Computer Vision">Visión por Computadora</option>
                          <option value="Ética">Ética en IA</option>
                          <option value="Proyectos">Proyectos</option>
                          <option value="Recursos">Recursos y Tutoriales</option>
                        </select>
                        <Textarea
                          placeholder="Describe tu discusión..."
                          value={newDiscussionContent}
                          onChange={(e) => setNewDiscussionContent(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowNewDiscussion(false);
                              setNewDiscussionTitle('');
                              setNewDiscussionContent('');
                              setNewDiscussionCategory('General');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleNewDiscussion}
                            style={{ backgroundColor: getRoleColor() }}
                            disabled={!newDiscussionTitle.trim() || !newDiscussionContent.trim() || isSubmittingDiscussion}
                          >
                            {isSubmittingDiscussion ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            {isSubmittingDiscussion ? 'Creando...' : 'Crear Discusión'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {filteredDiscussions.length === 0 && !isLoading && (
                <Card className="bg-white/90">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {searchTerm ? 'No se encontraron discusiones' : '¡Inicia una nueva discusión!'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm 
                        ? `No hay discusiones que coincidan con "${searchTerm}"`
                        : 'Las discusiones son una excelente manera de profundizar en temas específicos'
                      }
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setShowNewDiscussion(true)}
                        style={{ backgroundColor: getRoleColor() }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Discusión
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {filteredDiscussions.map((discussion, index) => (
                <motion.div
                  key={discussion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/90 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{discussion.title}</h3>
                            {discussion.isHot && (
                              <Badge variant="destructive" className="bg-red-500">
                                🔥 Hot
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Por {discussion.author?.name || discussion.author}</span>
                            <span>•</span>
                            <span>{discussion.repliesCount || discussion.replies || 0} respuestas</span>
                            <span>•</span>
                            <span>Última actividad: {discussion.lastActivity}</span>
                          </div>
                        </div>
                        <Badge variant="outline">{discussion.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ranking de la Comunidad</h2>
              
              {leaderboard.map((user, index) => (
                <motion.div
                  key={user.rank}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`bg-white/90 hover:shadow-lg transition-all duration-300 ${
                    user.rank <= 3 ? 'border-2 border-yellow-300' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                            user.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                            user.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' :
                            user.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.rank <= 3 && user.rank === 1 && '👑'}
                            {user.rank <= 3 && user.rank === 2 && '🥈'}
                            {user.rank <= 3 && user.rank === 3 && '🥉'}
                            {user.rank > 3 && user.rank}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {getRoleIcon(user.role)} Nivel {user.level}
                              </Badge>
                              {user.change !== 0 && (
                                <span className={`text-sm ${
                                  user.change > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {user.change > 0 ? '↑' : '↓'} {Math.abs(user.change)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: getRoleColor() }}>
                            {user.xp.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">XP total</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}