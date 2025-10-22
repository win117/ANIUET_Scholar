/**
 * App.tsx - Componente principal de ANIUET Scholar
 * 
 * Este es el punto de entrada principal de la aplicación que maneja:
 * - Navegación entre diferentes páginas/estados
 * - Gestión de sesión y autenticación global
 * - Estado del usuario (perfil, rol, nivel de IA)
 * - Persistencia de sesión entre recargas
 * - Routing basado en URL parameters
 * 
 * @module App
 */
import { useState, useEffect } from "react";
import { HomePage } from "./components/HomePage";
import { RegistrationPage } from "./components/RegistrationPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { DashboardPage } from "./components/DashboardPage";
import { AILevelQuizPage } from "./components/AILevelQuizPage";
import { CourseMapPage } from "./components/CourseMapPage";
import { TeacherManagementPage } from "./components/TeacherManagementPage";
import { StudentManagementPage } from "./components/StudentManagementPage";
import { AIAssistantPage } from "./components/AIAssistantPage";
import { LoginPage } from "./components/LoginPage";
import { PasswordResetPage } from "./components/PasswordResetPage";
import { MyCoursesPage } from "./components/MyCoursesPage";
import { AchievementsPage } from "./components/AchievementsPage";
import { CommunityPage } from "./components/CommunityPage";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { LessonReaderPage } from "./components/LessonReaderPage";
import { AuthTestPage } from "./components/AuthTestPage";
import { GoalsPage } from "./components/GoalsPage";
import { MessagesPage } from "./components/MessagesPage";
import { AdminDashboardPage } from "./components/AdminDashboardPage";
import { SubscriptionPage } from "./components/SubscriptionPage";
import { CrashCoursesPage } from "./components/CrashCoursesPage";
import { authHelpers, apiHelpers } from "./utils/supabase/client";
import { toast, Toaster } from "sonner@2.0.3";

/** Estados posibles de la aplicación (páginas/vistas) */
type AppState = 'home' | 'registration' | 'onboarding' | 'dashboard' | 'ai-quiz' | 'course-map' | 'lesson-reader' | 'teacher-management' | 'student-management' | 'ai-assistant' | 'login' | 'password-reset' | 'my-courses' | 'achievements' | 'community' | 'profile' | 'settings' | 'goals' | 'messages' | 'auth-test' | 'admin' | 'subscription' | 'crash-courses';

/** Roles de usuario en la plataforma */
type UserRole = 'student' | 'teacher' | 'professional' | 'admin' | null;

/** Niveles de experiencia en IA */
type AILevel = 'beginner' | 'intermediate' | 'advanced' | null;

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [aiLevel, setAILevel] = useState<AILevel>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<{courseId: string, lessonId: string} | null>(null);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load and handle URL parameters
  useEffect(() => {
    checkSession();
    checkUrlParameters();
    
    // Listen for custom navigation events
    const handleNavigateToLogin = () => {
      setCurrentState('login');
    };
    
    const handleNavigateToSubscription = () => {
      setCurrentState('subscription');
    };
    
    window.addEventListener('navigate-to-login', handleNavigateToLogin);
    window.addEventListener('navigate-to-subscription', handleNavigateToSubscription);
    
    return () => {
      window.removeEventListener('navigate-to-login', handleNavigateToLogin);
      window.removeEventListener('navigate-to-subscription', handleNavigateToSubscription);
    };
  }, []);

  const checkUrlParameters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // Check for password reset parameters in hash
    if (hash.includes('reset-password')) {
      const hashParams = new URLSearchParams(hash.split('?')[1] || '');
      const email = hashParams.get('email');
      const token = hashParams.get('token');
      
      if (email && token) {
        setCurrentState('password-reset');
        // Clear the URL parameters
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
    }
    
    // Check for password reset parameters in URL
    const email = urlParams.get('email');
    const token = urlParams.get('token');
    const action = urlParams.get('action');
    const test = urlParams.get('test');
    
    if (test === 'auth') {
      setCurrentState('auth-test');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    
    if (action === 'reset-password' && email && token) {
      setCurrentState('password-reset');
      // Clear the URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const checkSession = async () => {
    try {
      const { session, error } = await authHelpers.getSession();
      
      // Handle invalid refresh token error
      if (error) {
        console.log('Session error:', error.message);
        
        // If the refresh token is invalid, clear the session and redirect to home
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('refresh_token_not_found')) {
          console.log('Invalid or expired refresh token detected, clearing session...');
          await authHelpers.signOut();
          setCurrentState('home');
          setIsLoading(false);
          return;
        }
      }
      
      if (session && session.user) {
        setSession(session);
        setUser(session.user);
        
        // Check if admin user (email-based detection for hidden admin access)
        if (session.user.email === 'admin@aniuet.com') {
          console.log('Admin user session detected, redirecting to admin panel...');
          console.log('Admin session structure:', Object.keys(session || {}));
          console.log('Admin session access token available:', !!session?.access_token);
          console.log('Admin session access token value:', session?.access_token?.substring(0, 30) + '...');
          
          setSelectedRole('admin');
          
          // Create admin profile directly from session data
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            name: 'Super Admin',
            role: 'admin',
            aiExperience: 'advanced',
            createdAt: session.user.created_at,
            enrolledCourses: [],
            completedCourses: [],
            xp: 0,
            level: 1
          });
          
          setCurrentState('admin');
          setIsLoading(false);
          return;
        }
        
        // Get user profile from backend
        try {
          console.log('Loading user profile for session check...');
          const profileData = await apiHelpers.getUserProfile(session.access_token);
          
          if (profileData && profileData.user) {
            setUserProfile(profileData.user);
            setSelectedRole(profileData.user.role);
            setAILevel(profileData.user.aiExperience);
            setCurrentState('dashboard');
            console.log('User profile loaded successfully');
          } else {
            console.warn('Profile data is missing user field');
            // Create fallback profile from session data
            handleProfileFallback(session);
          }
        } catch (profileError) {
          console.error('Error loading user profile during session check:', profileError);
          
          // If profile loading fails, try to create a fallback or redirect appropriately
          if (profileError.message?.includes('Authentication failed')) {
            console.log('Token expired, signing out...');
            await authHelpers.signOut();
            setCurrentState('home');
          } else {
            // Create fallback profile from session/user data
            handleProfileFallback(session);
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      
      // Handle refresh token errors in catch block as well
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('refresh_token_not_found')) {
        console.log('Invalid refresh token caught in exception, clearing session...');
        await authHelpers.signOut();
        setCurrentState('home');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileFallback = (session: any) => {
    console.log('Creating fallback profile from session data');
    
    // Create a basic profile from available session data
    const fallbackProfile = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || session.user.email,
      role: session.user.user_metadata?.role || 'student',
      aiExperience: session.user.user_metadata?.aiExperience || 'beginner',
      createdAt: session.user.created_at,
      enrolledCourses: [],
      completedCourses: [],
      xp: 0,
      level: 1
    };
    
    setUserProfile(fallbackProfile);
    setSelectedRole(fallbackProfile.role);
    setAILevel(fallbackProfile.aiExperience);
    setCurrentState('dashboard');
    
    // Show a warning to the user
    toast.warning('Perfil cargado desde datos de sesión. Algunas funciones pueden estar limitadas.');
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentState('registration');
  };

  const handleRegistrationComplete = (level: AILevel, skipOnboarding = false) => {
    setAILevel(level);
    if (skipOnboarding && level === 'advanced') {
      setCurrentState('dashboard');
    } else {
      setCurrentState('onboarding');
    }
  };

  const handleTakeAIQuiz = () => {
    setCurrentState('ai-quiz');
  };

  const handleQuizComplete = (level: AILevel) => {
    setAILevel(level);
    setCurrentState('onboarding');
  };

  const handleQuizApplyLevel = (level: AILevel) => {
    setAILevel(level);
    // No cambiamos el estado, solo aplicamos el nivel
  };

  const handleOnboardingComplete = () => {
    setCurrentState('dashboard');
  };

  const handleCourseSelect = (course: any) => {
    setSelectedCourse(course);
    setCurrentState('course-map');
  };

  const handleLessonSelect = (courseId: string, lessonId: string) => {
    setSelectedLesson({ courseId, lessonId });
    setCurrentState('lesson-reader');
  };

  const handleTeacherManagement = () => {
    setCurrentState('teacher-management');
  };

  const handleStudentManagement = () => {
    setCurrentState('student-management');
  };

  const handleAIAssistant = () => {
    setCurrentState('ai-assistant');
  };

  const handleBackToHome = () => {
    setCurrentState('home');
    setSelectedRole(null);
    setAILevel(null);
    setSelectedCourse(null);
    setSelectedLesson(null);
  };

  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
  };

  const handleMyCourses = () => {
    setCurrentState('my-courses');
  };

  const handleAchievements = () => {
    setCurrentState('achievements');
  };

  const handleCommunity = () => {
    setCurrentState('community');
  };

  const handleProfile = () => {
    setCurrentState('profile');
  };

  const handleSettings = () => {
    setCurrentState('settings');
  };

  const handleGoals = () => {
    setCurrentState('goals');
  };

  const handleMessages = () => {
    setCurrentState('messages');
  };

  const handleSubscription = () => {
    setCurrentState('subscription');
  };

  const handleCrashCourses = () => {
    setCurrentState('crash-courses');
  };

  const handleLogin = () => {
    setCurrentState('login');
  };

  const handlePasswordReset = (email?: string) => {
    setCurrentState('password-reset');
  };

  const handlePasswordResetSuccess = () => {
    setCurrentState('login');
    toast.success('Ahora puedes iniciar sesión con tu nueva contraseña');
  };

  const handleLoginSuccess = async (userData: any, sessionData: any) => {
    setUser(userData);
    setSession(sessionData);
    
    // Check if admin user (email-based detection for hidden admin access)
    if (userData.email === 'admin@aniuet.com') {
      console.log('Admin user detected, redirecting to admin panel...');
      console.log('Admin session data:', sessionData);
      console.log('Admin session structure:', Object.keys(sessionData || {}));
      console.log('Admin access token available:', !!sessionData?.access_token);
      console.log('Admin access token value:', sessionData?.access_token?.substring(0, 30) + '...');
      
      setSelectedRole('admin');
      
      // Create admin profile directly from session data without backend call
      // The admin endpoints will use the access_token directly for verification
      setUserProfile({
        id: userData.id,
        email: userData.email,
        name: 'Super Admin',
        role: 'admin',
        aiExperience: 'advanced',
        createdAt: userData.created_at,
        enrolledCourses: [],
        completedCourses: [],
        xp: 0,
        level: 1
      });
      
      setCurrentState('admin');
      toast.success('¡Bienvenido, Administrador!');
      return;
    }
    
    try {
      console.log('Loading user profile after login...');
      // Get user profile from backend
      const profileData = await apiHelpers.getUserProfile(sessionData.access_token);
      
      if (profileData && profileData.user) {
        setUserProfile(profileData.user);
        setSelectedRole(profileData.user.role);
        setAILevel(profileData.user.aiExperience);
        setCurrentState('dashboard');
        toast.success('¡Sesión iniciada correctamente!');
      } else {
        console.warn('Profile data missing after login');
        handleProfileFallback(sessionData);
      }
    } catch (error) {
      console.error('Error loading user profile after login:', error);
      
      // Handle different types of errors
      if (error.message?.includes('Network error')) {
        toast.error('Error de conexión al cargar el perfil. Verifica tu internet.');
      } else if (error.message?.includes('Authentication failed')) {
        toast.error('Sesión inválida. Por favor, inicia sesión nuevamente.');
        setCurrentState('login');
        return;
      } else {
        toast.warning('Error cargando perfil. Usando datos de sesión.');
      }
      
      // Create fallback profile
      handleProfileFallback(sessionData);
    }
  };

  const handleRegistrationSuccess = async (userData: any, sessionData: any) => {
    setUser(userData);
    setSession(sessionData);
    
    try {
      console.log('Loading user profile after registration...');
      // Get user profile from backend
      const profileData = await apiHelpers.getUserProfile(sessionData.access_token);
      
      if (profileData && profileData.user) {
        setUserProfile(profileData.user);
        setSelectedRole(profileData.user.role);
        setAILevel(profileData.user.aiExperience);
        
        // Skip onboarding if advanced user
        if (profileData.user.aiExperience === 'advanced') {
          setCurrentState('dashboard');
        } else {
          setCurrentState('onboarding');
        }
        
        toast.success('¡Registro completado exitosamente!');
      } else {
        console.warn('Profile data missing after registration');
        handleProfileFallback(sessionData);
      }
    } catch (error) {
      console.error('Error loading user profile after registration:', error);
      
      // Continue with normal flow if profile loading fails
      const fallbackProfile = {
        id: userData.id,
        email: userData.email,
        name: userData.user_metadata?.name || userData.email,
        role: userData.user_metadata?.role || 'student',
        aiExperience: userData.user_metadata?.aiExperience || 'beginner',
        createdAt: userData.created_at,
        enrolledCourses: [],
        completedCourses: [],
        xp: 0,
        level: 1
      };
      
      setUserProfile(fallbackProfile);
      setSelectedRole(fallbackProfile.role);
      setAILevel(fallbackProfile.aiExperience);
      
      const skipOnboarding = fallbackProfile.aiExperience === 'advanced';
      
      if (skipOnboarding) {
        setCurrentState('dashboard');
      } else {
        setCurrentState('onboarding');
      }
      
      toast.warning('Registro exitoso. Perfil creado desde datos de sesión.');
    }
  };

  const handleLogout = async () => {
    try {
      await authHelpers.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setCurrentState('home');
      setSelectedRole(null);
      setAILevel(null);
      setSelectedCourse(null);
      setSelectedLesson(null);
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  if (isLoading) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4285F4]"></div>
          <p className="mt-4 text-gray-600">Cargando ANIUET Scholar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full">
      <Toaster position="top-right" richColors />
      
      {currentState === 'home' && (
        <HomePage 
          onRoleSelect={handleRoleSelect} 
          onLogin={handleLogin}
        />
      )}

      {currentState === 'login' && (
        <LoginPage
          onBack={handleBackToHome}
          onLoginSuccess={handleLoginSuccess}
          onPasswordReset={handlePasswordReset}
        />
      )}

      {currentState === 'password-reset' && (
        <PasswordResetPage
          onBack={() => setCurrentState('login')}
          onSuccess={handlePasswordResetSuccess}
        />
      )}
      
      {currentState === 'registration' && selectedRole && (
        <RegistrationPage
          role={selectedRole}
          onBack={handleBackToHome}
          onComplete={handleRegistrationComplete}
          onTakeQuiz={handleTakeAIQuiz}
          onRegistrationSuccess={handleRegistrationSuccess}
          aiLevel={aiLevel}
        />
      )}
      
      {currentState === 'ai-quiz' && (
        <AILevelQuizPage
          onBack={() => setCurrentState('registration')}
          onComplete={handleQuizComplete}
          onApplyLevel={handleQuizApplyLevel}
        />
      )}
      
      {currentState === 'onboarding' && selectedRole && (
        <OnboardingPage
          role={selectedRole}
          onComplete={handleOnboardingComplete}
        />
      )}
      
      {currentState === 'dashboard' && selectedRole && (
        <DashboardPage
          role={selectedRole}
          aiLevel={aiLevel}
          onLogout={handleLogout}
          onCourseSelect={handleCourseSelect}
          onLessonSelect={handleLessonSelect}
          onTeacherManagement={handleTeacherManagement}
          onStudentManagement={handleStudentManagement}
          onAIAssistant={handleAIAssistant}
          userProfile={userProfile}
          session={session}
          onMyCourses={handleMyCourses}
          onAchievements={handleAchievements}
          onCommunity={handleCommunity}
          onProfile={handleProfile}
          onSettings={handleSettings}
          onGoals={handleGoals}
          onMessages={handleMessages}
          onSubscription={handleSubscription}
          onCrashCourses={handleCrashCourses}
        />
      )}

      {currentState === 'course-map' && selectedCourse && (
        <CourseMapPage
          course={selectedCourse}
          userRole={selectedRole}
          onBack={handleBackToDashboard}
          onLessonSelect={handleLessonSelect}
          session={session}
        />
      )}

      {currentState === 'lesson-reader' && selectedLesson && (
        <LessonReaderPage
          courseId={selectedLesson.courseId}
          lessonId={selectedLesson.lessonId}
          onBack={() => {
            if (selectedCourse) {
              setCurrentState('course-map');
            } else {
              setCurrentState('dashboard');
            }
          }}
          session={session}
        />
      )}

      {currentState === 'teacher-management' && selectedRole === 'teacher' && (
        <TeacherManagementPage
          onBack={handleBackToDashboard}
          onAIAssistant={handleAIAssistant}
          onStudentManagement={handleStudentManagement}
          session={session}
        />
      )}

      {currentState === 'student-management' && selectedRole === 'teacher' && (
        <StudentManagementPage
          onBack={handleBackToDashboard}
          session={session}
        />
      )}

      {currentState === 'ai-assistant' && selectedRole === 'teacher' && (
        <AIAssistantPage
          onBack={handleBackToDashboard}
          session={session}
        />
      )}

      {currentState === 'my-courses' && selectedRole && (
        <MyCoursesPage
          onBack={handleBackToDashboard}
          session={session}
          userProfile={userProfile}
          role={selectedRole}
          onCourseSelect={handleCourseSelect}
          onSubscription={handleSubscription}
        />
      )}

      {currentState === 'achievements' && selectedRole && (
        <AchievementsPage
          onBack={handleBackToDashboard}
          session={session}
          userProfile={userProfile}
          role={selectedRole}
        />
      )}

      {currentState === 'community' && selectedRole && (
        <CommunityPage
          onBack={handleBackToDashboard}
          session={session}
          userProfile={userProfile}
          role={selectedRole}
          onMessages={handleMessages}
        />
      )}

      {currentState === 'messages' && selectedRole && (
        <MessagesPage
          onBack={handleBackToDashboard}
          session={session}
          userProfile={userProfile}
          role={selectedRole}
        />
      )}

      {currentState === 'profile' && selectedRole && (
        <ProfilePage
          onBack={handleBackToDashboard}
          session={session}
          userProfile={userProfile}
          role={selectedRole}
        />
      )}

      {currentState === 'settings' && selectedRole && (
        <SettingsPage
          onBack={handleBackToDashboard}
          session={session}
          userProfile={userProfile}
          role={selectedRole}
          onLogout={handleLogout}
        />
      )}

      {currentState === 'goals' && selectedRole && (
        <GoalsPage
          onBack={handleBackToDashboard}
          session={session}
          userProfile={userProfile}
          role={selectedRole}
        />
      )}

      {currentState === 'subscription' && selectedRole && (
        <SubscriptionPage
          onBack={handleBackToDashboard}
          role={selectedRole}
          session={session}
          userProfile={userProfile}
        />
      )}

      {currentState === 'crash-courses' && selectedRole === 'professional' && (
        <CrashCoursesPage
          onBack={handleBackToDashboard}
          role={selectedRole}
          session={session}
          userProfile={userProfile}
          onCourseSelect={handleCourseSelect}
          onSubscription={handleSubscription}
        />
      )}

      {currentState === 'auth-test' && (
        <AuthTestPage
          onBack={handleBackToHome}
        />
      )}

      {currentState === 'admin' && session && (
        <AdminDashboardPage
          onNavigate={setCurrentState}
          accessToken={session.access_token}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}