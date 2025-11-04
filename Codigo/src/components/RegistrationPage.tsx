import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { DuplicateUserAlert } from "./DuplicateUserAlert";
import { authHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface RegistrationPageProps {
  role: 'student' | 'teacher' | 'professional';
  onBack: () => void;
  onComplete: (aiLevel: 'beginner' | 'intermediate' | 'advanced', skipOnboarding?: boolean) => void;
  onTakeQuiz: () => void;
  onRegistrationSuccess: (user: any, session: any) => void;
  aiLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
}

export function RegistrationPage({ role, onBack, onComplete, onTakeQuiz, onRegistrationSuccess, aiLevel }: RegistrationPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    aiExperience: aiLevel || '', // New AI level field
    // Role-specific fields
    level: '',
    institution: '',
    specialty: '',
    experience: '',
    workArea: '',
    company: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const getRoleConfig = () => {
    switch (role) {
      case 'student':
        return {
          title: 'Registro de Alumno 🎓',
          color: '#E3701B',
          fields: [
            { key: 'level', label: 'Nivel Académico', type: 'select', options: ['Preparatoria', 'Universidad', 'Posgrado'] },
            { key: 'institution', label: 'Institución', type: 'input' }
          ]
        };
      case 'teacher':
        return {
          title: 'Registro de Maestro 🧑‍🏫',
          color: '#4285F4',
          fields: [
            { key: 'specialty', label: 'Especialidad', type: 'input' },
            { key: 'experience', label: 'Años de Experiencia', type: 'select', options: ['1-2 años', '3-5 años', '6-10 años', '10+ años'] }
          ]
        };
      case 'professional':
        return {
          title: 'Registro de Profesional 👩‍💼',
          color: '#C4423D',
          fields: [
            { key: 'workArea', label: 'Área de Especialidad', type: 'select', options: ['Arquitecto de Sistemas de Inteligencia Artificial', 'Analista de Datos de Negocio', 'Marketing', 'Ciencia de Datos', 'Ingeniero de Datos', 'Otro'] },
            { key: 'company', label: 'Empresa (opcional)', type: 'input', required: false }
          ]
        };
      default:
        return { title: '', color: '', fields: [] };
    }
  };

  const config = getRoleConfig();

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Enhanced validation
      if (!formData.name.trim()) {
        toast.error('El nombre es requerido');
        return;
      }
      if (!formData.email.trim()) {
        toast.error('El correo electrónico es requerido');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (!formData.aiExperience) {
        toast.error('Por favor selecciona tu nivel de experiencia en IA');
        return;
      }

      console.log("Attempting registration for:", formData.email);

      // Prepare user data for backend
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role,
        aiExperience: formData.aiExperience
      };

      // Add role-specific fields
      config.fields.forEach(field => {
        if (formData[field.key as keyof typeof formData]) {
          userData[field.key] = formData[field.key as keyof typeof formData];
        }
      });

      // Register with backend
      const { data, error } = await authHelpers.signUp(formData.email.trim().toLowerCase(), formData.password, userData);

      if (error) {
        console.error("Registration error:", error);
        
        // Handle specific error cases
        if (error.message && (
            error.message.includes('Ya existe una cuenta con este correo') ||
            error.message.includes('already registered') ||
            error.message.includes('email address not available')
          )) {
          toast.error("Ya existe una cuenta con este correo electrónico");
          
          // Show option to go to login
          setTimeout(() => {
            toast.info("¿Ya tienes cuenta?", {
              duration: 5000,
              action: {
                label: "Iniciar Sesión",
                onClick: () => {
                  // First go back to home, then navigate to login
                  onBack();
                  // Use a small delay to ensure state change happens
                  setTimeout(() => {
                    // This will be handled by the parent component
                    window.dispatchEvent(new CustomEvent('navigate-to-login'));
                  }, 100);
                }
              }
            });
          }, 2000);
          return;
        }
        
        toast.error(error.message || "Error al registrarse");
        return;
      }

      console.log("Registration successful");
      toast.success("¡Cuenta creada exitosamente!");
      
      // If we have session data from auto-login, use it
      if (data && data.session) {
        onRegistrationSuccess(data.user, data.session);
        return;
      }
      
      // If registration succeeded but requires manual login
      if (data && data.requiresManualLogin) {
        console.log("Registration successful but requires manual login");
        toast.success("Cuenta creada exitosamente");
        toast.info("Por favor, inicia sesión manualmente", { duration: 4000 });
        
        // Navigate to login after a brief delay
        setTimeout(() => {
          onBack();
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('navigate-to-login'));
          }, 100);
        }, 2000);
        return;
      }
      
      // Otherwise, proceed with the original flow
      const aiLevel = formData.aiExperience as 'beginner' | 'intermediate' | 'advanced';
      const skipOnboarding = aiLevel === 'advanced';
      onComplete(aiLevel, skipOnboarding);

    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Error de conexión. Verifica tu internet e intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative py-8 px-4">
      <DynamicBackground variant="registration" />
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <img src={logo} alt="ANIUET Scholar" className="w-12 h-12 mx-auto mb-2" />
          <h2 className="text-xl text-[#4285F4]">ANIUET Scholar</h2>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="mb-6 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center" style={{ borderBottom: `3px solid ${config.color}` }}>
              <CardTitle className="text-2xl" style={{ color: config.color }}>
                {config.title}
              </CardTitle>
            </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1"
                  placeholder="Tu nombre completo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  📝 Ingresa tu nombre real. Por seriedad educativa, este no podrá modificarse después.
                </p>
              </div>

              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* AI Experience Level - Required for all roles */}
              <div className="border-t pt-4">
                <Label htmlFor="aiExperience" className="text-purple-700">Nivel de experiencia en IA *</Label>
                <Select 
                  value={formData.aiExperience} 
                  onValueChange={(value) => handleInputChange('aiExperience', value)}
                >
                  <SelectTrigger className="mt-1 border-purple-200">
                    <SelectValue placeholder="Selecciona tu nivel de experiencia en IA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Principiante - Nuevo en IA</SelectItem>
                    <SelectItem value="intermediate">📚 Intermedio - Conozco los básicos</SelectItem>
                    <SelectItem value="advanced">🚀 Avanzado - Tengo experiencia práctica</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.aiExperience && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <p className="text-sm text-blue-700">
                      ✅ Nivel seleccionado: {
                        formData.aiExperience === 'beginner' ? '🌱 Principiante' :
                        formData.aiExperience === 'intermediate' ? '📚 Intermedio' :
                        '🚀 Avanzado'
                      }
                      {formData.aiExperience === 'advanced' && (
                        <span className="block mt-1 text-green-600">
                          ✨ ¡Con tu nivel avanzado podrás acceder directamente a cursos especializados!
                        </span>
                      )}
                    </p>
                  </motion.div>
                )}
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-3"
                >
                  <Button
                    type="button"
                    onClick={onTakeQuiz}
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    🧠 Hacer examen para validar mi nivel
                  </Button>
                </motion.div>
              </div>

              {/* Role-specific Fields */}
              {config.fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {field.label} {field.required !== false && '*'}
                  </Label>
                  {field.type === 'select' ? (
                    <Select onValueChange={(value) => handleInputChange(field.key, value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={`Selecciona ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type="text"
                      required={field.required !== false}
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit"
                  className="w-full mt-6 text-white transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: config.color }}
                  disabled={isLoading}
                >
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
