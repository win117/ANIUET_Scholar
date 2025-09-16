## Requerimientos no funcionales

### Tiempo de respuesta
- Los tiempos de carga generales deben ser menores a **5s**.

### Escalabilidad
- El sitio web debe ser lo suficientemente escalable para soportar **1,000,000 de visitas concurrentes**, manteniendo un rendimiento óptimo.  
- El sistema debe ser capaz de escalar en **procesamiento y almacenamiento de datos** conforme al crecimiento del mismo, soportando el incremento en volumen y transacciones.  
- El sistema debe soportar un **incremento de hasta 200% en el número de usuarios concurrentes** durante campañas de ventas o eventos especiales, sin degradar el tiempo de respuesta por encima de **4 segundos**.

### Portabilidad
- El sistema debe ser capaz de operar en varios dispositivos móviles, independientemente del tamaño de pantalla y la resolución.  
- La aplicación web deberá funcionar en la mayoría de los navegadores web, incluyendo **Edge, Chrome, Firefox y Safari**.  

### Compatibilidad
- El sistema deberá funcionar en navegadores y ser compatible con al menos las últimas 4 versiones de **iOS y Android**.  
- El sistema deberá integrarse con plataformas de pago externas (ej. **Stripe, PayPal, MercadoPago**) para procesar inscripciones o adquisición de cursos.  
- El sistema deberá ser desplegable en servicios de infraestructura en la nube y ser compatible con bases de datos relacionales (**PostgreSQL** como motor inicial).  
- El sistema ANIUET deberá ser compatible con formatos estándar de intercambio de información académica, incluyendo **CSV y XLSX** para registros, y **PDF y DOCX** para materiales de apoyo.  
- El sistema ANIUET deberá ser compatible con APIs de autenticación externas que implementen estándares como **OAuth 2.0** u **OpenID Connect**, permitiendo la integración con servicios de identidad institucionales o de terceros (ej. Google, Microsoft).  
- El sistema ANIUET deberá ser compatible con APIs de modelos de lenguaje (**LLM**).  
- El sistema ANIUET deberá ser compatible con dispositivos estándar de entrada de **audio y video**, incluyendo micrófonos y cámaras integradas o externas, para habilitar funciones de biofeedback y análisis del alumno durante las sesiones de aprendizaje.  

### Fiabilidad
- El sistema deberá funcionar sin fallos en el **90% de los casos de uso** en el transcurso de un mes.  
- El sistema deberá ser capaz de **recuperarse de fallos sin pérdida de datos**.  
- Todas las transacciones financieras deberán procesarse con **fiabilidad total**, garantizando confirmación o rechazo inequívoco, en cumplimiento con las pasarelas de pago integradas.  

### Mantenimiento
- El servicio de transmisión de video deberá ajustar automáticamente la calidad del video en función de la velocidad de internet del usuario para evitar interrupciones por **buffering**.  
- El sistema deberá garantizar que al menos el **80% de las incidencias** reportadas se resuelvan en un plazo máximo de **24 horas**.  
- En caso de fallos críticos del sistema, la recuperación deberá completarse en un tiempo máximo de **1 hora**, sin pérdida de datos.  

### Disponibilidad
- El sistema deberá estar disponible el **99.9% del tiempo** durante el horario principal de operación (de **6:00 a 24:00 horas**). Los periodos de mantenimiento preventivo o correctivo deberán programarse preferentemente entre las **0:00 y las 6:00 horas**.  
- El sistema de pagos deberá garantizar una disponibilidad mínima del **99.9% mensual**, permitiendo como máximo **45 minutos de inactividad** planificada o no planificada en dicho periodo.  

### Seguridad
- El sistema deberá implementar **autenticación robusta** (cuentas propias y Google OAuth 2.0) y un esquema de **control de acceso basado en roles** (*admin, maestro, alumno, profesional, consultor de datos*). Las calificaciones publicadas por el maestro no podrán ser modificadas salvo mediante autorización del administrador.  
- El sistema deberá protegerse contra **inyección SQL, XSS y otros ataques web** mediante consultas parametrizadas, validación de entradas y sanitización de salidas.  
- Todas las transacciones financieras deberán procesarse mediante pasarelas certificadas (**Stripe, PayPal, MercadoPago**), sin que ANIUET almacene información de tarjetas.  
- Los datos deberán transmitirse mediante **TLS 1.2+** y almacenarse cifrados. Solo se recolectará la información personal estrictamente necesaria para el funcionamiento del sistema.  
- El sistema deberá mantener **registros de auditoría** sobre eventos críticos (autenticaciones, cambios de permisos, creación/edición de actividades, calificaciones y pagos).  
- El sistema deberá alinearse a **buenas prácticas de seguridad ISO/IEC 27001** como marco de referencia.  

### Usabilidad
- Al menos el **80% de los usuarios** en pruebas de usabilidad deberán calificar la interfaz como “fácil de usar” o superior en encuestas post-uso.  
- Los usuarios primerizos deberán poder registrarse e inscribirse en un curso en menos de **5 minutos** sin asistencia externa.  
- Los alumnos deberán acceder a cualquier contenido de un curso en un máximo de **3 clics** desde el panel principal.  

