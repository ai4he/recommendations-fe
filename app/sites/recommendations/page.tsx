"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import type { Recommendation, RecommendationResult } from "@/hooks/useAppStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface TaskRecommendation {
  task: number;
  score: number;
  skill: number;
  length: number;
  price: number;
  num_questions: number;
  duration: number;
  topic: string;
  type: string;
  is_fair?: boolean;
}

export default function RecommendationsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTakenTaskIds = useAppStore((s) => s.getTakenTaskIds);
  const tasks = useAppStore((state) => state.tasks);
  const setRecommendedTasks = useAppStore((s) => s.setRecommendedTasks);
  const recommendationResult = useAppStore((s) => s.recommendedTasks);
  const userSkills = useAppStore((s) => s.userSkills);

  useEffect(() => {
    // Map user skills to a numeric skill level
    const getUserSkillLevel = (): number => {
      if (!userSkills || userSkills.length === 0) return 1; // Default to Beginner
      if (
        userSkills.some(
          (skill) => skill.includes("advanced") || skill.includes("expert")
        )
      )
        return 3; // Advanced
      if (userSkills.some((skill) => skill.includes("intermediate"))) return 2; // Intermediate
      return 1; // Beginner
    };
    async function fetchRecommendations() {
      try {
        setIsLoading(true);
        setError(null);

        const taken = getTakenTaskIds();

        // Map tasks to the format expected by the API

        // Map tasks to the format expected by the API with enhanced data
        const tasksPayload = tasks.map((task, index) => {
          console.log(task);
          // Map task type to API expected values
          const typeMap: Record<string, string> = {
            image: "image_labeling",
            document: "text_labeling",
            audio: "voice_recording",
            video: "video_recording",
            survey: "survey_response",
          };

          const taskType = typeMap[task.type?.toLowerCase()] ?? "text_labeling";
          const taskDuration = task.duration ?? 10;
          const taskPrice = task.price ?? 0.5;

          // Generate payload that matches the backend's expected format
          const payload = {
            Task: index + 1, // Ensure Task is a number as expected by the backend
            Skill: getUserSkillLevel(),
            Length: taskDuration,
            price: taskPrice,
            num_questions: task.numQuestions || 1,
            duration: taskDuration,
            topic: task.topic || "general",
            type: taskType,
            // Additional fields that the recommendation model might use
            difficulty: Math.ceil(Math.random() * 5), // 1-5
            required_skills: task.requiredSkills || ["basic"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Log a sample of the payload for debugging
          if (index < 3) {
            // Only log first 3 tasks to avoid cluttering console
            console.log(
              `Task ${index + 1} payload:`,
              JSON.stringify(
                {
                  Task: payload.Task,
                  type: payload.type,
                  price: payload.price,
                  duration: payload.duration,
                  skill: payload.Skill,
                  topic: payload.topic,
                },
                null,
                2
              )
            );
          }

          return payload;
        });

        console.log("Sending tasks to API:", {
          taken_tasks: taken,
          tasks_payload: tasksPayload.map((t) => ({
            Task: t.Task,
            type: t.type,
            topic: t.topic,
            price: t.price,
          })),
        });

        // Prepare the request data
        const requestData = {
          taken_tasks: taken,
          tasks_payload: tasksPayload.map((task) => ({
            Task: task.Task,
            Skill: task.Skill,
            Length: task.Length,
            price: task.price,
            num_questions: task.num_questions,
            duration: task.duration,
            topic: task.topic,
            type: task.type,
            difficulty: task.difficulty,
            required_skills: task.required_skills,
          })),
        };

        console.log(
          "Sending request to API with",
          requestData.tasks_payload.length,
          "tasks"
        );

        const response = await fetch(
          "https://fastapi-ai-3yp0.onrender.com/api/recommend",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(requestData),
          }
        );

        if (!response.ok) {
          let finalErrorMessage: string;
          try {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            finalErrorMessage = errorData.detail ?? JSON.stringify(errorData);
          } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
            try {
              const text = await response.text();
              finalErrorMessage = `Error ${response.status}: ${
                text ?? response.statusText
              }`;
            } catch (textError) {
              console.error("Failed to read response text:", textError);
              finalErrorMessage = `Error ${response.status}: ${response.statusText}`;
            }
          }
          throw new Error(
            `Failed to get recommendations: ${finalErrorMessage}`
          );
        }

        const result = await response.json();

        // Ensure the response matches the expected RecommendationResult format
        const responseData: RecommendationResult = {
          recommended: [],
          blocked: [],
          all_fair_tasks: [],
          all_unfair_tasks: [],
        };

        const processRecommendation = (
          r: Partial<Recommendation>
        ): Recommendation => ({
          task: r.task ?? 0,
          score: r.score ?? 0,
          skill: r.skill ?? 1,
          length: r.length ?? 0,
          price: r.price ?? 0,
          price_per_hour: (r.price ?? 0) / ((r.duration ?? 60) / 60),
          num_questions: r.num_questions ?? 1,
          duration: r.duration ?? 60,
          topic: r.topic ?? "general",
          type: r.type ?? "general",
          is_fair: r.is_fair ?? true,
        });

        if (Array.isArray(result)) {
          // If the response is a direct array, assume they are the recommendations
          responseData.recommended = result.map(processRecommendation);
        } else if (result) {
          // Map the API response to the expected format
          if (Array.isArray(result.recommended)) {
            responseData.recommended = result.recommended.map(
              processRecommendation
            );
          }

          if (Array.isArray(result.blocked)) {
            responseData.blocked = result.blocked.map(processRecommendation);
          }
        }

        setRecommendedTasks(responseData);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    // Only fetch if there are tasks available
    if (tasks.length > 0) {
      fetchRecommendations();
    } else {
      setIsLoading(false);
    }
  }, [getTakenTaskIds, setRecommendedTasks, tasks, userSkills]);

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          {tasks.length > 0
            ? "Generando recomendaciones personalizadas..."
            : "Cargando tareas disponibles..."}
        </p>
      </div>
    );
  }

  // Display error message if there's a problem
  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Error loading recommendations: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Display message if there are no recommendations
  if (!recommendationResult?.recommended?.length) {
    return (
      <div className="p-4 text-center">
        <p>No recommendations available at this time.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Complete more tasks to get personalized recommendations.
        </p>
      </div>
    );
  }

  const recommended =
    (recommendationResult.recommended as TaskRecommendation[]) ?? [];
  const blocked = (recommendationResult.blocked as TaskRecommendation[]) ?? [];

  // Function to get task name by ID
  const getTaskName = (taskId: number): string => {
    const task = tasks.find((t) => t.numId === taskId);
    return task?.name || `Task #${taskId}`;
  };

  // Function to format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  };

  // Function to get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 0.7) return "bg-green-100 text-green-800";
    if (score >= 0.4) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Get task type in readable format
  const getTaskTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      transcription: "Transcription",
      image_labeling: "Image Labeling",
      text_analysis: "Text Analysis",
      voice_recording: "Voice Recording",
      video_recording: "Video Recording",
      survey: "Survey",
      image: "Image",
      document: "Document",
      audio: "Audio",
    };
    return types[type] || type;
  };

  // Map skill level number to human-readable format
  const getSkillLevelLabel = (level: number): string => {
    const levels = ["Beginner", "Intermediate", "Advanced"];
    return levels[level - 1] || "Not specified";
  };

  // Display message if there are no recommendations or blocked tasks
  if (recommended.length === 0 && blocked.length === 0) {
    return (
      <p>
        No recommendations available. Complete more tasks to get personalized
        recommendations.
      </p>
    );
  }

  return (
    <div className="space-y-8 p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Your Recommendations
        </h1>
        <p className="text-muted-foreground">
          Based on your skills and previous tasks
        </p>
      </div>

      {recommended.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center">
              <Star className="h-6 w-6 mr-2 text-yellow-500" />
              Recommended Tasks
            </h2>
            <Badge variant="outline" className="px-3 py-1">
              {recommended.length} {recommended.length === 1 ? "task" : "tasks"}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map((rec) => {
              console.log({ rec });
              console.log({ tasks });
              const task = tasks.find((t) => t.numId === rec.task);
              const taskType = task?.type || rec.type;

              return (
                <Card
                  key={rec.task}
                  className="group hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl leading-tight">
                        {getTaskName(rec.task)}
                      </CardTitle>
                      <Badge
                        className={`text-xs ${getScoreColor(rec.score)}`}
                        variant="outline"
                      >
                        {Math.round(rec.score * 100)}%
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getTaskTypeLabel(taskType)}
                      </Badge>
                      {rec.is_fair && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Fair Pay
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">Duration:</span>{" "}
                          {formatDuration(rec.duration)}
                        </div>
                      </div>

                      <div className="flex items-center text-muted-foreground">
                        <DollarSign className="mr-2 h-4 w-4 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">Pay:</span> $
                          {rec.price.toFixed(2)}
                          <span className="text-xs ml-1 text-muted-foreground">
                            (${(rec.price / (rec.duration / 60)).toFixed(2)}
                            /hour)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-muted-foreground">
                        <Star className="mr-2 h-4 w-4 flex-shrink-0 text-yellow-500" />
                        <div className="flex-1">
                          <span className="font-medium">Level:</span>{" "}
                          {getSkillLevelLabel(rec.skill)}
                        </div>
                      </div>

                      {task?.topic && (
                        <div className="pt-2 mt-2 border-t">
                          <Badge variant="outline" className="text-xs">
                            {task.topic}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      className="w-full group-hover:bg-primary/90 transition-colors"
                      asChild
                    >
                      <Link href={`/sites/task-detail/${rec.task}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {blocked.length > 0 && (
        <section className="space-y-6 pt-8 border-t">
          <h2 className="text-2xl font-semibold flex items-center">
            <Lock className="h-6 w-6 mr-2 text-muted-foreground" />
            Locked Tasks
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blocked.map((rec) => {
              const task = tasks.find((t) => t.numId === rec.task);
              const taskType = task?.type || rec.type;

              return (
                <Card
                  key={rec.task}
                  className="opacity-70 hover:opacity-90 transition-opacity relative"
                >
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {getTaskName(rec.task)}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs w-fit">
                      {getTaskTypeLabel(taskType)}
                    </Badge>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span>Duration: {formatDuration(rec.duration)}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span>Pago: ${rec.price.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t text-center text-xs">
                        Complete more tasks to unlock
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="pt-8 mt-8 border-t text-center text-sm text-muted-foreground">
        <p>Recommendations update automatically based on your activity.</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Refresh Recommendations
        </Button>
      </div>
    </div>
  );
}
