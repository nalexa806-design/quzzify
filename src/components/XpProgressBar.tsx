import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useXp } from "@/hooks/useXp";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface XpProgressBarProps {
  compact?: boolean;
  className?: string;
}

export const XpProgressBar = ({ compact = false, className }: XpProgressBarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { level, levelInfo, loading } = useXp();

  if (!user) return null;
  if (loading) return null;

  return (
    <motion.button
      onClick={() => navigate("/roadmap")}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer",
        compact && "px-2 py-1",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title="View Level Roadmap"
    >
      {/* Level badge */}
      <div className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-bold",
        compact ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
      )}>
        {level}
      </div>

      {/* Progress section */}
      <div className={cn("flex flex-col", compact ? "w-16" : "w-24")}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Lvl {level}</span>
          {!compact && level < 100 && (
            <span className="text-muted-foreground">{level + 1}</span>
          )}
        </div>
        <Progress 
          value={levelInfo.progress} 
          className={cn("h-1.5", compact && "h-1")} 
        />
      </div>

      {!compact && (
        <Trophy className="w-4 h-4 text-primary" />
      )}
    </motion.button>
  );
};
