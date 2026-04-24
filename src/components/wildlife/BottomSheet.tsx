import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, children, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 transition-opacity",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl bg-card p-4 pb-6 shadow-elegant transition-transform safe-bottom",
          open ? "translate-y-0" : "translate-y-full",
          className,
        )}
        role="dialog"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full bg-muted p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}