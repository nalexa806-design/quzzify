import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Loader2, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Flashcard } from "@/lib/store";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDeck: (title: string, cards: Flashcard[]) => void;
  isPremium: boolean;
}

export const CreateDeckModal = ({ isOpen, onClose, onCreateDeck, isPremium }: CreateDeckModalProps) => {
  const [step, setStep] = useState<"input" | "edit">("input");
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);
  const [deckTitle, setDeckTitle] = useState("");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const maxCards = isPremium ? 20 : 10;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (inputMode === "text" && !notes.trim()) {
      toast({
        title: "Notes required",
        description: "Please enter some notes to generate flashcards.",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === "image" && !imagePreview) {
      toast({
        title: "Image required",
        description: "Please upload an image of your notes.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: {
          notes: inputMode === "text" ? notes : undefined,
          imageBase64: inputMode === "image" ? imagePreview : undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.flashcards && Array.isArray(data.flashcards)) {
        const limitedCards = data.flashcards.slice(0, maxCards);
        setGeneratedCards(limitedCards);
        setStep("edit");
        
        // Generate default title from first card or notes
        const defaultTitle = notes.slice(0, 30) || "My Flashcard Deck";
        setDeckTitle(defaultTitle.trim() + (defaultTitle.length >= 30 ? "..." : ""));
        
        toast({
          title: "Flashcards generated!",
          description: `Created ${limitedCards.length} flashcards from your notes.`,
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error generating flashcards:", err);
      toast({
        title: "Generation failed",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateCard = (cardId: string, field: "front" | "back", value: string) => {
    setGeneratedCards((cards) =>
      cards.map((card) =>
        card.id === cardId ? { ...card, [field]: value } : card
      )
    );
  };

  const handleDeleteCard = (cardId: string) => {
    setGeneratedCards((cards) => cards.filter((card) => card.id !== cardId));
  };

  const handleAddCard = () => {
    if (generatedCards.length >= maxCards) {
      toast({
        title: "Card limit reached",
        description: `Maximum ${maxCards} cards allowed.`,
        variant: "destructive",
      });
      return;
    }

    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      front: "",
      back: "",
      mastered: false,
    };
    setGeneratedCards([...generatedCards, newCard]);
    setEditingCard(newCard.id);
  };

  const handleSave = () => {
    if (!deckTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your deck.",
        variant: "destructive",
      });
      return;
    }

    const validCards = generatedCards.filter(
      (card) => card.front.trim() && card.back.trim()
    );

    if (validCards.length === 0) {
      toast({
        title: "Cards required",
        description: "Please add at least one complete flashcard.",
        variant: "destructive",
      });
      return;
    }

    onCreateDeck(deckTitle.trim(), validCards);
    handleClose();
  };

  const handleClose = () => {
    setStep("input");
    setInputMode("text");
    setNotes("");
    setImagePreview(null);
    setGeneratedCards([]);
    setDeckTitle("");
    setEditingCard(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {step === "input" ? "Create Flashcard Deck" : "Edit Flashcards"}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
            {step === "input" ? (
              <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={inputMode === "text" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setInputMode("text")}
                  >
                    <FileText className="w-4 h-4" />
                    Type Notes
                  </Button>
                  <Button
                    variant={inputMode === "image" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setInputMode("image")}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </Button>
                </div>

                {/* Input Area */}
                {inputMode === "text" ? (
                  <Textarea
                    placeholder="Paste or type your notes here... The AI will extract key concepts and create flashcards."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Uploaded notes"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Click to upload an image of your notes
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, or WEBP
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  AI will generate up to {maxCards} flashcards from your notes.
                  {!isPremium && " Upgrade to Premium for up to 20 cards."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Deck Title */}
                <Input
                  placeholder="Deck Title"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="font-medium"
                />

                {/* Cards List */}
                <div className="space-y-3">
                  {generatedCards.map((card, index) => (
                    <div
                      key={card.id}
                      className="p-3 rounded-lg bg-secondary/30 border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          Card {index + 1}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setEditingCard(
                                editingCard === card.id ? null : card.id
                              )
                            }
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {editingCard === card.id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Front (Question)"
                            value={card.front}
                            onChange={(e) =>
                              handleUpdateCard(card.id, "front", e.target.value)
                            }
                            className="text-sm"
                          />
                          <Input
                            placeholder="Back (Answer)"
                            value={card.back}
                            onChange={(e) =>
                              handleUpdateCard(card.id, "back", e.target.value)
                            }
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-xs text-muted-foreground">Front:</span>
                            <p className="text-foreground line-clamp-2">{card.front || "—"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Back:</span>
                            <p className="text-foreground line-clamp-2">{card.back || "—"}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Card Button */}
                {generatedCards.length < maxCards && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleAddCard}
                  >
                    <Plus className="w-4 h-4" />
                    Add Card
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-2">
            {step === "input" ? (
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Flashcards"
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Create Deck ({generatedCards.length} cards)
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
