import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  ArrowLeft, 
  Zap, 
  Clock, 
  Target,
  TrendingUp,
  Play,
  CheckCircle,
  Briefcase,
  Trophy,
  BarChart,
  Rocket,
  Building2,
  DollarSign,
  TrendingDown,
  Users,
  LineChart,
  Calculator,
  PiggyBank,
  Award
} from "lucide-react";

interface CrashCoursesPageProps {
  onBack: () => void;
  session: any;
  userProfile: any;
  role: 'professional';
  onCourseSelect: (course: any) => void;
  onSubscription?: () => void;
}

export function CrashCoursesPage({ 
  onBack, 
  session, 
  userProfile, 
  role, 
  onCourseSelect,
  onSubscription 
}: CrashCoursesPageProps) {
  const [crashCourses, setCrashCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'enrolled' | 'available'>('all');
  const [activeTab, setActiveTab] = useState<string>('courses');

  // Debug: log when tab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);
  
  // ROI Tracker State
  const [roiInputs, setRoiInputs] = useState({
    monthlyRevenue: 100000,
    numberOfEmployees: 10,
    hoursPerWeekOnTask: 20,
    hourlyWage: 30,
    courseInvestment: 60
  });

  useEffect(() => {
    loadCrashCourses();
  }, [session]);

  const loadCrashCourses = async () => {
    try {
      setIsLoading(true);
      
      // Load available courses and filter crash courses
      const coursesData = await apiHelpers.getAvailableCourses();
      const allCourses = coursesData.courses || [];
      
      // Filter crash courses (courses with type: 'crash-course')
      const crashCoursesOnly = allCourses.filter((course: any) => 
        course.type === 'crash-course'
      );
      
      setCrashCourses(crashCoursesOnly);

      // Load user's enrolled courses if authenticated
      if (session?.access_token) {
        try {
          const userCoursesData = await apiHelpers.getUserCourses(session.access_token);
          setEnrolledCourses(userCoursesData.enrolledCourses || []);
        } catch (error) {
          console.log('No user courses found yet');
          setEnrolledCourses([]);
        }
      }

    } catch (error) {
      console.error('Error loading crash courses:', error);
      toast.error('Error cargando crash courses');
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
      toast.success('¡Te has inscrito al crash course exitosamente!', {
        description: '¡Complétalo rápido para dominar las habilidades esenciales!'
      });
      loadCrashCourses(); // Reload data
    } catch (error: any) {
      console.error('Error enrolling in crash course:', error);
      
      // Check if error is due to insufficient subscription tier
      if (error.response?.requiresUpgrade || error.message?.includes('Suscripción insuficiente')) {
        const requiredTier = error.response?.requiredTier || 'pro';
        toast.error(`Este crash course requiere suscripción ${requiredTier.toUpperCase()}`, {
          description: 'Actualiza tu plan para acceder a este contenido'
        });
        
        setTimeout(() => {
          if (onSubscription) {
            onSubscription();
          }
        }, 2000);
      } else if (error.response?.isAlreadyEnrolled || error.message?.includes('Ya estás inscrito')) {
        toast.info('Ya estás inscrito en este crash course');
      } else {
        toast.error('Error al inscribirse en el crash course');
      }
    }
  };

  const getFilteredCourses = () => {
    switch (activeFilter) {
      case 'enrolled':
        return crashCourses.filter(course => enrolledCourses.includes(course.id));
      case 'available':
        return crashCourses.filter(course => !enrolledCourses.includes(course.id));
      default:
        return crashCourses;
    }
  };

  const filteredCourses = getFilteredCourses();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierBadge = (requiredTier?: string) => {
    const tier = requiredTier || 'free';
    switch (tier) {
      case 'free':
        return <Badge className="bg-gray-500 text-xs">GRATIS</Badge>;
      case 'pro':
        return <Badge className="bg-[#E3701B] text-xs">PRO</Badge>;
      case 'enterprise':
        return <Badge className="bg-[#4285F4] text-xs">ENTERPRISE</Badge>;
      default:
        return null;
    }
  };

  // Stats calculation
  const totalCrashCourses = crashCourses.length;
  const enrolledCount = enrolledCourses.filter(id => 
    crashCourses.some(course => course.id === id)
  ).length;
  const completionRate = totalCrashCourses > 0 
    ? Math.round((enrolledCount / totalCrashCourses) * 100) 
    : 0;

  // ROI Calculations
  const calculateROI = () => {
    const { monthlyRevenue, numberOfEmployees, hoursPerWeekOnTask, hourlyWage, courseInvestment } = roiInputs;
    
    // Calculate current cost of manual work
    const weeksPerMonth = 4.33;
    const monthlyLaborCost = numberOfEmployees * hoursPerWeekOnTask * weeksPerMonth * hourlyWage;
    
    // Assume 40% time savings with AI automation
    const timeSavingsPercent = 0.40;
    const monthlySavings = monthlyLaborCost * timeSavingsPercent;
    
    // Annual savings
    const annualSavings = monthlySavings * 12;
    
    // ROI calculation
    const roi = ((annualSavings - courseInvestment) / courseInvestment) * 100;
    
    // Payback period in months
    const paybackPeriod = courseInvestment / monthlySavings;
    
    // Revenue increase (assume 15% productivity increase leads to 10% revenue increase)
    const revenueIncrease = monthlyRevenue * 0.10 * 12;
    
    return {
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      roi: Math.round(roi),
      paybackPeriod: paybackPeriod.toFixed(1),
      revenueIncrease: Math.round(revenueIncrease),
      totalAnnualBenefit: Math.round(annualSavings + revenueIncrease)
    };
  };

  const roiResults = calculateROI();

  // Business Cases Data
  const businessCases = [
    {
      company: "TechStart México",
      industry: "E-commerce",
      employees: 25,
      challenge: "Gestión manual de inventario causaba errores y pérdidas de $15,000 MXN mensuales",
      solution: "Implementación de IA para predicción de inventario y automatización de órdenes",
      results: [
        "Reducción del 85% en errores de inventario",
        "Ahorro de $180,000 MXN anuales",
        "ROI de 600% en 6 meses"
      ],
      roi: "600%",
      savings: "$180,000 MXN/año",
      icon: Building2,
      color: "#E3701B"
    },
    {
      company: "Consultoría Digital SA",
      industry: "Servicios Profesionales",
      employees: 15,
      challenge: "40 horas semanales dedicadas a análisis de datos de clientes",
      solution: "Crash Course de IA + automatización de reportes con machine learning",
      results: [
        "Reducción del 70% en tiempo de análisis",
        "Capacidad de atender 3x más clientes",
        "Aumento de ingresos de $450,000 MXN/año"
      ],
      roi: "750%",
      savings: "$450,000 MXN/año",
      icon: Users,
      color: "#4285F4"
    },
    {
      company: "ManufacturaPlus",
      industry: "Manufactura",
      employees: 50,
      challenge: "Control de calidad manual con tasa de defectos del 8%",
      solution: "IA de visión computacional para inspección automatizada",
      results: [
        "Reducción de defectos al 0.5%",
        "Ahorro de $320,000 MXN en desperdicios",
        "Payback en 3 meses"
      ],
      roi: "533%",
      savings: "$320,000 MXN/año",
      icon: Award,
      color: "#C4423D"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DynamicBackground role={role} />
      
      <div className="relative z-20 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8 text-yellow-400" />
              <h1 className="text-white text-3xl">Crash Courses</h1>
            </div>
            <p className="text-white/70">
              Cursos intensivos diseñados para profesionales que necesitan resultados rápidos
            </p>
          </div>
        </div>

        {/* Main Content Tabs - Custom Implementation */}
        <div className="mb-8 relative z-30">
          {/* Tab Navigation */}
          <div className="grid w-full grid-cols-3 gap-3 mb-8 p-2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-200">
            <button
              onClick={() => {
                console.log('Courses tab clicked');
                setActiveTab('courses');
              }}
              className={`flex items-center justify-center gap-2 h-14 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                activeTab === 'courses'
                  ? 'bg-[#C4423D] text-white shadow-lg scale-105'
                  : 'bg-transparent text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Zap className="h-5 w-5" />
              <span className="font-medium">Cursos</span>
            </button>
            
            <button
              onClick={() => {
                console.log('Business Cases tab clicked');
                setActiveTab('business-cases');
              }}
              className={`flex items-center justify-center gap-2 h-14 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                activeTab === 'business-cases'
                  ? 'bg-[#C4423D] text-white shadow-lg scale-105'
                  : 'bg-transparent text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="font-medium">Business Cases</span>
            </button>
            
            <button
              onClick={() => {
                console.log('ROI Tracker tab clicked');
                setActiveTab('roi-tracker');
              }}
              className={`flex items-center justify-center gap-2 h-14 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                activeTab === 'roi-tracker'
                  ? 'bg-[#C4423D] text-white shadow-lg scale-105'
                  : 'bg-transparent text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Calculator className="h-5 w-5" />
              <span className="font-medium">ROI Tracker</span>
            </button>
          </div>

          {/* Debug indicator */}
          <div className="text-white text-sm mb-4 bg-black/30 p-3 rounded-lg border border-white/20">
            <strong>Active Tab:</strong> {activeTab}
          </div>

          {/* COURSES TAB */}
          {activeTab === 'courses' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/90 backdrop-blur-lg border-2 border-[#C4423D]/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Total Disponibles</CardTitle>
                  <Briefcase className="h-5 w-5 text-[#C4423D]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-[#C4423D]">{totalCrashCourses}</div>
                <p className="text-xs text-gray-600 mt-1">Crash courses activos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-lg border-2 border-[#C4423D]/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">En Progreso</CardTitle>
                  <Rocket className="h-5 w-5 text-[#C4423D]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-[#C4423D]">{enrolledCount}</div>
                <p className="text-xs text-gray-600 mt-1">Cursos iniciados</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/90 backdrop-blur-lg border-2 border-[#C4423D]/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Tasa de Progreso</CardTitle>
                  <BarChart className="h-5 w-5 text-[#C4423D]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-[#C4423D]">{completionRate}%</div>
                <Progress value={completionRate} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </motion.div>
        </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('all')}
            className={activeFilter === 'all' ? 'bg-[#C4423D] hover:bg-[#C4423D]/90' : 'bg-white/90'}
          >
            Todos ({crashCourses.length})
          </Button>
          <Button
            variant={activeFilter === 'enrolled' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('enrolled')}
            className={activeFilter === 'enrolled' ? 'bg-[#C4423D] hover:bg-[#C4423D]/90' : 'bg-white/90'}
          >
            Inscritos ({enrolledCount})
          </Button>
          <Button
            variant={activeFilter === 'available' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('available')}
            className={activeFilter === 'available' ? 'bg-[#C4423D] hover:bg-[#C4423D]/90' : 'bg-white/90'}
          >
            Disponibles ({crashCourses.length - enrolledCount})
          </Button>
        </div>

            {/* Courses Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-white">Cargando crash courses...</div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-lg p-12 text-center">
                <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl mb-2">
                  {activeFilter === 'enrolled' 
                    ? 'No tienes crash courses inscritos aún' 
                    : 'No hay crash courses disponibles'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeFilter === 'enrolled'
                    ? 'Explora los crash courses disponibles y comienza tu aprendizaje intensivo'
                    : 'Pronto habrá nuevos crash courses disponibles'}
                </p>
                {activeFilter === 'enrolled' && (
                  <Button 
                    onClick={() => setActiveFilter('available')}
                    className="bg-[#C4423D] hover:bg-[#C4423D]/90"
                  >
                    Ver Disponibles
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course, index) => {
                  const isEnrolled = enrolledCourses.includes(course.id);
                  
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full bg-white/90 backdrop-blur-lg hover:shadow-xl transition-all duration-300 border-2 border-[#C4423D]/20">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Zap className="h-5 w-5 text-yellow-500" />
                              <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">
                                CRASH COURSE
                              </Badge>
                            </div>
                            {getTierBadge(course.requiredTier)}
                          </div>
                          
                          <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">
                            {course.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Course Info */}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{course.estimatedTime || course.duration || '2-4 horas'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <Badge 
                                variant="secondary" 
                                className={`${getDifficultyColor(course.difficulty)} text-xs`}
                              >
                                {course.difficulty === 'beginner' && 'Principiante'}
                                {course.difficulty === 'intermediate' && 'Intermedio'}
                                {course.difficulty === 'advanced' && 'Avanzado'}
                              </Badge>
                            </div>
                          </div>

                          {/* Lessons Count */}
                          {course.lessons && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Trophy className="h-4 w-4" />
                              <span>{course.lessons.length} lecciones intensivas</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 space-y-2">
                            {isEnrolled ? (
                              <>
                                <Button 
                                  className="w-full bg-[#C4423D] hover:bg-[#C4423D]/90"
                                  onClick={() => onCourseSelect(course)}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Continuar Curso
                                </Button>
                                <div className="flex items-center gap-2 text-xs text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Inscrito</span>
                                </div>
                              </>
                            ) : (
                              <Button 
                                className="w-full bg-[#C4423D] hover:bg-[#C4423D]/90"
                                onClick={() => handleEnrollInCourse(course.id)}
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                Inscribirse Ahora
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-[#C4423D]/10 to-[#C4423D]/5 border-2 border-[#C4423D]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-[#C4423D]" />
                    ¿Qué son los Crash Courses?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-gray-700">
                  <p>
                    Los <strong>Crash Courses</strong> son programas de aprendizaje intensivo diseñados 
                    específicamente para profesionales que necesitan adquirir habilidades rápidamente.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>📚 Contenido condensado y altamente práctico</li>
                    <li>⚡ Duración corta (2-8 horas) con máximo impacto</li>
                    <li>🎯 Enfoque en aplicación inmediata en el trabajo</li>
                    <li>🏆 Certificados profesionales al completar</li>
                    <li>💼 Casos de estudio reales del mundo empresarial</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          )}

          {/* BUSINESS CASES TAB */}
          {activeTab === 'business-cases' && (
          <div className="space-y-8">
            <div className="mb-6 bg-white/10 p-6 rounded-lg">
              <h2 className="text-white text-2xl mb-2">Casos de Éxito Empresariales</h2>
              <p className="text-white/70">
                Descubre cómo empresas reales han transformado sus negocios con IA
              </p>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
              {businessCases.map((businessCase, index) => {
                const IconComponent = businessCase.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full bg-white/90 backdrop-blur-lg border-2 border-[#C4423D]/20">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-3 rounded-xl" 
                              style={{ backgroundColor: `${businessCase.color}20` }}
                            >
                              <IconComponent className="h-6 w-6" style={{ color: businessCase.color }} />
                            </div>
                            <div>
                              <CardTitle className="text-xl">{businessCase.company}</CardTitle>
                              <p className="text-sm text-gray-600">{businessCase.industry} • {businessCase.employees} empleados</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="text-sm">Desafío</span>
                          </div>
                          <p className="text-gray-700 text-sm">{businessCase.challenge}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">Solución</span>
                          </div>
                          <p className="text-gray-700 text-sm">{businessCase.solution}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Resultados</span>
                          </div>
                          <ul className="space-y-1">
                            {businessCase.results.map((result, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl text-green-600">{businessCase.roi}</div>
                            <div className="text-xs text-gray-600 mt-1">ROI</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm text-blue-600">{businessCase.savings}</div>
                            <div className="text-xs text-gray-600 mt-1">Ahorro anual</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Additional Business Case Insight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-[#4285F4]/10 to-[#4285F4]/5 border-2 border-[#4285F4]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-6 w-6 text-[#4285F4]" />
                    Tendencias del Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-700">
                  <p>
                    Según estudios recientes, las empresas que implementan IA experimentan:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-[#4285F4]/20">
                      <div className="text-3xl text-[#4285F4] mb-1">40%</div>
                      <p className="text-sm">Reducción en costos operativos</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-[#E3701B]/20">
                      <div className="text-3xl text-[#E3701B] mb-1">3.5x</div>
                      <p className="text-sm">Incremento en productividad</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-[#C4423D]/20">
                      <div className="text-3xl text-[#C4423D] mb-1">85%</div>
                      <p className="text-sm">Mejora en satisfacción del cliente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          )}

          {/* ROI TRACKER TAB */}
          {activeTab === 'roi-tracker' && (
          <div className="space-y-8">
            <div className="mb-6 bg-white/10 p-6 rounded-lg">
              <h2 className="text-white text-2xl mb-2">Calculadora de ROI</h2>
              <p className="text-white/70">
                Calcula el retorno de inversión de implementar IA en tu negocio
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/90 backdrop-blur-lg border-2 border-[#4285F4]/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-[#4285F4]" />
                      Datos de tu Negocio
                    </CardTitle>
                    <CardDescription>
                      Ingresa la información de tu empresa para calcular el ROI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyRevenue">Ingresos Mensuales (MXN)</Label>
                      <Input
                        id="monthlyRevenue"
                        type="number"
                        value={roiInputs.monthlyRevenue}
                        onChange={(e) => setRoiInputs({...roiInputs, monthlyRevenue: parseFloat(e.target.value) || 0})}
                        className="text-lg"
                      />
                      <p className="text-xs text-gray-500">Tus ingresos mensuales promedio</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numberOfEmployees">Número de Empleados</Label>
                      <Input
                        id="numberOfEmployees"
                        type="number"
                        value={roiInputs.numberOfEmployees}
                        onChange={(e) => setRoiInputs({...roiInputs, numberOfEmployees: parseInt(e.target.value) || 0})}
                        className="text-lg"
                      />
                      <p className="text-xs text-gray-500">Empleados que usarían la IA</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hoursPerWeek">Horas Semanales en Tareas Repetitivas</Label>
                      <Input
                        id="hoursPerWeek"
                        type="number"
                        value={roiInputs.hoursPerWeekOnTask}
                        onChange={(e) => setRoiInputs({...roiInputs, hoursPerWeekOnTask: parseFloat(e.target.value) || 0})}
                        className="text-lg"
                      />
                      <p className="text-xs text-gray-500">Promedio por empleado</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hourlyWage">Costo por Hora de Empleado (MXN)</Label>
                      <Input
                        id="hourlyWage"
                        type="number"
                        value={roiInputs.hourlyWage}
                        onChange={(e) => setRoiInputs({...roiInputs, hourlyWage: parseFloat(e.target.value) || 0})}
                        className="text-lg"
                      />
                      <p className="text-xs text-gray-500">Salario promedio por hora</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="courseInvestment">Inversión en Capacitación (MXN)</Label>
                      <Input
                        id="courseInvestment"
                        type="number"
                        value={roiInputs.courseInvestment}
                        onChange={(e) => setRoiInputs({...roiInputs, courseInvestment: parseFloat(e.target.value) || 0})}
                        className="text-lg"
                      />
                      <p className="text-xs text-gray-500">Costo de cursos y herramientas de IA</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-6 w-6" />
                      Retorno de Inversión
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl mb-2">{roiResults.roi}%</div>
                    <p className="text-green-100">ROI proyectado a 12 meses</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-lg border-2 border-[#4285F4]/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#4285F4]" />
                      Ahorros Proyectados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Ahorro Mensual</div>
                        <div className="text-2xl text-[#4285F4]">
                          ${roiResults.monthlySavings.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Ahorro Anual</div>
                        <div className="text-2xl text-green-600">
                          ${roiResults.annualSavings.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Incremento en Ingresos Anuales</div>
                      <div className="text-2xl text-purple-600">
                        ${roiResults.revenueIncrease.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Por aumento en productividad</p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border-2 border-[#E3701B]/30">
                      <div className="text-xs text-gray-600 mb-1">Beneficio Total Anual</div>
                      <div className="text-3xl text-[#E3701B]">
                        ${roiResults.totalAnnualBenefit.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Ahorros + Incremento en ingresos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-lg border-2 border-[#C4423D]/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#C4423D]" />
                      Tiempo de Recuperación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl text-[#C4423D] mb-2">
                      {roiResults.paybackPeriod} meses
                    </div>
                    <p className="text-gray-600">
                      Tiempo estimado para recuperar tu inversión
                    </p>
                    <Progress 
                      value={Math.min((1 / parseFloat(roiResults.paybackPeriod)) * 100, 100)} 
                      className="h-3 mt-4" 
                    />
                  </CardContent>
                </Card>

                {/* Action Card */}
                <Card className="bg-gradient-to-r from-[#E3701B]/10 to-[#E3701B]/5 border-2 border-[#E3701B]/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-4">
                      <PiggyBank className="h-6 w-6 text-[#E3701B] flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="mb-2">¿Listo para empezar?</h3>
                        <p className="text-sm text-gray-700 mb-4">
                          Con una inversión de ${roiInputs.courseInvestment.toLocaleString()} MXN en capacitación, 
                          podrías generar ${roiResults.totalAnnualBenefit.toLocaleString()} MXN en beneficios anuales.
                        </p>
                        <Button 
                          className="w-full bg-[#E3701B] hover:bg-[#E3701B]/90"
                          onClick={() => setActiveTab('courses')}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Ver Crash Courses Disponibles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Assumptions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/90 backdrop-blur-lg border-2 border-gray-300">
                <CardHeader>
                  <CardTitle className="text-sm">Supuestos del Cálculo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 40% de ahorro en tiempo en tareas repetitivas mediante automatización con IA</li>
                    <li>• 10% de incremento en ingresos por mejora en productividad (basado en 15% de aumento en productividad)</li>
                    <li>• Los cálculos son estimaciones basadas en promedios de la industria</li>
                    <li>• Los resultados reales pueden variar según la implementación específica</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
