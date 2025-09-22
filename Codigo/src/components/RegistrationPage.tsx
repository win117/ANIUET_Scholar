import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface RegistrationPageProps {
  role: 'student' | 'teacher' | 'professional';
  onBack: () => void;
  onComplete: (aiLevel: 'beginner' | 'intermediate' | 'advanced', skipOnboarding?: boolean) => void;
  onTakeQuiz: () => void;
}

export function RegistrationPage({ role, onBack, onComplete, onTakeQuiz }: RegistrationPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    aiExperience: '', // New AI level field
    // Role-specific fields
    level: '',
    institution: '',
    specialty: '',
    experience: '',
    workArea: '',
    company: ''
  });

  const getRoleConfig = () => {
    switch (role) {
      case 'student':
        return {
          title: 'Registro de Alumno 🎓',
          color: '#E3701B',
          fields: [
            { key: 'level', label: 'Nivel Académico', type: 'select', options: ['Primaria', 'Secundaria', 'Preparatoria', 'Universidad', 'Posgrado'] },
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
            { key: 'workArea', label: 'Área de Especialidad', type: 'select', options: ['Tecnología', 'Finanzas', 'Marketing', 'Operaciones', 'Recursos Humanos', 'Consultoría', 'Otro'] },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (!formData.aiExperience) {
      alert('Por favor selecciona tu nivel de experiencia en IA');
      return;
    }
    
    const aiLevel = formData.aiExperience as 'beginner' | 'intermediate' | 'advanced';
    const skipOnboarding = aiLevel === 'advanced';
    onComplete(aiLevel, skipOnboarding);
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
                />
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
                <Select onValueChange={(value) => handleInputChange('aiExperience', value)}>
                  <SelectTrigger className="mt-1 border-purple-200">
                    <SelectValue placeholder="Selecciona tu nivel de experiencia en IA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Principiante - Nuevo en IA</SelectItem>
                    <SelectItem value="intermediate">📚 Intermedio - Conozco los básicos</SelectItem>
                    <SelectItem value="advanced">🚀 Avanzado - Tengo experiencia práctica</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.aiExperience === 'advanced' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <p className="text-sm text-green-700 mb-2">
                      ✨ ¡Excelente! Con tu nivel avanzado podrás acceder directamente a cursos especializados.
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
                >
                  Crear Cuenta
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