import { cn } from "@/lib/utils";
import { Star, Award, Shield, Medal, Crown } from "lucide-react";

export type TraderTier = "novice" | "proven" | "established" | "veteran" | "elite";

const tierConfig: Record<TraderTier, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = {
  novice: {
    label: "Novice",
    icon: Star,
    color: "text-tier-novice",
    bg: "bg-tier-novice/10 border-tier-novice/30",
  },
  proven: {
    label: "Proven",
    icon: Shield,
    color: "text-tier-proven",
    bg: "bg-tier-proven/10 border-tier-proven/30",
  },
  established: {
    label: "Established",
    icon: Medal,
    color: "text-tier-established",
    bg: "bg-tier-established/10 border-tier-established/30",
  },
  veteran: {
    label: "Veteran",
    icon: Award,
    color: "text-tier-veteran",
    bg: "bg-tier-veteran/10 border-tier-veteran/30",
  },
  elite: {
    label: "Elite",
    icon: Crown,
    color: "text-tier-elite",
    bg: "bg-tier-elite/10 border-tier-elite/30",
  },
};

interface TierBadgeProps {
  tier: TraderTier;
  reputation?: number;
  className?: string;
  size?: "sm" | "md";
}

export const TierBadge = ({ tier, reputation, className, size = "sm" }: TierBadgeProps) => {
  const c = tierConfig[tier];
  const Icon = c.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium tabular",
        c.bg, c.color,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
      title={`${c.label}${reputation !== undefined ? ` · ${reputation}/1000` : ""}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{c.label}</span>
      {reputation !== undefined && (
        <span className="font-mono opacity-60">{reputation}</span>
      )}
    </span>
  );
};
