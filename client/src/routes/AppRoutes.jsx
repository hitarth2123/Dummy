import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

// Auth
import Login        from '@pages/auth/login';
import Unauthorized from '@pages/auth/unauthorized';

// Layouts
import DashboardLayout from '@layouts/DashboardLayout';

// Student pages
import StudentDashboard   from '@pages/student/dashboard';
import LearningPath       from '@pages/student/learning-path';
import TopicStudy         from '@pages/student/topic-study';
import QuestionBank       from '@pages/student/question-bank';
import QuestionPaper      from '@pages/student/question-paper';
import PracticeMCQ        from '@pages/student/practice-mcq';
import MockTest           from '@pages/student/mock-test';
import MockTestResults    from '@pages/student/mock-test-results';
import AITutor            from '@pages/student/ai-tutor';
import Videos             from '@pages/student/videos';
import BookSession        from '@pages/student/book-session';
import MySessions         from '@pages/student/my-sessions';
import SessionDetails     from '@pages/student/session-details';
import Forum              from '@pages/student/forum';
import ReportHallucination from '@pages/student/report-hallucination';
import Emergency          from '@pages/student/emergency';

// Faculty pages
import FacultyDashboard  from '@pages/faculty/dashboard';
import Availability      from '@pages/faculty/availability';
import SessionRequests   from '@pages/faculty/session-requests';
import FacultyMySessions from '@pages/faculty/my-sessions';

// HOD pages
import HODDashboard  from '@pages/hod/dashboard';
import AuditLog      from '@pages/hod/audit-log';
import EthicsConfig  from '@pages/hod/ethics-config';
import FacultyMgmt   from '@pages/hod/faculty-mgmt';

// Admin pages
import AdminDashboard     from '@pages/admin/dashboard';
import Users              from '@pages/admin/users';
import Timetable          from '@pages/admin/timetable';
import EmergencyContacts  from '@pages/admin/emergency-contacts';
import AdminFeedback      from '@pages/admin/feedback';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"        element={<Login />} />
    <Route path="/unauthorized" element={<Unauthorized />} />

    {/* Student */}
    <Route path="/student" element={<PrivateRoute allowedRoles={['student']}><DashboardLayout /></PrivateRoute>}>
      <Route index                element={<StudentDashboard />} />
      <Route path="dashboard"     element={<StudentDashboard />} />
      <Route path="learning-path" element={<LearningPath />} />
      <Route path="learning-path/topic" element={<TopicStudy />} />
      <Route path="question-bank" element={<QuestionBank />} />
      <Route path="question-bank/paper" element={<QuestionPaper />} />
      <Route path="practice-mcq" element={<PracticeMCQ />} />
      <Route path="mock-test"     element={<MockTest />} />
      <Route path="mock-test/:id/results" element={<MockTestResults />} />
      <Route path="ai-tutor"      element={<AITutor />} />
      <Route path="videos"        element={<Videos />} />
      <Route path="book-session"  element={<BookSession />} />
      <Route path="my-sessions"   element={<MySessions />} />
      <Route path="my-sessions/:id" element={<SessionDetails />} />
      <Route path="forum"         element={<Forum />} />
      <Route path="report-hallucination" element={<ReportHallucination />} />
      <Route path="emergency"     element={<Emergency />} />
    </Route>

    {/* Faculty */}
    <Route path="/faculty" element={<PrivateRoute allowedRoles={['faculty']}><DashboardLayout /></PrivateRoute>}>
      <Route index                  element={<FacultyDashboard />} />
      <Route path="dashboard"       element={<FacultyDashboard />} />
      <Route path="availability"    element={<Availability />} />
      <Route path="session-requests" element={<SessionRequests />} />
      <Route path="my-sessions"     element={<FacultyMySessions />} />
    </Route>

    {/* HOD */}
    <Route path="/hod" element={<PrivateRoute allowedRoles={['hod']}><DashboardLayout /></PrivateRoute>}>
      <Route index               element={<HODDashboard />} />
      <Route path="dashboard"    element={<HODDashboard />} />
      <Route path="audit-log"    element={<AuditLog />} />
      <Route path="ethics-config" element={<EthicsConfig />} />
      <Route path="faculty"      element={<FacultyMgmt />} />
    </Route>

    {/* Admin */}
    <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><DashboardLayout /></PrivateRoute>}>
      <Route index                    element={<AdminDashboard />} />
      <Route path="dashboard"         element={<AdminDashboard />} />
      <Route path="users"             element={<Users />} />
      <Route path="timetable"         element={<Timetable />} />
      <Route path="emergency-contacts" element={<EmergencyContacts />} />
      <Route path="feedback"          element={<AdminFeedback />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default AppRoutes;
