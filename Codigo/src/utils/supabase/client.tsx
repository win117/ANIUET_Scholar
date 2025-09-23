import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// Auth helper functions
export const authHelpers = {
  signUp: async (email: string, password: string, userData: any) => {
    try {
      // Use the register-with-login endpoint for better handling
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

  signIn: async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase sign in error:', error);
        
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
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      console.error('Get session error:', error);
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
      
      // Enhance error with more context
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      }
      
      return { data: null, error };
    }
  },

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
      
      // Enhance error with more context
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
  }
};