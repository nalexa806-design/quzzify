import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, History, Image, CheckCircle, XCircle, HelpCircle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, Quiz, QuizQuestion } from "@/lib/store";
import { cn } from "@/lib/utils";

const SAMPLE_TOPICS = [
  "Basic Algebra",
  "Geometry Basics",
  "Fractions & Decimals",
  "Statistics 101",
  "Word Problems",
];

export const QuizzesTab = () => {
  const {
    quizHistory,
    activeQuiz,
    setActiveQuiz,
    addQuiz,
    updateQuiz,
    canCreateQuiz,
    setShowPremiumModal,
    isPremium,
    quizzesCreated,
  } = useAppStore();

  const [showHistory, setShowHistory] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    if (!canCreateQuiz()) {
      setShowPremiumModal(true);
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const quiz: Quiz = {
      id: Date.now().toString(),
      title: topic,
      topic,
      questions: generateMockQuestions(topic),
      completed: false,
      timestamp: Date.now(),
    };

    if (addQuiz(quiz)) {
      setActiveQuiz(quiz);
      setCurrentQuestionIndex(0);
    }
    setIsGenerating(false);
    setTopic("");
  };

  const generateMockQuestions = (topic: string): QuizQuestion[] => {
    return [
      {
        id: "1",
        question: `What is the main concept in ${topic}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        explanation: "This is because Option A represents the fundamental principle.",
      },
      {
        id: "2",
        question: `Which formula is commonly used in ${topic}?`,
        options: ["Formula 1", "Formula 2", "Formula 3", "Formula 4"],
        correctAnswer: 1,
        explanation: "Formula 2 is the standard approach for this type of problem.",
      },
      {
        id: "3",
        question: `How do you solve a typical ${topic} problem?`,
        options: ["Step A", "Step B", "Step C", "Step D"],
        correctAnswer: 2,
        explanation: "Step C provides the most efficient solution method.",
      },
    ];
  };

  const handleAnswer = (answerIndex: number) => {
    if (!activeQuiz) return;

    const updatedQuestions = [...activeQuiz.questions];
    updatedQuestions[currentQuestionIndex].userAnswer = answerIndex;

    const allAnswered = updatedQuestions.every((q) => q.userAnswer !== undefined);
    const score = allAnswered
      ? updatedQuestions.filter((q) => q.userAnswer === q.correctAnswer).length
      : undefined;

    updateQuiz(activeQuiz.id, {
      questions: updatedQuestions,
      completed: allAnswered,
      score,
    });

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex((i) => i + 1), 500);
    }
  };

  const remainingQuizzes = 5 - quizzesCreated;

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Quizzes</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="gap-2"
        >
          <History className="w-4 h-4" />
          History ({quizHistory.length})
        </Button>
      </div>

      {/* Free limit indicator */}
      {!isPremium && (
        <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <span className="text-warning font-medium">{remainingQuizzes}</span>
          <span className="text-muted-foreground"> free quizzes remaining</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(false)}
              className="mb-4"
            >
              ← Back to Quiz
            </Button>
            {quizHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No quiz history yet</p>
              </div>
            ) : (
              quizHistory.map((quiz) => (
                <motion.button
                  key={quiz.id}
                  onClick={() => {
                    setActiveQuiz(quiz);
                    setCurrentQuestionIndex(0);
                    setShowHistory(false);
                  }}
                  className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {quiz.questions.length} questions
                      </p>
                    </div>
                    {quiz.completed && (
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">
                          {quiz.score}/{quiz.questions.length}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        ) : activeQuiz ? (
          <motion.div
            key="active-quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveQuiz(null)}
              className="mb-4"
            >
              ← Back
            </Button>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                <span>{activeQuiz.topic}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question */}
            <QuestionCard
              question={activeQuiz.questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              isPremium={isPremium}
            />

            {/* Results */}
            {activeQuiz.completed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-center"
              >
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Quiz Complete!
                </h3>
                <p className="text-4xl font-bold text-primary">
                  {activeQuiz.score}/{activeQuiz.questions.length}
                </p>
                <Button
                  onClick={() => {
                    setActiveQuiz(null);
                    setCurrentQuestionIndex(0);
                  }}
                  className="mt-4"
                >
                  Start New Quiz
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Create Quiz */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a topic (e.g., Quadratic Equations)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
                />
                <Button onClick={generateQuiz} disabled={isGenerating || !topic.trim()}>
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Image upload note */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                <Image className="w-4 h-4" />
                <span>Image uploads supported for quiz questions</span>
              </div>

              {/* Video/Audio note */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Video & Audio inputs — Coming Soon</span>
              </div>

              {/* Quick topics */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Quick start:</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_TOPICS.map((t) => (
                    <Button
                      key={t}
                      variant="secondary"
                      size="sm"
                      onClick={() => setTopic(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuestionCard = ({
  question,
  onAnswer,
  isPremium,
}: {
  question: QuizQuestion;
  onAnswer: (index: number) => void;
  isPremium: boolean;
}) => {
  const answered = question.userAnswer !== undefined;
  const isCorrect = question.userAnswer === question.correctAnswer;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">{question.question}</h3>

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = question.userAnswer === index;
          const showCorrect = answered && index === question.correctAnswer;
          const showWrong = answered && isSelected && !isCorrect;

          return (
            <motion.button
              key={index}
              onClick={() => !answered && onAnswer(index)}
              disabled={answered}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all border-2",
                answered
                  ? showCorrect
                    ? "border-success bg-success/10"
                    : showWrong
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-card opacity-50"
                  : "border-border bg-card hover:border-primary/50"
              )}
              whileHover={!answered ? { scale: 1.01 } : {}}
              whileTap={!answered ? { scale: 0.99 } : {}}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  answered && showCorrect && "text-success font-medium",
                  answered && showWrong && "text-destructive"
                )}>
                  {option}
                </span>
                {answered && showCorrect && <CheckCircle className="w-5 h-5 text-success" />}
                {answered && showWrong && <XCircle className="w-5 h-5 text-destructive" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-4 rounded-xl bg-secondary/50"
        >
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Explanation</p>
              {isPremium ? (
                <p className="text-muted-foreground">{question.explanation}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  Upgrade to Premium for full explanations
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
