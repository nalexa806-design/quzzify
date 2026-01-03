import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image, Type, Upload, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore, HomeworkAnswer } from "@/lib/store";
import { cn } from "@/lib/utils";

export const HomeworkPanel = () => {
  const {
    currentQuestion,
    setCurrentQuestion,
    currentImageUrl,
    setCurrentImageUrl,
    currentAnswer,
    setCurrentAnswer,
    isProcessing,
    setIsProcessing,
    addHomeworkToHistory,
    inputMode,
    setInputMode,
    canUploadImage,
    incrementImageUploads,
    setShowPremiumModal,
    targetAudience,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = (file: File) => {
    if (!canUploadImage()) {
      setShowPremiumModal(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (incrementImageUploads()) {
        setCurrentImageUrl(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handleSubmit = async () => {
    const questionText = currentQuestion.trim();
    if (questionText.length < 3 && !currentImageUrl) return;

    setIsProcessing(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock response based on problem complexity
    const isSimple = /^[\d\s+\-*/=.]+$/.test(questionText) && questionText.length < 20;
    const answer = generateMockAnswer(questionText, isSimple, targetAudience);

    setCurrentAnswer(answer);
    addHomeworkToHistory(answer);
    setIsProcessing(false);
  };

  const generateMockAnswer = (question: string, isSimple: boolean, audience: string): HomeworkAnswer => {
    const id = Date.now().toString();
    
    if (isSimple) {
      // Simple arithmetic
      try {
        const result = eval(question.replace(/[^0-9+\-*/().]/g, ""));
        return {
          id,
          question,
          answer: `${result}`,
          steps: [`${question} = ${result}`],
          finalAnswer: `${result}`,
          timestamp: Date.now(),
        };
      } catch {
        // Fall through to complex answer
      }
    }

    // Complex problem mock
    const isMiddleSchool = audience === "middle-school";
    const steps = isMiddleSchool
      ? [
          "1. First, let's understand what the problem is asking.",
          "2. We identify the key information given.",
          "3. Now we apply the appropriate formula or method.",
          "4. Calculate step by step.",
          "5. Check our answer makes sense.",
        ]
      : [
          "1. Analyze the problem structure and identify variables.",
          "2. Set up the relevant equations based on given conditions.",
          "3. Apply algebraic manipulation or geometric principles.",
          "4. Solve systematically, showing each transformation.",
          "5. Verify the solution by substitution.",
          "6. Consider edge cases and validate the result.",
        ];

    return {
      id,
      question,
      answer: "Here's how to solve this problem...",
      steps,
      finalAnswer: "42 (or the calculated result)",
      timestamp: Date.now(),
      imageUrl: currentImageUrl || undefined,
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input Section */}
      <div className="flex-1 p-4 overflow-y-auto md:overflow-visible">
        {/* Mobile Input Toggle */}
        <div className="flex gap-2 mb-4 md:hidden">
          <Button
            variant={inputMode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputMode("text")}
            className="flex-1"
          >
            <Type className="w-4 h-4 mr-2" />
            Type
          </Button>
          <Button
            variant={inputMode === "image" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputMode("image")}
            className="flex-1"
          >
            <Image className="w-4 h-4 mr-2" />
            Image
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {(inputMode === "text" || window.innerWidth >= 768) && (
            <motion.div
              key="text-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(inputMode === "image" && "hidden md:block")}
            >
              <Textarea
                placeholder="Type or paste your question here... (min. 3 characters)"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                className="min-h-[150px] resize-none bg-card border-2 border-border focus:border-primary transition-colors text-base"
              />
            </motion.div>
          )}

          {(inputMode === "image" || window.innerWidth >= 768) && (
            <motion.div
              key="image-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn("mt-4", inputMode === "text" && "hidden md:block")}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
              />

              {currentImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-primary bg-card">
                  <img
                    src={currentImageUrl}
                    alt="Uploaded problem"
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="absolute top-2 right-2"
                    onClick={() => setCurrentImageUrl(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-card"
                  )}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-foreground font-medium mb-1">
                    Drop an image or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    AI-powered OCR will extract the problem
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button - Desktop: inline, Mobile: fixed bottom */}
        <div className="hidden md:block mt-4">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || (currentQuestion.trim().length < 3 && !currentImageUrl)}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Solve Problem
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Submit Button - Fixed at bottom */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-20">
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || (currentQuestion.trim().length < 3 && !currentImageUrl)}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Solve Problem
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export const AnswerPanel = () => {
  const { currentAnswer, isProcessing } = useAppStore();

  return (
    <div className="h-full overflow-y-auto p-4">
      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse" />
              <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce-soft" />
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">Analyzing your problem...</p>
            <p className="text-sm text-muted-foreground">This won't take long</p>
          </motion.div>
        ) : currentAnswer ? (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Question */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Question</h3>
              <p className="text-foreground">{currentAnswer.question}</p>
              {currentAnswer.imageUrl && (
                <img
                  src={currentAnswer.imageUrl}
                  alt="Problem"
                  className="mt-3 rounded-lg max-h-[150px] object-contain"
                />
              )}
            </div>

            {/* Steps */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Step-by-Step Solution
              </h3>
              <div className="space-y-3">
                {currentAnswer.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <p className="text-foreground pt-0.5">{step.replace(/^\d+\.\s*/, "")}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Final Answer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5"
            >
              <h3 className="text-sm font-medium text-primary mb-2">Final Answer</h3>
              <p className="text-xl font-semibold text-foreground">{currentAnswer.finalAnswer}</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Ready to help!</h3>
            <p className="text-muted-foreground max-w-xs">
              Enter a question or upload an image to get a step-by-step solution
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
