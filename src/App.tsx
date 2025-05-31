// src/App.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Regiser from "./pages/Register";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import StartupRedirect from "./pages/StartupRedirect";
import { UserRole } from "./types/roles";
import ProfilePage from "./pages/ProfilePage";

// Layouts
import OwnerLayout from "./layouts/OwnerLayout";
import AdminLayout from "./layouts/AdminLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import GuardianLayout from "./layouts/GuardianLayout";
import StudentLayout from "./layouts/StudentLayout";

// // Owner pages
// import OwnerDashboard from './pages/owner/OwnerDashboard';
// import ManageSchools from './pages/owner/ManageSchools';
// import ManageTeachers from './pages/owner/ManageTeachers';
// import ManageStudents from './pages/owner/ManageStudents';
import SchoolsPage from "./pages/owner/SchoolsPage";
import SchoolDashboard from "./pages/owner/SchoolDashboard";
import AdminsPage from "./pages/owner/AdminsPage";
import StudentsPage from "./pages/owner/StudentsPage";
import TeachersPage from "./pages/owner/TeachersPage";
import GuardiansPage from "./pages/owner/GuardiansPage";
import SubjectsPage from "./pages/owner/SubjectsPage";
import ClassGroupsPage from "./pages/owner/ClassGroupsPage";
import ClassGroupDashboard from "./pages/owner/ClassGroupDashboard";
import ClassGroupStudentsPage from "./pages/owner/ClassGroupPages/ClassGroupStudentsPage";
import ClassGroupSubjectsPage from "./pages/owner/ClassGroupPages/ClassGroupSubjectsPage";
import ClassGroupClassAssignmentsPage from "./pages/owner/ClassGroupPages/ClassGroupClassAssignmentsPage";
// // Admin pages
import AdminStartup from "./pages/admin/AdminStartup";

// // Teacher pages
import TeacherAssignmentsPage from "./pages/teacher/TeacherAssignmentsPage";
import GradingPage from "./pages/teacher/GradingPage";
import TeacherClassGroupsPage from "./pages/teacher/TeacherClassGroupsPage";
import TeacherClassGroupStudentsPage from "./pages/teacher/TeacherClassGroupStudentsPage";
import StudentResultsPage from "./pages/StudentResultsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import MessageThreadsPage from "./pages/MessageThreadsPage";
import ThreadMessagesPage from "./pages/ThreadMessagesPage";
import StudentAnalyticsPage from "./pages/StudentAnalyticsPage";
import GuardianStudentsPage from "./pages/guardian/GuardianStudentsPage";
import SchoolAnnouncementsPage from "./pages/owner/SchoolAnnouncementsPage";
import StudentStartup from "./pages/student/StudentStartup";

// // Guardian pages
// import GuardianDashboard from './pages/guardian/GuardianDashboard';
// import ViewStudentResults from './pages/guardian/ViewStudentResults';

// // Student pages
// import StudentDashboard from './pages/student/StudentDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Regiser />} />

          {/* School Owner */}
          <Route element={<ProtectedRoute allow={[UserRole.Owner]} />}>
            <Route path="/owner" element={<OwnerLayout />}>
              <Route index element={<Navigate to="schools" replace />} />
              <Route path="schools" element={<SchoolsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="schools/:id" element={<SchoolDashboard />}>
                <Route path="admins" element={<AdminsPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="guardians" element={<GuardiansPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route
                  path="announcements"
                  element={<SchoolAnnouncementsPage />}
                />
                <Route path="classgroups" element={<ClassGroupsPage />} />
                <Route
                  path="classgroups/:groupId"
                  element={<ClassGroupDashboard />}
                >
                  <Route path="subjects" element={<ClassGroupSubjectsPage />} />
                  <Route path="students" element={<ClassGroupStudentsPage />} />
                  <Route
                    path="assignments"
                    element={<ClassGroupClassAssignmentsPage />}
                  />
                  <Route index element={<Navigate to="students" replace />} />
                </Route>
                <Route index element={<Navigate to="admins" replace />} />
              </Route>
            </Route>
          </Route>

          {/* School Admin */}
          <Route element={<ProtectedRoute allow={[UserRole.Admin]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminStartup />} />

              <Route path="profile" element={<ProfilePage />} />
              <Route path="schools/:id" element={<SchoolDashboard />}>
                <Route
                  path="announcements"
                  element={<SchoolAnnouncementsPage />}
                />
                <Route path="students" element={<StudentsPage />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="guardians" element={<GuardiansPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="classgroups" element={<ClassGroupsPage />} />
                <Route
                  path="classgroups/:groupId"
                  element={<ClassGroupDashboard />}
                >
                  <Route path="subjects" element={<ClassGroupSubjectsPage />} />
                  <Route path="students" element={<ClassGroupStudentsPage />} />
                  <Route
                    path="assignments"
                    element={<ClassGroupClassAssignmentsPage />}
                  />
                  <Route index element={<Navigate to="students" replace />} />
                </Route>
                <Route index element={<Navigate to="students" replace />} />
              </Route>
            </Route>
          </Route>

          {/* Teacher */}
          <Route element={<ProtectedRoute allow={[UserRole.Teacher]} />}>
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="chats" element={<MessageThreadsPage />} />
              <Route
                path="chats/:threadId/messages"
                element={<ThreadMessagesPage />}
              />
              <Route index element={<Navigate to="assignments" replace />} />
              <Route path="assignments" element={<TeacherAssignmentsPage />} />
              <Route path="classgroups" element={<TeacherClassGroupsPage />} />
              <Route
                path="classgroups/:groupId/students"
                element={<TeacherClassGroupStudentsPage />}
              />
              <Route
                path="students/:studentId/subjects/:subjectId/analytics"
                element={<StudentAnalyticsPage />}
              />
              <Route
                path="classgroups/:groupId/students/:studentId/results"
                element={<StudentResultsPage />}
              />
              <Route
                path="classgroups/:groupId/subjects/:subjectId"
                element={<GradingPage />}
              />
            </Route>
          </Route>

          {/* Guardian */}
          <Route element={<ProtectedRoute allow={[UserRole.Guardian]} />}>
            <Route path="/guardian" element={<GuardianLayout />}>
              <Route index element={<Navigate to="students" replace />} />
              <Route path="students" element={<GuardianStudentsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="chats" element={<MessageThreadsPage />} />
              <Route
                path="chats/:threadId/messages"
                element={<ThreadMessagesPage />}
              />
              <Route
                path="students/:studentId/results"
                element={<StudentResultsPage />}
              />
              <Route
                path="students/:studentId/subjects/:subjectId/analytics"
                element={<StudentAnalyticsPage />}
              />
            </Route>
          </Route>

          {/* Student */}
          <Route element={<ProtectedRoute allow={[UserRole.Student]} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentStartup />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="students/:studentId/results"
                element={<StudentResultsPage />}
              />
              <Route
                path="students/:studentId/subjects/:subjectId/analytics"
                element={<StudentAnalyticsPage />}
              />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/404" element={<NotFound />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
          <Route path="/" element={<StartupRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
