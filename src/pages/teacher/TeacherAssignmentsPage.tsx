import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";
import Accordion from "react-bootstrap/Accordion";

interface Assignment {
  classGroupId: number;
  classGroupName: string;
  subjectId: number;
  subjectName: string;
}

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const teacherId = user?.entityId;
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !teacherId) return;

    setLoading(true);
    api
      .get<Assignment[]>(
        `/schools/${schoolId}/teachers/${teacherId}/classassignments`
      )
      .then((res) => {
        setAssignments(res.data);

        const groupedMap: Record<string, Assignment[]> = {};
        res.data.forEach((a) => {
          if (!groupedMap[a.subjectName]) groupedMap[a.subjectName] = [];
          groupedMap[a.subjectName].push(a);
        });

        setGrouped(groupedMap);
      })
      .catch(() => {
        setAssignments([]);
        setGrouped({});
      })
      .finally(() => setLoading(false));
  }, [schoolId, teacherId]);

  return (
    <div>
      <div className="d-flex justify-content-center mb-3">
        <h5 className="mb-0">My Assignments</h5>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-muted">You are not assigned to any subjects yet.</p>
      ) : (
        <Accordion alwaysOpen>
          {Object.entries(grouped).map(([subjectName, entries], idx) => (
            <Accordion.Item eventKey={idx.toString()} key={subjectName}>
              <Accordion.Header>{subjectName}</Accordion.Header>
              <Accordion.Body>
                <ul className="list-group">
                  {entries.map((a) => (
                    <li
                      key={a.classGroupId}
                      className="list-group-item list-group-item-action"
                      role="button"
                      onClick={() =>
                        navigate(
                          `/teacher/classgroups/${a.classGroupId}/subjects/${a.subjectId}`
                        )
                      }
                    >
                      {a.classGroupName}
                    </li>
                  ))}
                </ul>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </div>
  );
}
