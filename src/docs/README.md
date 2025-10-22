# 📚 Documentación de ANIUET Scholar

Bienvenido a la documentación técnica de ANIUET Scholar, la plataforma educativa de IA con diseño gamificado tipo Duolingo + RPG.

## 📑 Índice de Documentación

### Sistemas Principales

#### [Sistema de Recuperación de Contraseña](./password-recovery-system.md)
Guía completa del flujo de recuperación de contraseña con backend funcional.

**Contenido:**
- 🏗️ Arquitectura del sistema
- 🔄 Flujo completo paso a paso
- 🔒 Características de seguridad
- 📱 Interfaz de usuario
- 🧪 Testing en desarrollo
- 🛠️ Integración
- 📊 Manejo de errores
- ✅ Checklist de funcionalidad

**Estado:** ✅ 100% Completado y Funcional

---

#### [Resumen de Documentación del Código](./code-documentation-summary.md)
Estado actual de la documentación del código fuente.

**Contenido:**
- 📚 Archivos documentados
- 📝 Convenciones utilizadas
- 📊 Cobertura de documentación
- 🎯 Nivel por archivo
- 📋 Checklists de calidad
- 📈 Próximos pasos

**Estado:** ✅ Actualizado y Completo

---

## 🎯 Guías Rápidas

### Para Desarrolladores Nuevos

1. **Empezar aquí:** [Code Documentation Summary](./code-documentation-summary.md)
   - Entiende la estructura de documentación
   - Aprende las convenciones
   - Identifica archivos clave

2. **Sistema crítico:** [Password Recovery System](./password-recovery-system.md)
   - Flujo de autenticación importante
   - Ejemplo de documentación completa
   - Patrones a seguir en otros sistemas

### Para Desarrollo

**Antes de implementar una feature:**
1. ✅ Lee la documentación del sistema relacionado
2. ✅ Revisa convenciones de código
3. ✅ Verifica patrones existentes
4. ✅ Documenta tu código nuevo

**Al documentar:**
1. ✅ Usa JSDoc para funciones/componentes
2. ✅ Comenta decisiones importantes
3. ✅ Explica validaciones de seguridad
4. ✅ Incluye ejemplos cuando sea útil

### Para Testing

**Recuperación de Contraseña:**
```bash
# El sistema está completamente funcional
# Ver sección "Testing en Desarrollo" en password-recovery-system.md
```

**Códigos de Curso:**
```
ANIUET-001 - Fundamentos de IA
ANIUET-002 - Machine Learning Básico
ANIUET-003 - Deep Learning Avanzado
```

## 📁 Estructura de Documentación

```
/docs/
├── README.md                           # Este archivo - índice principal
├── password-recovery-system.md         # Sistema de recuperación completo
└── code-documentation-summary.md       # Estado de documentación del código
```

## 🔗 Enlaces Útiles

### Documentación Externa
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Hono Framework](https://hono.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Herramientas del Proyecto
- [Lucide Icons](https://lucide.dev/)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Motion (Framer Motion)](https://motion.dev/)

## 🎨 Paleta de Colores

```css
--primary-orange: #E3701B
--primary-blue: #4285F4
--primary-red: #C4423D
```

## 🚀 Estado del Proyecto

### Sistemas Completados ✅

- ✅ Registro de usuarios con validación de nivel IA
- ✅ Inicio de sesión con confirmación de email
- ✅ **Recuperación de contraseña completa**
- ✅ Sistema de cursos con códigos
- ✅ Inscripción de estudiantes por maestros
- ✅ Dashboard gamificado con XP y niveles
- ✅ Comunidad con posts y reacciones
- ✅ Gestión de estudiantes en tiempo real

### En Desarrollo 🔄

- 🔄 Envío de emails en producción
- 🔄 Tests automatizados
- 🔄 Documentación de componentes UI

### Planificado 📋

- 📋 Sistema de notificaciones push
- 📋 Chat en tiempo real
- 📋 Certificados descargables
- 📋 Integración con LMS externos

## 📝 Contribuir a la Documentación

### Al agregar nueva documentación:

1. **Formato Markdown:** Usa `.md` para todos los documentos
2. **Ubicación:** Coloca en `/docs/` con nombre descriptivo
3. **Enlaces:** Actualiza este README.md con el nuevo documento
4. **Idioma:** Español para documentación, inglés para código
5. **Emojis:** Usa emojis para mejorar legibilidad

### Plantilla para Nueva Documentación

```markdown
# Título del Sistema/Feature

## 📋 Descripción General
Breve descripción del sistema...

## 🏗️ Arquitectura
Diagrama o descripción de componentes...

## 🔄 Flujo
Pasos del proceso...

## 💻 Ejemplos de Código
```typescript
// Ejemplos relevantes
```

## 🔒 Seguridad
Consideraciones de seguridad...

## ✅ Checklist
- [ ] Item 1
- [ ] Item 2

---
**Última actualización:** Fecha
**Estado:** Estado actual
```

## ⚙️ Configuración del Proyecto

### Variables de Entorno

El proyecto usa las siguientes variables (ya configuradas):
- `SUPABASE_URL` - URL del proyecto Supabase
- `SUPABASE_ANON_KEY` - Clave pública de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio (solo backend)
- `SUPABASE_DB_URL` - URL de la base de datos
- `RESEND_API_KEY` - Para envío de emails (futuro)

### Base de Datos

**KV Store** con las siguientes keys:
- `user:{userId}` - Datos del usuario
- `password_reset:{email}` - Tokens de recuperación
- `mock_course:{courseId}` - Cursos de prueba
- `teacher_students:{teacherId}` - Estudiantes por maestro
- `community_post:{postId}` - Posts de la comunidad

## 🐛 Debugging

### Logs Importantes

**Recuperación de Contraseña:**
```
Password reset requested for email: user@example.com
Password reset token created for user@example.com: reset_xxx
Password update attempt for email: user@example.com
Password successfully updated for user: user@example.com
```

**Autenticación:**
```
Attempting sign in for: user@example.com
User authenticated successfully: uuid
Login successful for user: uuid
```

### Herramientas de Debug

1. **Console Logs:** Verificar en consola del navegador
2. **Network Tab:** Ver requests/responses
3. **Supabase Dashboard:** Ver usuarios y auth logs
4. **Toast Messages:** Mensajes de error/éxito en UI

## 📞 Soporte

### Problemas Comunes

**"Token de recuperación no encontrado"**
- Verificar que se generó el token (ver logs)
- Verificar que no haya expirado (1 hora)
- Verificar que no se haya usado ya

**"Usuario no autenticado"**
- Verificar que la sesión sea válida
- Revisar access token en headers
- Verificar que el usuario exista en Auth

**"Error de conexión"**
- Verificar conexión a internet
- Verificar que el servidor esté corriendo
- Revisar CORS si hay problemas

## 📊 Métricas de Documentación

- **Archivos documentados:** 10+ archivos clave
- **Cobertura JSDoc:** ~70% en archivos principales
- **Guías de sistema:** 2 guías completas
- **Ejemplos de código:** 50+ ejemplos
- **Idioma:** Español (documentación) + Inglés (código)

## 🎓 Recursos de Aprendizaje

### Para entender el stack:

1. **React + TypeScript:** [TypeScript Handbook](https://www.typescriptlang.org/docs/)
2. **Supabase:** [Supabase Tutorials](https://supabase.com/docs/guides/tutorials)
3. **Tailwind CSS:** [Tailwind Docs](https://tailwindcss.com/docs)
4. **Hono:** [Hono Getting Started](https://hono.dev/getting-started)

### Para entender ANIUET Scholar:

1. Lee [Code Documentation Summary](./code-documentation-summary.md)
2. Explora [Password Recovery System](./password-recovery-system.md)
3. Revisa el código de `App.tsx` para entender navegación
4. Estudia `client.tsx` para entender API calls

## 🎉 Conclusión

Esta documentación está en constante evolución. Si encuentras algo que falta o necesita mejora, no dudes en:

1. Actualizar la documentación existente
2. Crear nueva documentación
3. Mejorar los ejemplos de código
4. Agregar más detalles técnicos

**Recuerda:** Una buena documentación es tan importante como el código mismo.

---

**Proyecto:** ANIUET Scholar
**Versión de Documentación:** 1.0.0
**Última actualización:** 19 de octubre de 2025
**Mantenedor:** Equipo de Desarrollo ANIUET

**Estado General:** ✅ Documentación principal completada
