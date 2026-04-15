import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#ffbb28",
  "#e28cf5",
  "#fa9fb5",
  "#b3de69",
  "#bebada",
];

const round = (v: number, d = 2) => parseFloat(v.toFixed(d));

interface Props {
  data: { name: string; value: number }[];
  hasData: boolean;
}

export default function AttendanceDistribution({ data, hasData }: Props) {
  return (
    <div className="col-md-6 d-flex flex-column align-items-center">
      <h6 className="text-center mb-1">Attendance Statuses</h6>
      {!hasData ? (
        <p className="text-muted text-center">No attendance data.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              labelLine={false}
            >
              {data.map((_, i) => (
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
  );
}
