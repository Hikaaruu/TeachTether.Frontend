// src/App.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Regiser from "./pages/Register";
import NotFound from "./pages/NotFound";
import StartupRedirect from "./pages/StartupRedirect";
import { UserRole } from "./types/roles";

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

// // Admin pages
// import AdminDashboard from './pages/admin/AdminDashboard';
// import ManageClasses from './pages/admin/ManageClasses';

// // Teacher pages
// import TeacherDashboard from './pages/teacher/TeacherDashboard';
// import GradeStudents from './pages/teacher/GradeStudents';

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
              {/* <Route index element={<OwnerDashboard />} />
              <Route path="schools" element={<ManageSchools />} />
              <Route path="teachers" element={<ManageTeachers />} />
              <Route path="students" element={<ManageStudents />} /> */}
            </Route>
          </Route>

          {/* School Admin */}
          <Route element={<ProtectedRoute allow={[UserRole.Admin]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              {/* <Route index element={<AdminDashboard />} />
              <Route path="classes" element={<ManageClasses />} /> */}
            </Route>
          </Route>

          {/* Teacher */}
          <Route element={<ProtectedRoute allow={[UserRole.Teacher]} />}>
            <Route path="/teacher" element={<TeacherLayout />}>
              {/* <Route index element={<TeacherDashboard />} />
              <Route path="grades" element={<GradeStudents />} /> */}
            </Route>
          </Route>

          {/* Guardian */}
          <Route element={<ProtectedRoute allow={[UserRole.Guardian]} />}>
            <Route path="/guardian" element={<GuardianLayout />}>
              {/* <Route index element={<GuardianDashboard />} />
              <Route path="results" element={<ViewStudentResults />} /> */}
            </Route>
          </Route>

          {/* Student */}
          <Route element={<ProtectedRoute allow={[UserRole.Student]} />}>
            <Route path="/student" element={<StudentLayout />}>
              {/* <Route index element={<StudentDashboard />} /> */}
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
          <Route path="/" element={<StartupRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
