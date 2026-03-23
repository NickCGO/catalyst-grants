import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface MatchScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { width: 40, stroke: 3, fontSize: "text-xs" },
  md: { width: 56, stroke: 4, fontSize: "text-sm" },
  lg: { width: 80, stroke: 5, fontSize: "text-lg" },
};

const getColor = (score: number) => {
  if (score >= 80) return "hsl(160, 84%, 39%)";
  if (score >= 60) return "hsl(199, 89%, 48%)";
  if (score >= 40) return "hsl(38, 92%, 50%)";
  return "hsl(215, 20%, 65%)";
};

const MatchScoreRing = ({ score, size = "md", className = "" }: MatchScoreRingProps) => {
  const { width, stroke, fontSize } = sizeMap[size];
  const radius = (width - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getColor(score);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={width} height={width} className="-rotate-90">
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="hsla(0, 0%, 100%, 0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <span className={`absolute ${fontSize} font-semibold text-foreground`}>
        {score}%
      </span>
    </div>
  );
};

export default MatchScoreRing;
