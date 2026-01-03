import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export const PremiumButton = () => {
  const { isPremium, setShowPremiumModal } = useAppStore();

  if (isPremium) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-premium/20 text-premium">
        <Crown className="w-4 h-4" />
        <span className="text-sm font-medium">Premium</span>
      </div>
    );
  }

  return (
    <Button
      variant="premium"
      size="sm"
      onClick={() => setShowPremiumModal(true)}
      className="gap-2"
    >
      <Crown className="w-4 h-4" />
      <span className="hidden sm:inline">Upgrade</span>
    </Button>
  );
};
