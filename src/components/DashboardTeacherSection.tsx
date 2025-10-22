import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";
import { 
  Plus,
  QrCode,
  Copy,
  Users,
  BookOpen,
  Calendar,
  TrendingUp
} from "lucide-react";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";

interface DashboardTeacherSectionProps {
  session?: any;
  onCourseSelect: (course: any) => void;
}

export function DashboardTeacherSection({ session, onCourseSelect }: DashboardTeacherSectionProps) {
  const [courseCode, setCourseCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  // Load available courses
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await apiHelpers.getAvailableCourses();
      if (coursesData.success) {
        setCourses(coursesData.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleJoinWithCode = async () => {
    if (!courseCode.trim() || !session?.access_token) return;

    try {
      setIsLoading(true);
      const result = await apiHelpers.joinClassWithCode(session.access_token, courseCode.trim());
      
      if (result.success) {
        toast.success(`¡Te has inscrito en ${result.course.title}!`);
        setCourseCode('');
        setShowJoinModal(false);
        // Reload courses to show the new enrollment
        loadCourses();
      }
    } catch (error) {
      console.error('Error joining with code:', error);
      if (error.message?.includes('inválido')) {
        toast.error('Código de curso inválido');
      } else if (error.message?.includes('inscrito')) {
        toast.warning('Ya estás inscrito en este curso');
      } else {
        toast.error('Error al unirse al curso');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  return (
    <div className="space-y-6">
      {/* Join Course Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <QrCode className="w-5 h-5" />
            <span>Unirse a un Curso</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-purple-700 mb-4">
            ¿Tienes un código de curso? Úsalo para inscribirte rápidamente.
          </p>
          <Button 
            onClick={() => setShowJoinModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ingresar Código
          </Button>
        </CardContent>
      </Card>

      {/* Available Courses */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Cursos Disponibles</h3>
        <div className="grid gap-4">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer bg-white/90"
                onClick={() => onCourseSelect(course)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{course.title}</h4>
                        <Badge variant="outline" className="text-blue-600">
                          {course.difficulty === 'beginner' ? 'Principiante' : 
                           course.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{course.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.lessons?.length || 0} lecciones</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{course.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Join Course Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-purple-600">
              🎓 Unirse a un Curso
            </DialogTitle>
            <DialogDescription>
              Ingresa el código del curso que te proporcionó tu instructor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-code">Código del Curso</Label>
              <Input
                id="course-code"
                placeholder="Ej: ANIUET-123456"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                Ingresa el código que te proporcionó tu maestro
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleJoinWithCode}
                disabled={isLoading || !courseCode.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Inscribiendo...' : 'Inscribirse'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowJoinModal(false)}
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