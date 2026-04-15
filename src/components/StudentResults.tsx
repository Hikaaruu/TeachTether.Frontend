import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Grade, Behavior, Attendance } from "../types/models";
import { personName } from "../utils/format";
import GradeSection from "./studentResults/GradeSection";
import BehaviorSection from "./studentResults/BehaviorSection";
import AttendanceSection from "./studentResults/AttendanceSection";

interface Props {
  schoolId: string;
  subjectId: string;
  studentId: number;
  editable?: boolean;
}

export default function StudentResults({
  schoolId,
  subjectId,
  studentId,
  editable = false,
}: Props) {
  const navigate = useNavigate();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [behavior, setBehavior] = useState<Behavior[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [subjectName, setSubjectName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState<string>("");
  const { user } = useAuth();

  const analyticsBasePath = user?.role.toLowerCase();

  const load = async () => {
    setLoading(true);
    try {
      const [g, b, a, s, studentRes] = await Promise.all([
        api.get(
          `/schools/${schoolId}/students/${studentId}/grades/subjects/${subjectId}`,
        ),
        api.get(
          `/schools/${schoolId}/students/${studentId}/behavior/subjects/${subjectId}`,
        ),
        api.get(
          `/schools/${schoolId}/students/${studentId}/attendance/subjects/${subjectId}`,
        ),
        api.get(`/schools/${schoolId}/subjects/${subjectId}`),
        api.get(`/schools/${schoolId}/students/${studentId}`),
      ]);
      setGrades(
        [...g.data].sort(
          (x, y) => dayjs(y.gradeDate).valueOf() - dayjs(x.gradeDate).valueOf(),
        ),
      );
      setBehavior(
        [...b.data].sort(
          (x, y) =>
            dayjs(y.behaviorDate).valueOf() - dayjs(x.behaviorDate).valueOf(),
        ),
      );
      setAttendance(
        [...a.data].sort(
          (x, y) =>
            dayjs(y.attendanceDate).valueOf() -
            dayjs(x.attendanceDate).valueOf(),
        ),
      );
      setStudentName(personName(studentRes.data.user));
      setSubjectName(s.data.name ?? s.data.Name ?? "");
    } catch {
      setGrades([]);
      setBehavior([]);
      setAttendance([]);
      setSubjectName("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId && subjectId) load();
  }, [studentId, subjectId]);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3
          className="fw-semibold text-primary-emphasis mb-0 flex-grow-1 text-center text-break"
          style={{
            minWidth: 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
          title={
            studentName && subjectName
              ? `${studentName} – ${subjectName}`
              : "Student Results"
          }
        >
          {studentName && subjectName
            ? `${studentName} – ${subjectName}`
            : "Student Results"}
        </h3>

        <button
          className="btn btn-sm btn-outline-info ms-3"
          onClick={() =>
            navigate(
              `/${analyticsBasePath}/students/${studentId}/subjects/${subjectId}/analytics`,
            )
          }
        >
          Analytics
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <GradeSection
            grades={grades}
            setGrades={setGrades}
            schoolId={schoolId}
            subjectId={subjectId}
            studentId={studentId}
            editable={editable}
          />
          <BehaviorSection
            behavior={behavior}
            setBehavior={setBehavior}
            schoolId={schoolId}
            subjectId={subjectId}
            studentId={studentId}
            editable={editable}
          />
          <AttendanceSection
            attendance={attendance}
            setAttendance={setAttendance}
            schoolId={schoolId}
            subjectId={subjectId}
            studentId={studentId}
            editable={editable}
          />
        </>
      )}
    </div>
  );
}
