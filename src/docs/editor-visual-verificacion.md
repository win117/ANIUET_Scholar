# Verificación del Editor Visual - Guía de Uso

## ✅ Sistema de Verificación Implementado

El editor visual del administrador ahora incluye un sistema completo de verificación de cambios que garantiza que todos los cambios se guarden y reflejen correctamente en el backend.

## 🔍 Características de Verificación

### 1. **Logs Detallados en Consola**
Abre la consola del navegador (F12) para ver logs detallados de cada operación:

**Al cargar el editor:**
```
=== COURSE EDITOR PAGE MOUNTED ===
📘 GUÍA DE USO DEL EDITOR VISUAL
```

**Al editar un nodo:**
```
=== GUARDANDO NODO ===
Nodo anterior: { id: ..., title: ... }
Nuevos datos: { ... }
✅ Nodo actualizado en el estado local
```

**Al guardar el curso:**
```
=== GUARDANDO CURSO ===
📦 Preparando datos para guardar...
📝 Lecciones convertidas: X
📤 Enviando al backend...
✅ Respuesta del backend: { success: true, course: {...} }
🔄 Recargando datos del curso desde el backend para verificar...
✅ Datos recargados desde el backend
```

### 2. **Recarga Automática desde Backend**
Después de guardar, el sistema automáticamente:
1. ✅ Guarda los cambios en el backend
2. 🔄 Recarga los datos directamente del backend
3. ✅ Verifica que los cambios se persistieron correctamente
4. 📊 Muestra confirmación visual

### 3. **Indicadores Visuales**

#### Badge de Estado de Guardado
- **Verde con ✓**: Muestra la última hora de guardado exitoso
- **Formato**: `✓ Guardado HH:MM:SS`

#### Indicador de Guardando
- **Naranja pulsante**: Se muestra mientras se está guardando
- **Mensaje**: `💾 Guardando...`
- **Botón deshabilitado**: El botón "Guardar Curso" se deshabilita durante el proceso

#### Información del Curso
- **Tipo**: Mock o Personalizado
- **ID**: Identificador único del curso

### 4. **Herramientas de Debug**

#### Botón 🐛 (Debug)
- **Función**: Muestra el estado actual completo en consola
- **Información mostrada**:
  - ID del curso
  - Tipo de curso
  - Total de nodos
  - Detalles completos de cada nodo en formato JSON

#### Botón 🔄 (Recarga Manual)
- **Función**: Recarga los datos desde el backend en cualquier momento
- **Uso**: Permite verificar manualmente que los cambios se guardaron
- **Confirmación**: Muestra toast de éxito al completar

## 📋 Flujo de Trabajo Recomendado

### Para Editar un Curso:

1. **Abre el editor visual** desde el panel de administración
2. **Verifica la carga inicial** en la consola:
   ```
   === LOADING COURSE NODES ===
   Found X lessons to load
   ```

3. **Realiza tus cambios:**
   - ✏️ Edita nodos (clic en botón de lápiz)
   - 🔗 Conecta nodos (clic en botón de enlace)
   - 📍 Mueve nodos (arrastra en el canvas)
   - ➕ Agrega nodos nuevos
   - 🗑️ Elimina nodos

4. **Guarda los cambios:**
   - Haz clic en **"Guardar Curso"**
   - Observa en consola el proceso completo
   - Espera la confirmación visual

5. **Verifica los cambios:**
   - Revisa el badge verde con la hora de guardado
   - Verifica en consola: `✅ Datos recargados desde el backend`
   - Opcional: Usa el botón 🔄 para recargar manualmente

## 🔬 Verificación Paso a Paso

### Verificación Frontend → Backend → Frontend

1. **Frontend → Backend**
   ```javascript
   // En consola verás:
   📤 Enviando al backend...
   ```

2. **Backend - Recepción**
   ```javascript
   // En logs del servidor:
   === ADMIN SAVE COURSE ENDPOINT CALLED ===
   ✓ Access token present
   ✓ Admin verified
   📦 Received course data: { lessonsCount: X }
   ```

3. **Backend - Guardado**
   ```javascript
   💾 Saving course with X lessons
   ✅ Course saved successfully to KV store
   ```

4. **Backend - Verificación**
   ```javascript
   🔍 Verification - Course read back: { lessonsCount: X }
   ```

5. **Frontend - Recarga**
   ```javascript
   🔄 Recargando datos del curso desde el backend...
   === ADMIN GET COURSE ENDPOINT CALLED ===
   ✅ Course found: { lessonsCount: X }
   ```

## 🧪 Cómo Probar que Funciona

### Prueba 1: Editar un Nodo Existente
1. Abre la consola (F12)
2. Haz clic en el botón de lápiz de un nodo
3. Cambia el título a "PRUEBA 123"
4. Guarda el nodo (verás log: `✅ Nodo actualizado`)
5. Guarda el curso (botón "Guardar Curso")
6. Observa los logs de guardado completo
7. **Verifica**: El nodo debe mantener el título "PRUEBA 123"

### Prueba 2: Agregar un Nodo Nuevo
1. Haz clic en "Agregar Nodo"
2. Rellena los datos (título, tipo, contenido, XP, etc.)
3. Guarda el nodo
4. Guarda el curso
5. Usa el botón 🔄 para recargar
6. **Verifica**: El nuevo nodo debe aparecer después de recargar

### Prueba 3: Eliminar un Nodo
1. Haz clic en el botón de basura (🗑️) de un nodo
2. Confirma la eliminación
3. Guarda el curso
4. Recarga la página completa del navegador
5. **Verifica**: El nodo no debe aparecer

### Prueba 4: Mover Nodos
1. Arrastra un nodo a una nueva posición
2. Guarda el curso
3. Usa el botón 🔄 para recargar
4. **Verifica**: El nodo debe mantener su nueva posición

### Prueba 5: Conectar Nodos
1. Haz clic en el botón de enlace (🔗) de un nodo
2. Haz clic en otro nodo para crear la conexión
3. Guarda el curso
4. Recarga usando 🔄
5. **Verifica**: La línea de conexión debe persistir

## 📊 Verificación en la Base de Datos

Los cambios se guardan en el KV Store de Supabase con las siguientes claves:

- **Cursos Mock**: `mock_course:{courseId}`
- **Cursos Personalizados**: `course:{courseId}`

Cada curso contiene un array `lessons` con todos los nodos/lecciones.

## 🐛 Solución de Problemas

### Los nodos no aparecen después de guardar
1. Abre la consola y busca errores
2. Verifica que el curso tiene lecciones: `course.lessons.length > 0`
3. Usa el botón 🐛 para ver el estado actual
4. Verifica los logs del backend

### Error al guardar
1. Verifica en consola: `❌ Error saving course:`
2. Revisa el mensaje de error específico
3. Verifica que tienes permisos de administrador
4. Confirma que el accessToken es válido

### Los cambios no persisten
1. Verifica que hiciste clic en "Guardar Curso"
2. Espera a ver el badge verde con la hora
3. Usa el botón 🔄 para recargar manualmente
4. Revisa los logs del backend buscando `✅ Course saved successfully`

## ✅ Confirmación Final

Si ves todos estos indicadores, los cambios se guardaron correctamente:

1. ✅ Toast verde: "Curso guardado exitosamente"
2. ✅ Badge verde con hora: "✓ Guardado HH:MM:SS"
3. ✅ Toast de verificación: "X lecciones guardadas y verificadas"
4. ✅ En consola: "✅ Datos recargados desde el backend"
5. ✅ Los nodos se mantienen después de recargar con 🔄

## 📝 Notas Importantes

- **Cambios locales**: Los cambios en nodos individuales solo se reflejan en el estado local hasta que guardes el curso completo
- **Persistencia**: Solo el botón "Guardar Curso" persiste los cambios en el backend
- **Verificación automática**: El sistema siempre recarga desde el backend después de guardar
- **Logs detallados**: Mantén la consola abierta para ver el flujo completo de cada operación

---

**Última actualización**: Sistema de verificación completo implementado con logs detallados, recarga automática y confirmación visual.
