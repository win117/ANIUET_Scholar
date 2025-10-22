/**
 * GoalsPage.tsx - Página de Gestión de Objetivos
 * 
 * Sistema completo de objetivos personales que permite a los usuarios:
 * - Establecer objetivos de aprendizaje personalizados
 * - Rastrear progreso en tiempo real
 * - Ganar XP al completar objetivos
 * - Ver objetivos predefinidos y personalizados
 * - Gestionar objetivos activos y completados
 * 
 * @module GoalsPage
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import {
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Flame,
  BookOpen,
  Trophy,
  Calendar,
  Plus,
  X,
  Edit,
  Trash2,
  Award,
  ArrowLeft,
  Zap,
  Star,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface GoalsPageProps {
  onBack: () => void;
  session?: any;
  userProfile?: any;
  role: 'student' | 'teacher' | 'professional';
}

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'xp' | 'lessons' | 'courses' | 'streak' | 'custom';
  targetValue: number;
  currentValue: number;
  deadline?: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  xpReward: number;
  isPredefined: boolean;
  icon?: string;
}

export function GoalsPage({ onBack, session, userProfile, role }: GoalsPageProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  
  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'xp' as Goal['type'],
    targetValue: 100,
    deadline: '',
    xpReward: 50
  });

  const roleConfig = {
    student: { color: '#E3701B', icon: '🎓' },
    teacher: { color: '#4285F4', icon: '🧑‍🏫' },
    professional: { color: '#C4423D', icon: '👩‍💼' }
  };

  const config = roleConfig[role];

  useEffect(() => {
    loadGoals();
  }, [session]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      console.log('Loading user goals...');
      
      if (!session?.access_token) {
        console.log('No session token available');
        setGoals([]);
        return;
      }

      const result = await apiHelpers.getUserGoals(session.access_token);
      
      if (result.success) {
        console.log('Goals loaded successfully:', result.goals);
        setGoals(result.goals || []);
      } else {
        console.error('Error loading goals:', result.error);
        toast.error('Error al cargar objetivos');
        setGoals([]);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      toast.error('Error al cargar objetivos');
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) {
      toast.error('El título del objetivo es requerido');
      return;
    }

    if (newGoal.targetValue <= 0) {
      toast.error('El valor objetivo debe ser mayor a 0');
      return;
    }

    try {
      console.log('Creating new goal:', newGoal);
      
      const result = await apiHelpers.createGoal(session?.access_token, {
        ...newGoal,
        isPredefined: false
      });

      if (result.success) {
        toast.success('¡Objetivo creado exitosamente!');
        setShowCreateDialog(false);
        setNewGoal({
          title: '',
          description: '',
          type: 'xp',
          targetValue: 100,
          deadline: '',
          xpReward: 50
        });
        await loadGoals();
      } else {
        toast.error(result.error || 'Error al crear objetivo');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Error al crear objetivo');
    }
  };

  const handleUpdateProgress = async (goalId: string, newValue: number) => {
    try {
      console.log('Updating goal progress:', goalId, newValue);
      
      const result = await apiHelpers.updateGoalProgress(
        session?.access_token,
        goalId,
        newValue
      );

      if (result.success) {
        if (result.goalCompleted) {
          toast.success(`🎉 ¡Objetivo completado! +${result.xpGained} XP`);
        } else {
          toast.success('Progreso actualizado');
        }
        await loadGoals();
      } else {
        toast.error(result.error || 'Error al actualizar progreso');
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      toast.error('Error al actualizar progreso');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      console.log('Deleting goal:', goalId);
      
      const result = await apiHelpers.deleteGoal(session?.access_token, goalId);

      if (result.success) {
        toast.success('Objetivo eliminado');
        await loadGoals();
      } else {
        toast.error(result.error || 'Error al eliminar objetivo');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Error al eliminar objetivo');
    }
  };

  const handleActivatePredefinedGoal = async (goalData: any) => {
    try {
      console.log('Activating predefined goal:', goalData);
      
      const result = await apiHelpers.createGoal(session?.access_token, {
        ...goalData,
        isPredefined: true
      });

      if (result.success) {
        toast.success('¡Objetivo activado!');
        await loadGoals();
      } else {
        toast.error(result.error || 'Error al activar objetivo');
      }
    } catch (error) {
      console.error('Error activating predefined goal:', error);
      toast.error('Error al activar objetivo');
    }
  };

  const getGoalIcon = (type: Goal['type']) => {
    switch (type) {
      case 'xp': return <Zap className="w-5 h-5" />;
      case 'lessons': return <BookOpen className="w-5 h-5" />;
      case 'courses': return <Trophy className="w-5 h-5" />;
      case 'streak': return <Flame className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getGoalTypeLabel = (type: Goal['type']) => {
    switch (type) {
      case 'xp': return 'XP';
      case 'lessons': return 'Lecciones';
      case 'courses': return 'Cursos';
      case 'streak': return 'Racha';
      default: return 'Personalizado';
    }
  };

  const calculateProgress = (goal: Goal) => {
    const percentage = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
    return Math.round(percentage);
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const predefinedGoals = [
    {
      title: 'Maestro del XP',
      description: 'Gana 500 XP esta semana',
      type: 'xp' as const,
      targetValue: 500,
      xpReward: 100,
      icon: '⚡'
    },
    {
      title: 'Estudiante Dedicado',
      description: 'Completa 10 lecciones',
      type: 'lessons' as const,
      targetValue: 10,
      xpReward: 150,
      icon: '📚'
    },
    {
      title: 'Racha de Fuego',
      description: 'Mantén una racha de 7 días',
      type: 'streak' as const,
      targetValue: 7,
      xpReward: 200,
      icon: '🔥'
    },
    {
      title: 'Explorador de Cursos',
      description: 'Inscríbete en 3 cursos nuevos',
      type: 'courses' as const,
      targetValue: 3,
      xpReward: 120,
      icon: '🎯'
    }
  ];

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const totalXpFromGoals = completedGoals.reduce((sum, g) => sum + g.xpReward, 0);

  return (
    <div className="min-h-screen relative">
      <DynamicBackground variant="dashboard" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b p-4 sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logo} alt="ANIUET Scholar" className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: config.color }}>
                🎯 Mis Objetivos
              </h1>
              <p className="text-sm text-gray-600">
                Define y alcanza tus metas de aprendizaje
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Objetivo
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Objetivos Activos</p>
                    <p className="text-3xl font-bold text-blue-900">{activeGoals.length}</p>
                  </div>
                  <Target className="w-12 h-12 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Completados</p>
                    <p className="text-3xl font-bold text-green-900">{completedGoals.length}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">XP Ganado</p>
                    <p className="text-3xl font-bold text-purple-900">{totalXpFromGoals}</p>
                  </div>
                  <Award className="w-12 h-12 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">Tasa de Éxito</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Predefined Goals */}
        {activeGoals.length === 0 && (
          <Card className="mb-8 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-6 h-6 text-yellow-500" />
                <span>Objetivos Recomendados</span>
              </CardTitle>
              <CardDescription>
                Comienza con estos objetivos predefinidos para acelerar tu progreso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {predefinedGoals.map((goal, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => handleActivatePredefinedGoal(goal)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{goal.icon}</span>
                            <div>
                              <h4 className="font-semibold">{goal.title}</h4>
                              <p className="text-sm text-gray-600">{goal.description}</p>
                            </div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            +{goal.xpReward} XP
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline">
                            {getGoalTypeLabel(goal.type)}
                          </Badge>
                          <span className="text-gray-500">
                            Meta: {goal.targetValue}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        <Card className="bg-white/90">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Activos ({activeGoals.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completados ({completedGoals.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'active' ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {activeGoals.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          No tienes objetivos activos
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Crea un objetivo personalizado o activa uno recomendado
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Objetivo
                        </Button>
                      </div>
                    ) : (
                      activeGoals.map((goal, index) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          index={index}
                          config={config}
                          onUpdateProgress={handleUpdateProgress}
                          onDelete={handleDeleteGoal}
                          getDaysRemaining={getDaysRemaining}
                          calculateProgress={calculateProgress}
                          getGoalIcon={getGoalIcon}
                          getGoalTypeLabel={getGoalTypeLabel}
                        />
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="completed"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {completedGoals.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          Aún no has completado objetivos
                        </h3>
                        <p className="text-gray-500">
                          ¡Comienza ahora y alcanza tus metas de aprendizaje!
                        </p>
                      </div>
                    ) : (
                      completedGoals.map((goal, index) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          index={index}
                          config={config}
                          onUpdateProgress={handleUpdateProgress}
                          onDelete={handleDeleteGoal}
                          getDaysRemaining={getDaysRemaining}
                          calculateProgress={calculateProgress}
                          getGoalIcon={getGoalIcon}
                          getGoalTypeLabel={getGoalTypeLabel}
                          isCompleted={true}
                        />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="w-6 h-6" style={{ color: config.color }} />
              <span>Crear Nuevo Objetivo</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título del Objetivo *</Label>
              <Input
                id="title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="Ej: Completar curso de ML"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Describe tu objetivo..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de Objetivo</Label>
                <Select 
                  value={newGoal.type} 
                  onValueChange={(value) => setNewGoal({...newGoal, type: value as Goal['type']})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xp">XP</SelectItem>
                    <SelectItem value="lessons">Lecciones</SelectItem>
                    <SelectItem value="courses">Cursos</SelectItem>
                    <SelectItem value="streak">Racha</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetValue">Valor Objetivo *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="1"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({...newGoal, targetValue: parseInt(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline">Fecha Límite (Opcional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="mt-1"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="xpReward">Recompensa de XP *</Label>
                <Input
                  id="xpReward"
                  type="number"
                  min="10"
                  value={newGoal.xpReward}
                  onChange={(e) => setNewGoal({...newGoal, xpReward: parseInt(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateGoal}
                style={{ backgroundColor: config.color }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Objetivo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: Goal;
  index: number;
  config: any;
  onUpdateProgress: (goalId: string, newValue: number) => void;
  onDelete: (goalId: string) => void;
  getDaysRemaining: (deadline?: string) => number | null;
  calculateProgress: (goal: Goal) => number;
  getGoalIcon: (type: Goal['type']) => JSX.Element;
  getGoalTypeLabel: (type: Goal['type']) => string;
  isCompleted?: boolean;
}

function GoalCard({ 
  goal, 
  index, 
  config, 
  onUpdateProgress, 
  onDelete, 
  getDaysRemaining, 
  calculateProgress,
  getGoalIcon,
  getGoalTypeLabel,
  isCompleted = false
}: GoalCardProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newValue, setNewValue] = useState(goal.currentValue);
  
  const progress = calculateProgress(goal);
  const daysRemaining = getDaysRemaining(goal.deadline);
  const isUrgent = daysRemaining !== null && daysRemaining <= 3;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className={`transition-all hover:shadow-md ${isCompleted ? 'opacity-75' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}15`, color: config.color }}
                >
                  {getGoalIcon(goal.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-lg">{goal.title}</h3>
                    {goal.isPredefined && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Recomendado
                      </Badge>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  )}
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {getGoalTypeLabel(goal.type)}
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      +{goal.xpReward} XP
                    </Badge>
                    {daysRemaining !== null && !isCompleted && (
                      <Badge 
                        variant={isUrgent ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {daysRemaining} días
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {!isCompleted && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpdateDialog(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(goal.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              )}
              
              {isCompleted && (
                <CheckCircle className="w-8 h-8 text-green-500" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progreso</span>
                <span className="font-semibold">
                  {goal.currentValue} / {goal.targetValue} ({progress}%)
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {isCompleted && goal.completedAt && (
              <div className="mt-3 flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Completado el {new Date(goal.completedAt).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Update Progress Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Progreso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor Actual</Label>
              <Input
                type="number"
                min="0"
                max={goal.targetValue}
                value={newValue}
                onChange={(e) => setNewValue(parseInt(e.target.value) || 0)}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Meta: {goal.targetValue}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  onUpdateProgress(goal.id, newValue);
                  setShowUpdateDialog(false);
                }}
                style={{ backgroundColor: config.color }}
              >
                Actualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
