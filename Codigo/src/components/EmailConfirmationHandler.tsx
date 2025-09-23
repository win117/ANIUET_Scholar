import { useState } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { authHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";

interface EmailConfirmationHandlerProps {
  email: string;
  onConfirmationSuccess: () => void;
  onClose: () => void;
}

export function EmailConfirmationHandler({ 
  email, 
  onConfirmationSuccess, 
  onClose 
}: EmailConfirmationHandlerProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string>("");
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);

  const handleConfirmEmail = async () => {
    setIsConfirming(true);
    setConfirmationMessage("");
    
    try {
      // First try normal confirmation
      let { data, error } = await authHelpers.confirmUser(email);
      
      if (error) {
        console.log("Normal confirmation failed, trying force confirmation:", error);
        setConfirmationMessage("Confirmación normal falló, intentando confirmación forzosa...");
        
        // Try force confirmation
        const forceResult = await authHelpers.forceConfirmUser(email);
        
        if (forceResult.error) {
          throw forceResult.error;
        }
        
        data = forceResult.data;
      }
      
      setConfirmationSuccess(true);
      setConfirmationMessage(data.message || "Email confirmado exitosamente");
      toast.success("Email confirmado correctamente");
      
      // Wait a moment before allowing login
      setTimeout(() => {
        onConfirmationSuccess();
      }, 2000);
      
    } catch (error) {
      console.error('Email confirmation error:', error);
      setConfirmationMessage(error.message || "Error al confirmar el email");
      toast.error("Error al confirmar el email");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setIsRequestingReset(true);
    
    try {
      const { data, error } = await authHelpers.requestPasswordReset(email);
      
      if (error) {
        throw error;
      }
      
      toast.success("Se ha enviado un enlace de recuperación a tu correo");
      setConfirmationMessage("Se ha enviado un enlace de recuperación. Revísalo para activar tu cuenta.");
      
    } catch (error) {
      console.error('Password reset request error:', error);
      toast.error("Error al solicitar recuperación de contraseña");
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tu cuenta existe pero el email no está confirmado. Puedes usar una de las siguientes opciones:
        </AlertDescription>
      </Alert>

      {confirmationMessage && (
        <Alert className={confirmationSuccess ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          {confirmationSuccess ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription className={confirmationSuccess ? "text-green-800" : "text-yellow-800"}>
            {confirmationMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3">
        <Button
          onClick={handleConfirmEmail}
          disabled={isConfirming || confirmationSuccess}
          className="w-full"
          variant="default"
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando email...
            </>
          ) : confirmationSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Email confirmado
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Confirmar email ahora
            </>
          )}
        </Button>

        <Button
          onClick={handleRequestPasswordReset}
          disabled={isRequestingReset || confirmationSuccess}
          variant="outline"
          className="w-full"
        >
          {isRequestingReset ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando enlace...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Solicitar recuperación de contraseña
            </>
          )}
        </Button>

        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full"
        >
          Cancelar
        </Button>
      </div>

      <div className="text-sm text-gray-600 space-y-2">
        <p>
          <strong>¿Qué está pasando?</strong>
        </p>
        <p>
          Tu cuenta fue creada exitosamente pero el sistema de confirmación automática por email no funcionó. 
          Esto puede suceder debido a problemas temporales del servidor o configuración del email.
        </p>
        <p>
          <strong>Soluciones disponibles:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Confirmar email ahora:</strong> Activará tu cuenta inmediatamente sin necesidad de correo</li>
          <li><strong>Recuperar contraseña:</strong> Te enviará un enlace por correo que también activará tu cuenta</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Email: <code className="bg-gray-100 px-1 rounded">{email}</code>
        </p>
      </div>
    </div>
  );
}