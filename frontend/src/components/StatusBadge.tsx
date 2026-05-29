import { cn } from "@/lib/utils";
import { Circle, AlertTriangle, Lock, CheckCircle2 } from "lucide-react";

export type VaultStatus = "launchpad" | "active" | "cooldown" | "frozen" | "closed";

const config: Record<VaultStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  dot: string;
  tooltip: string;
}> = {
  launchpad: {
    label: "Trader Launchpad",
    icon: Circle,
    color: "text-status-launchpad",
    bg: "bg-status-launchpad/10 border-status-launchpad/30",
    dot: "bg-status-launchpad",
    tooltip: "Building verified track record before investor deposits",
  },
  active: {
    label: "Active",
    icon: Circle,
    color: "text-status-active",
    bg: "bg-status-active/10 border-status-active/30",
    dot: "bg-status-active",
    tooltip: "Accepting senior investor deposits",
  },
  cooldown: {
    label: "Cooldown",
    icon: AlertTriangle,
    color: "text-status-cooldown",
    bg: "bg-status-cooldown/10 border-status-cooldown/30",
    dot: "bg-status-cooldown",
    tooltip: "Trading paused after significant loss",
  },
  frozen: {
    label: "Frozen",
    icon: Lock,
    color: "text-status-frozen",
    bg: "bg-status-frozen/10 border-status-frozen/30",
    dot: "bg-status-frozen",
    tooltip: "Junior depleted — investors may withdraw",
  },
  closed: {
    label: "Closed",
    icon: CheckCircle2,
    color: "text-status-closed",
    bg: "bg-status-closed/10 border-status-closed/30",
    dot: "bg-status-closed",
    tooltip: "Vault closed by trader",
  },
};

interface StatusBadgeProps {
  status: VaultStatus;
  className?: string;
  /** Show additional day/status info for launchpad vaults */
  dayInfo?: { elapsed: number; required: number };
}

export const StatusBadge = ({ status, className, dayInfo }: StatusBadgeProps) => {
  const c = config[status];
  const Icon = c.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium tabular group relative",
        c.bg, c.color, className
      )}
      title={c.tooltip}
    >
      {status === "active" ? (
        <span className={cn("w-1.5 h-1.5 rounded-full", c.dot, "animate-pulse-glow")} />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span>
        {c.label}
        {status === "launchpad" && dayInfo && (
          <span className="ml-1 font-mono text-[10px] opacity-70">
            {dayInfo.elapsed}/{dayInfo.required}d
          </span>
        )}
      </span>
    </span>
  );
};
