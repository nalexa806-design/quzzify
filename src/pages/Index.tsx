import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, HelpCircle, Layers, LogIn, LogOut, User } from "lucide-react";
import { useAppStore, TabType } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { PremiumButton } from "@/components/PremiumButton";
import { PremiumModal } from "@/components/PremiumModal";
import { BottomTabs } from "@/components/BottomTabs";
import { HomeworkPanel, AnswerPanel } from "@/components/HomeworkTab";
import { QuizzesTab } from "@/components/QuizzesTab";
import { FlashcardsTab } from "@/components/FlashcardsTab";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const desktopTabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "quizzes", label: "Quizzes", icon: HelpCircle },
  { id: "flashcards", label: "Flashcards", icon: Layers },
];

const Index = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const { user, signOut, checkPremiumStatus } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Check for payment success/cancel in URL
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast({
        title: "Payment successful!",
        description: "Welcome to Premium! Your account is being upgraded.",
      });
      checkPremiumStatus();
      // Clean up URL
      window.history.replaceState({}, "", "/");
    } else if (payment === "canceled") {
      toast({
        title: "Payment canceled",
        description: "Your payment was not completed.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, toast, checkPremiumStatus]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Quizzify</span>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDesktopTab"
                      className="absolute inset-0 bg-primary/10 rounded-lg"
                      transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side: Auth + Premium */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground truncate max-w-32">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            )}
            <PremiumButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "homework" && (
              <div className="grid md:grid-cols-2 gap-6 md:h-[min(680px,calc(100dvh-200px))] md:overflow-hidden">
                {/* Input Panel */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-0">
                  <div className="p-4 border-b border-border bg-secondary/30">
                    <h2 className="font-semibold text-foreground">Your Question</h2>
                  </div>
                  <HomeworkPanel />
                </div>

                {/* Answer Panel */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-0">
                  <div className="p-4 border-b border-border bg-secondary/30">
                    <h2 className="font-semibold text-foreground">Solution</h2>
                  </div>
                  <AnswerPanel />
                </div>
              </div>
            )}

            {activeTab === "quizzes" && (
              <div className="bg-card rounded-2xl border border-border shadow-sm min-h-[calc(100vh-200px)]">
                <QuizzesTab />
              </div>
            )}

            {activeTab === "flashcards" && (
              <div className="bg-card rounded-2xl border border-border shadow-sm min-h-[calc(100vh-200px)]">
                <FlashcardsTab />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tabs */}
      <BottomTabs />

      {/* Premium Modal */}
      <PremiumModal />
    </div>
  );
};

export default Index;
