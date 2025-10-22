import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { toast } from "sonner@2.0.3";
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  Moon,
  Sun,
  Volume2,
  Download,
  Trash2,
  HelpCircle,
  Mail,
  MessageCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Database,
  Lock,
  Palette,
  Globe,
  Clock
} from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

interface SettingsPageProps {
  onBack: () => void;
  session: any;
  userProfile: any;
  role: 'student' | 'teacher' | 'professional';
  onLogout: () => void;
}

export function SettingsPage({ onBack, session, userProfile, role, onLogout }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'account'>('general');
  const [settings, setSettings] = useState({
    // General Settings
    language: 'es',
    timezone: 'America/Mexico_City',
    theme: 'light',
    dateFormat: 'DD/MM/YYYY',
    currency: 'MXN',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    courseReminders: true,
    achievementNotifications: true,
    communityUpdates: false,
    weeklyDigest: true,
    marketingEmails: false,
    
    // Privacy Settings
    profileVisibility: 'public',
    showProgress: true,
    showAchievements: true,
    showActivity: false,
    allowDataCollection: true,
    
    // Sound Settings
    soundEffects: true,
    notificationSounds: true,
    backgroundMusic: false,
    volume: 50
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // In a real app, this would load settings from the backend
    // For now, we'll use localStorage
    try {
      const savedSettings = localStorage.getItem('aniuet-settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSaveSettings = async () => {
    try {
      // In a real app, this would save to the backend
      localStorage.setItem('aniuet-settings', JSON.stringify(settings));
      setIsDirty(false);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    }
  };

  const handleResetSettings = () => {
    setSettings({
      language: 'es',
      timezone: 'America/Mexico_City',
      theme: 'light',
      dateFormat: 'DD/MM/YYYY',
      currency: 'MXN',
      emailNotifications: true,
      pushNotifications: true,
      courseReminders: true,
      achievementNotifications: true,
      communityUpdates: false,
      weeklyDigest: true,
      marketingEmails: false,
      profileVisibility: 'public',
      showProgress: true,
      showAchievements: true,
      showActivity: false,
      allowDataCollection: true,
      soundEffects: true,
      notificationSounds: true,
      backgroundMusic: false,
      volume: 50
    });
    setIsDirty(true);
    toast.success('Configuración restablecida a valores por defecto');
  };

  const handleExportData = () => {
    // Mock export functionality
    toast.success('Iniciando descarga de datos...');
  };

  const handleDeleteAccount = () => {
    // Mock delete account functionality
    toast.error('Para eliminar tu cuenta, contacta a soporte');
  };

  const getRoleColor = () => {
    switch (role) {
      case 'student': return '#E3701B';
      case 'teacher': return '#4285F4';
      case 'professional': return '#C4423D';
      default: return '#4285F4';
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
    { id: 'account', label: 'Cuenta', icon: Lock }
  ];

  return (
    <div className="min-h-screen relative">
      <DynamicBackground variant="dashboard" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <img src={logo} alt="ANIUET Scholar" className="w-8 h-8" />
                <h1 className="text-2xl font-bold" style={{ color: getRoleColor() }}>
                  Configuración
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isDirty && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleResetSettings}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restablecer
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    style={{ backgroundColor: getRoleColor() }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white/90">
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? 'default' : 'ghost'}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full justify-start ${
                          activeTab === tab.id ? 'text-white' : ''
                        }`}
                        style={{
                          backgroundColor: activeTab === tab.id ? getRoleColor() : undefined
                        }}
                      >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                      </Button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Globe className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Idioma y Región</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="language">Idioma</Label>
                            <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                                <SelectItem value="pt">Português</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="timezone">Zona Horaria</Label>
                            <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                                <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                                <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                                <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="dateFormat">Formato de Fecha</Label>
                            <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="currency">Moneda</Label>
                            <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                                <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                <SelectItem value="BRL">Real Brasileño (BRL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Palette className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Apariencia</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="theme">Tema</Label>
                          <div className="flex space-x-4 mt-2">
                            <Button
                              variant={settings.theme === 'light' ? 'default' : 'outline'}
                              onClick={() => handleSettingChange('theme', 'light')}
                              className="flex items-center space-x-2"
                            >
                              <Sun className="w-4 h-4" />
                              <span>Claro</span>
                            </Button>
                            <Button
                              variant={settings.theme === 'dark' ? 'default' : 'outline'}
                              onClick={() => handleSettingChange('theme', 'dark')}
                              className="flex items-center space-x-2"
                            >
                              <Moon className="w-4 h-4" />
                              <span>Oscuro</span>
                            </Button>
                            <Button
                              variant={settings.theme === 'auto' ? 'default' : 'outline'}
                              onClick={() => handleSettingChange('theme', 'auto')}
                              className="flex items-center space-x-2"
                            >
                              <Settings className="w-4 h-4" />
                              <span>Auto</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Volume2 className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Audio</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="soundEffects">Efectos de Sonido</Label>
                            <p className="text-sm text-gray-600">Sonidos de interacción y feedback</p>
                          </div>
                          <Switch
                            checked={settings.soundEffects}
                            onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="notificationSounds">Sonidos de Notificación</Label>
                            <p className="text-sm text-gray-600">Alertas sonoras para notificaciones</p>
                          </div>
                          <Switch
                            checked={settings.notificationSounds}
                            onCheckedChange={(checked) => handleSettingChange('notificationSounds', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="backgroundMusic">Música de Fondo</Label>
                            <p className="text-sm text-gray-600">Música ambiental durante el aprendizaje</p>
                          </div>
                          <Switch
                            checked={settings.backgroundMusic}
                            onCheckedChange={(checked) => handleSettingChange('backgroundMusic', checked)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="volume">Volumen General ({settings.volume}%)</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.volume}
                            onChange={(e) => handleSettingChange('volume', parseInt(e.target.value))}
                            className="w-full mt-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Mail className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Notificaciones por Email</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                            <p className="text-sm text-gray-600">Recibir notificaciones importantes por email</p>
                          </div>
                          <Switch
                            checked={settings.emailNotifications}
                            onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="courseReminders">Recordatorios de Cursos</Label>
                            <p className="text-sm text-gray-600">Recordatorios sobre cursos pendientes</p>
                          </div>
                          <Switch
                            checked={settings.courseReminders}
                            onCheckedChange={(checked) => handleSettingChange('courseReminders', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="achievementNotifications">Notificaciones de Logros</Label>
                            <p className="text-sm text-gray-600">Alertas cuando desbloquees nuevos logros</p>
                          </div>
                          <Switch
                            checked={settings.achievementNotifications}
                            onCheckedChange={(checked) => handleSettingChange('achievementNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="weeklyDigest">Resumen Semanal</Label>
                            <p className="text-sm text-gray-600">Resumen de tu progreso cada semana</p>
                          </div>
                          <Switch
                            checked={settings.weeklyDigest}
                            onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="marketingEmails">Emails de Marketing</Label>
                            <p className="text-sm text-gray-600">Promociones y nuevos cursos</p>
                          </div>
                          <Switch
                            checked={settings.marketingEmails}
                            onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <MessageCircle className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Notificaciones Push</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="pushNotifications">Notificaciones Push</Label>
                            <p className="text-sm text-gray-600">Notificaciones en tiempo real en tu dispositivo</p>
                          </div>
                          <Switch
                            checked={settings.pushNotifications}
                            onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="communityUpdates">Actualizaciones de Comunidad</Label>
                            <p className="text-sm text-gray-600">Nuevos posts y discusiones en la comunidad</p>
                          </div>
                          <Switch
                            checked={settings.communityUpdates}
                            onCheckedChange={(checked) => handleSettingChange('communityUpdates', checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Eye className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Visibilidad del Perfil</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="profileVisibility">Visibilidad del Perfil</Label>
                          <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange('profileVisibility', value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Público - Visible para todos</SelectItem>
                              <SelectItem value="community">Comunidad - Solo miembros de ANIUET</SelectItem>
                              <SelectItem value="private">Privado - Solo yo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="showProgress">Mostrar Progreso</Label>
                            <p className="text-sm text-gray-600">Permite que otros vean tu progreso en cursos</p>
                          </div>
                          <Switch
                            checked={settings.showProgress}
                            onCheckedChange={(checked) => handleSettingChange('showProgress', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="showAchievements">Mostrar Logros</Label>
                            <p className="text-sm text-gray-600">Permite que otros vean tus logros</p>
                          </div>
                          <Switch
                            checked={settings.showAchievements}
                            onCheckedChange={(checked) => handleSettingChange('showAchievements', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="showActivity">Mostrar Actividad</Label>
                            <p className="text-sm text-gray-600">Permite que otros vean tu actividad reciente</p>
                          </div>
                          <Switch
                            checked={settings.showActivity}
                            onCheckedChange={(checked) => handleSettingChange('showActivity', checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Database className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Datos y Privacidad</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowDataCollection">Recopilación de Datos</Label>
                            <p className="text-sm text-gray-600">Permite la recopilación de datos para mejorar la experiencia</p>
                          </div>
                          <Switch
                            checked={settings.allowDataCollection}
                            onCheckedChange={(checked) => handleSettingChange('allowDataCollection', checked)}
                          />
                        </div>

                        <div className="pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={handleExportData}
                            className="w-full justify-start"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Mis Datos
                          </Button>
                          <p className="text-sm text-gray-600 mt-2">
                            Descarga una copia de todos tus datos almacenados en ANIUET Scholar
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}

              {/* Account Settings */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Lock className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Seguridad de la Cuenta</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Cambiar Contraseña</Label>
                          <div className="space-y-3 mt-2">
                            <Input
                              type="password"
                              placeholder="Contraseña actual"
                            />
                            <Input
                              type="password"
                              placeholder="Nueva contraseña"
                            />
                            <Input
                              type="password"
                              placeholder="Confirmar nueva contraseña"
                            />
                            <Button style={{ backgroundColor: getRoleColor() }}>
                              Actualizar Contraseña
                            </Button>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-2">Autenticación de Dos Factores</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Agrega una capa extra de seguridad a tu cuenta
                          </p>
                          <Button variant="outline">
                            Configurar 2FA
                          </Button>
                        </div>

                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-2">Sesiones Activas</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Administra los dispositivos donde has iniciado sesión
                          </p>
                          <Button variant="outline">
                            Ver Sesiones Activas
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-white/90">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <HelpCircle className="w-5 h-5" style={{ color: getRoleColor() }} />
                          <span>Soporte y Ayuda</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contactar Soporte
                        </Button>

                        <Button variant="outline" className="w-full justify-start">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Centro de Ayuda
                        </Button>

                        <Button variant="outline" className="w-full justify-start">
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar Feedback
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-red-50 border-red-200">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-red-800">
                          <AlertTriangle className="w-5 h-5" />
                          <span>Zona de Peligro</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-red-800 mb-2">Cerrar Sesión en Todos los Dispositivos</h4>
                          <p className="text-sm text-red-700 mb-3">
                            Cierra la sesión en todos los dispositivos conectados
                          </p>
                          <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                            Cerrar Todas las Sesiones
                          </Button>
                        </div>

                        <div className="pt-4 border-t border-red-200">
                          <h4 className="font-semibold text-red-800 mb-2">Eliminar Cuenta</h4>
                          <p className="text-sm text-red-700 mb-3">
                            Esta acción es permanente y no se puede deshacer
                          </p>
                          <Button 
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar Cuenta
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}