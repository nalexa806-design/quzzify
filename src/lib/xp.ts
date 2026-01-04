// XP calculation utilities

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number; // 0-100
  totalXpRequired: number;
}

export interface MilestoneReward {
  level: number;
  bonusQuizzes: number;
  bonusXpPerQuiz: number;
  description: string;
}

// XP required for each level (level 1 = 350, increases by 50 each level)
export const getXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  // Level 2 needs 350, Level 3 needs 400, etc.
  // Sum of arithmetic sequence: 350 + 400 + 450 + ... for levels 2 to level
  const n = level - 1; // number of terms
  // Sum = n/2 * (2*350 + (n-1)*50)
  return Math.floor((n / 2) * (2 * 350 + (n - 1) * 50));
};

// Get level from total XP
export const getLevelFromXp = (totalXp: number): number => {
  let level = 1;
  while (getXpForLevel(level + 1) <= totalXp && level < 100) {
    level++;
  }
  return level;
};

// Get detailed level info
export const getLevelInfo = (totalXp: number): LevelInfo => {
  const level = getLevelFromXp(totalXp);
  const xpForCurrentLevel = getXpForLevel(level);
  const xpForNextLevel = level < 100 ? getXpForLevel(level + 1) : xpForCurrentLevel;
  const xpInCurrentLevel = totalXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progress = level >= 100 ? 100 : Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100);

  return {
    level,
    currentXp: totalXp,
    xpForCurrentLevel,
    xpForNextLevel,
    progress,
    totalXpRequired: xpForNextLevel,
  };
};

// Calculate XP earned from quiz based on score percentage
export const calculateQuizXp = (
  correctAnswers: number, 
  totalQuestions: number, 
  userLevel: number
): number => {
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  let baseXp = 0;
  if (percentage >= 100) baseXp = 150;
  else if (percentage >= 60) baseXp = 100;
  else if (percentage >= 50) baseXp = 70;
  else if (percentage >= 40) baseXp = 55;
  else if (percentage >= 30) baseXp = 40;
  else if (percentage >= 20) baseXp = 20;
  else if (percentage >= 10) baseXp = 10;

  // Add milestone bonus if applicable
  const milestoneBonus = getMilestoneXpBonus(userLevel);
  
  return baseXp + milestoneBonus;
};

// Get milestone levels (every 5 levels from 5 to 95)
export const getMilestoneLevels = (): number[] => {
  const milestones: number[] = [];
  for (let i = 5; i <= 95; i += 5) {
    milestones.push(i);
  }
  milestones.push(100); // Final milestone
  return milestones;
};

// Check if a level is a milestone
export const isMilestoneLevel = (level: number): boolean => {
  if (level === 100) return true;
  return level >= 5 && level <= 95 && level % 5 === 0;
};

// Get cumulative bonus quizzes for a level
export const getBonusQuizzesForLevel = (level: number): number => {
  if (level >= 100) {
    // All milestones from 5-95 (19 milestones * 3) + level 100 bonus
    return 19 * 3 + 1000;
  }
  
  // Count how many milestones have been reached
  let bonusQuizzes = 0;
  for (let i = 5; i <= Math.min(level, 95); i += 5) {
    if (i <= level) {
      bonusQuizzes += 3;
    }
  }
  return bonusQuizzes;
};

// Get XP bonus per quiz for current level
export const getMilestoneXpBonus = (level: number): number => {
  // Count how many milestones have been passed (not including current)
  let bonusXp = 0;
  for (let i = 5; i <= Math.min(level, 95); i += 5) {
    if (i <= level) {
      bonusXp += 200;
    }
  }
  return bonusXp;
};

// Get all milestones with their rewards
export const getAllMilestones = (): MilestoneReward[] => {
  const milestones: MilestoneReward[] = [];
  
  // Levels 5-95 (every 5)
  for (let i = 5; i <= 95; i += 5) {
    const cumulativeBonusXp = Math.floor(i / 5) * 200;
    milestones.push({
      level: i,
      bonusQuizzes: 3,
      bonusXpPerQuiz: 200,
      description: `+3 free quizzes & +200 XP per quiz (total: +${cumulativeBonusXp} XP/quiz)`,
    });
  }
  
  // Level 100
  milestones.push({
    level: 100,
    bonusQuizzes: 1000,
    bonusXpPerQuiz: 0,
    description: "+1000 free quizzes - Master status!",
  });
  
  return milestones;
};

// Format time for timer display
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
