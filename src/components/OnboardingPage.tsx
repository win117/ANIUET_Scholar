import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { CheckCircle, Brain, Shield, Sparkles } from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface OnboardingPageProps {
  role: 'student' | 'teacher' | 'professional';
  onComplete: () => void;
}

export function OnboardingPage({ role, onComplete }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | boolean>>({});
  const totalSteps = 3;

  const getRoleConfig = () => {
    switch (role) {
      case 'student':
        return {
          welcome: '¡Bienvenido, Alumno! 🎓',
          color: '#E3701B',
          steps: [
            {
              title: 'Estilos de Aprendizaje',
              subtitle: 'Queremos conocer cómo aprendes mejor',
              icon: Brain,
              question: '¿Cuál es tu estilo de aprendizaje preferido?',
              type: 'quiz' as const,
              options: [
                { value: 'visual', label: 'Visual', description: 'Aprendes mejor con imágenes, diagramas y videos' },
                { value: 'auditivo', label: 'Auditivo', description: 'Prefieres explicaciones orales y discusiones' },
                { value: 'kinestesico', label: 'Kinestésico', description: 'Aprendes haciendo y practicando' },
                { value: 'lectura', label: 'Lectura/Escritura', description: 'Te gusta leer y tomar notas' }
              ]
            }
          ]
        };
      case 'teacher':
        return {
          welcome: '¡Bienvenido, Maestro! 🧑‍🏫',
          color: '#4285F4',
          steps: [
            {
              title: 'Metodología Educativa',
              subtitle: 'Comparte tu enfoque pedagógico',
              icon: Brain,
              question: '¿Qué metodología de enseñanza prefieres?',
              type: 'quiz' as const,
              options: [
                { value: 'tradicional', label: 'Tradicional', description: 'Clases magistrales con estructura formal' },
                { value: 'constructivista', label: 'Constructivista', description: 'Los estudiantes construyen su propio conocimiento' },
                { value: 'proyectos', label: 'Basado en Proyectos', description: 'Aprendizaje a través de proyectos prácticos' },
                { value: 'flipped', label: 'Aula Invertida', description: 'Teoría en casa, práctica en clase' }
              ]
            }
          ]
        };
      case 'professional':
        return {
          welcome: '¡Bienvenido, Profesional! 👩‍💼',
          color: '#C4423D',
          steps: [
            {
              title: 'Objetivos Profesionales',
              subtitle: 'Define tu ruta de crecimiento',
              icon: Brain,
              question: '¿Cuál es tu principal objetivo de desarrollo?',
              type: 'quiz' as const,
              options: [
                { value: 'liderazgo', label: 'Liderazgo', description: 'Desarrollar habilidades de gestión y liderazgo' },
                { value: 'tecnico', label: 'Técnico', description: 'Profundizar en conocimientos especializados' },
                { value: 'networking', label: 'Networking', description: 'Expandir red profesional y colaboraciones' },
                { value: 'innovacion', label: 'Innovación', description: 'Mantenerse al día con tendencias y tecnologías' }
              ]
            }
          ]
        };
      default:
        return { welcome: '', color: '', steps: [] };
    }
  };

  const config = getRoleConfig();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Steps definition
  const allSteps = [
    ...config.steps,
    {
      title: 'Tecnología Adaptativa',
      subtitle: 'ANIUET Scholar se adapta a ti',
      icon: Brain,
      type: 'biofeedback' as const,
      content: `🧠 ANIUET Scholar utiliza inteligencia artificial avanzada y biofeedback para crear una experiencia de aprendizaje verdaderamente personalizada.
      
      🎯 Nuestra tecnología adapta automáticamente:
      • El ritmo y dificultad de los cursos según tu progreso
      • Los horarios de estudio más efectivos para ti
      • El tipo de contenido (visual, auditivo, práctico) que mejor funciona
      • Descansos inteligentes para optimizar tu retención
      
      🔒 Todo se procesa de forma segura y tu privacidad está protegida.`
    },
    {
      title: '¡Todo Listo!',
      subtitle: 'Tu experiencia personalizada te espera',
      icon: Sparkles,
      type: 'completion' as const,
      content: `¡Perfecto! Tu perfil de aprendizaje está configurado.
      
      🚀 Ahora tienes acceso a:
      • Cursos que se adaptan automáticamente a tu estilo
      • IA que personaliza tu experiencia en tiempo real
      • Sistema de gamificación basado en tus preferencias
      • Seguimiento inteligente de tu progreso y objetivos
      
      ¡Comencemos tu viaje en el mundo de la Inteligencia Artificial!`
    }
  ];

  const currentStepData = allSteps[currentStep];

  const handleAnswer = (value: string | boolean) => {
    setResponses(prev => ({
      ...prev,
      [currentStep]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepCompleted = () => {
    if (currentStepData.type === 'quiz') {
      return responses[currentStep] !== undefined;
    } else if (currentStepData.type === 'terms' || currentStepData.type === 'biofeedback') {
      return responses[currentStep] === true;
    } else {
      return true; // completion step
    }
  };

  return (
    <div className="min-h-screen relative py-8 px-4">
      <DynamicBackground variant="onboarding" />
      
      <div className="max-w-3xl mx-auto">
        {/* Header with Logo and Welcome */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <img src={logo} alt="ANIUET Scholar" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl mb-4" style={{ color: config.color }}>
            {config.welcome}
          </h1>
          <p className="text-xl text-gray-600">
            Personalicemos tu experiencia en ANIUET Scholar
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Progreso del Setup</span>
            <span className="text-sm text-gray-600">
              {currentStep + 1} de {totalSteps}
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-3"
          />
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader style={{ borderBottom: `3px solid ${config.color}` }}>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <currentStepData.icon className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <div>
                  <CardTitle className="text-xl" style={{ color: config.color }}>
                    {currentStepData.title}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{currentStepData.subtitle}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              {currentStepData.type === 'quiz' && (
                <div>
                  <h3 className="text-lg mb-6 text-gray-800">
                    {currentStepData.question}
                  </h3>
                  
                  <RadioGroup
                    value={responses[currentStep] as string || ''}
                    onValueChange={handleAnswer}
                    className="space-y-4"
                  >
                    {currentStepData.options?.map((option) => (
                      <motion.div 
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={option.value} className="cursor-pointer block">
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                          </Label>
                        </div>
                        {responses[currentStep] === option.value && (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                        )}
                      </motion.div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {(currentStepData.type === 'terms' || currentStepData.type === 'biofeedback') && (
                <div>
                  <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-purple-200">
                    <div className="flex items-start space-x-3">
                      <Brain className="w-8 h-8 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="text-xl font-medium text-purple-900 mb-4">
                          🤖 Tecnología Adaptativa ANIUET
                        </h4>
                        <div className="text-purple-800 whitespace-pre-line leading-relaxed text-base">
                          {currentStepData.content}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center space-x-3 p-4 rounded-lg border-2 border-purple-200 hover:bg-purple-50 cursor-pointer bg-white shadow-sm"
                  >
                    <Checkbox 
                      id="terms"
                      checked={responses[currentStep] as boolean || false}
                      onCheckedChange={handleAnswer}
                      className="border-purple-400"
                    />
                    <Label htmlFor="terms" className="cursor-pointer text-purple-900 font-medium">
                      ✨ ¡Genial! Quiero que ANIUET adapte mi experiencia de aprendizaje usando IA
                    </Label>
                  </motion.div>
                </div>
              )}

              {currentStepData.type === 'completion' && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <Sparkles className="w-10 h-10" style={{ color: config.color }} />
                  </motion.div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                    <div className="text-gray-800 whitespace-pre-line leading-relaxed">
                      {currentStepData.content}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between items-center mt-8"
        >
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentStep === 0}
            className="px-6"
          >
            Anterior
          </Button>

          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index < currentStep 
                    ? 'bg-green-500'
                    : index === currentStep 
                      ? 'border-2' 
                      : 'bg-gray-300'
                }`}
                style={{ 
                  backgroundColor: index === currentStep ? config.color : undefined,
                  borderColor: index === currentStep ? config.color : undefined
                }}
              />
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleNext}
              disabled={!isStepCompleted()}
              className="px-6 text-white"
              style={{ backgroundColor: config.color }}
            >
              {currentStep === totalSteps - 1 ? '¡Comenzar!' : 'Siguiente'}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}