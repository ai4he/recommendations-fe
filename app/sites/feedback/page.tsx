"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { advancedTasks } from "@/data/advancedTasks";

function FeedbackPage() {
  const tasks = useAppStore((state) => state.tasks);
  const replaceTasks = useAppStore((state) => state.replaceTasks);
  const archiveCurrentCycle = useAppStore((s) => s.archiveCurrentCycle);

  const completedTasks = tasks.filter((t) => t.completed);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // ✅ Capturamos el ciclo actual antes de enviar feedback
  const [cycleNumber] = useState(
    () => useAppStore.getState().feedbackHistory.length
  );

  const handleSubmit = () => {
    if (!comment.trim() || rating === 0) {
      alert("Please provide both a comment and a rating.");
      return;
    }

    setIsSubmitting(true);
    archiveCurrentCycle({ comment, rating });
    setSubmitted(true);
  };

  useEffect(() => {
    const atLeastThreeCompleted = completedTasks.length >= 3;

    if (submitted && atLeastThreeCompleted) {
      if (cycleNumber === 0) {
        replaceTasks(advancedTasks);
        router.push("/sites/tasks");
      } else if (cycleNumber === 1) {
        router.push("/sites/suggested-skills");
      } else if (cycleNumber === 2) {
        router.push("/sites/thank-you");
      }
    }
  }, [submitted, completedTasks, cycleNumber, replaceTasks, router]);

  return (
    <div className="mx-auto max-w-screen-md px-6 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Feedback</h1>
      <p className="text-lg text-gray-600 mb-6">
        Please provide general feedback for the tasks you have completed.
      </p>

      <p className="text-sm text-gray-500">Current cycle: {cycleNumber}</p>

      {completedTasks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">
            You haven’t completed any tasks yet.
          </p>
          <a
            href="/sites/tasks"
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
            href="/sites/tasks"
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
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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
                    rating >= star ? "text-yellow-500" : "text-gray-300"
                  }`}
                  fill={rating >= star ? "currentColor" : "none"}
                  onClick={() => setRating(star)}
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

// "use client";

// import { useEffect, useState } from "react";
// import { useAppStore } from "@/hooks/useAppStore";
// import { Textarea } from "@/components/ui/textarea";
// import { Star } from "lucide-react";
// import { motion } from "framer-motion";
// import { advancedTasks } from "@/data/advancedTasks"; // ajusta la ruta si es necesario

// function FeedbackPage() {
//   const tasks = useAppStore((state) => state.tasks);
//   const addFeedbackToTask = useAppStore((state) => state.addFeedbackToTask);
//   const replaceTasks = useAppStore((state) => state.replaceTasks);

//   const completedTasks = tasks.filter((t) => t.completed);
//   const archiveCurrentCycle = useAppStore((s) => s.archiveCurrentCycle);

//   const [feedbacks, setFeedbacks] = useState<
//     Record<string, { comment: string; rating: number }>
//   >({});

//   const handleFeedbackChange = (taskId: string, comment: string) => {
//     setFeedbacks((prev) => ({
//       ...prev,
//       [taskId]: {
//         ...prev[taskId],
//         comment,
//       },
//     }));
//   };

//   const handleRatingChange = (taskId: string, rating: number) => {
//     setFeedbacks((prev) => ({
//       ...prev,
//       [taskId]: {
//         ...prev[taskId],
//         rating,
//       },
//     }));
//   };

//   const handleSubmit = (taskId: string) => {
//     const feedback = feedbacks[taskId];
//     if (!feedback || !feedback.rating || !feedback.comment.trim()) {
//       alert("Please complete both comment and rating.");
//       return;
//     }

//     addFeedbackToTask(taskId, feedback);
//     alert("✅ Thanks for your feedback!");
//   };

//   // ✅ Detectar fin de feedbacks y cargar nuevas tareas
//   useEffect(() => {
//     const allCompletedWithFeedback =
//       tasks.length > 0 && tasks.every((t) => t.completed && t.feedback);

//     if (allCompletedWithFeedback) {
//       archiveCurrentCycle(); // ✅ Guarda ciclo actual
//       replaceTasks(advancedTasks); // 🔁 Reemplaza por nuevo ciclo
//     }
//   }, [tasks, archiveCurrentCycle, replaceTasks]);
//   return (
//     <div className="mx-auto max-w-screen-xl px-6 py-10">
//       <h1 className="text-4xl font-bold text-gray-900 mb-2">Feedback</h1>
//       <p className="text-lg text-gray-600 mb-6">
//         Please provide feedback for the tasks youve completed.
//       </p>

//       {completedTasks.length === 0 ? (
//         <div className="text-center py-20">
//           <p className="text-gray-500 text-lg mb-4">
//             You haven’t completed any tasks yet.
//           </p>
//           <a
//             href="/sites/tasks"
//             className="inline-block bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-neutral-800 transition"
//           >
//             🔙 Go to Tasks
//           </a>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-10">
//           {completedTasks.map((task) => (
//             <motion.div
//               key={task.id}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3 }}
//               className="w-full"
//             >
//               <div className="w-full h-full rounded-lg shadow-md bg-white p-6 border border-gray-200 flex flex-col justify-between">
//                 <h2 className="text-2xl font-semibold text-black mb-4">
//                   {task.name}
//                 </h2>

//                 {task.feedback ? (
//                   <>
//                     <div>
//                       <p className="text-sm font-medium text-gray-700 mb-1">
//                         Your Comment:
//                       </p>
//                       <p className="text-gray-800 bg-gray-50 rounded p-3 border">
//                         {task.feedback.comment}
//                       </p>
//                     </div>
//                     <div className="mt-4">
//                       <p className="text-sm font-medium text-gray-700 mb-1">
//                         Your Rating:
//                       </p>
//                       <div className="flex space-x-1">
//                         {[1, 2, 3, 4, 5].map((star) => (
//                           <Star
//                             key={star}
//                             className={`w-6 h-6 ${
//                               task.feedback!.rating >= star
//                                 ? "text-yellow-500"
//                                 : "text-gray-300"
//                             }`}
//                             fill={
//                               task.feedback!.rating >= star
//                                 ? "currentColor"
//                                 : "none"
//                             }
//                           />
//                         ))}
//                       </div>
//                     </div>
//                   </>
//                 ) : (
//                   <>
//                     <div>
//                       <p className="text-sm font-medium text-gray-700 mb-1">
//                         Leave a comment:
//                       </p>
//                       <Textarea
//                         placeholder="What did you think of this task?"
//                         rows={4}
//                         value={feedbacks[task.id]?.comment || ""}
//                         onChange={(e) =>
//                           handleFeedbackChange(task.id, e.target.value)
//                         }
//                       />
//                     </div>
//                     <div className="mt-4">
//                       <p className="text-sm font-medium text-gray-700 mb-1">
//                         Rate the task:
//                       </p>
//                       <div className="flex space-x-1">
//                         {[1, 2, 3, 4, 5].map((star) => (
//                           <Star
//                             key={star}
//                             className={`w-6 h-6 cursor-pointer transition-colors ${
//                               (feedbacks[task.id]?.rating || 0) >= star
//                                 ? "text-yellow-500"
//                                 : "text-gray-300"
//                             }`}
//                             onClick={() => handleRatingChange(task.id, star)}
//                             fill={
//                               (feedbacks[task.id]?.rating || 0) >= star
//                                 ? "currentColor"
//                                 : "none"
//                             }
//                           />
//                         ))}
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => handleSubmit(task.id)}
//                       className="mt-6 w-full bg-black text-white py-2 px-4 rounded-md font-medium hover:bg-neutral-800 transition"
//                     >
//                       Submit Feedback
//                     </button>
//                   </>
//                 )}
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default FeedbackPage;
