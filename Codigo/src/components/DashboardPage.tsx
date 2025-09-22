import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  Award, 
  Users, 
  FileText,
  Settings,
  Bell,
  Home,
  User,
  Trophy,
  Target,
  Flame,
  Star,
  Play,
  Lock,
  CheckCircle,
  Menu,
  X,
  PlusCircle,
  BarChart,
  Bot,
  Clock,
  Zap,
  GraduationCap,
  Briefcase
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface DashboardPageProps {
  role: 'student' | 'teacher' | 'professional';
  aiLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  onLogout: () => void;
  onCourseSelect: (course: any) => void;
  onTeacherManagement: () => void;
  onAIAssistant: () => void;
}

export function DashboardPage({ role, aiLevel, onLogout, onCourseSelect, onTeacherManagement, onAIAssistant }: DashboardPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getRoleConfig = () => {
    switch (role) {
      case 'student':
        return {
          title: 'Mi Dashboard de Aprendizaje',
          color: '#E3701B',
          icon: '🎓',
          level: aiLevel === 'advanced' ? 25 : aiLevel === 'intermediate' ? 15 : 8,
          xp: aiLevel === 'advanced' ? 4200 : aiLevel === 'intermediate' ? 2450 : 850,
          streak: 7,
          courses: [
            // Rutas progresivas para estudiantes
            {
              id: 'intro-ai',
              title: '🤖 Fundamentos de IA',
              type: 'foundation',
              progress: aiLevel === 'advanced' ? 100 : aiLevel === 'intermediate' ? 75 : 45,
              difficulty: 'Principiante',
              lessons: 12,
              completedLessons: aiLevel === 'advanced' ? 12 : aiLevel === 'intermediate' ? 9 : 5,
              color: '#4285F4',
              isUnlocked: true,
              description: 'Conceptos básicos y aplicaciones de la inteligencia artificial',
              estimatedTime: '4 semanas'
            },
            {
              id: 'math-ai',
              title: '📊 Matemáticas para IA',
              type: 'foundation',
              progress: aiLevel === 'advanced' ? 90 : aiLevel === 'intermediate' ? 45 : 0,
              difficulty: 'Intermedio',
              lessons: 16,
              completedLessons: aiLevel === 'advanced' ? 14 : aiLevel === 'intermediate' ? 7 : 0,
              color: '#E3701B',
              isUnlocked: aiLevel !== 'beginner',
              description: 'Álgebra lineal, cálculo y estadística aplicada',
              estimatedTime: '6 semanas'
            },
            {
              id: 'ml-practice',
              title: '🧠 Machine Learning Práctico',
              type: 'practice',
              progress: aiLevel === 'advanced' ? 60 : 0,
              difficulty: 'Avanzado',
              lessons: 20,
              completedLessons: aiLevel === 'advanced' ? 12 : 0,
              color: '#C4423D',
              isUnlocked: aiLevel === 'advanced',
              description: 'Implementación práctica de algoritmos de ML',
              estimatedTime: '8 semanas'
            },
            {
              id: 'ai-projects',
              title: '🚀 Proyectos de IA',
              type: 'project',
              progress: 0,
              difficulty: 'Experto',
              lessons: 10,
              completedLessons: 0,
              color: '#10B981',
              isUnlocked: false,
              description: 'Desarrolla proyectos completos de inteligencia artificial',
              estimatedTime: '12 semanas'
            }
          ],
          sidebarItems: [
            { icon: Home, label: 'Dashboard', active: true },
            { icon: BookOpen, label: 'Mis Cursos' },
            { icon: Trophy, label: 'Logros' },
            { icon: Target, label: 'Objetivos' },
            { icon: Users, label: 'Comunidad' },
            { icon: User, label: 'Perfil' },
            { icon: Settings, label: 'Configuración' }
          ]
        };
      case 'teacher':
        return {
          title: 'Panel del Maestro',
          color: '#4285F4',
          icon: '🧑‍🏫',
          level: 8,
          xp: 1200,
          streak: 12,
          courses: [
            {
              id: 'teaching-methods',
              title: '📚 Metodologías con IA',
              type: 'methodology',
              progress: 90,
              difficulty: 'Avanzado',
              lessons: 10,
              completedLessons: 9,
              color: '#4285F4',
              isUnlocked: true,
              description: 'Integra IA en tus métodos de enseñanza',
              estimatedTime: '3 semanas'
            },
            {
              id: 'digital-assessment',
              title: '📊 Evaluación Digital',
              type: 'assessment',
              progress: 60,
              difficulty: 'Intermedio',
              lessons: 8,
              completedLessons: 5,
              color: '#E3701B',
              isUnlocked: true,
              description: 'Herramientas de evaluación automatizada',
              estimatedTime: '2 semanas'
            },
            {
              id: 'ai-classroom',
              title: '🤖 IA en el Aula',
              type: 'technology',
              progress: 25,
              difficulty: 'Intermedio',
              lessons: 12,
              completedLessons: 3,
              color: '#10B981',
              isUnlocked: true,
              description: 'Implementa asistentes de IA para la educación',
              estimatedTime: '4 semanas'
            }
          ],
          sidebarItems: [
            { icon: Home, label: 'Dashboard', active: true },
            { icon: BookOpen, label: 'Mis Cursos' },
            { icon: PlusCircle, label: 'Gestión de Cursos', action: 'management' },
            { icon: BarChart, label: 'Reportes de Alumnos' },
            { icon: Bot, label: 'Asistente IA', action: 'ai-assistant' },
            { icon: Users, label: 'Mis Estudiantes' },
            { icon: Settings, label: 'Configuración' }
          ]
        };
      case 'professional':
        return {
          title: 'Dashboard Profesional',
          color: '#C4423D',
          icon: '👩‍💼',
          level: 12,
          xp: 1890,
          streak: 5,
          courses: [
            // Cursos rápidos tipo "Crash Course"
            {
              id: 'ai-leadership',
              title: '⚡ Liderazgo con IA - Crash Course',
              type: 'crash-course',
              progress: 80,
              difficulty: 'Intensivo',
              lessons: 6,
              completedLessons: 5,
              color: '#C4423D',
              isUnlocked: true,
              description: 'Domina la IA para liderar equipos en 2 horas',
              estimatedTime: '2 horas'
            },
            {
              id: 'audio-detection',
              title: '🎵 Detección de Audio con IA',
              type: 'crash-course',
              progress: 35,
              difficulty: 'Técnico',
              lessons: 4,
              completedLessons: 1,
              color: '#4285F4',
              isUnlocked: true,
              description: 'Implementa un modelo de detección de audio en 2 horas',
              estimatedTime: '2 horas'
            },
            {
              id: 'business-automation',
              title: '🚀 Automatización Empresarial',
              type: 'crash-course',
              progress: 0,
              difficulty: 'Estratégico',
              lessons: 5,
              completedLessons: 0,
              color: '#10B981',
              isUnlocked: true,
              description: 'Transforma tu negocio con IA en tiempo récord',
              estimatedTime: '1.5 horas'
            },
            {
              id: 'ai-investments',
              title: '💰 IA para Inversiones',
              type: 'crash-course',
              progress: 0,
              difficulty: 'Avanzado',
              lessons: 7,
              completedLessons: 0,
              color: '#F59E0B',
              isUnlocked: false,
              description: 'Algoritmos de trading y análisis financiero',
              estimatedTime: '3 horas'
            }
          ],
          sidebarItems: [
            { icon: Home, label: 'Dashboard', active: true },
            { icon: Zap, label: 'Crash Courses' },
            { icon: Briefcase, label: 'Business Cases' },
            { icon: TrendingUp, label: 'ROI Tracker' },
            { icon: Users, label: 'Network' },
            { icon: Settings, label: 'Configuración' }
          ]
        };
      default:
        return { title: '', color: '', icon: '', level: 0, xp: 0, streak: 0, courses: [], sidebarItems: [] };
    }
  };

  const config = getRoleConfig();

  const handleSidebarAction = (action?: string) => {
    switch (action) {
      case 'management':
        onTeacherManagement();
        break;
      case 'ai-assistant':
        onAIAssistant();
        break;
      default:
        break;
    }
  };

  const getAILevelBadge = () => {
    if (!aiLevel) return null;
    
    const levelConfig = {
      beginner: { label: '🌱 Principiante', color: 'bg-green-100 text-green-800' },
      intermediate: { label: '📚 Intermedio', color: 'bg-blue-100 text-blue-800' },
      advanced: { label: '🚀 Avanzado', color: 'bg-purple-100 text-purple-800' }
    };

    return (
      <Badge className={`${levelConfig[aiLevel].color} border-0`}>
        {levelConfig[aiLevel].label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen relative flex">
      <DynamicBackground variant="dashboard" />
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-md border-r shadow-xl z-40"
      >
        <div className="p-6">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 mb-8">
            <img src={logo} alt="ANIUET Scholar" className="w-8 h-8" />
            <h2 className="text-xl font-bold text-[#4285F4]">ANIUET Scholar</h2>
          </div>

          {/* User Stats */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${config.color}15` }}
              >
                {config.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900">Nivel {config.level}</div>
                <div className="text-sm text-gray-600">{config.xp} XP</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{config.streak} días</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Nivel {config.level}</span>
                </div>
              </div>
              {getAILevelBadge()}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {config.sidebarItems.map((item, index) => (
              <motion.button
                key={item.label}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSidebarAction(item.action)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  item.active 
                    ? 'text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: item.active ? config.color : undefined 
                }}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Logout at bottom */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button 
            onClick={onLogout}
            variant="outline" 
            className="w-full"
          >
            Cerrar Sesión
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="text-2xl font-bold" style={{ color: config.color }}>
              {config.title}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            {getAILevelBadge()}
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Nivel {config.level}
            </Badge>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl mb-2">
              ¡Bienvenido de vuelta! {config.icon}
            </h2>
            <p className="text-gray-600 text-lg">
              {role === 'student' && 'Continúa tu viaje de aprendizaje personalizado'}
              {role === 'teacher' && 'Gestiona tus cursos y alumnos con IA'}
              {role === 'professional' && 'Acelera tu desarrollo profesional con cursos intensivos'}
            </p>
          </motion.div>

          {/* Biofeedback Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    🧠
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      🤖 ANIUET Scholar adaptará tus cursos usando biofeedback
                    </h3>
                    <p className="text-purple-700">
                      Nuestra IA analiza tu progreso y adapta el contenido para maximizar tu aprendizaje. 
                      {aiLevel === 'advanced' && ' Como usuario avanzado, tienes acceso a cursos especializados.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Courses Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">
                  {role === 'student' && 'Mis Cursos Progresivos'}
                  {role === 'teacher' && 'Desarrollo Profesional'}
                  {role === 'professional' && 'Crash Courses'}
                </h3>
                <Button variant="outline" size="sm">Ver Todos</Button>
              </div>
              
              <div className="space-y-4">
                {config.courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => course.isUnlocked && onCourseSelect(course)}
                  >
                    <Card className={`transition-all duration-300 ${
                      course.isUnlocked 
                        ? 'hover:shadow-lg bg-white/90' 
                        : 'opacity-60 bg-gray-100/90'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* Course Icon */}
                          <div 
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${course.color}15` }}
                          >
                            {course.isUnlocked ? (
                              course.progress > 0 ? (
                                <Play className="w-8 h-8" style={{ color: course.color }} />
                              ) : (
                                <BookOpen className="w-8 h-8" style={{ color: course.color }} />
                              )
                            ) : (
                              <Lock className="w-8 h-8 text-gray-400" />
                            )}
                          </div>

                          {/* Course Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {course.title}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {course.difficulty}
                              </Badge>
                              {role === 'professional' && course.type === 'crash-course' && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {course.estimatedTime}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              {course.description}
                            </p>

                            {course.isUnlocked && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>{course.completedLessons}/{course.lessons} lecciones</span>
                                  <span>{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} className="h-2" />
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="flex flex-col items-center space-y-2">
                            {course.isUnlocked ? (
                              <>
                                <Button
                                  size="sm"
                                  className="text-white"
                                  style={{ backgroundColor: course.color }}
                                >
                                  {course.progress > 0 ? 'Continuar' : 'Comenzar'}
                                </Button>
                                {course.progress === 100 && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </>
                            ) : (
                              <div className="text-center">
                                <Lock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                <span className="text-xs text-gray-500">Bloqueado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions for Teachers */}
              {role === 'teacher' && (
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bot className="w-5 h-5" style={{ color: config.color }} />
                      <span>Herramientas del Maestro</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={onTeacherManagement}
                      className="w-full justify-start" 
                      variant="outline"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Gestión de Cursos
                    </Button>
                    <Button 
                      onClick={onAIAssistant}
                      className="w-full justify-start" 
                      variant="outline"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Asistente IA
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart className="w-4 h-4 mr-2" />
                      Reportes
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Daily Goals */}
              <Card className="bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" style={{ color: config.color }} />
                    <span>Objetivos Diarios</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>XP Diaria</span>
                      <span>150/200</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{role === 'professional' ? 'Crash Courses' : 'Lecciones'}</span>
                      <span>2/3</span>
                    </div>
                    <Progress value={66} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tiempo de Estudio</span>
                      <span>25/30 min</span>
                    </div>
                    <Progress value={83} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" style={{ color: config.color }} />
                    <span>Logros Recientes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <motion.div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-2xl">🎯</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Primera Lección</div>
                        <div className="text-xs text-green-600">Desbloqueado</div>
                      </div>
                    </motion.div>
                    
                    <motion.div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="text-2xl">🔥</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Racha de {config.streak} días</div>
                        <div className="text-xs text-orange-600">Desbloqueado</div>
                      </div>
                    </motion.div>

                    <motion.div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-60">
                      <div className="text-2xl">🧠</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Experto en IA</div>
                        <div className="text-xs text-gray-500">Bloqueado</div>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}