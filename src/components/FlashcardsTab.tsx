import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RotateCcw, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, FlashcardDeck, Flashcard } from "@/lib/store";
import { cn } from "@/lib/utils";

const SAMPLE_DECK: Flashcard[] = [
  { id: "1", front: "What is the quadratic formula?", back: "x = (-b ± √(b²-4ac)) / 2a", mastered: false },
  { id: "2", front: "What is the Pythagorean theorem?", back: "a² + b² = c²", mastered: false },
  { id: "3", front: "What is the area of a circle?", back: "A = πr²", mastered: false },
  { id: "4", front: "What is slope-intercept form?", back: "y = mx + b", mastered: false },
  { id: "5", front: "What is the circumference of a circle?", back: "C = 2πr or C = πd", mastered: false },
  { id: "6", front: "What is the volume of a cube?", back: "V = s³", mastered: false },
  { id: "7", front: "What is PEMDAS?", back: "Parentheses, Exponents, Multiplication, Division, Addition, Subtraction", mastered: false },
  { id: "8", front: "What is the area of a triangle?", back: "A = ½bh", mastered: false },
];

export const FlashcardsTab = () => {
  const {
    flashcardDecks,
    activeDeck,
    setActiveDeck,
    createFlashcardDeck,
    updateDeck,
    hasUsedFreeTrial,
    setHasUsedFreeTrial,
    canUseFlashcards,
    setShowPremiumModal,
    isPremium,
  } = useAppStore();

  const [deckTitle, setDeckTitle] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleTryFree = () => {
    if (hasUsedFreeTrial && !isPremium) {
      setShowPremiumModal(true);
      return;
    }

    const freeDeck: FlashcardDeck = {
      id: "free-trial",
      title: "Math Fundamentals (Free Trial)",
      cards: SAMPLE_DECK.slice(0, 8),
      currentIndex: 0,
      cycleCount: 0,
      timestamp: Date.now(),
    };

    setActiveDeck(freeDeck);
  };

  const handleCreateDeck = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    if (!deckTitle.trim()) return;

    const newDeck: FlashcardDeck = {
      id: Date.now().toString(),
      title: deckTitle,
      cards: [], // In a real app, this would be populated by AI
      currentIndex: 0,
      cycleCount: 0,
      timestamp: Date.now(),
    };

    if (createFlashcardDeck(newDeck)) {
      setActiveDeck(newDeck);
      setDeckTitle("");
      setShowCreateForm(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <AnimatePresence mode="wait">
        {activeDeck ? (
          <FlashcardViewer
            deck={activeDeck}
            onClose={() => {
              if (activeDeck.id === "free-trial") {
                setHasUsedFreeTrial(true);
              }
              setActiveDeck(null);
            }}
            onUpdate={(updates) => {
              if (activeDeck.id !== "free-trial") {
                updateDeck(activeDeck.id, updates);
              } else {
                setActiveDeck({ ...activeDeck, ...updates });
              }
            }}
            isPremium={isPremium}
            isFreeTrial={activeDeck.id === "free-trial"}
          />
        ) : (
          <motion.div
            key="deck-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Flashcards</h2>
              <Button
                onClick={() => isPremium ? setShowCreateForm(true) : setShowPremiumModal(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Deck
              </Button>
            </div>

            {/* Free Trial Banner */}
            {!isPremium && !hasUsedFreeTrial && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold text-foreground">Try Flashcards Free!</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Experience our flashcard system with a sample deck. Free users get one trial cycle.
                </p>
                <Button onClick={handleTryFree}>
                  Start Free Trial
                </Button>
              </motion.div>
            )}

            {/* Free user restriction notice */}
            {!isPremium && hasUsedFreeTrial && (
              <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">Free trial completed</p>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Premium for unlimited flashcard decks
                    </p>
                  </div>
                </div>
                <Button
                  variant="premium"
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowPremiumModal(true)}
                >
                  Unlock Premium
                </Button>
              </div>
            )}

            {/* Create Form */}
            <AnimatePresence>
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-medium text-foreground mb-3">Create New Deck</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Deck title (e.g., Algebra 101)"
                        value={deckTitle}
                        onChange={(e) => setDeckTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateDeck()}
                      />
                      <Button onClick={handleCreateDeck}>Create</Button>
                      <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deck List */}
            {isPremium && flashcardDecks.length > 0 ? (
              <div className="grid gap-3">
                {flashcardDecks.map((deck) => (
                  <motion.button
                    key={deck.id}
                    onClick={() => setActiveDeck(deck)}
                    className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <h3 className="font-medium text-foreground">{deck.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {deck.cards.length} cards • Cycle {deck.cycleCount}
                    </p>
                  </motion.button>
                ))}
              </div>
            ) : isPremium ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No decks yet. Create your first flashcard deck!</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FlashcardViewer = ({
  deck,
  onClose,
  onUpdate,
  isPremium,
  isFreeTrial,
}: {
  deck: FlashcardDeck;
  onClose: () => void;
  onUpdate: (updates: Partial<FlashcardDeck>) => void;
  isPremium: boolean;
  isFreeTrial: boolean;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { setShowPremiumModal } = useAppStore();

  const currentCard = deck.cards[deck.currentIndex];
  const progress = ((deck.currentIndex + 1) / deck.cards.length) * 100;

  const handleNext = () => {
    setIsFlipped(false);
    if (deck.currentIndex < deck.cards.length - 1) {
      onUpdate({ currentIndex: deck.currentIndex + 1 });
    } else {
      // End of deck
      if (isFreeTrial && !isPremium) {
        setShowPremiumModal(true);
        onClose();
      } else {
        onUpdate({ currentIndex: 0, cycleCount: deck.cycleCount + 1 });
      }
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (deck.currentIndex > 0) {
      onUpdate({ currentIndex: deck.currentIndex - 1 });
    }
  };

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No cards in this deck</p>
        <Button variant="ghost" onClick={onClose} className="mt-4">
          ← Back
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Button variant="ghost" size="sm" onClick={onClose} className="mb-4">
        ← Back to Decks
      </Button>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Card {deck.currentIndex + 1} of {deck.cards.length}</span>
          <span>Cycle {deck.cycleCount + 1}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="perspective-1000 mb-6">
        <motion.div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full aspect-[3/2] cursor-pointer preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", damping: 20 }}
        >
          {/* Front */}
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-card border-2 border-border p-6 flex items-center justify-center backface-hidden shadow-lg",
          )}>
            <p className="text-xl text-center text-foreground font-medium">
              {currentCard.front}
            </p>
          </div>

          {/* Back */}
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-6 flex items-center justify-center backface-hidden rotate-y-180 shadow-lg",
          )}>
            <p className="text-xl text-center text-foreground font-medium">
              {currentCard.back}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tap hint */}
      <p className="text-center text-sm text-muted-foreground mb-6">
        Tap card to flip
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon-lg"
          onClick={handlePrev}
          disabled={deck.currentIndex === 0}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsFlipped(false);
            onUpdate({ currentIndex: 0 });
          }}
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          variant="default"
          size="icon-lg"
          onClick={handleNext}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Free trial warning */}
      {isFreeTrial && !isPremium && (
        <p className="text-center text-sm text-warning mt-6">
          Free trial: Deck ends after one cycle
        </p>
      )}
    </motion.div>
  );
};
