import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../api/client";
import ValidationErrorList from "../../../components/ValidationErrorList";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { extractApiErrors } from "../../../utils/errors";
import { Teacher, Subject } from "../../../types/models";
import { personName } from "../../../utils/format";

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
          `/schools/${schoolId}/classgroups/${groupId}/subjects`,
        ),
        api.get<Teacher[]>(`/schools/${schoolId}/teachers`),
      ]);

      setSubjects(subjectRes.data);
      setTeachers(teacherRes.data);

      const assignmentEntries = await Promise.all(
        subjectRes.data.map(async (subject) => {
          const res = await api.get<Teacher[]>(
            `/schools/${schoolId}/classgroups/${groupId}/subjects/${subject.id}/classassignments`,
          );
          return [subject.id, res.data] as const;
        }),
      );
      setAssignments(Object.fromEntries(assignmentEntries));
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

  const handleAdd = async (subjectId: number) => {
    setErrors([]);
    const teacherId = selectedTeacherIds[subjectId];
    if (!teacherId) return;

    try {
      await api.post(
        `/schools/${schoolId}/classgroups/${groupId}/subjects/${subjectId}/classassignments`,
        {
          teacherId,
        },
      );
      const added = teachers.find((t) => t.id === teacherId);
      if (added) {
        setAssignments((prev) => ({
          ...prev,
          [subjectId]: [...(prev[subjectId] || []), added],
        }));
      }
      setSelectedTeacherIds((prev) => ({ ...prev, [subjectId]: "" }));
    } catch (err: unknown) {
      setErrors(extractApiErrors(err, "Failed to assign teacher."));
    }
  };

  const handleDelete = async (subjectId: number, teacherId: number) => {
    try {
      await api.delete(
        `/schools/${schoolId}/classgroups/${groupId}/subjects/${subjectId}/classassignments/${teacherId}`,
      );
      setAssignments((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).filter((t) => t.id !== teacherId),
      }));
    } catch {
      setErrors(["Failed to remove assignment."]);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-center align-items-center mb-3">
        <h5 className="mb-0 text-center">Class Assignments</h5>
      </div>
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
              (t) => !assigned.some((a) => a.id === t.id),
            );

            return (
              <Accordion.Item eventKey={idx.toString()} key={subject.id}>
                <Accordion.Header>
                  <span
                    className="flex-grow-1 text-truncate me-4"
                    style={{ minWidth: 0 }}
                  >
                    {subject.name}
                  </span>
                </Accordion.Header>
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
                          {personName(t.user)}
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
                          {personName(t.user)}
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
