import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { 
  ArrowLeft, 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Trophy,
  Users,
  Target,
  TrendingUp
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface MyCoursesPageProps {
  onBack: () => void;
  session: any;
  userProfile: any;
  role: 'student' | 'teacher' | 'professional';
  onCourseSelect: (course: any) => void;
}

export function MyCoursesPage({ onBack, session, userProfile, role, onCourseSelect }: MyCoursesPageProps) {
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [userCourses, setUserCourses] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'enrolled' | 'available'>('enrolled');

  useEffect(() => {
    loadCoursesData();
  }, [session]);

  const loadCoursesData = async () => {
    try {
      setIsLoading(true);
      
      // Load available courses
      const coursesData = await apiHelpers.getAvailableCourses();
      setAvailableCourses(coursesData.courses || []);

      // Load user's courses if authenticated
      if (session?.access_token) {
        try {
          const userCoursesData = await apiHelpers.getUserCourses(session.access_token);
          setUserCourses(userCoursesData);
          
          // Get enrolled course details
          const enrolledDetails = coursesData.courses?.filter(course => 
            userCoursesData.enrolledCourses?.includes(course.id)
          ) || [];
          setEnrolledCourses(enrolledDetails);
        } catch (error) {
          console.log('No user courses found yet');
          setEnrolledCourses([]);
        }
      }

    } catch (error) {
      console.error('Error loading courses data:', error);
      toast.error('Error cargando cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollInCourse = async (courseId: string) => {
    if (!session?.access_token) {
      toast.error('Necesitas iniciar sesión para inscribirte');
      return;
    }

    try {
      await apiHelpers.enrollInCourse(session.access_token, courseId);
      toast.success('¡Te has inscrito al curso exitosamente!');
      loadCoursesData(); // Reload data
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Error al inscribirse al curso');
    }
  };

  const getEnrollmentData = (courseId: string) => {
    return userCourses?.enrollments?.find((e: any) => e.courseId === courseId);
  };

  const getRoleColor = () => {
    switch (role) {
      case 'student': return '#E3701B';
      case 'teacher': return '#4285F4';
      case 'professional': return '#C4423D';
      default: return '#4285F4';
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'student': return 'Mis Cursos de Aprendizaje';
      case 'teacher': return 'Desarrollo Profesional';
      case 'professional': return 'Mis Crash Courses';
      default: return 'Mis Cursos';
    }
  };

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
                  {getRoleTitle()}
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
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/90">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cursos Inscritos</p>
                      <p className="text-xl font-bold">{enrolledCourses.length}</p>
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
              <Card className="bg-white/90">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completados</p>
                      <p className="text-xl font-bold">{userCourses?.completedCourses?.length || 0}</p>
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
              <Card className="bg-white/90">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total XP</p>
                      <p className="text-xl font-bold">{userProfile?.xp || 0}</p>
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
              <Card className="bg-white/90">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nivel</p>
                      <p className="text-xl font-bold">{userProfile?.level || 1}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <Button
              variant={activeTab === 'enrolled' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('enrolled')}
              className={activeTab === 'enrolled' ? 'text-white' : ''}
              style={{ backgroundColor: activeTab === 'enrolled' ? getRoleColor() : undefined }}
            >
              Mis Cursos ({enrolledCourses.length})
            </Button>
            <Button
              variant={activeTab === 'available' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('available')}
              className={activeTab === 'available' ? 'text-white' : ''}
              style={{ backgroundColor: activeTab === 'available' ? getRoleColor() : undefined }}
            >
              Disponibles ({availableCourses.length})
            </Button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <Card className="bg-white/90">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'enrolled' ? (
                enrolledCourses.length > 0 ? (
                  enrolledCourses.map((course, index) => {
                    const enrollment = getEnrollmentData(course.id);
                    const progress = enrollment?.progress || 0;
                    
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => onCourseSelect(course)}
                      >
                        <Card className="bg-white/90 hover:shadow-lg transition-all duration-300">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                                <p className="text-sm text-gray-600">{course.description}</p>
                              </div>
                              {progress === 100 && (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{course.duration}</span>
                                </span>
                                <Badge variant="secondary">{course.difficulty}</Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Progreso</span>
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>

                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{enrollment?.completedLessons?.length || 0}/{course.lessons?.length || 0} lecciones</span>
                                <span>{enrollment?.xpEarned || 0} XP ganados</span>
                              </div>

                              <Button 
                                className="w-full mt-3"
                                style={{ backgroundColor: getRoleColor() }}
                              >
                                {progress > 0 ? (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Continuar
                                  </>
                                ) : (
                                  <>
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Comenzar
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full">
                    <Card className="bg-white/90">
                      <CardContent className="p-8 text-center">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No tienes cursos inscritos</h3>
                        <p className="text-gray-600 mb-4">
                          Explora nuestros cursos disponibles y comienza tu viaje de aprendizaje
                        </p>
                        <Button
                          onClick={() => setActiveTab('available')}
                          style={{ backgroundColor: getRoleColor() }}
                        >
                          Ver Cursos Disponibles
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )
              ) : (
                availableCourses.map((course, index) => {
                  const isEnrolled = userCourses?.enrolledCourses?.includes(course.id);
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-pointer"
                    >
                      <Card className="bg-white/90 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                          <p className="text-sm text-gray-600">{course.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{course.duration}</span>
                              </span>
                              <Badge variant="secondary">{course.difficulty}</Badge>
                            </div>
                            
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{course.lessons?.length || 0} lecciones</span>
                              <span>{course.xpReward || 0} XP total</span>
                            </div>

                            {isEnrolled ? (
                              <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={() => setActiveTab('enrolled')}
                              >
                                Ya inscrito - Ver progreso
                              </Button>
                            ) : (
                              <Button 
                                className="w-full"
                                style={{ backgroundColor: getRoleColor() }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEnrollInCourse(course.id);
                                }}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Inscribirse
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}