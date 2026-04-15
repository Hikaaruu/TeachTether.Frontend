import { Route, Navigate } from "react-router-dom";
import SchoolDashboard from "../pages/owner/SchoolDashboard";
import AdminsPage from "../pages/owner/AdminsPage";
import StudentsPage from "../pages/owner/StudentsPage";
import TeachersPage from "../pages/owner/TeachersPage";
import GuardiansPage from "../pages/owner/GuardiansPage";
import SubjectsPage from "../pages/owner/SubjectsPage";
import ClassGroupsPage from "../pages/owner/ClassGroupsPage";
import ClassGroupDashboard from "../pages/owner/ClassGroupDashboard";
import ClassGroupStudentsPage from "../pages/owner/ClassGroupPages/ClassGroupStudentsPage";
import ClassGroupSubjectsPage from "../pages/owner/ClassGroupPages/ClassGroupSubjectsPage";
import ClassGroupClassAssignmentsPage from "../pages/owner/ClassGroupPages/ClassGroupClassAssignmentsPage";
import SchoolAnnouncementsPage from "../pages/owner/SchoolAnnouncementsPage";

export function schoolRoutes(opts: { includeAdmins: boolean }) {
  return (
    <Route path="schools/:id" element={<SchoolDashboard />}>
      {opts.includeAdmins && <Route path="admins" element={<AdminsPage />} />}
      <Route path="announcements" element={<SchoolAnnouncementsPage />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="teachers" element={<TeachersPage />} />
      <Route path="guardians" element={<GuardiansPage />} />
      <Route path="subjects" element={<SubjectsPage />} />
      <Route path="classgroups" element={<ClassGroupsPage />} />
      <Route path="classgroups/:groupId" element={<ClassGroupDashboard />}>
        <Route path="subjects" element={<ClassGroupSubjectsPage />} />
        <Route path="students" element={<ClassGroupStudentsPage />} />
        <Route
          path="assignments"
          element={<ClassGroupClassAssignmentsPage />}
        />
        <Route index element={<Navigate to="students" replace />} />
      </Route>
      <Route
        index
        element={
          <Navigate to={opts.includeAdmins ? "admins" : "students"} replace />
        }
      />
    </Route>
  );
}
