// A compact daily bar chart with no external charting library — one bar
// per `data` entry, scaled to the tallest value in the set. A native
// `title` tooltip gives the exact date/count on hover without extra JS.
export default function MiniBarChart({ data, colorClassName = "bg-lime" }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex h-20 items-end gap-[3px]">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="relative h-full flex-1" title={`${d.label}: ${d.value}`}>
          <div
            className={`absolute inset-x-0 bottom-0 rounded-sm ${colorClassName} ${d.value === 0 ? "opacity-20" : ""}`}
            style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
