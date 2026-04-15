import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { ClassAvg } from "../../types/models";

const round = (v: number, d = 2) => parseFloat(v.toFixed(d));

interface Props {
  classAvg: ClassAvg | null;
  studentGradeAvg: number;
  studentBehaviorAvg: number;
  studentPresentPct: number;
}

export default function ComparisonCharts({
  classAvg,
  studentGradeAvg,
  studentBehaviorAvg,
  studentPresentPct,
}: Props) {
  return (
    <>
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
                    Student: studentPresentPct,
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
    </>
  );
}
