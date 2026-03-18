import { cn } from "@/lib/utils";

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export default function ContentCard({ children, className, padding = "md" }: ContentCardProps) {
  const paddingMap = {
    sm: "p-4",
    md: "p-5 lg:p-6",
    lg: "p-6 lg:p-8",
  };

  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border shadow-sm",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
