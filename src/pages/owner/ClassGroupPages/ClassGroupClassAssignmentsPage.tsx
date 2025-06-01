import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../api/client";
import ValidationErrorList from "../../../components/ValidationErrorList";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

type Teacher = {
  id: number;
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  schoolId: number;
  dateOfBirth: string;
};

type Subject = {
  id: number;
  name: string;
  schoolId: number;
};

export default function ClassGroupClassAssignmentsPage() {
  const { id: schoolId, groupId } = useParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<Record<number, Teacher[]>>({});
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<
    Record<number, number | "">
  >({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [subjectRes, teacherRes] = await Promise.all([
        api.get<Subject[]>(
          `/schools/${schoolId}/classgroups/${groupId}/subjects`
        ),
        api.get<Teacher[]>(`/schools/${schoolId}/teachers`),
      ]);

      setSubjects(subjectRes.data);
      setTeachers(teacherRes.data);

      const allAssignments: Record<number, Teacher[]> = {};
      for (const subject of subjectRes.data) {
        const res = await api.get<Teacher[]>(
          `/schools/${schoolId}/classgroups/${groupId}/subjects/${subject.id}/classassignments`
        );
        allAssignments[subject.id] = res.data;
      }

      setAssignments(allAssignments);
    } catch {
      setSubjects([]);
      setTeachers([]);
      setAssignments({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [schoolId, groupId]);

  const teacherName = (t: Teacher) =>
    [t.user.firstName, t.user.middleName, t.user.lastName]
      .filter(Boolean)
      .join(" ");

  const handleAdd = async (subjectId: number) => {
    setErrors([]);
    const teacherId = selectedTeacherIds[subjectId];
    if (!teacherId) return;

    try {
      await api.post(
        `/schools/${schoolId}/classgroups/${groupId}/subjects/${subjectId}/classassignments`,
        {
          teacherId,
        }
      );
      setSelectedTeacherIds((prev) => ({ ...prev, [subjectId]: "" }));
      load();
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to assign teacher."]
      );
    }
  };

  const handleDelete = async (subjectId: number, teacherId: number) => {
    try {
      await api.delete(
        `/schools/${schoolId}/classgroups/${groupId}/subjects/${subjectId}/classassignments/${teacherId}`
      );
      load();
    } catch {
      alert("Failed to remove assignment.");
    }
  };

  return (
    <div>
      <h5 className="mb-3">Class Assignments</h5>
      <ValidationErrorList messages={errors} />

      {loading ? (
        <p>Loading...</p>
      ) : subjects.length === 0 ? (
        <p className="text-muted">No subjects assigned to this class group.</p>
      ) : (
        <Accordion alwaysOpen>
          {subjects.map((subject, idx) => {
            const assigned = assignments[subject.id] || [];
            const available = teachers.filter(
              (t) => !assigned.some((a) => a.id === t.id)
            );

            return (
              <Accordion.Item eventKey={idx.toString()} key={subject.id}>
                <Accordion.Header>{subject.name}</Accordion.Header>
                <Accordion.Body>
                  <div className="d-flex gap-2 mb-3">
                    <Form.Select
                      value={selectedTeacherIds[subject.id] || ""}
                      onChange={(e) =>
                        setSelectedTeacherIds((prev) => ({
                          ...prev,
                          [subject.id]: Number(e.target.value),
                        }))
                      }
                    >
                      <option value="">-- Select teacher --</option>
                      {available.map((t) => (
                        <option key={t.id} value={t.id}>
                          {teacherName(t)}
                        </option>
                      ))}
                    </Form.Select>
                    <Button
                      variant="primary"
                      onClick={() => handleAdd(subject.id)}
                      disabled={!selectedTeacherIds[subject.id]}
                    >
                      Assign
                    </Button>
                  </div>

                  {assigned.length === 0 ? (
                    <p className="text-muted mb-0">No teachers assigned.</p>
                  ) : (
                    <ul className="list-group">
                      {assigned.map((t) => (
                        <li
                          key={t.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {teacherName(t)}
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(subject.id, t.id)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
