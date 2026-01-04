import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Star, Zap, Gift, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useXp } from "@/hooks/useXp";
import { useAuth } from "@/hooks/useAuth";
import { getAllMilestones, getXpForLevel } from "@/lib/xp";
import { cn } from "@/lib/utils";

const Roadmap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { level, levelInfo, loading } = useXp();
  const milestones = getAllMilestones();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-4">You need to be logged in to view the roadmap.</p>
          <Button onClick={() => navigate("/auth")}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Level Roadmap</h1>
            <p className="text-sm text-muted-foreground">
              Level {level} • {levelInfo.currentXp.toLocaleString()} XP
            </p>
          </div>
        </div>
      </header>

      {/* Current Progress */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">{level}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">Level {level}</h2>
              <p className="text-muted-foreground">
                {level >= 100 
                  ? "Max level reached!" 
                  : `${(levelInfo.xpForNextLevel - levelInfo.currentXp).toLocaleString()} XP to level ${level + 1}`
                }
              </p>
            </div>
          </div>
          <Progress value={levelInfo.progress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {levelInfo.currentXp.toLocaleString()} / {levelInfo.xpForNextLevel.toLocaleString()} XP
          </p>
        </div>

        {/* Roadmap - Horizontal on desktop, vertical on mobile */}
        <div className="relative">
          {/* Desktop horizontal slider */}
          <div className="hidden md:block overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max px-4">
              {milestones.map((milestone, index) => {
                const isReached = level >= milestone.level;
                const isCurrent = level >= (milestones[index - 1]?.level ?? 0) && level < milestone.level;
                const xpRequired = getXpForLevel(milestone.level);

                return (
                  <motion.div
                    key={milestone.level}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative flex-shrink-0 w-64 p-5 rounded-2xl border-2 transition-all",
                      isReached
                        ? "bg-primary/10 border-primary"
                        : isCurrent
                        ? "bg-warning/10 border-warning"
                        : "bg-card border-border"
                    )}
                  >
                    {/* Connector line */}
                    {index < milestones.length - 1 && (
                      <div 
                        className={cn(
                          "absolute top-1/2 -right-6 w-6 h-1",
                          isReached ? "bg-primary" : "bg-border"
                        )} 
                      />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                      isReached 
                        ? "bg-primary text-primary-foreground" 
                        : milestone.level === 100 
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {milestone.level === 100 ? (
                        <Crown className="w-6 h-6" />
                      ) : isReached ? (
                        <Star className="w-6 h-6" />
                      ) : (
                        <Trophy className="w-6 h-6" />
                      )}
                    </div>

                    {/* Level badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "text-2xl font-bold",
                        isReached ? "text-primary" : "text-foreground"
                      )}>
                        Level {milestone.level}
                      </span>
                      {isReached && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          ✓ Reached
                        </span>
                      )}
                    </div>

                    {/* XP required */}
                    <p className="text-sm text-muted-foreground mb-3">
                      {xpRequired.toLocaleString()} XP required
                    </p>

                    {/* Rewards */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Gift className={cn(
                          "w-4 h-4",
                          isReached ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={isReached ? "text-foreground" : "text-muted-foreground"}>
                          +{milestone.bonusQuizzes} free quizzes
                        </span>
                      </div>
                      {milestone.bonusXpPerQuiz > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className={cn(
                            "w-4 h-4",
                            isReached ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className={isReached ? "text-foreground" : "text-muted-foreground"}>
                            +{milestone.bonusXpPerQuiz} XP per quiz
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile vertical list */}
          <div className="md:hidden space-y-4">
            {milestones.map((milestone, index) => {
              const isReached = level >= milestone.level;
              const isCurrent = level >= (milestones[index - 1]?.level ?? 0) && level < milestone.level;
              const xpRequired = getXpForLevel(milestone.level);

              return (
                <motion.div
                  key={milestone.level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {index < milestones.length - 1 && (
                    <div 
                      className={cn(
                        "absolute left-6 top-full w-1 h-4",
                        isReached ? "bg-primary" : "bg-border"
                      )} 
                    />
                  )}

                  <div className={cn(
                    "flex gap-4 p-4 rounded-xl border-2 transition-all",
                    isReached
                      ? "bg-primary/10 border-primary"
                      : isCurrent
                      ? "bg-warning/10 border-warning"
                      : "bg-card border-border"
                  )}>
                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      isReached 
                        ? "bg-primary text-primary-foreground" 
                        : milestone.level === 100 
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {milestone.level === 100 ? (
                        <Crown className="w-5 h-5" />
                      ) : isReached ? (
                        <Star className="w-5 h-5" />
                      ) : (
                        <Trophy className="w-5 h-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-lg font-bold",
                          isReached ? "text-primary" : "text-foreground"
                        )}>
                          Level {milestone.level}
                        </span>
                        {isReached && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            ✓
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {xpRequired.toLocaleString()} XP
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
