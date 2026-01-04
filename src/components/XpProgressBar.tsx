import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Lock } from "lucide-react";
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

  const isLoggedIn = !!user;
  const displayLevel = isLoggedIn ? level : 1;
  const displayProgress = isLoggedIn ? levelInfo.progress : 0;

  if (loading && isLoggedIn) return null;

  return (
    <motion.button
      onClick={() => navigate("/roadmap")}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
        isLoggedIn 
          ? "bg-secondary/50 hover:bg-secondary" 
          : "bg-muted/50 hover:bg-muted opacity-60",
        compact && "px-2 py-1",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={isLoggedIn ? "View Level Roadmap" : "Login to track progress"}
    >
      {/* Lock icon for non-logged in users */}
      {!isLoggedIn && (
        <Lock className={cn("text-muted-foreground", compact ? "w-3 h-3" : "w-4 h-4")} />
      )}

      {/* Level badge */}
      <div className={cn(
        "flex items-center justify-center rounded-full font-bold",
        isLoggedIn 
          ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
          : "bg-muted text-muted-foreground",
        compact ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
      )}>
        {displayLevel}
      </div>

      {/* Progress section */}
      <div className={cn("flex flex-col", compact ? "w-16" : "w-24")}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Lvl {displayLevel}</span>
          {!compact && displayLevel < 100 && (
            <span className="text-muted-foreground">{displayLevel + 1}</span>
          )}
        </div>
        <Progress 
          value={displayProgress} 
          className={cn("h-1.5", compact && "h-1", !isLoggedIn && "opacity-50")} 
        />
      </div>

      {!compact && (
        isLoggedIn 
          ? <Trophy className="w-4 h-4 text-primary" />
          : <Trophy className="w-4 h-4 text-muted-foreground" />
      )}
    </motion.button>
  );
};
