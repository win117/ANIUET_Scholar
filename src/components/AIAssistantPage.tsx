import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  FileText, 
  HelpCircle, 
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  BookOpen,
  Puzzle,
  BarChart,
  Zap
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface AIAssistantPageProps {
  onBack: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const quickPrompts = [
  {
    icon: FileText,
    title: "Crear Quiz",
    prompt: "Crea un quiz sobre Machine Learning básico con 5 preguntas de opción múltiple",
    category: "Evaluación"
  },
  {
    icon: BookOpen,
    title: "Material Educativo",
    prompt: "Genera material educativo sobre redes neuronales para estudiantes principiantes",
    category: "Contenido"
  },
  {
    icon: Puzzle,
    title: "Ejercicio Práctico",
    prompt: "Diseña un ejercicio práctico de programación para enseñar clasificación de imágenes",
    category: "Práctica"
  },
  {
    icon: BarChart,
    title: "Rúbrica de Evaluación",
    prompt: "Crea una rúbrica para evaluar proyectos de IA con criterios claros y escalas de puntuación",
    category: "Evaluación"
  },
  {
    icon: Lightbulb,
    title: "Ideas de Proyecto",
    prompt: "Sugiere 3 ideas de proyectos finales para un curso de introducción a la IA",
    category: "Proyectos"
  },
  {
    icon: HelpCircle,
    title: "Resolver Dudas",
    prompt: "Explica de manera simple qué es el overfitting en machine learning y cómo evitarlo",
    category: "Conceptos"
  }
];

const mockResponses: Record<string, string> = {
  "quiz": `# Quiz: Machine Learning Básico

## Pregunta 1
¿Cuál es la principal diferencia entre aprendizaje supervisado y no supervisado?

a) El aprendizaje supervisado usa más datos
b) El aprendizaje supervisado tiene etiquetas en los datos de entrenamiento
c) El aprendizaje no supervisado es más rápido
d) No hay diferencias significativas

**Respuesta correcta: b)**

## Pregunta 2
¿Qué algoritmo es más adecuado para problemas de clasificación binaria?

a) K-means
b) Regresión logística
c) PCA
d) DBSCAN

**Respuesta correcta: b)**

## Pregunta 3
¿Qué significa "overfitting" en machine learning?

a) El modelo es muy simple
b) El modelo memoriza los datos de entrenamiento pero no generaliza bien
c) El modelo no tiene suficientes datos
d) El modelo es muy rápido

**Respuesta correcta: b)**

## Pregunta 4
¿Cuál es el propósito de dividir los datos en conjuntos de entrenamiento y prueba?

a) Para acelerar el entrenamiento
b) Para evaluar el rendimiento del modelo en datos no vistos
c) Para reducir el tamaño de los datos
d) Para mejorar la precisión

**Respuesta correcta: b)**

## Pregunta 5
¿Qué métrica es más apropiada para evaluar un modelo de clasificación desbalanceada?

a) Exactitud (Accuracy)
b) F1-Score
c) Tiempo de ejecución
d) Número de parámetros

**Respuesta correcta: b)**`,

  "material": `# Material Educativo: Redes Neuronales para Principiantes

## 🧠 ¿Qué son las Redes Neuronales?

Las redes neuronales artificiales son sistemas computacionales inspirados en el funcionamiento del cerebro humano. Están compuestas por nodos (neuronas artificiales) interconectados que procesan información.

### Conceptos Clave:

**1. Neurona Artificial**
- Unidad básica de procesamiento
- Recibe múltiples entradas
- Produce una salida basada en una función de activación

**2. Capas**
- **Capa de entrada**: Recibe los datos iniciales
- **Capas ocultas**: Procesan la información
- **Capa de salida**: Produce el resultado final

**3. Pesos y Sesgos**
- **Pesos**: Determinan la importancia de cada conexión
- **Sesgos**: Permiten ajustar la función de activación

## 💡 Analogía Simple
Imagina una red neuronal como una fábrica:
- Los datos de entrada son las materias primas
- Cada capa es una estación de trabajo
- Los pesos son las instrucciones de cada estación
- El producto final es la predicción

## 🔄 Proceso de Aprendizaje
1. **Alimentación hacia adelante**: Los datos fluyen desde la entrada hasta la salida
2. **Cálculo del error**: Se compara la predicción con el resultado esperado
3. **Retropropagación**: Se ajustan los pesos para reducir el error
4. **Repetición**: Este proceso se repite miles de veces

## 📊 Aplicaciones Prácticas
- Reconocimiento de imágenes
- Procesamiento de lenguaje natural
- Sistemas de recomendación
- Diagnóstico médico
- Vehículos autónomos`,

  "ejercicio": `# Ejercicio Práctico: Clasificación de Imágenes

## 🎯 Objetivo
Los estudiantes aprenderán a construir un clasificador de imágenes básico usando Python y bibliotecas de machine learning.

## 📋 Materiales Necesarios
- Python 3.7+
- Jupyter Notebook
- Bibliotecas: scikit-learn, matplotlib, numpy
- Dataset: CIFAR-10 (incluido en scikit-learn)

## 👨‍💻 Código Base

\`\`\`python
# Importar bibliotecas necesarias
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Paso 1: Cargar datos
print("Cargando dataset...")
# Los estudiantes completarán esta sección

# Paso 2: Explorar los datos
def explorar_datos(X, y):
    print(f"Forma de X: {X.shape}")
    print(f"Forma de y: {y.shape}")
    print(f"Clases únicas: {np.unique(y)}")
    
    # Mostrar algunas imágenes
    fig, axes = plt.subplots(2, 5, figsize=(12, 6))
    for i, ax in enumerate(axes.flat):
        # Los estudiantes completarán esta visualización
        pass

# Paso 3: Preparar datos
def preparar_datos(X, y):
    # Normalizar píxeles (0-255 a 0-1)
    X_norm = X / 255.0
    
    # Dividir en entrenamiento y prueba
    return train_test_split(X_norm, y, test_size=0.2, random_state=42)

# Paso 4: Entrenar modelo
def entrenar_modelo(X_train, y_train):
    modelo = RandomForestClassifier(n_estimators=100, random_state=42)
    # Los estudiantes implementarán el entrenamiento
    return modelo

# Paso 5: Evaluar modelo
def evaluar_modelo(modelo, X_test, y_test):
    # Los estudiantes implementarán la evaluación
    pass
\`\`\`

## 📝 Tareas para los Estudiantes

### Nivel Principiante:
1. Completar la carga de datos
2. Implementar la visualización de imágenes
3. Entrenar el modelo básico

### Nivel Intermedio:
4. Experimentar con diferentes hiperparámetros
5. Probar otros algoritmos (SVM, KNN)
6. Calcular métricas adicionales (precisión, recall, F1-score)

### Nivel Avanzado:
7. Implementar validación cruzada
8. Crear una matriz de confusión
9. Optimizar hiperparámetros con GridSearch

## 🏆 Criterios de Evaluación
- **Código funcional (40%)**
- **Análisis de resultados (30%)**
- **Creatividad en mejoras (20%)**
- **Documentación y comentarios (10%)**

## 💡 Extensiones Posibles
- Usar redes neuronales convolucionales
- Implementar data augmentation
- Comparar con modelos pre-entrenados
- Crear una interfaz web para predicciones`,

  "rubrica": `# Rúbrica de Evaluación: Proyectos de IA

## 📊 Criterios de Evaluación (Total: 100 puntos)

### 1. Comprensión Teórica (25 puntos)

**Excelente (23-25 puntos)**
- Demuestra comprensión profunda de conceptos de IA
- Explica claramente la teoría detrás del enfoque elegido
- Relaciona conceptos teóricos con la implementación práctica

**Bueno (18-22 puntos)**
- Comprende la mayoría de conceptos relevantes
- Explica la teoría con claridad, pero puede faltar profundidad
- Hace algunas conexiones entre teoría y práctica

**Satisfactorio (13-17 puntos)**
- Comprensión básica de conceptos principales
- Explicaciones simples pero correctas
- Conexiones limitadas entre teoría y práctica

**Necesita Mejora (0-12 puntos)**
- Comprensión superficial o incorrecta
- Explicaciones confusas o incompletas
- No relaciona teoría con práctica

### 2. Implementación Técnica (30 puntos)

**Excelente (27-30 puntos)**
- Código limpio, bien estructurado y documentado
- Implementación correcta y eficiente
- Manejo adecuado de errores y casos edge

**Bueno (21-26 puntos)**
- Código funcional con buena estructura
- Implementación mayormente correcta
- Documentación básica pero suficiente

**Satisfactorio (15-20 puntos)**
- Código funciona pero puede ser desordenado
- Implementación básica correcta
- Documentación mínima

**Necesita Mejora (0-14 puntos)**
- Código no funciona o tiene errores significativos
- Implementación incorrecta o incompleta
- Sin documentación

### 3. Metodología y Experimentación (20 puntos)

**Excelente (18-20 puntos)**
- Diseño experimental riguroso
- Validación apropiada del modelo
- Análisis sistemático de resultados

**Bueno (14-17 puntos)**
- Metodología sólida con validación básica
- Análisis de resultados competente
- Algunos experimentos adicionales

**Satisfactorio (10-13 puntos)**
- Metodología básica pero apropiada
- Validación simple del modelo
- Análisis superficial de resultados

**Necesita Mejora (0-9 puntos)**
- Sin metodología clara
- Sin validación adecuada
- Análisis inadecuado o incorrecto

### 4. Análisis de Resultados (15 puntos)

**Excelente (14-15 puntos)**
- Interpretación profunda y precisa de resultados
- Identifica limitaciones y posibles mejoras
- Contextualiza resultados apropiadamente

**Bueno (11-13 puntos)**
- Interpretación correcta de resultados principales
- Algunas observaciones sobre limitaciones
- Contexto básico apropiado

**Satisfactorio (8-10 puntos)**
- Interpretación básica correcta
- Observaciones superficiales
- Contexto limitado

**Necesita Mejora (0-7 puntos)**
- Interpretación incorrecta o ausente
- No identifica limitaciones
- Sin contexto

### 5. Presentación y Comunicación (10 puntos)

**Excelente (9-10 puntos)**
- Presentación clara, profesional y bien organizada
- Comunicación efectiva de ideas complejas
- Uso apropiado de visualizaciones

**Bueno (7-8 puntos)**
- Presentación organizada y clara
- Comunicación competente
- Visualizaciones básicas apropiadas

**Satisfactorio (5-6 puntos)**
- Presentación básica pero comprensible
- Comunicación simple pero efectiva
- Pocas visualizaciones

**Necesita Mejora (0-4 puntos)**
- Presentación desorganizada o confusa
- Comunicación deficiente
- Sin visualizaciones o inapropiadas

## 🎯 Escala de Calificaciones

- **90-100 puntos**: A (Excelente)
- **80-89 puntos**: B (Bueno)
- **70-79 puntos**: C (Satisfactorio)
- **60-69 puntos**: D (Necesita Mejora)
- **<60 puntos**: F (Insuficiente)

## 📝 Comentarios Adicionales
- Se valorará la originalidad y creatividad
- La colaboración efectiva en equipos será considerada
- Se dará crédito por intentos bien fundamentados aunque no sean completamente exitosos`
};

export function AIAssistantPage({ onBack }: AIAssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '¡Hola! Soy tu asistente de IA para educación. Puedo ayudarte a crear materiales educativos, resolver dudas sobre IA, diseñar evaluaciones y mucho más. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
      suggestions: ["Crear un quiz", "Generar material educativo", "Diseñar un ejercicio práctico", "Explicar un concepto"]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(content.trim()),
        timestamp: new Date(),
        suggestions: generateSuggestions(content.trim())
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('quiz') || lowerInput.includes('evaluación') || lowerInput.includes('pregunta')) {
      return mockResponses.quiz;
    } else if (lowerInput.includes('material') || lowerInput.includes('contenido') || lowerInput.includes('neuronal')) {
      return mockResponses.material;
    } else if (lowerInput.includes('ejercicio') || lowerInput.includes('práctica') || lowerInput.includes('programación')) {
      return mockResponses.ejercicio;
    } else if (lowerInput.includes('rúbrica') || lowerInput.includes('evaluar') || lowerInput.includes('criterio')) {
      return mockResponses.rubrica;
    } else if (lowerInput.includes('proyecto') || lowerInput.includes('idea')) {
      return `# Ideas de Proyectos Finales para IA

## 🚀 Proyecto 1: Asistente Personal Inteligente
**Nivel:** Intermedio
**Duración:** 4-6 semanas

Desarrollar un chatbot que pueda responder preguntas básicas sobre un tema específico (ej: salud, finanzas, educación).

**Tecnologías:** Python, NLTK/spaCy, Flask
**Entregables:** Aplicación web funcional, documentación, presentación

## 🎨 Proyecto 2: Clasificador de Arte
**Nivel:** Principiante-Intermedio  
**Duración:** 3-4 semanas

Crear un sistema que clasifique obras de arte por estilo, época o artista usando computer vision.

**Tecnologías:** Python, TensorFlow/PyTorch, OpenCV
**Entregables:** Modelo entrenado, interfaz de usuario, análisis de resultados

## 📊 Proyecto 3: Predictor de Tendencias
**Nivel:** Avanzado
**Duración:** 6-8 semanas

Desarrollar un sistema que analice datos de redes sociales para predecir tendencias en un campo específico.

**Tecnologías:** Python, APIs de redes sociales, Machine Learning
**Entregables:** Dashboard interactivo, modelo predictivo, informe de insights`;
    } else if (lowerInput.includes('overfitting') || lowerInput.includes('sobreajuste')) {
      return `# Overfitting en Machine Learning 🧠

## ¿Qué es el Overfitting?

El **overfitting** (sobreajuste) ocurre cuando un modelo aprende demasiado bien los datos de entrenamiento, incluyendo el ruido y las peculiaridades específicas, pero falla al generalizar a datos nuevos.

## 🎯 Analogía Simple
Imagina un estudiante que memoriza todas las respuestas de exámenes pasados sin entender los conceptos. Puede obtener 100% en esos exámenes específicos, pero falla con preguntas nuevas.

## 🔍 Señales de Overfitting
- **Alta precisión en entrenamiento, baja en validación**
- **Diferencia creciente entre métricas de entrenamiento y validación**
- **Modelo muy complejo para la cantidad de datos disponibles**

## 🛡️ Cómo Evitarlo

### 1. Más Datos
- Recopilar más ejemplos de entrenamiento
- Data augmentation (para imágenes)

### 2. Regularización
- **L1/L2 Regularization**: Penaliza pesos grandes
- **Dropout**: Apaga neuronas aleatoriamente
- **Early Stopping**: Para el entrenamiento cuando la validación empeora

### 3. Simplificar el Modelo
- Reducir número de parámetros
- Usar arquitecturas más simples
- Feature selection

### 4. Validación Cruzada
- K-fold cross-validation
- Holdout validation
- Time series split (para datos temporales)

## 📊 Ejemplo Práctico
\`\`\`python
# Detectar overfitting
train_scores = []
val_scores = []

for epoch in range(epochs):
    # Entrenar
    model.train()
    train_loss = train_one_epoch()
    
    # Validar
    model.eval()
    val_loss = validate()
    
    train_scores.append(train_loss)
    val_scores.append(val_loss)
    
    # Early stopping si la validación empeora
    if val_loss > min(val_scores[:-1]):
        patience_counter += 1
        if patience_counter > patience:
            break
\`\`\``;
    }
    
    return `Gracias por tu pregunta. Como asistente de IA educativo, puedo ayudarte con:

📚 **Creación de Contenido:**
- Diseñar quizzes y evaluaciones
- Generar material educativo estructurado
- Crear ejercicios prácticos de programación

🧠 **Explicaciones de Conceptos:**
- Simplificar temas complejos de IA
- Proporcionar analogías y ejemplos
- Resolver dudas específicas

🎯 **Planificación Educativa:**
- Diseñar rúbricas de evaluación
- Sugerir ideas de proyectos
- Estructurar planes de lección

¿Te gustaría que te ayude con algo específico? Puedes usar los botones de sugerencias o escribir tu pregunta directamente.`;
  };

  const generateSuggestions = (input: string): string[] => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('quiz')) {
      return ["Crear otro quiz sobre deep learning", "Diseñar una rúbrica para evaluar el quiz", "Explicar cómo validar respuestas automáticamente"];
    } else if (lowerInput.includes('material')) {
      return ["Crear ejercicios prácticos sobre este tema", "Diseñar un quiz de evaluación", "Sugerir recursos adicionales"];
    } else if (lowerInput.includes('ejercicio')) {
      return ["Crear variaciones del ejercicio", "Diseñar rúbrica de evaluación", "Sugerir extensiones avanzadas"];
    }
    
    return ["Crear material educativo", "Diseñar un quiz", "Explicar un concepto", "Sugerir ideas de proyecto"];
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  return (
    <div className="min-h-screen relative flex">
      <DynamicBackground variant="ai-assistant" />
      
      {/* Header */}
      <div className="w-full">
        <header className="bg-white/90 backdrop-blur-md border-b p-4 relative z-10">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <img src={logo} alt="ANIUET Scholar" className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold text-purple-600">
                  🤖 Asistente IA para Maestros
                </h1>
                <p className="text-gray-600">Tu compañero inteligente para crear contenido educativo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className="bg-purple-100 text-purple-800">
                <Sparkles className="w-3 h-3 mr-1" />
                IA Activa
              </Badge>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Nueva Conversación
              </Button>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Quick Prompts Sidebar */}
          <div className="w-80 bg-white/90 backdrop-blur-md border-r p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">🚀 Prompts Rápidos</h3>
            <div className="space-y-3">
              {quickPrompts.map((prompt, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow bg-white/80"
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <prompt.icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 mb-1">{prompt.title}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">{prompt.prompt}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {prompt.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-purple-600 text-white'
                      }`}>
                        {message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>

                      {/* Message Content */}
                      <div className={`rounded-2xl p-4 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/90 backdrop-blur-sm border shadow-sm'
                      }`}>
                        <div className="prose prose-sm max-w-none">
                          {message.type === 'assistant' ? (
                            <div className="space-y-3">
                              <div className="whitespace-pre-wrap text-gray-800">{message.content}</div>
                              {message.content.length > 200 && (
                                <div className="flex space-x-2 pt-2 border-t">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => copyToClipboard(message.content)}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copiar
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Download className="w-3 h-3 mr-1" />
                                    Descargar
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-white">{message.content}</div>
                          )}
                        </div>

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">💡 Sugerencias:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendMessage(suggestion)}
                                  className="text-xs"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex space-x-3 max-w-3xl">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm border shadow-sm rounded-2xl p-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-white/90 backdrop-blur-md p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex space-x-3">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Escribe tu pregunta o solicitud aquí... (ej: 'Crea un quiz sobre machine learning')"
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Tip: Sé específico en tus solicitudes para obtener mejores resultados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}