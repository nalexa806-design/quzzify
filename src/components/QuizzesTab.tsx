import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, History, Image, CheckCircle, XCircle, HelpCircle, Lock, Loader2, Trophy, Clock, Zap, Type, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore, Quiz, QuizQuestion } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useXp } from "@/hooks/useXp";
import { useAuth } from "@/hooks/useAuth";
import { formatTime, calculateQuizXp } from "@/lib/xp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type QuizInputMode = "topic" | "notes" | "upload";

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

  const { user } = useAuth();
  const { level, addQuizXp, bonusQuizzes } = useXp();

  const [showHistory, setShowHistory] = useState(false);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [quizInputMode, setQuizInputMode] = useState<QuizInputMode>("topic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionCount, setQuestionCount] = useState(5);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [quizTimer, setQuizTimer] = useState(0);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const maxQuestions = isPremium ? 20 : 7;
  const minQuestions = 3;

  // Timer effect
  useEffect(() => {
    if (activeQuiz && !activeQuiz.completed) {
      timerRef.current = setInterval(() => {
        setQuizTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeQuiz, activeQuiz?.completed]);

  // Reset timer when starting new quiz
  const startQuiz = (quiz: Quiz) => {
    setQuizTimer(0);
    setXpEarned(null);
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const getQuizSource = () => {
    if (quizInputMode === "topic") return topic.trim();
    if (quizInputMode === "notes") return notes.trim();
    if (quizInputMode === "upload") return uploadedImageUrl ? "Image uploaded" : "";
    return "";
  };

  const generateQuiz = async () => {
    const source = getQuizSource();
    if (!source) return;
    if (!canCreateQuiz()) {
      setShowPremiumModal(true);
      return;
    }

    setIsGenerating(true);
    
    let questions: QuizQuestion[] = [];
    
    try {
      if (quizInputMode === "topic") {
        // Use mock questions for predefined topics, AI for custom topics
        const mockQuestions = generateMockQuestions(topic);
        if (mockQuestions.length > 0 && mockQuestions[0].question.includes("key principle")) {
          // Custom topic - use AI
          const { data, error } = await supabase.functions.invoke('generate-quiz', {
            body: { topic, questionCount }
          });
          
          if (error) throw error;
          if (data?.questions) {
            questions = data.questions;
          } else {
            throw new Error("No questions returned");
          }
        } else {
          // Predefined topic - use mock
          questions = mockQuestions.slice(0, questionCount);
        }
      } else if (quizInputMode === "notes") {
        // Use AI for notes
        const { data, error } = await supabase.functions.invoke('generate-quiz', {
          body: { notes, questionCount }
        });
        
        if (error) throw error;
        if (data?.questions) {
          questions = data.questions;
        } else {
          throw new Error("No questions returned");
        }
      } else if (quizInputMode === "upload" && uploadedImageUrl) {
        // Use AI for image
        const { data, error } = await supabase.functions.invoke('generate-quiz', {
          body: { imageBase64: uploadedImageUrl, questionCount }
        });
        
        if (error) throw error;
        if (data?.questions) {
          questions = data.questions;
        } else {
          throw new Error("No questions returned");
        }
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast.error("Failed to generate quiz. Please try again.");
      setIsGenerating(false);
      return;
    }

    if (questions.length === 0) {
      toast.error("Could not generate questions. Please try again.");
      setIsGenerating(false);
      return;
    }

    const quizTitle = quizInputMode === "topic" ? topic : 
                      quizInputMode === "notes" ? "Quiz from Notes" : 
                      "Quiz from Image";
    
    const quiz: Quiz = {
      id: Date.now().toString(),
      title: quizTitle,
      topic: quizInputMode === "topic" ? topic : quizInputMode === "notes" ? "From notes" : "From image",
      questions,
      completed: false,
      timestamp: Date.now(),
    };

    if (addQuiz(quiz)) {
      startQuiz(quiz);
    }
    setIsGenerating(false);
    setTopic("");
    setNotes("");
    setUploadedImageUrl(null);
  };

  const generateMockQuestions = (topic: string): QuizQuestion[] => {
    const topicQuestions: Record<string, QuizQuestion[]> = {
      "Basic Algebra": [
        {
          id: "1",
          question: "What is the value of x in the equation 2x + 6 = 14?",
          options: ["x = 2", "x = 4", "x = 6", "x = 8"],
          correctAnswer: 1,
          explanation: "Subtract 6 from both sides: 2x = 8, then divide by 2: x = 4.",
        },
        {
          id: "2",
          question: "True or False: The expression 3(x + 2) equals 3x + 6.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "Using the distributive property: 3(x + 2) = 3·x + 3·2 = 3x + 6.",
        },
        {
          id: "3",
          question: "Simplify: 5x + 3x - 2x",
          options: ["6x", "8x", "10x", "4x"],
          correctAnswer: 0,
          explanation: "Combine like terms: 5x + 3x - 2x = (5 + 3 - 2)x = 6x.",
        },
      ],
      "Geometry Basics": [
        {
          id: "1",
          question: "What is the sum of angles in a triangle?",
          options: ["90°", "180°", "270°", "360°"],
          correctAnswer: 1,
          explanation: "The sum of interior angles in any triangle is always 180 degrees.",
        },
        {
          id: "2",
          question: "True or False: A square has 4 equal sides and 4 right angles.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "By definition, a square has 4 equal sides and 4 angles of 90°.",
        },
        {
          id: "3",
          question: "What is the area of a rectangle with length 8 and width 5?",
          options: ["13 sq units", "26 sq units", "40 sq units", "80 sq units"],
          correctAnswer: 2,
          explanation: "Area of rectangle = length × width = 8 × 5 = 40 square units.",
        },
      ],
      "Fractions & Decimals": [
        {
          id: "1",
          question: "What is 1/4 + 1/4?",
          options: ["1/8", "2/8", "1/2", "2/4"],
          correctAnswer: 2,
          explanation: "1/4 + 1/4 = 2/4 = 1/2 when simplified.",
        },
        {
          id: "2",
          question: "True or False: 0.5 is equivalent to 1/2.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "0.5 means 5/10, which simplifies to 1/2.",
        },
        {
          id: "3",
          question: "Convert 3/4 to a decimal.",
          options: ["0.25", "0.50", "0.75", "0.80"],
          correctAnswer: 2,
          explanation: "3 ÷ 4 = 0.75.",
        },
      ],
      "Statistics 101": [
        {
          id: "1",
          question: "What is the mean of 2, 4, 6, 8?",
          options: ["4", "5", "6", "7"],
          correctAnswer: 1,
          explanation: "Mean = (2+4+6+8)/4 = 20/4 = 5.",
        },
        {
          id: "2",
          question: "True or False: The median is the middle value in a sorted dataset.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "The median is the middle value when data is arranged in order.",
        },
        {
          id: "3",
          question: "What is the mode of: 3, 5, 5, 7, 9?",
          options: ["3", "5", "7", "9"],
          correctAnswer: 1,
          explanation: "The mode is the most frequently occurring value, which is 5.",
        },
      ],
      "Word Problems": [
        {
          id: "1",
          question: "If you have 15 apples and give away 7, how many remain?",
          options: ["6", "7", "8", "22"],
          correctAnswer: 2,
          explanation: "15 - 7 = 8 apples remaining.",
        },
        {
          id: "2",
          question: "True or False: If a shirt costs $20 and is 25% off, the discount is $5.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "25% of $20 = 0.25 × 20 = $5 discount.",
        },
        {
          id: "3",
          question: "A train travels 60 miles in 2 hours. What is its speed?",
          options: ["20 mph", "30 mph", "40 mph", "120 mph"],
          correctAnswer: 1,
          explanation: "Speed = distance/time = 60 miles ÷ 2 hours = 30 mph.",
        },
      ],
    };

    // Return specific questions if topic matches, otherwise generate generic ones
    if (topicQuestions[topic]) {
      return topicQuestions[topic];
    }

    return [
      {
        id: "1",
        question: `What is a key principle in ${topic}?`,
        options: ["Understanding the basics first", "Memorizing formulas only", "Skipping practice", "Ignoring theory"],
        correctAnswer: 0,
        explanation: "Understanding the basics provides a strong foundation for learning any topic.",
      },
      {
        id: "2",
        question: `True or False: Practice is essential for mastering ${topic}.`,
        options: ["True", "False"],
        correctAnswer: 0,
        explanation: "Regular practice reinforces concepts and improves problem-solving skills.",
      },
      {
        id: "3",
        question: `Which approach works best for studying ${topic}?`,
        options: ["Break it into smaller parts", "Try to learn everything at once", "Only read without practicing", "Skip difficult sections"],
        correctAnswer: 0,
        explanation: "Breaking topics into smaller parts makes learning more manageable and effective.",
      },
    ];
  };

  const handleAnswer = (answerIndex: number) => {
    if (!activeQuiz || showAnswerFeedback) return;

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

    setShowAnswerFeedback(true);
  };

  const handleNext = async () => {
    if (!activeQuiz) return;
    setShowAnswerFeedback(false);
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Award XP if logged in
      if (user && activeQuiz.score !== undefined) {
        const result = await addQuizXp(activeQuiz.score, activeQuiz.questions.length);
        if (result) {
          setXpEarned(result.xpEarned);
        }
      }
      
      setShowResultsModal(true);
    }
  };

  const remainingQuizzes = 3 - quizzesCreated;

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

            {/* Timer and Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(quizTimer)}</span>
                </div>
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
              <p className="text-xs text-muted-foreground mt-1">{activeQuiz.topic}</p>
            </div>

            {/* Question */}
            <QuestionCard
              question={activeQuiz.questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              isPremium={isPremium}
              showAnswerFeedback={showAnswerFeedback}
              onNext={handleNext}
              isLastQuestion={currentQuestionIndex === activeQuiz.questions.length - 1}
            />

            {/* Results Modal */}
            <AnimatePresence>
              {showResultsModal && activeQuiz.completed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => setShowResultsModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Quiz Complete!
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      You answered {activeQuiz.score} out of {activeQuiz.questions.length} correctly
                    </p>
                    
                    {/* Score progress bar */}
                    <div className="mb-4">
                      <div className="h-4 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full",
                            (activeQuiz.score! / activeQuiz.questions.length) >= 0.7
                              ? "bg-success"
                              : (activeQuiz.score! / activeQuiz.questions.length) >= 0.4
                              ? "bg-warning"
                              : "bg-destructive"
                          )}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(activeQuiz.score! / activeQuiz.questions.length) * 100}%`,
                          }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <p className="text-3xl font-bold text-primary mt-3">
                        {Math.round((activeQuiz.score! / activeQuiz.questions.length) * 100)}%
                      </p>
                    </div>

                    {/* Time taken */}
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      <span>Time: {formatTime(quizTimer)}</span>
                    </div>

                    {/* XP earned */}
                    {xpEarned !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center gap-2 text-lg font-bold text-primary mb-4"
                      >
                        <Zap className="w-5 h-5" />
                        <span>+{xpEarned} XP</span>
                      </motion.div>
                    )}
                    
                    {!user && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Login to earn XP and track your progress!
                      </p>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowResultsModal(false);
                          setCurrentQuestionIndex(0);
                        }}
                        className="flex-1"
                      >
                        Review Answers
                      </Button>
                      <Button
                        onClick={() => {
                          setShowResultsModal(false);
                          setActiveQuiz(null);
                          setCurrentQuestionIndex(0);
                        }}
                        className="flex-1"
                      >
                        New Quiz
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
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
              {/* Input Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={quizInputMode === "topic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuizInputMode("topic")}
                  className="flex-1"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Topic
                </Button>
                <Button
                  variant={quizInputMode === "notes" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuizInputMode("notes")}
                  className="flex-1"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Notes
                </Button>
                <Button
                  variant={quizInputMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuizInputMode("upload")}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>

              {/* Topic Input */}
              {quizInputMode === "topic" && (
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
              )}

              {/* Notes Input */}
              {quizInputMode === "notes" && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste your study notes here and we'll generate quiz questions from them..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[150px] resize-none bg-card border-2 border-border focus:border-primary transition-colors"
                  />
                  <Button onClick={generateQuiz} disabled={isGenerating || !notes.trim()} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Quiz from Notes
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Upload Input */}
              {quizInputMode === "upload" && (
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="hidden"
                  />
                  {uploadedImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-primary bg-card">
                      <img
                        src={uploadedImageUrl}
                        alt="Uploaded notes"
                        className="w-full h-auto max-h-[200px] object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        className="absolute top-2 right-2"
                        onClick={() => setUploadedImageUrl(null)}
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all border-border hover:border-primary/50 hover:bg-card"
                    >
                      <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-foreground font-medium mb-1">
                        Upload notes or textbook image
                      </p>
                      <p className="text-sm text-muted-foreground">
                        AI will generate quiz questions from the content
                      </p>
                    </div>
                  )}
                  <Button onClick={generateQuiz} disabled={isGenerating || !uploadedImageUrl} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Quiz from Image
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Question count selector */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Number of questions</span>
                  <span className="text-lg font-bold text-primary">{questionCount}</span>
                </div>
                <Slider
                  value={[questionCount]}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  min={minQuestions}
                  max={maxQuestions}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{minQuestions}</span>
                  <span>{maxQuestions}{!isPremium && " (Premium: up to 20)"}</span>
                </div>
              </div>

              {/* Video/Audio note */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Video & Audio inputs — Coming Soon</span>
              </div>

              {/* Quick topics - only show in topic mode */}
              {quizInputMode === "topic" && (
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
              )}
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
  showAnswerFeedback,
  onNext,
  isLastQuestion,
}: {
  question: QuizQuestion;
  onAnswer: (index: number) => void;
  isPremium: boolean;
  showAnswerFeedback: boolean;
  onNext: () => void;
  isLastQuestion: boolean;
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

      {/* Explanation - always shown in both free and premium */}
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
              <p className="text-muted-foreground">{question.explanation}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Next button */}
      {showAnswerFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button onClick={onNext} className="w-full h-14 text-lg font-semibold">
            {isLastQuestion ? "See Results" : "Next Question"}
          </Button>
        </motion.div>
      )}
    </div>
  );
};
