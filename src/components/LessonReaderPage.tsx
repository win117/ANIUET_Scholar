import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, CheckCircle, Award, Clock, Eye, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";

interface LessonReaderPageProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
  session?: any;
}

// Contenido de las lecciones
const lessonContent = {
  'intro-ai': {
    'intro-1': {
      title: 'Introducción a la Inteligencia Artificial',
      type: 'reading',
      estimatedTime: '15 min',
      xp: 100,
      content: `## Lección 1.1: Introducción a la Inteligencia Artificial
¡Bienvenido a Aniuet Scholar! Estás a punto de dar el primer paso en un campo que está redefiniendo nuestro mundo. Pero antes de correr, vamos a caminar. En esta primera lección, vamos a desmitificar la Inteligencia Artificial (IA) y a construir una base sólida para todo lo que aprenderás después.

### ¿Qué es (y qué no es) la Inteligencia Artificial?
Cuando escuchas "Inteligencia Artificial", es fácil que tu mente vuele a robots superinteligentes de las películas de ciencia ficción. La realidad, aunque menos dramática, es mucho más fascinante y útil.

En términos sencillos, la Inteligencia Artificial es la simulación de la inteligencia humana en máquinas. Se trata de diseñar y programar sistemas que puedan realizar tareas que, hasta ahora, requerían inteligencia humana. Estas tareas incluyen aprender de la experiencia, razonar para tomar decisiones, entender el lenguaje y reconocer patrones en el mundo que nos rodea.

Piénsalo de esta manera: no estamos construyendo una "conciencia" en una caja. Estamos creando herramientas increíblemente avanzadas. Una IA no "siente" ni "piensa" como un humano; ejecuta algoritmos complejos que le permiten, por ejemplo, identificar un gato en una foto con una precisión asombrosa. Es menos como un cerebro humano completo y más como una parte superdesarrollada del cerebro experta en una sola cosa.

### La Prueba Definitiva: El Test de Turing
Para entender el objetivo original de la IA, tenemos que hablar de Alan Turing, uno de sus padres fundadores. En 1950, propuso un experimento mental para responder a la pregunta: "¿Pueden pensar las máquinas?". Este experimento se conoce como el Test de Turing.

Así funciona:
Imagina una habitación donde un juez humano (C) se comunica por texto con otros dos participantes, sin saber cuál es cuál. Uno de ellos es un ser humano (B) y el otro es una máquina (A). El juez puede hacer cualquier pregunta que quiera.

Si al final de la conversación, el juez no puede decir con certeza cuál es la máquina y cuál es el humano, se dice que la máquina ha "pasado" el Test de Turing.

Hoy en día, el Test de Turing es más una referencia filosófica que una prueba técnica, pero nos dejó la idea fundamental: el objetivo de la IA es crear sistemas cuyo comportamiento inteligente sea indistinguible —o incluso superior— al de un humano en una tarea específica.

### ¿Por Qué Ahora? La Tormenta Perfecta para la Explosión de la IA
La idea de la IA tiene más de 70 años, pero ¿por qué parece que explotó en la última década? Porque se unieron tres ingredientes clave para crear la "tormenta perfecta":

**Datos Masivos (Big Data) - El Combustible:** La IA aprende de los datos. En los últimos años, hemos generado una cantidad inimaginable de información: fotos, textos, sensores, transacciones, etc. Si los algoritmos son el motor, los datos son el combustible de alta calidad que lo hace funcionar. Sin datos, la IA más avanzada no tiene nada que aprender.

**Algoritmos Avanzados - El Motor:** Los investigadores han desarrollado y perfeccionado los "motores" de la IA, principalmente en el campo del Machine Learning y el Deep Learning (que verás en el Módulo 2). Estos son los métodos y técnicas matemáticas que permiten a las máquinas aprender de los datos de manera mucho más eficiente que antes.

**Hardware Potente - El Supercargador:** Este es el componente que lo cambió todo. El desarrollo de unidades de procesamiento gráfico (GPU) y, más recientemente, de hardware especializado para IA, ha proporcionado la potencia de cálculo necesaria para entrenar modelos complejos en horas en lugar de meses.

¡Aquí es donde entra tu Aniuet EdgeTrainer! Dispositivos como el tuyo son un ejemplo perfecto de este hardware especializado, diseñado para ejecutar algoritmos de IA de manera eficiente directamente en el dispositivo, sin necesidad de estar siempre conectado a un superordenador en la nube.

La combinación de estos tres elementos —más datos, mejores algoritmos y hardware más rápido y accesible— es la razón por la que la IA ha pasado de ser un concepto de laboratorio a una tecnología que está transformando todas las industrias.

¡Felicidades! Has completado tu primera lección. Ahora ya no solo "sabes" qué es la IA, sino que entiendes el contexto de por qué es una de las fuerzas más importantes de nuestro tiempo.`
    },
    'history-1': {
      title: 'Historia de la Inteligencia Artificial',
      type: 'reading',
      estimatedTime: '12 min',
      xp: 75,
      content: `## Lección 1.2: Historia de la Inteligencia Artificial
En la lección anterior, descubrimos que la IA es el resultado de una "tormenta perfecta" de datos, algoritmos y hardware. Pero esa tormenta no se formó de la noche a la mañana. La historia de la IA es un fascinante viaje de sueños ambiciosos, duros inviernos de decepción y un renacimiento espectacular que ha dado forma a nuestro presente.

¡Vamos a viajar en el tiempo!

### Los Inicios: La Era de los Soñadores (1950s - 1970s)
El sueño de crear una máquina pensante no es nuevo, pero la historia moderna de la IA comienza oficialmente en 1956, en una conferencia de verano en el Dartmouth College (EE. UU.). Fue allí donde un grupo de científicos visionarios acuñó por primera vez el término "Inteligencia Artificial".

Su optimismo era contagioso. Creían que en una sola generación podrían crear máquinas con una inteligencia similar a la humana. Y los primeros resultados fueron prometedores:

**El Logic Theorist (1956):** Considerado el primer programa de IA, era capaz de demostrar teoremas matemáticos.

**Programas de Ajedrez y Damas:** Se crearon los primeros programas que podían vencer a jugadores aficionados.

**ELIZA (1966):** Uno de los primeros "chatbots", que simulaba una conversación con un psicoterapeuta.

El problema: Aunque estos programas eran impresionantes, en realidad solo seguían reglas lógicas muy específicas. Carecían de la capacidad de aprender. Además, el hardware de la época era extremadamente limitado. ¡Una sola computadora ocupaba una habitación entera y tenía menos potencia que el smartphone que llevas en el bolsillo!

### El Invierno de la IA: La Dura Realidad (1970s - 1990s)
Tras el optimismo inicial, llegó la realidad. Los avances se estancaron. Las promesas que se habían hecho eran demasiado grandes y la tecnología no podía cumplirlas. Los gobiernos y las empresas, decepcionados por la falta de resultados prácticos, retiraron la financiación.

Este periodo se conoce como el **"Invierno de la IA"**. La investigación no se detuvo por completo, pero perdió su brillo y se convirtió en un campo mucho más académico y menos visible. La lección fue dura pero necesaria: para lograr una verdadera inteligencia, no bastaba con programar reglas; las máquinas necesitaban aprender por sí mismas.

### El Renacimiento: La Llegada del Machine Learning (1990s - 2010s)
El invierno no duró para siempre. A finales de los 80 y principios de los 90, dos cosas empezaron a cambiar:

**El Hardware mejoró:** Las computadoras se volvieron exponencialmente más potentes y asequibles.

**Nuevos Enfoques:** Surgió con fuerza una nueva rama de la IA: el Machine Learning (Aprendizaje Automático).

En lugar de decirle a la máquina qué hacer, los investigadores empezaron a darle datos y a dejar que ella encontrara los patrones. Este cambio de paradigma fue revolucionario. La IA empezó a resolver problemas del mundo real que eran imposibles de programar con reglas fijas, como el reconocimiento de escritura a mano en cartas o la detección de fraudes en transacciones bancarias.

Un hito clave fue en **1997**, cuando la supercomputadora Deep Blue de IBM venció al campeón mundial de ajedrez Garry Kasparov. Fue la prueba definitiva de que la IA había vuelto, y era más potente que nunca.

### La Explosión: La Era del Deep Learning (2012 - Presente)
Si el Machine Learning fue el renacimiento, el Deep Learning (Aprendizaje Profundo) fue la explosión que nos trajo al mundo que conocemos hoy. En **2012**, un modelo de Deep Learning llamado AlexNet logró una victoria aplastante en una competición de reconocimiento de imágenes, superando a todos los demás enfoques por un margen enorme.

El Deep Learning, que utiliza redes neuronales profundas (algo que verás en detalle más adelante), es la tecnología detrás de los avances más espectaculares de la última década:

- Asistentes de voz como Siri y Alexa
- Reconocimiento facial en tu teléfono y en las redes sociales
- Traducción automática en tiempo real
- Los primeros pasos hacia los coches autónomos

Hoy, gracias al hardware ultra especializado (¡como la tecnología dentro de tu Aniuet EdgeTrainer!) y al acceso a cantidades masivas de datos, estamos viviendo en la era dorada de la IA.

### Conclusión
La historia de la IA nos enseña que el progreso no es una línea recta. Es un ciclo de visión, limitación y avance. Lo que una vez fue un sueño de unos pocos científicos en una conferencia de verano, es hoy una de las fuerzas tecnológicas más transformadoras de la historia.

¡Felicidades! Ahora conoces el fascinante viaje que nos trajo desde las primeras máquinas pensantes hasta la revolución de IA que estamos viviendo hoy.`
    }
  }
};

export function LessonReaderPage({ courseId, lessonId, onBack, session }: LessonReaderPageProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const [wordCount, setWordCount] = useState(0);
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);

  const lesson = lessonContent[courseId as keyof typeof lessonContent]?.[lessonId as keyof typeof lessonContent['intro-ai']];

  useEffect(() => {
    if (lesson) {
      // Calculate word count and estimated reading time
      const words = lesson.content.split(/\s+/).length;
      setWordCount(words);
      setEstimatedReadTime(Math.ceil(words / 200)); // Average reading speed: 200 words per minute
    }
    
    // Check if lesson is already completed
    checkLessonCompletion();
  }, [lesson, session]);

  const checkLessonCompletion = async () => {
    if (!session?.access_token || !lesson) return;
    
    try {
      const userCoursesData = await apiHelpers.getUserCourses(session.access_token);
      const enrollment = userCoursesData.enrollments?.find((e: any) => e.courseId === courseId);
      
      if (enrollment && enrollment.completedLessons) {
        // Check if lessonId exists in the completedLessons array
        const isCompleted = enrollment.completedLessons.some((l: any) => 
          typeof l === 'string' ? l === lessonId : l.lessonId === lessonId
        );
        
        if (isCompleted) {
          setWasAlreadyCompleted(true);
          setIsCompleted(true);
          setReadingProgress(100); // Set to 100% if already completed
          console.log('📚 Lección ya completada previamente');
        }
      }
    } catch (error) {
      console.error('Error checking lesson completion:', error);
    }
  };

  useEffect(() => {
    // Mejorar el sistema de progreso de lectura
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            const scrollTop = scrollContainer.scrollTop;
            const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            
            if (scrollHeight > 0) {
              const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
              setReadingProgress(progress);
              
              // Debug console log
              console.log('📖 Progreso de lectura:', Math.round(progress) + '%');
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Initial call to set progress on page load
      setTimeout(handleScroll, 100);
      
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleCompleteLesson = async () => {
    if (!session?.access_token) {
      toast.error('Necesitas iniciar sesión para completar lecciones');
      return;
    }

    if (readingProgress < 80 && !wasAlreadyCompleted) {
      toast.warning('Necesitas leer al menos el 80% de la lección para completarla');
      return;
    }

    setIsCompleting(true);
    try {
      const result = await apiHelpers.updateCourseProgress(
        session.access_token,
        courseId,
        lessonId,
        lesson?.xp || 100
      );

      if (result.success) {
        setIsCompleted(true);
        
        if (result.alreadyCompleted) {
          // Lesson was already completed
          toast.success('📚 Lección repasada correctamente');
        } else {
          // New completion
          toast.success(`¡Lección completada! +${lesson?.xp || 100} XP ganados`);
          
          // Mostrar tiempo de lectura
          const readingTime = Math.round((Date.now() - startTime) / 60000);
          if (readingTime > 0) {
            toast.info(`Tiempo de lectura: ${readingTime} minutos`);
          }

          // Mensaje adicional sobre desbloqueo
          setTimeout(() => {
            toast.info('🎯 ¡La siguiente actividad ya está disponible!', {
              duration: 4000
            });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Error al completar la lección: ' + error.message);
    } finally {
      setIsCompleting(false);
    }
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E3701B]/10 via-[#4285F4]/5 to-[#C4423D]/10 flex items-center justify-center">
        <Card className="max-w-md mx-auto m-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Lección no encontrada</h2>
            <p className="text-gray-600 mb-4">
              No se pudo cargar el contenido de esta lección.
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'reading':
        return <BookOpen className="w-5 h-5" />;
      case 'practice':
        return <Eye className="w-5 h-5" />;
      case 'project':
        return <Award className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case 'reading':
        return 'bg-blue-100 text-blue-800';
      case 'practice':
        return 'bg-orange-100 text-orange-800';
      case 'project':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Procesar contenido markdown con tipografía mejorada y texto significativamente más grande
  const processContent = (content: string) => {
    return content
      .replace(/### (.*?)(?=\n|$)/g, '<h3 class="text-4xl font-semibold mt-12 mb-8 text-[#4285F4] leading-tight">$1</h3>')
      .replace(/## (.*?)(?=\n|$)/g, '<h2 class="text-5xl font-semibold mt-16 mb-10 text-[#E3701B] leading-tight">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#C4423D]">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-10 text-2xl leading-loose text-gray-700 font-normal">')
      .replace(/^(?!<h|<p|<strong)(.+?)(?=\n|$)/gm, '<p class="mb-10 text-2xl leading-loose text-gray-700 font-normal">$1</p>')
      .replace(/<p class="mb-10 text-2xl leading-loose text-gray-700 font-normal"><\/p>/g, '');
  };

  const getProgressColor = () => {
    if (readingProgress < 25) return 'from-red-500 to-red-600';
    if (readingProgress < 50) return 'from-orange-500 to-orange-600';
    if (readingProgress < 80) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const getProgressMessage = () => {
    if (readingProgress < 25) return '🚀 ¡Comenzando la aventura!';
    if (readingProgress < 50) return '📚 Avanzando bien';
    if (readingProgress < 80) return '💪 Casi listo para completar';
    return '🎉 ¡Listo para completar!';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E3701B]/10 via-[#4285F4]/5 to-[#C4423D]/10">
      <DynamicBackground />
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={onBack} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al curso
          </Button>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {estimatedReadTime} min lectura
            </Badge>
            <Badge className={`flex items-center gap-1 ${getLessonTypeColor(lesson.type)}`}>
              {getLessonTypeIcon(lesson.type)}
              {lesson.type === 'reading' ? 'Lectura' : 
               lesson.type === 'practice' ? 'Práctica' : 'Proyecto'}
            </Badge>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <Card className="mb-6 bg-gradient-to-r from-white to-gray-50 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#4285F4]" />
                <span className="font-semibold text-lg">Progreso de lectura</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#E3701B]">{Math.round(readingProgress)}%</div>
                <div className="text-sm text-gray-600">{wordCount} palabras</div>
              </div>
            </div>
            
            <Progress value={readingProgress} className="h-4 mb-2">
              <div 
                className={`h-full transition-all duration-500 rounded-full bg-gradient-to-r ${getProgressColor()}`}
                style={{ width: `${readingProgress}%` }}
              />
            </Progress>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{getProgressMessage()}</span>
              <span className="text-gray-500">
                Mínimo 80% para completar
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Expanded Main Content Area */}
          <div className="xl:col-span-4">
            <Card className="h-[calc(100vh-280px)]">
              <CardHeader className="pb-4 px-8">
                <CardTitle className="flex items-center gap-3 text-3xl">
                  {getLessonTypeIcon(lesson.type)}
                  <span>{lesson.title}</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea 
                  className="h-[calc(100vh-380px)] px-16 pb-16"
                >
                  <div 
                    className="prose prose-2xl max-w-none"
                    style={{
                      fontSize: '28px',
                      lineHeight: '2.2',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      maxWidth: 'none',
                      width: '100%'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: processContent(lesson.content) 
                    }}
                  />
                  {/* Spacer generoso para asegurar scroll completo */}
                  <div className="h-48" />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Compact Sidebar */}
          <div className="xl:col-span-1">
            <Card className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Información de la lección
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <Badge className={`${getLessonTypeColor(lesson.type)} text-xs`}>
                    {lesson.type === 'reading' ? 'Lectura' : 
                     lesson.type === 'practice' ? 'Práctica' : 'Proyecto'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tiempo estimado:</span>
                  <span className="text-sm font-medium">{estimatedReadTime} min</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Palabras:</span>
                  <span className="text-sm font-medium">{wordCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">XP a ganar:</span>
                  <span className="text-sm font-medium text-[#E3701B]">+{lesson.xp} XP</span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progreso:</span>
                    <span className="text-sm font-bold text-[#4285F4]">{Math.round(readingProgress)}%</span>
                  </div>
                  <Progress value={readingProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Complete Lesson Button */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-4">
                {!isCompleted ? (
                  <Button
                    onClick={handleCompleteLesson}
                    disabled={isCompleting || (readingProgress < 80 && !wasAlreadyCompleted)}
                    className="w-full bg-gradient-to-r from-[#4285F4] to-[#E3701B] hover:from-[#4285F4]/90 hover:to-[#E3701B]/90 text-lg py-6"
                  >
                    {isCompleting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {wasAlreadyCompleted ? 'Repasando...' : 'Completando...'}
                      </div>
                    ) : wasAlreadyCompleted ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Marcar como repasada
                      </div>
                    ) : readingProgress < 80 ? (
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Sigue leyendo ({Math.round(readingProgress)}%)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Completar lección
                      </div>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold text-lg">¡Lección completada!</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {wasAlreadyCompleted ? 'Ya habías completado esta lección' : `+${lesson.xp} XP ganados`}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        // Reread the lesson - just scroll to top
                        const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
                        if (scrollContainer) {
                          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                          setReadingProgress(0);
                        }
                      }}
                      variant="outline"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Repasar contenido
                    </Button>
                  </div>
                )}
                
                {!wasAlreadyCompleted && readingProgress < 80 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 text-center">
                      📖 Necesitas leer al menos el 80% para completar
                    </p>
                    <div className="text-xs text-yellow-600 text-center mt-1">
                      Te faltan {Math.round(80 - readingProgress)}% por leer
                    </div>
                  </div>
                )}
                
                {wasAlreadyCompleted && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800 text-center">
                      ✅ Ya completaste esta lección anteriormente
                    </p>
                    <div className="text-xs text-green-600 text-center mt-1">
                      Puedes marcarla como repasada
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}