import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { 
  ArrowLeft, 
  Trophy, 
  Star, 
  Target, 
  CheckCircle, 
  Lock,
  TrendingUp,
  Zap,
  Award,
  Crown,
  Medal,
  Flame
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface AchievementsPageProps {
  onBack: () => void;
  session: any;
  userProfile: any;
  role: 'student' | 'teacher' | 'professional';
}

export function AchievementsPage({ onBack, session, userProfile, role }: AchievementsPageProps) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);

  useEffect(() => {
    loadAchievementsData();
  }, [userProfile]);

  const loadAchievementsData = () => {
    // Get user's completed achievements from their profile
    const completedAchievements = userProfile?.achievements || [];
    setUserAchievements(completedAchievements);

    // Define achievements based on role
    const allAchievements = getAchievementsByRole();
    setAchievements(allAchievements);
  };

  const getAchievementsByRole = () => {
    const baseAchievements = [
      {
        id: 'first-login',
        title: 'Primer Paso',
        description: 'Completaste tu primer inicio de sesión',
        icon: '🚀',
        category: 'Inicio',
        xpReward: 50,
        rarity: 'common',
        condition: () => true // Always achieved on first login
      },
      {
        id: 'profile-complete',
        title: 'Perfil Completo',
        description: 'Completaste toda la información de tu perfil',
        icon: '👤',
        category: 'Perfil',
        xpReward: 100,
        rarity: 'common',
        condition: () => userProfile?.name && userProfile?.email
      },
      {
        id: 'first-course',
        title: 'Primer Curso',
        description: 'Te inscribiste en tu primer curso',
        icon: '📚',
        category: 'Aprendizaje',
        xpReward: 150,
        rarity: 'common',
        condition: () => (userProfile?.enrolledCourses?.length || 0) > 0
      },
      {
        id: 'course-complete',
        title: 'Curso Completado',
        description: 'Completaste tu primer curso',
        icon: '🎓',
        category: 'Aprendizaje',
        xpReward: 300,
        rarity: 'uncommon',
        condition: () => (userProfile?.completedCourses?.length || 0) > 0
      },
      {
        id: 'xp-hunter',
        title: 'Cazador de XP',
        description: 'Alcanzaste 1000 XP',
        icon: '⚡',
        category: 'Progreso',
        xpReward: 200,
        rarity: 'uncommon',
        condition: () => (userProfile?.xp || 0) >= 1000
      },
      {
        id: 'level-up',
        title: 'Subida de Nivel',
        description: 'Alcanzaste el nivel 5',
        icon: '📈',
        category: 'Progreso',
        xpReward: 250,
        rarity: 'uncommon',
        condition: () => (userProfile?.level || 1) >= 5
      },
      {
        id: 'streak-week',
        title: 'Racha Semanal',
        description: 'Mantuviste una racha de 7 días',
        icon: '🔥',
        category: 'Constancia',
        xpReward: 350,
        rarity: 'rare',
        condition: () => (userProfile?.currentStreak || 0) >= 7
      }
    ];

    // Add role-specific achievements
    switch (role) {
      case 'student':
        return [...baseAchievements, 
          {
            id: 'dedicated-student',
            title: 'Estudiante Dedicado',
            description: 'Completaste 3 cursos',
            icon: '🌟',
            category: 'Aprendizaje',
            xpReward: 500,
            rarity: 'rare',
            condition: () => (userProfile?.completedCourses?.length || 0) >= 3
          },
          {
            id: 'ai-master',
            title: 'Maestro de IA',
            description: 'Completaste todos los cursos de IA básicos',
            icon: '🤖',
            category: 'Especialización',
            xpReward: 1000,
            rarity: 'legendary',
            condition: () => (userProfile?.completedCourses?.length || 0) >= 5
          }
        ];
      case 'teacher':
        return [...baseAchievements,
          {
            id: 'first-course-created',
            title: 'Primer Curso Creado',
            description: 'Creaste tu primer curso',
            icon: '✏️',
            category: 'Enseñanza',
            xpReward: 400,
            rarity: 'uncommon',
            condition: () => (userProfile?.createdCourses?.length || 0) > 0
          },
          {
            id: 'popular-teacher',
            title: 'Maestro Popular',
            description: 'Tus cursos tienen más de 50 estudiantes',
            icon: '👨‍🏫',
            category: 'Enseñanza',
            xpReward: 800,
            rarity: 'rare',
            condition: () => (userProfile?.totalStudents || 0) >= 50
          }
        ];
      case 'professional':
        return [...baseAchievements,
          {
            id: 'crash-course-master',
            title: 'Maestro de Crash Courses',
            description: 'Completaste 5 crash courses',
            icon: '⚡',
            category: 'Eficiencia',
            xpReward: 600,
            rarity: 'rare',
            condition: () => (userProfile?.completedCourses?.length || 0) >= 5
          },
          {
            id: 'time-efficient',
            title: 'Eficiencia Temporal',
            description: 'Completaste un curso en menos de 2 horas',
            icon: '⏱️',
            category: 'Eficiencia',
            xpReward: 400,
            rarity: 'uncommon',
            condition: () => userProfile?.fastCompletion || false
          }
        ];
      default:
        return baseAchievements;
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'uncommon': return 'bg-green-100 text-green-800 border-green-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Medal className="w-4 h-4" />;
      case 'uncommon': return <Award className="w-4 h-4" />;
      case 'rare': return <Trophy className="w-4 h-4" />;
      case 'epic': return <Crown className="w-4 h-4" />;
      case 'legendary': return <Star className="w-4 h-4" />;
      default: return <Medal className="w-4 h-4" />;
    }
  };

  const isAchievementUnlocked = (achievement: any) => {
    return achievement.condition() || userAchievements.includes(achievement.id);
  };

  const getUnlockedCount = () => {
    return achievements.filter(achievement => isAchievementUnlocked(achievement)).length;
  };

  const getTotalXP = () => {
    return achievements
      .filter(achievement => isAchievementUnlocked(achievement))
      .reduce((total, achievement) => total + achievement.xpReward, 0);
  };

  const categories = [...new Set(achievements.map(a => a.category))];

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
                  Mis Logros
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
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-yellow-700">Logros Desbloqueados</p>
                      <p className="text-xl font-bold text-yellow-800">
                        {getUnlockedCount()}/{achievements.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700">XP de Logros</p>
                      <p className="text-xl font-bold text-purple-800">{getTotalXP()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Progreso</p>
                      <p className="text-xl font-bold text-green-800">
                        {Math.round((getUnlockedCount() / achievements.length) * 100)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-700">Nivel Actual</p>
                      <p className="text-xl font-bold text-orange-800">{userProfile?.level || 1}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Card className="bg-white/90">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Progreso General de Logros</h3>
                  <span className="text-sm text-gray-600">
                    {getUnlockedCount()} de {achievements.length} logros completados
                  </span>
                </div>
                <Progress 
                  value={(getUnlockedCount() / achievements.length) * 100} 
                  className="h-4"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements by Category */}
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + categoryIndex * 0.1 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <span>{category}</span>
                <Badge variant="secondary">
                  {achievements.filter(a => a.category === category && isAchievementUnlocked(a)).length}/
                  {achievements.filter(a => a.category === category).length}
                </Badge>
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements
                  .filter(achievement => achievement.category === category)
                  .map((achievement, index) => {
                    const isUnlocked = isAchievementUnlocked(achievement);
                    
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
                      >
                        <Card className={`transition-all duration-300 ${
                          isUnlocked 
                            ? 'bg-white/90 shadow-lg border-2' 
                            : 'bg-gray-100/90 opacity-60'
                        }`}
                        style={{
                          borderColor: isUnlocked ? getRoleColor() : 'transparent'
                        }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                                isUnlocked ? 'bg-gradient-to-r from-yellow-100 to-yellow-200' : 'bg-gray-200'
                              }`}>
                                {isUnlocked ? achievement.icon : '🔒'}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className={`font-semibold ${
                                    isUnlocked ? 'text-gray-900' : 'text-gray-500'
                                  }`}>
                                    {achievement.title}
                                  </h3>
                                  {isUnlocked && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  )}
                                  {!isUnlocked && (
                                    <Lock className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                
                                <p className={`text-sm mb-3 ${
                                  isUnlocked ? 'text-gray-600' : 'text-gray-400'
                                }`}>
                                  {achievement.description}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <Badge className={getRarityColor(achievement.rarity)}>
                                    {getRarityIcon(achievement.rarity)}
                                    <span className="ml-1 capitalize">{achievement.rarity}</span>
                                  </Badge>
                                  
                                  <span className={`text-sm font-medium ${
                                    isUnlocked ? 'text-purple-600' : 'text-gray-400'
                                  }`}>
                                    +{achievement.xpReward} XP
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            </motion.div>
          ))}

          {/* Empty State */}
          {achievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay logros disponibles</h3>
              <p className="text-gray-600">
                Los logros se irán desbloqueando a medida que uses la plataforma
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}