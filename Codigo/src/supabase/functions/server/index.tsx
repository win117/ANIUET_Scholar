import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Inicializar Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS para permitir todas las rutas y metodos para la interaccion con las apis y el servidor
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Funcion de ayuda para la autenticacion de usuario 
async function authenticateUser(accessToken: string) {
  if (!accessToken) {
    console.log("No access token provided to authenticateUser");
    return null;
  }
  
  try {
    console.log("Attempting to authenticate user with Supabase");
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      console.log("Supabase auth error:", error.message);
      return null;
    }
    
    if (!user) {
      console.log("No user returned from Supabase auth");
      return null;
    }
    
    console.log("User authenticated successfully:", user.id);
    return user;
    
  } catch (error) {
    console.error("Error in authenticateUser:", error);
    return null;
  }
}

// Health check endpoint
app.get("/make-server-5ea56f4e/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Registrar al usuario con el endpoint auto-login 
app.post("/make-server-5ea56f4e/register-with-login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role, aiExperience, ...additionalData } = body;

    console.log("Registration with auto-login attempt for user:", email);

    // Se validan los campos pertinentes
    if (!email || !password || !name || !role || !aiExperience) {
      return c.json({ error: "Todos los campos obligatorios deben ser completados" }, 400);
    }

    // Validación de calidad de contraseña
    if (password.length < 6) {
      return c.json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
    }

    // Revisar si existe el usuario
    const existingUsers = await kv.getByPrefix('user:');
    const existingUser = existingUsers.find(user => user.email?.toLowerCase() === email.toLowerCase());
    //Se librera un mensaje en caso de haber una cuenta ya registrada.
    if (existingUser) {
      console.log("User already exists in our system:", email);
      return c.json({ 
        error: "Ya existe una cuenta con este correo electrónico", 
        action: "redirect_to_login",
        message: "Este correo ya está registrado. Por favor, inicia sesión en su lugar."
      }, 409);
    }

    // Se crea el usuario en la supabase auth 
    const { data: createUserData, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        role,
        aiExperience,
        ...additionalData
      },
      email_confirm: true,
      email_confirmed_at: new Date().toISOString()
    });

    if (createUserError) {
      console.log("Supabase Auth error:", createUserError);
      return c.json({ error: "Error al crear la cuenta: " + createUserError.message }, 400);
    }

    // Se almaacena la información
    const userId = createUserData.user.id;
    const userData = {
      id: userId,
      email,
      name,
      role,
      aiExperience,
      ...additionalData,
      createdAt: new Date().toISOString(),
      enrolledCourses: [],
      completedCourses: [],
      xp: 0,
      level: 1,
      currentStreak: 0,
      dailyXP: 0
    };

    await kv.set(`user:${userId}`, userData);

    // Esta parte se usa para registrarse en la web
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !signInData?.session) {
      return c.json({ 
        success: true, 
        message: "Usuario registrado exitosamente. Por favor, inicia sesión manualmente.",
        user: createUserData.user,
        userData: userData,
        requiresManualLogin: true
      });
    }

    console.log("User registered and logged in successfully:", userId);
    return c.json({ 
      success: true, 
      message: "User registered and logged in successfully",
      user: signInData.user,
      session: signInData.session,
      userData: userData
    });

  } catch (error) {
    console.log("Registration error:", error);
    return c.json({ error: "Internal server error during registration: " + error }, 500);
  }
});

// Se optiene el usuario
app.get("/make-server-5ea56f4e/user/profile", async (c) => {
  try {
    console.log("Profile request received");
    
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];
    
    if (!accessToken) {
      console.log("No access token provided");
      return c.json({ error: "No access token provided" }, 401);
    }

    const user = await authenticateUser(accessToken);
    
    if (!user) {
      console.log("Authentication failed - invalid token");
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    // Se busca obtener los datos de usuario
    let userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      console.log("User not found in KV store, creating from Auth metadata");
      
      const authUserData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'student',
        aiExperience: user.user_metadata?.aiExperience || 'beginner',
        createdAt: user.created_at || new Date().toISOString(),
        enrolledCourses: [],
        completedCourses: [],
        xp: 0,
        level: 1,
        currentStreak: 0,
        dailyXP: 0,
        ...user.user_metadata
      };
      
      try {
        await kv.set(`user:${user.id}`, authUserData);
        userData = authUserData;
      } catch (kvError) {
        console.log("Error storing user profile in KV:", kvError);
        userData = authUserData;
      }
    }

    console.log("Returning user profile for:", user.id);
    return c.json({ user: userData });
    
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return c.json({ 
      error: "Internal server error", 
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get available courses
app.get("/make-server-5ea56f4e/courses", async (c) => {
  try {
    console.log("Fetching available courses");
    
    const courses = [
      {
        id: 'intro-ai',
        title: 'Fundamentos de IA',
        description: 'Conceptos básicos y aplicaciones de la inteligencia artificial',
        difficulty: 'beginner',
        duration: '4 semanas',
        lessons: [
          { id: 'intro-1', title: 'Introducción a la IA', type: 'reading', xp: 100 },
          { id: 'intro-2', title: 'Historia de la IA', type: 'reading', xp: 100 },
          { id: 'intro-3', title: 'Tipos de IA', type: 'practice', xp: 150 },
          { id: 'intro-4', title: 'Aplicaciones prácticas', type: 'project', xp: 200 }
        ]
      },
      {
        id: 'machine-learning',
        title: 'Machine Learning Básico',
        description: 'Introducción al aprendizaje automático y sus algoritmos',
        difficulty: 'intermediate',
        duration: '6 semanas',
        lessons: [
          { id: 'ml-1', title: 'Conceptos básicos de ML', type: 'reading', xp: 120 },
          { id: 'ml-2', title: 'Algoritmos supervisados', type: 'practice', xp: 180 },
          { id: 'ml-3', title: 'Algoritmos no supervisados', type: 'practice', xp: 180 },
          { id: 'ml-4', title: 'Proyecto final', type: 'project', xp: 250 }
        ]
      },
      {
        id: 'deep-learning',
        title: 'Deep Learning Avanzado',
        description: 'Redes neuronales profundas y arquitecturas modernas',
        difficulty: 'advanced',
        duration: '8 semanas',
        lessons: [
          { id: 'dl-1', title: 'Redes neuronales', type: 'reading', xp: 150 },
          { id: 'dl-2', title: 'CNN y RNN', type: 'practice', xp: 200 },
          { id: 'dl-3', title: 'Transformers', type: 'practice', xp: 250 },
          { id: 'dl-4', title: 'Proyecto avanzado', type: 'project', xp: 300 }
        ]
      },
      {
        id: 'ai-ethics',
        title: 'Ética en IA',
        description: 'Consideraciones éticas y responsables en el desarrollo de IA',
        difficulty: 'beginner',
        duration: '3 semanas',
        lessons: [
          { id: 'ethics-1', title: 'Principios éticos', type: 'reading', xp: 100 },
          { id: 'ethics-2', title: 'Sesgos en IA', type: 'reading', xp: 120 },
          { id: 'ethics-3', title: 'Caso de estudio', type: 'project', xp: 180 }
        ]
      },
      {
        id: 'nlp-fundamentals',
        title: 'Procesamiento de Lenguaje Natural',
        description: 'Técnicas para el procesamiento y comprensión del lenguaje',
        difficulty: 'intermediate',
        duration: '5 semanas',
        lessons: [
          { id: 'nlp-1', title: 'Introducción al NLP', type: 'reading', xp: 120 },
          { id: 'nlp-2', title: 'Tokenización y preprocesamiento', type: 'practice', xp: 160 },
          { id: 'nlp-3', title: 'Modelos de lenguaje', type: 'practice', xp: 180 },
          { id: 'nlp-4', title: 'Aplicación práctica', type: 'project', xp: 220 }
        ]
      },
      {
        id: 'computer-vision',
        title: 'Visión por Computadora',
        description: 'Procesamiento y análisis de imágenes con IA',
        difficulty: 'advanced',
        duration: '7 semanas',
        lessons: [
          { id: 'cv-1', title: 'Fundamentos de visión', type: 'reading', xp: 140 },
          { id: 'cv-2', title: 'Detección de objetos', type: 'practice', xp: 190 },
          { id: 'cv-3', title: 'Segmentación de imágenes', type: 'practice', xp: 210 },
          { id: 'cv-4', title: 'Proyecto de visión', type: 'project', xp: 280 }
        ]
      }
    ];

    return c.json({ 
      success: true,
      courses: courses 
    });

  } catch (error) {
    console.error("Error fetching courses:", error);
    return c.json({ 
      error: "Internal server error: " + error.message 
    }, 500);
  }
});

// Course enrollment endpoint with robust duplicate prevention
app.post("/make-server-5ea56f4e/courses/enroll", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      console.log("No access token provided for course enrollment");
      return c.json({ error: "No access token provided" }, 401);
    }

    const user = await authenticateUser(accessToken);
    if (!user) {
      console.log("Authentication failed for course enrollment");
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const { courseId } = await c.req.json();
    if (!courseId) {
      return c.json({ error: "Course ID is required" }, 400);
    }

    console.log(`Enrollment attempt for user ${user.id} in course ${courseId}`);

    // Get current user data with proper error handling
    let userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log("User not found during enrollment, creating profile");
      userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'student',
        aiExperience: user.user_metadata?.aiExperience || 'beginner',
        createdAt: user.created_at || new Date().toISOString(),
        enrolledCourses: [],
        completedCourses: [],
        enrollments: [],
        xp: 0,
        level: 1,
        currentStreak: 0,
        dailyXP: 0
      };
      await kv.set(`user:${user.id}`, userData);
    }

    // Initialize arrays if they don't exist
    if (!userData.enrolledCourses) userData.enrolledCourses = [];
    if (!userData.enrollments) userData.enrollments = [];

    // COMPREHENSIVE duplicate prevention
    const isAlreadyEnrolled = userData.enrolledCourses.includes(courseId);
    const hasEnrollmentRecord = userData.enrollments.some(e => e.courseId === courseId);

    if (isAlreadyEnrolled || hasEnrollmentRecord) {
      console.log(`User ${user.id} already enrolled in course ${courseId}`);
      return c.json({ 
        error: "Ya estás inscrito en este curso",
        isAlreadyEnrolled: true 
      }, 409);
    }

    // Validate that the course exists
    const availableCourses = [
      { id: 'intro-ai', title: 'Fundamentos de IA', difficulty: 'beginner' },
      { id: 'machine-learning', title: 'Machine Learning Básico', difficulty: 'intermediate' },
      { id: 'deep-learning', title: 'Deep Learning Avanzado', difficulty: 'advanced' },
      { id: 'ai-ethics', title: 'Ética en IA', difficulty: 'beginner' },
      { id: 'nlp-fundamentals', title: 'Procesamiento de Lenguaje Natural', difficulty: 'intermediate' },
      { id: 'computer-vision', title: 'Visión por Computadora', difficulty: 'advanced' }
    ];

    const courseExists = availableCourses.find(c => c.id === courseId);
    if (!courseExists) {
      return c.json({ error: "Course not found" }, 404);
    }

    // Create new enrollment with proper data structure
    const enrollmentData = {
      courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      completedLessons: [],
      startedAt: null,
      completedAt: null,
      lastAccessedAt: new Date().toISOString()
    };

    // Add to both tracking arrays
    userData.enrolledCourses.push(courseId);
    userData.enrollments.push(enrollmentData);

    // Award enrollment XP
    userData.xp = (userData.xp || 0) + 50;
    userData.dailyXP = (userData.dailyXP || 0) + 50;

    // Save updated user data
    await kv.set(`user:${user.id}`, userData);

    console.log(`Successfully enrolled user ${user.id} in course ${courseId}`);
    return c.json({ 
      success: true, 
      message: "Enrolled successfully",
      enrollment: enrollmentData,
      xpGained: 50,
      totalXP: userData.xp
    });

  } catch (error) {
    console.error("Error during course enrollment:", error);
    return c.json({ 
      error: "Internal server error during enrollment: " + error.message 
    }, 500);
  }
});

// Get user's enrolled courses
app.get("/make-server-5ea56f4e/user/courses", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      console.log("No access token provided for user courses");
      return c.json({ error: "No access token provided" }, 401);
    }

    const user = await authenticateUser(accessToken);
    if (!user) {
      console.log("Authentication failed for user courses");
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    // Get user data
    let userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log("User not found when fetching courses, creating default");
      userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'student',
        aiExperience: user.user_metadata?.aiExperience || 'beginner',
        enrolledCourses: [],
        enrollments: [],
        completedCourses: [],
        xp: 0,
        level: 1
      };
      await kv.set(`user:${user.id}`, userData);
    }

    // Initialize arrays if they don't exist
    if (!userData.enrolledCourses) userData.enrolledCourses = [];
    if (!userData.enrollments) userData.enrollments = [];
    if (!userData.completedCourses) userData.completedCourses = [];

    return c.json({
      success: true,
      enrolledCourses: userData.enrolledCourses,
      enrollments: userData.enrollments,
      completedCourses: userData.completedCourses
    });

  } catch (error) {
    console.error("Error fetching user courses:", error);
    return c.json({ 
      error: "Internal server error: " + error.message 
    }, 500);
  }
});

// Update course progress
app.post("/make-server-5ea56f4e/courses/progress", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const user = await authenticateUser(accessToken);
    if (!user) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const { courseId, lessonId, xpGained } = await c.req.json();
    if (!courseId || !lessonId) {
      return c.json({ error: "Course ID and Lesson ID are required" }, 400);
    }

    // Get user data
    let userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: "User profile not found" }, 404);
    }

    // Find the enrollment
    const enrollmentIndex = userData.enrollments?.findIndex(e => e.courseId === courseId);
    if (enrollmentIndex === -1) {
      return c.json({ error: "Not enrolled in this course" }, 400);
    }

    const enrollment = userData.enrollments[enrollmentIndex];
    
    // Check if lesson already completed
    if (enrollment.completedLessons?.some(l => l.lessonId === lessonId)) {
      return c.json({ error: "Lesson already completed" }, 409);
    }

    // Add completed lesson
    if (!enrollment.completedLessons) enrollment.completedLessons = [];
    enrollment.completedLessons.push({
      lessonId,
      completedAt: new Date().toISOString(),
      xpEarned: xpGained || 0
    });

    // Update progress
    const totalLessons = 4; // Default lesson count, could be made dynamic
    enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    
    // Update user XP
    userData.xp = (userData.xp || 0) + (xpGained || 0);
    userData.dailyXP = (userData.dailyXP || 0) + (xpGained || 0);

    // Save updated data
    await kv.set(`user:${user.id}`, userData);

    return c.json({
      success: true,
      enrollment,
      xpGained: xpGained || 0,
      totalXP: userData.xp
    });

  } catch (error) {
    console.error("Error updating course progress:", error);
    return c.json({ 
      error: "Internal server error: " + error.message 
    }, 500);
  }
});

// Password reset endpoints (simplified)
app.post("/make-server-5ea56f4e/auth/reset-password", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // For development, always return success
    return c.json({ 
      success: true, 
      message: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      resetToken: `dev_reset_${Date.now()}`,
      resetLink: `#reset-password?email=${encodeURIComponent(email)}&token=dev_reset_${Date.now()}`
    });

  } catch (error) {
    console.error("Error in password reset:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

app.post("/make-server-5ea56f4e/auth/update-password", async (c) => {
  try {
    const { email, newPassword, resetToken } = await c.req.json();
    
    if (!email || !newPassword || !resetToken) {
      return c.json({ error: "All fields are required" }, 400);
    }

    // For development purposes, allow password update
    return c.json({ 
      success: true, 
      message: "Password updated successfully" 
    });

  } catch (error) {
    console.error("Error updating password:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);
