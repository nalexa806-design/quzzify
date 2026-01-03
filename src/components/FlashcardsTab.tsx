import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RotateCcw, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, FlashcardDeck, Flashcard } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CreateDeckModal } from "./CreateDeckModal";

export const FlashcardsTab = () => {
  const {
    flashcardDecks,
    activeDeck,
    setActiveDeck,
    createFlashcardDeck,
    updateDeck,
    hasUsedFreeTrial,
    setHasUsedFreeTrial,
    setShowPremiumModal,
    isPremium,
  } = useAppStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleTryFree = () => {
    if (hasUsedFreeTrial && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    // Open create modal for free trial too
    setShowCreateModal(true);
  };

  const handleCreateDeck = (title: string, cards: Flashcard[]) => {
    const newDeck: FlashcardDeck = {
      id: Date.now().toString(),
      title,
      cards,
      currentIndex: 0,
      cycleCount: 0,
      timestamp: Date.now(),
    };

    if (!isPremium && hasUsedFreeTrial) {
      setShowPremiumModal(true);
      return;
    }

    if (isPremium) {
      createFlashcardDeck(newDeck);
    } else {
      // Free trial
      setHasUsedFreeTrial(true);
    }
    
    setActiveDeck(newDeck);
  };

  const maxDecks = isPremium ? Infinity : 1;
  const canCreate = isPremium || (!hasUsedFreeTrial);

  return (
    <div className="h-full overflow-y-auto p-4">
      <AnimatePresence mode="wait">
        {activeDeck ? (
          <FlashcardViewer
            deck={activeDeck}
            onClose={() => {
              setActiveDeck(null);
            }}
            onUpdate={(updates) => {
              if (isPremium) {
                updateDeck(activeDeck.id, updates);
              }
              setActiveDeck({ ...activeDeck, ...updates });
            }}
            isPremium={isPremium}
            isFreeTrial={!isPremium}
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
                onClick={() => canCreate ? setShowCreateModal(true) : setShowPremiumModal(true)}
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
                  <h3 className="font-semibold text-foreground">Create Your First Deck Free!</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your notes or type them in, and AI will generate flashcards for you.
                </p>
                <Button onClick={handleTryFree}>
                  Create Free Deck
                </Button>
              </motion.div>
            )}

            {/* Free user restriction notice */}
            {!isPremium && hasUsedFreeTrial && (
              <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">Free deck created</p>
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

            {/* Deck List */}
            {flashcardDecks.length > 0 ? (
              <div className="grid gap-3">
                {flashcardDecks.map((deck) => (
                  <motion.button
                    key={deck.id}
                    onClick={() => setActiveDeck(deck)}
                    className="w-full p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all text-left"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <h3 className="font-medium text-foreground text-sm">{deck.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {deck.cards.length} cards • Cycle {deck.cycleCount}
                    </p>
                  </motion.button>
                ))}
              </div>
            ) : !hasUsedFreeTrial ? null : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No decks yet. Create your first flashcard deck!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateDeck={handleCreateDeck}
        isPremium={isPremium}
      />
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
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Card {deck.currentIndex + 1} of {deck.cards.length}</span>
          <span>Cycle {deck.cycleCount + 1}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card - SMALLER */}
      <div className="perspective-1000 mb-4">
        <motion.div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full aspect-[4/3] max-h-48 cursor-pointer preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", damping: 20 }}
        >
          {/* Front */}
          <div className={cn(
            "absolute inset-0 rounded-xl bg-card border-2 border-border p-4 flex items-center justify-center backface-hidden shadow-md",
          )}>
            <p className="text-base text-center text-foreground font-medium">
              {currentCard.front}
            </p>
          </div>

          {/* Back */}
          <div className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-4 flex items-center justify-center backface-hidden rotate-y-180 shadow-md",
          )}>
            <p className="text-base text-center text-foreground font-medium">
              {currentCard.back}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tap hint */}
      <p className="text-center text-xs text-muted-foreground mb-4">
        Tap card to flip
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={deck.currentIndex === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsFlipped(false);
            onUpdate({ currentIndex: 0 });
          }}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={handleNext}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Free trial warning */}
      {isFreeTrial && !isPremium && (
        <p className="text-center text-xs text-warning mt-4">
          Free trial: Deck ends after one cycle
        </p>
      )}
    </motion.div>
  );
};
