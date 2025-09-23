import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { DebugPanel } from "./DebugPanel";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
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
  userProfile?: any;
  session?: any;
  onMyCourses?: () => void;
  onAchievements?: () => void;
  onCommunity?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
}

export function DashboardPage({ role, aiLevel, onLogout, onCourseSelect, onTeacherManagement, onAIAssistant, userProfile, session, onMyCourses, onAchievements, onCommunity, onProfile, onSettings }: DashboardPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [userCourses, setUserCourses] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading dashboard data...');
      
      // Load available courses
      const coursesData = await apiHelpers.getAvailableCourses();
      console.log('Available courses loaded:', coursesData);
      setAvailableCourses(coursesData.courses || []);

      // Load user's courses if authenticated
      if (session?.access_token) {
        try {
          const userCoursesData = await apiHelpers.getUserCourses(session.access_token);
          console.log('User courses loaded:', userCoursesData);
          setUserCourses(userCoursesData);
        } catch (error) {
          console.log('Error loading user courses, setting defaults:', error);
          setUserCourses({ enrolledCourses: [], enrollments: [] });
        }
      } else {
        console.log('No session token, setting empty user courses');
        setUserCourses({ enrolledCourses: [], enrollments: [] });
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error cargando datos del dashboard');
      // Set fallback data
      setAvailableCourses([]);
      setUserCourses({ enrolledCourses: [], enrollments: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseEnroll = async (courseId: string) => {
    if (!session?.access_token) {
      toast.error('Necesitas iniciar sesión para inscribirte a cursos');
      return;
    }

    console.log('Attempting enrollment for course:', courseId);
    console.log('Current enrolled courses:', userCourses?.enrolledCourses);

    // Check if already enrolled to prevent duplicates
    if (userCourses?.enrolledCourses?.includes(courseId)) {
      toast.info('Ya estás inscrito en este curso');
      return;
    }

    setEnrollmentLoading(true);
    try {
      const result = await apiHelpers.enrollInCourse(session.access_token, courseId);
      console.log('Enrollment result:', result);
      
      if (result.success) {
        toast.success('¡Te has inscrito al curso exitosamente!');
        if (result.xpGained) {
          toast.success(`+${result.xpGained} XP ganados!`);
        }
      }
      
      // Reload user courses
      await loadDashboardData();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      
      if (error.message?.includes('ya inscrito') || 
          error.message?.includes('already enrolled') ||
          error.message?.includes('Ya estás inscrito')) {
        toast.info('Ya estás inscrito en este curso');
        // Reload data to ensure UI is in sync
        await loadDashboardData();
      } else {
        toast.error('Error al inscribirse al curso: ' + error.message);
      }
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const getRoleConfig = () => {
    // Get real user data or defaults for new users
    const realLevel = userProfile?.level || 1;
    const realXP = userProfile?.xp || 0;
    const realStreak = userProfile?.currentStreak || 0;
    
    switch (role) {
      case 'student':
        return {
          title: 'Mi Dashboard de Aprendizaje',
          color: '#E3701B',
          icon: '🎓',
          level: realLevel,
          xp: realXP,
          streak: realStreak,
          sidebarItems: [
            { icon: Home, label: 'Dashboard', active: true },
            { icon: BookOpen, label: 'Mis Cursos', action: 'my-courses' },
            { icon: Trophy, label: 'Logros', action: 'achievements' },
            { icon: Target, label: 'Objetivos' },
            { icon: Users, label: 'Comunidad', action: 'community' },
            { icon: User, label: 'Perfil', action: 'profile' },
            { icon: Settings, label: 'Configuración', action: 'settings' }
          ]
        };
      case 'teacher':
        return {
          title: 'Panel del Maestro',
          color: '#4285F4',
          icon: '🧑‍🏫',
          level: realLevel,
          xp: realXP,
          streak: realStreak,
          sidebarItems: [
            { icon: Home, label: 'Dashboard', active: true },
            { icon: BookOpen, label: 'Mis Cursos', action: 'my-courses' },
            { icon: PlusCircle, label: 'Gestión de Cursos', action: 'management' },
            { icon: BarChart, label: 'Reportes de Alumnos' },
            { icon: Bot, label: 'Asistente IA', action: 'ai-assistant' },
            { icon: Users, label: 'Comunidad', action: 'community' },
            { icon: User, label: 'Perfil', action: 'profile' },
            { icon: Settings, label: 'Configuración', action: 'settings' }
          ]
        };
      case 'professional':
        return {
          title: 'Dashboard Profesional',
          color: '#C4423D',
          icon: '👩‍💼',
          level: realLevel,
          xp: realXP,
          streak: realStreak,
          sidebarItems: [
            { icon: Home, label: 'Dashboard', active: true },
            { icon: BookOpen, label: 'Mis Cursos', action: 'my-courses' },
            { icon: Zap, label: 'Crash Courses' },
            { icon: Briefcase, label: 'Business Cases' },
            { icon: TrendingUp, label: 'ROI Tracker' },
            { icon: Users, label: 'Comunidad', action: 'community' },
            { icon: User, label: 'Perfil', action: 'profile' },
            { icon: Settings, label: 'Configuración', action: 'settings' }
          ]
        };
      default:
        return { title: '', color: '', icon: '', level: 0, xp: 0, streak: 0, sidebarItems: [] };
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
      case 'my-courses':
        onMyCourses?.();
        break;
      case 'achievements':
        onAchievements?.();
        break;
      case 'community':
        onCommunity?.();
        break;
      case 'profile':
        onProfile?.();
        break;
      case 'settings':
        onSettings?.();
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

  // Calculate actual daily goals based on real user activity
  const getDailyGoals = () => {
    const today = new Date().toDateString();
    const enrollmentsToday = userCourses?.enrollments?.filter(enrollment => {
      const enrollmentDate = new Date(enrollment.enrolledAt || enrollment.createdAt || '').toDateString();
      return enrollmentDate === today;
    }) || [];

    const lessonsCompletedToday = userCourses?.enrollments?.reduce((total, enrollment) => {
      const completedToday = enrollment.completedLessons?.filter(lesson => {
        const completionDate = new Date(lesson.completedAt || '').toDateString();
        return completionDate === today;
      }) || [];
      return total + completedToday.length;
    }, 0) || 0;

    const xpGainedToday = userProfile?.dailyXP || 0;
    const streakActive = config.streak > 0;

    return {
      enrollmentsToday: enrollmentsToday.length,
      lessonsCompletedToday,
      xpGainedToday,
      streakActive,
      hasActivity: enrollmentsToday.length > 0 || lessonsCompletedToday > 0 || xpGainedToday > 0
    };
  };

  const dailyGoals = getDailyGoals();

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
                  {role === 'student' && 'Cursos Disponibles'}
                  {role === 'teacher' && 'Desarrollo Profesional'}
                  {role === 'professional' && 'Crash Courses'}
                </h3>
                <Button variant="outline" size="sm" onClick={() => onMyCourses?.()}>
                  Ver Mis Cursos
                </Button>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <Card className="bg-white/90">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-full"></div>
                              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {availableCourses.length > 0 ? availableCourses.slice(0, 3).map((course, index) => {
                    const isEnrolled = userCourses?.enrolledCourses?.includes(course.id);
                    const enrollment = userCourses?.enrollments?.find(e => e.courseId === course.id);
                    const progress = enrollment?.progress || 0;
                    // Fix: Correctly handle course unlocking logic
                    const isUnlocked = aiLevel === 'advanced' || 
                                     course.difficulty === 'beginner' || 
                                     (course.difficulty === 'intermediate' && aiLevel !== 'beginner') ||
                                     isEnrolled; // If already enrolled, should always be unlocked

                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => isUnlocked && onCourseSelect(course)}
                      >
                        <Card className={`transition-all duration-300 ${
                          isUnlocked 
                            ? 'hover:shadow-lg bg-white/90' 
                            : 'opacity-60 bg-gray-100/90'
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              {/* Course Icon */}
                              <div 
                                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: '#4285F415' }}
                              >
                                {isUnlocked ? (
                                  isEnrolled && progress > 0 ? (
                                    <Play className="w-8 h-8 text-[#4285F4]" />
                                  ) : (
                                    <BookOpen className="w-8 h-8 text-[#4285F4]" />
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
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {course.duration}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-3">
                                  {course.description}
                                </p>

                                {isEnrolled && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                      <span>{enrollment?.completedLessons?.length || 0}/{course.lessons?.length || 0} lecciones</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                  </div>
                                )}
                              </div>

                              {/* Action Button */}
                              <div className="flex flex-col items-center space-y-2">
                                {isUnlocked ? (
                                  <>
                                    {isEnrolled ? (
                                      <Button
                                        size="sm"
                                        className="text-white bg-[#4285F4] hover:bg-[#3367d6]"
                                      >
                                        {progress > 0 ? 'Continuar' : 'Comenzar'}
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={enrollmentLoading}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCourseEnroll(course.id);
                                        }}
                                      >
                                        {enrollmentLoading ? 'Inscribiendo...' : 'Inscribirse'}
                                      </Button>
                                    )}
                                    {progress === 100 && (
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
                    );
                  }) : (
                    <Card className="bg-white/90">
                      <CardContent className="p-6 text-center">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No hay cursos disponibles en este momento.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
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
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={onAIAssistant}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Asistente IA
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={onTeacherManagement}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Gestión de Cursos
                      </Button>
                    </div>
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
                <CardContent>
                  {dailyGoals.hasActivity ? (
                    <div className="space-y-4">
                      {dailyGoals.enrollmentsToday > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Cursos inscritos</span>
                          <Badge variant="secondary">{dailyGoals.enrollmentsToday}</Badge>
                        </div>
                      )}
                      {dailyGoals.lessonsCompletedToday > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Lecciones completadas</span>
                          <Badge variant="secondary">{dailyGoals.lessonsCompletedToday}</Badge>
                        </div>
                      )}
                      {dailyGoals.xpGainedToday > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">XP ganado</span>
                          <Badge variant="secondary">{dailyGoals.xpGainedToday}</Badge>
                        </div>
                      )}
                      {dailyGoals.streakActive && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Racha activa</span>
                          <Badge className="bg-orange-100 text-orange-800">{config.streak} días</Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No hay actividad hoy</p>
                      <p className="text-xs">¡Comienza inscribiéndote a un curso!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" style={{ color: config.color }} />
                    <span>Progreso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cursos inscritos</span>
                      <Badge variant="secondary">{userCourses?.enrolledCourses?.length || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cursos completados</span>
                      <Badge variant="secondary">{userCourses?.completedCourses?.length || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">XP total</span>
                      <Badge variant="secondary">{config.xp}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Debug Panel - Remove in production */}
      <DebugPanel
        userProfile={userProfile}
        session={session}
        userCourses={userCourses}
        availableCourses={availableCourses}
        aiLevel={aiLevel}
      />
    </div>
  );
}