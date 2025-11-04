import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { GraduationCap, User, BriefcaseBusiness } from "lucide-react";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface HomePageProps {
  onRoleSelect: (role: 'student' | 'teacher' | 'professional') => void;
  onLogin: () => void;
}

export function HomePage({ onRoleSelect, onLogin }: HomePageProps) {
  return (
    <div className="min-h-screen relative">
      <DynamicBackground variant="home" />
      {/* Header with Logo */}
      <header className="text-center py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center mb-6"
          >
            <img 
              src={logo} 
              alt="ANIUET Scholar Logo" 
              className="w-16 h-16 mb-4"
            />
            <h1 className="text-4xl md:text-5xl mb-4 text-[#4285F4] font-bold">
              ANIUET Scholar
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600"
          >
            Inicia tu camino en IA aplicada
          </motion.p>
        </div>
      </header>

      {/* Role Selection Cards */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {/* Student Card */}
          <motion.div
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 25px -5px rgba(227, 112, 27, 0.1), 0 10px 10px -5px rgba(227, 112, 27, 0.04)" 
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="cursor-pointer border-2 hover:border-[#E3701B] transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <motion.div 
                  className="mx-auto mb-4 w-16 h-16 bg-[#E3701B]/10 rounded-full flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <GraduationCap className="w-8 h-8 text-[#E3701B]" />
                </motion.div>
                <CardTitle className="text-2xl text-[#4285F4]">Alumno 🎓</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Accede a contenido personalizado y herramientas de estudio inteligentes
                </p>
                <Button 
                  onClick={() => onRoleSelect('student')}
                  className="w-full bg-[#E3701B] hover:bg-[#E3701B]/90 text-white transition-all duration-300 hover:shadow-lg"
                >
                  Registrarse como Alumno
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Teacher Card */}
          <motion.div
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 25px -5px rgba(66, 133, 244, 0.1), 0 10px 10px -5px rgba(66, 133, 244, 0.04)" 
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="cursor-pointer border-2 hover:border-[#4285F4] transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <motion.div 
                  className="mx-auto mb-4 w-16 h-16 bg-[#4285F4]/10 rounded-full flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <User className="w-8 h-8 text-[#4285F4]" />
                </motion.div>
                <CardTitle className="text-2xl text-[#4285F4]">Maestro 🧑‍🏫</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Crea cursos innovadores y gestiona el aprendizaje de tus estudiantes
                </p>
                <Button 
                  onClick={() => onRoleSelect('teacher')}
                  className="w-full bg-[#4285F4] hover:bg-[#4285F4]/90 text-white transition-all duration-300 hover:shadow-lg"
                >
                  Registrarse como Maestro
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Professional Card */}
          <motion.div
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 25px -5px rgba(196, 66, 61, 0.1), 0 10px 10px -5px rgba(196, 66, 61, 0.04)" 
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="cursor-pointer border-2 hover:border-[#C4423D] transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <motion.div 
                  className="mx-auto mb-4 w-16 h-16 bg-[#C4423D]/10 rounded-full flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <BriefcaseBusiness className="w-8 h-8 text-[#C4423D]" />
                </motion.div>
                <CardTitle className="text-2xl text-[#4285F4]">Profesional 👩‍💼</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Desarrolla habilidades avanzadas y mantente actualizado en tu campo
                </p>
                <Button 
                  onClick={() => onRoleSelect('professional')}
                  className="w-full bg-[#C4423D] hover:bg-[#C4423D]/90 text-white transition-all duration-300 hover:shadow-lg"
                >
                  Registrarse como Profesional
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Login Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-600 mb-4">¿Ya tienes una cuenta?</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={onLogin}
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
            >
              Iniciar Sesión
            </Button>
          </motion.div>
        </motion.div>

        {/* Test Link */}
        {/*<motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center pt-8 border-t border-gray-200 mt-8"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={() => window.location.href = '?test=auth'}
              variant="ghost" 
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              🔧 Pruebas del Sistema de Autenticación
            </Button>
          </motion.div>
        </motion.div>
        */}
      </main>
    </div>
  );
}