/**
 * MessagesPage.tsx - Sistema de Mensajes Directos
 * 
 * Permite a los usuarios:
 * - Ver lista de conversaciones
 * - Enviar y recibir mensajes directos
 * - Buscar usuarios para iniciar conversaciones
 * - Ver mensajes no leídos
 * - Chat en tiempo real (simulado)
 * 
 * @module MessagesPage
 */
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Search,
  UserPlus,
  Loader2,
  CheckCheck,
  Check,
  Users,
  Mail,
  MailOpen,
  X
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface MessagesPageProps {
  onBack: () => void;
  session: any;
  userProfile: any;
  role: 'student' | 'teacher' | 'professional';
}

interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessageAt: string;
  unreadCount: number[];
  participantInfo?: {
    id: string;
    name: string;
    role: string;
    level: number;
  };
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

export function MessagesPage({ onBack, session, userProfile, role }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const roleConfig = {
    student: { color: '#E3701B', icon: '🎓' },
    teacher: { color: '#4285F4', icon: '🧑‍🏫' },
    professional: { color: '#C4423D', icon: '👩‍💼' }
  };

  const config = roleConfig[role];

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(() => {
      if (selectedConversation) {
        refreshSelectedConversation();
      }
      loadUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers();
      }, 500);
    } else {
      setSearchResults([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      const result = await apiHelpers.getConversations(session.access_token);
      
      if (result.success) {
        setConversations(result.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Error al cargar conversaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!session?.access_token) return;

    try {
      const result = await apiHelpers.getUnreadMessageCount(session.access_token);
      
      if (result.success) {
        setUnreadCount(result.unreadCount || 0);
      } else {
        // Silently fail - don't show error to user
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently fail - just set to 0 unread messages
      setUnreadCount(0);
    }
  };

  const refreshSelectedConversation = async () => {
    if (!selectedConversation || !session?.access_token) return;

    try {
      const result = await apiHelpers.getConversationMessages(
        session.access_token,
        selectedConversation.id
      );
      
      if (result.success && result.conversation) {
        setSelectedConversation(result.conversation);
        
        // Update in conversations list
        setConversations(prevConvs =>
          prevConvs.map(conv =>
            conv.id === result.conversation.id ? result.conversation : conv
          )
        );
      }
    } catch (error) {
      console.error('Error refreshing conversation:', error);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Load full conversation with messages
    try {
      const result = await apiHelpers.getConversationMessages(
        session.access_token,
        conversation.id
      );
      
      if (result.success) {
        setSelectedConversation(result.conversation);
        
        // Update conversations list to reflect read status
        setConversations(prevConvs =>
          prevConvs.map(conv =>
            conv.id === conversation.id ? result.conversation : conv
          )
        );
        
        // Update unread count
        await loadUnreadCount();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Error al cargar conversación');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !session?.access_token) return;

    const recipientId = selectedConversation.participants.find(
      p => p !== userProfile?.id
    );

    if (!recipientId) return;

    setIsSending(true);
    try {
      const result = await apiHelpers.sendDirectMessage(
        session.access_token,
        recipientId,
        messageInput
      );

      if (result.success) {
        // Add message to current conversation
        const updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, result.message],
          lastMessageAt: result.message.createdAt
        };
        
        setSelectedConversation(updatedConversation);
        
        // Update in conversations list
        setConversations(prevConvs => {
          const filtered = prevConvs.filter(c => c.id !== updatedConversation.id);
          return [updatedConversation, ...filtered];
        });
        
        setMessageInput('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const searchUsers = async () => {
    if (!session?.access_token || !searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const result = await apiHelpers.searchUsersToMessage(
        session.access_token,
        searchQuery
      );

      if (result.success) {
        setSearchResults(result.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = async (user: any) => {
    setShowNewMessageDialog(false);
    setSearchQuery('');
    setSearchResults([]);

    // Check if conversation already exists
    const existingConv = conversations.find(conv =>
      conv.participants.includes(user.id)
    );

    if (existingConv) {
      handleSelectConversation(existingConv);
      return;
    }

    // Create a temporary conversation structure
    const tempConv: Conversation = {
      id: `temp_${user.id}`,
      participants: [userProfile?.id, user.id],
      messages: [],
      lastMessageAt: new Date().toISOString(),
      unreadCount: [0, 0],
      participantInfo: user
    };

    setSelectedConversation(tempConv);
  };

  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case 'student': return '🎓';
      case 'teacher': return '🧑‍🏫';
      case 'professional': return '👩‍💼';
      default: return '👤';
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'student': return 'bg-orange-100 text-orange-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      return 'Hace un momento';
    } else if (hours < 24) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    }
  };

  const getUnreadCountForConversation = (conv: Conversation) => {
    if (!conv.unreadCount || !userProfile?.id) return 0;
    const userIndex = conv.participants.indexOf(userProfile.id);
    return userIndex !== -1 ? (conv.unreadCount[userIndex] || 0) : 0;
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <DynamicBackground variant="dashboard" />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b p-4 sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logo} alt="ANIUET Scholar" className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: config.color }}>
                💬 Mensajes Directos
              </h1>
              <p className="text-sm text-gray-600">
                Conecta con otros miembros de la comunidad
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <Badge className="bg-red-500">
                {unreadCount} nuevo{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
            <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
              <DialogTrigger asChild>
                <Button 
                  style={{ backgroundColor: config.color }}
                  className="text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Mensaje
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Buscar Usuario</DialogTitle>
                  <DialogDescription>
                    Busca usuarios por nombre o correo para iniciar una conversación.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {isSearching && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                  
                  <ScrollArea className="h-64">
                    {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                      <div className="text-center py-8 text-gray-500">
                        No se encontraron usuarios
                      </div>
                    )}
                    
                    {searchResults.map((user: any) => (
                      <div
                        key={user.id}
                        onClick={() => handleStartConversation(user)}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{user.name}</span>
                            <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                              Nivel {user.level}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex container mx-auto p-4 gap-4">
        {/* Conversations List */}
        <Card className="w-80 bg-white/90 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Conversaciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: config.color }} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No tienes conversaciones</p>
                <p className="text-sm text-gray-500">
                  Inicia una nueva conversación
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-250px)]">
                {conversations.map((conv, index) => {
                  const unread = getUnreadCountForConversation(conv);
                  const isSelected = selectedConversation?.id === conv.id;
                  const lastMessage = conv.messages[conv.messages.length - 1];
                  
                  return (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 cursor-pointer transition-colors border-b hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          {getRoleIcon(conv.participantInfo?.role || 'student')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold truncate">
                              {conv.participantInfo?.name || 'Usuario'}
                            </span>
                            {unread > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {unread}
                              </Badge>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {lastMessage.senderId === userProfile?.id ? 'Tú: ' : ''}
                              {lastMessage.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(conv.lastMessageAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 bg-white/90 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-500">
                  Elige una conversación de la lista o inicia una nueva
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      {getRoleIcon(selectedConversation.participantInfo?.role || 'student')}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedConversation.participantInfo?.name || 'Usuario'}
                      </h3>
                      <Badge variant="secondary" className={getRoleBadgeColor(selectedConversation.participantInfo?.role || 'student')}>
                        Nivel {selectedConversation.participantInfo?.level || 1}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-4">
                <ScrollArea className="h-[calc(100vh-380px)] pr-4">
                  <AnimatePresence>
                    {selectedConversation.messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay mensajes. ¡Envía el primero!
                      </div>
                    ) : (
                      selectedConversation.messages.map((message, index) => {
                        const isOwn = message.senderId === userProfile?.id;
                        const showTimestamp = index === 0 || 
                          new Date(message.createdAt).getTime() - 
                          new Date(selectedConversation.messages[index - 1].createdAt).getTime() > 300000;

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                              {showTimestamp && (
                                <div className="text-xs text-gray-400 text-center mb-2">
                                  {formatTime(message.createdAt)}
                                </div>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                    : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                              {isOwn && (
                                <div className="flex items-center justify-end mt-1 space-x-1">
                                  {message.read ? (
                                    <CheckCheck className="w-3 h-3 text-blue-500" />
                                  ) : (
                                    <Check className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isSending}
                    style={{ backgroundColor: config.color }}
                    className="text-white"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
