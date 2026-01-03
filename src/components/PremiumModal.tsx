import { Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export const PremiumModal = () => {
  const { showPremiumModal, setShowPremiumModal, setIsPremium, isPremium } = useAppStore();

  const handleUnlock = () => {
    // In a real app, this would integrate with Stripe
    setIsPremium(true);
    setShowPremiumModal(false);
  };

  if (isPremium) return null;

  return (
    <AnimatePresence>
      {showPremiumModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={() => setShowPremiumModal(false)}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-md z-50"
          >
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-premium to-premium-glow p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-premium-foreground/20 mb-4">
                  <Crown className="w-8 h-8 text-premium-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-premium-foreground">
                  Unlock Premium
                </h2>
                <p className="text-premium-foreground/80 mt-2">
                  One-time purchase • Lifetime access
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold text-foreground">$2.99</span>
                  <span className="text-muted-foreground ml-2">one-time</span>
                </div>

                <ul className="space-y-3">
                  {[
                    "Unlimited homework submissions",
                    "Unlimited image uploads",
                    "Unlimited quizzes & history",
                    "Full step-by-step explanations",
                    "Create unlimited flashcard decks",
                    "Advanced problem types",
                    "Export results (PDF/CSV)",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 space-y-3">
                  <Button
                    variant="premium"
                    size="lg"
                    className="w-full"
                    onClick={handleUnlock}
                  >
                    <Crown className="w-5 h-5" />
                    Unlock Premium
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowPremiumModal(false)}
                  >
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
