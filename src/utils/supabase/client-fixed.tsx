/**
 * Supabase Client - Cliente y helpers para autenticación y API
 * 
 * Este módulo proporciona:
 * 1. Cliente de Supabase configurado y listo para usar
 * 2. authHelpers: Funciones de autenticación (registro, login, recuperación de contraseña)
 * 3. apiHelpers: Funciones para interactuar con el backend (cursos, perfil, comunidad)
 * 
 * Arquitectura:
 * Frontend (este archivo) -> Server (Hono Edge Function) -> Database (KV Store + Supabase Auth)
 * 
 * @module utils/supabase/client
 */
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

/** Cliente de Supabase configurado con las credenciales del proyecto */
export const supabase = createClient(supabaseUrl, publicAnonKey);

/**
 * authHelpers - Funciones de autenticación
 * 
 * Incluye métodos para:
 * - Registro de usuarios (signUp)
 * - Inicio de sesión (signIn)
 * - Cierre de sesión (signOut)
 * - Obtener sesión actual (getSession)
 * - Obtener usuario actual (getCurrentUser)
 * - Recuperación de contraseña (requestPasswordReset, updatePassword)
 * - Confirmación de email (confirmUser, forceConfirmUser)
 */
export const authHelpers = {
  /**
   * Registra un nuevo usuario en el sistema
   * 
   * Utiliza el endpoint register-with-login que:
   * 1. Crea el usuario en Supabase Auth
   * 2. Almacena datos adicionales en KV store
   * 3. Intenta hacer login automático
   * 
   * @param {string} email - Correo electrónico del usuario
   * @param {string} password - Contraseña (mínimo 6 caracteres)
   * @param {object} userData - Datos adicionales del usuario (name, role, aiExperience, etc.)
   * @returns {Promise<{data: object|null, error: Error|null}>} Usuario, sesión y datos adicionales
   * 
   * @example
   * const { data, error } = await authHelpers.signUp(
   *   'user@example.com',
   *   'securePass123',
   *   { name: 'Juan', role: 'student', aiExperience: 'beginner' }
   * );
   */
  signUp: async (email: string, password: string, userData: any) => {
    try {
      // Usar el endpoint register-with-login para mejor manejo
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/register-with-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          ...userData
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle different error cases based on status code
        if (response.status === 409) {
          // User already exists
          const error = new Error(result.message || result.error || 'Ya existe una cuenta con este correo electrónico');
          error.code = 'user_already_exists';
          error.action = result.action;
          throw error;
        } else if (response.status === 400) {
          // Validation error
          throw new Error(result.error || 'Datos de registro inválidos');
        } else {
          // Other server errors
          throw new Error(result.error || 'Error del servidor durante el registro');
        }
      }
      
      // If the backend provided session data, use it
      if (result.session && result.user) {
        return { 
          data: { 
            user: result.user, 
            session: result.session,
            userData: result.userData 
          }, 
          error: null 
        };
      }
      
      // Otherwise, try to sign in manually
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Auto-login after registration failed:', error);
        // Return partial success - user was created but couldn't auto-login
        return { 
          data: { 
            user: result.user, 
            session: null,
            userData: result.userData 
          }, 
          error: null 
        };
      }

      return { 
        data: { 
          ...data, 
          userData: result.userData 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  /**
   * Inicia sesión con email y contraseña
   * 
   * Manejo especial de errores:
   * - Email no confirmado: Intenta confirmación automática y reintenta login
   * - Credenciales incorrectas: Mensaje claro para el usuario
   * - Errores de red: Mensaje específico
   * 
   * @param {string} email - Correo electrónico del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<{data: object|null, error: Error|null}>} Sesión y datos del usuario
   * 
   * @example
   * const { data, error } = await authHelpers.signIn('user@example.com', 'password123');
   * if (data?.session) {
   *   console.log('Logged in:', data.user.email);
   * }
   */
  signIn: async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase sign in error:', error);
        
        // Special handling for admin user - auto-create if doesn't exist
        if (email.toLowerCase() === 'admin@aniuet.com' && 
            (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid password'))) {
          console.log('🔧 Admin login failed, attempting to create admin user...');
          console.log('🔧 Using project ID:', projectId);
          console.log('🔧 Endpoint:', `https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/create-admin-dev`);
          
          try {
            const createAdminUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/create-admin-dev`;
            console.log('🔧 Calling create admin endpoint...');
            
            const createAdminResponse = await fetch(createAdminUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            });
            
            console.log('🔧 Response status:', createAdminResponse.status);
            console.log('🔧 Response ok:', createAdminResponse.ok);
            
            const createResult = await createAdminResponse.json();
            console.log('🔧 Admin creation result:', createResult);
            
            if (createAdminResponse.ok && createResult.success) {
              console.log('✅ Admin user created/verified successfully!');
              
              // If the endpoint returned a valid session, use it directly!
              if (createResult.session && createResult.user) {
                console.log('✅ Using session from admin creation endpoint');
                return { 
                  data: { 
                    session: createResult.session, 
                    user: createResult.user 
                  }, 
                  error: null 
                };
              }
              console.log('⏳ Waiting 5 seconds for user propagation...');
              
              // Wait longer for the user to be fully created and propagated
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Retry login up to 5 times with increasing delays
              for (let attempt = 1; attempt <= 5; attempt++) {
                console.log(`🔑 Admin login attempt ${attempt}/5...`);
                
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                
                if (!retryError && retryData?.session) {
                  console.log('✅ Admin login successful after creation!');
                  return { data: retryData, error: null };
                } else if (retryError) {
                  console.log(`❌ Admin login attempt ${attempt} failed:`, retryError.message);
                  if (attempt < 5) {
                    const waitTime = 2000 * attempt;
                    console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                  }
                }
              }
              
              console.error('❌ All admin login attempts failed after creation');
              console.error('💡 Suggestion: Wait 30 seconds and try logging in again');
            } else {
              console.error('❌ Admin creation endpoint failed:', createResult);
              console.error('💡 Check the server logs for more details');
            }
          } catch (adminCreateError) {
            console.error('❌ Exception during admin auto-create:', adminCreateError);
            console.error('💡 This might be a network error or server issue');
          }
        }
        
        // Handle specific error cases
        if (error.message?.includes('Email not confirmed')) {
          console.log('Email not confirmed, attempting automatic confirmation...');
          
          // Try automatic force confirmation directly
          try {
            const forceResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/auth/force-confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({ email }),
            });
            
            if (forceResponse.ok) {
              console.log('Automatic confirmation successful, retrying login...');
              
              // Wait a moment and retry login
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (!retryError && retryData?.session) {
                console.log('Login successful after automatic confirmation');
                return { data: retryData, error: null };
              } else {
                console.log('Login still failed after confirmation:', retryError);
              }
            }
          } catch (autoConfirmError) {
            console.log('Automatic confirmation failed:', autoConfirmError);
          }
          
          // If automatic confirmation didn't work, show user options
          const confirmError = new Error('Tu email no está confirmado. Puedes usar la opción "Confirmar Email" o recuperar tu contraseña.');
          confirmError.code = 'email_not_confirmed';
          confirmError.email = email; // Store email for confirmation attempts
          throw confirmError;
        }
        
        // Re-throw the original error with better context
        const enhancedError = new Error(error.message);
        enhancedError.code = error.code || 'auth_error';
        enhancedError.status = error.status;
        throw enhancedError;
      }

      if (!data.session || !data.user) {
        throw new Error('No session or user data received from authentication');
      }

      console.log('Sign in successful for user:', data.user.id);
      return { data, error: null };
      
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Si no hay sesión activa, eso significa que ya estamos deslogueados
        // No es un error real, es el estado deseado
        if (error.message?.includes('Auth session missing') || 
            error.message?.includes('session_missing')) {
          console.log('No active session to sign out from - already logged out');
          return { error: null };
        }
        throw error;
      }
      return { error: null };
    } catch (error) {
      // Verificar si es el error de sesión faltante
      if (error.message?.includes('Auth session missing') || 
          error.message?.includes('session_missing')) {
        console.log('No active session to sign out from - already logged out');
        return { error: null };
      }
      console.error('Sign out error:', error);
      return { error };
    }
  },

  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Handle invalid refresh token error
      if (error) {
        console.log('Session retrieval error:', error.message);
        
        // If the refresh token is invalid, clear the session
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('refresh_token_not_found')) {
          console.log('Invalid refresh token detected, clearing session...');
          // Clear the invalid session from storage
          await supabase.auth.signOut();
          return { session: null, error };
        }
        
        throw error;
      }
      
      return { session, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      
      // Additional safety check for refresh token errors
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('refresh_token_not_found')) {
        console.log('Clearing invalid session from storage...');
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Error during cleanup sign out:', signOutError);
        }
      }
      
      return { session: null, error };
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error };
    }
  },

  /**
   * Solicita recuperación de contraseña enviando un token al email del usuario
   * 
   * Este método llama al endpoint del backend que genera un token de recuperación
   * único y lo almacena en la base de datos. El token expira en 1 hora.
   * 
   * En producción, debería enviar un email con el enlace de recuperación.
   * En desarrollo, retorna el token directamente para facilitar testing.
   * 
   * @param {string} email - Correo electrónico del usuario
   * @returns {Promise<{data: object|null, error: Error|null}>} Token y enlace de recuperación
   * 
   * @example
   * const { data, error } = await authHelpers.requestPasswordReset('user@example.com');
   * if (data) {
   *   console.log('Token:', data.resetToken); // Solo en desarrollo
   * }
   */
  requestPasswordReset: async (email: string) => {
    try {
      console.log('Requesting password reset for:', email);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        const error = new Error(result.error || 'Error al solicitar recuperación de contraseña');
        error.status = response.status;
        throw error;
      }

      console.log('Password reset request successful');
      return { data: result, error: null };
      
    } catch (error) {
      console.error('Password reset request error:', error);
      
      // Mejorar mensaje de error para problemas de red
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      return { data: null, error };
    }
  },

  /**
   * Actualiza la contraseña del usuario usando un token de recuperación
   * 
   * Este método valida el token de recuperación en el backend y actualiza
   * la contraseña del usuario usando Supabase Auth Admin API.
   * 
   * Validaciones del backend:
   * - Token debe existir y coincidir
   * - Token no debe estar expirado (1 hora de validez)
   * - Token no debe haber sido usado previamente
   * - Contraseña debe tener al menos 6 caracteres
   * 
   * @param {string} email - Correo electrónico del usuario
   * @param {string} newPassword - Nueva contraseña (mínimo 6 caracteres)
   * @param {string} resetToken - Token de recuperación recibido
   * @returns {Promise<{data: object|null, error: Error|null}>} Confirmación de actualización
   * 
   * @example
   * const { data, error } = await authHelpers.updatePassword(
   *   'user@example.com',
   *   'newSecurePass123',
   *   'reset_1234567890_abc123'
   * );
   */
  updatePassword: async (email: string, newPassword: string, resetToken: string) => {
    try {
      console.log('Updating password for:', email);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, newPassword, resetToken }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        const error = new Error(result.error || 'Error al actualizar contraseña');
        error.status = response.status;
        error.details = result;
        throw error;
      }

      console.log('Password updated successfully');
      return { data: result, error: null };
      
    } catch (error) {
      console.error('Password update error:', error);
      
      // Mejorar mensaje de error para problemas de red
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      return { data: null, error };
    }
  },

  confirmUser: async (email: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/auth/confirm-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar usuario');
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('User confirmation error:', error);
      return { data: null, error };
    }
  },

  forceConfirmUser: async (email: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/auth/force-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al confirmar usuario forzosamente');
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Force user confirmation error:', error);
      return { data: null, error };
    }
  }
};

// API helper functions
export const apiHelpers = {
  getUserProfile: async (accessToken: string) => {
    try {
      console.log('Fetching user profile with token:', accessToken ? 'Token present' : 'No token');
      
      if (!accessToken) {
        throw new Error('No access token provided for user profile request');
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/user/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile request response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to fetch user profile';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('Profile request error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        // Enhanced error messages based on status code
        if (response.status === 401) {
          errorMessage = 'Authentication failed - please log in again';
        } else if (response.status === 404) {
          errorMessage = 'User profile not found';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred while fetching profile';
        } else if (response.status === 503) {
          errorMessage = 'Service temporarily unavailable';
        }
        
        throw new Error(errorMessage);
      }

      const profileData = await response.json();
      console.log('Profile data received successfully');
      return profileData;
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Enhance error with more context
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - could not connect to server');
      } else if (error.message?.includes('JSON')) {
        throw new Error('Invalid server response format');
      }
      
      throw error;
    }
  },

  enrollInCourse: async (accessToken: string, courseId: string) => {
    try {
      console.log('Enrolling in course:', courseId, 'with token:', accessToken ? 'present' : 'missing');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/courses/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const responseData = await response.json();
      console.log('Enrollment response:', response.status, responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to enroll';
        console.error('Enrollment failed:', errorMessage);
        
        // Create enhanced error with status code
        const error = new Error(errorMessage);
        error.status = response.status;
        error.isAlreadyEnrolled = responseData.isAlreadyEnrolled;
        throw error;
      }

      console.log('Enrollment successful:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      
      // Enhance network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  getUserCourses: async (accessToken: string) => {
    try {
      console.log('Fetching user courses with token:', accessToken ? 'present' : 'missing');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/user/courses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();
      console.log('User courses response:', response.status, responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to fetch user courses';
        console.error('Failed to fetch user courses:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('User courses fetched successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error fetching user courses:', error);
      
      // Enhance network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  updateCourseProgress: async (accessToken: string, courseId: string, lessonId: string, xpGained: number) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/courses/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ courseId, lessonId, xpGained }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  },

  getAvailableCourses: async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/courses`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  getTeacherDashboard: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/dashboard`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teacher dashboard');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teacher dashboard:', error);
      throw error;
    }
  },

  createCourse: async (accessToken: string, courseData: any) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  checkUserExists: async (email: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to check user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking user:', error);
      throw error;
    }
  },

  getPasswordResetLink: async (email: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/auth/reset-link/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener enlace de recuperación');
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Error getting reset link:', error);
      return { data: null, error };
    }
  },

  // Test function to check server connectivity and profile endpoint
  testProfileEndpoint: async (accessToken: string) => {
    try {
      console.log('Testing profile endpoint connectivity...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/test/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Profile endpoint test result:', result);
      
      return { data: result, error: null };
    } catch (error) {
      console.error('Profile endpoint test failed:', error);
      return { data: null, error };
    }
  },

  // Student Management Functions for Teachers
  getTeacherStudents: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/students`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch students');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teacher students:', error);
      throw error;
    }
  },

  addStudentToClass: async (accessToken: string, studentEmail: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/students/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ studentEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add student');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding student to class:', error);
      throw error;
    }
  },

  enrollStudentInCourse: async (accessToken: string, studentId: string, courseId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/students/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ studentId, courseId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll student');
      }

      return await response.json();
    } catch (error) {
      console.error('Error enrolling student in course:', error);
      throw error;
    }
  },

  getCourseProgress: async (accessToken: string, courseId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/courses/${courseId}/progress`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch course progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course progress:', error);
      throw error;
    }
  },

  generateInviteCode: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/teacher/invite/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invite code');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating invite code:', error);
      throw error;
    }
  },

  joinClassWithCode: async (accessToken: string, inviteCode: string) => {
    try {
      // First ensure mock courses are initialized
      console.log('🚀 Initializing mock courses before joining...');
      await apiHelpers.initMockCourses();
      console.log('✅ Mock courses initialized');
      
      console.log(`🔍 Attempting to join with code: ${inviteCode}`);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/student/join-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ inviteCode }),
      });

      const responseData = await response.json();
      console.log('📊 Join response:', response.status, responseData);

      if (!response.ok) {
        console.error('❌ Join failed:', responseData);
        throw new Error(responseData.error || 'Failed to join class');
      }

      console.log('✅ Successfully joined class');
      return responseData;
    } catch (error) {
      console.error('Error joining class with code:', error);
      throw error;
    }
  },

  initMockCourses: async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/init-mock-courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize mock courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error initializing mock courses:', error);
      throw error;
    }
  },

  getAvailableCourseCodes: async () => {
    try {
      // First ensure mock courses are initialized
      await apiHelpers.initMockCourses();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/available-course-codes`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course codes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course codes:', error);
      throw error;
    }
  },

  // Alias function for backward compatibility
  getCourses: async () => {
    return await apiHelpers.getAvailableCourses();
  },

  // =============================================================================
  // COMMUNITY API FUNCTIONS
  // =============================================================================

  // Create a new community post
  createCommunityPost: async (accessToken: string, content: string, tags?: string[], type?: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content, tags, type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating community post:', error);
      throw error;
    }
  },

  // Get community feed posts
  getCommunityPosts: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/posts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch community posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw error;
    }
  },

  // Like/Unlike a post
  togglePostLike: async (accessToken: string, postId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle post like');
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  },

  // Add comment to a post
  addCommentToPost: async (accessToken: string, postId: string, content: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding comment to post:', error);
      throw error;
    }
  },

  // Like/Unlike a comment
  toggleCommentLike: async (accessToken: string, postId: string, commentId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle comment like');
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  },

  // Create a new discussion
  createDiscussion: async (accessToken: string, title: string, content: string, category?: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title, content, category }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create discussion');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw error;
    }
  },

  // Get community discussions
  getCommunityDiscussions: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/discussions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch discussions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching community discussions:', error);
      throw error;
    }
  },

  // Get community statistics
  getCommunityStats: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch community stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching community stats:', error);
      throw error;
    }
  },

  // Get trending topics
  getTrendingTopics: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/community/trending`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch trending topics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      throw error;
    }
  },

  // ============================================
  // GOALS API HELPERS - Sistema de Objetivos
  // ============================================

  /**
   * Get user's goals
   * Obtiene todos los objetivos del usuario con progreso actualizado en tiempo real
   */
  getUserGoals: async (accessToken: string) => {
    try {
      console.log('Fetching user goals...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/goals`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch goals');
      }

      const result = await response.json();
      console.log('Goals fetched successfully:', result.goals?.length || 0);
      return result;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      
      // Enhance network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  /**
   * Create a new goal
   * Crea un nuevo objetivo para el usuario
   */
  createGoal: async (accessToken: string, goalData: any) => {
    try {
      console.log('Creating new goal:', goalData.title);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(goalData),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to create goal';
        console.error('Failed to create goal:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Goal created successfully:', result.goal?.id);
      return result;
    } catch (error) {
      console.error('Error creating goal:', error);
      
      // Enhance network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  /**
   * Update goal progress
   * Actualiza el progreso de un objetivo y verifica si se completó
   */
  updateGoalProgress: async (accessToken: string, goalId: string, newValue: number) => {
    try {
      console.log('Updating goal progress:', goalId, 'to', newValue);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/goals/${goalId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to update goal progress';
        console.error('Failed to update goal progress:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Goal progress updated:', result.goalCompleted ? 'COMPLETED!' : 'In progress');
      return result;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      
      // Enhance network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  /**
   * Delete a goal
   * Elimina un objetivo del usuario
   */
  deleteGoal: async (accessToken: string, goalId: string) => {
    try {
      console.log('Deleting goal:', goalId);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to delete goal';
        console.error('Failed to delete goal:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Goal deleted successfully');
      return result;
    } catch (error) {
      console.error('Error deleting goal:', error);
      
      // Enhance network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  // ============================================
  // DIRECT MESSAGES API HELPERS - Sistema de Mensajes Directos
  // ============================================

  /**
   * Get user's conversations
   * Obtiene todas las conversaciones del usuario
   */
  getConversations: async (accessToken: string) => {
    try {
      console.log('Fetching user conversations...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch conversations');
      }

      const result = await response.json();
      console.log('Conversations loaded:', result.conversations?.length || 0);
      return result;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  /**
   * Get messages from a conversation
   * Obtiene mensajes de una conversación específica
   */
  getConversationMessages: async (accessToken: string, conversationId: string) => {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/messages/conversation/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }

      const result = await response.json();
      console.log('Messages loaded:', result.messages?.length || 0);
      return result;
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  /**
   * Send a direct message
   * Envía un mensaje directo a otro usuario
   */
  sendDirectMessage: async (accessToken: string, recipientId: string, content: string) => {
    try {
      console.log('Sending message to:', recipientId);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ recipientId, content }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to send message';
        console.error('Failed to send message:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Message sent successfully');
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  /**
   * Search users to message
   * Busca usuarios para iniciar una conversación
   */
  searchUsersToMessage: async (accessToken: string, query: string) => {
    try {
      console.log('Searching users with query:', query);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/messages/search-users?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search users');
      }

      const result = await response.json();
      console.log('Users found:', result.users?.length || 0);
      return result;
    } catch (error) {
      console.error('Error searching users:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  /**
   * Get unread message count
   * Obtiene el conteo de mensajes no leídos
   */
  getUnreadMessageCount: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/messages/unread-count`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch unread count');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  updateUserProfile: async (accessToken: string, updates: any) => {
    try {
      console.log('Updating user profile with data:', updates);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log('Profile updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      throw error;
    }
  },

  // ============================================
  // ADMIN API HELPERS - Sistema de Administración
  // ============================================

  /**
   * Get all courses (admin only)
   */
  adminGetCourses: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin courses:', error);
      throw error;
    }
  },

  /**
   * Create or update a course (admin only)
   */
  adminSaveCourse: async (accessToken: string, courseData: any) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/admin/courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving course:', error);
      throw error;
    }
  },

  /**
   * Get a specific course (admin only)
   */
  adminGetCourse: async (accessToken: string, courseId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/admin/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin course:', error);
      throw error;
    }
  },

  /**
   * Create or update a lesson (admin only)
   */
  adminSaveLesson: async (accessToken: string, courseId: string, lessonData: any) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/admin/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save lesson');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving lesson:', error);
      throw error;
    }
  },

  /**
   * Get all users (admin only)
   */
  adminGetUsers: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/admin/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw error;
    }
  },

  /**
   * Get platform statistics (admin only)
   */
  adminGetStats: async (accessToken: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5ea56f4e/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }
};
