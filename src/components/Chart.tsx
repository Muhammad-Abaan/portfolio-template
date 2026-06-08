import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const datasets: Record<string, Array<{ x: string | number; y: number }>> = {
  sales: [
    { x: "Jan", y: 120 },
    { x: "Feb", y: 200 },
    { x: "Mar", y: 150 },
    { x: "Apr", y: 300 },
    { x: "May", y: 280 },
  ],
  "validation-accuracy": [
    { x: 1, y: 0.6 },
    { x: 2, y: 0.7 },
    { x: 3, y: 0.78 },
    { x: 4, y: 0.83 },
    { x: 5, y: 0.87 },
    { x: 6, y: 0.85 },
    { x: 7, y: 0.84 },
    { x: 8, y: 0.83 },
  ],
};

export default function Chart({ id }: { id: string }) {
  const data = datasets[id];
  if (!data) {
    return <div className="text-sm text-muted-foreground">Chart "{id}" coming soon.</div>;
  }
  return (
    <div className="w-full h-64 rounded-lg border bg-card p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" />
          <YAxis domain={[0, "dataMax + 0.1"]} />
          <Tooltip />
          <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
