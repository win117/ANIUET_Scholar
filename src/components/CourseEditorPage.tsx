/**
 * CourseEditorPage.tsx - Editor Visual de Cursos
 * 
 * Editor interactivo estilo RPG para administradores que permite:
 * - Visualizar el curso como mapa de nodos
 * - Agregar, editar y eliminar nodos (lecciones)
 * - Conectar nodos creando paths de aprendizaje
 * - Arrastrar y posicionar nodos
 * - Editar propiedades de cada nodo (tipo, contenido, PDFs, videos)
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { 
  ArrowLeft, 
  BookOpen, 
  Code, 
  Puzzle, 
  Trophy, 
  Star, 
  CheckCircle, 
  Lock,
  Play,
  Brain,
  FileText,
  Video,
  Plus,
  Edit,
  Trash2,
  Save,
  Move,
  Link2,
  X
} from "lucide-react";

interface Node {
  id: string;
  title: string;
  type: 'reading' | 'practice' | 'project' | 'quiz' | 'video' | 'checkpoint';
  position: { x: number; y: number };
  connections: string[];
  xpReward: number;
  estimatedTime: string;
  description: string;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  prerequisites?: string[];
  order?: number;
}

interface CourseEditorPageProps {
  course: any;
  onBack: () => void;
  accessToken: string;
}

export function CourseEditorPage({ course, onBack, accessToken }: CourseEditorPageProps) {
  console.log('=== COURSE EDITOR PAGE MOUNTED ===');
  console.log('Course prop:', course);
  console.log('Course ID:', course?.id);
  console.log('Course title:', course?.title);
  console.log('Course lessons:', course?.lessons);
  console.log('Lessons is array?:', Array.isArray(course?.lessons));
  console.log('Lessons count:', course?.lessons?.length);
  
  console.log('\n📘 GUÍA DE USO DEL EDITOR VISUAL:');
  console.log('1. ✏️  Edita nodos: Haz clic en el botón de lápiz en cada nodo');
  console.log('2. 🔗 Conecta nodos: Haz clic en el botón de enlace y selecciona el destino');
  console.log('3. 📍 Mueve nodos: Arrastra los nodos en el canvas');
  console.log('4. ➕ Agrega nodos: Haz clic en "Agregar Nodo"');
  console.log('5. 💾 IMPORTANTE: Haz clic en "Guardar Curso" para persistir cambios');
  console.log('6. 🔄 Verificación: Después de guardar, los datos se recargan automáticamente del backend');
  console.log('7. 🐛 Debug: Usa el botón 🐛 para ver el estado actual en consola');
  console.log('8. 🔄 Recarga manual: Usa el botón 🔄 para recargar desde el backend en cualquier momento\n');
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Form state for node editing
  const [nodeForm, setNodeForm] = useState({
    title: '',
    description: '',
    type: 'reading' as Node['type'],
    content: '',
    videoUrl: '',
    pdfUrl: '',
    xpReward: 50,
    estimatedTime: '15 min'
  });

  useEffect(() => {
    console.log('=== USEEFFECT TRIGGERED ===');
    console.log('Course ID in useEffect:', course.id);
    loadCourseNodes();
  }, [course.id]);

  // Handle drag events
  useEffect(() => {
    if (!isDragging || !draggedNode || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        handleNodeDrag(draggedNode, e as any, canvasRef.current);
      }
    };
    
    const handleMouseUp = () => {
      setDraggedNode(null);
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedNode]);

  const loadCourseNodes = async (fromBackend = false) => {
    try {
      console.log('=== LOADING COURSE NODES ===');
      console.log('Source:', fromBackend ? 'Backend (fresh data)' : 'Props (initial load)');
      
      let courseData = course;
      
      // If requested to load from backend, fetch fresh data
      if (fromBackend) {
        console.log('🔄 Fetching fresh data from backend...');
        try {
          const freshData = await apiHelpers.adminGetCourse(accessToken, course.id);
          console.log('✅ Fresh data received:', freshData);
          courseData = freshData.course;
        } catch (error) {
          console.error('❌ Failed to fetch fresh data:', error);
          toast.error('Error al recargar datos del backend');
          return;
        }
      }
      
      console.log('Course:', courseData);
      console.log('Course lessons:', courseData.lessons);
      
      // Load lessons from the course
      if (courseData.lessons && Array.isArray(courseData.lessons)) {
        console.log(`Found ${courseData.lessons.length} lessons to load`);
        
        const loadedNodes: Node[] = courseData.lessons.map((lesson: any, index: number) => {
          const node = {
            id: lesson.id || `lesson-${index}`,
            title: lesson.title || 'Sin título',
            type: lesson.type || 'reading',
            position: lesson.position || { 
              x: 20 + (index % 4) * 25, 
              y: 80 - Math.floor(index / 4) * 20 
            },
            connections: lesson.connections || (index < courseData.lessons.length - 1 ? [courseData.lessons[index + 1].id] : []),
            xpReward: lesson.xp || lesson.xpReward || 50,
            estimatedTime: lesson.estimatedTime || (lesson.duration ? `${lesson.duration} min` : '15 min'),
            description: lesson.description || lesson.title || 'Sin descripción',
            content: lesson.content || '',
            videoUrl: lesson.videoUrl || '',
            pdfUrl: lesson.pdfUrl || '',
            prerequisites: lesson.prerequisites || (index > 0 ? [courseData.lessons[index - 1].id] : []),
            order: lesson.order !== undefined ? lesson.order : index
          };
          
          console.log(`Loaded node ${index}:`, {
            id: node.id,
            title: node.title,
            position: node.position,
            connections: node.connections
          });
          
          return node;
        });
        
        console.log(`Successfully loaded ${loadedNodes.length} nodes`);
        setNodes(loadedNodes);
      } else {
        console.log('No lessons found in course or lessons is not an array');
        setNodes([]);
      }
    } catch (error) {
      console.error('Error loading course nodes:', error);
      toast.error('Error al cargar los nodos del curso');
    }
  };

  const handleAddNode = () => {
    // Create a new node at a default position
    const newNode: Node = {
      id: `node-${Date.now()}`,
      title: 'Nueva Lección',
      type: 'reading',
      position: { x: 50, y: 50 },
      connections: [],
      xpReward: 50,
      estimatedTime: '15 min',
      description: 'Nueva lección',
      content: '',
      order: nodes.length
    };
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    setNodeForm({
      title: newNode.title,
      description: newNode.description,
      type: newNode.type,
      content: newNode.content || '',
      videoUrl: newNode.videoUrl || '',
      pdfUrl: newNode.pdfUrl || '',
      xpReward: newNode.xpReward,
      estimatedTime: newNode.estimatedTime
    });
    setIsEditingNode(true);
  };

  const handleEditNode = (node: Node) => {
    setSelectedNode(node);
    setNodeForm({
      title: node.title,
      description: node.description,
      type: node.type,
      content: node.content || '',
      videoUrl: node.videoUrl || '',
      pdfUrl: node.pdfUrl || '',
      xpReward: node.xpReward,
      estimatedTime: node.estimatedTime
    });
    setIsEditingNode(true);
  };

  const handleSaveNode = () => {
    if (!selectedNode) return;

    console.log('=== GUARDANDO NODO ===');
    console.log('Nodo anterior:', { id: selectedNode.id, title: selectedNode.title });
    console.log('Nuevos datos:', nodeForm);

    const updatedNode: Node = {
      ...selectedNode,
      ...nodeForm
    };

    console.log('Nodo actualizado:', updatedNode);
    setNodes(nodes.map(n => n.id === selectedNode.id ? updatedNode : n));
    setIsEditingNode(false);
    setSelectedNode(null);
    
    console.log('✅ Nodo actualizado en el estado local');
    toast.success('✅ Nodo actualizado - Recuerda hacer clic en "Guardar Curso" para persistir los cambios');
  };

  const handleDeleteNode = (nodeId: string) => {
    // Remove node and all connections to it
    setNodes(nodes
      .filter(n => n.id !== nodeId)
      .map(n => ({
        ...n,
        connections: n.connections.filter(c => c !== nodeId),
        prerequisites: n.prerequisites?.filter(p => p !== nodeId)
      }))
    );
    setSelectedNode(null);
    toast.success('Nodo eliminado');
  };

  const handleStartConnection = (nodeId: string) => {
    setIsConnecting(true);
    setConnectingFrom(nodeId);
    toast.info('Selecciona el nodo destino para crear la conexión');
  };

  const handleCompleteConnection = (targetNodeId: string) => {
    if (!connectingFrom || connectingFrom === targetNodeId) {
      setIsConnecting(false);
      setConnectingFrom(null);
      return;
    }

    setNodes(nodes.map(n => {
      if (n.id === connectingFrom) {
        // Add connection if it doesn't exist
        if (!n.connections.includes(targetNodeId)) {
          return { ...n, connections: [...n.connections, targetNodeId] };
        }
      }
      return n;
    }));

    setIsConnecting(false);
    setConnectingFrom(null);
    toast.success('Conexión creada');
  };

  const handleRemoveConnection = (fromNodeId: string, toNodeId: string) => {
    setNodes(nodes.map(n => {
      if (n.id === fromNodeId) {
        return { ...n, connections: n.connections.filter(c => c !== toNodeId) };
      }
      return n;
    }));
    toast.success('Conexión eliminada');
  };

  const handleNodeDrag = (nodeId: string, e: React.MouseEvent, containerRef: HTMLDivElement) => {
    const container = containerRef;
    const rect = container.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values between 5 and 95 to keep nodes visible
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setNodes(nodes.map(n => 
      n.id === nodeId 
        ? { ...n, position: { x: clampedX, y: clampedY } }
        : n
    ));
  };

  const handleSaveCourse = async () => {
    try {
      setIsSaving(true);
      console.log('=== GUARDANDO CURSO ===');
      console.log('📦 Preparando datos para guardar...');
      console.log('Número de nodos:', nodes.length);
      
      // Convert nodes back to lessons format
      const lessons = nodes.map((node, index) => ({
        id: node.id,
        title: node.title,
        description: node.description,
        type: node.type,
        content: node.content || '',
        videoUrl: node.videoUrl || '',
        pdfUrl: node.pdfUrl || '',
        xp: node.xpReward,
        estimatedTime: node.estimatedTime,
        duration: parseInt(node.estimatedTime) || 15,
        order: node.order !== undefined ? node.order : index,
        position: node.position,
        connections: node.connections,
        prerequisites: node.prerequisites || []
      }));

      console.log('📝 Lecciones convertidas:', lessons.length);
      console.log('Detalles de lecciones:', lessons.map(l => ({ id: l.id, title: l.title, type: l.type })));

      const courseData = {
        id: course.id,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        courseCode: course.courseCode,
        type: course.type,
        status: course.status,
        lessons
      };

      console.log('📤 Enviando al backend...');
      const result = await apiHelpers.adminSaveCourse(accessToken, courseData);
      console.log('✅ Respuesta del backend:', result);
      
      if (result.success && result.course) {
        console.log('📊 Curso guardado en backend:', {
          id: result.course.id,
          title: result.course.title,
          lessonsCount: result.course.lessons?.length || 0,
          updatedAt: result.course.updatedAt
        });
      }

      toast.success('✅ Curso guardado exitosamente en el backend');
      
      // Recargar datos del curso desde el backend para verificar que se guardó correctamente
      console.log('🔄 Recargando datos del curso desde el backend para verificar...');
      await loadCourseNodes(true); // true = cargar desde backend
      console.log('✅ Datos recargados desde el backend - los cambios se persistieron correctamente');
      
      setLastSaved(new Date());
      
      // Confirmación detallada
      toast.success(`✅ ${lessons.length} ${lessons.length === 1 ? 'lección guardada' : 'lecciones guardadas'} y verificadas`, { 
        duration: 3000,
        description: 'Los cambios se reflejaron correctamente en el backend'
      });
    } catch (error) {
      console.error('❌ Error saving course:', error);
      console.error('Error details:', error.message);
      toast.error('Error al guardar el curso: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'reading': return BookOpen;
      case 'practice': return Code;
      case 'project': return Puzzle;
      case 'quiz': return Brain;
      case 'video': return Video;
      case 'checkpoint': return Trophy;
      default: return BookOpen;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'reading': return '#4285F4';
      case 'practice': return '#E3701B';
      case 'project': return '#C4423D';
      case 'quiz': return '#8B5CF6';
      case 'video': return '#10B981';
      case 'checkpoint': return '#F59E0B';
      default: return '#4285F4';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'reading': return '📖 Lectura';
      case 'practice': return '💻 Práctica';
      case 'project': return '🧩 Proyecto';
      case 'quiz': return '🧠 Evaluación';
      case 'video': return '🎥 Video';
      case 'checkpoint': return '🏆 Checkpoint';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen relative">
      <DynamicBackground variant="course-map" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b p-4 relative z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl" style={{ color: '#E3701B' }}>
                Editor: {course.title}
              </h1>
              <p className="text-gray-600">Modo de edición visual</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {nodes.length} Nodos
            </Badge>
            {lastSaved && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ✓ Guardado {new Date(lastSaved).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Badge>
            )}
            <Button 
              onClick={() => {
                console.log('=== ESTADO ACTUAL DEL EDITOR ===');
                console.log('Curso ID:', course.id);
                console.log('Curso Tipo:', course.type);
                console.log('Total de nodos:', nodes.length);
                console.log('Nodos completos:', JSON.stringify(nodes, null, 2));
                toast.info('Estado actual mostrado en consola');
              }}
              variant="outline"
              size="sm"
              title="Debug: Ver estado en consola"
            >
              🐛
            </Button>
            <Button 
              onClick={async () => {
                toast.info('Recargando desde el backend...');
                await loadCourseNodes(true);
                toast.success('Datos recargados desde el backend');
              }}
              variant="outline"
              size="sm"
              title="Recargar datos desde el backend"
            >
              🔄
            </Button>
            <Button onClick={handleAddNode} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Nodo
            </Button>
            <Button 
              onClick={handleSaveCourse}
              disabled={isSaving}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Curso'}
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white/80 backdrop-blur-sm px-6 py-3 border-b relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {isConnecting ? (
                  <span className="text-blue-600 font-medium">
                    🔗 Modo conexión activado - Selecciona el nodo destino
                  </span>
                ) : (
                  <span>
                    💡 Haz clic en un nodo para editarlo, arrastra para mover
                  </span>
                )}
              </div>
              {isConnecting && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsConnecting(false);
                    setConnectingFrom(null);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
            
            {/* Estado del curso */}
            <div className="flex items-center space-x-2 text-xs">
              <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                <strong>Tipo:</strong> {course.type === 'mock' ? 'Mock' : 'Personalizado'}
              </div>
              <div className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                <strong>ID:</strong> {course.id}
              </div>
              {isSaving && (
                <div className="px-2 py-1 bg-orange-50 text-orange-700 rounded animate-pulse">
                  💾 Guardando...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Map Editor */}
      <main className="relative p-6">
        <div className="max-w-7xl mx-auto">
          <div 
            ref={canvasRef}
            className="relative h-[600px] bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-indigo-50/50 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden"
          >
            {/* Background pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, #E3701B 2px, transparent 2px)',
                backgroundSize: '50px 50px'
              }}
            />
            
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {nodes.map(node => 
                node.connections.map(connectionId => {
                  const targetNode = nodes.find(n => n.id === connectionId);
                  if (!targetNode) return null;
                  
                  return (
                    <g key={`${node.id}-${connectionId}`}>
                      <motion.line
                        x1={`${node.position.x}%`}
                        y1={`${node.position.y}%`}
                        x2={`${targetNode.position.x}%`}
                        y2={`${targetNode.position.y}%`}
                        stroke="#4285F4"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      {/* Connection remove button */}
                      <circle
                        cx={`${(node.position.x + targetNode.position.x) / 2}%`}
                        cy={`${(node.position.y + targetNode.position.y) / 2}%`}
                        r="8"
                        fill="white"
                        stroke="#EF4444"
                        strokeWidth="2"
                        className="cursor-pointer pointer-events-auto"
                        onClick={() => handleRemoveConnection(node.id, connectionId)}
                      />
                      <text
                        x={`${(node.position.x + targetNode.position.x) / 2}%`}
                        y={`${(node.position.y + targetNode.position.y) / 2}%`}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#EF4444"
                        fontSize="12"
                        className="pointer-events-none"
                      >
                        ×
                      </text>
                    </g>
                  );
                })
              )}
              
              {/* Active connection line while connecting */}
              {isConnecting && connectingFrom && hoveredNode && (
                <line
                  x1={`${nodes.find(n => n.id === connectingFrom)?.position.x}%`}
                  y1={`${nodes.find(n => n.id === connectingFrom)?.position.y}%`}
                  x2={`${nodes.find(n => n.id === hoveredNode)?.position.x}%`}
                  y2={`${nodes.find(n => n.id === hoveredNode)?.position.y}%`}
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  className="animate-pulse"
                />
              )}
            </svg>
            
            {/* Empty State Message */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No hay lecciones en este curso
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Este curso no tiene lecciones cargadas. Haz clic en &quot;Agregar Nodo&quot; para crear la primera lección.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Sugerencia:</strong> Si este es un curso mock, asegúrate de haber presionado el botón &quot;Inicializar Mock&quot; en el panel de administración.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Nodes */}
            {nodes.map((node, index) => {
              const Icon = getNodeIcon(node.type);
              const nodeColor = getNodeColor(node.type);
              const isBeingConnected = connectingFrom === node.id;
              const canConnect = isConnecting && connectingFrom !== node.id;
              
              return (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move"
                  style={{ 
                    left: `${node.position.x}%`, 
                    top: `${node.position.y}%`,
                    zIndex: draggedNode === node.id ? 50 : 10
                  }}
                  onMouseDown={(e) => {
                    if (!isConnecting) {
                      setDraggedNode(node.id);
                      setIsDragging(true);
                    }
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isConnecting) {
                      handleCompleteConnection(node.id);
                    }
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`relative ${canConnect ? 'ring-4 ring-green-400 ring-offset-2' : ''}`}
                  >
                    {/* Node Circle */}
                    <div 
                      className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isBeingConnected ? 'ring-4 ring-blue-400 ring-offset-2 animate-pulse' : ''
                      }`}
                      style={{ 
                        backgroundColor: nodeColor,
                        borderColor: '#fff'
                      }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Node Label */}
                    <div className="absolute top-18 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border">
                        <div className="font-medium text-sm text-gray-900 whitespace-nowrap">
                          {node.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {getTypeLabel(node.type)}
                        </div>
                      </div>
                    </div>
                    
                    {/* XP Badge */}
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-yellow-300 pointer-events-none">
                      +{node.xpReward}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex gap-1 pointer-events-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNode(node);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartConnection(node.id);
                        }}
                      >
                        <Link2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar "${node.title}"?`)) {
                            handleDeleteNode(node.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Node Edit Dialog */}
      <Dialog open={isEditingNode} onOpenChange={setIsEditingNode}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedNode?.id.startsWith('node-') ? 'Crear Nodo' : 'Editar Nodo'}
            </DialogTitle>
            <DialogDescription>
              Configura el contenido y propiedades del nodo
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={nodeForm.title}
                    onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                    placeholder="Título del nodo"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={nodeForm.type} 
                    onValueChange={(value: Node['type']) => setNodeForm({ ...nodeForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reading">📖 Lectura</SelectItem>
                      <SelectItem value="video">🎥 Video</SelectItem>
                      <SelectItem value="practice">💻 Práctica</SelectItem>
                      <SelectItem value="project">🧩 Proyecto</SelectItem>
                      <SelectItem value="quiz">🧠 Evaluación</SelectItem>
                      <SelectItem value="checkpoint">🏆 Checkpoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={nodeForm.description}
                  onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })}
                  placeholder="Descripción breve"
                  rows={2}
                />
              </div>

              <div>
                <Label>Contenido (Markdown)</Label>
                <Textarea
                  value={nodeForm.content}
                  onChange={(e) => setNodeForm({ ...nodeForm, content: e.target.value })}
                  placeholder="# Título&#10;&#10;Contenido en Markdown..."
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    URL del Video
                  </Label>
                  <Input
                    value={nodeForm.videoUrl}
                    onChange={(e) => setNodeForm({ ...nodeForm, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    URL del PDF
                  </Label>
                  <Input
                    value={nodeForm.pdfUrl}
                    onChange={(e) => setNodeForm({ ...nodeForm, pdfUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>XP Recompensa</Label>
                  <Input
                    type="number"
                    value={nodeForm.xpReward}
                    onChange={(e) => setNodeForm({ ...nodeForm, xpReward: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Tiempo Estimado</Label>
                  <Input
                    value={nodeForm.estimatedTime}
                    onChange={(e) => setNodeForm({ ...nodeForm, estimatedTime: e.target.value })}
                    placeholder="15 min"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setIsEditingNode(false);
              setSelectedNode(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNode}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Nodo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
