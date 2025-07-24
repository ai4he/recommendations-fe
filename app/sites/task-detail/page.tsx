"use client";
export const dynamic = "force-dynamic";

import { useAppStore } from "@/hooks/useAppStore";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UploadIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";

function TaskDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tasks = useAppStore((state) => state.tasks);
  const uploadTaskFile = useAppStore((state) => state.uploadTaskFile);
  const addFeedbackToTask = useAppStore((state) => state.addFeedbackToTask);

  const taskId = searchParams.get("id");
  const task = tasks.find((task) => task.id === taskId);

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState({ comment: "", rating: 0 });

  useEffect(() => {
    if (task) {
      setSuccess(!!task.completed);
      setFilePreviewUrl(task.uploadedFileUrl ?? null);
      if (task.feedback) {
        setFeedback(task.feedback);
      }
    }
  }, [task]);

  useEffect(() => {
    if (typeof window === "undefined" || !task) return;

    const completedCount = tasks.filter((t) => t.completed).length;
    const feedbackHistory = useAppStore.getState().feedbackHistory;
    const currentCycleIndex = feedbackHistory.length;

    // Solo redirigir si:
    // 1. Tenemos 3 o más tareas completadas
    // 2. Estamos en los ciclos 0, 1, o 2
    // 3. No estamos ya en la página de feedback
    const isOnFeedbackPage = window.location.pathname.includes("feedback");
    const shouldRedirect =
      completedCount >= 3 && currentCycleIndex < 3 && !isOnFeedbackPage;

    console.log("TaskDetail - Navigation check:", {
      completedCount,
      currentCycleIndex,
      currentPath: window.location.pathname,
      isOnFeedbackPage,
      shouldRedirect,
    });

    if (shouldRedirect) {
      console.log("TaskDetail - Redirecting to feedback page");
      // Pequeño delay para permitir que la tarea se complete
      const timer = setTimeout(() => {
        router.push("/sites/feedback");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tasks, router, task]);

  if (!task) return <p className="p-6 text-red-500">Task not found</p>;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()!.toLowerCase();
    const isAccepted = task.acceptedFormats.includes(extension);
    if (!isAccepted) {
      alert(
        `Only these formats are allowed: ${task.acceptedFormats.join(", ")}`
      );
      return;
    }

    setUploading(true);
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);

    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
      uploadTaskFile(task.id, task.numId,url, "file");
    }, 1500);
  };

  const handleTextSubmit = () => {
    if (!filePreviewUrl?.trim()) {
      alert("Please write something first.");
      return;
    }
    setSuccess(true);
    uploadTaskFile(task.id, task.numId, filePreviewUrl, "text");
  };

  const goBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto p-6 space-y-6 bg-white rounded-lg shadow-lg"
    >
      {/* Back button */}
      <button
        onClick={goBack}
        className="flex items-center text-blue-600 hover:underline gap-1"
      >
        <ArrowLeftIcon />
        Go back
      </button>

      {/* Title */}
      <motion.h1
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-bold text-gray-900"
      >
        {task.name}
      </motion.h1>

      {/* Description and instructions */}
      <p className="text-lg text-gray-600">{task.description}</p>
      <p className="text-md text-gray-700 border-l-4 border-blue-500 pl-4 italic">
        {task.instructions}
      </p>

      {/* Subida o texto */}
      <div className="mt-4 space-y-4">
        {!success && (
          <>
            {/* Subir archivo */}
            <div className="space-y-2">
              <input
                type="file"
                accept={task.acceptedFormats.map((ext) => `.${ext}`).join(",")}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded cursor-pointer transition-all duration-200"
              >
                <UploadIcon />
                {uploading ? "Uploading..." : "Upload File"}
              </label>
            </div>

            {/* Ingreso de texto */}
            <div className="space-y-2">
              <textarea
                placeholder="Or write your response here..."
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
                value={filePreviewUrl ?? ""}
                onChange={(e) => setFilePreviewUrl(e.target.value)}
              />
              <button
                onClick={handleTextSubmit}
                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-neutral-800 transition"
              >
                Submit Text
              </button>
            </div>

            {/* Barra de progreso */}
            {uploading && (
              <div className="mt-4 w-full bg-gray-200 rounded h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="h-full bg-blue-500"
                />
              </div>
            )}
          </>
        )}

        {/* Submission preview */}
        {filePreviewUrl && success && (
          <div className="mt-4 border rounded p-4 bg-gray-50">
            <p className="text-sm text-gray-700 font-medium mb-2">
              Submitted Content:
            </p>
            {task.type === "image" && filePreviewUrl.startsWith("blob:") ? (
              <Image
                src={filePreviewUrl}
                alt="Uploaded preview"
                width={400}
                height={200}
                className="rounded border"
              />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {filePreviewUrl}
              </p>
            )}
            {task.submissionType && (
              <p className="text-xs text-gray-500 italic mt-2">
                Submitted via:{" "}
                {task.submissionType === "file" ? "File upload" : "Text input"}
              </p>
            )}
          </div>
        )}

        {/* Confirmation */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-green-600 mt-4 font-semibold animate-pulse">
              ✅ Submission successful! Task completed.
            </p>

            {/* Feedback Form */}
            <div className="mt-6 space-y-4 p-4 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Task Feedback
              </h2>
              <p className="text-sm text-gray-600">
                How was your experience with this task?
              </p>

              {/* Star Rating */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFeedback({ ...feedback, rating: star })}
                    className={`text-3xl ${
                      feedback.rating >= star
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </motion.button>
                ))}
              </div>

              {/* Comment Box */}
              <textarea
                placeholder="Share your thoughts..."
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
                value={feedback.comment}
                onChange={(e) =>
                  setFeedback({ ...feedback, comment: e.target.value })
                }
              />

              <button
                onClick={() => {
                  addFeedbackToTask(task.id, feedback);
                  // router.back();
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:bg-gray-400"
                disabled={!feedback.rating || !feedback.comment}
              >
                Submit Feedback
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading task…</div>}>
      <TaskDetailPage />
    </Suspense>
  );
}
