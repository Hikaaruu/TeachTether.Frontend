import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import dayjs from "dayjs";
import { Grade, Behavior, Attendance, ClassAvg } from "../types/models";
import { personName } from "../utils/format";

const dateKey = (iso: string) => dayjs(iso).format("YYYY-MM-DD");
const round = (v: number, d = 2) => parseFloat(v.toFixed(d));

function aggregateLine(records: { date: string; value: number }[]) {
  const map = new Map<string, { sum: number; count: number }>();
  records.forEach(({ date, value }) => {
    const entry = map.get(date) ?? { sum: 0, count: 0 };
    entry.sum += value;
    entry.count += 1;
    map.set(date, entry);
  });
  return Array.from(map.entries())
    .map(([date, { sum, count }]) => ({ date, value: round(sum / count) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const gradeTypeLabels: Record<string, string> = {
  Exam: "Exam",
  Quiz: "Quiz",
  Homework: "Homework",
  Project: "Project",
  LabWork: "Lab Work",
  OralPresentation: "Oral Presentation",
  ClassParticipation: "Class Participation",
  ExtraCredit: "Extra Credit",
  PracticeWork: "Practice Work",
  FinalGrade: "Final Grade",
  Other: "Other",
};
const formatGradeType = (raw: string) => gradeTypeLabels[raw] ?? raw;

export default function useStudentAnalytics(
  subjectId: string | undefined,
  studentId: string | undefined,
) {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const [grades, setGrades] = useState<Grade[]>([]);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [classAvg, setClassAvg] = useState<ClassAvg | null>(null);

  const [studentName, setStudentName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [classGroupLabel, setClassGroupLabel] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !subjectId || !studentId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const classGroupId = (
          await api.get<{ id: number }>(
            `/schools/${schoolId}/students/${studentId}/classgroup`,
          )
        ).data.id;

        const [g, b, a, avg, studentRes, subjectRes, classGroupRes] =
          await Promise.all([
            api.get<Grade[]>(
              `/schools/${schoolId}/students/${studentId}/grades/subjects/${subjectId}`,
            ),
            api.get<Behavior[]>(
              `/schools/${schoolId}/students/${studentId}/behavior/subjects/${subjectId}`,
            ),
            api.get<Attendance[]>(
              `/schools/${schoolId}/students/${studentId}/attendance/subjects/${subjectId}`,
            ),
            api.get<ClassAvg>(
              `/schools/${schoolId}/analytics/classgroups/${classGroupId}/subjects/${subjectId}/students/${studentId}/averages`,
            ),
            api.get(`/schools/${schoolId}/students/${studentId}`),
            api.get(`/schools/${schoolId}/subjects/${subjectId}`),
            api.get(`/schools/${schoolId}/classgroups/${classGroupId}`),
          ]);

        setGrades(g.data);
        setBehaviors(b.data);
        setAttendances(a.data);
        setClassAvg(avg.data);

        setStudentName(personName(studentRes.data.user));
        setSubjectName(subjectRes.data.name);
        const cg = classGroupRes.data;
        setClassGroupLabel(`Grade ${cg.gradeYear}-${cg.section}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [schoolId, subjectId, studentId]);

  const gradeTrend = useMemo(
    () =>
      aggregateLine(
        grades.map((g) => ({
          date: dateKey(g.gradeDate),
          value: +g.gradeValue,
        })),
      ),
    [grades],
  );

  const behaviorTrend = useMemo(
    () =>
      aggregateLine(
        behaviors.map((b) => ({
          date: dateKey(b.behaviorDate),
          value: +b.behaviorScore,
        })),
      ),
    [behaviors],
  );

  const attendancePie = useMemo(() => {
    const total = attendances.length || 1;
    const count = (s: string) =>
      attendances.filter((a) => a.status === s).length;
    return [
      { name: "Present", value: round((count("Present") * 100) / total) },
      { name: "Late", value: round((count("Late") * 100) / total) },
      { name: "Absent", value: round((count("Absent") * 100) / total) },
      { name: "Excused", value: round((count("Excused") * 100) / total) },
    ];
  }, [attendances]);

  const gradeTypeDist = useMemo(() => {
    const total = grades.length || 1;
    const map = new Map<string, number>();
    grades.forEach((g) =>
      map.set(g.gradeType, (map.get(g.gradeType) ?? 0) + 1),
    );
    return Array.from(map.entries()).map(([name, cnt]) => ({
      name: formatGradeType(name),
      value: round((cnt * 100) / total),
    }));
  }, [grades]);

  const studentGradeAvg =
    gradeTrend.length > 0
      ? round(gradeTrend.reduce((a, b) => a + b.value, 0) / gradeTrend.length)
      : 0;
  const studentBehaviorAvg =
    behaviorTrend.length > 0
      ? round(
          behaviorTrend.reduce((a, b) => a + b.value, 0) / behaviorTrend.length,
        )
      : 0;

  return {
    loading,
    studentName,
    subjectName,
    classGroupLabel,
    gradeTrend,
    behaviorTrend,
    attendancePie,
    gradeTypeDist,
    classAvg,
    studentGradeAvg,
    studentBehaviorAvg,
    hasAttendances: attendances.length > 0,
  };
}
