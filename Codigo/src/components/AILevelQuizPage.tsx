import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ArrowLeft, Brain, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface AILevelQuizPageProps {
  onBack: () => void;
  onComplete: (level: 'beginner' | 'intermediate' | 'advanced') => void;
}

interface Question {
  id: number;
  question: string;
  options: { text: string; points: number }[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "¿Qué es Machine Learning?",
    options: [
      { text: "No tengo idea", points: 0 },
      { text: "Un tipo de programación donde las máquinas aprenden", points: 1 },
      { text: "Un subcampo de la IA que permite a los sistemas aprender automáticamente sin ser programados explícitamente", points: 2 }
    ]
  },
  {
    id: 2,
    question: "¿Has usado alguna vez una API de IA (como OpenAI, Hugging Face, etc.)?",
    options: [
      { text: "¿Qué es una API?", points: 0 },
      { text: "He oído hablar pero nunca las he usado", points: 1 },
      { text: "Sí, he integrado APIs de IA en proyectos", points: 2 }
    ]
  },
  {
    id: 3,
    question: "¿Qué lenguajes de programación conoces para IA?",
    options: [
      { text: "No programo", points: 0 },
      { text: "Conozco Python básico", points: 1 },
      { text: "Python, R, y librerías como TensorFlow, PyTorch", points: 2 }
    ]
  },
  {
    id: 4,
    question: "¿Qué es una red neuronal?",
    options: [
      { text: "No estoy seguro", points: 0 },
      { text: "Un sistema que imita el funcionamiento del cerebro", points: 1 },
      { text: "Una arquitectura computacional con capas de nodos interconectados que procesan información", points: 2 }
    ]
  },
  {
    id: 5,
    question: "¿Has entrenado algún modelo de IA?",
    options: [
      { text: "No, nunca", points: 0 },
      { text: "He seguido tutoriales básicos", points: 1 },
      { text: "Sí, he entrenado modelos personalizados para proyectos específicos", points: 2 }
    ]
  }
];

export function AILevelQuizPage({ onBack, onComplete }: AILevelQuizPageProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (points: number) => {
    const newAnswers = [...answers, points];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const calculateLevel = () => {
    const totalPoints = answers.reduce((sum, points) => sum + points, 0);
    const maxPoints = questions.length * 2;
    const percentage = (totalPoints / maxPoints) * 100;

    if (percentage >= 80) return 'advanced';
    if (percentage >= 50) return 'intermediate';
    return 'beginner';
  };

  const getLevelInfo = (level: 'beginner' | 'intermediate' | 'advanced') => {
    switch (level) {
      case 'advanced':
        return {
          title: '🚀 Nivel Avanzado',
          description: '¡Excelente! Tienes conocimientos sólidos en IA. Podrás acceder a cursos especializados y proyectos avanzados.',
          color: '#10B981',
          percentage: Math.round((answers.reduce((sum, points) => sum + points, 0) / (questions.length * 2)) * 100)
        };
      case 'intermediate':
        return {
          title: '📚 Nivel Intermedio',
          description: 'Tienes una base sólida en IA. Perfecto para cursos de nivel medio y proyectos prácticos.',
          color: '#F59E0B',
          percentage: Math.round((answers.reduce((sum, points) => sum + points, 0) / (questions.length * 2)) * 100)
        };
      case 'beginner':
        return {
          title: '🌱 Nivel Principiante',
          description: 'Perfecto para empezar. Comenzaremos con los fundamentos y te llevaremos paso a paso.',
          color: '#EF4444',
          percentage: Math.round((answers.reduce((sum, points) => sum + points, 0) / (questions.length * 2)) * 100)
        };
    }
  };

  const progress = ((currentQuestion + (showResult ? 1 : 0)) / questions.length) * 100;

  if (showResult) {
    const level = calculateLevel();
    const levelInfo = getLevelInfo(level);

    return (
      <div className="min-h-screen relative py-8 px-4">
        <DynamicBackground variant="quiz" />
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <img src={logo} alt="ANIUET Scholar" className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl text-[#4285F4]">ANIUET Scholar</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-16 h-16" style={{ color: levelInfo.color }} />
                </div>
                <CardTitle className="text-2xl" style={{ color: levelInfo.color }}>
                  {levelInfo.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div>
                  <div className="text-4xl mb-2" style={{ color: levelInfo.color }}>
                    {levelInfo.percentage}%
                  </div>
                  <Progress value={levelInfo.percentage} className="w-full h-3" />
                </div>

                <p className="text-gray-600 leading-relaxed">
                  {levelInfo.description}
                </p>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => onComplete(level)}
                    className="w-full text-white hover:shadow-lg transition-all duration-300"
                    style={{ backgroundColor: levelInfo.color }}
                  >
                    Continuar con este nivel
                  </Button>
                  
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="w-full"
                  >
                    Volver al registro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-8 px-4">
      <DynamicBackground variant="quiz" />
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <img src={logo} alt="ANIUET Scholar" className="w-12 h-12 mx-auto mb-2" />
          <h2 className="text-xl text-[#4285F4]">ANIUET Scholar</h2>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="mb-6 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Pregunta {currentQuestion + 1} de {questions.length}</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </motion.div>

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Brain className="w-12 h-12 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-purple-700">
                Evaluación de Nivel en IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg mb-6">
                  {questions[currentQuestion].question}
                </h3>
              </div>

              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => handleAnswer(option.points)}
                      variant="outline"
                      className="w-full p-4 h-auto text-left justify-start hover:bg-purple-50 border-purple-200 whitespace-normal min-h-[60px]"
                    >
                      <span className="text-purple-600 mr-3 text-xl flex-shrink-0">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 leading-relaxed">
                        {option.text}
                      </span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}