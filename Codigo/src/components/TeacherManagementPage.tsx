import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BarChart, 
  Eye,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Download,
  Filter,
  Search,
  Bot,
  CheckCircle,
  Clock,
  AlertCircle,
  Star
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface TeacherManagementPageProps {
  onBack: () => void;
  onAIAssistant: () => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  students: number;
  progress: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  lessons: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number;
  lastActivity: string;
  completedLessons: number;
  totalLessons: number;
  grade: number;
  status: 'active' | 'inactive' | 'at-risk';
}

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introducción a la IA',
    description: 'Curso básico sobre conceptos fundamentales de inteligencia artificial',
    students: 45,
    progress: 75,
    status: 'active',
    createdAt: '2024-01-15',
    lessons: 12
  },
  {
    id: '2',
    title: 'Machine Learning Avanzado',
    description: 'Técnicas avanzadas de aprendizaje automático',
    students: 28,
    progress: 60,
    status: 'active',
    createdAt: '2024-02-20',
    lessons: 16
  },
  {
    id: '3',
    title: 'Neurociencia Computacional',
    description: 'Aplicación de IA en neurociencia',
    students: 0,
    progress: 0,
    status: 'draft',
    createdAt: '2024-03-10',
    lessons: 8
  }
];

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@email.com',
    progress: 85,
    lastActivity: '2024-03-15',
    completedLessons: 10,
    totalLessons: 12,
    grade: 92,
    status: 'active'
  },
  {
    id: '2',
    name: 'Carlos López',
    email: 'carlos.lopez@email.com',
    progress: 45,
    lastActivity: '2024-03-10',
    completedLessons: 5,
    totalLessons: 12,
    grade: 78,
    status: 'active'
  },
  {
    id: '3',
    name: 'María Rodríguez',
    email: 'maria.rodriguez@email.com',
    progress: 25,
    lastActivity: '2024-03-05',
    completedLessons: 3,
    totalLessons: 12,
    grade: 65,
    status: 'at-risk'
  },
  {
    id: '4',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    progress: 0,
    lastActivity: '2024-02-28',
    completedLessons: 0,
    totalLessons: 12,
    grade: 0,
    status: 'inactive'
  }
];

export function TeacherManagementPage({ onBack, onAIAssistant }: TeacherManagementPageProps) {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [students] = useState<Student[]>(mockStudents);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    lessons: ''
  });

  const handleCreateCourse = () => {
    if (newCourse.title && newCourse.description) {
      const course: Course = {
        id: Date.now().toString(),
        title: newCourse.title,
        description: newCourse.description,
        students: 0,
        progress: 0,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
        lessons: parseInt(newCourse.lessons) || 8
      };
      setCourses([...courses, course]);
      setNewCourse({ title: '', description: '', lessons: '' });
      setShowCreateForm(false);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(courses.filter(c => c.id !== courseId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      case 'at-risk': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivado';
      case 'at-risk': return 'En riesgo';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  const calculateAverageProgress = () => {
    const activeStudents = students.filter(s => s.status !== 'inactive');
    return activeStudents.length > 0 
      ? Math.round(activeStudents.reduce((sum, s) => sum + s.progress, 0) / activeStudents.length)
      : 0;
  };

  const calculateAverageGrade = () => {
    const activeStudents = students.filter(s => s.status !== 'inactive' && s.grade > 0);
    return activeStudents.length > 0 
      ? Math.round(activeStudents.reduce((sum, s) => sum + s.grade, 0) / activeStudents.length)
      : 0;
  };

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
                🧑‍🏫 Gestión del Maestro
              </h1>
              <p className="text-gray-600">Administra tus cursos y supervisa a tus estudiantes</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={onAIAssistant} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Bot className="w-4 h-4 mr-2" />
              Asistente IA
            </Button>
            {showCreateForm ? (
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancelar
              </Button>
            ) : (
              <Button onClick={() => setShowCreateForm(true)} className="bg-[#4285F4] hover:bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear Curso
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="bg-white/80 backdrop-blur-sm border-b p-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{courses.filter(c => c.status === 'active').length}</div>
                <div className="text-sm text-gray-600">Cursos Activos</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{students.filter(s => s.status === 'active').length}</div>
                <div className="text-sm text-gray-600">Estudiantes Activos</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{calculateAverageProgress()}%</div>
                <div className="text-sm text-gray-600">Progreso Promedio</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{calculateAverageGrade()}</div>
                <div className="text-sm text-gray-600">Calificación Promedio</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Course Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm border-b p-4 relative z-10"
        >
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-[#4285F4]">Crear Nuevo Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título del Curso *</Label>
                    <Input
                      id="title"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                      placeholder="Ej: Introducción a Deep Learning"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lessons">Número de Lecciones</Label>
                    <Input
                      id="lessons"
                      type="number"
                      value={newCourse.lessons}
                      onChange={(e) => setNewCourse({...newCourse, lessons: e.target.value})}
                      placeholder="8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    placeholder="Describe los objetivos y contenido del curso..."
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button onClick={handleCreateCourse} className="bg-[#4285F4] hover:bg-blue-600 text-white">
                    Crear Curso
                  </Button>
                  <Button onClick={() => setShowCreateForm(false)} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="courses">Gestión de Cursos</TabsTrigger>
              <TabsTrigger value="students">Reporte de Alumnos</TabsTrigger>
              <TabsTrigger value="analytics">Analíticas</TabsTrigger>
            </TabsList>
            
            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <div className="grid gap-4">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow bg-white/90">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                              <Badge className={getStatusColor(course.status)}>
                                {getStatusLabel(course.status)}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-4">{course.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{course.students} estudiantes</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{course.lessons} lecciones</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">Creado: {course.createdAt}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{course.progress}% progreso</span>
                              </div>
                            </div>
                            
                            {course.status === 'active' && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Progreso del curso</span>
                                  <span>{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} className="h-2" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            
            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Reporte de Estudiantes</h3>
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input placeholder="Buscar estudiante..." className="pl-10" />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
              
              <Card className="bg-white/90">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estudiante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progreso
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Calificación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Última Actividad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student, index) => (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="text-sm text-gray-900">
                                  {student.completedLessons}/{student.totalLessons} lecciones
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${student.progress}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-500">{student.progress}%</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium">{student.grade}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.lastActivity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(student.status)}>
                                {getStatusLabel(student.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button size="sm" variant="outline">
                                Ver Detalle
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart className="w-5 h-5 text-blue-600" />
                      <span>Distribución de Progreso</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completado (80-100%)</span>
                        <span className="text-sm font-medium">1 estudiante</span>
                      </div>
                      <Progress value={25} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">En progreso (40-79%)</span>
                        <span className="text-sm font-medium">1 estudiante</span>
                      </div>
                      <Progress value={25} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Iniciando (1-39%)</span>
                        <span className="text-sm font-medium">1 estudiante</span>
                      </div>
                      <Progress value={25} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Sin iniciar (0%)</span>
                        <span className="text-sm font-medium">1 estudiante</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span>Estudiantes en Riesgo</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {students.filter(s => s.status === 'at-risk' || s.status === 'inactive').map(student => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{student.name}</div>
                            <div className="text-xs text-gray-600">{student.progress}% progreso</div>
                          </div>
                          <Badge className={getStatusColor(student.status)}>
                            {getStatusLabel(student.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}