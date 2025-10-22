# Sistema de Recuperación de Contraseña - ANIUET Scholar

## 📋 Descripción General

El sistema de recuperación de contraseña de ANIUET Scholar es un flujo completo y seguro que permite a los usuarios restablecer sus contraseñas de manera confiable. El sistema está completamente funcional con backend real utilizando Supabase Auth y KV Store.

## 🏗️ Arquitectura

```
┌─────────────────┐       ┌──────────────────┐       ┌────────────────┐
│   Frontend      │  HTTP  │  Edge Function   │       │   Supabase     │
│  (React/TS)     │◄──────►│   (Hono Server)  │◄─────►│   Auth + KV    │
└─────────────────┘        └──────────────────┘       └────────────────┘
```

### Componentes

1. **Frontend** (`/components/PasswordResetPage.tsx`)
   - UI del flujo de recuperación en 4 pasos
   - Validaciones del lado del cliente
   - Manejo de errores con mensajes contextuales

2. **Backend** (`/supabase/functions/server/index.tsx`)
   - Generación y validación de tokens
   - Actualización de contraseñas usando Admin API
   - Almacenamiento seguro en KV Store

3. **Cliente** (`/utils/supabase/client.tsx`)
   - Helpers de autenticación
   - Comunicación con el backend
   - Manejo de errores mejorado

## 🔄 Flujo Completo

### Paso 1: Solicitud de Recuperación
```
Usuario → Ingresa email → Frontend valida → Backend genera token → 
Token guardado en KV Store (expira en 1 hora)
```

**Endpoint**: `POST /make-server-5ea56f4e/auth/reset-password`

**Request**:
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Si tu correo está registrado, recibirás un enlace...",
  "resetToken": "reset_1234567890_abc123", // Solo en desarrollo
  "resetLink": "#reset-password?email=...&token=...", // Solo en desarrollo
  "emailSent": false,
  "expiresIn": "1 hora"
}
```

**Datos almacenados en KV**:
```typescript
{
  email: "usuario@ejemplo.com",
  token: "reset_1234567890_abc123",
  createdAt: "2025-10-19T10:00:00.000Z",
  expiresAt: 1729335600000, // timestamp + 1 hora
  used: false,
  userId: "uuid-del-usuario"
}
```

### Paso 2: Actualización de Contraseña
```
Usuario → Ingresa nueva contraseña + token → Frontend valida → 
Backend valida token → Actualiza contraseña en Supabase Auth → 
Marca token como usado
```

**Endpoint**: `POST /make-server-5ea56f4e/auth/update-password`

**Request**:
```json
{
  "email": "usuario@ejemplo.com",
  "newPassword": "nuevaContraseñaSegura123",
  "resetToken": "reset_1234567890_abc123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "userId": "uuid-del-usuario"
}
```

## 🔒 Seguridad

### Validaciones Implementadas

#### Frontend
- ✅ Formato de email válido (regex)
- ✅ Contraseña mínimo 6 caracteres
- ✅ Contraseñas coinciden (confirmación)
- ✅ Recomendación de fortaleza (mayúsculas, minúsculas, números)

#### Backend
- ✅ Email debe existir en el sistema
- ✅ Token debe coincidir exactamente
- ✅ Token no debe estar expirado (1 hora)
- ✅ Token no debe haber sido usado previamente
- ✅ Contraseña debe cumplir requisitos mínimos
- ✅ Usuario debe existir en Supabase Auth

### Características de Seguridad

1. **Tokens de un solo uso**: Una vez usado, el token se marca como `used: true` y no puede reutilizarse
2. **Expiración temporal**: Tokens expiran después de 1 hora
3. **Almacenamiento seguro**: Tokens se almacenan en KV Store del servidor, nunca en localStorage del cliente
4. **No revelación de usuarios**: Si el email no existe, se devuelve el mismo mensaje de éxito (evita enumerar usuarios)
5. **Actualización con Service Role**: Las contraseñas se actualizan usando el Service Role Key de Supabase, que solo está disponible en el servidor

## 📱 Interfaz de Usuario

### Estados del Flujo

1. **'request'** - Solicitud inicial
   - Input: Email
   - Acción: Enviar enlace de recuperación
   - Siguiente: 'success'

2. **'success'** - Confirmación de envío
   - Muestra: Mensaje de éxito + token en desarrollo
   - Opciones: 
     - "Ya tengo el token" → 'reset'
     - "Ir al inicio de sesión" → Login
     - Botón "Usar Token" (si hay token generado) → 'reset'

3. **'reset'** - Ingresar nueva contraseña
   - Inputs: Email (disabled), Token, Nueva contraseña, Confirmar contraseña
   - Validaciones: Longitud, coincidencia, fortaleza
   - Acción: Actualizar contraseña
   - Siguiente: 'final'

4. **'final'** - Confirmación final
   - Muestra: Mensaje de éxito
   - Acción: "Iniciar Sesión Ahora" → Login

### Características UX

- ✨ Animaciones suaves con Motion
- 🎨 Diseño coherente con la paleta de ANIUET (#4285F4)
- 👁️ Mostrar/ocultar contraseña
- 📱 Responsive design
- 🌈 Fondo dinámico animado
- ⚡ Feedback inmediato con toasts
- 🔄 Estados de carga claros

## 🧪 Testing en Desarrollo

### Modo Desarrollo

Cuando el backend genera un token, lo retorna en la respuesta para facilitar testing:

```javascript
// En consola del navegador
Reset token (development/fallback): reset_1729335000000_abc123

// Toast interactivo con botón "Usar Token"
// Clic en el botón auto-rellena el token y cambia al paso 'reset'
```

### URLs de Recuperación

El sistema soporta múltiples formatos de URL:

```
# Hash fragment (SPA friendly)
#reset-password?email=user@example.com&token=reset_123_abc

# Query parameters
?email=user@example.com&token=reset_123_abc

# Props del componente
<PasswordResetPage email="user@example.com" resetToken="reset_123_abc" />
```

## 🛠️ Integración

### Desde LoginPage

```tsx
// Opción 1: Modal integrado (por defecto)
<LoginPage 
  onBack={handleBack}
  onLoginSuccess={handleLoginSuccess}
/>

// Opción 2: Navegación a página dedicada
<LoginPage 
  onBack={handleBack}
  onLoginSuccess={handleLoginSuccess}
  onPasswordReset={(email) => navigate('/reset-password', { email })}
/>
```

### Uso Directo

```tsx
<PasswordResetPage
  onBack={() => navigate('/login')}
  onSuccess={() => navigate('/login')}
  email="user@example.com" // Opcional: pre-rellenar
  resetToken="reset_123_abc" // Opcional: desde URL o email
/>
```

## 📊 Manejo de Errores

### Errores del Cliente

| Error | Mensaje | Acción |
|-------|---------|--------|
| Email vacío | "Por favor, ingresa tu correo electrónico" | Usuario debe ingresar email |
| Email inválido | "Por favor, ingresa un correo electrónico válido" | Usuario debe corregir formato |
| Contraseña corta | "La contraseña debe tener al menos 6 caracteres" | Usuario debe usar contraseña más larga |
| Contraseñas no coinciden | "Las contraseñas no coinciden" | Usuario debe verificar confirmación |
| Token vacío | "Token de recuperación requerido" | Usuario debe ingresar token |

### Errores del Servidor

| Error | Mensaje | Causa |
|-------|---------|-------|
| Token no encontrado | "Token de recuperación no encontrado o expirado" | Token no existe en KV |
| Token inválido | "Token de recuperación inválido" | Token no coincide |
| Token expirado | "El token de recuperación ha expirado. Solicita un nuevo enlace" | Pasó más de 1 hora |
| Token usado | "Este token ya ha sido utilizado. Solicita un nuevo enlace" | Token marcado como `used: true` |
| Usuario no encontrado | "Usuario no encontrado" | Email no existe en Auth |
| Error de red | "Error de conexión. Verifica tu internet..." | Problema de conectividad |

## 🔮 Mejoras Futuras (Producción)

### Envío de Emails

```typescript
// En /make-server-5ea56f4e/auth/reset-password
import { Resend } from 'resend'; // Ejemplo con Resend

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

await resend.emails.send({
  from: 'noreply@aniuet.com',
  to: email,
  subject: 'Recuperación de Contraseña - ANIUET Scholar',
  html: `
    <h1>Recupera tu contraseña</h1>
    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
    <a href="${resetLink}">Restablecer Contraseña</a>
    <p>Este enlace expira en 1 hora.</p>
  `
});
```

### Personalización de Tokens

- Aumentar/disminuir tiempo de expiración según necesidades
- Limitar número de intentos de recuperación por día
- Agregar verificación de identidad adicional (preguntas de seguridad, 2FA)

### Auditoría

```typescript
// Registrar intentos de recuperación
await kv.set(`password_reset_log:${email}:${Date.now()}`, {
  email,
  timestamp: new Date().toISOString(),
  ip: c.req.header('x-forwarded-for'),
  success: true
});
```

## 📝 Logs del Sistema

### Logs de Solicitud
```
Password reset requested for email: usuario@ejemplo.com
Password reset token created for usuario@ejemplo.com: reset_1729335000000_abc123
```

### Logs de Actualización
```
Password update attempt for email: usuario@ejemplo.com
Password successfully updated for user: usuario@ejemplo.com
```

### Logs de Errores
```
Password reset request missing email
Invalid reset token for email: usuario@ejemplo.com
Expired reset token for email: usuario@ejemplo.com
```

## ✅ Checklist de Funcionalidad

- [x] Solicitud de recuperación con email
- [x] Generación de tokens únicos
- [x] Almacenamiento seguro en KV Store
- [x] Expiración de tokens (1 hora)
- [x] Validación de tokens
- [x] Tokens de un solo uso
- [x] Actualización de contraseña con Supabase Admin API
- [x] Validaciones del lado del cliente
- [x] Validaciones del lado del servidor
- [x] Mensajes de error contextuales en español
- [x] UI completa con 4 pasos
- [x] Soporte para URLs con parámetros
- [x] Modo desarrollo con tokens visibles
- [x] Integración con LoginPage
- [x] Documentación completa del código
- [x] Documentación de arquitectura
- [ ] Envío de emails en producción (pendiente)
- [ ] Tests unitarios (pendiente)
- [ ] Tests de integración (pendiente)

## 🎓 Conclusión

El sistema de recuperación de contraseña está **100% funcional** con backend real, validaciones robustas, y una experiencia de usuario pulida. Está listo para uso en desarrollo y puede escalarse fácilmente a producción agregando el servicio de envío de emails.

---

**Última actualización**: 19 de octubre de 2025
**Versión**: 1.0.0
**Estado**: ✅ Completamente funcional
