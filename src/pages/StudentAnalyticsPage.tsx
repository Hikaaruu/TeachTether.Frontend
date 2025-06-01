import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type Grade = {
  id: number;
  gradeValue: number;
  gradeType: string;
  gradeDate: string;
};
type Behavior = { id: number; behaviorScore: number; behaviorDate: string };
type Attendance = { id: number; status: string; attendanceDate: string };
type ClassAvg = {
  gradeAverage: number | null;
  behaviorAverage: number | null;
  attendance: {
    presentPercentage: number;
    latePercentage: number;
    absentPercentage: number;
    excusedPercentage: number;
  };
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];
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

export default function StudentAnalyticsPage() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const { subjectId, studentId } = useParams();

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
            `/schools/${schoolId}/students/${studentId}/classgroup`
          )
        ).data.id;

        const [g, b, a, avg, studentRes, subjectRes, classGroupRes] =
          await Promise.all([
            api.get<Grade[]>(
              `/schools/${schoolId}/students/${studentId}/grades/subjects/${subjectId}`
            ),
            api.get<Behavior[]>(
              `/schools/${schoolId}/students/${studentId}/behavior/subjects/${subjectId}`
            ),
            api.get<Attendance[]>(
              `/schools/${schoolId}/students/${studentId}/attendance/subjects/${subjectId}`
            ),
            api.get<ClassAvg>(
              `/schools/${schoolId}/analytics/classgroups/${classGroupId}/subjects/${subjectId}/students/${studentId}/averages`
            ),
            api.get(`/schools/${schoolId}/students/${studentId}`),
            api.get(`/schools/${schoolId}/subjects/${subjectId}`),
            api.get(`/schools/${schoolId}/classgroups/${classGroupId}`),
          ]);

        setGrades(g.data);
        setBehaviors(b.data);
        setAttendances(a.data);
        setClassAvg(avg.data);

        const u = studentRes.data.user;
        setStudentName(
          [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ")
        );
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
        }))
      ),
    [grades]
  );

  const behaviorTrend = useMemo(
    () =>
      aggregateLine(
        behaviors.map((b) => ({
          date: dateKey(b.behaviorDate),
          value: +b.behaviorScore,
        }))
      ),
    [behaviors]
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
      map.set(g.gradeType, (map.get(g.gradeType) ?? 0) + 1)
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
          behaviorTrend.reduce((a, b) => a + b.value, 0) / behaviorTrend.length
        )
      : 0;

  if (loading) return <p>Loading analytics…</p>;

  return (
    <div className="d-flex flex-column gap-4">
      <h3 className="text-center fw-semibold text-primary-emphasis">
        {studentName} – {subjectName} ({classGroupLabel})
      </h3>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <h6 className="text-center mb-1">Grade Trend</h6>
          {gradeTrend.length < 2 ? (
            <p className="text-muted text-center">Not enough data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={gradeTrend}
                margin={{ top: 5, right: 25, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => dayjs(v).format("D MMM")}
                  minTickGap={20}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: number) => round(v)} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-md-6">
          <h6 className="text-center mb-1">Behavior Trend</h6>
          {behaviorTrend.length < 2 ? (
            <p className="text-muted text-center">Not enough data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={behaviorTrend}
                margin={{ top: 5, right: 25, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => dayjs(v).format("D MMM")}
                  minTickGap={20}
                />
                <YAxis domain={[0, 10]} />
                <Tooltip formatter={(v: number) => round(v)} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#82ca9d"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <h6 className="text-center mb-1">Grade Type Distribution</h6>
          {gradeTypeDist.length === 0 ? (
            <p className="text-muted text-center">No grade data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <PieChart margin={{ right: 140 }}>
                <Pie
                  data={gradeTypeDist}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  labelLine={false}
                >
                  {gradeTypeDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${round(value)}%`,
                    name,
                  ]}
                  separator=" "
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ maxHeight: 300 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-md-6 d-flex flex-column align-items-center">
          <h6 className="text-center mb-1">Attendance Statuses</h6>
          {attendances.length === 0 ? (
            <p className="text-muted text-center">No attendance data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendancePie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  labelLine={false}
                >
                  {attendancePie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${round(value)}%`,
                    name,
                  ]}
                  separator=" "
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <h6 className="text-center mb-1">Grade: Student vs Class</h6>
          {classAvg ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  {
                    name: "Grade",
                    Student: studentGradeAvg,
                    Class: round(classAvg.gradeAverage ?? 0),
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: number) => round(v)} />
                <Legend />
                <Bar dataKey="Student" fill="#8884d8" />
                <Bar dataKey="Class" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center">
              Class averages not available.
            </p>
          )}
        </div>

        <div className="col-md-6">
          <h6 className="text-center mb-1">Behavior: Student vs Class</h6>
          {classAvg ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  {
                    name: "Behavior",
                    Student: studentBehaviorAvg,
                    Class: round(classAvg.behaviorAverage ?? 0),
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip formatter={(v: number) => round(v)} />
                <Legend />
                <Bar dataKey="Student" fill="#8884d8" />
                <Bar dataKey="Class" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center">
              Class averages not available.
            </p>
          )}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8 offset-lg-2">
          <h6 className="text-center mb-1">
            Attendance Rate: Student vs Class
          </h6>
          {classAvg ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  {
                    name: "Present %",
                    Student:
                      attendancePie.find((p) => p.name === "Present")?.value ??
                      0,
                    Class: round(classAvg.attendance.presentPercentage ?? 0),
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: number) => round(v)} />
                <Legend />
                <Bar dataKey="Student" fill="#8884d8" />
                <Bar dataKey="Class" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center">
              Class averages not available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
