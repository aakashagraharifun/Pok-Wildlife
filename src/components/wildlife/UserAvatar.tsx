import { cn } from "@/lib/utils";
import { colorFromString, getInitials } from "@/utils/formatters";

interface Props {
  name: string;
  url?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}

export function UserAvatar({ name, url, size = 40, className, ring }: Props) {
  const initials = getInitials(name);
  const bg = colorFromString(name);

  if (url) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full shrink-0",
          ring && "ring-2 ring-primary/20",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <img src={url} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white shrink-0",
        ring && "ring-2 ring-primary/20",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: Math.round(size * 0.4),
      }}
      aria-label={name}
    >
      {initials || "?"}
    </div>
  );
}