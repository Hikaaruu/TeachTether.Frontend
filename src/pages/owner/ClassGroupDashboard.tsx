import { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { api } from "../../api/client";

type ClassGroup = {
  id: number;
  gradeYear: number;
  section: string;
  homeroomTeacherId: number;
  schoolId: number;
};

export default function ClassGroupDashboard() {
  const { id: schoolId, groupId } = useParams();
  const [group, setGroup] = useState<ClassGroup | null>(null);

  useEffect(() => {
    if (!schoolId || !groupId) return;

    api
      .get<ClassGroup>(`/schools/${schoolId}/classgroups/${groupId}`)
      .then((res) => setGroup(res.data))
      .catch(() => setGroup(null));
  }, [schoolId, groupId]);

  return (
    <div>
      <div className="text-center mb-4">
        <h4 className="mb-0">
          Class Group:{" "}
          {group ? `${group.gradeYear} – ${group.section}` : `#${groupId}`}
        </h4>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <NavLink to="students" className="nav-link">
            Students
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="subjects" className="nav-link">
            Subjects
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="assignments" className="nav-link">
            Assignments
          </NavLink>
        </li>
      </ul>

      <Outlet />
    </div>
  );
}
