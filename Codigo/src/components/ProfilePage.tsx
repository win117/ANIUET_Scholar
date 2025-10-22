import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { 
  ArrowLeft, 
  User, 
  Edit3, 
  Save, 
  X,
  Trophy,
  BookOpen,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Camera,
  Award,
  TrendingUp,
  Target,
  Flame,
  Star
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface ProfilePageProps {
  onBack: () => void;
  session: any;
  userProfile: any;
  role: 'student' | 'teacher' | 'professional';
}

export function ProfilePage({ onBack, session, userProfile, role }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: userProfile?.name || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    phone: userProfile?.phone || '',
    website: userProfile?.website || '',
    github: userProfile?.github || '',
    linkedin: userProfile?.linkedin || '',
    institution: userProfile?.institution || '',
    specialty: userProfile?.specialty || '',
    experience: userProfile?.experience || '',
    workArea: userProfile?.workArea || '',
    company: userProfile?.company || ''
  });
  const [userCourses, setUserCourses] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    loadProfileData();
  }, [session]);

  const loadProfileData = async () => {
    try {
      if (session?.access_token) {
        // Load user courses
        const coursesData = await apiHelpers.getUserCourses(session.access_token);
        setUserCourses(coursesData);
        
        // Mock achievements - in real app would come from backend
        setAchievements([
          { id: 'first-login', title: 'Primer Paso', icon: '🚀' },
          { id: 'first-course', title: 'Primer Curso', icon: '📚' },
          { id: 'level-5', title: 'Nivel 5', icon: '⭐' }
        ]);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // In a real app, this would update the profile via API
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({
      name: userProfile?.name || '',
      bio: userProfile?.bio || '',
      location: userProfile?.location || '',
      phone: userProfile?.phone || '',
      website: userProfile?.website || '',
      github: userProfile?.github || '',
      linkedin: userProfile?.linkedin || '',
      institution: userProfile?.institution || '',
      specialty: userProfile?.specialty || '',
      experience: userProfile?.experience || '',
      workArea: userProfile?.workArea || '',
      company: userProfile?.company || ''
    });
    setIsEditing(false);
  };

  const getRoleColor = () => {
    switch (role) {
      case 'student': return '#E3701B';
      case 'teacher': return '#4285F4';
      case 'professional': return '#C4423D';
      default: return '#4285F4';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'student': return '🎓';
      case 'teacher': return '🧑‍🏫';
      case 'professional': return '👩‍💼';
      default: return '👤';
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'student': return 'Estudiante';
      case 'teacher': return 'Maestro';
      case 'professional': return 'Profesional';
      default: return 'Usuario';
    }
  };

  const getCompletedCourses = () => {
    return userCourses?.completedCourses?.length || 0;
  };

  const getEnrolledCourses = () => {
    return userCourses?.enrolledCourses?.length || 0;
  };

  const getNextLevelProgress = () => {
    const currentLevel = userProfile?.level || 1;
    const currentXP = userProfile?.xp || 0;
    const xpForCurrentLevel = (currentLevel - 1) * 1000;
    const xpForNextLevel = currentLevel * 1000;
    const progressInLevel = currentXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    
    return (progressInLevel / xpNeededForNextLevel) * 100;
  };

  const getXPToNextLevel = () => {
    const currentLevel = userProfile?.level || 1;
    const currentXP = userProfile?.xp || 0;
    const xpForNextLevel = currentLevel * 1000;
    
    return Math.max(0, xpForNextLevel - currentXP);
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
                  Mi Perfil
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  style={{ backgroundColor: getRoleColor() }}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    style={{ backgroundColor: getRoleColor() }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/90">
                  <CardContent className="p-6 text-center">
                    {/* Avatar */}
                    <div className="relative mb-4">
                      <div 
                        className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl"
                        style={{ backgroundColor: `${getRoleColor()}15` }}
                      >
                        {getRoleIcon()}
                      </div>
                      {isEditing && (
                        <Button
                          size="sm"
                          className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2"
                          style={{ backgroundColor: getRoleColor() }}
                        >
                          <Camera className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {/* Name and Role */}
                    <div className="mb-4">
                      {/* El nombre no es editable por seriedad educativa - representa nombre real */}
                      <h2 className="text-xl font-bold mb-2">{userProfile?.name || 'Usuario'}</h2>
                      {isEditing && (
                        <p className="text-xs text-gray-500 mb-2">
                          El nombre no puede modificarse
                        </p>
                      )}
                      
                      <Badge 
                        className="text-white"
                        style={{ backgroundColor: getRoleColor() }}
                      >
                        {getRoleTitle()}
                      </Badge>
                    </div>

                    {/* Bio */}
                    <div className="mb-4">
                      {isEditing ? (
                        <div>
                          <Label htmlFor="bio" className="text-sm font-medium">Biografía</Label>
                          <Textarea
                            id="bio"
                            value={editedProfile.bio}
                            onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                            placeholder="Cuéntanos sobre ti..."
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm">
                          {userProfile?.bio || 'Aún no has agregado una biografía'}
                        </p>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: getRoleColor() }}>
                          {userProfile?.level || 1}
                        </div>
                        <div className="text-xs text-gray-600">Nivel</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: getRoleColor() }}>
                          {userProfile?.xp || 0}
                        </div>
                        <div className="text-xs text-gray-600">XP Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: getRoleColor() }}>
                          {getCompletedCourses()}
                        </div>
                        <div className="text-xs text-gray-600">Completados</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Level Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" style={{ color: getRoleColor() }} />
                      <span>Progreso de Nivel</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Nivel {userProfile?.level || 1}</span>
                        <span className="text-sm text-gray-600">Nivel {(userProfile?.level || 1) + 1}</span>
                      </div>
                      <Progress value={getNextLevelProgress()} className="h-3" />
                      <p className="text-sm text-gray-600 text-center">
                        {getXPToNextLevel()} XP para el siguiente nivel
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Achievements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5" style={{ color: getRoleColor() }} />
                      <span>Logros Recientes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {achievements.length > 0 ? (
                      <div className="space-y-3">
                        {achievements.slice(0, 3).map((achievement, index) => (
                          <div key={achievement.id} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-lg">{achievement.icon}</span>
                            </div>
                            <span className="text-sm font-medium">{achievement.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Aún no tienes logros. ¡Comienza a aprender para desbloquearlos!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Detailed Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" style={{ color: getRoleColor() }} />
                      <span>Información Personal</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{userProfile?.email || 'No especificado'}</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={editedProfile.phone}
                            onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                            placeholder="Tu número de teléfono"
                            className="mt-1"
                          />
                        ) : (
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{userProfile?.phone || 'No especificado'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="location">Ubicación</Label>
                        {isEditing ? (
                          <Input
                            id="location"
                            value={editedProfile.location}
                            onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                            placeholder="Tu ciudad, país"
                            className="mt-1"
                          />
                        ) : (
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{userProfile?.location || 'No especificado'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="aiExperience">Nivel de IA</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Star className="w-4 h-4 text-gray-400" />
                          <span className="text-sm capitalize">
                            {userProfile?.aiExperience === 'beginner' ? '🌱 Principiante' :
                             userProfile?.aiExperience === 'intermediate' ? '📚 Intermedio' :
                             userProfile?.aiExperience === 'advanced' ? '🚀 Avanzado' :
                             'No especificado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Role-specific Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5" style={{ color: getRoleColor() }} />
                      <span>Información {getRoleTitle()}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {role === 'student' && (
                        <>
                          <div>
                            <Label htmlFor="institution">Institución</Label>
                            {isEditing ? (
                              <Input
                                id="institution"
                                value={editedProfile.institution}
                                onChange={(e) => setEditedProfile({ ...editedProfile, institution: e.target.value })}
                                placeholder="Tu institución educativa"
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-sm mt-1">{userProfile?.institution || 'No especificado'}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="level">Nivel Académico</Label>
                            <p className="text-sm mt-1">{userProfile?.level || 'No especificado'}</p>
                          </div>
                        </>
                      )}

                      {role === 'teacher' && (
                        <>
                          <div>
                            <Label htmlFor="specialty">Especialidad</Label>
                            {isEditing ? (
                              <Input
                                id="specialty"
                                value={editedProfile.specialty}
                                onChange={(e) => setEditedProfile({ ...editedProfile, specialty: e.target.value })}
                                placeholder="Tu área de especialidad"
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-sm mt-1">{userProfile?.specialty || 'No especificado'}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="experience">Experiencia</Label>
                            <p className="text-sm mt-1">{userProfile?.experience || 'No especificado'}</p>
                          </div>
                        </>
                      )}

                      {role === 'professional' && (
                        <>
                          <div>
                            <Label htmlFor="workArea">Área de Trabajo</Label>
                            <p className="text-sm mt-1">{userProfile?.workArea || 'No especificado'}</p>
                          </div>
                          <div>
                            <Label htmlFor="company">Empresa</Label>
                            {isEditing ? (
                              <Input
                                id="company"
                                value={editedProfile.company}
                                onChange={(e) => setEditedProfile({ ...editedProfile, company: e.target.value })}
                                placeholder="Tu empresa actual"
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-sm mt-1">{userProfile?.company || 'No especificado'}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="w-5 h-5" style={{ color: getRoleColor() }} />
                      <span>Enlaces Sociales</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="website">Sitio Web</Label>
                        {isEditing ? (
                          <Input
                            id="website"
                            value={editedProfile.website}
                            onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                            placeholder="https://tu-sitio.com"
                            className="mt-1"
                          />
                        ) : (
                          <div className="flex items-center space-x-2 mt-1">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{userProfile?.website || 'No especificado'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="github">GitHub</Label>
                        {isEditing ? (
                          <Input
                            id="github"
                            value={editedProfile.github}
                            onChange={(e) => setEditedProfile({ ...editedProfile, github: e.target.value })}
                            placeholder="tu-usuario-github"
                            className="mt-1"
                          />
                        ) : (
                          <div className="flex items-center space-x-2 mt-1">
                            <Github className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{userProfile?.github || 'No especificado'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        {isEditing ? (
                          <Input
                            id="linkedin"
                            value={editedProfile.linkedin}
                            onChange={(e) => setEditedProfile({ ...editedProfile, linkedin: e.target.value })}
                            placeholder="tu-perfil-linkedin"
                            className="mt-1"
                          />
                        ) : (
                          <div className="flex items-center space-x-2 mt-1">
                            <Linkedin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{userProfile?.linkedin || 'No especificado'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Learning Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-white/90">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="w-5 h-5" style={{ color: getRoleColor() }} />
                      <span>Estadísticas de Aprendizaje</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold" style={{ color: getRoleColor() }}>
                          {getEnrolledCourses()}
                        </div>
                        <div className="text-sm text-gray-600">Cursos Inscritos</div>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold" style={{ color: getRoleColor() }}>
                          {getCompletedCourses()}
                        </div>
                        <div className="text-sm text-gray-600">Completados</div>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                          <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold" style={{ color: getRoleColor() }}>
                          {userProfile?.xp || 0}
                        </div>
                        <div className="text-sm text-gray-600">XP Total</div>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                          <Flame className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold" style={{ color: getRoleColor() }}>
                          {userProfile?.currentStreak || 0}
                        </div>
                        <div className="text-sm text-gray-600">Racha (días)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}