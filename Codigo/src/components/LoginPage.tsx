/**
 * LoginPage Component - Página de inicio de sesión
 * 
 * Proporciona una interfaz completa para que los usuarios inicien sesión en ANIUET Scholar.
 * 
 * Características principales:
 * - Inicio de sesión con email y contraseña
 * - Validación de formato de email
 * - Opción de mostrar/ocultar contraseña
 * - Recuperación de contraseña integrada (modal o navegación)
 * - Manejo automático de email no confirmado
 * - Mensajes de error contextuales en español
 * - Animaciones suaves con Motion
 * - Diseño responsive con fondo dinámico
 * 
 * @component
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { authHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { EmailConfirmationHandler } from "./EmailConfirmationHandler";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

/**
 * Props para LoginPage
 * @interface LoginPageProps
 * @property {Function} onBack - Callback para volver a la pantalla anterior (registro)
 * @property {Function} onLoginSuccess - Callback cuando el login es exitoso, recibe usuario y sesión
 * @property {Function} [onPasswordReset] - Callback opcional para manejar recuperación de contraseña (navegación a página dedicada)
 */
interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: (user: any, session: any) => void;
  onPasswordReset?: (email?: string) => void;
}

export function LoginPage({ onBack, onLoginSuccess, onPasswordReset }: LoginPageProps) {
  // Estados del componente
  
  /** Datos del formulario de login (email y contraseña) */
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  /** Email para recuperación de contraseña (en el modal) */
  const [resetEmail, setResetEmail] = useState('');
  
  /** Control de visibilidad de contraseña */
  const [showPassword, setShowPassword] = useState(false);
  
  /** Estado de carga durante el proceso de login */
  const [isLoading, setIsLoading] = useState(false);
  
  /** Estado de carga durante solicitud de recuperación de contraseña */
  const [isResetLoading, setIsResetLoading] = useState(false);
  
  /** Control de visibilidad del diálogo de recuperación de contraseña */
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  /** Control de visibilidad del handler de confirmación de email */
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  
  /** Email que necesita confirmación */
  const [emailToConfirm, setEmailToConfirm] = useState("");

  /**
   * Actualiza los datos del formulario cuando el usuario escribe
   * @param key - Campo a actualizar ('email' o 'password')
   * @param value - Nuevo valor del campo
   */
  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Maneja el envío del formulario de login
   * 
   * Flujo:
   * 1. Valida campos requeridos
   * 2. Valida formato de email
   * 3. Intenta hacer login con Supabase Auth
   * 4. Maneja casos especiales (email no confirmado, etc.)
   * 5. Llama a onLoginSuccess si es exitoso
   * 
   * @param e - Evento del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login for:", formData.email);
      
      // Validación 1: Campos requeridos
      if (!formData.email || !formData.password) {
        toast.error("Por favor, completa todos los campos");
        return;
      }

      // Validación 2: Formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Por favor, ingresa un correo electrónico válido");
        return;
      }

      // Intentar login
      const { data, error } = await authHelpers.signIn(formData.email, formData.password);
      
      if (error) {
        console.error("Login error:", error);
        
        // Improved error handling
        let errorMessage = "Credenciales incorrectas";
        
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('Invalid password')) {
          errorMessage = "Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.";
        } else if (error.message?.includes('Email not confirmed') || error.code === 'email_not_confirmed') {
          // Show email confirmation handler
          setEmailToConfirm(formData.email);
          setShowEmailConfirmation(true);
          return;
        } else if (error.message?.includes('Too many requests') || 
                   error.message?.includes('rate limit')) {
          errorMessage = "Demasiados intentos. Espera un momento antes de intentar nuevamente.";
        } else if (error.message?.includes('Email not found') || 
                   error.message?.includes('User not found')) {
          errorMessage = "No se encontró una cuenta con este correo electrónico.";
        } else if (error.message?.includes('network') || 
                   error.message?.includes('fetch')) {
          errorMessage = "Error de conexión. Verifica tu internet e intenta nuevamente.";
        }
        
        toast.error(errorMessage);
        return;
      }

      if (data.session && data.user) {
        console.log("Login successful for user:", data.user.id);
        toast.success("¡Bienvenido de vuelta!");
        onLoginSuccess(data.user, data.session);
      } else {
        console.error("Login response missing session or user:", data);
        toast.error("Error: No se pudo establecer la sesión. Intenta nuevamente.");
      }

    } catch (error) {
      console.error("Login error:", error);
      if (error.message?.includes('fetch')) {
        toast.error("Error de conexión. Verifica tu internet e intenta nuevamente.");
      } else {
        toast.error("Error inesperado al iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Maneja la solicitud de recuperación de contraseña desde el modal
   * 
   * Flujo:
   * 1. Valida que se haya ingresado un email
   * 2. Solicita token de recuperación al backend
   * 3. Muestra mensaje de éxito
   * 4. Cierra el modal
   * 5. En desarrollo, muestra el enlace en consola
   * 
   * @param e - Evento del formulario
   */
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      // Validación: email requerido
      if (!resetEmail) {
        toast.error("Por favor, ingresa tu correo electrónico");
        return;
      }

      // Solicitar recuperación de contraseña
      const { data, error } = await authHelpers.requestPasswordReset(resetEmail);
      
      if (error) {
        console.error("Password reset error:", error);
        toast.error("Error al solicitar recuperación de contraseña");
        return;
      }

      // Éxito: cerrar modal y limpiar
      toast.success("Se ha enviado un enlace de recuperación a tu correo");
      setShowResetDialog(false);
      setResetEmail('');

      // Modo desarrollo: mostrar enlace en consola
      if (data.resetLink) {
        console.log("Reset link (development only):", data.resetLink);
        toast.info("Enlace de recuperación generado (revisa la consola en desarrollo)");
      }

    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Error al solicitar recuperación de contraseña");
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleConfirmationSuccess = () => {
    setShowEmailConfirmation(false);
    setEmailToConfirm("");
    toast.success("Email confirmado. Ahora puedes iniciar sesión.");
  };

  const handleCloseConfirmation = () => {
    setShowEmailConfirmation(false);
    setEmailToConfirm("");
  };

  return (
    <div className="min-h-screen relative py-8 px-4">
      <DynamicBackground variant="login" />
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
            <CardHeader className="text-center" style={{ borderBottom: '3px solid #4285F4' }}>
              <CardTitle className="text-2xl text-[#4285F4]">
                Iniciar Sesión 🔐
              </CardTitle>
              <p className="text-gray-600 mt-2 mb-4">
                Accede a tu cuenta de ANIUET Scholar
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="mt-1 pr-10"
                      placeholder="Tu contraseña"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-1 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit"
                    className="w-full mt-6 text-white transition-all duration-300 hover:shadow-lg bg-[#4285F4] hover:bg-[#3367d6]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </motion.div>

                <div className="text-center mt-4 space-y-2">
                  {onPasswordReset ? (
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-gray-600 hover:text-gray-800 text-sm"
                      onClick={() => onPasswordReset(formData.email)}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  ) : (
                    <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-gray-600 hover:text-gray-800 text-sm"
                        >
                          ¿Olvidaste tu contraseña?
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-[#4285F4]" />
                          Recuperar Contraseña
                        </DialogTitle>
                        <DialogDescription>
                          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                          <Label htmlFor="resetEmail">Correo Electrónico</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="resetEmail"
                              type="email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder="tu@email.com"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowResetDialog(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isResetLoading}
                            className="flex-1 bg-[#4285F4] hover:bg-[#3367d6] text-white"
                          >
                            {isResetLoading ? "Enviando..." : "Enviar"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  )}

                  <p className="text-sm text-gray-600">
                    ¿No tienes cuenta?{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-[#4285F4] hover:underline"
                      onClick={onBack}
                    >
                      Regístrate aquí
                    </Button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Email Confirmation Dialog */}
        <Dialog open={showEmailConfirmation} onOpenChange={setShowEmailConfirmation}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#4285F4]" />
                Confirmación de Email Requerida
              </DialogTitle>
              <DialogDescription>
                Tu cuenta existe pero necesita ser confirmada para poder iniciar sesión.
              </DialogDescription>
            </DialogHeader>
            <EmailConfirmationHandler
              email={emailToConfirm}
              onConfirmationSuccess={handleConfirmationSuccess}
              onClose={handleCloseConfirmation}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}