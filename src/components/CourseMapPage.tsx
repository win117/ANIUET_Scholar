import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast, Toaster } from "sonner@2.0.3";
import { 
  ArrowLeft, 
  BookOpen, 
  Code, 
  Puzzle, 
  Trophy, 
  Star, 
  CheckCircle, 
  Lock,
  Play,
  Award,
  Target,
  Zap,
  Brain,
  Users,
  FileText,
  Video,
  Download,
  Crown
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface CourseMapPageProps {
  course: any;
  userRole: 'student' | 'teacher' | 'professional' | null;
  onBack: () => void;
  onLessonSelect?: (courseId: string, lessonId: string) => void;
  session?: any;
}

interface Node {
  id: string;
  title: string;
  type: 'reading' | 'practice' | 'project' | 'quiz' | 'checkpoint';
  status: 'completed' | 'current' | 'locked';
  position: { x: number; y: number };
  connections: string[];
  xpReward: number;
  estimatedTime: string;
  description: string;
  prerequisites?: string[];
}

const courseNodes: Record<string, Node[]> = {
  'intro-ai': [
    {
      id: 'welcome',
      title: '¡Bienvenido a la IA!',
      type: 'reading',
      status: 'completed',
      position: { x: 50, y: 90 },
      connections: ['basics'],
      xpReward: 50,
      estimatedTime: '10 min',
      description: 'Introducción al fascinante mundo de la inteligencia artificial'
    },
    {
      id: 'basics',
      title: 'Conceptos Básicos',
      type: 'reading',
      status: 'current',
      position: { x: 20, y: 70 },
      connections: ['history', 'types'],
      xpReward: 100,
      estimatedTime: '20 min',
      description: 'Fundamentos esenciales que todo principiante debe conocer'
    },
    {
      id: 'history',
      title: 'Historia de la IA',
      type: 'reading',
      status: 'locked',
      position: { x: 10, y: 50 },
      connections: ['quiz1'],
      xpReward: 75,
      estimatedTime: '15 min',
      description: 'Desde Turing hasta las redes neuronales modernas',
      prerequisites: ['basics']
    },
    {
      id: 'types',
      title: 'Tipos de IA',
      type: 'reading',
      status: 'current',
      position: { x: 40, y: 50 },
      connections: ['quiz1'],
      xpReward: 100,
      estimatedTime: '25 min',
      description: 'IA débil, fuerte, machine learning y deep learning'
    },
    {
      id: 'quiz1',
      title: 'Evaluación: Fundamentos',
      type: 'quiz',
      status: 'locked',
      position: { x: 25, y: 30 },
      connections: ['applications'],
      xpReward: 150,
      estimatedTime: '10 min',
      description: 'Pon a prueba tus conocimientos básicos',
      prerequisites: ['history', 'types']
    },
    {
      id: 'applications',
      title: 'Aplicaciones Reales',
      type: 'project',
      status: 'locked',
      position: { x: 60, y: 30 },
      connections: ['practice1'],
      xpReward: 200,
      estimatedTime: '45 min',
      description: 'Explora casos de uso en diferentes industrias'
    },
    {
      id: 'practice1',
      title: 'Práctica: Reconocimiento',
      type: 'practice',
      status: 'locked',
      position: { x: 80, y: 20 },
      connections: ['final-project'],
      xpReward: 250,
      estimatedTime: '60 min',
      description: 'Construye tu primer modelo de reconocimiento'
    },
    {
      id: 'final-project',
      title: 'Proyecto Final',
      type: 'project',
      status: 'locked',
      position: { x: 90, y: 10 },
      connections: [],
      xpReward: 500,
      estimatedTime: '120 min',
      description: 'Crea una aplicación completa de IA'
    }
  ],
  'audio-detection': [
    {
      id: 'setup',
      title: 'Configuración Rápida',
      type: 'practice',
      status: 'completed',
      position: { x: 10, y: 80 },
      connections: ['preprocessing'],
      xpReward: 100,
      estimatedTime: '15 min',
      description: 'Instala las herramientas necesarias en tiempo récord'
    },
    {
      id: 'preprocessing',
      title: 'Preprocesamiento de Audio',
      type: 'practice',
      status: 'current',
      position: { x: 35, y: 60 },
      connections: ['model-selection'],
      xpReward: 200,
      estimatedTime: '30 min',
      description: 'Transforma el audio en datos útiles para IA'
    },
    {
      id: 'model-selection',
      title: 'Selección del Modelo',
      type: 'reading',
      status: 'locked',
      position: { x: 60, y: 40 },
      connections: ['implementation'],
      xpReward: 150,
      estimatedTime: '20 min',
      description: 'Elige la arquitectura perfecta para tu caso'
    },
    {
      id: 'implementation',
      title: 'Implementación Completa',
      type: 'practice',
      status: 'locked',
      position: { x: 80, y: 20 },
      connections: ['deployment'],
      xpReward: 300,
      estimatedTime: '45 min',
      description: 'Codifica el modelo de detección step-by-step'
    },
    {
      id: 'deployment',
      title: 'Deploy y Pruebas',
      type: 'project',
      status: 'locked',
      position: { x: 90, y: 10 },
      connections: [],
      xpReward: 400,
      estimatedTime: '30 min',
      description: 'Pon tu modelo en producción'
    }
  ]
};

export function CourseMapPage({ course, userRole, onBack, onLessonSelect, session }: CourseMapPageProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [userProgress, setUserProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(true);

  // Calculate node statuses dynamically based on user progress
  const calculateNodeStatus = (node: any, index: number, completedLessons: string[]) => {
    // Check if lesson is completed (handle both node.id and mapped lesson IDs)
    const lessonMappings: { [key: string]: string } = {
      'basics': 'intro-1',
      'history': 'history-1'
    };
    
    const actualLessonId = lessonMappings[node.id] || node.id;
    const isCompleted = completedLessons.includes(actualLessonId) || 
                       completedLessons.some((l: any) => 
                         typeof l === 'object' ? l.lessonId === actualLessonId : l === actualLessonId
                       );
    
    if (isCompleted) {
      return 'completed';
    }
    
    // First node is always available for enrolled users
    if (index === 0) {
      return 'current';
    }
    
    // Check if prerequisites are met
    if (node.prerequisites) {
      const prereqsMet = node.prerequisites.every((prereq: string) => {
        const prereqLessonId = lessonMappings[prereq] || prereq;
        return completedLessons.includes(prereqLessonId) ||
               completedLessons.some((l: any) => 
                 typeof l === 'object' ? l.lessonId === prereqLessonId : l === prereqLessonId
               );
      });
      return prereqsMet ? 'current' : 'locked';
    }
    
    // For sequential courses, unlock next node if previous is completed
    if (index > 0) {
      const prevNode = courseNodes[course.id]?.[index - 1] || 
                      (course.lessons && course.lessons[index - 1]);
      if (prevNode) {
        const prevLessonId = lessonMappings[prevNode.id] || prevNode.id;
        const isPrevCompleted = completedLessons.includes(prevLessonId) ||
                               completedLessons.some((l: any) => 
                                 typeof l === 'object' ? l.lessonId === prevLessonId : l === prevLessonId
                               );
        if (isPrevCompleted) {
          return 'current';
        }
      }
    }
    
    return 'locked';
  };

  // Use course lessons if available, otherwise fall back to predefined nodes
  const baseNodes = course.lessons ? course.lessons.map((lesson: any, index: number) => ({
    id: lesson.id,
    title: lesson.title,
    type: lesson.type || 'reading',
    status: 'locked', // Will be calculated below
    position: { 
      x: 20 + (index % 3) * 30, 
      y: 80 - Math.floor(index / 3) * 20 
    },
    connections: index < course.lessons.length - 1 ? [course.lessons[index + 1].id] : [],
    xpReward: lesson.xp || 50,
    estimatedTime: '15 min',
    description: lesson.title,
    prerequisites: index > 0 ? [course.lessons[index - 1].id] : undefined
  })) : courseNodes[course.id] || courseNodes['intro-ai'];

  // Apply dynamic status calculation
  const nodes = baseNodes.map((node, index) => {
    const status = calculateNodeStatus(node, index, Array.from(completedNodes));
    return {
      ...node,
      status
    };
  });

  // Debug logging
  useEffect(() => {
    console.log('=== COURSE MAP DEBUG ===');
    console.log('Course ID:', course.id);
    console.log('Completed Nodes:', Array.from(completedNodes));
    console.log('Node States:', nodes.map(n => ({ id: n.id, title: n.title, status: n.status })));
    console.log('User Progress:', userProgress);
  }, [nodes, completedNodes, userProgress]);

  useEffect(() => {
    loadUserProfile();
    loadCourseProgress();
  }, [course.id, session]);

  const loadUserProfile = async () => {
    if (!session?.access_token) return;

    try {
      const result = await apiHelpers.getUserProfile(session.access_token);
      if (result.success && result.data) {
        setUserProfile(result.data);
        
        // Check tier access
        const requiredTier = course.requiredTier || 'free';
        const currentTier = result.data.subscription_tier || 'free';
        const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
        const access = tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
        setHasAccess(access);
        
        if (!access) {
          toast.error(`Este curso requiere suscripción ${requiredTier.toUpperCase()}`, {
            description: 'Actualiza tu plan para acceder a este contenido'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Reload progress when component becomes visible again (user returns from lesson)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📍 Página visible nuevamente, recargando progreso...');
        loadCourseProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadCourseProgress = async () => {
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    try {
      const userCoursesData = await apiHelpers.getUserCourses(session.access_token);
      const enrollment = userCoursesData.enrollments?.find((e: any) => e.courseId === course.id);
      
      if (enrollment) {
        setUserProgress(enrollment);
        
        // Extract lesson IDs from completedLessons (handle both string and object formats)
        const completedLessonIds = (enrollment.completedLessons || []).map((lesson: any) => 
          typeof lesson === 'string' ? lesson : lesson.lessonId
        );
        
        console.log('📊 Lecciones completadas cargadas:', completedLessonIds);
        setCompletedNodes(new Set(completedLessonIds));
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'reading': return BookOpen;
      case 'practice': return Code;
      case 'project': return Puzzle;
      case 'quiz': return Brain;
      case 'checkpoint': return Trophy;
      default: return BookOpen;
    }
  };

  const getNodeColor = (type: string, status: string) => {
    if (status === 'completed') return '#10B981';
    if (status === 'locked') return '#9CA3AF';
    
    switch (type) {
      case 'reading': return '#4285F4';
      case 'practice': return '#E3701B';
      case 'project': return '#C4423D';
      case 'quiz': return '#8B5CF6';
      case 'checkpoint': return '#F59E0B';
      default: return '#4285F4';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'reading': return '📖 Lectura';
      case 'practice': return '💻 Práctica';
      case 'project': return '🧩 Proyecto';
      case 'quiz': return '🧠 Evaluación';
      case 'checkpoint': return '🏆 Checkpoint';
      default: return type;
    }
  };

  const calculateProgress = () => {
    const completedCount = nodes.filter(node => completedNodes.has(node.id)).length;
    return Math.round((completedCount / nodes.length) * 100);
  };

  const totalXP = nodes.reduce((sum, node) => {
    return completedNodes.has(node.id) ? sum + node.xpReward : sum;
  }, 0);

  const handleNodeClick = (node: Node) => {
    if (node.status === 'current' || node.status === 'completed') {
      setSelectedNode(node);
    } else if (node.status === 'locked') {
      toast.info(`${node.title} estará disponible cuando completes los prerequisitos`);
    }
  };

  const handleStartNode = async (node: Node) => {
    if (!session?.access_token) {
      toast.error('Necesitas iniciar sesión para acceder al contenido');
      return;
    }

    // For reading lessons, navigate to lesson reader
    if (node.type === 'reading' && onLessonSelect) {
      // Map internal node IDs to actual lesson IDs
      let lessonId = node.id;
      if (course.id === 'intro-ai') {
        // Map the node IDs to the actual lesson IDs
        if (node.id === 'basics') {
          lessonId = 'intro-1';
        } else if (node.id === 'history') {
          lessonId = 'history-1';
        }
      }
      
      setSelectedNode(null);
      onLessonSelect(course.id, lessonId);
      return;
    }

    // For other types, simulate completion for now
    try {
      // Update progress in backend
      await apiHelpers.updateCourseProgress(
        session.access_token, 
        course.id, 
        node.id, 
        node.xpReward
      );

      // Update local state
      setCompletedNodes(prev => new Set([...prev, node.id]));
      setSelectedNode(null);
      
      toast.success(`¡Has completado: ${node.title}! +${node.xpReward} XP`);
      
      // Reload progress
      loadCourseProgress();
      
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Error al actualizar el progreso');
    }
  };

  const isImpressiveTitle = course.id === 'audio-detection' || course.type === 'crash-course';

  const getTierBadge = () => {
    const requiredTier = course.requiredTier || 'free';
    switch (requiredTier) {
      case 'free':
        return <Badge className="bg-gray-500">GRATIS</Badge>;
      case 'pro':
        return <Badge className="bg-[#E3701B]">PRO</Badge>;
      case 'enterprise':
        return <Badge className="bg-[#4285F4]">ENTERPRISE</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-600">ENTERPRISE</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      <DynamicBackground variant="course-map" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b p-4 relative z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logo} alt="ANIUET Scholar" className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: course.color }}>
                  {course.title}
                </h1>
                {getTierBadge()}
              </div>
              <p className="text-gray-600">{course.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isImpressiveTitle && (
              <Badge className="bg-red-100 text-red-800 border-red-300">
                ⚡ CRASH COURSE - {course.estimatedTime}
              </Badge>
            )}
            <Badge variant="secondary">
              {calculateProgress()}% Completado
            </Badge>
            <div className="text-right">
              <div className="text-sm text-gray-600">XP Ganado</div>
              <div className="font-bold text-lg text-yellow-600">{totalXP}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white/80 backdrop-blur-sm px-6 py-3 border-b relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Progress value={calculateProgress()} className="h-3 bg-gray-200">
                <div 
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${calculateProgress()}%`,
                    background: `linear-gradient(90deg, ${course.color}, ${course.color}80)`
                  }}
                />
              </Progress>
            </div>
            <span className="font-medium">{calculateProgress()}%</span>
          </div>
        </div>
      </div>

      {/* Course Map */}
      <main className="relative p-6">
        <div className="max-w-7xl mx-auto">
          {!hasAccess ? (
            <Card className="bg-white/90">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#E3701B] to-[#4285F4] rounded-full flex items-center justify-center">
                    <Lock className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Contenido Pro</h2>
                    <p className="text-gray-600 text-lg mb-1">
                      Este curso requiere una suscripción {(course.requiredTier || 'pro').toUpperCase()}
                    </p>
                    <p className="text-gray-500">
                      Tu plan actual: {(userProfile?.subscription_tier || 'free').toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-[#E3701B]" />
                      Beneficios de actualizar:
                    </h3>
                    <ul className="text-left space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>Acceso a todos los cursos Pro</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>Certificados verificados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>Asistente IA ilimitado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>Soporte prioritario</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={onBack}
                      variant="outline"
                      size="lg"
                    >
                      Volver a Cursos
                    </Button>
                    <Button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('navigate-to-subscription'));
                      }}
                      className="bg-gradient-to-r from-[#E3701B] to-[#4285F4] text-white"
                      size="lg"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Ver Planes de Suscripción
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
          <div className="relative h-[600px] bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-indigo-50/50 rounded-2xl border-2 border-gray-200/50 overflow-hidden">
            {/* Background pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, ${course.color} 2px, transparent 2px)`,
                backgroundSize: '50px 50px'
              }}
            />
            
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {nodes.map(node => 
                node.connections.map(connectionId => {
                  const targetNode = nodes.find(n => n.id === connectionId);
                  if (!targetNode) return null;
                  
                  const isCompleted = completedNodes.has(node.id);
                  
                  return (
                    <motion.line
                      key={`${node.id}-${connectionId}`}
                      x1={`${node.position.x}%`}
                      y1={`${node.position.y}%`}
                      x2={`${targetNode.position.x}%`}
                      y2={`${targetNode.position.y}%`}
                      stroke={isCompleted ? '#10B981' : '#D1D5DB'}
                      strokeWidth="3"
                      strokeDasharray={isCompleted ? '0' : '10,5'}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  );
                })
              )}
            </svg>
            
            {/* Nodes */}
            {nodes.map((node, index) => {
              const Icon = getNodeIcon(node.type);
              const nodeColor = getNodeColor(node.type, node.status);
              const isCompleted = completedNodes.has(node.id);
              
              return (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ 
                    left: `${node.position.x}%`, 
                    top: `${node.position.y}%`
                  }}
                  onClick={() => handleNodeClick(node)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative ${
                      node.status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {/* Node Circle */}
                    <div 
                      className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        node.status === 'current' ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        backgroundColor: nodeColor,
                        borderColor: isCompleted ? '#10B981' : node.status === 'current' ? nodeColor : '#E5E7EB'
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                      ) : node.status === 'locked' ? (
                        <Lock className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    
                    {/* Node Label */}
                    <div className="absolute top-18 left-1/2 transform -translate-x-1/2 text-center">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border">
                        <div className="font-medium text-sm text-gray-900 whitespace-nowrap">
                          {node.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {getTypeLabel(node.type)}
                        </div>
                      </div>
                    </div>
                    
                    {/* XP Badge */}
                    {(isCompleted || node.status === 'current') && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-yellow-300"
                      >
                        +{node.xpReward}
                      </motion.div>
                    )}
                    
                    {/* Current indicator */}
                    {node.status === 'current' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-2 border-4 border-yellow-400 rounded-full"
                      />
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          )}
        </div>
      </main>

      {/* Node Detail Modal */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNode(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="p-6 text-white"
              style={{ backgroundColor: getNodeColor(selectedNode.type, selectedNode.status) }}
            >
              <div className="flex items-center space-x-3">
                {React.createElement(getNodeIcon(selectedNode.type), { className: "w-8 h-8" })}
                <div>
                  <h3 className="text-xl font-bold">{selectedNode.title}</h3>
                  <p className="text-white/90">{getTypeLabel(selectedNode.type)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">{selectedNode.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">{selectedNode.xpReward} XP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{selectedNode.estimatedTime}</span>
                </div>
              </div>

              {selectedNode.prerequisites && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Prerrequisitos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.prerequisites.map(prereq => {
                      const prereqNode = nodes.find(n => n.id === prereq);
                      return (
                        <Badge key={prereq} variant="outline" className="text-xs">
                          {prereqNode?.title || prereq}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setSelectedNode(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => handleStartNode(selectedNode)}
                  className="flex-1 text-white"
                  style={{ backgroundColor: getNodeColor(selectedNode.type, selectedNode.status) }}
                  disabled={selectedNode.status === 'locked'}
                >
                  {completedNodes.has(selectedNode.id) ? 'Revisar' : 'Comenzar'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Floating Completion Certificate */}
      {calculateProgress() === 100 && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-2xl">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-yellow-800 mb-2">
                ¡Curso Completado!
              </h3>
              <p className="text-yellow-700 mb-4">
                Has dominado {course.title}
              </p>
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Descargar Certificado
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}