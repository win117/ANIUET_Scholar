# Acceso de Administrador - ANIUET Scholar

## Credenciales del Super Usuario

El sistema tiene **un único usuario administrador** configurado por defecto:

```
Email: admin@aniuet.com
Password: admin123
```

## Cómo Acceder

1. **Ve a la página de inicio** de ANIUET Scholar
2. **Haz clic en "Iniciar Sesión"**
3. **Ingresa las credenciales del admin**:
   - Email: `admin@aniuet.com`
   - Password: `admin123`
4. **El sistema te redirigirá automáticamente** al Panel de Administración

## Creación Automática del Admin

El usuario admin se crea **automáticamente** de dos formas:

### 1. Al Iniciar el Servidor (Recomendado)
- Cuando el servidor se inicia, ejecuta automáticamente `ensureAdminExists()`
- Verifica si el admin existe en Supabase Auth
- Si no existe, lo crea inmediatamente
- Si existe, verifica que la contraseña sea correcta y actualiza si es necesario
- Sincroniza los datos con el KV store
- Todo esto sucede **antes de que nadie intente hacer login**

### 2. Al Intentar Login (Respaldo)
- Si por alguna razón el admin no se creó al inicio, se crea automáticamente en el primer intento de login
- El sistema detecta que estás intentando acceder con las credenciales de admin
- Si el usuario no existe, lo crea automáticamente en Supabase Auth
- Si el usuario existe pero la contraseña no coincide, la actualiza automáticamente
- Sincroniza los datos con el KV store
- Intenta hacer login automáticamente con reintentos

## Características del Admin

El administrador tiene acceso completo a:

- ✅ **Panel de Administración** - Gestión completa de cursos
- ✅ **Editar Cursos** - Modificar estructura, contenido y configuración
- ✅ **Agregar Recursos** - Subir PDFs, lecturas, videos
- ✅ **Gestionar Estructura** - Crear módulos, lecciones y desbloqueos
- ✅ **Ver Estadísticas** - Monitorear el estado de los cursos

## Sistema Completamente Oculto

- ⚠️ **No hay banners, botones ni enlaces** al sistema de administración en la interfaz normal
- ⚠️ Los usuarios regulares (Alumno, Maestro, Profesional) **no pueden ver** el panel de admin
- ⚠️ El acceso es **exclusivamente** mediante login con las credenciales específicas
- ⚠️ No hay forma de "descubrir" el sistema de admin sin conocer las credenciales
- ⚠️ **Se eliminó la herramienta de diagnóstico** que estaba visible en la página de login

## Solución de Problemas

### Si el login falla en el primer intento:

1. **Verifica los logs del servidor** en la consola de Supabase Edge Functions
2. Busca los mensajes que empiezan con:
   - `"=== SERVER STARTUP: Checking admin user ==="`
   - `"✅ Admin user created in Auth:"`
   - `"✅ Admin user stored in KV store"`
3. **Espera 5-10 segundos** y vuelve a intentar el login
4. El sistema de auto-creación en el login intentará crear el admin si no existe

### Si persisten los errores:

1. Abre la **consola del navegador** (F12)
2. Verifica los mensajes de log que empiezan con:
   - `"🔧 Admin login failed, attempting to create admin user..."`
   - `"✅ Admin creation result:"`
   - `"🔑 Admin login attempt X/5..."`
3. Si ves errores repetidos, puede ser un problema de configuración de Supabase
4. Verifica que el servidor esté corriendo correctamente

## Notas Importantes

- 🔒 **Las credenciales no deben compartirse** con usuarios regulares
- 🔒 **El sistema es invisible** para todos excepto el admin
- 🔒 **Solo existe un admin** en todo el sistema
- 🔒 **El acceso es permanente** - no hay registro de admin ni proceso de setup

## Cambios Recientes

### ✅ Eliminación de Herramientas de Diagnóstico (19 Oct 2025)
- Se eliminó el componente `AdminDiagnostic.tsx` que estaba visible en la página de login
- Se eliminó la importación y uso de `<AdminDiagnostic />` en `LoginPage.tsx`
- Ahora **solo el admin puede crear el admin** mediante el sistema automático del servidor
- Los usuarios regulares ya no tienen acceso a herramientas que podrían crear admins

### ✅ Auto-creación al Inicio del Servidor
- Se agregó la función `ensureAdminExists()` que se ejecuta al iniciar el servidor
- El admin se crea/verifica automáticamente antes de que nadie pueda hacer login
- Esto garantiza que el admin siempre esté disponible sin intervención manual

## Archivos Relacionados

- `/components/AdminDashboardPage.tsx` - Panel de administración
- `/supabase/functions/server/admin-endpoints.tsx` - Endpoints del admin
- `/supabase/functions/server/index.tsx` - Auto-creación al inicio (línea ~3967) y endpoint manual (línea ~3667)
- `/utils/supabase/client.tsx` - Auto-creación en login como respaldo (línea ~165)
- `/components/LoginPage.tsx` - Página de login (sin herramientas de diagnóstico)
