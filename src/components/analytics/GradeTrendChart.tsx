import dayjs from "dayjs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const round = (v: number, d = 2) => parseFloat(v.toFixed(d));

interface Props {
  data: { date: string; value: number }[];
}

export default function GradeTrendChart({ data }: Props) {
  return (
    <div className="col-md-6">
      <h6 className="text-center mb-1">Grade Trend</h6>
      {data.length < 2 ? (
        <p className="text-muted text-center">Not enough data.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
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
  );
}
