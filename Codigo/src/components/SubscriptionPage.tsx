import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";
import { DynamicBackground } from "./DynamicBackground";
import { apiHelpers } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { 
  ArrowLeft, 
  Check, 
  Crown, 
  Zap, 
  Star,
  Shield,
  Rocket,
  Sparkles,
  CreditCard,
  Clock,
  Users,
  BookOpen,
  Award,
  TrendingUp
} from "lucide-react";

interface SubscriptionPageProps {
  onBack: () => void;
  role: 'student' | 'teacher' | 'professional' | 'admin';
  session?: any;
  userProfile?: any;
}

type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: SubscriptionTier;
  name: string;
  price: number;
  period: 'month' | 'year';
  icon: any;
  color: string;
  badge?: string;
  features: PlanFeature[];
  popular?: boolean;
}

export function SubscriptionPage({ onBack, role, session, userProfile }: SubscriptionPageProps) {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadSubscriptionData();
  }, [session]);

  const loadSubscriptionData = async () => {
    if (!session?.access_token) return;

    try {
      const result = await apiHelpers.getUserProfile(session.access_token);
      if (result.success && result.data) {
        setCurrentTier(result.data.subscription_tier || 'free');
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const getPlans = (): Plan[] => {
    const yearlyDiscount = 0.2; // 20% de descuento anual

    const basePlans: Plan[] = [
      {
        id: 'free',
        name: 'Básico',
        price: 0,
        period: 'month',
        icon: BookOpen,
        color: 'bg-gray-500',
        features: [
          { text: 'Cursos básicos gratuitos', included: true },
          { text: 'Acceso a comunidad limitado', included: true },
          { text: 'Asistente IA básico (10 consultas/mes)', included: true },
          { text: 'Certificados digitales', included: false },
          { text: 'Cursos avanzados premium', included: false },
          { text: 'Soporte prioritario', included: false },
          { text: 'Contenido exclusivo', included: false }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: billingPeriod === 'monthly' ? 60 : 60 * 12 * (1 - yearlyDiscount),
        period: billingPeriod === 'monthly' ? 'month' : 'year',
        icon: Crown,
        color: 'bg-[#E3701B]',
        badge: 'Más Popular',
        popular: true,
        features: [
          { text: 'Todos los cursos disponibles', included: true },
          { text: 'Acceso completo a comunidad', included: true },
          { text: 'Asistente IA avanzado (ilimitado)', included: true },
          { text: 'Certificados digitales verificados', included: true },
          { text: 'Contenido exclusivo mensual', included: true },
          { text: 'Soporte prioritario', included: true },
          { text: 'Sesiones 1-a-1 con expertos', included: true },
          { text: 'Proyectos prácticos guiados', included: true },
          { text: role === 'teacher' ? 'Gestión ilimitada de alumnos' : 'Análisis personalizado', included: true }
        ]
      }
    ];

    // Agregar plan Enterprise solo para profesionales y maestros
    if (role === 'teacher' || role === 'professional') {
      basePlans.push({
        id: 'enterprise',
        name: 'Instituciones/Empresas',
        price: 0, // Precio personalizado
        period: 'month',
        icon: Shield,
        color: 'bg-[#4285F4]',
        badge: 'Contactar',
        features: [
          { text: 'Todo lo de Pro', included: true },
          { text: 'Soluciones personalizadas', included: true },
          { text: 'Usuarios ilimitados', included: true },
          { text: 'API dedicada', included: true },
          { text: 'Soporte 24/7 dedicado', included: true },
          { text: 'Integración con LMS', included: true },
          { text: 'Análisis y reportes avanzados', included: true },
          { text: 'White-label disponible', included: true },
          { text: 'Capacitación personalizada', included: true }
        ]
      });
    }

    return basePlans;
  };

  const handleSubscribe = async (planId: SubscriptionTier) => {
    if (!session?.access_token) {
      toast.error('Debes iniciar sesión para suscribirte');
      return;
    }

    if (planId === 'enterprise') {
      toast.info('Contactando con ventas...', {
        description: 'Un representante se pondrá en contacto contigo pronto.'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Aquí iría la integración con pasarela de pago (Stripe, MercadoPago, etc.)
      // Por ahora simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await apiHelpers.updateUserProfile(
        session.access_token,
        { subscription_tier: planId }
      );

      if (result.success) {
        setCurrentTier(planId);
        toast.success('¡Suscripción actualizada!', {
          description: `Ahora tienes acceso al plan ${planId.toUpperCase()}`
        });
      } else {
        throw new Error(result.error || 'Error al actualizar suscripción');
      }
    } catch (error: any) {
      console.error('Error al procesar suscripción:', error);
      toast.error('Error al procesar el pago', {
        description: error.message || 'Intenta nuevamente más tarde'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const plans = getPlans();

  const roleColors = {
    student: '#E3701B',
    teacher: '#4285F4',
    professional: '#C4423D',
    admin: '#9333EA'
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DynamicBackground role={role} />
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-black text-3xl mb-2">Planes y Suscripciones</h1>
            <p className="text-white/70">
              Desbloquea todo el potencial de ANIUET Scholar
            </p>
          </div>

          {currentTier !== 'free' && (
            <Badge 
              className="text-white px-4 py-2 text-sm"
              style={{ backgroundColor: roleColors[role] }}
            >
              <Crown className="h-4 w-4 mr-2" />
              Plan {currentTier.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-full p-1 inline-flex">
            <Button
              variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
              onClick={() => setBillingPeriod('monthly')}
              className={billingPeriod === 'monthly' ? 'rounded-full' : 'text-white hover:bg-white/10 rounded-full'}
            >
              Mensual
            </Button>
            <Button
              variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
              onClick={() => setBillingPeriod('yearly')}
              className={billingPeriod === 'yearly' ? 'rounded-full' : 'text-white hover:bg-white/10 rounded-full'}
            >
              Anual
              <Badge className="ml-2 bg-green-500">-20%</Badge>
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className={`grid gap-6 mb-8 ${plans.length === 3 ? 'md:grid-cols-3' : plans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentTier === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                    plan.popular ? 'border-2 border-[#E3701B] shadow-lg' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {plan.badge && (
                    <div className={`absolute top-0 right-0 ${plan.color} text-white px-4 py-1 text-xs rounded-bl-lg`}>
                      {plan.badge}
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 text-xs rounded-br-lg">
                      Plan Actual
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-3xl mt-2">
                      {plan.id === 'enterprise' ? (
                        <span className="text-gray-600">Personalizado</span>
                      ) : (
                        <>
                          <span className="text-gray-900">
                            ${plan.price.toLocaleString('es-MX')}
                          </span>
                          <span className="text-sm text-gray-500">
                            MXN/{plan.period === 'month' ? 'mes' : 'año'}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className={`mt-0.5 ${feature.included ? 'text-green-500' : 'text-gray-300'}`}>
                            <Check className="h-4 w-4" />
                          </div>
                          <span className={feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      style={{ 
                        backgroundColor: isCurrentPlan ? '#10b981' : roleColors[role]
                      }}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading || isCurrentPlan}
                    >
                      {isLoading ? (
                        'Procesando...'
                      ) : isCurrentPlan ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Plan Actual
                        </>
                      ) : plan.id === 'enterprise' ? (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Contactar Ventas
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          {plan.id === 'free' ? 'Plan Actual' : 'Suscribirse'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/90 backdrop-blur-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E3701B] rounded-lg flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Pago Seguro</CardTitle>
                <CardDescription>
                  Procesamiento seguro con encriptación SSL. Tus datos están protegidos.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/90 backdrop-blur-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-[#4285F4] rounded-lg flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Cancela cuando quieras</CardTitle>
                <CardDescription>
                  Sin compromisos a largo plazo. Cancela tu suscripción en cualquier momento.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/90 backdrop-blur-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-[#C4423D] rounded-lg flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Actualización Instantánea</CardTitle>
                <CardDescription>
                  Accede a todas las funciones premium inmediatamente después del pago.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <Card className="mt-12 bg-white/90 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
              <p className="text-gray-600 text-sm">
                Sí, puedes actualizar tu plan en cualquier momento. Los cambios se reflejarán inmediatamente y tendrás acceso a todo el contenido.
              </p>
            </div>
            <div>
              <h3 className="mb-2">¿Qué métodos de pago aceptan?</h3>
              <p className="text-gray-600 text-sm">
                Aceptamos tarjetas de crédito/débito y PayPal.
              </p>
            </div>
            <div>
              <h3 className="mb-2">¿Ofrecen planes para instituciones educativas y empresas?</h3>
              <p className="text-gray-600 text-sm">
                Sí, ofrecemos soluciones personalizadas con usuarios ilimitados, integración con LMS, API dedicada y soporte 24/7. Contacta a nuestro equipo de ventas para una cotización personalizada contacto@aniuet.com.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
