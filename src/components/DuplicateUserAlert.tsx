import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { AlertCircle, User, ArrowRight } from "lucide-react";

interface DuplicateUserAlertProps {
  email: string;
  onLoginRedirect: () => void;
  onCancel: () => void;
  autoRedirect?: boolean;
  countdown?: number;
}

export function DuplicateUserAlert({ 
  email, 
  onLoginRedirect, 
  onCancel, 
  autoRedirect = false,
  countdown = 5
}: DuplicateUserAlertProps) {
  const [timeLeft, setTimeLeft] = useState(countdown);

  useEffect(() => {
    if (autoRedirect && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirect && timeLeft === 0) {
      onLoginRedirect();
    }
  }, [timeLeft, autoRedirect, onLoginRedirect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="space-y-3">
            <div>
              <strong>Ya existe una cuenta con este correo</strong>
              <p className="text-sm mt-1">
                El correo <strong>{email}</strong> ya está registrado en ANIUET Scholar.
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              <span>¿Ya tienes cuenta? Inicia sesión en su lugar</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={onLoginRedirect}
                size="sm"
                className="bg-[#4285F4] hover:bg-[#3367d6] text-white flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Ir a Iniciar Sesión
                {autoRedirect && timeLeft > 0 && (
                  <span className="text-xs">({timeLeft}s)</span>
                )}
              </Button>
              
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}