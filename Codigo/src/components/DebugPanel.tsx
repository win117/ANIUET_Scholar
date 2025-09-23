import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DebugPanelProps {
  userProfile?: any;
  session?: any;
  userCourses?: any;
  availableCourses?: any[];
  aiLevel?: string;
}

export function DebugPanel({ userProfile, session, userCourses, availableCourses, aiLevel }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="bg-yellow-100 border-yellow-300 text-yellow-800"
        >
          Debug Info
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>🐛 Debug Panel</span>
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
              variant="ghost"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3 text-xs">
          <div>
            <strong>AI Level:</strong>
            <Badge className="ml-2" variant="secondary">{aiLevel || 'null'}</Badge>
          </div>
          
          <div>
            <strong>User Profile:</strong>
            <div className="bg-white p-2 rounded mt-1 max-h-24 overflow-y-auto">
              <pre>{JSON.stringify(userProfile, null, 1)}</pre>
            </div>
          </div>

          <div>
            <strong>Session:</strong>
            <div className="bg-white p-2 rounded mt-1 max-h-16 overflow-y-auto">
              <div>Token: {session?.access_token ? 'present' : 'missing'}</div>
              <div>User ID: {session?.user?.id || 'none'}</div>
            </div>
          </div>

          <div>
            <strong>Available Courses ({availableCourses?.length || 0}):</strong>
            <div className="bg-white p-2 rounded mt-1 max-h-20 overflow-y-auto">
              {availableCourses?.map(course => (
                <div key={course.id}>
                  {course.id}: {course.title} ({course.difficulty})
                </div>
              )) || 'No courses'}
            </div>
          </div>

          <div>
            <strong>User Courses:</strong>
            <div className="bg-white p-2 rounded mt-1 max-h-24 overflow-y-auto">
              <div><strong>Enrolled:</strong> [{userCourses?.enrolledCourses?.join(', ') || 'none'}]</div>
              <div><strong>Enrollments:</strong> {userCourses?.enrollments?.length || 0}</div>
              <div><strong>Completed:</strong> {userCourses?.completedCourses?.length || 0}</div>
            </div>
          </div>

          <div className="text-center pt-2">
            <Button
              onClick={() => {
                console.log('=== FULL DEBUG DATA ===');
                console.log('userProfile:', userProfile);
                console.log('session:', session);
                console.log('userCourses:', userCourses);
                console.log('availableCourses:', availableCourses);
                console.log('aiLevel:', aiLevel);
                console.log('=====================');
              }}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Log Full Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}