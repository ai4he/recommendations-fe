// useAppStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";

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
    "selection",
  ]),
  topic: z.string().optional(),
  duration: z.number().optional(), // duration in minutes
  numQuestions: z.number().optional(), // number of questions
  acceptedFormats: z.array(z.string()),
  cycle: z.enum(["beginner", "intermediate", "advanced"]).optional(),
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
  //newly added
  top_feature?: string | null;
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

  preferredTasks: number[];
  getPreferredTasks: () => number[];
  setPreferredTasks: (ids: number[]) => void;

  entryPoint: "tasks" | "recommender1" | "recommender2" | null;
  setEntryPoint: (page: "tasks" | "recommender1" | "recommender2") => void;
  getEntryPoint: () => "tasks" | "recommender1" | "recommender2" | null;

  currentCycle: number;
  setCurrentCycle: (cycle: number) => void;
  getCurrentCycle: () => number;
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
          id: "general-tag-1",
          numId: 1,
          name: "Upload a Color Picture",
          description: "Help us identify colors.",
          instructions:
            "Upload a picture with something that matches the color you are asked to identify.",
          price: 0.25,
          locked: false,
          type: "image",
          acceptedFormats: ["jpg", "png", "jpeg"],
          completed: false,
        },
        {
          id: "general-tag-2",
          numId: 2,
          name: "Verify Your Identity",
          description: "Help us ensure the integrity of the platform.",
          instructions: "Write down the same age as you have in the survey.",
          price: 0.05,
          locked: false,
          type: "document",
          acceptedFormats: ["jpg", "png", "pdf"],
          completed: false,
        },
        {
          id: "general-tag-3",
          numId: 3,
          name: "Proof of Education",
          description: "What is your highest level of education?",
          instructions:
            "Tell us your highest level of education in simple words.",
          price: 0.05,
          locked: false,
          type: "document",
          acceptedFormats: ["pdf", "jpg", "png"],
          completed: false,
        },
        {
          id: "general-tag-4",
          numId: 4,
          name: "Audio Sample",
          description: "Submit a transcription of the following audio.",
          instructions: "Read the audio and transcribe it word by word.",
          price: 0.18,
          locked: false,
          type: "audio",
          acceptedFormats: ["mp3", "wav", "m4a"],
          completed: false,
        },
        {
          id: "general-tag-5",
          numId: 5,
          name: "Transcription Sample",
          description: "Read the text and transcribe it.",
          instructions: "Read carefully and transcribe the text word by word.",
          price: 0.35,
          locked: false,
          type: "transcription",
          acceptedFormats: ["txt"],
          completed: false,
        },
        {
          id: "general-tag-6",
          numId: 6,
          name: "Product Categorization",
          description: "Categorize products based on their images",
          instructions: "See the product image and categorize it",
          price: 0.25,
          locked: false,
          type: "text_labeling",
          acceptedFormats: ["jpg", "png", "txt"],
          completed: false,
        },
        {
          id: "general-tag-7",
          numId: 7,
          name: "Data Entry from Receipt",
          description: "Extract key information from a sales receipt.",
          instructions: "Tell us the total amount of the receipt.",
          price: 0.22,
          locked: false,
          type: "document",
          acceptedFormats: ["pdf", "jpg", "png"],
          completed: false,
        },
      ],

      preferredTasks: [],
      getPreferredTasks: () => get().preferredTasks,
      setPreferredTasks: (ids: number[]) => set({ preferredTasks: ids }),

      entryPoint: null,
      setEntryPoint: (page) => set({ entryPoint: page }),
      getEntryPoint: () => get().entryPoint,

      currentCycle: 0,
      setCurrentCycle: (cycle) => set({ currentCycle: cycle }),
      getCurrentCycle: () => get().currentCycle,  

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
          // Find the completed task to get its numId
          const completedTask = state.tasks.find(task => task.id === taskId);
          const completedNumId = completedTask?.numId?.toString();
          
          // Update the completed task and unlock any dependent tasks
          const updatedTasks = state.tasks.map((task) => {
            // Mark the current task as completed
            if (task.id === taskId) {
              return { ...task, completed: true };
            }
            
            // Check if this task is locked and depends on the completed task
            if (task.locked && task.dependsOn) {
              // Check both string and number representations of the dependency
              const dependsOnNumId = task.dependsOn.toString();
              const completedTaskNumIdStr = completedNumId?.toString();
              const completedTaskIdStr = taskId.toString();
              
              // Unlock if the task depends on the completed task by ID or numId
              if (dependsOnNumId === completedTaskIdStr || 
                  dependsOnNumId === completedTaskNumIdStr) {
                console.log(`[completeTask] Unlocking task ${task.id} (${task.numId}) that depends on ${taskId} (${completedNumId})`);
                return { ...task, locked: false };
              }
            }
            
            return task;
          });
          
          console.log('[completeTask] Tasks after unlocking:', updatedTasks.map(t => 
            `${t.id} (${t.numId}): ${t.name} - locked: ${t.locked}, dependsOn: ${t.dependsOn}`
          ));
          
          return { tasks: updatedTasks };
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
          // First, find the completed task to get its numId
          const completedTask = state.tasks.find(t => t.id === taskId);
          const completedNumId = completedTask?.numId?.toString();
          
          // Update the completed task and unlock any dependent tasks
          const updatedTasks = state.tasks.map((task) => {
            // Mark the current task as completed
            if (task.id === taskId) {
              return {
                ...task,
                completed: true,
                uploadedFileUrl: url,
                submissionType,
              };
            }
            
            // Check if this task is locked and depends on the completed task
            if (task.locked && task.dependsOn) {
              // Check both string and number representations of the dependency
              const dependsOnNumId = task.dependsOn.toString();
              const completedTaskNumIdStr = completedNumId?.toString();
              const completedTaskIdStr = taskId.toString();
              
              // Unlock if the task depends on the completed task by ID or numId
              if (dependsOnNumId === completedTaskIdStr || 
                  dependsOnNumId === completedTaskNumIdStr) {
                console.log(`Unlocking task ${task.id} (${task.numId}) that depends on ${taskId} (${completedNumId})`);
                return { ...task, locked: false };
              }
            }
            
            return task;
          });
          
          console.log('Tasks after unlocking:', updatedTasks.map(t => 
            `${t.id} (${t.numId}): ${t.name} - locked: ${t.locked}, dependsOn: ${t.dependsOn}`
          ));
          
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

            if (!existingTask) {
              return newTaskDef;
            }

            const updatedTask = {
              ...newTaskDef,
              id: existingTask.id,
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
          const nextCycle =
            state.currentCycle === 0 ? 1 :
            state.currentCycle === 1 ? 2 : 
            state.currentCycle === 2 ? 3 : 
            1;

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
            currentCycle: nextCycle,
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
