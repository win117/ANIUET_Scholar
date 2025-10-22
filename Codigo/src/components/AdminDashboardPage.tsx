/**
 * AdminDashboardPage.tsx - Panel de Administración de ANIUET Scholar
 * 
 * Panel completo para super usuarios con capacidades de:
 * - Gestión de cursos (crear, editar, eliminar)
 * - Gestión de lecciones (agregar contenido, PDFs, videos)
 * - Visualización de usuarios
 * - Estadísticas de la plataforma
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { apiHelpers, authHelpers } from '../utils/supabase/client';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Plus, 
  Edit, 
  Save, 
  X, 
  FileText, 
  Video, 
  Upload,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  LogOut,
  Map
} from 'lucide-react';
import { CourseEditorPage } from './CourseEditorPage';

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
  accessToken: string;
  userProfile: any;
}

export function AdminDashboardPage({ onNavigate, accessToken, userProfile }: AdminDashboardPageProps) {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCourseEditor, setShowCourseEditor] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    courseCode: '',
    type: 'custom',
    status: 'active'
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    pdfUrl: '',
    duration: 30,
    order: 0,
    locked: false
  });

  useEffect(() => {
    console.log('=== AdminDashboardPage mounted ===');
    console.log('Access token prop:', accessToken ? 'Present (length: ' + accessToken.length + ')' : 'Missing/undefined');
    console.log('Access token type:', typeof accessToken);
    console.log('Access token value:', accessToken);
    console.log('User profile:', userProfile);
    
    // Try to get token from Supabase session if not provided
    if (!accessToken) {
      console.log('No access token provided, trying to get from Supabase session...');
      (async () => {
        const { authHelpers } = await import('../utils/supabase/client');
        const { data: sessionData } = await authHelpers.getSession();
        if (sessionData?.session?.access_token) {
          console.log('Found access token in Supabase session');
          console.log('Token:', sessionData.session.access_token.substring(0, 30) + '...');
        } else {
          console.error('No session found in Supabase');
        }
      })();
    }
    
    testAuth();
    loadData();
  }, []);

  const testAuth = async () => {
    if (!accessToken) return;
    
    try {
      console.log('=== TESTING AUTHENTICATION ===');
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/test-auth`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('Auth test result:', result);
      
      if (!result.success) {
        console.error('❌ Auth test failed:', result);
      } else {
        console.log('✅ Auth test passed');
      }
    } catch (error) {
      console.error('Auth test error:', error);
    }
  };

  const loadData = async () => {
    if (!accessToken) {
      console.error('No access token available for admin operations');
      toast.error('No hay token de acceso disponible. Por favor, inicia sesión nuevamente.');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading admin data with token:', accessToken.substring(0, 20) + '...');
      
      const [coursesData, usersData, statsData] = await Promise.all([
        apiHelpers.adminGetCourses(accessToken),
        apiHelpers.adminGetUsers(accessToken),
        apiHelpers.adminGetStats(accessToken)
      ]);

      console.log('Admin data loaded successfully');
      console.log('Courses received:', coursesData.courses);
      console.log('Number of courses:', coursesData.courses?.length);
      
      // Log each course's lessons
      coursesData.courses?.forEach((course: any, index: number) => {
        console.log(`Course ${index} (${course.id}):`, {
          title: course.title,
          lessonsCount: course.lessons?.length,
          hasLessons: Array.isArray(course.lessons),
          firstLesson: course.lessons?.[0]
        });
      });
      
      setCourses(coursesData.courses || []);
      setUsers(usersData.users || []);
      setStats(statsData.stats || null);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    try {
      const courseData = {
        ...courseForm,
        id: selectedCourse?.id
      };

      const result = await apiHelpers.adminSaveCourse(accessToken, courseData);
      
      toast.success(result.message || 'Curso guardado exitosamente');
      setIsEditingCourse(false);
      setCourseForm({
        title: '',
        description: '',
        difficulty: 'beginner',
        courseCode: '',
        type: 'custom',
        status: 'active'
      });
      setSelectedCourse(null);
      loadData();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Error al guardar curso: ' + error.message);
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourse) {
      toast.error('Selecciona un curso primero');
      return;
    }

    try {
      const lessonData = {
        ...lessonForm,
        id: selectedLesson?.id
      };

      const result = await apiHelpers.adminSaveLesson(accessToken, selectedCourse.id, lessonData);
      
      toast.success(result.message || 'Lección guardada exitosamente');
      setIsEditingLesson(false);
      setLessonForm({
        title: '',
        description: '',
        content: '',
        videoUrl: '',
        pdfUrl: '',
        duration: 30,
        order: 0,
        locked: false
      });
      setSelectedLesson(null);
      loadData();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Error al guardar lección: ' + error.message);
    }
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      difficulty: course.difficulty || 'beginner',
      courseCode: course.courseCode || '',
      type: course.type || 'custom',
      status: course.status || 'active'
    });
    setIsEditingCourse(true);
  };

  const handleEditLesson = (course: any, lesson: any) => {
    setSelectedCourse(course);
    setSelectedLesson(lesson);
    setLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      pdfUrl: lesson.pdfUrl || '',
      duration: lesson.duration || 30,
      order: lesson.order || 0,
      locked: lesson.locked || false
    });
    setIsEditingLesson(true);
  };

  const handleOpenVisualEditor = (course: any) => {
    console.log('=== OPENING VISUAL EDITOR ===');
    console.log('Course to edit:', course);
    console.log('Course lessons:', course.lessons);
    console.log('Lessons count:', course.lessons?.length);
    console.log('Is lessons an array?', Array.isArray(course.lessons));
    
    if (course.lessons && Array.isArray(course.lessons)) {
      console.log('First lesson:', course.lessons[0]);
      console.log('All lessons:', course.lessons);
    }
    
    setCourseToEdit(course);
    setShowCourseEditor(true);
  };

  const handleCloseVisualEditor = () => {
    setShowCourseEditor(false);
    setCourseToEdit(null);
    loadData(); // Reload data after editing
  };

  const handleInitializeMockCourses = async () => {
    try {
      setLoading(true);
      const { projectId } = await import('../utils/supabase/info');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/init-mock-courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Cursos mock inicializados con éxito');
        await loadData(); // Reload to show updated courses
      } else {
        toast.error('Error al inicializar cursos: ' + result.error);
      }
    } catch (error) {
      console.error('Error initializing mock courses:', error);
      toast.error('Error al inicializar cursos mock');
    } finally {
      setLoading(false);
    }
  };

  // Show Course Editor if selected
  if (showCourseEditor && courseToEdit) {
    return (
      <CourseEditorPage
        course={courseToEdit}
        onBack={handleCloseVisualEditor}
        accessToken={accessToken}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900">Panel de Administración</h1>
                <p className="text-slate-600 text-sm">Gestión completa de ANIUET Scholar</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  await authHelpers.signOut();
                  toast.success('Sesión cerrada correctamente');
                  onNavigate('home');
                } catch (error) {
                  console.error('Error during logout:', error);
                  toast.error('Error al cerrar sesión');
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-slate-900">{stats.users.total}</div>
                <p className="text-xs text-slate-500">
                  {stats.users.students} estudiantes, {stats.users.teachers} maestros
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Total Cursos</CardTitle>
                <BookOpen className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-slate-900">{stats.courses.total}</div>
                <p className="text-xs text-slate-500">
                  {stats.courses.mock} mock, {stats.courses.custom} personalizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Inscripciones</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-slate-900">{stats.engagement.totalEnrollments}</div>
                <p className="text-xs text-slate-500">Total de inscripciones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Comunidad</CardTitle>
                <Award className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-slate-900">{stats.engagement.communityPosts}</div>
                <p className="text-xs text-slate-500">Posts en comunidad</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Cursos</CardTitle>
                    <CardDescription>Crea, edita y gestiona todos los cursos de la plataforma</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleInitializeMockCourses}
                      disabled={loading}
                      className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Inicializar Mock
                    </Button>
                    <Dialog open={isEditingCourse} onOpenChange={setIsEditingCourse}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setSelectedCourse(null);
                          setCourseForm({
                            title: '',
                            description: '',
                            difficulty: 'beginner',
                            courseCode: '',
                            type: 'custom',
                            status: 'active'
                          });
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Curso
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{selectedCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}</DialogTitle>
                          <DialogDescription>
                            Completa los detalles del curso
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Título del Curso</Label>
                            <Input
                              value={courseForm.title}
                              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                              placeholder="Ej: Fundamentos de IA"
                            />
                          </div>
                          <div>
                            <Label>Descripción</Label>
                            <Textarea
                              value={courseForm.description}
                              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                              placeholder="Descripción detallada del curso"
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Dificultad</Label>
                              <Select value={courseForm.difficulty} onValueChange={(value) => setCourseForm({ ...courseForm, difficulty: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">Principiante</SelectItem>
                                  <SelectItem value="intermediate">Intermedio</SelectItem>
                                  <SelectItem value="advanced">Avanzado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Código del Curso</Label>
                              <Input
                                value={courseForm.courseCode}
                                onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                                placeholder="ANIUET-XXX"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Tipo</Label>
                              <Select value={courseForm.type} onValueChange={(value) => setCourseForm({ ...courseForm, type: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="custom">Personalizado</SelectItem>
                                  <SelectItem value="mock">Mock</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Estado</Label>
                              <Select value={courseForm.status} onValueChange={(value) => setCourseForm({ ...courseForm, status: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Activo</SelectItem>
                                  <SelectItem value="draft">Borrador</SelectItem>
                                  <SelectItem value="archived">Archivado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditingCourse(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleSaveCourse}>
                              <Save className="h-4 w-4 mr-2" />
                              Guardar Curso
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <Card key={course.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{course.title}</CardTitle>
                                <Badge variant={course.type === 'mock' ? 'secondary' : 'default'}>
                                  {course.type === 'mock' ? 'Mock' : 'Custom'}
                                </Badge>
                                <Badge variant={course.status === 'active' ? 'default' : 'outline'}>
                                  {course.status}
                                </Badge>
                              </div>
                              <CardDescription>{course.description}</CardDescription>
                              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                <span>Código: {course.courseCode}</span>
                                <span>Dificultad: {course.difficulty}</span>
                                <span>Lecciones: {Array.isArray(course.lessons) ? course.lessons.length : 0}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  console.log('=== DEBUG COURSE DATA ===');
                                  console.log('Course object:', course);
                                  console.log('Course ID:', course.id);
                                  console.log('Course lessons:', course.lessons);
                                  console.log('Lessons is array?:', Array.isArray(course.lessons));
                                  console.log('Lessons count:', course.lessons?.length);
                                  if (course.lessons && Array.isArray(course.lessons)) {
                                    course.lessons.forEach((lesson, i) => {
                                      console.log(`Lesson ${i}:`, lesson);
                                    });
                                  }
                                  alert('Datos del curso enviados a la consola. Abre DevTools (F12) para verlos.');
                                }}
                                className="bg-yellow-50 border-yellow-300 text-yellow-700"
                              >
                                🐛
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenVisualEditor(course)}
                                className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300"
                              >
                                <Map className="h-4 w-4 mr-1" />
                                Editor Visual
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditCourse(course)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedCourse(course)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Lección
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Agregar Lección a {course.title}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Título de la Lección</Label>
                                      <Input
                                        value={lessonForm.title}
                                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                        placeholder="Ej: Introducción a Redes Neuronales"
                                      />
                                    </div>
                                    <div>
                                      <Label>Descripción</Label>
                                      <Textarea
                                        value={lessonForm.description}
                                        onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                                        placeholder="Descripción breve de la lección"
                                        rows={2}
                                      />
                                    </div>
                                    <div>
                                      <Label>Contenido</Label>
                                      <Textarea
                                        value={lessonForm.content}
                                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                        placeholder="Contenido completo de la lección (Markdown soportado)"
                                        rows={6}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="flex items-center gap-2">
                                          <Video className="h-4 w-4" />
                                          URL del Video
                                        </Label>
                                        <Input
                                          value={lessonForm.videoUrl}
                                          onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                          placeholder="https://youtube.com/..."
                                        />
                                      </div>
                                      <div>
                                        <Label className="flex items-center gap-2">
                                          <FileText className="h-4 w-4" />
                                          URL del PDF
                                        </Label>
                                        <Input
                                          value={lessonForm.pdfUrl}
                                          onChange={(e) => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })}
                                          placeholder="https://..."
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Duración (minutos)</Label>
                                        <Input
                                          type="number"
                                          value={lessonForm.duration}
                                          onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Orden</Label>
                                        <Input
                                          type="number"
                                          value={lessonForm.order}
                                          onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => {
                                        setLessonForm({
                                          title: '',
                                          description: '',
                                          content: '',
                                          videoUrl: '',
                                          pdfUrl: '',
                                          duration: 30,
                                          order: 0,
                                          locked: false
                                        });
                                      }}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={handleSaveLesson}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar Lección
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardHeader>
                        {Array.isArray(course.lessons) && course.lessons.length > 0 && (
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-slate-600 mb-2">Lecciones:</p>
                              {course.lessons.map((lesson, idx) => (
                                <div key={lesson.id || idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{lesson.order + 1}</Badge>
                                    <span className="text-sm">{lesson.title}</span>
                                    {lesson.videoUrl && <Video className="h-3 w-3 text-blue-500" />}
                                    {lesson.pdfUrl && <FileText className="h-3 w-3 text-red-500" />}
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => handleEditLesson(course, lesson)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios de la Plataforma</CardTitle>
                <CardDescription>Vista completa de todos los usuarios registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p>{user.name}</p>
                            <Badge>{user.role}</Badge>
                            <Badge variant="outline">{user.aiExperience}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-slate-900">XP: {user.xp}</p>
                          <p className="text-slate-600">Nivel: {user.level}</p>
                          <p className="text-slate-600">Cursos: {user.enrolledCourses?.length || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas Generales</CardTitle>
                  <CardDescription>Métricas clave de la plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-4">Usuarios por Rol</h3>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600">Estudiantes</p>
                            <p className="text-blue-900">{stats.users.students}</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600">Maestros</p>
                            <p className="text-green-900">{stats.users.teachers}</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600">Profesionales</p>
                            <p className="text-purple-900">{stats.users.professionals}</p>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600">Admins</p>
                            <p className="text-orange-900">{stats.users.admins}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="mb-4">Engagement</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600">Total Inscripciones</p>
                            <p className="text-slate-900">{stats.engagement.totalEnrollments}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600">Lecciones Completadas</p>
                            <p className="text-slate-900">{stats.engagement.totalCompletedLessons}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600">Promedio Inscripciones/Usuario</p>
                            <p className="text-slate-900">{stats.engagement.averageEnrollmentsPerUser}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
