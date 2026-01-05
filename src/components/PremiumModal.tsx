import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const PremiumModal = () => {
  const { showPremiumModal, setShowPremiumModal, isPremium } = useAppStore();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    if (!user || !session) {
      toast({
        title: "Login required",
        description: "Please log in to purchase premium.",
      });
      setShowPremiumModal(false);
      navigate("/auth");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        setShowPremiumModal(false);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        title: "Checkout failed",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border w-full max-w-md">
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
                    "Unlimited homework solves",
                    "Unlimited quizzes (up to 20 questions)",
                    "Unlimited flashcard decks (up to 20 cards)",
                    "In-depth homework explanations",
                    "Unlimited image uploads",
                    "Full step-by-step solutions",
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
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Opening checkout...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        Unlock Premium
                      </>
                    )}
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
