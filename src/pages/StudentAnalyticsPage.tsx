import { useParams } from "react-router-dom";
import useStudentAnalytics from "../hooks/useStudentAnalytics";
import GradeTrendChart from "../components/analytics/GradeTrendChart";
import BehaviorTrendChart from "../components/analytics/BehaviorTrendChart";
import GradeTypeDistribution from "../components/analytics/GradeTypeDistribution";
import AttendanceDistribution from "../components/analytics/AttendanceDistribution";
import ComparisonCharts from "../components/analytics/ComparisonCharts";

export default function StudentAnalyticsPage() {
  const { subjectId, studentId } = useParams();

  const {
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
    hasAttendances,
  } = useStudentAnalytics(subjectId, studentId);

  if (loading) return <p>Loading analytics…</p>;

  return (
    <div className="d-flex flex-column gap-4">
      <h3 className="text-center fw-semibold text-primary-emphasis text-break">
        {studentName} – {subjectName} ({classGroupLabel})
      </h3>

      <div className="row g-3 mb-4">
        <GradeTrendChart data={gradeTrend} />
        <BehaviorTrendChart data={behaviorTrend} />
      </div>

      <div className="row g-3 mb-4">
        <GradeTypeDistribution data={gradeTypeDist} />
        <AttendanceDistribution data={attendancePie} hasData={hasAttendances} />
      </div>

      <ComparisonCharts
        classAvg={classAvg}
        studentGradeAvg={studentGradeAvg}
        studentBehaviorAvg={studentBehaviorAvg}
        studentPresentPct={
          attendancePie.find((p) => p.name === "Present")?.value ?? 0
        }
      />
    </div>
  );
}
