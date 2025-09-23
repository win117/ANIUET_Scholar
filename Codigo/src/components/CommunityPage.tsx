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
  Send
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface CommunityPageProps {
  onBack: () => void;
  session: any;
  userProfile: any;
  role: 'student' | 'teacher' | 'professional';
}

export function CommunityPage({ onBack, session, userProfile, role }: CommunityPageProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'discussions' | 'leaderboard'>('feed');
  const [searchTerm, setSearchTerm] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);

  // Mock data - in a real app this would come from the backend
  const [posts, setPosts] = useState([
    {
      id: '1',
      author: {
        name: 'María González',
        role: 'student',
        level: 8,
        avatar: '👩‍🎓'
      },
      content: '¡Acabo de completar mi primer proyecto de IA! Fue increíble ver cómo el modelo pudo clasificar imágenes con 94% de precisión. ¿Alguien más ha trabajado con CNN?',
      timestamp: '2 horas',
      likes: 15,
      comments: 4,
      tags: ['IA', 'CNN', 'Proyecto'],
      type: 'achievement'
    },
    {
      id: '2',
      author: {
        name: 'Dr. Carlos Ruiz',
        role: 'teacher',
        level: 25,
        avatar: '👨‍🏫'
      },
      content: 'Nuevo tutorial disponible: "Optimización de hiperparámetros en modelos de ML". Incluye ejemplos prácticos y mejores prácticas. ¡Espero que les sea útil!',
      timestamp: '5 horas',
      likes: 42,
      comments: 12,
      tags: ['Tutorial', 'ML', 'Optimización'],
      type: 'resource'
    },
    {
      id: '3',
      author: {
        name: 'Ana Torres',
        role: 'professional',
        level: 15,
        avatar: '👩‍💼'
      },
      content: '¿Recomendaciones para implementar IA en el sector financiero? Mi empresa está considerando automatizar el análisis de riesgo crediticio.',
      timestamp: '1 día',
      likes: 8,
      comments: 6,
      tags: ['Finanzas', 'Implementación', 'Pregunta'],
      type: 'question'
    }
  ]);

  const [discussions, setDiscussions] = useState([
    {
      id: '1',
      title: 'Mejores prácticas para el preprocesamiento de datos',
      author: 'Luis Mendoza',
      replies: 23,
      lastActivity: '3 min',
      category: 'Data Science',
      isHot: true
    },
    {
      id: '2',
      title: '¿Cuál es el futuro de GPT y los modelos de lenguaje?',
      author: 'Sandra López',
      replies: 45,
      lastActivity: '1 hora',
      category: 'NLP',
      isHot: true
    },
    {
      id: '3',
      title: 'Compartiendo mi experiencia con transfer learning',
      author: 'Miguel Ángel',
      replies: 12,
      lastActivity: '2 horas',
      category: 'Deep Learning',
      isHot: false
    }
  ]);

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Elena Vásquez', xp: 12450, level: 28, role: 'teacher', change: 0 },
    { rank: 2, name: 'Roberto Kim', xp: 11890, level: 26, role: 'professional', change: 1 },
    { rank: 3, name: 'Carmen Silva', xp: 11200, level: 25, role: 'student', change: -1 },
    { rank: 4, name: 'Diego Morales', xp: 10850, level: 24, role: 'teacher', change: 2 },
    { rank: 5, name: 'Sofía Ramírez', xp: 10400, level: 23, role: 'student', change: 0 },
  ]);

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

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  const handleNewPost = () => {
    if (newPostContent.trim()) {
      const newPost = {
        id: (posts.length + 1).toString(),
        author: {
          name: userProfile?.name || 'Usuario',
          role,
          level: userProfile?.level || 1,
          avatar: getRoleIcon(role)
        },
        content: newPostContent,
        timestamp: 'ahora',
        likes: 0,
        comments: 0,
        tags: [],
        type: 'post'
      };
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setShowNewPost(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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
              <Badge style={{ backgroundColor: getRoleColor(), color: 'white' }}>
                {userProfile?.name || 'Usuario'}
              </Badge>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
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
                                disabled={!newPostContent.trim()}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Publicar
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
                              {post.author.avatar}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                                <Badge className={getRoleBadgeColor(post.author.role)}>
                                  Nivel {post.author.level}
                                </Badge>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{post.timestamp}</span>
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
                                className="text-gray-600 hover:text-red-500"
                              >
                                <Heart className="w-4 h-4 mr-1" />
                                {post.likes}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-blue-500"
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                {post.comments}
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
                      <span className="text-gray-600">Miembros activos</span>
                      <span className="font-semibold">2,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posts hoy</span>
                      <span className="font-semibold">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discusiones activas</span>
                      <span className="font-semibold">89</span>
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
                    {['#MachineLearning', '#IA', '#DataScience', '#DeepLearning', '#NLP'].map((topic, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-2 cursor-pointer hover:bg-gray-100">
                        {topic}
                      </Badge>
                    ))}
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
                <Button style={{ backgroundColor: getRoleColor() }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Discusión
                </Button>
              </div>

              {discussions.map((discussion, index) => (
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
                            <span>Por {discussion.author}</span>
                            <span>•</span>
                            <span>{discussion.replies} respuestas</span>
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
        </div>
      </div>
    </div>
  );
}