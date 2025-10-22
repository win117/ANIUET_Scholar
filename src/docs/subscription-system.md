# Sistema de Suscripción de ANIUET Scholar

## Descripción General

El sistema de suscripción permite a ANIUET Scholar ofrecer cursos gratuitos y de pago a través de tres niveles de suscripción (tiers).

## Niveles de Suscripción (Tiers)

### 1. **FREE (Básico)**
- Acceso a cursos básicos marcados como "free"
- Comunidad limitada
- Asistente IA básico (10 consultas/mes)
- Sin certificados digitales
- Sin acceso a cursos avanzados

### 2. **PRO**
- **Precio**: $60 MXN/mes o $576 MXN/año (20% descuento)
- **Badge**: Naranja (#E3701B)
- **Etiqueta**: "Más Popular"
- Todos los cursos disponibles
- Acceso completo a comunidad
- Asistente IA avanzado (ilimitado)
- Certificados digitales verificados
- Contenido exclusivo mensual
- Soporte prioritario
- Sesiones 1-a-1 con expertos
- Proyectos prácticos guiados
- Maestros: Gestión ilimitada de alumnos

### 3. **ENTERPRISE (Instituciones/Empresas)** (Solo para Maestros y Profesionales)
- **Precio**: Personalizado (Contactar ventas)
- **Badge**: Azul (#4285F4)
- Todo lo de Pro
- Soluciones personalizadas
- Usuarios ilimitados
- API dedicada
- Soporte 24/7 dedicado
- Integración con LMS
- Análisis y reportes avanzados
- White-label disponible
- Capacitación personalizada

## Componentes del Sistema

### Frontend

1. **SubscriptionPage.tsx**
   - Muestra planes de suscripción con precios mensuales/anuales
   - Toggle para cambiar entre facturación mensual y anual
   - Badges indicando el plan actual
   - Sección de preguntas frecuentes
   - Beneficios de cada plan

2. **DashboardPage.tsx**
   - Banner prominente mostrando tier actual
   - CTA para actualizar a Pro si el usuario está en tier gratuito
   - Botón para gestionar suscripción si está en tier Pro o Enterprise

3. **MyCoursesPage.tsx**
   - Badges de tier requerido en cada curso (GRATIS, PRO, ENTERPRISE)
   - Validación de acceso antes de permitir inscripción
   - Botón "Actualizar a PRO" para cursos bloqueados
   - Redirección automática a página de suscripción

4. **CourseMapPage.tsx**
   - Badge de tier requerido en el header del curso
   - Pantalla de bloqueo completa si el usuario no tiene el tier requerido
   - Lista de beneficios de actualizar
   - Botón para ver planes de suscripción

### Backend

#### Endpoints Modificados

1. **`POST /make-server-5ea56f4e/register-with-login`**
   - Inicializa `subscription_tier: 'free'` para nuevos usuarios

2. **`GET /make-server-5ea56f4e/user/profile`**
   - Retorna el campo `subscription_tier` del usuario
   - Inicializa en 'free' si no existe

3. **`PUT /make-server-5ea56f4e/user/profile`**
   - Permite actualizar el `subscription_tier` del usuario

4. **`POST /make-server-5ea56f4e/courses/enroll`**
   - Valida el tier del usuario antes de inscribir
   - Retorna error 403 si el tier es insuficiente
   - Mensaje descriptivo indicando tier requerido

#### Validación de Tier

```javascript
const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };

if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
  return error 403: "Suscripción insuficiente"
}
```

### Cursos con Tier

Los cursos ahora tienen el campo `requiredTier`:

```javascript
{
  id: 'intro-ai',
  title: 'Fundamentos de IA',
  requiredTier: 'free', // Curso gratuito
  // ...
}

{
  id: 'machine-learning',
  title: 'Machine Learning Básico',
  requiredTier: 'pro', // Requiere Pro
  // ...
}

{
  id: 'deep-learning',
  title: 'Deep Learning Avanzado',
  requiredTier: 'pro', // Requiere Pro
  // ...
}
```

## Flujo de Usuario

### Usuario con Tier Insuficiente

1. Usuario ve curso con badge "PRO" o "ENTERPRISE"
2. Intenta inscribirse
3. Sistema valida tier en el backend
4. Frontend muestra mensaje de error
5. Redirección automática a página de suscripción después de 2 segundos
6. Usuario puede ver planes y actualizar

### Usuario Intenta Acceder a Curso Pro

1. Usuario hace clic en curso Pro
2. CourseMapPage carga
3. Sistema valida tier del usuario
4. Si no tiene acceso:
   - Muestra pantalla de bloqueo
   - Lista beneficios de actualizar
   - Botones: "Volver a Cursos" y "Ver Planes de Suscripción"

## Navegación a Suscripciones

### Desde el Sidebar
- Botón "Suscripción" con icono de corona (Crown)
- Disponible en todos los roles

### Desde el Dashboard
- Banner prominente si tier = 'free'
- Card informativa si tier = 'pro' o 'enterprise'

### Desde MyCoursesPage
- Botón "Actualizar a PRO" en cursos bloqueados

### Desde CourseMapPage
- Botón "Ver Planes de Suscripción" en pantalla de bloqueo

## Procesamiento de Pagos

**Nota**: Actualmente el sistema simula el proceso de pago. Para producción, se debe:

1. Integrar pasarela de pago (Stripe, MercadoPago, etc.)
2. Implementar webhooks para confirmación de pago
3. Manejar renovaciones automáticas
4. Implementar sistema de facturación
5. Agregar historial de pagos

### Código de Simulación

```javascript
// En SubscriptionPage.tsx, línea 175
// Aquí iría la integración con pasarela de pago (Stripe, MercadoPago, etc.)
await new Promise(resolve => setTimeout(resolve, 2000));

const result = await apiHelpers.updateUserProfile(
  session.access_token,
  { subscription_tier: planId }
);
```

## Experiencia de Usuario

### Badges Visuales
- **GRATIS**: Badge gris (bg-gray-500)
- **PRO**: Badge naranja (#E3701B)
- **ENTERPRISE**: Badge azul (#4285F4)

### Colores del Sistema
- Naranja: #E3701B (Estudiante/Pro)
- Azul: #4285F4 (Maestro/Enterprise)
- Rojo: #C4423D (Profesional)
- Púrpura: #9333EA (Admin)

## Testing

### Cambiar Tier Manualmente (Para Testing)

Desde la SubscriptionPage, hacer clic en cualquier plan actualiza inmediatamente el tier en el backend.

### Verificar Restricciones

1. Crear usuario nuevo (tier = 'free' por defecto)
2. Intentar inscribirse en curso "machine-learning" (requiere 'pro')
3. Verificar mensaje de error
4. Actualizar a Pro ($60 MXN/mes) desde SubscriptionPage
5. Intentar inscribirse nuevamente
6. Verificar que ahora puede inscribirse

## Próximos Pasos

1. Integrar pasarela de pago real
2. Implementar sistema de cupones/descuentos
3. Agregar planes institucionales para escuelas
4. Implementar período de prueba gratuito
5. Agregar análisis de conversión de free a premium
6. Implementar emails transaccionales (bienvenida, confirmación de pago, etc.)

## Credenciales de Admin

Para acceder como administrador y gestionar cursos/usuarios:
- Email: admin@aniuet.com
- Password: admin123

El admin tiene acceso completo a todos los cursos independientemente del tier.
