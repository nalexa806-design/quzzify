import { motion } from "framer-motion";
import { BookOpen, HelpCircle, Layers, User, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore, TabType } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "quizzes", label: "Quizzes", icon: HelpCircle },
  { id: "flashcards", label: "Flashcards", icon: Layers },
];

export const BottomTabs = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40 md:hidden safe-area-inset-bottom">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 px-2 relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}
              <Icon className={cn("w-5 h-5 mb-1", isActive && "animate-bounce-soft")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
        
        {/* Login/User button */}
        <button
          onClick={handleAuthAction}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-3 px-2 relative transition-colors",
            user ? "text-primary" : "text-muted-foreground"
          )}
        >
          {user ? (
            <User className="w-5 h-5 mb-1" />
          ) : (
            <LogIn className="w-5 h-5 mb-1" />
          )}
          <span className="text-xs font-medium">{user ? "Logout" : "Login"}</span>
        </button>
      </div>
    </nav>
  );
};
