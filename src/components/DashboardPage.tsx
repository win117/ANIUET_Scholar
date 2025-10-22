import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
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
  Briefcase,
  UserPlus,
  QrCode,
  RefreshCw,
  Check,
  AlertCircle,
  Eye,
  MessageCircle,
  Crown
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface DashboardPageProps {
  role: 'student' | 'teacher' | 'professional';
  aiLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  onLogout: () => void;
  onCourseSelect: (course: any) => void;
  onLessonSelect?: (courseId: string, lessonId: string) => void;
  onTeacherManagement: () => void;
  onStudentManagement?: () => void;
  onAIAssistant: () => void;
  userProfile?: any;
  session?: any;
  onMyCourses?: () => void;
  onAchievements?: () => void;
  onCommunity?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onGoals?: () => void;
  onMessages?: () => void;
  onSubscription?: () => void;
  onCrashCourses?: () => void;
}

export function DashboardPage({ role, aiLevel, onLogout, onCourseSelect, onLessonSelect, onTeacherManagement, onStudentManagement, onAIAssistant, userProfile, session, onMyCourses, onAchievements, onCommunity, onProfile, onSettings, onGoals, onMessages, onSubscription, onCrashCourses }: DashboardPageProps) {
  // En móvil el sidebar empieza cerrado, en desktop abierto
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return true;
  });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [userCourses, setUserCourses] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [showJoinClassDialog, setShowJoinClassDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
  const [showAvailableCodes, setShowAvailableCodes] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadDashboardData();
    loadUnreadMessages();
    
    // Poll for unread messages every 30 seconds
    const interval = setInterval(() => {
      loadUnreadMessages();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [session]);

  const loadUnreadMessages = async () => {
    if (!session?.access_token) return;
    
    try {
      const result = await apiHelpers.getUnreadMessageCount(session.access_token);
      if (result.success) {
        setUnreadMessages(result.unreadCount || 0);
      } else {
        // Silently fail - don't show error to user
        setUnreadMessages(0);
      }
    } catch (error) {
      // Silently fail - just set to 0 unread messages
      // This prevents console spam and UI breaks
      setUnreadMessages(0);
    }
  };

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
            { icon: UserPlus, label: 'Unirse a Clase', action: 'join-class' },
            { icon: Trophy, label: 'Logros', action: 'achievements' },
            { icon: Target, label: 'Objetivos', action: 'goals' },
            { icon: Users, label: 'Comunidad', action: 'community' },
            { icon: MessageCircle, label: 'Mensajes', action: 'messages' },
            { icon: Crown, label: 'Suscripción', action: 'subscription' },
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
            { icon: BarChart, label: 'Reportes de Alumnos', action: 'student-management' },
            { icon: Bot, label: 'Asistente IA', action: 'ai-assistant' },
            { icon: Users, label: 'Comunidad', action: 'community' },
            { icon: MessageCircle, label: 'Mensajes', action: 'messages' },
            { icon: Crown, label: 'Suscripción', action: 'subscription' },
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
            { icon: Zap, label: 'Crash Courses', action: 'crash-courses' },
            { icon: Briefcase, label: 'Business Cases' },
            { icon: TrendingUp, label: 'ROI Tracker' },
            { icon: Users, label: 'Comunidad', action: 'community' },
            { icon: MessageCircle, label: 'Mensajes', action: 'messages' },
            { icon: Crown, label: 'Suscripción', action: 'subscription' },
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
    // En móviles, cerrar el sidebar automáticamente al seleccionar una opción
    if (window.innerWidth < 768) { // md breakpoint
      setSidebarOpen(false);
    }
    
    switch (action) {
      case 'management':
        onTeacherManagement();
        break;
      case 'student-management':
        onStudentManagement?.();
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
      case 'goals':
        onGoals?.();
        break;
      case 'messages':
        onMessages?.();
        break;
      case 'subscription':
        onSubscription?.();
        break;
      case 'crash-courses':
        onCrashCourses?.();
        break;
      case 'join-class':
        setShowJoinClassDialog(true);
        break;
      default:
        break;
    }
  };

  const formatInviteCode = (value: string) => {
    // Remove any non-alphanumeric characters except hyphen
    const cleaned = value.replace(/[^A-Z0-9-]/g, '');
    
    // If it starts with ANIUET, keep it as is, otherwise try to format it
    if (cleaned.startsWith('ANIUET-')) {
      return cleaned.slice(0, 10); // Limit to ANIUET-XXX format (3 digits)
    } else if (cleaned.startsWith('ANIUET')) {
      // Add hyphen after ANIUET if missing
      if (cleaned.length > 6) {
        return 'ANIUET-' + cleaned.slice(6, 9);
      }
      return cleaned;
    } else {
      // If user is typing something else, try to guide them to the correct format
      if (cleaned.length > 0) {
        // If they're typing numbers first, prepend ANIUET-
        if (/^\d/.test(cleaned)) {
          return 'ANIUET-' + cleaned.slice(0, 3);
        }
      }
      return cleaned.slice(0, 10);
    }
  };

  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCode = formatInviteCode(e.target.value.toUpperCase());
    setInviteCode(formattedCode);
  };

  const isValidInviteCode = () => {
    return /^ANIUET-\d{3}$/.test(inviteCode.trim());
  };

  const loadAvailableCodes = async () => {
    try {
      console.log('🔍 Loading available course codes...');
      
      // Try to get codes from API
      const result = await apiHelpers.getAvailableCourseCodes();
      if (result.success && result.availableCodes.length > 0) {
        console.log('✅ Loaded codes from API:', result.availableCodes);
        setAvailableCodes(result.availableCodes);
        setShowAvailableCodes(true);
        return;
      }
    } catch (error) {
      console.error('❌ Error loading available codes from API:', error);
    }
    
    // Fallback: show hardcoded test codes
    console.log('📋 Using fallback hardcoded test codes');
    const fallbackCodes = [
      { code: 'ANIUET-001', title: 'Fundamentos de IA', type: 'mock' },
      { code: 'ANIUET-002', title: 'Machine Learning Básico', type: 'mock' },
      { code: 'ANIUET-003', title: 'Deep Learning Avanzado', type: 'mock' }
    ];
    
    setAvailableCodes(fallbackCodes);
    setShowAvailableCodes(true);
    toast.info('Mostrando códigos de prueba predeterminados');
  };

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) {
      toast.error('Por favor ingresa un código de invitación');
      return;
    }

    // Validate code format (should be ANIUET-XXX)
    const codeFormat = /^ANIUET-\d{3}$/;
    if (!codeFormat.test(inviteCode.trim())) {
      toast.error('El código debe tener el formato ANIUET-XXX (donde X son números)');
      return;
    }

    if (!session?.access_token) {
      toast.error('Necesitas iniciar sesión para unirte a una clase');
      return;
    }

    setIsJoiningClass(true);
    try {
      const result = await apiHelpers.joinClassWithCode(session.access_token, inviteCode.trim().toUpperCase());
      
      if (result.success) {
        if (result.alreadyEnrolled) {
          // Handle already enrolled case
          toast.info(result.message || '¡Ya estás inscrito en este curso!');
        } else {
          // Handle new enrollment
          toast.success(result.message || 'Te has unido a la clase exitosamente');
          if (result.xpGained && result.xpGained > 0) {
            toast.success(`+${result.xpGained} XP ganados!`);
          }
        }
        
        setInviteCode('');
        setShowJoinClassDialog(false);
        // Reload dashboard data to reflect any new course enrollments
        await loadDashboardData();
      } else {
        toast.error(result.error || 'Error al unirse a la clase');
      }
    } catch (error) {
      console.error('Error joining class:', error);
      
      // Handle specific error cases more gracefully
      const errorMessage = error.message;
      if (errorMessage?.includes('Ya estás inscrito en este curso') || 
          errorMessage?.includes('already enrolled')) {
        toast.info('¡Ya estás inscrito en este curso! Revisa "Mis Cursos" para continuar tu aprendizaje.');
        setInviteCode('');
        setShowJoinClassDialog(false);
        // Reload dashboard data to ensure UI is in sync
        await loadDashboardData();
      } else if (errorMessage?.includes('inválido') || errorMessage?.includes('not found')) {
        toast.error('Código de curso inválido. Verifica que el código sea correcto.');
      } else if (errorMessage?.includes('Network error') || errorMessage?.includes('fetch')) {
        toast.error('Error de conexión. Verifica tu internet e intenta nuevamente.');
      } else {
        toast.error('Error al unirse a la clase: ' + errorMessage);
      }
    } finally {
      setIsJoiningClass(false);
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
      
      {/* Mobile Overlay - solo aparece en móvil cuando el sidebar está abierto */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-64 sm:w-72 md:w-80 bg-white/95 backdrop-blur-md border-r shadow-xl z-40"
      >
        <div className="p-4 sm:p-6 h-full flex flex-col">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
            <img src={logo} alt="ANIUET Scholar" className="w-6 h-6 sm:w-8 sm:h-8" />
            <h2 className="text-lg sm:text-xl font-bold text-[#4285F4]">ANIUET Scholar</h2>
          </div>

          {/* User Stats */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl"
                style={{ backgroundColor: `${config.color}15` }}
              >
                {config.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">Nivel {config.level}</div>
                <div className="text-xs sm:text-sm text-gray-600">{config.xp} XP</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-1">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                  <span>{config.streak} días</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  <span>Nivel {config.level}</span>
                </div>
              </div>
              {getAILevelBadge()}
            </div>
          </div>

          {/* Navigation - con scroll para contenido largo */}
          <nav className="space-y-1 sm:space-y-2 flex-1 overflow-y-auto">
            {config.sidebarItems.map((item, index) => (
              <motion.button
                key={item.label}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSidebarAction(item.action)}
                className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base ${
                  item.active 
                    ? 'text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: item.active ? config.color : undefined 
                }}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.label === 'Mensajes' && unreadMessages > 0 && (
                  <Badge className="bg-red-500 text-white text-xs h-5 min-w-5 flex items-center justify-center flex-shrink-0">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Badge>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Logout at bottom */}
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={onLogout}
              variant="outline" 
              className="w-full text-sm sm:text-base"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b p-3 sm:p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex-shrink-0"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold truncate" style={{ color: config.color }}>
              {config.title}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="hidden sm:block">
              {getAILevelBadge()}
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs sm:text-sm">
              Nivel {config.level}
            </Badge>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-3 sm:p-4 md:p-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h2 className="text-2xl sm:text-3xl mb-2">
              ¡Bienvenido de vuelta! {config.icon}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              {role === 'student' && 'Continúa tu viaje de aprendizaje personalizado'}
              {role === 'teacher' && 'Gestiona tus cursos y alumnos con IA'}
              {role === 'professional' && 'Acelera tu desarrollo profesional con cursos intensivos'}
            </p>
          </motion.div>

          {/* Subscription Tier Banner */}
          {userProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 sm:mb-8"
            >
              {userProfile.subscription_tier === 'free' || !userProfile.subscription_tier ? (
                <Card className="bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 border-orange-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#E3701B] to-[#4285F4] rounded-full flex items-center justify-center flex-shrink-0">
                          <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            ✨ Desbloquea Todo el Potencial de ANIUET Scholar
                          </h3>
                          <p className="text-sm sm:text-base text-gray-700">
                            Accede a todos los cursos, certificados verificados y asistente IA ilimitado
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => onSubscription?.()}
                        className="bg-gradient-to-r from-[#E3701B] to-[#4285F4] text-white hover:opacity-90 transition-opacity w-full sm:w-auto"
                        size="lg"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Ver Planes de Suscripción</span>
                        <span className="sm:hidden">Ver Planes</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-purple-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-1">
                          Plan {userProfile.subscription_tier.toUpperCase()} Activo
                        </h3>
                        <p className="text-sm sm:text-base text-purple-700">
                          Tienes acceso completo a todos los beneficios de tu suscripción
                        </p>
                      </div>
                      <Button
                        onClick={() => onSubscription?.()}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        Gestionar Suscripción
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Biofeedback Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-blue-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    🧠
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-1 sm:mb-2">
                      🤖 ANIUET Scholar adaptará tus cursos usando biofeedback
                    </h3>
                    <p className="text-sm sm:text-base text-blue-700">
                      Nuestra IA analiza tu progreso y adapta el contenido para maximizar tu aprendizaje. 
                      {aiLevel === 'advanced' && ' Como usuario avanzado, tienes acceso a cursos especializados.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Courses Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold">
                  {role === 'student' && 'Cursos Disponibles'}
                  {role === 'teacher' && 'Desarrollo Profesional'}
                  {role === 'professional' && 'Crash Courses'}
                </h3>
                <Button variant="outline" size="sm" onClick={() => onMyCourses?.()} className="text-xs sm:text-sm">
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
                    
                    // Check subscription tier
                    const userTier = userProfile?.subscription_tier || 'free';
                    const requiredTier = course.requiredTier || 'free';
                    const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
                    const hasRequiredTier = tierHierarchy[userTier] >= tierHierarchy[requiredTier];
                    
                    // Course unlocking logic (now includes subscription check)
                    const isUnlocked = (aiLevel === 'advanced' || 
                                     course.difficulty === 'beginner' || 
                                     (course.difficulty === 'intermediate' && aiLevel !== 'beginner') ||
                                     isEnrolled) && hasRequiredTier; // Must have subscription tier
                    
                    const requiresSubscription = !hasRequiredTier;

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
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Actions for Teachers */}
              {role === 'teacher' && (
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: config.color }} />
                      <span>Herramientas del Maestro</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 sm:space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm sm:text-base"
                        onClick={onAIAssistant}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Asistente IA
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm sm:text-base"
                        onClick={onTeacherManagement}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Gestión de Cursos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Join Class for Students */}
              {role === 'student' && (
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: config.color }} />
                      <span>Unirse a Clase</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                      ¿Tu maestro te dio un código? Úsalo para unirte a su clase y acceder a cursos exclusivos.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => {
                        // Reset states when opening dialog
                        setInviteCode('');
                        setShowAvailableCodes(false);
                        setAvailableCodes([]);
                        setShowJoinClassDialog(true);
                        // Show helpful message about available codes
                        setTimeout(() => {
                          toast.info('💡 Tip: Haz clic en "Ver códigos disponibles" para probar con ANIUET-001, ANIUET-002 o ANIUET-003', {
                            duration: 6000
                          });
                        }, 1500);
                      }}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Ingresar Código
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Daily Goals */}
              <Card className="bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: config.color }} />
                    <span>Objetivos Diarios</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyGoals.hasActivity ? (
                    <div className="space-y-3 sm:space-y-4">
                      {dailyGoals.enrollmentsToday > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm">Cursos inscritos</span>
                          <Badge variant="secondary" className="text-xs">{dailyGoals.enrollmentsToday}</Badge>
                        </div>
                      )}
                      {dailyGoals.lessonsCompletedToday > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm">Lecciones completadas</span>
                          <Badge variant="secondary" className="text-xs">{dailyGoals.lessonsCompletedToday}</Badge>
                        </div>
                      )}
                      {dailyGoals.xpGainedToday > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm">XP ganado</span>
                          <Badge variant="secondary" className="text-xs">{dailyGoals.xpGainedToday}</Badge>
                        </div>
                      )}
                      {dailyGoals.streakActive && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm">Racha activa</span>
                          <Badge variant="secondary" className="text-xs">{config.streak} días</Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3 sm:py-4">
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-gray-600">¡Comienza tu día de aprendizaje!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: config.color }} />
                    <span>Actividad Reciente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs sm:text-sm">Perfil creado</span>
                    </div>
                    {userCourses?.enrollments?.slice(0, 3).map((enrollment, index) => (
                      <div key={index} className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm">Inscrito en curso</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Join Class Dialog */}
      <Dialog open={showJoinClassDialog} onOpenChange={(open) => {
        setShowJoinClassDialog(open);
        if (!open) {
          setInviteCode('');
          setShowAvailableCodes(false);
          setAvailableCodes([]);
        }
      }}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#E3701B]" />
              <span>Unirse a Clase</span>
            </DialogTitle>
            <DialogDescription className="space-y-2 text-sm">
              <span>Ingresa el código de invitación que te proporcionó tu maestro para unirte a su clase.</span>
              <span className="text-xs sm:text-sm text-blue-600 block">
                💡 Para probar: usa "Ver códigos disponibles" abajo
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="invite-code" className="text-sm sm:text-base">Código de Invitación</Label>
              <div className="relative">
                <Input
                  id="invite-code"
                  value={inviteCode}
                  onChange={handleInviteCodeChange}
                  placeholder="ANIUET-003"
                  className={`text-center text-base sm:text-lg font-mono tracking-wider pr-10 ${
                    inviteCode.trim() ? 
                      (isValidInviteCode() ? 'border-green-300 focus:border-green-500' : 'border-red-300 focus:border-red-500') 
                      : ''
                  }`}
                  maxLength={10}
                />
                {inviteCode.trim() && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isValidInviteCode() ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <p className={`text-xs sm:text-sm mt-2 ${
                inviteCode.trim() ? 
                  (isValidInviteCode() ? 'text-green-600' : 'text-red-600') 
                  : 'text-gray-500'
              }`}>
                {inviteCode.trim() ? 
                  (isValidInviteCode() ? 
                    '✓ Formato de código válido' : 
                    '✗ El código debe tener el formato: ANIUET-003'
                  ) : 
                  'El código debe tener el formato: ANIUET-003'
                }
              </p>
            </div>
            
            {/* Show Available Codes Button */}
            <div className="text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadAvailableCodes}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver códigos disponibles
              </Button>
            </div>

            {/* Available Codes Display */}
            {showAvailableCodes && availableCodes.length > 0 && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-medium text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3">Códigos disponibles para pruebas:</h4>
                <div className="space-y-2">
                  {availableCodes.map((courseInfo, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border flex-wrap sm:flex-nowrap gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs sm:text-sm font-bold text-blue-600">{courseInfo.code}</span>
                        <span className="text-xs text-gray-500 ml-2 block sm:inline">{courseInfo.title}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setInviteCode(courseInfo.code);
                          setShowAvailableCodes(false);
                        }}
                        className="text-xs flex-shrink-0"
                      >
                        Usar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button 
                onClick={handleJoinClass}
                disabled={isJoiningClass || !isValidInviteCode()}
                className="flex-1 bg-[#E3701B] hover:bg-[#d66516] text-white text-sm sm:text-base"
              >
                {isJoiningClass ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isJoiningClass ? 'Uniéndose...' : 'Unirse a Clase'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowJoinClassDialog(false);
                  setInviteCode('');
                  setShowAvailableCodes(false);
                  setAvailableCodes([]);
                }}
                className="flex-1 text-sm sm:text-base"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}