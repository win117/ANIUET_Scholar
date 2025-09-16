## Requerimientos no funcionales

### Tiempo de respuesta
- **Prioridad:** Alta  
- **Requisito:** El sistema deberá garantizar que los tiempos de carga generales sean menores a **5 segundos**.  
- **Criterio de verificación:** Pruebas de carga en entornos de staging con al menos 500 usuarios concurrentes.

---

### Escalabilidad
- **Prioridad:** Alta  
- **Requisito 1:** El sistema deberá ser lo suficientemente escalable para soportar **1,000,000 de visitas concurrentes**, manteniendo un rendimiento óptimo.  
- **Requisito 2:** El sistema deberá poder escalar en **procesamiento y almacenamiento de datos** conforme al crecimiento del mismo, soportando incrementos en volumen y transacciones.  
- **Requisito 3:** El sistema deberá soportar un **incremento de hasta 200% en el número de usuarios concurrentes** durante campañas o eventos especiales, sin que el tiempo de respuesta supere los **4 segundos**.  
- **Criterio de verificación:** Pruebas de estrés progresivas en entorno controlado.

---

### Portabilidad
- **Prioridad:** Media  
- **Requisito 1:** El sistema deberá ser capaz de operar en varios dispositivos móviles, independientemente del tamaño de pantalla y la resolución.  
- **Requisito 2:** El sistema deberá funcionar correctamente en la mayoría de los navegadores modernos, incluyendo **Edge, Chrome, Firefox y Safari**.  
- **Criterio de verificación:** Pruebas manuales y automáticas en dispositivos y navegadores listados.

---

### Compatibilidad
- **Prioridad:** Alta  
- **Requisito 1:** El sistema deberá ser compatible con las últimas 4 versiones de **iOS y Android**.  
- **Requisito 2:** El sistema deberá integrarse con plataformas de pago externas (**Stripe, PayPal, MercadoPago**) para procesar inscripciones o adquisición de cursos.  
- **Requisito 3:** El sistema deberá ser desplegable en servicios de infraestructura en la nube y ser compatible con bases de datos relacionales (**PostgreSQL como motor inicial**).  
- **Requisito 4:** El sistema deberá ser compatible con formatos estándar de intercambio académico, incluyendo **CSV/XLSX** para registros y **PDF/DOCX** para materiales de apoyo.  
- **Requisito 5:** El sistema deberá ser compatible con APIs de autenticación externas que implementen estándares como **OAuth 2.0 u OpenID Connect** (ej. Google, Microsoft).  
- **Requisito 6:** El sistema deberá ser compatible con APIs de **modelos de lenguaje (LLM)** para soportar asistentes inteligentes.  
- **Requisito 7:** El sistema deberá ser compatible con dispositivos estándar de **audio y video** (micrófonos y cámaras) para habilitar funciones de biofeedback.  
- **Criterio de verificación:** Integración validada en pruebas de interoperabilidad con los sistemas listados.

---

### Fiabilidad
- **Prioridad:** Alta  
- **Requisito 1:** El sistema deberá operar sin errores críticos en al menos el **90% de los casos de uso** mensuales.  
- **Requisito 2:** El sistema deberá ser capaz de **recuperarse de fallos sin pérdida de datos**.  
- **Requisito 3:** Todas las transacciones financieras deberán procesarse con **fiabilidad total**, confirmando éxito o rechazo inequívoco según la pasarela de pago utilizada.  
- **Criterio de verificación:** Monitoreo de logs de fallos, pruebas de conmutación y revisión de transacciones con pasarelas.

---

### Mantenimiento
- **Prioridad:** Media  
- **Requisito 1:** El sistema deberá ajustar automáticamente la calidad del video en función de la velocidad de internet del usuario, evitando interrupciones por **buffering**.  
- **Requisito 2:** El sistema deberá garantizar que al menos el **80% de las incidencias** reportadas se resuelvan en un plazo máximo de **24 horas**.  
- **Requisito 3:** En caso de fallos críticos, la recuperación deberá completarse en un máximo de **1 hora**, sin pérdida de datos.  
- **Criterio de verificación:** Pruebas en laboratorio y registros de tiempos de resolución en mesa de soporte.

---

### Disponibilidad
- **Prioridad:** Alta  
- **Requisito 1:** El sistema deberá estar disponible el **99.9% del tiempo** durante el horario de operación (6:00 a 24:00 horas). Mantenimientos planificados deberán realizarse preferentemente entre las **0:00 y 6:00 horas**.  
- **Requisito 2:** El sistema de pagos deberá garantizar una disponibilidad mínima del **99.9% mensual**, con un máximo de **45 minutos de inactividad**.  
- **Criterio de verificación:** Monitoreo mediante métricas SLA y reportes mensuales de disponibilidad.

---

### Seguridad
- **Prioridad:** Alta  
- **Requisito 1:** El sistema deberá implementar autenticación robusta (cuentas propias y Google OAuth 2.0) y control de acceso por roles (*admin, maestro, alumno, profesional, consultor de datos*). Las calificaciones publicadas por el maestro no podrán modificarse salvo autorización del administrador.  
- **Requisito 2:** El sistema deberá protegerse contra **inyección SQL y XSS** mediante consultas parametrizadas, validación de entradas y sanitización de salidas.  
- **Requisito 3:** Todas las transacciones deberán procesarse mediante pasarelas certificadas (**Stripe, PayPal, MercadoPago**) sin almacenar datos de tarjeta en ANIUET.  
- **Requisito 4:** Los datos deberán transmitirse mediante **TLS 1.2+** y almacenarse cifrados. Solo se recolectará la información personal estrictamente necesaria.  
- **Requisito 5:** El sistema deberá mantener **registros de auditoría** sobre eventos críticos (autenticaciones, permisos, actividades, calificaciones y pagos).  
- **Requisito 6:** El sistema deberá alinearse con buenas prácticas de seguridad **ISO/IEC 27001** y **PCI DSS** para transacciones.  
- **Criterio de verificación:** Auditorías internas de seguridad y pruebas de penetración anuales.

---

### Usabilidad
- **Prioridad:** Media  
- **Requisito 1:** Al menos el **80% de los usuarios** en pruebas de usabilidad deberán calificar la interfaz como “fácil de usar” o superior.  
- **Requisito 2:** Los usuarios primerizos deberán poder registrarse e inscribirse en un curso en menos de **5 minutos** sin asistencia.  
- **Requisito 3:** Los alumnos deberán acceder a cualquier contenido de un curso en un máximo de **3 clics** desde el panel principal.  
- **Criterio de verificación:** Resultados de pruebas de usabilidad con usuarios reales (muestras ≥30 personas).

