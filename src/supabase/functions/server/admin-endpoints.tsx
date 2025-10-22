/**
 * Admin Endpoints for ANIUET Scholar
 * These endpoints provide admin-level access to manage courses, lessons, users, and view platform statistics
 */

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

/**
 * Helper function to verify admin role
 */
export async function verifyAdmin(accessToken: string, authenticateUser: Function) {
  console.log("=== VERIFY ADMIN CALLED ===");
  console.log("Token received:", accessToken ? "Present (length: " + accessToken.length + ")" : "Missing");
  
  const user = await authenticateUser(accessToken);
  if (!user) {
    console.log("❌ Authentication failed - no user returned");
    return { isAdmin: false, error: "Invalid or expired token" };
  }

  console.log("✓ User authenticated:", user.id, "email:", user.email);

  const userData = await kv.get(`user:${user.id}`);
  console.log("User data from KV:", userData ? "Found" : "Not found");
  
  if (!userData) {
    console.log("❌ User not found in KV store");
    
    // Special handling for admin user - create on the fly if it's the admin email
    if (user.email?.toLowerCase() === 'admin@aniuet.com') {
      console.log("🔧 Creating admin user in KV store on the fly...");
      const adminData = {
        id: user.id,
        email: user.email,
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
      await kv.set(`user:${user.id}`, adminData);
      console.log("✅ Admin user created in KV store");
      return { isAdmin: true, user, userData: adminData };
    }
    
    return { isAdmin: false, error: "Access denied. Admin role required.", user };
  }
  
  if (userData.role !== 'admin') {
    console.log("❌ User role is not admin:", userData.role);
    return { isAdmin: false, error: "Access denied. Admin role required.", user };
  }

  console.log("✅ Admin verified successfully");
  return { isAdmin: true, user, userData };
}

/**
 * Register admin routes on the Hono app
 */
export function registerAdminRoutes(app: Hono, authenticateUser: Function) {
  
  /**
   * GET /admin/courses
   * Get all courses (mock and custom)
   */
  app.get("/make-server-5ea56f4e/admin/courses", async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        return c.json({ error: "No access token provided" }, 401);
      }

      const adminCheck = await verifyAdmin(accessToken, authenticateUser);
      if (!adminCheck.isAdmin) {
        return c.json({ error: adminCheck.error }, 403);
      }

      const allMockCourses = await kv.getByPrefix('mock_course:');
      const allCustomCourses = await kv.getByPrefix('course:');
      
      const courses = [
        ...allMockCourses.map(course => ({ ...course, type: 'mock' })),
        ...allCustomCourses.map(course => ({ ...course, type: 'custom' }))
      ];

      return c.json({
        success: true,
        courses,
        totalCourses: courses.length
      });

    } catch (error) {
      console.error("Error fetching all courses:", error);
      return c.json({ error: "Internal server error: " + error.message }, 500);
    }
  });

  /**
   * POST /admin/courses
   * Create or update a course
   */
  app.post("/make-server-5ea56f4e/admin/courses", async (c) => {
    try {
      console.log('=== ADMIN SAVE COURSE ENDPOINT CALLED ===');
      
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        console.log('❌ No access token provided');
        return c.json({ error: "No access token provided" }, 401);
      }

      console.log('✓ Access token present');
      const adminCheck = await verifyAdmin(accessToken, authenticateUser);
      if (!adminCheck.isAdmin) {
        console.log('❌ Admin verification failed');
        return c.json({ error: adminCheck.error }, 403);
      }

      console.log('✓ Admin verified');
      const courseData = await c.req.json();
      console.log('📦 Received course data:', {
        id: courseData.id,
        title: courseData.title,
        lessonsCount: courseData.lessons?.length || 0,
        type: courseData.type
      });

      const { id, title, description, difficulty, courseCode, lessons, status, type } = courseData;

      if (!title || !description) {
        console.log('❌ Missing required fields');
        return c.json({ error: "Title and description are required" }, 400);
      }

      const courseId = id || `admin-course-${Date.now()}`;
      const isMockCourse = type === 'mock';
      const storeKey = isMockCourse ? `mock_course:${courseId}` : `course:${courseId}`;
      console.log('🔑 Store key:', storeKey);
      
      const existingCourse = await kv.get(storeKey);
      console.log('📝 Existing course:', existingCourse ? 'Found' : 'Not found');
      
      const course = {
        id: courseId,
        title,
        description,
        difficulty: difficulty || 'beginner',
        courseCode: courseCode || `ANIUET-${String(Math.floor(Math.random() * 900) + 100)}`,
        lessons: lessons || [],
        status: status || 'active',
        type: type || 'custom',
        createdBy: existingCourse?.createdBy || adminCheck.user.id,
        createdByName: existingCourse?.createdByName || adminCheck.userData.name,
        createdAt: existingCourse?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: adminCheck.user.id,
        enrolledStudents: existingCourse?.enrolledStudents || [],
        totalStudents: existingCourse?.totalStudents || 0
      };

      console.log('💾 Saving course with', course.lessons.length, 'lessons');
      console.log('Lessons details:', course.lessons.map(l => ({ id: l.id, title: l.title, type: l.type })));
      
      await kv.set(storeKey, course);
      console.log('✅ Course saved successfully to KV store');

      // Verify the save by reading it back
      const savedCourse = await kv.get(storeKey);
      console.log('🔍 Verification - Course read back:', {
        id: savedCourse.id,
        title: savedCourse.title,
        lessonsCount: savedCourse.lessons?.length || 0
      });

      return c.json({
        success: true,
        message: existingCourse ? "Course updated successfully" : "Course created successfully",
        course: savedCourse
      });

    } catch (error) {
      console.error("❌ Error creating/updating course:", error);
      console.error("Error stack:", error.stack);
      return c.json({ error: "Internal server error: " + error.message }, 500);
    }
  });

  /**
   * GET /admin/courses/:courseId
   * Get specific course details
   */
  app.get("/make-server-5ea56f4e/admin/courses/:courseId", async (c) => {
    try {
      console.log('=== ADMIN GET COURSE ENDPOINT CALLED ===');
      
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        console.log('❌ No access token provided');
        return c.json({ error: "No access token provided" }, 401);
      }

      console.log('✓ Access token present');
      const adminCheck = await verifyAdmin(accessToken, authenticateUser);
      if (!adminCheck.isAdmin) {
        console.log('❌ Admin verification failed');
        return c.json({ error: adminCheck.error }, 403);
      }

      console.log('✓ Admin verified');
      const courseId = c.req.param('courseId');
      console.log('📖 Fetching course:', courseId);
      
      let course = await kv.get(`mock_course:${courseId}`);
      let courseType = 'mock';
      if (!course) {
        course = await kv.get(`course:${courseId}`);
        courseType = 'custom';
      }

      if (!course) {
        console.log('❌ Course not found');
        return c.json({ error: "Course not found" }, 404);
      }

      console.log('✅ Course found:', {
        id: course.id,
        title: course.title,
        type: courseType,
        lessonsCount: course.lessons?.length || 0
      });

      console.log('📝 Lessons in course:', course.lessons?.map(l => ({ 
        id: l.id, 
        title: l.title, 
        type: l.type,
        position: l.position 
      })) || []);

      const allUsers = await kv.getByPrefix('user:');
      const enrolledUsers = allUsers.filter(user => 
        user.enrolledCourses?.includes(courseId)
      );

      const courseWithStats = {
        ...course,
        enrolledCount: enrolledUsers.length,
        enrolledUsers: enrolledUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          xp: u.xp,
          level: u.level
        }))
      };

      console.log('✅ Returning course with stats');
      return c.json({
        success: true,
        course: courseWithStats
      });

    } catch (error) {
      console.error("❌ Error fetching course details:", error);
      console.error("Error stack:", error.stack);
      return c.json({ error: "Internal server error: " + error.message }, 500);
    }
  });

  /**
   * DELETE /admin/courses/:courseId
   * Delete a course
   */
  app.delete("/make-server-5ea56f4e/admin/courses/:courseId", async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        return c.json({ error: "No access token provided" }, 401);
      }

      const adminCheck = await verifyAdmin(accessToken, authenticateUser);
      if (!adminCheck.isAdmin) {
        return c.json({ error: adminCheck.error }, 403);
      }

      const courseId = c.req.param('courseId');
      
      let deleted = false;
      const mockCourse = await kv.get(`mock_course:${courseId}`);
      if (mockCourse) {
        await kv.del(`mock_course:${courseId}`);
        deleted = true;
      }

      const customCourse = await kv.get(`course:${courseId}`);
      if (customCourse) {
        await kv.del(`course:${courseId}`);
        deleted = true;
      }

      if (!deleted) {
        return c.json({ error: "Course not found" }, 404);
      }

      return c.json({
        success: true,
        message: "Course deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting course:", error);
      return c.json({ error: "Internal server error: " + error.message }, 500);
    }
  });

  /**
   * POST /admin/courses/:courseId/lessons
   * Create or update a lesson
   */
  app.post("/make-server-5ea56f4e/admin/courses/:courseId/lessons", async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        return c.json({ error: "No access token provided" }, 401);
      }

      const adminCheck = await verifyAdmin(accessToken, authenticateUser);
      if (!adminCheck.isAdmin) {
        return c.json({ error: adminCheck.error }, 403);
      }

      const courseId = c.req.param('courseId');
      const lessonData = await c.req.json();

      let course = await kv.get(`mock_course:${courseId}`);
      let isMockCourse = true;
      if (!course) {
        course = await kv.get(`course:${courseId}`);
        isMockCourse = false;
      }

      if (!course) {
        return c.json({ error: "Course not found" }, 404);
      }

      if (!course.lessons || typeof course.lessons === 'number') {
        course.lessons = [];
      }

      const lessonId = lessonData.id || `lesson-${Date.now()}`;
      const lessonIndex = course.lessons.findIndex(l => l.id === lessonId);

      const lesson = {
        id: lessonId,
        title: lessonData.title,
        description: lessonData.description,
        content: lessonData.content,
        videoUrl: lessonData.videoUrl,
        pdfUrl: lessonData.pdfUrl,
        duration: lessonData.duration || 30,
        order: lessonData.order !== undefined ? lessonData.order : course.lessons.length,
        locked: lessonData.locked || false,
        createdAt: lessonIndex >= 0 ? course.lessons[lessonIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (lessonIndex >= 0) {
        course.lessons[lessonIndex] = lesson;
      } else {
        course.lessons.push(lesson);
      }

      course.lessons.sort((a, b) => a.order - b.order);

      const storeKey = isMockCourse ? `mock_course:${courseId}` : `course:${courseId}`;
      await kv.set(storeKey, course);

      return c.json({
        success: true,
        message: lessonIndex >= 0 ? "Lesson updated successfully" : "Lesson created successfully",
        lesson,
        course
      });

    } catch (error) {
      console.error("Error creating/updating lesson:", error);
      return c.json({ error: "Internal server error: " + error.message }, 500);
    }
  });

  /**
   * DELETE /admin/courses/:courseId/lessons/:lessonId
   * Delete a lesson
   */
  app.delete("/make-server-5ea56f4e/admin/courses/:courseId/lessons/:lessonId", async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        return c.json({ error: "No access token provided" }, 401);
      }

      const adminCheck = await verifyAdmin(accessToken, authenticateUser);
      if (!adminCheck.isAdmin) {
        return c.json({ error: adminCheck.error }, 403);
      }

      const courseId = c.req.param('courseId');
      const lessonId = c.req.param('lessonId');

      let course = await kv.get(`mock_course:${courseId}`);
      let isMockCourse = true;
      if (!course) {
        course = await kv.get(`course:${courseId}`);
        isMockCourse = false;
      }

      if (!course) {
        return c.json({ error: "Course not found" }, 404);
      }

      if (!Array.isArray(course.lessons)) {
        return c.json({ error: "No lessons found in course" }, 404);
      }

      const lessonIndex = course.lessons.findIndex(l => l.id === lessonId);
      if (lessonIndex === -1) {
        return c.json({ error: "Lesson not found" }, 404);
      }

      course.lessons.splice(lessonIndex, 1);

      const storeKey = isMockCourse ? `mock_course:${courseId}` : `course:${courseId}`;
      await kv.set(storeKey, course);

      return c.json({
        success: true,
        message: "Lesson deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting lesson:", error);
      return c.json({ error: "Internal server error: " + error.message }, 500);
    }
  });

  /**
   * GET /admin/users
   * Get all users
   */
  app.get("/make-server-5ea56f4e/admin/users", async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        return c.json({ error: "No access token provided" }, 401);
      }

      const adminCheck = await verifyAdmin(accessToken, authenticateUser);
      if (!adminCheck.isAdmin) {
        return c.json({ error: adminCheck.error }, 403);
      }

      const allUsers = await kv.getByPrefix('user:');
      
      const users = allUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        aiExperience: user.aiExperience,
        xp: user.xp || 0,
        level: user.level || 1,
        enrolledCourses: user.enrolledCourses || [],
        completedCourses: user.completedCourses || [],
        createdAt: user.createdAt,
        lastActivity: user.lastActivity
      }));

      return c.json({
        success: true,
        users,
        totalUsers: users.length,
        stats: {
          students: users.filter(u => u.role === 'student').length,
          teachers: users.filter(u => u.role === 'teacher').length,
          professionals: users.filter(u => u.role === 'professional').length,
          admins: users.filter(u => u.role === 'admin').length
        }
      });

    } catch (error) {
      console.error("Error fetching users:", error);
      return c.json({ error: "Internal server error: " + error.message }, 500);
    }
  });

  /**
   * GET /admin/stats
   * Get platform statistics
   */
  app.get("/make-server-5ea56f4e/admin/stats", async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.split(' ')[1];

      if (!accessToken) {
        return c.json({ error: "No access token provided" }, 401);
      }

      const adminCheck = await verifyAdmin(accessToken, authenticateUser);
      if (!adminCheck.isAdmin) {
        return c.json({ error: adminCheck.error }, 403);
      }

      const allUsers = await kv.getByPrefix('user:');
      const allMockCourses = await kv.getByPrefix('mock_course:');
      const allCustomCourses = await kv.getByPrefix('course:');
      const allPosts = await kv.getByPrefix('community_post:');

      const totalEnrollments = allUsers.reduce((sum, user) => 
        sum + (user.enrolledCourses?.length || 0), 0
      );

      const totalCompletedLessons = allUsers.reduce((sum, user) => {
        const lessons = user.enrollments?.reduce((total, enrollment) => 
          total + (enrollment.completedLessons?.length || 0), 0
        ) || 0;
        return sum + lessons;
      }, 0);

      const stats = {
        users: {
          total: allUsers.length,
          students: allUsers.filter(u => u.role === 'student').length,
          teachers: allUsers.filter(u => u.role === 'teacher').length,
          professionals: allUsers.filter(u => u.role === 'professional').length,
          admins: allUsers.filter(u => u.role === 'admin').length
        },
        courses: {
          total: allMockCourses.length + allCustomCourses.length,
          mock: allMockCourses.length,
          custom: allCustomCourses.length,
          active: [...allMockCourses, ...allCustomCourses].filter(c => c.status === 'active').length
        },
        engagement: {
          totalEnrollments,
          totalCompletedLessons,
          communityPosts: allPosts.length,
          averageEnrollmentsPerUser: allUsers.length > 0 ? (totalEnrollments / allUsers.length).toFixed(2) : 0
        },
        timestamp: new Date().toISOString()
      };

      return c.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error("Error fetching platform stats:", error);
      return c.json({ error: "Internal server error: " + error.message }, 500);
    }
  });
}
