import { formatLastEdited } from "@/lib/format-updated-at";

interface LastEditedLabelProps {
  updatedAt: string | null | undefined;
  createdAt?: string | null;
  className?: string;
}

export function LastEditedLabel({
  updatedAt,
  createdAt,
  className = "",
}: LastEditedLabelProps) {
  const formatted = formatLastEdited(updatedAt, createdAt);
  if (!formatted) return null;

  return (
    <p className={`text-xs text-slate-500 ${className}`.trim()}>
      Last edited {formatted}
    </p>
  );
}
