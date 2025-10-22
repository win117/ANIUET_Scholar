import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { registerAdminRoutes } from "./admin-endpoints.tsx";

const app = new Hono();

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize Supabase client with anon key for user token validation
const supabaseAnon = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
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

// Helper function to authenticate user
async function authenticateUser(accessToken: string) {
  if (!accessToken) {
    console.log("No access token provided to authenticateUser");
    return null;
  }
  
  try {
    console.log("Attempting to authenticate user with JWT verification");
    console.log("Token preview:", accessToken.substring(0, 20) + "...");
    
    // Decode JWT to get user info
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.log("Invalid JWT format");
      return null;
    }
    
    const payload = parts[1];
    const paddedPayload = payload + '==='.slice(0, (4 - payload.length % 4) % 4);
    const decodedPayload = JSON.parse(atob(paddedPayload));
    
    console.log("Token payload decoded successfully");
    console.log("User ID:", decodedPayload.sub);
    console.log("Email:", decodedPayload.email);
    console.log("Expiry:", new Date(decodedPayload.exp * 1000).toISOString());
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp < now) {
      console.log("Token has expired");
      return null;
    }
    
    // Verify the token is from our Supabase instance
    const expectedIssuer = `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/auth/v1`;
    if (!decodedPayload.iss || !decodedPayload.iss.includes(Deno.env.get('SUPABASE_URL')?.replace('https://', '') || '')) {
      console.log("Token issuer mismatch");
      console.log("Expected:", expectedIssuer);
      console.log("Got:", decodedPayload.iss);
      return null;
    }
    
    // Return user object compatible with Supabase User type
    const user = {
      id: decodedPayload.sub,
      email: decodedPayload.email,
      aud: decodedPayload.aud,
      role: decodedPayload.role,
      created_at: new Date(decodedPayload.iat * 1000).toISOString(),
      user_metadata: decodedPayload.user_metadata || {},
      app_metadata: decodedPayload.app_metadata || {}
    };
    
    console.log("User authenticated successfully:", user.id, "email:", user.email);
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

// Test endpoint to verify server is working
app.get("/make-server-5ea56f4e/test", (c) => {
  console.log("Test endpoint called");
  return c.json({ 
    success: true,
    message: "Server is working correctly",
    timestamp: new Date().toISOString()
  });
});

// Test authentication endpoint
app.get("/make-server-5ea56f4e/test-auth", async (c) => {
  console.log("=== TEST AUTH ENDPOINT ===");
  
  const authHeader = c.req.header('Authorization');
  const accessToken = authHeader?.split(' ')[1];
  
  if (!accessToken) {
    return c.json({ error: "No token provided" }, 401);
  }
  
  console.log("Testing token:", accessToken.substring(0, 20) + "...");
  console.log("Token length:", accessToken.length);
  
  // Decode JWT to see what's inside (base64 decode the payload)
  let tokenPayload = null;
  try {
    const parts = accessToken.split('.');
    if (parts.length === 3) {
      const payload = parts[1];
      // Add padding if needed
      const paddedPayload = payload + '==='.slice(0, (4 - payload.length % 4) % 4);
      const decodedPayload = atob(paddedPayload);
      tokenPayload = JSON.parse(decodedPayload);
      console.log("Token payload:", tokenPayload);
    }
  } catch (e) {
    console.error("Error decoding token:", e);
  }
  
  // Try with both clients
  console.log("Testing with supabaseAnon (ANON_KEY)...");
  let userAnon = null;
  let errorAnon = null;
  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(accessToken);
    userAnon = user;
    errorAnon = error;
    console.log("supabaseAnon result:", user ? "SUCCESS - " + user.email : "FAILED - " + (error?.message || "Unknown error"));
  } catch (e) {
    console.error("supabaseAnon exception:", e);
    errorAnon = e;
  }
  
  console.log("Testing with supabase (SERVICE_ROLE_KEY)...");
  let userService = null;
  let errorService = null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    userService = user;
    errorService = error;
    console.log("supabase result:", user ? "SUCCESS - " + user.email : "FAILED - " + (error?.message || "Unknown error"));
  } catch (e) {
    console.error("supabase exception:", e);
    errorService = e;
  }
  
  const user = await authenticateUser(accessToken);
  
  if (!user) {
    return c.json({ 
      success: false,
      error: "Authentication failed",
      message: "Token could not be validated",
      debug: {
        tokenLength: accessToken.length,
        tokenPreview: accessToken.substring(0, 30) + "...",
        tokenPayload: tokenPayload,
        anonClient: {
          success: !!userAnon,
          error: errorAnon?.message || (errorAnon ? String(errorAnon) : null),
          userId: userAnon?.id || null
        },
        serviceClient: {
          success: !!userService,
          error: errorService?.message || (errorService ? String(errorService) : null),
          userId: userService?.id || null
        }
      }
    }, 401);
  }
  
  const userData = await kv.get(`user:${user.id}`);
  
  return c.json({
    success: true,
    message: "Authentication successful",
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    kvData: userData ? {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name
    } : null,
    kvDataExists: !!userData
  });
});

// Diagnostic endpoint to check Supabase configuration
app.get("/make-server-5ea56f4e/diagnose", async (c) => {
  console.log("=== DIAGNOSE ENDPOINT CALLED ===");
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    supabase: {},
    auth: {}
  };

  try {
    // Check environment variables
    results.environment.supabaseUrl = Deno.env.get('SUPABASE_URL') || 'NOT SET';
    results.environment.hasServiceRoleKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    results.environment.hasAnonKey = !!Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log("Environment check:", results.environment);

    // Try to list users
    try {
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        results.auth.listUsersError = listError.message;
        console.error("List users error:", listError);
      } else {
        results.auth.totalUsers = authUsers?.users?.length || 0;
        results.auth.users = authUsers?.users?.map((u: any) => ({
          id: u.id,
          email: u.email,
          email_confirmed_at: u.email_confirmed_at,
          created_at: u.created_at
        })) || [];
        console.log(`Found ${results.auth.totalUsers} users in Auth`);
        
        // Check specifically for admin
        const adminUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === 'admin@aniuet.com');
        if (adminUser) {
          results.auth.adminExists = true;
          results.auth.adminId = adminUser.id;
          results.auth.adminEmailConfirmed = !!adminUser.email_confirmed_at;
          console.log("Admin user found:", adminUser.id);
        } else {
          results.auth.adminExists = false;
          console.log("Admin user NOT found in Auth");
        }
      }
    } catch (authError: any) {
      results.auth.exception = authError.message;
      console.error("Auth exception:", authError);
    }

    // Check KV store
    try {
      const allUsers = await kv.getByPrefix('user:');
      results.supabase.kvUserCount = allUsers.length;
      results.supabase.kvUsers = allUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role
      }));
      console.log(`Found ${allUsers.length} users in KV store`);
      
      const adminInKv = allUsers.find((u: any) => u.email?.toLowerCase() === 'admin@aniuet.com');
      if (adminInKv) {
        results.supabase.adminInKv = true;
        results.supabase.adminKvData = adminInKv;
      } else {
        results.supabase.adminInKv = false;
      }
    } catch (kvError: any) {
      results.supabase.kvError = kvError.message;
      console.error("KV error:", kvError);
    }

    console.log("=== DIAGNOSE COMPLETE ===");
    return c.json(results);
    
  } catch (error: any) {
    console.error("=== DIAGNOSE ERROR ===");
    console.error("Error:", error);
    results.error = error.message;
    return c.json(results, 500);
  }
});

// Register user with auto-login endpoint
app.post("/make-server-5ea56f4e/register-with-login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role, aiExperience, ...additionalData } = body;

    console.log("Registration with auto-login attempt for user:", email);

    // Validate required fields
    if (!email || !password || !name || !role || !aiExperience) {
      return c.json({ error: "Todos los campos obligatorios deben ser completados" }, 400);
    }

    // Validate password strength
    if (password.length < 6) {
      return c.json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
    }

    // Check if user already exists
    const existingUsers = await kv.getByPrefix('user:');
    const existingUser = existingUsers.find(user => user.email?.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      console.log("User already exists in our system:", email);
      return c.json({ 
        error: "Ya existe una cuenta con este correo electrónico", 
        action: "redirect_to_login",
        message: "Este correo ya está registrado. Por favor, inicia sesión en su lugar."
      }, 409);
    }

    // Try to create user in Supabase Auth
    const { data: createUserData, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        role,
        aiExperience,
        ...additionalData
      },
      email_confirm: true
    });

    if (createUserError) {
      console.log("Supabase Auth error:", createUserError);
      // Check if user already exists in Supabase Auth
      if (createUserError.message?.includes('already registered') || createUserError.code === 'user_already_exists') {
        return c.json({ 
          error: "Ya existe una cuenta con este correo electrónico en Supabase Auth", 
          action: "redirect_to_login",
          message: "Este correo ya está registrado. Por favor, inicia sesión en su lugar."
        }, 409);
      }
      return c.json({ error: "Error al crear la cuenta: " + createUserError.message }, 400);
    }

    // Store user data in KV store
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
      dailyXP: 0,
      subscription_tier: 'free' // All new users start with free tier
    };

    await kv.set(`user:${userId}`, userData);

    console.log("User created successfully, attempting auto-login...");

    // Wait a moment for Supabase to fully register the user
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.log("Auto-login failed:", signInError.message);
      // User was created successfully, but auto-login failed
      return c.json({ 
        success: true, 
        message: "Usuario registrado exitosamente. Por favor, inicia sesión manualmente.",
        user: createUserData.user,
        userData: userData,
        requiresManualLogin: true
      });
    }

    if (!signInData?.session) {
      console.log("No session returned from auto-login");
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

// Get user profile
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

    // Try to get user data from KV store
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
        subscription_tier: 'free', // Default tier for new users
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

// Update user profile
app.put("/make-server-5ea56f4e/user/profile", async (c) => {
  try {
    console.log("Profile update request received");
    
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

    const updates = await c.req.json();
    console.log("Updating profile for user:", user.id, "with data:", updates);

    // Get current user data
    let userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      console.log("User not found in KV store");
      return c.json({ error: "User not found" }, 404);
    }

    // Update fields
    const updatedUserData = {
      ...userData,
      ...updates,
      id: user.id, // Never allow ID to be changed
      email: user.email, // Never allow email to be changed via this endpoint
      updatedAt: new Date().toISOString()
    };

    // Save to KV store
    await kv.set(`user:${user.id}`, updatedUserData);
    
    console.log("Profile updated successfully for:", user.id);
    return c.json({ 
      success: true,
      user: updatedUserData 
    });
    
  } catch (error) {
    console.error("Error updating user profile:", error);
    return c.json({ 
      error: "Internal server error while updating profile", 
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get available courses
app.get("/make-server-5ea56f4e/courses", async (c) => {
  try {
    console.log("Fetching available courses");
    
    // Get mock courses from KV store first
    let mockCourses = await kv.getByPrefix('mock_course:');
    
    // If mock courses don't exist, return fallback hardcoded courses
    if (mockCourses.length === 0) {
      console.log("No mock courses found in KV, returning fallback courses");
      const courses = [
        {
          id: 'intro-ai',
          title: 'Fundamentos de IA',
          description: 'Conceptos básicos y aplicaciones de la inteligencia artificial',
          difficulty: 'beginner',
          duration: '4 semanas',
          requiredTier: 'free', // Curso gratuito
          lessons: [
            { id: 'intro-1', title: 'Introducción a la IA', type: 'reading', xp: 100 },
            { id: 'history-1', title: 'Historia de la IA', type: 'reading', xp: 75 },
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
          requiredTier: 'pro', // Requiere suscripción Pro
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
          requiredTier: 'pro', // Requiere suscripción Pro
          lessons: [
            { id: 'dl-1', title: 'Redes neuronales', type: 'reading', xp: 150 },
            { id: 'dl-2', title: 'CNN y RNN', type: 'practice', xp: 200 },
            { id: 'dl-3', title: 'Transformers', type: 'practice', xp: 250 },
            { id: 'dl-4', title: 'Proyecto avanzado', type: 'project', xp: 300 }
          ]
        },
        // Crash Courses para profesionales
        {
          id: 'ai-business-impact',
          title: 'IA para Impacto Empresarial',
          description: 'Aprende a implementar IA en tu negocio para obtener resultados medibles en semanas',
          difficulty: 'intermediate',
          type: 'crash-course',
          estimatedTime: '4 horas',
          requiredTier: 'pro',
          lessons: [
            { id: 'aibi-1', title: 'ROI de IA en negocios', type: 'reading', xp: 150 },
            { id: 'aibi-2', title: 'Casos de uso prácticos', type: 'practice', xp: 200 },
            { id: 'aibi-3', title: 'Implementación rápida', type: 'project', xp: 300 }
          ]
        },
        {
          id: 'prompt-engineering-pro',
          title: 'Prompt Engineering Profesional',
          description: 'Domina el arte de crear prompts efectivos para maximizar la productividad con IA',
          difficulty: 'beginner',
          type: 'crash-course',
          estimatedTime: '2 horas',
          requiredTier: 'free',
          lessons: [
            { id: 'pep-1', title: 'Fundamentos de prompting', type: 'reading', xp: 100 },
            { id: 'pep-2', title: 'Técnicas avanzadas', type: 'practice', xp: 150 },
            { id: 'pep-3', title: 'Casos empresariales', type: 'project', xp: 200 }
          ]
        },
        {
          id: 'ai-automation-workflow',
          title: 'Automatización con IA',
          description: 'Crea workflows automatizados que ahorren tiempo y aumenten la eficiencia',
          difficulty: 'intermediate',
          type: 'crash-course',
          estimatedTime: '3 horas',
          requiredTier: 'pro',
          lessons: [
            { id: 'aaw-1', title: 'Herramientas de automatización', type: 'reading', xp: 120 },
            { id: 'aaw-2', title: 'Diseño de workflows', type: 'practice', xp: 180 },
            { id: 'aaw-3', title: 'Integración práctica', type: 'project', xp: 250 }
          ]
        }
      ];
      
      return c.json({ 
        success: true,
        courses: courses 
      });
    }
    
    // Return mock courses from KV (which now have complete lesson data)
    console.log(`Found ${mockCourses.length} mock courses in KV store`);
    
    // Also get custom courses
    const customCourses = await kv.getByPrefix('course:');
    
    const allCourses = [
      ...mockCourses,
      ...customCourses
    ];

    return c.json({ 
      success: true,
      courses: allCourses 
    });

  } catch (error) {
    console.error("Error fetching courses:", error);
    return c.json({ 
      error: "Internal server error: " + error.message 
    }, 500);
  }
});

// Get available course codes for testing
app.get("/make-server-5ea56f4e/available-course-codes", async (c) => {
  try {
    console.log("Fetching available course codes");
    
    // Get existing mock courses
    let mockCoursesFromKV = await kv.getByPrefix('mock_course:');
    
    // If they don't exist or are incomplete, ensure they're created with complete data
    if (mockCoursesFromKV.length === 0 || !mockCoursesFromKV[0].lessons) {
      console.log("Creating mock courses with complete lesson data...");
      
      const mockCoursesData = [
        {
          id: 'intro-ai',
          title: 'Fundamentos de IA',
          description: 'Conceptos básicos y aplicaciones de la inteligencia artificial',
          difficulty: 'beginner',
          courseCode: 'ANIUET-001',
          type: 'mock',
          status: 'active',
          requiredTier: 'free', // Curso gratuito
          lessons: [
            { id: 'intro-1', title: 'Introducción a la IA', type: 'reading', xp: 100, locked: false, order: 0, position: { x: 20, y: 80 }, connections: ['history-1'] },
            { id: 'history-1', title: 'Historia de la IA', type: 'reading', xp: 75, locked: false, order: 1, position: { x: 45, y: 60 }, connections: ['intro-3'] },
            { id: 'intro-3', title: 'Tipos de IA', type: 'practice', xp: 150, locked: true, order: 2, position: { x: 70, y: 40 }, connections: ['intro-4'] },
            { id: 'intro-4', title: 'Aplicaciones prácticas', type: 'project', xp: 200, locked: true, order: 3, position: { x: 90, y: 20 }, connections: [] }
          ]
        },
        {
          id: 'machine-learning',
          title: 'Machine Learning Básico',
          description: 'Introducción al aprendizaje automático',
          difficulty: 'intermediate',
          courseCode: 'ANIUET-002',
          type: 'mock',
          status: 'active',
          requiredTier: 'pro', // Requiere suscripción Pro
          lessons: [
            { id: 'ml-1', title: 'Conceptos básicos de ML', type: 'reading', xp: 120, locked: false, order: 0 },
            { id: 'ml-2', title: 'Algoritmos supervisados', type: 'practice', xp: 180, locked: true, order: 1 }
          ]
        },
        {
          id: 'deep-learning',
          title: 'Deep Learning Avanzado',
          description: 'Redes neuronales profundas',
          difficulty: 'advanced',
          courseCode: 'ANIUET-003',
          type: 'mock',
          status: 'active',
          requiredTier: 'pro', // Requiere suscripción Pro
          lessons: [
            { id: 'dl-1', title: 'Redes neuronales', type: 'reading', xp: 150, locked: false, order: 0 },
            { id: 'dl-2', title: 'CNN y RNN', type: 'practice', xp: 200, locked: true, order: 1 }
          ]
        },
        // Crash Courses
        {
          id: 'ai-business-impact',
          title: 'IA para Impacto Empresarial',
          description: 'Implementa IA en tu negocio para resultados medibles',
          difficulty: 'intermediate',
          courseCode: 'ANIUET-CC01',
          type: 'crash-course',
          status: 'active',
          estimatedTime: '4 horas',
          requiredTier: 'pro',
          lessons: [
            { id: 'aibi-1', title: 'ROI de IA en negocios', type: 'reading', xp: 150, locked: false, order: 0, position: { x: 20, y: 80 }, connections: ['aibi-2'] },
            { id: 'aibi-2', title: 'Casos de uso prácticos', type: 'practice', xp: 200, locked: true, order: 1, position: { x: 50, y: 50 }, connections: ['aibi-3'] },
            { id: 'aibi-3', title: 'Implementación rápida', type: 'project', xp: 300, locked: true, order: 2, position: { x: 80, y: 20 }, connections: [] }
          ]
        },
        {
          id: 'prompt-engineering-pro',
          title: 'Prompt Engineering Profesional',
          description: 'Domina prompts efectivos para productividad con IA',
          difficulty: 'beginner',
          courseCode: 'ANIUET-CC02',
          type: 'crash-course',
          status: 'active',
          estimatedTime: '2 horas',
          requiredTier: 'free',
          lessons: [
            { id: 'pep-1', title: 'Fundamentos de prompting', type: 'reading', xp: 100, locked: false, order: 0, position: { x: 20, y: 80 }, connections: ['pep-2'] },
            { id: 'pep-2', title: 'Técnicas avanzadas', type: 'practice', xp: 150, locked: true, order: 1, position: { x: 50, y: 50 }, connections: ['pep-3'] },
            { id: 'pep-3', title: 'Casos empresariales', type: 'project', xp: 200, locked: true, order: 2, position: { x: 80, y: 20 }, connections: [] }
          ]
        },
        {
          id: 'ai-automation-workflow',
          title: 'Automatización con IA',
          description: 'Crea workflows automatizados eficientes',
          difficulty: 'intermediate',
          courseCode: 'ANIUET-CC03',
          type: 'crash-course',
          status: 'active',
          estimatedTime: '3 horas',
          requiredTier: 'pro',
          lessons: [
            { id: 'aaw-1', title: 'Herramientas de automatización', type: 'reading', xp: 120, locked: false, order: 0, position: { x: 20, y: 80 }, connections: ['aaw-2'] },
            { id: 'aaw-2', title: 'Diseño de workflows', type: 'practice', xp: 180, locked: true, order: 1, position: { x: 50, y: 50 }, connections: ['aaw-3'] },
            { id: 'aaw-3', title: 'Integración práctica', type: 'project', xp: 250, locked: true, order: 2, position: { x: 80, y: 20 }, connections: [] }
          ]
        }
      ];
      
      for (const course of mockCoursesData) {
        await kv.set(`mock_course:${course.id}`, course);
      }
      mockCoursesFromKV = mockCoursesData;
    }

    const mockCourses = mockCoursesFromKV.map(course => ({
      code: course.courseCode,
      title: course.title,
      type: 'mock'
    }));

    // Get custom course codes
    const allCourses = await kv.getByPrefix('course:');
    const customCourses = allCourses.map(course => ({
      code: course.courseCode,
      title: course.title,
      type: 'custom'
    }));

    return c.json({
      success: true,
      availableCodes: [...mockCourses, ...customCourses]
    });

  } catch (error) {
    console.error("Error fetching course codes:", error);
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
        dailyXP: 0,
        subscription_tier: 'free'
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

    // Check subscription tier requirement
    // Get full course details to check required tier
    let courseDetails = null;
    const mockCourses = await kv.getByPrefix('mock_course:');
    courseDetails = mockCourses.find(c => c.id === courseId);
    
    if (!courseDetails) {
      const customCourses = await kv.getByPrefix('course:');
      courseDetails = customCourses.find(c => c.id === courseId);
    }

    if (courseDetails && courseDetails.requiredTier) {
      const userTier = userData.subscription_tier || 'free';
      const requiredTier = courseDetails.requiredTier;
      
      // Tier hierarchy: free < pro < enterprise
      const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
      
      if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
        console.log(`User tier (${userTier}) insufficient for course (requires ${requiredTier})`);
        return c.json({ 
          error: "Suscripción insuficiente",
          message: `Este curso requiere una suscripción ${requiredTier.toUpperCase()} o superior`,
          requiredTier: requiredTier,
          userTier: userTier,
          requiresUpgrade: true
        }, 403);
      }
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
    const isAlreadyCompleted = enrollment.completedLessons?.some(l => l.lessonId === lessonId);
    if (isAlreadyCompleted) {
      // For already completed lessons, just return success without updating
      return c.json({ 
        success: true,
        alreadyCompleted: true,
        message: "Lesson already completed",
        enrollment,
        xpGained: 0,
        totalXP: userData.xp
      });
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

/**
 * Password Reset Endpoint - Solicita recuperación de contraseña
 * 
 * Este endpoint genera un token de recuperación y lo almacena en la base de datos.
 * En un entorno de producción, enviaría un email con el enlace de recuperación.
 * En desarrollo, retorna el token directamente para facilitar pruebas.
 * 
 * @route POST /make-server-5ea56f4e/auth/reset-password
 * @param {string} email - Correo electrónico del usuario
 * @returns {object} Token de recuperación y enlace (en desarrollo) o confirmación de envío de email
 */
app.post("/make-server-5ea56f4e/auth/reset-password", async (c) => {
  try {
    const { email } = await c.req.json();
    
    // Validar que se proporcione el email
    if (!email) {
      console.log("Password reset request missing email");
      return c.json({ error: "Email is required" }, 400);
    }

    console.log(`Password reset requested for email: ${email}`);

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`Invalid email format: ${email}`);
      return c.json({ error: "Formato de correo electrónico inválido" }, 400);
    }

    // Verificar que el usuario existe en nuestro sistema
    const allUsers = await kv.getByPrefix('user:');
    const userExists = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      console.log(`Password reset requested for non-existent user: ${email}`);
      // Por seguridad, retornamos éxito aunque el usuario no exista
      // (no revelamos si un email está registrado o no)
      return c.json({ 
        success: true, 
        message: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.",
        emailSent: false
      });
    }

    // Generar token de recuperación único
    const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const expiresAt = Date.now() + (60 * 60 * 1000); // Token expira en 1 hora
    
    // Almacenar token en KV store con información de expiración
    const resetData = {
      email: email.toLowerCase(),
      token: resetToken,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      used: false,
      userId: userExists.id
    };
    
    await kv.set(`password_reset:${email.toLowerCase()}`, resetData);
    console.log(`Password reset token created for ${email}: ${resetToken}`);

    // En producción, aquí enviarías un email con el enlace de recuperación
    // Por ahora, retornamos el token directamente para desarrollo
    const resetLink = `#reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
    
    return c.json({ 
      success: true, 
      message: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      // Campos de desarrollo para facilitar testing
      resetToken: resetToken,
      resetLink: resetLink,
      emailSent: false, // Cambiar a true cuando se implemente envío de emails
      expiresIn: "1 hora"
    });

  } catch (error) {
    console.error("Error in password reset request:", error);
    return c.json({ 
      error: "Error interno al procesar solicitud de recuperación: " + error.message 
    }, 500);
  }
});

/**
 * Password Update Endpoint - Actualiza la contraseña usando un token de recuperación
 * 
 * Este endpoint valida el token de recuperación y actualiza la contraseña del usuario
 * utilizando Supabase Auth Admin API con el service role key.
 * 
 * @route POST /make-server-5ea56f4e/auth/update-password
 * @param {string} email - Correo electrónico del usuario
 * @param {string} newPassword - Nueva contraseña
 * @param {string} resetToken - Token de recuperación generado previamente
 * @returns {object} Confirmación de actualización exitosa o error detallado
 */
app.post("/make-server-5ea56f4e/auth/update-password", async (c) => {
  try {
    const { email, newPassword, resetToken } = await c.req.json();
    
    // Validar campos requeridos
    if (!email || !newPassword || !resetToken) {
      console.log("Password update missing required fields");
      return c.json({ error: "Todos los campos son requeridos" }, 400);
    }

    console.log(`Password update attempt for email: ${email}`);

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Formato de correo electrónico inválido" }, 400);
    }

    // Validar longitud mínima de contraseña
    if (newPassword.length < 6) {
      console.log("Password too short");
      return c.json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
    }

    // Recuperar token de recuperación del KV store
    const resetData = await kv.get(`password_reset:${email.toLowerCase()}`);
    
    if (!resetData) {
      console.log(`No reset token found for email: ${email}`);
      return c.json({ 
        error: "Token de recuperación no encontrado o expirado. Solicita un nuevo enlace de recuperación." 
      }, 400);
    }

    // Validar que el token coincida
    if (resetData.token !== resetToken) {
      console.log(`Invalid reset token for email: ${email}`);
      return c.json({ error: "Token de recuperación inválido" }, 400);
    }

    // Validar que el token no haya expirado
    if (Date.now() > resetData.expiresAt) {
      console.log(`Expired reset token for email: ${email}`);
      // Eliminar token expirado
      await kv.del(`password_reset:${email.toLowerCase()}`);
      return c.json({ 
        error: "El token de recuperación ha expirado. Solicita un nuevo enlace de recuperación." 
      }, 400);
    }

    // Validar que el token no haya sido usado
    if (resetData.used) {
      console.log(`Reset token already used for email: ${email}`);
      return c.json({ 
        error: "Este token ya ha sido utilizado. Solicita un nuevo enlace de recuperación." 
      }, 400);
    }

    // Buscar usuario en Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return c.json({ error: "Error al buscar usuario" }, 500);
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log(`User not found in Supabase Auth: ${email}`);
      return c.json({ error: "Usuario no encontrado" }, 404);
    }

    // Actualizar contraseña usando Supabase Admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return c.json({ 
        error: "Error al actualizar contraseña: " + updateError.message 
      }, 500);
    }

    // Marcar token como usado
    resetData.used = true;
    resetData.usedAt = new Date().toISOString();
    await kv.set(`password_reset:${email.toLowerCase()}`, resetData);

    console.log(`Password successfully updated for user: ${email}`);

    return c.json({ 
      success: true, 
      message: "Contraseña actualizada exitosamente",
      userId: user.id
    });

  } catch (error) {
    console.error("Error in password update:", error);
    return c.json({ 
      error: "Error interno al actualizar contraseña: " + error.message 
    }, 500);
  }
});

// Teacher-specific endpoints for student management

// Get teacher's students
app.get("/make-server-5ea56f4e/teacher/students", async (c) => {
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

    // Verify user is a teacher
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'teacher') {
      return c.json({ error: "Access denied. Teacher role required." }, 403);
    }

    // Get all students associated with this teacher
    const teacherStudentKey = `teacher_students:${user.id}`;
    const teacherStudents = await kv.get(teacherStudentKey) || [];

    // Get detailed student information
    const students = [];
    for (const studentId of teacherStudents) {
      const studentData = await kv.get(`user:${studentId}`);
      if (studentData) {
        students.push({
          id: studentData.id,
          name: studentData.name,
          email: studentData.email,
          enrolledCourses: studentData.enrolledCourses || [],
          enrollments: studentData.enrollments || [],
          xp: studentData.xp || 0,
          level: studentData.level || 1,
          lastActivity: studentData.lastActivity || studentData.createdAt,
          createdAt: studentData.createdAt
        });
      }
    }

    return c.json({
      success: true,
      students
    });

  } catch (error) {
    console.error("Error fetching teacher students:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Add student to teacher's class
app.post("/make-server-5ea56f4e/teacher/students/add", async (c) => {
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

    // Verify user is a teacher
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'teacher') {
      return c.json({ error: "Access denied. Teacher role required." }, 403);
    }

    const { studentEmail } = await c.req.json();
    if (!studentEmail) {
      return c.json({ error: "Student email is required" }, 400);
    }

    // Find student by email
    const allUsers = await kv.getByPrefix('user:');
    const student = allUsers.find(u => u.email?.toLowerCase() === studentEmail.toLowerCase() && u.role === 'student');

    if (!student) {
      return c.json({ error: "Student not found or not a student role" }, 404);
    }

    // Add student to teacher's list
    const teacherStudentKey = `teacher_students:${user.id}`;
    let teacherStudents = await kv.get(teacherStudentKey) || [];
    
    if (!teacherStudents.includes(student.id)) {
      teacherStudents.push(student.id);
      await kv.set(teacherStudentKey, teacherStudents);

      // Also add teacher to student's teachers list
      const studentTeacherKey = `student_teachers:${student.id}`;
      let studentTeachers = await kv.get(studentTeacherKey) || [];
      if (!studentTeachers.includes(user.id)) {
        studentTeachers.push(user.id);
        await kv.set(studentTeacherKey, studentTeachers);
      }

      return c.json({
        success: true,
        message: "Student added successfully",
        student: {
          id: student.id,
          name: student.name,
          email: student.email
        }
      });
    } else {
      return c.json({ error: "Student is already in your class" }, 409);
    }

  } catch (error) {
    console.error("Error adding student to teacher:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Enroll student in course (teacher action)
app.post("/make-server-5ea56f4e/teacher/students/enroll", async (c) => {
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

    // Verify user is a teacher
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'teacher') {
      return c.json({ error: "Access denied. Teacher role required." }, 403);
    }

    const { studentId, courseId } = await c.req.json();
    if (!studentId || !courseId) {
      return c.json({ error: "Student ID and Course ID are required" }, 400);
    }

    // Verify teacher has access to this student
    const teacherStudentKey = `teacher_students:${user.id}`;
    const teacherStudents = await kv.get(teacherStudentKey) || [];
    if (!teacherStudents.includes(studentId)) {
      return c.json({ error: "Student not found in your class" }, 403);
    }

    // Get student data
    let studentData = await kv.get(`user:${studentId}`);
    if (!studentData) {
      return c.json({ error: "Student not found" }, 404);
    }

    // Initialize arrays if they don't exist
    if (!studentData.enrolledCourses) studentData.enrolledCourses = [];
    if (!studentData.enrollments) studentData.enrollments = [];

    // Check if already enrolled
    const isAlreadyEnrolled = studentData.enrolledCourses.includes(courseId) ||
      studentData.enrollments.some(e => e.courseId === courseId);

    if (isAlreadyEnrolled) {
      return c.json({ error: "Student is already enrolled in this course" }, 409);
    }

    // Create enrollment
    const enrollmentData = {
      courseId,
      enrolledAt: new Date().toISOString(),
      enrolledBy: user.id, // Track who enrolled the student
      enrolledByTeacher: userData.name,
      progress: 0,
      completedLessons: [],
      startedAt: null,
      completedAt: null,
      lastAccessedAt: new Date().toISOString()
    };

    // Add to student's records
    studentData.enrolledCourses.push(courseId);
    studentData.enrollments.push(enrollmentData);
    studentData.xp = (studentData.xp || 0) + 50; // Enrollment bonus
    studentData.lastActivity = new Date().toISOString();

    // Save updated student data
    await kv.set(`user:${studentId}`, studentData);

    console.log(`Teacher ${user.id} enrolled student ${studentId} in course ${courseId}`);

    return c.json({
      success: true,
      message: "Student enrolled successfully",
      enrollment: enrollmentData
    });

  } catch (error) {
    console.error("Error enrolling student in course:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Generate class invitation code for students to join  
app.post("/make-server-5ea56f4e/teacher/class/invite-code", async (c) => {
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

    // Verify user is a teacher
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'teacher') {
      return c.json({ error: "Access denied. Teacher role required." }, 403);
    }

    // Generate a unique invitation code
    const inviteCode = `${userData.name.replace(/\s+/g, '').substring(0, 4).toUpperCase()}${Date.now().toString().slice(-6)}`;
    
    // Store invitation with expiration (24 hours)
    const inviteData = {
      teacherId: user.id,
      teacherName: userData.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      usedBy: []
    };

    await kv.set(`invite:${inviteCode}`, inviteData);

    return c.json({
      success: true,
      inviteCode,
      teacherName: userData.name,
      expiresAt: inviteData.expiresAt
    });

  } catch (error) {
    console.error("Error generating invite code:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Join class using teacher invitation code (different from course codes)
app.post("/make-server-5ea56f4e/student/join-teacher-class", async (c) => {
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

    // Verify user is a student
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'student') {
      return c.json({ error: "Access denied. Student role required." }, 403);
    }

    const { inviteCode } = await c.req.json();
    if (!inviteCode) {
      return c.json({ error: "Invitation code is required" }, 400);
    }

    // Get invitation data
    const inviteData = await kv.get(`invite:${inviteCode}`);
    if (!inviteData) {
      return c.json({ error: "Invalid invitation code" }, 404);
    }

    // Check if invitation has expired
    if (new Date() > new Date(inviteData.expiresAt)) {
      return c.json({ error: "Invitation code has expired" }, 410);
    }

    // Check if student already used this code
    if (inviteData.usedBy.includes(user.id)) {
      return c.json({ error: "You have already used this invitation code" }, 409);
    }

    const teacherId = inviteData.teacherId;

    // Add student to teacher's list
    const teacherStudentKey = `teacher_students:${teacherId}`;
    let teacherStudents = await kv.get(teacherStudentKey) || [];
    
    if (!teacherStudents.includes(user.id)) {
      teacherStudents.push(user.id);
      await kv.set(teacherStudentKey, teacherStudents);
    }

    // Add teacher to student's teachers list
    const studentTeacherKey = `student_teachers:${user.id}`;
    let studentTeachers = await kv.get(studentTeacherKey) || [];
    if (!studentTeachers.includes(teacherId)) {
      studentTeachers.push(teacherId);
      await kv.set(studentTeacherKey, studentTeachers);
    }

    // Mark invitation as used by this student
    inviteData.usedBy.push(user.id);
    await kv.set(`invite:${inviteCode}`, inviteData);

    return c.json({
      success: true,
      message: `Successfully joined ${inviteData.teacherName}'s class`,
      teacherName: inviteData.teacherName
    });

  } catch (error) {
    console.error("Error joining class:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// =============================================================================
// COMMUNITY SYSTEM ENDPOINTS
// =============================================================================

// Create a new community post
app.post("/make-server-5ea56f4e/community/posts", async (c) => {
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

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: "User profile not found" }, 404);
    }

    const { content, tags, type } = await c.req.json();
    if (!content || !content.trim()) {
      return c.json({ error: "Post content is required" }, 400);
    }

    // Generate post ID
    const postId = `post_${Date.now()}_${user.id}`;
    
    // Create post data
    const postData = {
      id: postId,
      authorId: user.id,
      author: {
        name: userData.name,
        role: userData.role,
        level: userData.level || 1,
        avatar: userData.role === 'student' ? '🎓' : 
                userData.role === 'teacher' ? '🧑‍🏫' : '👩‍💼'
      },
      content: content.trim(),
      tags: tags || [],
      type: type || 'post',
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save post
    await kv.set(`community_post:${postId}`, postData);

    // Add to user's posts list
    const userPostsKey = `user_posts:${user.id}`;
    let userPosts = await kv.get(userPostsKey) || [];
    userPosts.unshift(postId);
    await kv.set(userPostsKey, userPosts);

    // Update community stats
    await updateCommunityStats('posts');

    // Award XP for posting
    userData.xp = (userData.xp || 0) + 25;
    userData.dailyXP = (userData.dailyXP || 0) + 25;
    await kv.set(`user:${user.id}`, userData);

    console.log(`New community post created by ${user.id}: ${postId}`);

    return c.json({
      success: true,
      post: postData,
      xpGained: 25
    });

  } catch (error) {
    console.error("Error creating community post:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Get community feed posts
app.get("/make-server-5ea56f4e/community/posts", async (c) => {
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

    // Get all community posts
    const allPosts = await kv.getByPrefix('community_post:');
    
    // Sort by creation date (newest first)
    const sortedPosts = allPosts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Add computed fields
    const postsWithStats = sortedPosts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      isLikedByUser: post.likes?.includes(user.id) || false,
      timestamp: getRelativeTime(post.createdAt)
    }));

    return c.json({
      success: true,
      posts: postsWithStats
    });

  } catch (error) {
    console.error("Error fetching community posts:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Like/Unlike a post
app.post("/make-server-5ea56f4e/community/posts/:postId/like", async (c) => {
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

    const postId = c.req.param('postId');
    const postData = await kv.get(`community_post:${postId}`);
    
    if (!postData) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Initialize likes array if it doesn't exist
    if (!postData.likes) postData.likes = [];

    const isLiked = postData.likes.includes(user.id);
    
    if (isLiked) {
      // Unlike the post
      postData.likes = postData.likes.filter(id => id !== user.id);
    } else {
      // Like the post
      postData.likes.push(user.id);
    }

    postData.updatedAt = new Date().toISOString();
    await kv.set(`community_post:${postId}`, postData);

    return c.json({
      success: true,
      liked: !isLiked,
      likesCount: postData.likes.length
    });

  } catch (error) {
    console.error("Error toggling post like:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Add comment to a post
app.post("/make-server-5ea56f4e/community/posts/:postId/comments", async (c) => {
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

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: "User profile not found" }, 404);
    }

    const { content } = await c.req.json();
    if (!content || !content.trim()) {
      return c.json({ error: "Comment content is required" }, 400);
    }

    const postId = c.req.param('postId');
    const postData = await kv.get(`community_post:${postId}`);
    
    if (!postData) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Create comment
    const commentId = `comment_${Date.now()}_${user.id}`;
    const comment = {
      id: commentId,
      authorId: user.id,
      author: {
        name: userData.name,
        role: userData.role,
        level: userData.level || 1,
        avatar: userData.role === 'student' ? '🎓' : 
                userData.role === 'teacher' ? '🧑‍🏫' : '👩‍💼'
      },
      content: content.trim(),
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Initialize comments array if it doesn't exist
    if (!postData.comments) postData.comments = [];
    
    // Add comment to post
    postData.comments.push(comment);
    postData.updatedAt = new Date().toISOString();
    
    await kv.set(`community_post:${postId}`, postData);

    // Award XP for commenting
    userData.xp = (userData.xp || 0) + 10;
    userData.dailyXP = (userData.dailyXP || 0) + 10;
    await kv.set(`user:${user.id}`, userData);

    return c.json({
      success: true,
      comment,
      xpGained: 10
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Like/Unlike a comment
app.post("/make-server-5ea56f4e/community/posts/:postId/comments/:commentId/like", async (c) => {
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

    const postId = c.req.param('postId');
    const commentId = c.req.param('commentId');
    
    const postData = await kv.get(`community_post:${postId}`);
    if (!postData) {
      return c.json({ error: "Post not found" }, 404);
    }

    const comment = postData.comments?.find(c => c.id === commentId);
    if (!comment) {
      return c.json({ error: "Comment not found" }, 404);
    }

    // Initialize likes array if it doesn't exist
    if (!comment.likes) comment.likes = [];

    const isLiked = comment.likes.includes(user.id);
    
    if (isLiked) {
      // Unlike the comment
      comment.likes = comment.likes.filter(id => id !== user.id);
    } else {
      // Like the comment
      comment.likes.push(user.id);
    }

    comment.updatedAt = new Date().toISOString();
    postData.updatedAt = new Date().toISOString();
    await kv.set(`community_post:${postId}`, postData);

    return c.json({
      success: true,
      liked: !isLiked,
      likesCount: comment.likes.length
    });

  } catch (error) {
    console.error("Error toggling comment like:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Create a new discussion
app.post("/make-server-5ea56f4e/community/discussions", async (c) => {
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

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: "User profile not found" }, 404);
    }

    const { title, content, category } = await c.req.json();
    if (!title || !title.trim() || !content || !content.trim()) {
      return c.json({ error: "Title and content are required" }, 400);
    }

    // Generate discussion ID
    const discussionId = `discussion_${Date.now()}_${user.id}`;
    
    // Create discussion data
    const discussionData = {
      id: discussionId,
      title: title.trim(),
      content: content.trim(),
      category: category || 'General',
      authorId: user.id,
      author: {
        name: userData.name,
        role: userData.role,
        level: userData.level || 1,
        avatar: userData.role === 'student' ? '🎓' : 
                userData.role === 'teacher' ? '🧑‍🏫' : '👩‍💼'
      },
      replies: [],
      views: 0,
      isHot: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    // Save discussion
    await kv.set(`community_discussion:${discussionId}`, discussionData);

    // Add to user's discussions list
    const userDiscussionsKey = `user_discussions:${user.id}`;
    let userDiscussions = await kv.get(userDiscussionsKey) || [];
    userDiscussions.unshift(discussionId);
    await kv.set(userDiscussionsKey, userDiscussions);

    // Update community stats
    await updateCommunityStats('discussions');

    // Award XP for creating discussion
    userData.xp = (userData.xp || 0) + 50;
    userData.dailyXP = (userData.dailyXP || 0) + 50;
    await kv.set(`user:${user.id}`, userData);

    console.log(`New discussion created by ${user.id}: ${discussionId}`);

    return c.json({
      success: true,
      discussion: discussionData,
      xpGained: 50
    });

  } catch (error) {
    console.error("Error creating discussion:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Get community discussions
app.get("/make-server-5ea56f4e/community/discussions", async (c) => {
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

    // Get all discussions
    const allDiscussions = await kv.getByPrefix('community_discussion:');
    
    // Sort by last activity (newest first)
    const sortedDiscussions = allDiscussions.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    // Add computed fields and mark hot discussions
    const discussionsWithStats = sortedDiscussions.map(discussion => {
      const repliesCount = discussion.replies?.length || 0;
      const daysSinceCreated = (Date.now() - new Date(discussion.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const isHot = repliesCount > 10 && daysSinceCreated < 3;

      return {
        ...discussion,
        repliesCount,
        isHot,
        lastActivity: getRelativeTime(discussion.lastActivity)
      };
    });

    return c.json({
      success: true,
      discussions: discussionsWithStats
    });

  } catch (error) {
    console.error("Error fetching discussions:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Get community statistics
app.get("/make-server-5ea56f4e/community/stats", async (c) => {
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

    // Get community stats (with defaults)
    const stats = await kv.get('community_stats') || {
      totalMembers: 0,
      postsToday: 0,
      activeDiscussions: 0,
      totalPosts: 0,
      totalDiscussions: 0,
      lastUpdated: new Date().toISOString()
    };

    // Get recent activity counts
    const allPosts = await kv.getByPrefix('community_post:');
    const allDiscussions = await kv.getByPrefix('community_discussion:');
    const allUsers = await kv.getByPrefix('user:');

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const postsToday = allPosts.filter(post => 
      new Date(post.createdAt) >= todayStart
    ).length;

    const activeDiscussions = allDiscussions.filter(discussion => {
      const lastActivity = new Date(discussion.lastActivity);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity <= 7; // Active in last 7 days
    }).length;

    const activeMembers = allUsers.filter(user => {
      const lastActivity = user.lastActivity ? new Date(user.lastActivity) : new Date(user.createdAt);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity <= 30; // Active in last 30 days
    }).length;

    const updatedStats = {
      totalMembers: allUsers.length,
      activeMembers,
      postsToday,
      activeDiscussions,
      totalPosts: allPosts.length,
      totalDiscussions: allDiscussions.length,
      lastUpdated: new Date().toISOString()
    };

    // Save updated stats
    await kv.set('community_stats', updatedStats);

    return c.json({
      success: true,
      stats: updatedStats
    });

  } catch (error) {
    console.error("Error fetching community stats:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Get trending topics
app.get("/make-server-5ea56f4e/community/trending", async (c) => {
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

    // Get all posts from the last 7 days
    const allPosts = await kv.getByPrefix('community_post:');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentPosts = allPosts.filter(post => 
      new Date(post.createdAt) >= weekAgo
    );

    // Count tag frequencies
    const tagCounts = {};
    recentPosts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase();
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        });
      }
    });

    // Also extract keywords from content
    const keywordCounts = {};
    const aiKeywords = ['ia', 'ai', 'machine learning', 'ml', 'deep learning', 'nlp', 'cnn', 'rnn', 'neural', 'algorithm', 'data', 'model'];
    
    recentPosts.forEach(post => {
      const content = post.content.toLowerCase();
      aiKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      });
    });

    // Combine and sort trending topics
    const allTopics = { ...tagCounts, ...keywordCounts };
    const trendingTopics = Object.entries(allTopics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({
        topic: `#${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        count,
        trend: count > 3 ? 'up' : 'stable'
      }));

    return c.json({
      success: true,
      trending: trendingTopics
    });

  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Helper function to update community stats
async function updateCommunityStats(type: string) {
  try {
    let stats = await kv.get('community_stats') || {
      totalMembers: 0,
      postsToday: 0,
      activeDiscussions: 0,
      totalPosts: 0,
      totalDiscussions: 0,
      lastUpdated: new Date().toISOString()
    };

    if (type === 'posts') {
      stats.totalPosts = (stats.totalPosts || 0) + 1;
      
      // Check if it's today
      const today = new Date().toDateString();
      const lastUpdated = new Date(stats.lastUpdated).toDateString();
      
      if (today === lastUpdated) {
        stats.postsToday = (stats.postsToday || 0) + 1;
      } else {
        stats.postsToday = 1; // Reset for new day
      }
    } else if (type === 'discussions') {
      stats.totalDiscussions = (stats.totalDiscussions || 0) + 1;
      stats.activeDiscussions = (stats.activeDiscussions || 0) + 1;
    }

    stats.lastUpdated = new Date().toISOString();
    await kv.set('community_stats', stats);
    
  } catch (error) {
    console.error('Error updating community stats:', error);
  }
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'ahora';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} día${days > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  }
}

// Start the server
// Create course (teacher only)
app.post("/make-server-5ea56f4e/teacher/courses", async (c) => {
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

    // Verify user is a teacher
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'teacher') {
      return c.json({ error: "Access denied. Teacher role required." }, 403);
    }

    const { title, description, lessons, difficulty, courseCode } = await c.req.json();
    if (!title || !description) {
      return c.json({ error: "Title and description are required" }, 400);
    }

    // Create course
    const courseId = `custom-${Date.now()}`;
    const courseData = {
      id: courseId,
      title,
      description,
      lessons: lessons || 8,
      difficulty: difficulty || 'beginner',
      courseCode: courseCode || `ANIUET-${String(Math.floor(Math.random() * 900) + 100)}`,
      createdBy: user.id,
      createdByName: userData.name,
      createdAt: new Date().toISOString(),
      status: 'active',
      enrolledStudents: [],
      totalStudents: 0
    };

    // Store course
    await kv.set(`course:${courseId}`, courseData);

    return c.json({
      success: true,
      message: "Course created successfully",
      course: courseData
    });

  } catch (error) {
    console.error("Error creating course:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Get course progress for teacher
app.get("/make-server-5ea56f4e/teacher/courses/:courseId/progress", async (c) => {
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

    // Verify user is a teacher
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'teacher') {
      return c.json({ error: "Access denied. Teacher role required." }, 403);
    }

    const courseId = c.req.param('courseId');
    if (!courseId) {
      return c.json({ error: "Course ID is required" }, 400);
    }

    // Get all students and their progress for this course
    const allUsers = await kv.getByPrefix('user:');
    const studentsWithProgress = [];
    let totalProgress = 0;
    let completedStudents = 0;
    let atRiskStudents = 0;

    for (const student of allUsers) {
      if (student.role === 'student' && student.enrollments) {
        const enrollment = student.enrollments.find(e => e.courseId === courseId);
        if (enrollment) {
          const studentProgress = {
            id: student.id,
            name: student.name,
            email: student.email,
            progress: enrollment.progress || 0,
            completedLessons: enrollment.completedLessons?.length || 0,
            totalLessons: 8, // Default
            lastActivity: enrollment.lastAccessedAt || enrollment.enrolledAt,
            status: enrollment.progress >= 80 ? 'active' : 
                    enrollment.progress === 0 ? 'inactive' : 
                    enrollment.progress < 40 ? 'at-risk' : 'active',
            xpEarned: enrollment.completedLessons?.reduce((sum, lesson) => sum + (lesson.xpEarned || 0), 0) || 0
          };
          
          studentsWithProgress.push(studentProgress);
          totalProgress += studentProgress.progress;
          
          if (studentProgress.progress >= 80) completedStudents++;
          if (studentProgress.status === 'at-risk' || studentProgress.status === 'inactive') {
            atRiskStudents++;
          }
        }
      }
    }

    const averageProgress = studentsWithProgress.length > 0 
      ? Math.round(totalProgress / studentsWithProgress.length) 
      : 0;

    const progressData = {
      courseId,
      courseName: `Course ${courseId}`,
      totalStudents: studentsWithProgress.length,
      averageProgress,
      completedStudents,
      atRiskStudents,
      students: studentsWithProgress
    };

    return c.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error("Error fetching course progress:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Initialize mock courses endpoint (for debugging)
app.post("/make-server-5ea56f4e/init-mock-courses", async (c) => {
  try {
    console.log("🚀 Initializing mock courses with complete lesson data...");
    
    // Fundamentos de IA - Complete course with all properties for editor
    const introAICourse = {
      id: 'intro-ai',
      title: 'Fundamentos de IA',
      description: 'Conceptos básicos y aplicaciones de la inteligencia artificial',
      difficulty: 'beginner',
      courseCode: 'ANIUET-001',
      type: 'mock',
      status: 'active',
      createdAt: new Date().toISOString(),
      lessons: [
        {
          id: 'intro-1',
          title: 'Introducción a la IA',
          description: 'Conceptos básicos sobre la inteligencia artificial',
          type: 'reading',
          content: '# Introducción a la Inteligencia Artificial\n\nLa inteligencia artificial (IA) es el campo de la informática que se centra en crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana.',
          videoUrl: '',
          pdfUrl: '',
          xp: 100,
          estimatedTime: '15 min',
          duration: 15,
          order: 0,
          locked: false,
          position: { x: 20, y: 80 },
          connections: ['history-1'],
          prerequisites: []
        },
        {
          id: 'history-1',
          title: 'Historia de la IA',
          description: 'Desde Turing hasta las redes neuronales modernas',
          type: 'reading',
          content: '# Historia de la Inteligencia Artificial\n\nDesde los primeros conceptos de Alan Turing hasta las redes neuronales modernas.',
          videoUrl: '',
          pdfUrl: '',
          xp: 75,
          estimatedTime: '20 min',
          duration: 20,
          order: 1,
          locked: false,
          position: { x: 45, y: 60 },
          connections: ['intro-3'],
          prerequisites: ['intro-1']
        },
        {
          id: 'intro-3',
          title: 'Tipos de IA',
          description: 'IA débil, fuerte, machine learning y deep learning',
          type: 'practice',
          content: '# Tipos de Inteligencia Artificial\n\nExisten diferentes clasificaciones de IA según su capacidad y funcionalidad.',
          videoUrl: '',
          pdfUrl: '',
          xp: 150,
          estimatedTime: '25 min',
          duration: 25,
          order: 2,
          locked: true,
          position: { x: 70, y: 40 },
          connections: ['intro-4'],
          prerequisites: ['history-1']
        },
        {
          id: 'intro-4',
          title: 'Aplicaciones prácticas',
          description: 'Casos de uso reales de la IA en diferentes industrias',
          type: 'project',
          content: '# Aplicaciones Prácticas de la IA\n\nLa IA se utiliza en múltiples industrias y casos de uso.',
          videoUrl: '',
          pdfUrl: '',
          xp: 200,
          estimatedTime: '30 min',
          duration: 30,
          order: 3,
          locked: true,
          position: { x: 90, y: 20 },
          connections: [],
          prerequisites: ['intro-3']
        }
      ]
    };
    
    // Machine Learning - Complete course with all properties
    const mlCourse = {
      id: 'machine-learning',
      title: 'Machine Learning Básico',
      description: 'Introducción al aprendizaje automático y sus algoritmos',
      difficulty: 'intermediate',
      courseCode: 'ANIUET-002',
      type: 'mock',
      status: 'active',
      createdAt: new Date().toISOString(),
      lessons: [
        {
          id: 'ml-1',
          title: 'Conceptos básicos de ML',
          description: 'Introducción al Machine Learning y sus fundamentos',
          type: 'reading',
          content: '# Conceptos Básicos de Machine Learning\\n\\nEl Machine Learning es una rama de la IA que permite a las máquinas aprender de los datos.',
          videoUrl: '',
          pdfUrl: '',
          xp: 120,
          estimatedTime: '20 min',
          duration: 20,
          order: 0,
          locked: false,
          position: { x: 20, y: 80 },
          connections: ['ml-2'],
          prerequisites: []
        },
        {
          id: 'ml-2',
          title: 'Algoritmos supervisados',
          description: 'Aprendizaje supervisado y sus aplicaciones',
          type: 'practice',
          content: '# Algoritmos Supervisados\\n\\nEl aprendizaje supervisado utiliza datos etiquetados para entrenar modelos.',
          videoUrl: '',
          pdfUrl: '',
          xp: 180,
          estimatedTime: '30 min',
          duration: 30,
          order: 1,
          locked: true,
          position: { x: 45, y: 60 },
          connections: ['ml-3'],
          prerequisites: ['ml-1']
        },
        {
          id: 'ml-3',
          title: 'Algoritmos no supervisados',
          description: 'Clustering y reducción de dimensionalidad',
          type: 'practice',
          content: '# Algoritmos No Supervisados\\n\\nTécnicas para encontrar patrones en datos sin etiquetas.',
          videoUrl: '',
          pdfUrl: '',
          xp: 180,
          estimatedTime: '30 min',
          duration: 30,
          order: 2,
          locked: true,
          position: { x: 70, y: 40 },
          connections: ['ml-4'],
          prerequisites: ['ml-2']
        },
        {
          id: 'ml-4',
          title: 'Proyecto final',
          description: 'Implementa un modelo de ML completo',
          type: 'project',
          content: '# Proyecto Final de ML\\n\\nCrea un modelo de clasificación usando todo lo aprendido.',
          videoUrl: '',
          pdfUrl: '',
          xp: 250,
          estimatedTime: '60 min',
          duration: 60,
          order: 3,
          locked: true,
          position: { x: 90, y: 20 },
          connections: [],
          prerequisites: ['ml-3']
        }
      ]
    };
    
    // Deep Learning - Complete course with all properties
    const dlCourse = {
      id: 'deep-learning',
      title: 'Deep Learning Avanzado',
      description: 'Redes neuronales profundas y arquitecturas modernas',
      difficulty: 'advanced',
      courseCode: 'ANIUET-003',
      type: 'mock',
      status: 'active',
      createdAt: new Date().toISOString(),
      lessons: [
        {
          id: 'dl-1',
          title: 'Redes neuronales',
          description: 'Fundamentos de las redes neuronales artificiales',
          type: 'reading',
          content: '# Redes Neuronales\\n\\nLas redes neuronales son la base del deep learning moderno.',
          videoUrl: '',
          pdfUrl: '',
          xp: 150,
          estimatedTime: '25 min',
          duration: 25,
          order: 0,
          locked: false,
          position: { x: 20, y: 80 },
          connections: ['dl-2'],
          prerequisites: []
        },
        {
          id: 'dl-2',
          title: 'CNN y RNN',
          description: 'Redes convolucionales y recurrentes',
          type: 'practice',
          content: '# CNN y RNN\\n\\nArquitecturas especializadas para imágenes y secuencias.',
          videoUrl: '',
          pdfUrl: '',
          xp: 200,
          estimatedTime: '35 min',
          duration: 35,
          order: 1,
          locked: true,
          position: { x: 45, y: 60 },
          connections: ['dl-3'],
          prerequisites: ['dl-1']
        },
        {
          id: 'dl-3',
          title: 'Transformers',
          description: 'Arquitectura Transformer y modelos de atención',
          type: 'practice',
          content: '# Transformers\\n\\nLa arquitectura revolucionaria detrás de GPT y BERT.',
          videoUrl: '',
          pdfUrl: '',
          xp: 250,
          estimatedTime: '40 min',
          duration: 40,
          order: 2,
          locked: true,
          position: { x: 70, y: 40 },
          connections: ['dl-4'],
          prerequisites: ['dl-2']
        },
        {
          id: 'dl-4',
          title: 'Proyecto avanzado',
          description: 'Construye un modelo transformer desde cero',
          type: 'project',
          content: '# Proyecto Avanzado de Deep Learning\\n\\nImplementa tu propio transformer.',
          videoUrl: '',
          pdfUrl: '',
          xp: 300,
          estimatedTime: '90 min',
          duration: 90,
          order: 3,
          locked: true,
          position: { x: 90, y: 20 },
          connections: [],
          prerequisites: ['dl-3']
        }
      ]
    };

    const mockCourses = [introAICourse, mlCourse, dlCourse];
    const createdCourses = [];
    
    for (const course of mockCourses) {
      await kv.set(`mock_course:${course.id}`, course);
      createdCourses.push(course);
      console.log(`✅ Created/Updated mock course ${course.id} with ${course.lessons.length} lessons and code ${course.courseCode}`);
    }

    return c.json({
      success: true,
      message: "Mock courses initialized successfully with complete lesson data",
      courses: createdCourses
    });

  } catch (error) {
    console.error("❌ Error initializing mock courses:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// Join course with code (student)
app.post("/make-server-5ea56f4e/student/join-class", async (c) => {
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

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: "User profile not found" }, 404);
    }

    const { inviteCode } = await c.req.json();
    if (!inviteCode) {
      return c.json({ error: "Invite code is required" }, 400);
    }

    // Find course by code in mock courses first
    const mockCourseCode = inviteCode.toUpperCase();
    console.log(`🔍 Student trying to join with code: ${mockCourseCode}`);
    
    // Get existing mock courses first (they should already exist with full lesson data)
    let mockCourses = await kv.getByPrefix('mock_course:');
    
    // If mock courses don't exist or are incomplete, create them
    if (mockCourses.length === 0 || !mockCourses[0].lessons) {
      console.log('📝 Creating mock courses with full lesson data...');
      
      // Use the same structure as init-mock-courses endpoint with complete data
      const introAI = {
        id: 'intro-ai',
        title: 'Fundamentos de IA',
        description: 'Conceptos básicos y aplicaciones de la inteligencia artificial',
        difficulty: 'beginner',
        courseCode: 'ANIUET-001',
        type: 'mock',
        status: 'active',
        lessons: [
          {
            id: 'intro-1',
            title: 'Introducción a la IA',
            description: 'Conceptos básicos sobre la inteligencia artificial',
            type: 'reading',
            content: '# Introducción a la Inteligencia Artificial\\n\\nLa inteligencia artificial (IA) es el campo de la informática que se centra en crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana.',
            videoUrl: '',
            pdfUrl: '',
            xp: 100,
            estimatedTime: '15 min',
            duration: 15,
            order: 0,
            locked: false,
            position: { x: 20, y: 80 },
            connections: ['history-1'],
            prerequisites: []
          },
          {
            id: 'history-1',
            title: 'Historia de la IA',
            description: 'Desde Turing hasta las redes neuronales modernas',
            type: 'reading',
            content: '# Historia de la Inteligencia Artificial\\n\\nDesde los primeros conceptos de Alan Turing hasta las redes neuronales modernas.',
            videoUrl: '',
            pdfUrl: '',
            xp: 75,
            estimatedTime: '20 min',
            duration: 20,
            order: 1,
            locked: false,
            position: { x: 45, y: 60 },
            connections: ['intro-3'],
            prerequisites: ['intro-1']
          },
          {
            id: 'intro-3',
            title: 'Tipos de IA',
            description: 'IA débil, fuerte, machine learning y deep learning',
            type: 'practice',
            content: '# Tipos de Inteligencia Artificial\\n\\nExisten diferentes clasificaciones de IA según su capacidad y funcionalidad.',
            videoUrl: '',
            pdfUrl: '',
            xp: 150,
            estimatedTime: '25 min',
            duration: 25,
            order: 2,
            locked: true,
            position: { x: 70, y: 40 },
            connections: ['intro-4'],
            prerequisites: ['history-1']
          },
          {
            id: 'intro-4',
            title: 'Aplicaciones prácticas',
            description: 'Casos de uso reales de la IA en diferentes industrias',
            type: 'project',
            content: '# Aplicaciones Prácticas de la IA\\n\\nLa IA se utiliza en múltiples industrias y casos de uso.',
            videoUrl: '',
            pdfUrl: '',
            xp: 200,
            estimatedTime: '30 min',
            duration: 30,
            order: 3,
            locked: true,
            position: { x: 90, y: 20 },
            connections: [],
            prerequisites: ['intro-3']
          }
        ]
      };
      
      const ml = {
        id: 'machine-learning',
        title: 'Machine Learning Básico',
        description: 'Introducción al aprendizaje automático',
        difficulty: 'intermediate',
        courseCode: 'ANIUET-002',
        type: 'mock',
        status: 'active',
        lessons: [
          {
            id: 'ml-1',
            title: 'Conceptos básicos de ML',
            description: 'Introducción al Machine Learning y sus fundamentos',
            type: 'reading',
            content: '# Conceptos Básicos de Machine Learning\\n\\nEl Machine Learning es una rama de la IA que permite a las máquinas aprender de los datos.',
            videoUrl: '',
            pdfUrl: '',
            xp: 120,
            estimatedTime: '20 min',
            duration: 20,
            order: 0,
            locked: false,
            position: { x: 20, y: 80 },
            connections: ['ml-2'],
            prerequisites: []
          },
          {
            id: 'ml-2',
            title: 'Algoritmos supervisados',
            description: 'Aprendizaje supervisado y sus aplicaciones',
            type: 'practice',
            content: '# Algoritmos Supervisados\\n\\nEl aprendizaje supervisado utiliza datos etiquetados para entrenar modelos.',
            videoUrl: '',
            pdfUrl: '',
            xp: 180,
            estimatedTime: '30 min',
            duration: 30,
            order: 1,
            locked: true,
            position: { x: 45, y: 60 },
            connections: [],
            prerequisites: ['ml-1']
          }
        ]
      };
      
      const dl = {
        id: 'deep-learning',
        title: 'Deep Learning Avanzado',
        description: 'Redes neuronales profundas',
        difficulty: 'advanced',
        courseCode: 'ANIUET-003',
        type: 'mock',
        status: 'active',
        lessons: [
          {
            id: 'dl-1',
            title: 'Redes neuronales',
            description: 'Fundamentos de las redes neuronales artificiales',
            type: 'reading',
            content: '# Redes Neuronales\\n\\nLas redes neuronales son la base del deep learning moderno.',
            videoUrl: '',
            pdfUrl: '',
            xp: 150,
            estimatedTime: '25 min',
            duration: 25,
            order: 0,
            locked: false,
            position: { x: 20, y: 80 },
            connections: ['dl-2'],
            prerequisites: []
          },
          {
            id: 'dl-2',
            title: 'CNN y RNN',
            description: 'Redes convolucionales y recurrentes',
            type: 'practice',
            content: '# CNN y RNN\\n\\nArquitecturas especializadas para imágenes y secuencias.',
            videoUrl: '',
            pdfUrl: '',
            xp: 200,
            estimatedTime: '35 min',
            duration: 35,
            order: 1,
            locked: true,
            position: { x: 45, y: 60 },
            connections: [],
            prerequisites: ['dl-1']
          }
        ]
      };
      
      mockCourses = [introAI, ml, dl];
      for (const course of mockCourses) {
        await kv.set(`mock_course:${course.id}`, course);
      }
    }

    console.log(`📚 Forced recreation of ${mockCourses.length} mock courses`);
    console.log('📋 Available mock courses:', mockCourses.map(c => `${c.courseCode} - ${c.title}`));
    
    let course = mockCourses.find(c => c.courseCode === mockCourseCode);
    console.log(`🎯 Direct search result: ${course ? 'FOUND' : 'NOT FOUND'}`);
    
    // If not found in mock courses, check custom courses
    if (!course) {
      console.log('🔍 Searching in custom courses...');
      const allCourses = await kv.getByPrefix('course:');
      console.log(`📊 Found ${allCourses.length} custom courses`);
      course = allCourses.find(c => c.courseCode === mockCourseCode);
      console.log(`🎯 Custom course search result: ${course ? 'FOUND' : 'NOT FOUND'}`);
    }

    if (!course) {
      console.log(`❌ Course not found for code: ${mockCourseCode}`);
      console.log('📚 Available mock codes:', mockCourses.map(c => c.courseCode));
      const allCourses = await kv.getByPrefix('course:');
      console.log('🏫 Available custom codes:', allCourses.map(c => c.courseCode));
      
      return c.json({ 
        error: "Código de curso inválido. Verifica que el código sea correcto.",
        debug: {
          searchedCode: mockCourseCode,
          availableMockCodes: mockCourses.map(c => c.courseCode),
          availableCustomCodes: allCourses.map(c => c.courseCode),
          totalCoursesSearched: mockCourses.length + allCourses.length
        }
      }, 404);
    }

    console.log(`✅ Found course: ${course.title} (${course.courseCode})`)

    // Check if already enrolled
    if (!userData.enrolledCourses) userData.enrolledCourses = [];
    if (!userData.enrollments) userData.enrollments = [];

    const isAlreadyEnrolled = userData.enrolledCourses.includes(course.id) ||
      userData.enrollments.some(e => e.courseId === course.id);

    if (isAlreadyEnrolled) {
      console.log(`📚 User ${user.id} already enrolled in course ${course.id}`);
      
      // Get the existing enrollment details
      const existingEnrollment = userData.enrollments.find(e => e.courseId === course.id);
      
      return c.json({ 
        success: true,
        message: `Ya estás inscrito en "${course.title}". ¡Continúa tu aprendizaje!`,
        course: {
          id: course.id,
          title: course.title,
          description: course.description || 'Curso de IA'
        },
        enrollment: existingEnrollment,
        alreadyEnrolled: true,
        xpGained: 0
      }, 200);
    }

    // Create enrollment
    const enrollmentData = {
      courseId: course.id,
      enrolledAt: new Date().toISOString(),
      enrolledVia: 'course_code',
      progress: 0,
      completedLessons: [],
      startedAt: null,
      completedAt: null,
      lastAccessedAt: new Date().toISOString()
    };

    // Add to student's records
    userData.enrolledCourses.push(course.id);
    userData.enrollments.push(enrollmentData);
    userData.xp = (userData.xp || 0) + 50;
    userData.lastActivity = new Date().toISOString();

    // Save updated student data
    await kv.set(`user:${user.id}`, userData);

    // If this is a mock course, try to establish teacher-student relationships 
    // with all teachers who have this course
    if (course.type === 'mock') {
      try {
        const allUsers = await kv.getByPrefix('user:');
        const teachers = allUsers.filter(u => u.role === 'teacher');
        
        for (const teacher of teachers) {
          // Add student to each teacher's list (they can manage anyone who joins mock courses)
          const teacherStudentKey = `teacher_students:${teacher.id}`;
          let teacherStudents = await kv.get(teacherStudentKey) || [];
          
          if (!teacherStudents.includes(user.id)) {
            teacherStudents.push(user.id);
            await kv.set(teacherStudentKey, teacherStudents);
            
            // Also add teacher to student's teachers list
            const studentTeacherKey = `student_teachers:${user.id}`;
            let studentTeachers = await kv.get(studentTeacherKey) || [];
            if (!studentTeachers.includes(teacher.id)) {
              studentTeachers.push(teacher.id);
              await kv.set(studentTeacherKey, studentTeachers);
            }
          }
        }
        console.log(`✅ Student ${user.id} associated with all teachers for mock course monitoring`);
      } catch (relationError) {
        console.error('Error establishing teacher-student relationships:', relationError);
        // Don't fail the enrollment if relationship setup fails
      }
    }

    return c.json({
      success: true,
      message: "Inscrito exitosamente en el curso",
      course: {
        id: course.id,
        title: course.title,
        description: course.description || 'Curso de IA'
      },
      enrollment: enrollmentData,
      xpGained: 50
    });

  } catch (error) {
    console.error("Error joining course with code:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// ============================================
// GOALS ENDPOINTS - Sistema de Objetivos
// ============================================

/**
 * Get user's goals
 * Obtiene todos los objetivos del usuario (activos y completados)
 */
app.get("/make-server-5ea56f4e/goals", async (c) => {
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

    console.log(`Fetching goals for user: ${user.id}`);

    // Get user's goals from KV store
    const userGoalsKey = `user_goals:${user.id}`;
    let goals = await kv.get(userGoalsKey) || [];

    // Get user data to update real-time progress
    const userData = await kv.get(`user:${user.id}`);
    
    if (userData) {
      // Update progress for goals based on user data
      goals = goals.map(goal => {
        let currentValue = goal.currentValue;
        
        // Auto-update progress based on goal type
        switch (goal.type) {
          case 'xp':
            currentValue = userData.xp || 0;
            break;
          case 'streak':
            currentValue = userData.currentStreak || 0;
            break;
          case 'courses':
            currentValue = userData.enrolledCourses?.length || 0;
            break;
          case 'lessons':
            const completedLessons = userData.enrollments?.reduce((total, enrollment) => {
              return total + (enrollment.completedLessons?.length || 0);
            }, 0) || 0;
            currentValue = completedLessons;
            break;
        }
        
        // Check if goal is completed
        const isCompleted = currentValue >= goal.targetValue && goal.status === 'active';
        
        return {
          ...goal,
          currentValue,
          status: isCompleted ? 'completed' : goal.status
        };
      });
      
      // Save updated goals
      await kv.set(userGoalsKey, goals);
    }

    return c.json({
      success: true,
      goals
    });

  } catch (error) {
    console.error("Error fetching goals:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Create a new goal
 * Crea un nuevo objetivo para el usuario
 */
app.post("/make-server-5ea56f4e/goals", async (c) => {
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

    const goalData = await c.req.json();
    const { title, description, type, targetValue, deadline, xpReward, isPredefined } = goalData;

    // Validate required fields
    if (!title || !type || !targetValue) {
      return c.json({ error: "Title, type, and target value are required" }, 400);
    }

    if (targetValue <= 0) {
      return c.json({ error: "Target value must be greater than 0" }, 400);
    }

    console.log(`Creating goal for user ${user.id}:`, title);

    // Get user data to determine initial current value
    const userData = await kv.get(`user:${user.id}`);
    let currentValue = 0;

    switch (type) {
      case 'xp':
        currentValue = userData?.xp || 0;
        break;
      case 'streak':
        currentValue = userData?.currentStreak || 0;
        break;
      case 'courses':
        currentValue = userData?.enrolledCourses?.length || 0;
        break;
      case 'lessons':
        const completedLessons = userData?.enrollments?.reduce((total, enrollment) => {
          return total + (enrollment.completedLessons?.length || 0);
        }, 0) || 0;
        currentValue = completedLessons;
        break;
    }

    // Create new goal
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newGoal = {
      id: goalId,
      title: title.trim(),
      description: description?.trim() || '',
      type,
      targetValue,
      currentValue,
      deadline: deadline || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      xpReward: xpReward || 50,
      isPredefined: isPredefined || false,
      userId: user.id
    };

    // Get user's goals
    const userGoalsKey = `user_goals:${user.id}`;
    let goals = await kv.get(userGoalsKey) || [];

    // Add new goal
    goals.push(newGoal);
    await kv.set(userGoalsKey, goals);

    console.log(`Goal created successfully: ${goalId}`);

    return c.json({
      success: true,
      message: "Goal created successfully",
      goal: newGoal
    });

  } catch (error) {
    console.error("Error creating goal:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Update goal progress
 * Actualiza el progreso de un objetivo
 */
app.post("/make-server-5ea56f4e/goals/:goalId/progress", async (c) => {
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

    const goalId = c.req.param('goalId');
    const { newValue } = await c.req.json();

    if (newValue === undefined || newValue < 0) {
      return c.json({ error: "Valid new value is required" }, 400);
    }

    console.log(`Updating goal ${goalId} progress to ${newValue} for user ${user.id}`);

    // Get user's goals
    const userGoalsKey = `user_goals:${user.id}`;
    let goals = await kv.get(userGoalsKey) || [];

    // Find the goal
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) {
      return c.json({ error: "Goal not found" }, 404);
    }

    const goal = goals[goalIndex];

    // Check if goal is already completed
    if (goal.status === 'completed') {
      return c.json({ 
        success: true,
        message: "Goal already completed",
        goal,
        goalCompleted: false
      });
    }

    // Update progress
    goal.currentValue = newValue;

    // Check if goal is completed
    let goalCompleted = false;
    let xpGained = 0;

    if (goal.currentValue >= goal.targetValue) {
      goal.status = 'completed';
      goal.completedAt = new Date().toISOString();
      goalCompleted = true;
      xpGained = goal.xpReward;

      // Award XP to user
      const userData = await kv.get(`user:${user.id}`);
      if (userData) {
        userData.xp = (userData.xp || 0) + xpGained;
        userData.dailyXP = (userData.dailyXP || 0) + xpGained;
        await kv.set(`user:${user.id}`, userData);
      }

      console.log(`Goal ${goalId} completed! Awarded ${xpGained} XP to user ${user.id}`);
    }

    // Save updated goals
    goals[goalIndex] = goal;
    await kv.set(userGoalsKey, goals);

    return c.json({
      success: true,
      message: goalCompleted ? "Goal completed!" : "Progress updated",
      goal,
      goalCompleted,
      xpGained
    });

  } catch (error) {
    console.error("Error updating goal progress:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Delete a goal
 * Elimina un objetivo del usuario
 */
app.delete("/make-server-5ea56f4e/goals/:goalId", async (c) => {
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

    const goalId = c.req.param('goalId');

    console.log(`Deleting goal ${goalId} for user ${user.id}`);

    // Get user's goals
    const userGoalsKey = `user_goals:${user.id}`;
    let goals = await kv.get(userGoalsKey) || [];

    // Filter out the goal
    const filteredGoals = goals.filter(g => g.id !== goalId);

    if (filteredGoals.length === goals.length) {
      return c.json({ error: "Goal not found" }, 404);
    }

    // Save updated goals
    await kv.set(userGoalsKey, filteredGoals);

    console.log(`Goal ${goalId} deleted successfully`);

    return c.json({
      success: true,
      message: "Goal deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting goal:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// ============================================
// COMMUNITY ENDPOINTS - Sistema de Comunidad
// ============================================

/**
 * Get community posts
 * Obtiene los posts de la comunidad
 */
app.get("/make-server-5ea56f4e/community/posts", async (c) => {
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

    console.log(`Fetching community posts for user: ${user.id}`);

    // Get all community posts
    let allPosts = await kv.get('community_posts') || [];

    // Initialize with sample posts if empty
    if (allPosts.length === 0) {
      allPosts = [
        {
          id: 'post_sample_1',
          content: '¡Acabo de completar mi primer modelo de clasificación con redes neuronales! 🎉 La precisión llegó al 94%. ¿Algún consejo para optimizarlo aún más?',
          author: {
            id: 'system',
            name: 'Ana García',
            role: 'student',
            level: 15
          },
          tags: ['Machine Learning', 'Redes Neuronales'],
          type: 'post',
          likesCount: 23,
          commentsCount: 7,
          comments: [],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'post_sample_2',
          content: 'Compartiendo un recurso increíble sobre procesamiento de lenguaje natural que encontré. Link en los comentarios 📚',
          author: {
            id: 'system',
            name: 'Carlos Ruiz',
            role: 'teacher',
            level: 28
          },
          tags: ['NLP', 'Recursos'],
          type: 'post',
          likesCount: 45,
          commentsCount: 12,
          comments: [],
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'post_sample_3',
          content: '¿Alguien más está emocionado por el nuevo curso de Computer Vision? 👀 Las aplicaciones prácticas se ven increíbles.',
          author: {
            id: 'system',
            name: 'María López',
            role: 'professional',
            level: 22
          },
          tags: ['Computer Vision', 'Cursos'],
          type: 'post',
          likesCount: 18,
          commentsCount: 5,
          comments: [],
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        }
      ];
      await kv.set('community_posts', allPosts);
    }

    // Get user data for likes
    const userLikes = await kv.get(`user_post_likes:${user.id}`) || [];

    // Enhance posts with user like status
    const postsWithLikes = allPosts.map(post => ({
      ...post,
      isLikedByUser: userLikes.includes(post.id)
    }));

    // Sort by creation date (newest first)
    postsWithLikes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({
      success: true,
      posts: postsWithLikes
    });

  } catch (error) {
    console.error("Error fetching community posts:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Create a community post
 * Crea un nuevo post en la comunidad
 */
app.post("/make-server-5ea56f4e/community/posts", async (c) => {
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

    const { content, tags, type } = await c.req.json();

    if (!content?.trim()) {
      return c.json({ error: "Content is required" }, 400);
    }

    console.log(`Creating post for user: ${user.id}`);

    // Get user data
    const userData = await kv.get(`user:${user.id}`);

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newPost = {
      id: postId,
      content: content.trim(),
      author: {
        id: user.id,
        name: userData?.name || 'Usuario',
        role: userData?.role || 'student',
        level: userData?.level || 1
      },
      tags: tags || [],
      type: type || 'post',
      likesCount: 0,
      commentsCount: 0,
      comments: [],
      createdAt: new Date().toISOString()
    };

    // Add to community posts
    const allPosts = await kv.get('community_posts') || [];
    allPosts.unshift(newPost);
    await kv.set('community_posts', allPosts);

    // Award XP
    const xpGained = 10;
    if (userData) {
      userData.xp = (userData.xp || 0) + xpGained;
      await kv.set(`user:${user.id}`, userData);
    }

    console.log(`Post created successfully: ${postId}`);

    return c.json({
      success: true,
      post: newPost,
      xpGained
    });

  } catch (error) {
    console.error("Error creating post:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Toggle like on a post
 * Da o quita like a un post
 */
app.post("/make-server-5ea56f4e/community/posts/:postId/like", async (c) => {
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

    const postId = c.req.param('postId');

    console.log(`Toggling like on post ${postId} for user ${user.id}`);

    // Get user's likes
    const userLikesKey = `user_post_likes:${user.id}`;
    let userLikes = await kv.get(userLikesKey) || [];

    // Get all posts
    const allPosts = await kv.get('community_posts') || [];
    const postIndex = allPosts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
      return c.json({ error: "Post not found" }, 404);
    }

    let liked = false;
    
    if (userLikes.includes(postId)) {
      // Unlike
      userLikes = userLikes.filter(id => id !== postId);
      allPosts[postIndex].likesCount = Math.max(0, (allPosts[postIndex].likesCount || 0) - 1);
      liked = false;
    } else {
      // Like
      userLikes.push(postId);
      allPosts[postIndex].likesCount = (allPosts[postIndex].likesCount || 0) + 1;
      liked = true;
    }

    await kv.set(userLikesKey, userLikes);
    await kv.set('community_posts', allPosts);

    return c.json({
      success: true,
      liked,
      likesCount: allPosts[postIndex].likesCount
    });

  } catch (error) {
    console.error("Error toggling like:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Add comment to post
 * Añade un comentario a un post
 */
app.post("/make-server-5ea56f4e/community/posts/:postId/comments", async (c) => {
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

    const postId = c.req.param('postId');
    const { content } = await c.req.json();

    if (!content?.trim()) {
      return c.json({ error: "Comment content is required" }, 400);
    }

    console.log(`Adding comment to post ${postId} by user ${user.id}`);

    // Get user data
    const userData = await kv.get(`user:${user.id}`);

    // Get all posts
    const allPosts = await kv.get('community_posts') || [];
    const postIndex = allPosts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
      return c.json({ error: "Post not found" }, 404);
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newComment = {
      id: commentId,
      author: {
        id: user.id,
        name: userData?.name || 'Usuario',
        role: userData?.role || 'student'
      },
      content: content.trim(),
      likes: [],
      createdAt: new Date().toISOString()
    };

    if (!allPosts[postIndex].comments) {
      allPosts[postIndex].comments = [];
    }
    
    allPosts[postIndex].comments.push(newComment);
    allPosts[postIndex].commentsCount = (allPosts[postIndex].commentsCount || 0) + 1;

    await kv.set('community_posts', allPosts);

    // Award XP
    const xpGained = 5;
    if (userData) {
      userData.xp = (userData.xp || 0) + xpGained;
      await kv.set(`user:${user.id}`, userData);
    }

    return c.json({
      success: true,
      comment: newComment,
      xpGained
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Toggle like on a comment
 * Da o quita like a un comentario
 */
app.post("/make-server-5ea56f4e/community/posts/:postId/comments/:commentId/like", async (c) => {
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

    const postId = c.req.param('postId');
    const commentId = c.req.param('commentId');

    console.log(`Toggling like on comment ${commentId} in post ${postId} for user ${user.id}`);

    // Get all posts
    const allPosts = await kv.get('community_posts') || [];
    const postIndex = allPosts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
      return c.json({ error: "Post not found" }, 404);
    }

    const post = allPosts[postIndex];
    const commentIndex = post.comments?.findIndex(c => c.id === commentId);

    if (commentIndex === -1 || commentIndex === undefined) {
      return c.json({ error: "Comment not found" }, 404);
    }

    const comment = post.comments[commentIndex];
    if (!comment.likes) comment.likes = [];

    let liked = false;

    if (comment.likes.includes(user.id)) {
      // Unlike
      comment.likes = comment.likes.filter(id => id !== user.id);
      liked = false;
    } else {
      // Like
      comment.likes.push(user.id);
      liked = true;
    }

    await kv.set('community_posts', allPosts);

    return c.json({
      success: true,
      liked,
      likesCount: comment.likes.length
    });

  } catch (error) {
    console.error("Error toggling comment like:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Get community discussions
 * Obtiene las discusiones de la comunidad
 */
app.get("/make-server-5ea56f4e/community/discussions", async (c) => {
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

    console.log(`Fetching community discussions for user: ${user.id}`);

    // Get all discussions
    let allDiscussions = await kv.get('community_discussions') || [];

    // Initialize with sample discussions if empty
    if (allDiscussions.length === 0) {
      allDiscussions = [
        {
          id: 'discussion_sample_1',
          title: '¿Cuál es la mejor manera de manejar overfitting en modelos pequeños?',
          content: 'Estoy trabajando con un dataset limitado y mi modelo tiende a hacer overfitting. He probado con dropout y regularización L2, pero los resultados no mejoran mucho. ¿Alguna sugerencia?',
          category: 'Machine Learning',
          author: {
            id: 'system',
            name: 'Jorge Mendoza',
            role: 'student'
          },
          replies: 15,
          views: 89,
          solved: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'discussion_sample_2',
          title: 'Recursos recomendados para aprender Transformers',
          content: '¿Alguien puede recomendar buenos recursos para aprender sobre arquitecturas Transformer desde cero? Especialmente con ejemplos prácticos.',
          category: 'Deep Learning',
          author: {
            id: 'system',
            name: 'Sofía Ramírez',
            role: 'student'
          },
          replies: 23,
          views: 156,
          solved: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'discussion_sample_3',
          title: 'Implementación de IA ética en proyectos empresariales',
          content: 'Como profesional, me interesa conocer las mejores prácticas para implementar consideraciones éticas en proyectos de IA. ¿Qué frameworks o metodologías recomiendan?',
          category: 'AI Ethics',
          author: {
            id: 'system',
            name: 'Roberto Kim',
            role: 'professional'
          },
          replies: 31,
          views: 234,
          solved: false,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      await kv.set('community_discussions', allDiscussions);
    }

    // Sort by creation date (newest first)
    allDiscussions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({
      success: true,
      discussions: allDiscussions
    });

  } catch (error) {
    console.error("Error fetching discussions:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Create a discussion
 * Crea una nueva discusión
 */
app.post("/make-server-5ea56f4e/community/discussions", async (c) => {
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

    const { title, content, category } = await c.req.json();

    if (!title?.trim() || !content?.trim()) {
      return c.json({ error: "Title and content are required" }, 400);
    }

    console.log(`Creating discussion for user: ${user.id}`);

    // Get user data
    const userData = await kv.get(`user:${user.id}`);

    const discussionId = `discussion_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newDiscussion = {
      id: discussionId,
      title: title.trim(),
      content: content.trim(),
      category: category || 'General',
      author: {
        id: user.id,
        name: userData?.name || 'Usuario',
        role: userData?.role || 'student'
      },
      replies: 0,
      views: 0,
      solved: false,
      createdAt: new Date().toISOString()
    };

    // Add to discussions
    const allDiscussions = await kv.get('community_discussions') || [];
    allDiscussions.unshift(newDiscussion);
    await kv.set('community_discussions', allDiscussions);

    // Award XP
    const xpGained = 15;
    if (userData) {
      userData.xp = (userData.xp || 0) + xpGained;
      await kv.set(`user:${user.id}`, userData);
    }

    console.log(`Discussion created successfully: ${discussionId}`);

    return c.json({
      success: true,
      discussion: newDiscussion,
      xpGained
    });

  } catch (error) {
    console.error("Error creating discussion:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Get community statistics
 * Obtiene estadísticas de la comunidad
 */
app.get("/make-server-5ea56f4e/community/stats", async (c) => {
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

    console.log(`Fetching community stats`);

    // Get all users to count members
    const allUsers = await kv.getByPrefix('user:');
    const totalMembers = allUsers.length;
    
    // Count active members (users who logged in in the last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeMembers = allUsers.filter(u => {
      const lastLogin = u.lastLogin ? new Date(u.lastLogin) : new Date(0);
      return lastLogin > sevenDaysAgo;
    }).length;

    // Get posts from today
    const allPosts = await kv.get('community_posts') || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const postsToday = allPosts.filter(p => {
      const postDate = new Date(p.createdAt);
      return postDate >= today;
    }).length;

    // Get active discussions (with recent activity)
    const allDiscussions = await kv.get('community_discussions') || [];
    const activeDiscussions = allDiscussions.filter(d => !d.solved).length;

    return c.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        postsToday,
        activeDiscussions
      }
    });

  } catch (error) {
    console.error("Error fetching community stats:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Get trending topics
 * Obtiene los temas más populares
 */
app.get("/make-server-5ea56f4e/community/trending", async (c) => {
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

    console.log(`Fetching trending topics`);

    // Get all posts
    const allPosts = await kv.get('community_posts') || [];

    // Extract and count tags
    const tagCounts = {};
    allPosts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Convert to array and sort by count
    const trending = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 trending topics

    // Add some default trending topics if none exist
    if (trending.length === 0) {
      trending.push(
        { tag: 'Machine Learning', count: 45 },
        { tag: 'Deep Learning', count: 38 },
        { tag: 'NLP', count: 32 },
        { tag: 'Computer Vision', count: 28 },
        { tag: 'AI Ethics', count: 25 }
      );
    }

    return c.json({
      success: true,
      trending
    });

  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

// ============================================
// DIRECT MESSAGES ENDPOINTS - Sistema de Mensajes Directos
// ============================================

/**
 * Get user's conversations
 * Obtiene todas las conversaciones del usuario ordenadas por última actividad
 */
app.get("/make-server-5ea56f4e/messages/conversations", async (c) => {
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

    console.log(`Fetching conversations for user: ${user.id}`);

    // Get user's conversation list
    const userConversationsKey = `user_conversations:${user.id}`;
    const conversationIds = await kv.get(userConversationsKey) || [];

    const conversations = [];
    for (const convId of conversationIds) {
      const conversation = await kv.get(`conversation:${convId}`);
      if (conversation) {
        // Get participant info
        const participantId = conversation.participants.find(p => p !== user.id);
        const participantData = await kv.get(`user:${participantId}`);
        
        conversations.push({
          ...conversation,
          participantInfo: participantData ? {
            id: participantData.id,
            name: participantData.name,
            role: participantData.role,
            level: participantData.level || 1
          } : null
        });
      }
    }

    // Sort by last message time
    conversations.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return c.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Get messages from a conversation
 * Obtiene todos los mensajes de una conversación específica
 */
app.get("/make-server-5ea56f4e/messages/conversation/:conversationId", async (c) => {
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

    const conversationId = c.req.param('conversationId');
    console.log(`Fetching messages for conversation: ${conversationId}`);

    // Get conversation
    const conversation = await kv.get(`conversation:${conversationId}`);
    
    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    // Verify user is participant
    if (!conversation.participants.includes(user.id)) {
      return c.json({ error: "Access denied" }, 403);
    }

    // Mark messages as read
    conversation.messages = conversation.messages.map(msg => {
      if (msg.recipientId === user.id && !msg.read) {
        return { ...msg, read: true, readAt: new Date().toISOString() };
      }
      return msg;
    });

    // Update unread count
    const userIndex = conversation.participants.indexOf(user.id);
    if (userIndex !== -1) {
      if (!conversation.unreadCount) conversation.unreadCount = [0, 0];
      conversation.unreadCount[userIndex] = 0;
    }

    await kv.set(`conversation:${conversationId}`, conversation);

    return c.json({
      success: true,
      conversation,
      messages: conversation.messages
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Send a direct message
 * Envía un mensaje directo a otro usuario
 */
app.post("/make-server-5ea56f4e/messages/send", async (c) => {
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

    const { recipientId, content } = await c.req.json();

    if (!recipientId || !content?.trim()) {
      return c.json({ error: "Recipient and message content are required" }, 400);
    }

    console.log(`Sending message from ${user.id} to ${recipientId}`);

    // Get sender data
    const senderData = await kv.get(`user:${user.id}`);
    
    // Get recipient data
    const recipientData = await kv.get(`user:${recipientId}`);
    if (!recipientData) {
      return c.json({ error: "Recipient not found" }, 404);
    }

    // Find or create conversation
    const participants = [user.id, recipientId].sort(); // Sort for consistent ID
    const conversationId = `conv_${participants[0]}_${participants[1]}`;
    
    let conversation = await kv.get(`conversation:${conversationId}`);

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newMessage = {
      id: messageId,
      senderId: user.id,
      senderName: senderData?.name || 'Unknown',
      recipientId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };

    if (!conversation) {
      // Create new conversation
      conversation = {
        id: conversationId,
        participants,
        messages: [newMessage],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        unreadCount: [0, 1] // [sender unread, recipient unread]
      };

      // Add to both users' conversation lists
      const senderConvKey = `user_conversations:${user.id}`;
      const recipientConvKey = `user_conversations:${recipientId}`;
      
      let senderConvs = await kv.get(senderConvKey) || [];
      let recipientConvs = await kv.get(recipientConvKey) || [];
      
      if (!senderConvs.includes(conversationId)) {
        senderConvs.unshift(conversationId);
        await kv.set(senderConvKey, senderConvs);
      }
      
      if (!recipientConvs.includes(conversationId)) {
        recipientConvs.unshift(conversationId);
        await kv.set(recipientConvKey, recipientConvs);
      }
    } else {
      // Add message to existing conversation
      conversation.messages.push(newMessage);
      conversation.lastMessageAt = new Date().toISOString();
      
      // Increment unread count for recipient
      const recipientIndex = conversation.participants.indexOf(recipientId);
      if (!conversation.unreadCount) conversation.unreadCount = [0, 0];
      conversation.unreadCount[recipientIndex]++;
    }

    await kv.set(`conversation:${conversationId}`, conversation);

    console.log(`Message sent successfully: ${messageId}`);

    return c.json({
      success: true,
      message: newMessage,
      conversationId
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Search users to message
 * Busca usuarios por nombre o email para iniciar conversación
 */
app.get("/make-server-5ea56f4e/messages/search-users", async (c) => {
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

    const searchQuery = c.req.query('q')?.toLowerCase() || '';
    
    if (!searchQuery || searchQuery.length < 2) {
      return c.json({ 
        success: true,
        users: [] 
      });
    }

    console.log(`Searching users with query: ${searchQuery}`);

    // Get all users
    const allUsers = await kv.getByPrefix('user:');
    
    // Filter users matching search query (excluding current user)
    const matchingUsers = allUsers
      .filter(u => 
        u.id !== user.id && (
          u.name?.toLowerCase().includes(searchQuery) ||
          u.email?.toLowerCase().includes(searchQuery)
        )
      )
      .slice(0, 10) // Limit to 10 results
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        level: u.level || 1,
        xp: u.xp || 0
      }));

    return c.json({
      success: true,
      users: matchingUsers
    });

  } catch (error) {
    console.error("Error searching users:", error);
    return c.json({ error: "Internal server error: " + error.message }, 500);
  }
});

/**
 * Get unread message count
 * Obtiene el conteo de mensajes no leídos del usuario
 */
app.get("/make-server-5ea56f4e/messages/unread-count", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      console.log("Unread count request: No access token provided");
      return c.json({ error: "No access token provided" }, 401);
    }

    const user = await authenticateUser(accessToken);
    if (!user) {
      console.log("Unread count request: Invalid or expired token");
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    console.log(`Fetching unread count for user: ${user.id}`);

    // Get user's conversations with error handling
    const userConversationsKey = `user_conversations:${user.id}`;
    let conversationIds = [];
    
    try {
      conversationIds = await kv.get(userConversationsKey) || [];
    } catch (kvError) {
      console.error("Error fetching conversations from KV:", kvError);
      // Return 0 unread instead of failing
      return c.json({
        success: true,
        unreadCount: 0
      });
    }

    let totalUnread = 0;
    
    // If no conversations, return 0
    if (!conversationIds || conversationIds.length === 0) {
      console.log(`User ${user.id} has no conversations`);
      return c.json({
        success: true,
        unreadCount: 0
      });
    }

    // Count unread messages across all conversations
    for (const convId of conversationIds) {
      try {
        const conversation = await kv.get(`conversation:${convId}`);
        if (conversation && conversation.participants) {
          const userIndex = conversation.participants.indexOf(user.id);
          if (userIndex !== -1 && conversation.unreadCount) {
            const unreadForConv = conversation.unreadCount[userIndex] || 0;
            totalUnread += unreadForConv;
          }
        }
      } catch (convError) {
        // Log but don't fail - just skip this conversation
        console.error(`Error fetching conversation ${convId}:`, convError);
        continue;
      }
    }

    console.log(`User ${user.id} has ${totalUnread} unread messages`);

    return c.json({
      success: true,
      unreadCount: totalUnread
    });

  } catch (error) {
    console.error("Error getting unread count:", error);
    // Return 0 instead of error to prevent UI breaks
    return c.json({ 
      success: true,
      unreadCount: 0,
      warning: "Error counting unread messages"
    });
  }
});

// Simple health check endpoint
app.get("/make-server-5ea56f4e/health", async (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Server is running"
  });
});

// Diagnose admin status
app.get("/make-server-5ea56f4e/admin-status", async (c) => {
  try {
    const adminEmail = 'admin@aniuet.com';
    
    // Check Auth
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    const adminInAuth = authUsers?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
    
    // Check KV
    let adminInKV = null;
    if (adminInAuth) {
      adminInKV = await kv.get(`user:${adminInAuth.id}`);
    }
    
    return c.json({
      status: "ok",
      admin: {
        existsInAuth: !!adminInAuth,
        existsInKV: !!adminInKV,
        userId: adminInAuth?.id || null,
        email: adminInAuth?.email || null,
        emailConfirmed: adminInAuth?.email_confirmed_at ? true : false
      }
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Special endpoint to create admin user (DEVELOPMENT ONLY)
app.post("/make-server-5ea56f4e/create-admin-dev", async (c) => {
  try {
    console.log("=== CREATE ADMIN ENDPOINT CALLED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Request headers:", Object.fromEntries(c.req.raw.headers.entries()));
    
    const adminEmail = 'admin@aniuet.com';
    const adminPassword = 'admin123';
    
    console.log("Admin credentials: email =", adminEmail, ", password = [REDACTED]");
    
    // First, try to list all users in Auth to see if admin exists
    console.log("Checking Supabase Auth for existing admin users...");
    try {
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error("Error listing users from Auth:", listError);
      } else {
        console.log(`Found ${authUsers?.users?.length || 0} users in Supabase Auth`);
        const adminInAuth = authUsers?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
        if (adminInAuth) {
          console.log("✓ Admin exists in Supabase Auth:", adminInAuth.id);
          
          // Update password to ensure it matches expected password
          console.log("🔧 Updating admin password to ensure it's correct...");
          try {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              adminInAuth.id,
              { 
                password: adminPassword,
                email_confirm: true
              }
            );
            
            if (updateError) {
              console.error("❌ Failed to update admin password:", updateError);
            } else {
              console.log("✅ Admin password updated successfully");
            }
          } catch (updateException) {
            console.error("❌ Exception updating password:", updateException);
          }
          
          // Check if admin exists in KV store
          const adminKvData = await kv.get(`user:${adminInAuth.id}`);
          if (!adminKvData) {
            console.log("Admin exists in Auth but not in KV, syncing...");
            const adminData = {
              id: adminInAuth.id,
              email: adminEmail,
              name: 'Super Admin',
              role: 'admin',
              aiExperience: 'advanced',
              createdAt: new Date().toISOString(),
              enrolledCourses: [],
              completedCourses: [],
              xp: 0,
              level: 1,
              currentStreak: 0,
              dailyXP: 0
            };
            await kv.set(`user:${adminInAuth.id}`, adminData);
            console.log("✓ Admin synced to KV store");
          } else {
            console.log("✓ Admin already in KV store");
          }
          
          // Create a session for the admin user
          console.log("Creating session for existing admin...");
          const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword
          });
          
          if (sessionError) {
            console.error("Failed to create session for admin:", sessionError.message);
          }
          
          return c.json({ 
            success: true,
            message: "Admin user verified, password updated, and synced",
            alreadyExists: true,
            passwordUpdated: true,
            email: adminEmail,
            userId: adminInAuth.id,
            user: sessionData?.user || adminInAuth,
            session: sessionData?.session || null
          });
        }
      }
    } catch (e) {
      console.error("Exception checking Auth users:", e);
    }
    
    // Check if admin already exists in KV store
    console.log("Checking KV store for existing admin...");
    const existingUsers = await kv.getByPrefix('user:');
    console.log(`Found ${existingUsers.length} users in KV store`);
    
    const existingAdmin = existingUsers.find(user => 
      user.email?.toLowerCase() === adminEmail.toLowerCase()
    );
    
    if (existingAdmin) {
      console.log("✓ Admin user already exists in KV store:", existingAdmin.id);
      
      // Try to get the auth user and update password
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const adminInAuth = authUsers?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
      
      if (adminInAuth) {
        // Update password to ensure it's correct
        console.log("Updating admin password...");
        await supabase.auth.admin.updateUserById(
          adminInAuth.id,
          { 
            password: adminPassword,
            email_confirm: true
          }
        );
      }
      
      // Create a session
      console.log("Creating session for existing admin...");
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });
      
      if (sessionError) {
        console.error("Failed to create session:", sessionError.message);
      }
      
      return c.json({ 
        success: true,
        message: "Admin user already exists",
        alreadyExists: true,
        email: adminEmail,
        userId: existingAdmin.id,
        user: sessionData?.user || existingAdmin,
        session: sessionData?.session || null
      });
    }
    
    console.log("Admin not found, attempting to create in Supabase Auth...");
    console.log("Using SUPABASE_URL:", Deno.env.get('SUPABASE_URL'));
    console.log("SUPABASE_SERVICE_ROLE_KEY available:", !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    // Create admin user in Supabase Auth
    const { data: createUserData, error: createUserError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: { 
        name: 'Super Admin',
        role: 'admin',
        aiExperience: 'advanced'
      },
      email_confirm: true
    });

    if (createUserError) {
      console.error("Supabase createUser error:", createUserError.message);
      console.error("Full error object:", createUserError);
      
      // Check if user exists in Auth
      if (createUserError.message?.includes('already registered') || createUserError.message?.includes('already been registered')) {
        console.log("Admin already exists in Auth, checking and updating...");
        
        // Find the existing user
        const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (!listError && allUsers) {
          const existingAdmin = allUsers.find((u: any) => u.email?.toLowerCase() === adminEmail.toLowerCase());
          
          if (existingAdmin) {
            console.log("Found existing admin:", existingAdmin.id);
            
            // Update password to make sure it's correct
            console.log("Updating admin password...");
            try {
              const { error: updateError } = await supabase.auth.admin.updateUserById(
                existingAdmin.id,
                { password: adminPassword }
              );
              
              if (updateError) {
                console.error("Password update error:", updateError);
              } else {
                console.log("✓ Password updated successfully");
              }
            } catch (updateException) {
              console.error("Exception updating password:", updateException);
            }
            
            // Sync to KV
            const existingKvData = await kv.get(`user:${existingAdmin.id}`);
            if (!existingKvData) {
              console.log("Syncing admin to KV...");
              const adminData = {
                id: existingAdmin.id,
                email: adminEmail,
                name: 'Super Admin',
                role: 'admin',
                aiExperience: 'advanced',
                createdAt: new Date().toISOString(),
                enrolledCourses: [],
                completedCourses: [],
                xp: 0,
                level: 1,
                currentStreak: 0,
                dailyXP: 0
              };
              await kv.set(`user:${existingAdmin.id}`, adminData);
              console.log("✓ Admin synced to KV");
            } else {
              console.log("✓ Admin already in KV");
            }
            
            // Create a session
            console.log("Creating session for existing admin...");
            const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
              email: adminEmail,
              password: adminPassword
            });
            
            if (sessionError) {
              console.error("Failed to create session:", sessionError.message);
            }
            
            return c.json({ 
              success: true,
              message: "Admin user already existed, password updated and synced",
              userId: existingAdmin.id,
              email: adminEmail,
              user: sessionData?.user || existingAdmin,
              session: sessionData?.session || null
            });
          }
        }
        
        // Fallback: Try to sign in
        console.log("Attempting to sign in to existing admin...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });
        
        if (signInError) {
          console.error("Failed to sign in existing admin:", signInError.message);
          return c.json({ 
            error: "Admin exists but cannot sign in: " + signInError.message + ". The password may be different. Please check Supabase Auth dashboard.",
            suggestion: "Delete the admin user from Supabase Auth and try again, or update the password manually."
          }, 400);
        }
        
        if (signInData?.user) {
          console.log("✓ Retrieved existing admin from Auth:", signInData.user.id);
          
          // User exists in Auth, add to KV store
          const userId = signInData.user.id;
          const adminData = {
            id: userId,
            email: adminEmail,
            name: 'Super Admin',
            role: 'admin',
            aiExperience: 'advanced',
            createdAt: new Date().toISOString(),
            enrolledCourses: [],
            completedCourses: [],
            xp: 0,
            level: 1,
            currentStreak: 0,
            dailyXP: 0
          };
          
          console.log("Storing admin data in KV store...");
          await kv.set(`user:${userId}`, adminData);
          console.log("✓ Admin synced to KV store");
          
          return c.json({ 
            success: true,
            message: "Admin user already existed in Auth, synced to KV store",
            user: signInData.user,
            session: signInData.session,
            userId: userId
          });
        }
      }
      
      console.error("Unable to handle createUser error:", createUserError);
      return c.json({ 
        error: "Error creating admin user: " + createUserError.message 
      }, 400);
    }

    // Store admin data in KV store
    console.log("✓ Admin created in Supabase Auth:", createUserData.user.id);
    const userId = createUserData.user.id;
    const adminData = {
      id: userId,
      email: adminEmail,
      name: 'Super Admin',
      role: 'admin',
      aiExperience: 'advanced',
      createdAt: new Date().toISOString(),
      enrolledCourses: [],
      completedCourses: [],
      xp: 0,
      level: 1,
      currentStreak: 0,
      dailyXP: 0
    };

    console.log("Storing new admin data in KV store...");
    await kv.set(`user:${userId}`, adminData);
    console.log("✓ Admin data stored in KV store");

    // Try to sign in immediately to verify
    console.log("Verifying admin login...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError) {
      console.error("Warning: Admin created but immediate login failed:", signInError.message);
    } else {
      console.log("✓ Admin login verified successfully");
    }

    console.log("=== ADMIN CREATION COMPLETE ===");
    return c.json({ 
      success: true, 
      message: "Admin user created successfully",
      user: createUserData.user,
      session: signInData?.session || null,
      userId: userId,
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    });

  } catch (error) {
    console.error("=== ERROR IN CREATE-ADMIN-DEV ENDPOINT ===");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    return c.json({ 
      error: "Internal server error: " + error.message 
    }, 500);
  }
});

// Register admin routes
registerAdminRoutes(app, authenticateUser);

// =============================================================================
// AUTO-CREATE ADMIN ON SERVER STARTUP
// =============================================================================
async function ensureAdminExists() {
  try {
    console.log("=== SERVER STARTUP: Checking admin user ===");
    const adminEmail = 'admin@aniuet.com';
    const adminPassword = 'admin123';
    
    // Check if admin exists in Supabase Auth
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("❌ Error checking for admin user:", listError);
      return;
    }
    
    const adminInAuth = authUsers?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
    
    if (adminInAuth) {
      console.log("✅ Admin user exists in Auth:", adminInAuth.id);
      
      // Ensure password is correct and email is confirmed
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          adminInAuth.id,
          { 
            password: adminPassword,
            email_confirm: true
          }
        );
        
        if (updateError) {
          console.error("❌ Failed to update admin password:", updateError.message);
        } else {
          console.log("✅ Admin password and email confirmation verified");
        }
      } catch (e) {
        console.error("❌ Exception updating admin:", e);
      }
      
      // Check KV store
      const adminKvData = await kv.get(`user:${adminInAuth.id}`);
      if (!adminKvData || adminKvData.role !== 'admin') {
        console.log("🔧 Syncing admin to KV store...");
        const adminData = {
          id: adminInAuth.id,
          email: adminEmail,
          name: 'Super Admin',
          role: 'admin',
          aiExperience: 'advanced',
          createdAt: adminKvData?.createdAt || new Date().toISOString(),
          enrolledCourses: [],
          completedCourses: [],
          xp: 0,
          level: 1,
          currentStreak: 0,
          dailyXP: 0
        };
        await kv.set(`user:${adminInAuth.id}`, adminData);
        console.log("✅ Admin synced to KV store");
      } else {
        console.log("✅ Admin exists in KV store with admin role");
      }
    } else {
      // Create admin user
      console.log("🔧 Admin user not found, creating...");
      
      const { data: createUserData, error: createUserError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        user_metadata: { 
          name: 'Super Admin',
          role: 'admin',
          aiExperience: 'advanced'
        },
        email_confirm: true
      });
      
      if (createUserError) {
        console.error("❌ Failed to create admin user:", createUserError.message);
        return;
      }
      
      console.log("✅ Admin user created in Auth:", createUserData.user.id);
      
      // Store in KV
      const adminData = {
        id: createUserData.user.id,
        email: adminEmail,
        name: 'Super Admin',
        role: 'admin',
        aiExperience: 'advanced',
        createdAt: new Date().toISOString(),
        enrolledCourses: [],
        completedCourses: [],
        xp: 0,
        level: 1,
        currentStreak: 0,
        dailyXP: 0
      };
      
      await kv.set(`user:${createUserData.user.id}`, adminData);
      console.log("✅ Admin user stored in KV store");
    }
    
    console.log("=== ADMIN CHECK COMPLETE ===");
  } catch (error) {
    console.error("=== ERROR IN ADMIN CHECK ===");
    console.error("Error:", error);
  }
}

// Log environment on startup
console.log("=== SERVER STARTING ===");
console.log("SUPABASE_URL:", Deno.env.get('SUPABASE_URL'));
console.log("SUPABASE_ANON_KEY present:", !!Deno.env.get('SUPABASE_ANON_KEY'));
console.log("SUPABASE_SERVICE_ROLE_KEY present:", !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
if (Deno.env.get('SUPABASE_ANON_KEY')) {
  console.log("SUPABASE_ANON_KEY preview:", Deno.env.get('SUPABASE_ANON_KEY')!.substring(0, 20) + "...");
}

// Initialize admin on startup (non-blocking)
ensureAdminExists().catch(err => {
  console.error("Failed to ensure admin exists:", err);
});

Deno.serve(app.fetch);