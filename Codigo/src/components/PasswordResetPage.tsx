import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { authHelpers, apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface PasswordResetPageProps {
  onBack: () => void;
  onSuccess: () => void;
  email?: string;
  resetToken?: string;
}

export function PasswordResetPage({ onBack, onSuccess, email: initialEmail, resetToken }: PasswordResetPageProps) {
  const [step, setStep] = useState<'request' | 'reset' | 'success' | 'final'>('request');
  const [email, setEmail] = useState(initialEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  useEffect(() => {
    // Check for parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    let emailFromUrl = '';
    let tokenFromUrl = '';
    
    // Check hash parameters first (for #reset-password?email=...&token=...)
    if (hash.includes('reset-password')) {
      const hashParams = new URLSearchParams(hash.split('?')[1] || '');
      emailFromUrl = hashParams.get('email') || '';
      tokenFromUrl = hashParams.get('token') || '';
    } else {
      // Check regular URL parameters
      emailFromUrl = urlParams.get('email') || '';
      tokenFromUrl = urlParams.get('token') || '';
    }
    
    // Use URL parameters if available, otherwise use props
    const finalEmail = emailFromUrl || initialEmail || '';
    const finalToken = tokenFromUrl || resetToken || '';
    
    if (finalEmail) {
      setEmail(finalEmail);
    }
    
    if (finalEmail && finalToken) {
      setResetTokenInput(finalToken);
      setStep('reset');
    }
  }, [initialEmail, resetToken]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email) {
        toast.error("Por favor, ingresa tu correo electrónico");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Por favor, ingresa un correo electrónico válido");
        return;
      }

      const { data, error } = await authHelpers.requestPasswordReset(email);
      
      if (error) {
        console.error("Password reset error:", error);
        if (error.message?.includes('formato') || error.message?.includes('inválido')) {
          toast.error("Formato de correo electrónico inválido");
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          toast.error("Error de conexión. Verifica tu internet e intenta nuevamente.");
        } else {
          toast.error("Error al solicitar recuperación de contraseña. Intenta nuevamente.");
        }
        return;
      }

      // Show success message
      if (data.emailSent) {
        toast.success("Se ha enviado un enlace de recuperación a tu correo electrónico");
      } else {
        toast.success("Se ha generado un enlace de recuperación");
      }
      
      // In development or when email service fails, show the reset token
      if (data.resetToken) {
        setGeneratedToken(data.resetToken);
        console.log("Reset token (development/fallback):", data.resetToken);
        
        // Show development helper
        setTimeout(() => {
          toast.info("Token generado", {
            duration: 15000,
            action: {
              label: "Usar Token",
              onClick: () => {
                setResetTokenInput(data.resetToken);
                setStep('reset');
              }
            }
          });
        }, 1500);
      }

      setStep('success');

    } catch (error) {
      console.error("Password reset error:", error);
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        toast.error("Error de conexión. Verifica tu internet e intenta nuevamente.");
      } else {
        toast.error("Error inesperado al solicitar recuperación. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Comprehensive validation
      if (!newPassword || !confirmPassword) {
        toast.error("Por favor, completa todos los campos");
        return;
      }

      if (!resetTokenInput && !resetToken) {
        toast.error("Token de recuperación requerido");
        return;
      }

      if (newPassword.length < 6) {
        toast.error("La nueva contraseña debe tener al menos 6 caracteres");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }

      // Check password strength
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        toast.warning("Se recomienda que la contraseña contenga mayúsculas, minúsculas y números para mayor seguridad");
      }

      const tokenToUse = resetTokenInput || resetToken || '';
      const { data, error } = await authHelpers.updatePassword(email, newPassword, tokenToUse);
      
      if (error) {
        console.error("Password update error:", error);
        
        let errorMessage = "Error al actualizar la contraseña";
        if (error.message?.includes('Token') || error.message?.includes('token')) {
          errorMessage = "Token de recuperación inválido o expirado. Solicita un nuevo enlace.";
        } else if (error.message?.includes('Usuario no encontrado')) {
          errorMessage = "Usuario no encontrado. Verifica tu correo electrónico.";
        } else if (error.message?.includes('expirado')) {
          errorMessage = "El token de recuperación ha expirado. Solicita un nuevo enlace.";
        } else if (error.message?.includes('utilizado')) {
          errorMessage = "Este token ya ha sido utilizado. Solicita un nuevo enlace.";
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = "Error de conexión. Verifica tu internet e intenta nuevamente.";
        }
        
        toast.error(errorMessage);
        return;
      }

      toast.success("¡Contraseña actualizada exitosamente!");
      
      // Clear sensitive data
      setNewPassword('');
      setConfirmPassword('');
      setResetTokenInput('');
      
      // Go to final success step
      setTimeout(() => {
        setStep('final');
      }, 1500);

    } catch (error) {
      console.error("Password update error:", error);
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        toast.error("Error de conexión. Verifica tu internet e intenta nuevamente.");
      } else {
        toast.error("Error inesperado al actualizar la contraseña. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetResetLink = async () => {
    try {
      const { data, error } = await apiHelpers.getPasswordResetLink(email);
      if (data && data.resetToken) {
        setResetTokenInput(data.resetToken);
        toast.success("Token de recuperación obtenido");
      } else if (error) {
        toast.error("No se encontró token de recuperación");
      }
    } catch (error) {
      toast.error("Error al obtener token de recuperación");
    }
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
            {step === 'request' && (
              <>
                <CardHeader className="text-center" style={{ borderBottom: '3px solid #4285F4' }}>
                  <CardTitle className="text-2xl text-[#4285F4]">
                    Recuperar Contraseña 🔐
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Ingresa tu correo para recibir un enlace de recuperación
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full mt-6 text-white bg-[#4285F4] hover:bg-[#3367d6]"
                      disabled={isLoading}
                    >
                      {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}

            {step === 'reset' && (
              <>
                <CardHeader className="text-center" style={{ borderBottom: '3px solid #4285F4' }}>
                  <CardTitle className="text-2xl text-[#4285F4]">
                    Nueva Contraseña 🔑
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Crea una nueva contraseña para tu cuenta
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="email-display">Correo Electrónico</Label>
                      <Input
                        id="email-display"
                        type="email"
                        value={email}
                        disabled
                        className="mt-1 bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="resetToken">Token de Recuperación *</Label>
                      <Input
                        id="resetToken"
                        type="text"
                        required
                        value={resetTokenInput}
                        onChange={(e) => setResetTokenInput(e.target.value)}
                        className="mt-1"
                        placeholder="Ingresa el token recibido por correo"
                      />
                      {generatedToken && (
                        <p className="text-xs text-blue-600 mt-1">
                          Token de desarrollo: {generatedToken}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 pr-10"
                          placeholder="Al menos 6 caracteres"
                          minLength={6}
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

                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1"
                        placeholder="Repite la nueva contraseña"
                        minLength={6}
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full mt-6 text-white bg-[#4285F4] hover:bg-[#3367d6]"
                      disabled={isLoading}
                    >
                      {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}

            {step === 'success' && (
              <>
                <CardHeader className="text-center" style={{ borderBottom: '3px solid #10B981' }}>
                  <CardTitle className="text-2xl text-[#10B981] flex items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    ¡Enviado! ✅
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 text-center">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700">
                        Se ha enviado un enlace de recuperación a tu correo electrónico.
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        Revisa tu bandeja de entrada y la carpeta de spam.
                      </p>
                    </div>

                    {/* Development helper */}
                    {generatedToken && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-700 text-sm mb-2">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Modo de desarrollo - Token generado:
                        </p>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs break-all font-mono">
                          {generatedToken}
                        </div>
                        <Button
                          onClick={() => {
                            setResetTokenInput(generatedToken);
                            setStep('reset');
                          }}
                          size="sm"
                          className="mt-2 bg-[#4285F4] hover:bg-[#3367d6] text-white"
                        >
                          Usar este token
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button 
                        onClick={() => setStep('reset')}
                        variant="outline"
                        className="w-full"
                      >
                        Ya tengo el token de recuperación
                      </Button>
                      <Button 
                        onClick={onSuccess}
                        className="w-full bg-[#4285F4] hover:bg-[#3367d6] text-white"
                      >
                        Ir al Inicio de Sesión
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {step === 'final' && (
              <>
                <CardHeader className="text-center" style={{ borderBottom: '3px solid #10B981' }}>
                  <CardTitle className="text-2xl text-[#10B981] flex items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    ¡Completado! 🎉
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 text-center">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700">
                        Tu contraseña ha sido actualizada exitosamente.
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        Ya puedes iniciar sesión con tu nueva contraseña.
                      </p>
                    </div>

                    <Button 
                      onClick={onSuccess}
                      className="w-full bg-[#4285F4] hover:bg-[#3367d6] text-white"
                    >
                      Iniciar Sesión Ahora
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}