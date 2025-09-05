"use client";

import { Task, useAppStore } from "@/hooks/useAppStore";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { initialTasks } from "@/data/initialTasks";
import { useEffect, useMemo, useState, useRef } from "react";
import { advancedTasks } from "@/data/advancedTasks";

function FeedbackPage() {
  const tasks = useAppStore((state) => state.tasks);
  const replaceTasks = useAppStore((state) => state.replaceTasks);
  const archiveCurrentCycle = useAppStore((s) => s.archiveCurrentCycle);
  const addFeedbackToTask = useAppStore((s) => s.addFeedbackToTask);
  const getTakenTaskIds = useAppStore((s) => s.getTakenTaskIds);
  const userSkills = useAppStore((s) => s.userSkills);

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed),
    [tasks]
  );
  const [generalFeedback, setGeneralFeedback] = useState({
    comment: "",
    rating: 0,
  });
  const [taskFeedbacks, setTaskFeedbacks] = useState<
    Record<string, { comment: string; rating: number }>
  >({});

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();

  const cycleNumber = useAppStore((s) => s.currentCycle);

  const prevCompletedTasksRef = useRef<Task[]>([]);

  useEffect(() => {
    // Compare current completedTasks with previous ones
    const hasCompletedTasksChanged =
      completedTasks.length !== prevCompletedTasksRef.current.length ||
      completedTasks.some(
        (task, index) =>
          task.id !== prevCompletedTasksRef.current[index]?.id ||
          task.feedback?.comment !==
            prevCompletedTasksRef.current[index]?.feedback?.comment ||
          task.feedback?.rating !==
            prevCompletedTasksRef.current[index]?.feedback?.rating
      );

    if (hasCompletedTasksChanged) {
      const initialFeedbacks: Record<
        string,
        { comment: string; rating: number }
      > = {};
      completedTasks.forEach((task) => {
        if (task.feedback) {
          initialFeedbacks[task.id] = task.feedback;
        }
      });
      setTaskFeedbacks(initialFeedbacks);
      prevCompletedTasksRef.current = completedTasks; // Update ref
    }
  }, [completedTasks]);

  const handleTaskFeedbackChange = (
    taskId: string,
    comment: string,
    rating: number
  ) => {
    const newFeedbacks = { ...taskFeedbacks, [taskId]: { comment, rating } };
    setTaskFeedbacks(newFeedbacks);
    addFeedbackToTask(taskId, { comment, rating });
  };

  const handleSubmit = async () => {
    if (!generalFeedback.comment.trim() || generalFeedback.rating === 0) {
      alert(
        "Please provide both a comment and a rating for the general feedback."
      );
      return;
    }

    setIsSubmitting(true);
    archiveCurrentCycle(generalFeedback);

    // added
    // save the first three completed tasks as preferred tasks 
    if (cycleNumber === 0) {
      const chosenIds = completedTasks.slice(0, 3).map((t) => t.numId);
      useAppStore.getState().setPreferredTasks(chosenIds);
      console.log("Saved preferred tasks:", chosenIds);
    }
    

    if (cycleNumber === 1 || cycleNumber === 2) {
      const taken_tasks = getTakenTaskIds();
      const tasks_payload = initialTasks.map((task) => ({
        Task: task.numId,
        Skill: 1, // Placeholder
        Length: task.duration || 0,
        type: task.type,
        price: task.price,
        num_questions: task.numQuestions || 0,
        duration: task.duration || 0,
        topic: task.topic || "",
      }));

      try {
        const response = await fetch(
          "http://13.221.139.11/api/recommend",
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
        useAppStore.getState().setRecommendedTasks(recommendations);
      } catch (error) {
        console.error(error);
        // Handle error appropriately
      }
    }

    setSubmitted(true);
  };

  useEffect(() => {
    const atLeastThreeCompleted = completedTasks.length >= 3;
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    console.log("FeedbackPage useEffect triggered:", {
      submitted,
      completedTasksCount: completedTasks.length,
      cycleNumber,
      currentPath,
      isNavigating,
    });

    // Solo proceder si el feedback ha sido enviado y tenemos tareas completadas
    if (!submitted || !atLeastThreeCompleted ) {
      console.log("FeedbackPage - Not redirecting:", {
        submitted,
        atLeastThreeCompleted,
        isNavigating,
        currentPath,
      });
      return;
    }

    console.log("FeedbackPage - Processing navigation for cycle:", cycleNumber);
    setIsNavigating(true);

    // Usar un timeout más largo para asegurar que archiveCurrentCycle se complete
    const timer = setTimeout(() => {
      try {
        if (cycleNumber === 1) {
          console.log(
            "FeedbackPage - Cycle 0: Going to tasks with initialTasks"
          );
          // Después del primer ciclo, reemplazar con initialTasks y ir a tasks
          console.log("replacing tasks with initialTasks", { initialTasks });
          replaceTasks(initialTasks);
          //router.push("/sites/tasks");
          router.push("/sites/thank-you");
        } else if (cycleNumber === 2) {
          console.log("FeedbackPage - Cycle 2: Going to suggested-skills");
          // back to the entry point page
          const entryPoint = useAppStore.getState().getEntryPoint();
          console.log("Entry point is:", entryPoint);
          if (entryPoint === "tasks") {
            router.push("/sites/thank-you");
          } else if (entryPoint === "recommender1") {
            replaceTasks(advancedTasks);
            router.push("/sites/recommender1");
          } else if (entryPoint === "recommender2") {
            replaceTasks(advancedTasks);
            router.push("/sites/recommender2");
          } else {
            console.warn("Unknown entry point, defaulting to /sites/tasks");
            router.push("/sites/tasks");
          }          
        } else if (cycleNumber >= 3) {
          console.log("FeedbackPage - Cycle 3+: Going to thank-you");
          // Después del tercer ciclo o más, ir a thank-you
          // set cycleNumber back to 0 for a new session
          useAppStore.getState().setCurrentCycle(1);
          replaceTasks(initialTasks);
          router.push("/sites/thank-you");
        }
      } catch (error) {
        console.error("Error during navigation:", error);
        setIsNavigating(false);
      }
    }, 1500); // Aumentar el delay para dar tiempo a que se complete archiveCurrentCycle

    return () => clearTimeout(timer);
  }, [
    submitted,
    completedTasks,
    cycleNumber,
    router,
    replaceTasks,
    isNavigating,
  ]);

  return (
    <div className="mx-auto max-w-screen-md px-6 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Feedback</h1>
      <p className="text-lg text-gray-600 mb-6">
        Please provide general feedback for the tasks you have completed.
      </p>

      {/* Individual Task Feedback */}
      <div className="space-y-8 mb-10">
        {completedTasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-md border"
          >
            <h2 className="text-2xl font-semibold text-black mb-4">
              {task.name}
            </h2>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Your Comment:
              </p>
              <Textarea
                placeholder="What did you think of this task?"
                rows={3}
                value={taskFeedbacks[task.id]?.comment || ""}
                onChange={(e) =>
                  handleTaskFeedbackChange(
                    task.id,
                    e.target.value,
                    taskFeedbacks[task.id]?.rating || 0
                  )
                }
              />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Your Rating:
              </p>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                      (taskFeedbacks[task.id]?.rating || 0) >= star
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }`}
                    fill={
                      (taskFeedbacks[task.id]?.rating || 0) >= star
                        ? "currentColor"
                        : "none"
                    }
                    onClick={() =>
                      handleTaskFeedbackChange(
                        task.id,
                        taskFeedbacks[task.id]?.comment || "",
                        star
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* General Feedback */}
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        General Feedback
      </h2>
      <p className="text-lg text-gray-600 mb-6">
        Please provide general feedback for the tasks you have completed in this
        cycle.
      </p>

      <p className="text-sm text-gray-500">Current cycle: {cycleNumber}</p>

      {completedTasks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">
            You haven’t completed any tasks yet.
          </p>
          <a
            href=""
            className="inline-block bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-neutral-800 transition"
          >
            🔙 Go to Tasks
          </a>
        </div>
      ) : completedTasks.length < 3 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">
            You need to complete at least <strong>3 tasks</strong> before giving
            feedback.
          </p>
          <a
            href=""
            className="inline-block bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-neutral-800 transition"
          >
            🔙 Go to Tasks
          </a>
        </div>
      ) : submitted ? (
        <div className="text-center py-20">
          <p className="text-green-600 text-lg font-semibold mb-4">
            ✅ Thank you for your feedback!
          </p>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md border"
        >
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Leave a general comment:
            </p>
            <Textarea
              placeholder="What did you think of the tasks in this cycle?"
              rows={4}
              value={generalFeedback.comment}
              onChange={(e) =>
                setGeneralFeedback({
                  ...generalFeedback,
                  comment: e.target.value,
                })
              }
            />
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Rate this task cycle:
            </p>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 cursor-pointer transition-colors ${
                    generalFeedback.rating >= star
                      ? "text-yellow-500"
                      : "text-gray-300"
                  }`}
                  fill={
                    generalFeedback.rating >= star ? "currentColor" : "none"
                  }
                  onClick={() =>
                    setGeneralFeedback({ ...generalFeedback, rating: star })
                  }
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-6 w-full bg-black text-white py-2 px-4 rounded-md font-medium hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default FeedbackPage;
