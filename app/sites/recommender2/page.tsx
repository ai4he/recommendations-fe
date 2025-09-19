"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recommendation, useAppStore } from "@/hooks/useAppStore";
import { useRouter } from "next/navigation";
import { Clock, FileText, Lock, CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { initialTasks } from "@/data/initialTasks";
import { advancedTasks } from "@/data/advancedTasks";

const userSkillsMapping = {
  transcription: "Medical Transcription",
  image_labeling: "Image Labeling",
  text_labeling: "Text Labeling",
  voice_recording: "Voice Recording",
  video_recording: "Video Recording",
  survey_response: "Survey Response",
  audio_processing: "Audio Processing",
  medical_terminology: "Medical Terminology",
  image_annotation: "Image Annotation",
  data_entry: "Data Entry",
  computer_vision: "Computer Vision",
  content_analysis: "Content Analysis",
  natural_language_processing: "Natural Language Processing",
  ai_training: "AI Training",
  content_moderation: "Content Moderation",
  market_research: "Market Research",
  legal_terminology: "Legal Terminology",
  medical_image_segmentation: "Medical Image Segmentation",
  social_media: "Social Media",
};

const getTaskTypeIcon = (type: string) => {
  switch (type) {
    case "transcription":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "image_labeling":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-purple-500"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      );
    case "text_labeling":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-500"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "voice_recording":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-500"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      );
    case "video_recording":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-orange-500"
        >
          <path d="m22 8-6 4 6 4V8Z" />
          <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
      );
    case "survey_response":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-yellow-500"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" x2="15" y1="15" y2="15" />
          <line x1="12" x2="12" y1="12" y2="18" />
        </svg>
      );
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

export default function TasksPage() {
  // Use individual selectors to prevent unnecessary re-renders
  const tasks = useAppStore((state) => state.tasks);
  const recommendedTasks = useAppStore((state) => state.recommendedTasks);
  const replaceTasks = useAppStore((state) => state.replaceTasks);
  const getTakenTaskIds = useAppStore((state) => state.getTakenTaskIds);
  const setRecommendedTasks = useAppStore((state) => state.setRecommendedTasks);
  const userSkills = useAppStore((state) => state.userSkills);
  const feedbackHistory = useAppStore((state) => state.feedbackHistory);
  const cycleNumber = useAppStore((s) => s.currentCycle);
  const router = useRouter();
  const resetApp = useAppStore((state) => state.resetApp);

  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);

  const { setEntryPoint } = useAppStore();
  useEffect(() => {
    setEntryPoint("recommender1");
  }, [setEntryPoint]);

  const handleStartOver = () => {
    if (
      confirm(
        "Are you sure you want to start over? This will clear all your progress and reset the application."
      )
    ) {
      resetApp();
      window.location.href = "/sites/tasks"; // Force a full page reload to reset the state
    }
  };

  // Check if we should redirect to feedback page
  useEffect(() => {
    // Solo ejecutar si no estamos ya en la página de feedback
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/sites/feedback"
    ) {
      return;
    }

    const completedCount = tasks.filter((t) => t.completed).length;

    // El ciclo actual es el número de entradas en feedbackHistory
    // Si feedbackHistory.length = 0, estamos en el ciclo 0
    // Si feedbackHistory.length = 1, estamos en el ciclo 1, etc.

    // Solo redirigir si:
    // 1. Tenemos 3 o más tareas completadas
    // 2. Estamos en los ciclos 0, 1, o 2
    // 3. No estamos navegando
    const shouldRedirect =
      completedCount >= 3 &&
      cycleNumber < 3 && // Solo hasta el ciclo 2
      !isNavigatingAway;

    console.log("TasksPage - Navigation check:", {
      completedCount,
      cycleNumber,
      shouldRedirect,
      currentPath:
        typeof window !== "undefined" ? window.location.pathname : "",
      isNavigatingAway,
      feedbackHistoryLength: feedbackHistory.length,
    });

    if (shouldRedirect) {
      console.log("TasksPage - Redirecting to feedback page");
      setIsNavigatingAway(true);
      // Usar setTimeout para asegurar que el render actual se complete
      const timer = setTimeout(() => {
        router.push("/sites/feedback");
      }, 100); // Aumentar el delay ligeramente
      return () => clearTimeout(timer);
    }
  }, [tasks, feedbackHistory.length, router, isNavigatingAway]); // Cambiar la dependencia

  useEffect(() => {
    const fetchRecommendationsIfNeeded = async () => {
      console.log("TasksPage useEffect: Checking recommendations...");
      console.log("  cycleNumber:", cycleNumber);
      console.log("  recommendedTasks.length:", recommendedTasks?.length);
      console.log("  isLoadingRecommendations:", isLoadingRecommendations);

      // We only fetch recommendations for cycle 2 and beyond.
      if (cycleNumber > 0 && !isLoadingRecommendations) {
        // Avoid fetching if we already have recommendations for the current cycle
        if (recommendedTasks.length > 0) {
          console.log(
            "TasksPage useEffect: Recommendations already exist for this cycle, skipping fetch."
          );
          return;
        }

        console.log(
          "TasksPage useEffect: Conditions met, fetching recommendations..."
        );
        setIsLoadingRecommendations(true);
        const taken_tasks = getTakenTaskIds();

        // Determine which set of tasks to use based on the cycle number
        const tasks_payload = (
          cycleNumber === 0
            ? tasks
            : cycleNumber === 1
            ? initialTasks
            : advancedTasks
        ).map((task) => ({
          Task: task.numId,
          Skill: 1, // Placeholder, adjust as needed
          Length: task.duration || 0,
          type: task.type,
          price: task.price,
          num_questions: task.numQuestions || 0,
          duration: task.duration || 0,
          topic: task.topic || "",
        }));

        try {
          const response = await fetch(
            "https://rec.haielab.org/api/recommend_unsupervised_with_feat",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                taken_tasks,
                tasks_payload,
                user_skills: userSkills,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch recommendations");
          }

          const recommendations = await response.json();
          console.log("Fetched recommendations:", recommendations);

          // The API returns an array directly, not an object with a .recommended property
          const recommendedList = Array.isArray(recommendations)
            ? recommendations
            : [];

          // Sort recommendations by score and take the top 5
          const top5Recommended = [...recommendedList]
            .sort((a: Recommendation, b: Recommendation) => b.score - a.score)
            .slice(0, 5);

          console.log("Top 5 recommended:", top5Recommended);

          // Create a new recommendations object that matches the expected type in the store
          const top5RecommendationsResult = {
            recommended: top5Recommended,
            blocked: [], // Assuming no blocked tasks from this endpoint
            all_fair_tasks: [],
            all_unfair_tasks: [],
          };

          const taskSource = cycleNumber >= 2 ? advancedTasks : initialTasks;

          // Pass the top 5 to replaceTasks to correctly lock/unlock tasks and set recommendations
          replaceTasks(taskSource, top5RecommendationsResult);
        } catch (error) {
          console.error("Error fetching recommendations:", error);
        } finally {
          setIsLoadingRecommendations(false);
        }
      }
    };
    console.log("Getting recommendations");

    fetchRecommendationsIfNeeded();
  }, [
    cycleNumber,
    getTakenTaskIds,
    setRecommendedTasks,
    userSkills,
    replaceTasks,
    isLoadingRecommendations,
    recommendedTasks.length,
  ]);

  const recommendedTaskIds = useMemo(() => {
    console.log({ recommendedTasks });
    return new Set(recommendedTasks?.map((t) => t.task) || []);
  }, [recommendedTasks]);

  const displayTasks = useMemo(() => {
    // Determine the correct set of tasks to display based on the cycle number
    const baseTasks =
      cycleNumber === 0
        ? tasks
        : cycleNumber === 1
        ? initialTasks
        : advancedTasks;

    // Merge the dynamic state (like 'completed' or 'locked' status) from the store
    // into the static task definitions.
    return baseTasks.map((baseTask) => {
      const stateTask = tasks.find((t) => t.numId === baseTask.numId);
      return {
        ...baseTask,
        id: stateTask?.id || baseTask.id, // Use the ID from the state if available
        completed: stateTask?.completed || false,
        locked: stateTask?.locked ?? baseTask.locked, // Use locked status from state, fallback to definition
      };
    });
  }, [cycleNumber, tasks]);

  console.log("Before rendering cards:");
  console.log("  recommendedTaskIds:", recommendedTaskIds);
  console.log("  cycleNumber:", cycleNumber);

  // Sort tasks: recommended first, then by price descending
  const sortedTasks = [...displayTasks].sort((a, b) => {
    const aIsRecommended = recommendedTaskIds.has(a.numId);
    const bIsRecommended = recommendedTaskIds.has(b.numId);

    if (aIsRecommended && !bIsRecommended) {
      return -1; // a comes first
    }
    if (!aIsRecommended && bIsRecommended) {
      return 1; // b comes first
    }

    // If both have the same recommendation status, sort by price
    return b.price - a.price;
  });

  // Helper function to render button content based on task state
  const getButtonContent = (isLocked: boolean, isCompleted?: boolean) => {
    if (isLocked) {
      return (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Locked
        </>
      );
    }
    if (isCompleted) {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Completed
        </>
      );
    }
    return "Start Task";
  };

  return (
    <div className="space-y-6 p-6">
      <Button onClick={handleStartOver} className="self-start">
        Start Over
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Available Tasks</h1>
          <p className="text-muted-foreground">
            Select a task to start working (there won’t be an extra payment.
            What you earned in the simulator won’t count towards your final
            earnings)
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {sortedTasks.map((task) => {
          console.log({ task });
          return (
            <Card
              key={task.id}
              className="flex flex-col h-full transition-all hover:shadow-md"
              onClick={() =>
                !task.locked && router.push(`/sites/task-detail?id=${task.id}`)
              }
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {recommendedTaskIds.has(task.numId) && cycleNumber > 0 && (
                      <>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Recommended
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Score:{" "}
                          {recommendedTasks
                            .find((t) => t.task === task.numId)
                            ?.score.toFixed(2)}
                        </span>
                        {recommendedTasks.find((t) => t.task === task.numId)
                          ?.top_feature && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            Picked for you because:{" "}
                            {
                              recommendedTasks.find(
                                (t) => t.task === task.numId
                              )?.top_feature
                            }
                          </span>
                        )}
                        {task.locked && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            Requires task #{task.dependsOn}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {getTaskTypeIcon(task.type)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {task.duration ?? "N/A"} min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {task.numQuestions ?? "?"} questions
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  {task.description}
                </p>

                <div className="mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="font-medium">
                      ${task.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              {userSkills.length > 0 && (
                <div className="px-4 pb-2">
                  <ul className="flex flex-wrap gap-2">
                    {userSkills.map(
                      (skill) =>
                        task.requiredSkills?.includes(skill) && (
                          <li
                            key={skill}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            {
                              userSkillsMapping[
                                skill as keyof typeof userSkillsMapping
                              ]
                            }
                          </li>
                        )
                    )}
                  </ul>
                </div>
              )}
              <CardFooter className="mt-auto pt-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/sites/task-detail?id=${task.id}`);
                  }}
                  disabled={task.locked}
                  className="w-full"
                >
                  {getButtonContent(task.locked, task.completed)}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
