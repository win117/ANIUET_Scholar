import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { RegistrationPage } from "./components/RegistrationPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { DashboardPage } from "./components/DashboardPage";
import { AILevelQuizPage } from "./components/AILevelQuizPage";
import { CourseMapPage } from "./components/CourseMapPage";
import { TeacherManagementPage } from "./components/TeacherManagementPage";
import { AIAssistantPage } from "./components/AIAssistantPage";

type AppState = 'home' | 'registration' | 'onboarding' | 'dashboard' | 'ai-quiz' | 'course-map' | 'teacher-management' | 'ai-assistant' | 'login';
type UserRole = 'student' | 'teacher' | 'professional' | null;
type AILevel = 'beginner' | 'intermediate' | 'advanced' | null;

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [aiLevel, setAILevel] = useState<AILevel>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

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

  const handleOnboardingComplete = () => {
    setCurrentState('dashboard');
  };

  const handleCourseSelect = (course: any) => {
    setSelectedCourse(course);
    setCurrentState('course-map');
  };

  const handleTeacherManagement = () => {
    setCurrentState('teacher-management');
  };

  const handleAIAssistant = () => {
    setCurrentState('ai-assistant');
  };

  const handleBackToHome = () => {
    setCurrentState('home');
    setSelectedRole(null);
    setAILevel(null);
    setSelectedCourse(null);
  };

  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
  };

  const handleLogin = () => {
    // For demo purposes, we'll show a simple alert and redirect to dashboard
    // In a real app, this would handle authentication
    const role = prompt('Demo: Selecciona tu rol (student/teacher/professional)') as UserRole;
    if (role && ['student', 'teacher', 'professional'].includes(role)) {
      setSelectedRole(role);
      setAILevel('intermediate'); // Demo default
      setCurrentState('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentState('home');
    setSelectedRole(null);
    setAILevel(null);
    setSelectedCourse(null);
  };

  return (
    <div className="size-full">
      {currentState === 'home' && (
        <HomePage 
          onRoleSelect={handleRoleSelect} 
          onLogin={handleLogin}
        />
      )}
      
      {currentState === 'registration' && selectedRole && (
        <RegistrationPage
          role={selectedRole}
          onBack={handleBackToHome}
          onComplete={handleRegistrationComplete}
          onTakeQuiz={handleTakeAIQuiz}
        />
      )}
      
      {currentState === 'ai-quiz' && (
        <AILevelQuizPage
          onBack={() => setCurrentState('registration')}
          onComplete={handleQuizComplete}
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
          onTeacherManagement={handleTeacherManagement}
          onAIAssistant={handleAIAssistant}
        />
      )}

      {currentState === 'course-map' && selectedCourse && (
        <CourseMapPage
          course={selectedCourse}
          userRole={selectedRole}
          onBack={handleBackToDashboard}
        />
      )}

      {currentState === 'teacher-management' && selectedRole === 'teacher' && (
        <TeacherManagementPage
          onBack={handleBackToDashboard}
          onAIAssistant={handleAIAssistant}
        />
      )}

      {currentState === 'ai-assistant' && selectedRole === 'teacher' && (
        <AIAssistantPage
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
}