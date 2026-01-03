import { GraduationCap, Users } from "lucide-react";
import { useAppStore, TargetAudience } from "@/lib/store";
import { cn } from "@/lib/utils";

const audiences: { id: TargetAudience; label: string; description: string }[] = [
  { id: "middle-school", label: "Middle School (5-8)", description: "Simpler, encouraging" },
  { id: "high-school", label: "High School (9-12)", description: "Detailed, advanced" },
  { id: "all-grades", label: "All Grades (5-12)", description: "Adaptive difficulty" },
];

export const AudienceSelector = () => {
  const { targetAudience, setTargetAudience } = useAppStore();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Users className="w-4 h-4" />
        Target Audience
      </label>
      <div className="flex gap-2 flex-wrap">
        {audiences.map((audience) => (
          <button
            key={audience.id}
            onClick={() => setTargetAudience(audience.id)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all border-2",
              targetAudience === audience.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
          >
            <span className="hidden sm:inline">{audience.label}</span>
            <span className="sm:hidden">{audience.id === "middle-school" ? "5-8" : audience.id === "high-school" ? "9-12" : "5-12"}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
