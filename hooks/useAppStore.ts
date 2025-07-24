// useAppStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// ──────────────────────────────────────────────────────────────────────────────
// 1. Definimos los schemata Zod para validar usuarios y tareas.
// ──────────────────────────────────────────────────────────────────────────────
export const UserSchema = z.object({
  username: z.string(),
  country: z.string(),
  sex: z.enum(["femenine", "masculine"]).optional(),
  main_language: z.enum([
    "english",
    "french",
    "spanish",
    "german",
    "italian",
    "portuguese",
    "chinese",
    "japanese",
  ]),
});

export const TaskSchema = z.object({
  completed: z.boolean().optional(),
  uploadedFileUrl: z.string().optional(),
  id: z.string(), // UUID
  name: z.string(),
  description: z.string(),
  instructions: z.string(),
  price: z.number(),
  locked: z.boolean(),
  type: z.enum([
    "transcription",
    "image_labeling",
    "text_labeling",
    "voice_recording",
    "video_recording",
    "survey_response",
    "image",
    "document",
    "audio",
  ]),
  topic: z.string().optional(),
  duration: z.number().optional(), // duration in minutes
  numQuestions: z.number().optional(), // number of questions
  acceptedFormats: z.array(z.string()),
  submissionType: z.enum(["file", "text"]).optional(),
  dependsOn: z.string().optional(),
  numId: z.number(), // Numeric ID for backend matching
  feedback: z
    .object({
      comment: z.string(),
      rating: z.number().min(1).max(5),
    })
    .optional(),
  requiredSkills: z.array(z.string()).optional(),
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Tipos TypeScript inferidos a partir de los schemas Zod
// ──────────────────────────────────────────────────────────────────────────────
export type User = z.infer<typeof UserSchema>;
export type Task = z.infer<typeof TaskSchema>;

export type FeedbackEntry = {
  taskId: string;
  comment: string;
  rating: number;
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. Tipo para “Recommendation” (lo que retorna el API)
// ──────────────────────────────────────────────────────────────────────────────
export type Recommendation = {
  task: number;
  score: number;
  skill: number;
  length: number;
  price: number;
  price_per_hour: number;
  num_questions: number;
  duration: number;
  topic: string;
  type: string;
  is_fair?: boolean;
};

export type RecommendationResult = {
  recommended: Recommendation[];
  blocked: Recommendation[];
  all_fair_tasks: Recommendation[];
  all_unfair_tasks: Recommendation[];
};

// ──────────────────────────────────────────────────────────────────────────────
// 4. Global state definition (AppStore) and its actions
// ──────────────────────────────────────────────────────────────────────────────
type AppStore = {
  users: User[];
  tasks: Task[];
  oldTaskCycles: Task[][];
  feedbackHistory: {
    taskFeedbacks: FeedbackEntry[];
    generalFeedback: { comment: string; rating: number };
  }[];
  userSkills: string[];
  setUserSkills: (skills: string[]) => void;

  addUser: (user: User) => void;
  addTask: (task: Task) => void;

  completeTask: (taskId: string) => void;
  unlockTask: (taskId: string) => void;
  uploadTaskFile: (
    taskId: string,
    taskNumId: number,
    url: string,
    submissionType: "file" | "text"
  ) => void;
  addFeedbackToTask: (
    taskId: string,
    feedback: { comment: string; rating: number }
  ) => void;
  setTasks: (newTasks: Task[]) => void;
  replaceTasks: (
    newTasksDefinitions: Task[],
    recommendations?: RecommendationResult
  ) => void;

  archiveCurrentCycle: (generalFeedback?: {
    comment: string;
    rating: number;
  }) => void;

  clearUsers: () => void;
  clearTasks: () => void;
  resetApp: () => void;

  recommendedTasks: Recommendation[];
  setRecommendedTasks: (result: Recommendation[]) => void;

  getTakenTaskIds: () => number[];
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ──────────────────────────────────────────────────────────────────────────
      // Estado inicial
      // ──────────────────────────────────────────────────────────────────────────
      users: [],
      userSkills: [],

      tasks: [
        {
          id: uuidv4(),
          numId: 1,
          name: "Upload a Profile Picture",
          description: "Help us personalize your experience.",
          instructions:
            "Upload a clear photo of yourself (no filters or sunglasses). This is only for internal verification and will not be shared.",
          price: 0.1,
          locked: false,
          type: "image",
          acceptedFormats: ["jpg", "png", "jpeg"],
          completed: false,
        },
        {
          id: uuidv4(),
          numId: 2,
          name: "Verify Your Identity",
          description: "Help us ensure the integrity of the platform.",
          instructions:
            "Upload a valid government-issued ID (e.g. passport, driver’s license, or national ID). Make sure all information is clearly visible.",
          price: 0.25,
          locked: false,
          type: "document",
          acceptedFormats: ["jpg", "png", "pdf"],
          completed: false,
        },
        {
          id: uuidv4(),
          numId: 3,
          name: "Proof of Education",
          description:
            "Submit documentation of your highest level of education.",
          instructions:
            "Upload your diploma, certificate, or transcript. This helps us match you with academic and professional tasks.",
          price: 0.2,
          locked: false,
          type: "document",
          acceptedFormats: ["pdf", "jpg", "png"],
          completed: false,
        },
        {
          id: uuidv4(),
          numId: 4,
          name: "Audio Sample",
          description: "Submit a short voice recording.",
          instructions:
            "Record yourself reading a provided paragraph out loud and upload the file. This helps us qualify you for audio-related tasks.",
          price: 0.18,
          locked: false,
          type: "audio",
          acceptedFormats: ["mp3", "wav", "m4a"],
          completed: false,
        },
        {
          id: uuidv4(),
          numId: 5,
          name: "Handwriting Sample",
          description: "Submit a photo of handwritten text.",
          instructions:
            "Copy the provided text on a piece of paper and upload a photo of your handwriting. This may help us verify manual input quality.",
          price: 0.12,
          locked: false,
          type: "image",
          acceptedFormats: ["jpg", "png"],
          completed: false,
        },
        {
          id: uuidv4(),
          numId: 6,
          name: "Product Categorization",
          description:
            "Categorize products based on their images and descriptions.",
          instructions:
            "Review the product information and assign it to the most appropriate category from the provided list.",
          price: 0.15,
          locked: false,
          type: "text_labeling",
          acceptedFormats: ["jpg", "png", "txt"],
          completed: false,
        },
        {
          id: uuidv4(),
          numId: 7,
          name: "Data Entry from Receipt",
          description: "Extract key information from a sales receipt.",
          instructions:
            "Enter the store name, date, total amount, and items purchased into the appropriate fields.",
          price: 0.22,
          locked: false,
          type: "document",
          acceptedFormats: ["pdf", "jpg", "png"],
          completed: false,
        },
      ],

      oldTaskCycles: [],
      feedbackHistory: [],

      recommendedTasks: [],

      // ──────────────────────────────────────────────────────────────────────────
      // Acciones para actualizar el estado
      // ──────────────────────────────────────────────────────────────────────────

      // 4.1. Guardar habilidades seleccionadas
      setUserSkills: (skills) =>
        set(() => ({
          userSkills: skills,
        })),

      // 4.2. Agregar un usuario nuevo
      addUser: (user) =>
        set((state) => ({
          users: [...state.users, user],
        })),

      // 4.3. Agregar una tarea nueva
      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),

      // 4.4. Marcar tarea como completada y desbloquear dependientes
      completeTask: (taskId) =>
        set((state) => {
          // 4.4.1. Actualizar la tarea completada
          const updatedTasks = state.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: true } : task
          );

          // 4.4.2. Unlock tasks that depended on this completed one
          const unlockedTasks = updatedTasks.map((task) => {
            if (task.locked && task.dependsOn === taskId) {
              return { ...task, locked: false };
            }
            return task;
          });

          return { tasks: unlockedTasks };
        }),

      // 4.5. Desbloquear manualmente una tarea sin marcar completada
      unlockTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, locked: false } : task
          ),
        })),

      // 4.6. Subir un archivo o texto para la tarea y marcarla completada,
      //      luego desbloquear dependientes
      uploadTaskFile: (taskId, taskNumId, url, submissionType) =>
        set((state) => {
          const updatedTasks = state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                completed: true,
                uploadedFileUrl: url,
                submissionType,
              };
            }
            // If this task depends on the recently completed one, we unlock it
            if (task.locked && task.dependsOn === taskNumId.toString()) {
              return { ...task, locked: false };
            }
            return task;
          });
          return { tasks: updatedTasks };
        }),

      // 4.7. Add feedback (comment + rating) to a specific task
      addFeedbackToTask: (taskId, feedback) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, feedback } : task
          ),
        })),

      // 4.8. Reemplazar todas las tareas actuales por un nuevo ciclo de tareas
      setTasks: (newTasks) => set({ tasks: newTasks }),

      replaceTasks: (newTasksDefinitions, recommendations) =>
        set((state) => {
          console.log(
            "replaceTasks - New task definitions:",
            newTasksDefinitions
          );
          console.log(
            "replaceTasks - Received recommendations:",
            recommendations
          );

          // Create a map of existing tasks by numId for quick lookup
          const existingTasksMap = new Map(
            state.tasks.map((task) => [task.numId, task])
          );

          console.log("replaceTasks - Existing tasks map:", existingTasksMap);

          // Get recommended task IDs as a Set for O(1) lookups
          const recommendedNumIds = new Set(
            recommendations?.recommended?.map((r) => r.task) || []
          );
          console.log(
            "replaceTasks - Recommended task IDs:",
            Array.from(recommendedNumIds)
          );

          // Only unlock the first 3 recommended tasks, lock all others
          const recommendedNumIdsArr = Array.from(recommendedNumIds);
          const unlockedRecommendedNumIds = new Set(
            recommendedNumIdsArr.slice(0, 3)
          );

          const updatedTasks = newTasksDefinitions.map((newTaskDef) => {
            const existingTask = existingTasksMap.get(newTaskDef.numId);
            const isRecommended = recommendedNumIds.has(newTaskDef.numId);
            const isUnlockedRecommended = unlockedRecommendedNumIds.has(
              newTaskDef.numId
            );

            const updatedTask = {
              ...newTaskDef,
              id: existingTask?.id || uuidv4(),
              completed: false, // Reset completion status for the new cycle
              locked: recommendations
                ? !isUnlockedRecommended
                : newTaskDef.locked,
              feedback: undefined, // Reset feedback for the new cycle
              uploadedFileUrl: undefined, // Reset file URL for the new cycle
            };

            console.log(`replaceTasks - Processed task ${newTaskDef.numId}:`, {
              id: updatedTask.id,
              completed: updatedTask.completed,
              locked: updatedTask.locked,
              isRecommended,
              isUnlockedRecommended,
            });

            return updatedTask;
          });

          // Ensure we don't have duplicate task IDs
          const taskIdSet = new Set(updatedTasks.map((t) => t.id));
          if (taskIdSet.size !== updatedTasks.length) {
            console.error("Duplicate task IDs detected in updated tasks!");
          }

          // Update recommended tasks, ensuring no duplicates
          const newRecommendedTasks = recommendations?.recommended || [];
          console.log(
            "replaceTasks - Setting recommended tasks:",
            newRecommendedTasks
          );

          return {
            tasks: updatedTasks,
            recommendedTasks: newRecommendedTasks,
          };
        }),

      // 4.9. Archivar el ciclo actual (todas las tareas) y guardar el feedback general
      archiveCurrentCycle: (generalFeedback) =>
        set((state) => {
          console.log("archiveCurrentCycle called:", {
            currentTasks: state.tasks.length,
            feedbackHistoryLength: state.feedbackHistory.length,
            generalFeedback,
          });

          // Build FeedbackEntry array only with tasks that have feedback
          const taskFeedbacks = state.tasks
            .filter((t) => t.feedback)
            .map((t) => ({
              taskId: t.id,
              comment: t.feedback!.comment,
              rating: t.feedback!.rating,
            }));

          const newState = {
            oldTaskCycles: [...state.oldTaskCycles, state.tasks],
            feedbackHistory: [
              ...state.feedbackHistory,
              {
                taskFeedbacks,
                generalFeedback: generalFeedback ?? { comment: "", rating: 0 },
              },
            ],
            // NO limpiar recommendedTasks aquí si vamos a necesitarlos en el siguiente ciclo
            // recommendedTasks: [],
          };

          console.log("archiveCurrentCycle result:", {
            newFeedbackHistoryLength: newState.feedbackHistory.length,
            archivedTasks: state.tasks.length,
          });

          return newState;
        }),

      // 4.10. Vaciar lista de usuarios (por ejemplo, en logout)
      clearUsers: () => set({ users: [] }),
      // 4.11. Vaciar lista de tareas (por ejemplo, en un reset completo)
      clearTasks: () => set({ tasks: [] }),

      // 4.12. Guardar las recomendaciones recibidas desde el backend
      setRecommendedTasks: (tasks) => set({ recommendedTasks: tasks }),

      // 4.13. Obtener el array de numId de todas las tareas completadas,
      //       tanto del ciclo actual como de ciclos anteriores
      getTakenTaskIds: () => {
        const state = get();
        // Get completed tasks from current cycle
        const completedInCurrentCycle = state.tasks
          .filter((task) => task.completed)
          .map((task) => task.numId);

        // Get completed tasks from all old cycles
        const completedInOldCycles = state.oldTaskCycles.flatMap((cycleTasks) =>
          cycleTasks.filter((task) => task.completed).map((task) => task.numId)
        );

        // Combine all completed task IDs and use a Set to ensure uniqueness
        const allCompletedTaskIds = [
          ...completedInCurrentCycle,
          ...completedInOldCycles,
        ];
        const uniqueTaskIds = [...new Set(allCompletedTaskIds)];

        console.log("getTakenTaskIds - Unique task IDs:", uniqueTaskIds);
        return uniqueTaskIds;
      },

      // 4.14. Reset the entire application state to initial values and clear localStorage
      resetApp: () => {
        // Clear all data from the store, keep users
        const users = get().users;
        const tasks = get().tasks;
        set({
          users,
          tasks: tasks.map((task) => ({
            ...task,
            completed: false,
            feedback: undefined,
            uploadedFileUrl: undefined,
          })),
          oldTaskCycles: [],
          feedbackHistory: [],
          userSkills: [],
          recommendedTasks: [],
        });
      },
    }),

    {
      name: "app-database", // Clave para localStorage
    }
  )
);
