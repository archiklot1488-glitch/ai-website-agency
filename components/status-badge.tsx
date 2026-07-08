type StatusBadgeProps = {
  status: string | null;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = status || "draft";

  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
      {label.replaceAll("_", " ")}
    </span>
  );
}
