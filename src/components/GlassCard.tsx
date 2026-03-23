import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  glowColor?: "blue" | "teal" | "amber" | "red" | "green";
}

const glowClasses: Record<string, string> = {
  blue: "glow-blue",
  teal: "glow-teal",
  amber: "glow-amber",
  red: "glow-red",
  green: "glow-green",
};

const GlassCard = ({ children, className, hoverable = true, glowColor }: GlassCardProps) => {
  return (
    <div
      className={cn(
        hoverable ? "glass-card" : "glass-card-static",
        glowColor && glowClasses[glowColor],
        "p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
