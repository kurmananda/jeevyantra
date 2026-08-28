export default function Roadmap({ entries, onDelete }) {
  if (!entries?.length) {
    return <p className="text-sm text-muted">No progress logged yet.</p>;
  }

  const months = [];
  for (const e of entries) {
    let group = months.find((m) => m.month === e.month);
    if (!group) {
      group = { month: e.month, items: [] };
      months.push(group);
    }
    group.items.push(e);
  }

  return (
    <div className="flex flex-col">
      {months.map((group, i) => (
        <div key={group.month} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-border bg-orange" />
            {i < months.length - 1 && <span className="w-[3px] flex-1 bg-border" />}
          </div>
          <div className="flex-1 pb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{group.month}</p>
            <div className="flex flex-col gap-2">
              {group.items.map((item) => (
                <div key={item.id ?? item.title} className="circuit-card flex items-start justify-between gap-3 p-3">
                  <div>
                    <p className="font-bold">{item.title}</p>
                    {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
                  </div>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="push-btn shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-[var(--led-red)]"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
