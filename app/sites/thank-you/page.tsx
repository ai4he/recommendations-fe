"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/hooks/useAppStore";
import { useEffect } from "react";

export default function ThankYouPage() {
  const router = useRouter();
  
  // Get the current state from the store
  const appState = useAppStore.getState();
  const { users, tasks, oldTaskCycles, feedbackHistory, recommendedTasks, userSkills } = appState;

  const handleGoHome = () => {
    router.push("/");
  };

  // Automatically download data when component mounts
  useEffect(() => {
    // Function to download data as JSON
    const downloadData = () => {
      // Create a data object with all the state we want to save
      const data = {
        users,
        tasks,
        oldTaskCycles,
        feedbackHistory,
        recommendedTasks,
        userSkills,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          screenResolution: typeof window !== 'undefined' 
            ? `${window.screen.width}x${window.screen.height}` 
            : null,
        }
      };

      // Create a blob with the data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `app-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    };

    // Execute the download
    downloadData();
  }, [users, tasks, oldTaskCycles, feedbackHistory, recommendedTasks, userSkills]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 text-center"
    >
      <h1 className="text-5xl font-bold text-gray-900 mb-4">Thank You!</h1>
      <p className="text-xl text-gray-700 mb-8">
        Your participation is greatly appreciated. Your data has been downloaded automatically.
      </p>

      <Button
        onClick={handleGoHome}
        className="py-3 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition duration-200"
      >
        Prolific link
      </Button>
    </motion.div>
  );
}
