import { Leaf } from "lucide-react";

interface Props {
  message?: string;
  sub?: string;
}

export function LoadingOverlay({ message = "Loading…", sub }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm safe-top safe-bottom">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary shadow-elegant">
        <Leaf className="h-10 w-10 text-primary-foreground animate-leaf" />
      </div>
      <p className="mt-6 text-lg font-semibold text-foreground">{message}</p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}