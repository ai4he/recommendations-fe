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

  const taskId = searchParams.get("id");
  const task = tasks.find((task) => task.id === taskId);

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setSuccess(!!task.completed);
      setFilePreviewUrl(task.uploadedFileUrl ?? null);
    }
  }, [task]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const completedCount = tasks.filter((t) => t.completed).length;
    const feedbackHistory = useAppStore.getState().feedbackHistory;
    const cycleNumber = feedbackHistory.length;

    if (completedCount >= 3) {
      if (cycleNumber === 0 || cycleNumber === 1 || cycleNumber === 2) {
        router.push("/sites/feedback");
      }
    }
  }, [tasks, router]);

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
      uploadTaskFile(task.id, url, "file");
    }, 1500);
  };

  const handleTextSubmit = () => {
    if (!filePreviewUrl?.trim()) {
      alert("Please write something first.");
      return;
    }
    setSuccess(true);
    uploadTaskFile(task.id, filePreviewUrl, "text");
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
          <p className="text-green-600 mt-4 font-semibold animate-pulse">
            ✅ Submission successful! Task completed.
          </p>
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
