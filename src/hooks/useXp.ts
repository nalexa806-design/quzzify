import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLevelInfo, calculateQuizXp, getBonusQuizzesForLevel, LevelInfo } from '@/lib/xp';
import { useToast } from '@/hooks/use-toast';

interface XpState {
  xp: number;
  level: number;
  bonusQuizzes: number;
  loading: boolean;
}

export const useXp = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<XpState>({
    xp: 0,
    level: 1,
    bonusQuizzes: 0,
    loading: true,
  });

  // Fetch XP data from database
  const fetchXpData = async () => {
    if (!user) {
      setState({ xp: 0, level: 1, bonusQuizzes: 0, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('xp, level, bonus_quizzes')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setState({
        xp: data?.xp ?? 0,
        level: data?.level ?? 1,
        bonusQuizzes: data?.bonus_quizzes ?? 0,
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching XP:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchXpData();
  }, [user]);

  // Add XP after completing a quiz
  const addQuizXp = async (correctAnswers: number, totalQuestions: number): Promise<{
    xpEarned: number;
    newLevel: number;
    leveledUp: boolean;
    newBonusQuizzes: number;
  } | null> => {
    if (!user || !session) {
      toast({
        title: "Login required",
        description: "You need to be logged in to earn XP.",
        variant: "destructive",
      });
      return null;
    }

    const xpEarned = calculateQuizXp(correctAnswers, totalQuestions, state.level);
    const newTotalXp = state.xp + xpEarned;
    const newLevelInfo = getLevelInfo(newTotalXp);
    const leveledUp = newLevelInfo.level > state.level;
    const newBonusQuizzes = getBonusQuizzesForLevel(newLevelInfo.level);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          xp: newTotalXp,
          level: newLevelInfo.level,
          bonus_quizzes: newBonusQuizzes,
        })
        .eq('id', user.id);

      if (error) throw error;

      setState({
        xp: newTotalXp,
        level: newLevelInfo.level,
        bonusQuizzes: newBonusQuizzes,
        loading: false,
      });

      if (leveledUp) {
        toast({
          title: `Level Up! 🎉`,
          description: `You reached level ${newLevelInfo.level}!`,
        });
      }

      return {
        xpEarned,
        newLevel: newLevelInfo.level,
        leveledUp,
        newBonusQuizzes,
      };
    } catch (err) {
      console.error('Error updating XP:', err);
      toast({
        title: "Error",
        description: "Failed to save XP. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const levelInfo: LevelInfo = getLevelInfo(state.xp);

  return {
    xp: state.xp,
    level: state.level,
    bonusQuizzes: state.bonusQuizzes,
    loading: state.loading,
    levelInfo,
    addQuizXp,
    refetch: fetchXpData,
  };
};
