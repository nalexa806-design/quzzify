import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TargetAudience = 'middle-school' | 'high-school' | 'all-grades';
export type TabType = 'homework' | 'quizzes' | 'flashcards';
export type InputMode = 'text' | 'image';

export interface HomeworkAnswer {
  id: string;
  question: string;
  answer: string;
  steps: string[];
  finalAnswer: string;
  timestamp: number;
  imageUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questions: QuizQuestion[];
  score?: number;
  completed: boolean;
  timestamp: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  cards: Flashcard[];
  currentIndex: number;
  cycleCount: number;
  timestamp: number;
}

interface AppState {
  // User state
  isPremium: boolean;
  targetAudience: TargetAudience;
  
  // Navigation
  activeTab: TabType;
  inputMode: InputMode;
  
  // Limits
  imageUploadsUsed: number;
  quizzesCreated: number;
  
  // Homework
  homeworkHistory: HomeworkAnswer[];
  currentQuestion: string;
  currentImageUrl: string | null;
  currentAnswer: HomeworkAnswer | null;
  isProcessing: boolean;
  
  // Quizzes
  quizHistory: Quiz[];
  activeQuiz: Quiz | null;
  
  // Flashcards
  flashcardDecks: FlashcardDeck[];
  activeDeck: FlashcardDeck | null;
  hasUsedFreeTrial: boolean;
  
  // Premium modal
  showPremiumModal: boolean;
  
  // Actions
  setIsPremium: (isPremium: boolean) => void;
  setTargetAudience: (audience: TargetAudience) => void;
  setActiveTab: (tab: TabType) => void;
  setInputMode: (mode: InputMode) => void;
  setCurrentQuestion: (question: string) => void;
  setCurrentImageUrl: (url: string | null) => void;
  setCurrentAnswer: (answer: HomeworkAnswer | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  addHomeworkToHistory: (answer: HomeworkAnswer) => void;
  incrementImageUploads: () => boolean;
  addQuiz: (quiz: Quiz) => boolean;
  setActiveQuiz: (quiz: Quiz | null) => void;
  updateQuiz: (quizId: string, updates: Partial<Quiz>) => void;
  createFlashcardDeck: (deck: FlashcardDeck) => boolean;
  setActiveDeck: (deck: FlashcardDeck | null) => void;
  updateDeck: (deckId: string, updates: Partial<FlashcardDeck>) => void;
  setHasUsedFreeTrial: (used: boolean) => void;
  setShowPremiumModal: (show: boolean) => void;
  canUploadImage: () => boolean;
  canCreateQuiz: () => boolean;
  canUseFlashcards: () => boolean;
}

const FREE_IMAGE_LIMIT = 5;
const FREE_QUIZ_LIMIT = 5;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isPremium: false,
      targetAudience: 'all-grades',
      activeTab: 'homework',
      inputMode: 'text',
      imageUploadsUsed: 0,
      quizzesCreated: 0,
      homeworkHistory: [],
      currentQuestion: '',
      currentImageUrl: null,
      currentAnswer: null,
      isProcessing: false,
      quizHistory: [],
      activeQuiz: null,
      flashcardDecks: [],
      activeDeck: null,
      hasUsedFreeTrial: false,
      showPremiumModal: false,

      // Actions
      setIsPremium: (isPremium) => set({ isPremium }),
      setTargetAudience: (targetAudience) => set({ targetAudience }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setInputMode: (inputMode) => set({ inputMode }),
      setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
      setCurrentImageUrl: (currentImageUrl) => set({ currentImageUrl }),
      setCurrentAnswer: (currentAnswer) => set({ currentAnswer }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      
      addHomeworkToHistory: (answer) => set((state) => ({
        homeworkHistory: [answer, ...state.homeworkHistory],
      })),
      
      incrementImageUploads: () => {
        const state = get();
        if (state.isPremium || state.imageUploadsUsed < FREE_IMAGE_LIMIT) {
          set({ imageUploadsUsed: state.imageUploadsUsed + 1 });
          return true;
        }
        set({ showPremiumModal: true });
        return false;
      },
      
      addQuiz: (quiz) => {
        const state = get();
        if (state.isPremium || state.quizzesCreated < FREE_QUIZ_LIMIT) {
          set({
            quizHistory: [quiz, ...state.quizHistory],
            quizzesCreated: state.quizzesCreated + 1,
          });
          return true;
        }
        set({ showPremiumModal: true });
        return false;
      },
      
      setActiveQuiz: (activeQuiz) => set({ activeQuiz }),
      
      updateQuiz: (quizId, updates) => set((state) => ({
        quizHistory: state.quizHistory.map((q) =>
          q.id === quizId ? { ...q, ...updates } : q
        ),
        activeQuiz: state.activeQuiz?.id === quizId
          ? { ...state.activeQuiz, ...updates }
          : state.activeQuiz,
      })),
      
      createFlashcardDeck: (deck) => {
        const state = get();
        if (state.isPremium) {
          set({ flashcardDecks: [deck, ...state.flashcardDecks] });
          return true;
        }
        set({ showPremiumModal: true });
        return false;
      },
      
      setActiveDeck: (activeDeck) => set({ activeDeck }),
      
      updateDeck: (deckId, updates) => set((state) => ({
        flashcardDecks: state.flashcardDecks.map((d) =>
          d.id === deckId ? { ...d, ...updates } : d
        ),
        activeDeck: state.activeDeck?.id === deckId
          ? { ...state.activeDeck, ...updates }
          : state.activeDeck,
      })),
      
      setHasUsedFreeTrial: (hasUsedFreeTrial) => set({ hasUsedFreeTrial }),
      setShowPremiumModal: (showPremiumModal) => set({ showPremiumModal }),
      
      canUploadImage: () => {
        const state = get();
        return state.isPremium || state.imageUploadsUsed < FREE_IMAGE_LIMIT;
      },
      
      canCreateQuiz: () => {
        const state = get();
        return state.isPremium || state.quizzesCreated < FREE_QUIZ_LIMIT;
      },
      
      canUseFlashcards: () => {
        const state = get();
        return state.isPremium || !state.hasUsedFreeTrial;
      },
    }),
    {
      name: 'quizzify-storage',
      partialize: (state) => ({
        isPremium: state.isPremium,
        targetAudience: state.targetAudience,
        imageUploadsUsed: state.imageUploadsUsed,
        quizzesCreated: state.quizzesCreated,
        homeworkHistory: state.homeworkHistory,
        quizHistory: state.quizHistory,
        flashcardDecks: state.flashcardDecks,
        hasUsedFreeTrial: state.hasUsedFreeTrial,
      }),
    }
  )
);
