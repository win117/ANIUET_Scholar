import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  BookOpen,
  TrendingUp,
  Award,
  Search,
  Filter,
  Download,
  Eye,
  UserPlus,
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mail,
  Calendar,
  Target,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { apiHelpers } from "../utils/supabase/client";
import { projectId } from "../utils/supabase/info";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface StudentManagementPageProps {
  onBack: () => void;
  session?: any;
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  enrollments: any[];
  xp: number;
  level: number;
  lastActivity: string;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  lessons: any[];
}

export function StudentManagementPage({ onBack, session }: StudentManagementPageProps) {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showInviteCodeDialog, setShowInviteCodeDialog] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [session]);

  const loadInitialData = async () => {
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load students and courses in parallel
      await Promise.all([
        fetchStudents(),
        fetchCourses()
      ]);

      console.log('📊 Datos cargados - Estudiantes:', students?.length || 0);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/students`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.students || []);
        return data.students;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error al cargar estudiantes');
      return [];
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await apiHelpers.getAvailableCourses();
      if (data.success) {
        setCourses(data.courses || []);
        return data.courses;
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Error al cargar cursos');
      return [];
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentEmail.trim()) {
      toast.error('Por favor ingresa el email del estudiante');
      return;
    }

    setIsAddingStudent(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/students/add`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ studentEmail: newStudentEmail.trim() })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Estudiante ${data.student.name} agregado exitosamente`);
        setNewStudentEmail('');
        setShowAddStudentDialog(false);
        await fetchStudents(); // Refresh the list
      } else {
        toast.error(data.error || 'Error al agregar estudiante');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Error al agregar estudiante');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleEnrollStudent = async (studentId: string, courseId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/students/enroll`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ studentId, courseId })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        const student = students.find(s => s.id === studentId);
        const course = courses.find(c => c.id === courseId);
        toast.success(`${student?.name} inscrito en ${course?.title}`);
        await fetchStudents(); // Refresh the list
      } else {
        toast.error(data.error || 'Error al inscribir estudiante');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error('Error al inscribir estudiante');
    }
  };

  const handleGenerateInviteCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/class/invite-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setInviteCode(data.inviteCode);
        setShowInviteCodeDialog(true);
        toast.success('Código de invitación generado');
      } else {
        toast.error(data.error || 'Error al generar código');
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast.error('Error al generar código de invitación');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success('Código copiado al portapapeles');
    } catch (error) {
      toast.error('Error al copiar código');
    }
  };

  const loadCourseProgress = async (courseId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/courses/${courseId}/progress`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        // Backend returns data.data with students array
        const progressData = data.data || {};
        const studentsArray = progressData.students || [];
        
        // Transform to match expected format
        const formattedProgress = studentsArray.map(student => ({
          student: {
            id: student.id,
            name: student.name,
            email: student.email
          },
          enrollment: {
            progress: student.progress,
            completedLessonsCount: student.completedLessons
          },
          lastActivity: student.lastActivity,
          xp: student.xpEarned || 0
        }));
        
        setCourseProgress(formattedProgress);
      } else {
        toast.error(data.error || 'Error al cargar progreso');
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
      toast.error('Error al cargar progreso del curso');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateStats = () => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => {
      const lastActivity = new Date(s.lastActivity);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastActivity > weekAgo;
    }).length;
    
    const averageXP = totalStudents > 0 
      ? Math.round(students.reduce((sum, s) => sum + (s.xp || 0), 0) / totalStudents)
      : 0;

    const totalEnrollments = students.reduce((sum, s) => sum + (s.enrollments?.length || 0), 0);

    return { totalStudents, activeStudents, averageXP, totalEnrollments };
  };

  const stats = calculateStats();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getActivityStatus = (lastActivity: string) => {
    const lastActive = new Date(lastActivity);
    const now = new Date();
    const diffDays = (now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24);

    if (diffDays <= 1) return { status: 'Activo', color: 'bg-green-100 text-green-800' };
    if (diffDays <= 7) return { status: 'Reciente', color: 'bg-blue-100 text-blue-800' };
    if (diffDays <= 30) return { status: 'Inactivo', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Muy Inactivo', color: 'bg-red-100 text-red-800' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4285F4]"></div>
          <p className="mt-4 text-gray-600">Cargando gestión de estudiantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <DynamicBackground variant="teacher-management" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b p-4 relative z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logo} alt="ANIUET Scholar" className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold text-[#4285F4]">
                👥 Gestión de Estudiantes
              </h1>
              <p className="text-gray-600">Administra y supervisa a tus estudiantes</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleGenerateInviteCode}
              disabled={isGeneratingCode}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGeneratingCode ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              Código de Invitación
            </Button>
            <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#4285F4] hover:bg-blue-600 text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar Estudiante
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Estudiante</DialogTitle>
                  <DialogDescription>
                    Ingresa el email del estudiante que deseas agregar a tu clase.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="student-email">Email del Estudiante</Label>
                    <Input
                      id="student-email"
                      type="email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="estudiante@email.com"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleAddStudent}
                      disabled={isAddingStudent}
                      className="flex-1"
                    >
                      {isAddingStudent ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Agregar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddStudentDialog(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="bg-white/80 backdrop-blur-sm border-b p-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Estudiantes</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.activeStudents}</div>
                <div className="text-sm text-gray-600">Activos (7 días)</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.averageXP}</div>
                <div className="text-sm text-gray-600">XP Promedio</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</div>
                <div className="text-sm text-gray-600">Inscripciones Totales</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students">Estudiantes</TabsTrigger>
              <TabsTrigger value="enrollments">Inscripciones</TabsTrigger>
              <TabsTrigger value="progress">Progreso por Curso</TabsTrigger>
            </TabsList>
            
            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input 
                      placeholder="Buscar estudiantes..." 
                      className="pl-10 w-80"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>

              {/* Students List */}
              <div className="grid gap-4">
                {filteredStudents.map((student, index) => {
                  const activityStatus = getActivityStatus(student.lastActivity);
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow bg-white/90">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                                <p className="text-gray-600">{student.email}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <Badge className={activityStatus.color}>
                                    {activityStatus.status}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Nivel {student.level} • {student.xp} XP
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {student.enrollments?.length || 0} cursos
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <Select onValueChange={(courseId) => handleEnrollStudent(student.id, courseId)}>
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Inscribir en curso" />
                                </SelectTrigger>
                                <SelectContent>
                                  {courses.filter(course => 
                                    !student.enrolledCourses?.includes(course.id)
                                  ).map(course => (
                                    <SelectItem key={course.id} value={course.id}>
                                      {course.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalle
                              </Button>
                            </div>
                          </div>
                          
                          {/* Student's Course Progress */}
                          {student.enrollments && student.enrollments.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Progreso en Cursos</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {student.enrollments.map((enrollment, idx) => {
                                  const course = courses.find(c => c.id === enrollment.courseId);
                                  return (
                                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">{course?.title || 'Curso'}</span>
                                        <span className={`text-sm font-bold ${getProgressColor(enrollment.progress)}`}>
                                          {enrollment.progress}%
                                        </span>
                                      </div>
                                      <Progress value={enrollment.progress} className="h-2" />
                                      <div className="text-xs text-gray-500 mt-1">
                                        {enrollment.completedLessons?.length || 0} lecciones completadas
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
              
              {filteredStudents.length === 0 && (
                <Card className="bg-white/90">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {searchTerm ? 'No se encontraron estudiantes' : 'No tienes estudiantes aún'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm 
                        ? 'Intenta con otros términos de búsqueda'
                        : 'Comienza agregando estudiantes a tu clase'
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setShowAddStudentDialog(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Agregar Primer Estudiante
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Enrollments Tab */}
            <TabsContent value="enrollments" className="space-y-6">
              <div className="grid gap-4">
                {courses.map((course, index) => {
                  const enrolledStudents = students.filter(s => 
                    s.enrolledCourses?.includes(course.id)
                  );
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-white/90">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                              <p className="text-gray-600">{course.description}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <Badge variant="outline">{course.difficulty}</Badge>
                                <span className="text-sm text-gray-500">{course.duration}</span>
                                <span className="text-sm text-gray-500">
                                  {enrolledStudents.length} estudiantes inscritos
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedCourse(course.id);
                                setActiveTab('progress');
                                loadCourseProgress(course.id);
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Ver Progreso
                            </Button>
                          </div>
                          
                          {enrolledStudents.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {enrolledStudents.map(student => {
                                const enrollment = student.enrollments?.find(e => e.courseId === course.id);
                                return (
                                  <div key={student.id} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {student.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-sm font-medium">{student.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs text-gray-600">Progreso</span>
                                      <span className={`text-xs font-bold ${getProgressColor(enrollment?.progress || 0)}`}>
                                        {enrollment?.progress || 0}%
                                      </span>
                                    </div>
                                    <Progress value={enrollment?.progress || 0} className="h-1" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <div className="flex items-center space-x-4">
                <Select value={selectedCourse} onValueChange={(value) => {
                  setSelectedCourse(value);
                  loadCourseProgress(value);
                }}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => selectedCourse && loadCourseProgress(selectedCourse)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>

              {selectedCourse && courseProgress.length > 0 && (
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle>
                      Progreso Detallado - {courses.find(c => c.id === selectedCourse)?.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courseProgress.map((studentProgress, index) => (
                        <motion.div
                          key={studentProgress.student.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {studentProgress.student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-semibold">{studentProgress.student.name}</h4>
                                <p className="text-sm text-gray-600">{studentProgress.student.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${getProgressColor(studentProgress.enrollment.progress)}`}>
                                {studentProgress.enrollment.progress}%
                              </div>
                              <div className="text-sm text-gray-600">
                                {studentProgress.enrollment.completedLessonsCount} lecciones
                              </div>
                            </div>
                          </div>
                          
                          <Progress value={studentProgress.enrollment.progress} className="h-3 mb-2" />
                          
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Último acceso: {new Date(studentProgress.lastActivity).toLocaleDateString()}</span>
                            <span>{studentProgress.xp} XP total</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedCourse && courseProgress.length === 0 && (
                <Card className="bg-white/90">
                  <CardContent className="p-12 text-center">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No hay estudiantes inscritos
                    </h3>
                    <p className="text-gray-500">
                      Este curso aún no tiene estudiantes inscritos
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Invite Code Dialog */}
      <Dialog open={showInviteCodeDialog} onOpenChange={setShowInviteCodeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Código de Invitación Generado</DialogTitle>
            <DialogDescription>
              Comparte este código con tus estudiantes para que se unan a tu clase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-6 mb-4">
                <div className="text-3xl font-bold text-[#4285F4] tracking-wider">
                  {inviteCode}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Comparte este código con tus estudiantes para que se unan a tu clase
              </p>
              <Button onClick={copyInviteCode} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Código
              </Button>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Este código expira en 7 días
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}