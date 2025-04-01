import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { FailedSubmission, FailedSubmissionsState } from "@/lib/types"

interface FailedSubmissionsStore extends FailedSubmissionsState {
    addFailedSubmission: (submission: Omit<FailedSubmission, "id" | "timestamp" | "retryCount">) => void
    removeFailedSubmission: (id: string) => void
    updateFailedSubmission: (id: string, updates: Partial<FailedSubmission>) => void
    clearAllFailedSubmissions: () => void
    setSelectedSubmission: (submission: FailedSubmission | null) => void
    incrementRetryCount: (id: string) => void
}

export const useFailedSubmissionsStore = create<FailedSubmissionsStore>()(
    persist(
        (set) => ({
            submissions: [],
            selectedSubmission: null,

            addFailedSubmission: (submission) =>
                set((state) => ({
                    submissions: [
                        ...state.submissions,
                        {
                            ...submission,
                            id: generateId(),
                            timestamp: Date.now(),
                            retryCount: 0,
                        },
                    ],
                })),

            removeFailedSubmission: (id) =>
                set((state) => ({
                    submissions: state.submissions.filter((sub) => sub.id !== id),
                    selectedSubmission: state.selectedSubmission?.id === id ? null : state.selectedSubmission,
                })),

            updateFailedSubmission: (id, updates) =>
                set((state) => ({
                    submissions: state.submissions.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)),
                    selectedSubmission:
                        state.selectedSubmission?.id === id
                            ? { ...state.selectedSubmission, ...updates }
                            : state.selectedSubmission,
                })),

            clearAllFailedSubmissions: () => set({ submissions: [], selectedSubmission: null }),

            setSelectedSubmission: (submission) => set({ selectedSubmission: submission }),

            incrementRetryCount: (id) =>
                set((state) => ({
                    submissions: state.submissions.map((sub) =>
                        sub.id === id ? { ...sub, retryCount: sub.retryCount + 1 } : sub,
                    ),
                    selectedSubmission:
                        state.selectedSubmission?.id === id
                            ? { ...state.selectedSubmission, retryCount: state.selectedSubmission.retryCount + 1 }
                            : state.selectedSubmission,
                })),
        }),
        {
            name: "failed-submissions-storage",
            partialize: (state) => ({ submissions: state.submissions }),
        },
    ),
)

// Helper function to generate a unique ID
function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}