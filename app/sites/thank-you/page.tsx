"use client";

import { useAppStore } from "@/hooks/useAppStore";

export default function ThankYouPage() {
  const oldTaskCycles = useAppStore((s) => s.oldTaskCycles);
  const feedbackHistory = useAppStore((s) => s.feedbackHistory);
  const userSkills = useAppStore((s) => s.userSkills);

  return (
    <div className="min-h-screen px-6 py-24 bg-white text-center space-y-8">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-black">
          🎉 Thank You!
        </h1>
        <p className="text-lg text-gray-600">
          You’ve completed all assigned tasks. We appreciate your effort!
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto bg-gray-50 border rounded-md p-6 text-left space-y-6">
        {/* Task summary */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            🗂️ Task Summary
          </h2>
          <p className="text-sm text-gray-700 mb-2">
            You completed {oldTaskCycles.flat().length} tasks across{" "}
            {oldTaskCycles.length} cycles.
          </p>
          <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
            {oldTaskCycles.map((cycle, i) => (
              <li key={i}>
                <strong>Cycle {i + 1}:</strong>{" "}
                {cycle.filter((t) => t.completed).length} completed tasks
              </li>
            ))}
          </ul>
        </div>

        {/* Feedback summary */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            📝 Feedback Summary
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {feedbackHistory.map((entry, i) => (
              <li key={i} className="bg-white p-3 rounded border">
                <strong>Cycle {i + 1}:</strong> &quot;
                {entry.generalFeedback.comment}&quot; —{" "}
                <span className="text-yellow-600">
                  ★ {entry.generalFeedback.rating}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Skills summary */}
        {userSkills.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2 text-black">
              🧠 Selected Skills
            </h2>
            <p className="text-sm text-gray-700">
              Based on your selection, we matched you with tasks related to:
            </p>
            <ul className="flex flex-wrap gap-2 mt-2">
              {userSkills.map((skill) => (
                <li
                  key={skill}
                  className="bg-black text-white px-3 py-1 rounded-full text-xs"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submitted answers */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            📎 Submitted Responses
          </h2>
          {oldTaskCycles.map((cycle, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                Cycle {i + 1}
              </h3>
              <ul className="space-y-2 text-sm">
                {cycle
                  .filter((t) => t.completed && t.uploadedFileUrl)
                  .map((task) => (
                    <li
                      key={task.id}
                      className="bg-white p-3 rounded border flex flex-col"
                    >
                      <span className="font-medium text-gray-900">
                        {task.name}
                      </span>
                      {task.submissionType === "file" &&
                      task.uploadedFileUrl?.startsWith("blob:") ? (
                        <span className="text-gray-600">
                          Submitted a file (local preview only)
                        </span>
                      ) : task.submissionType === "file" ? (
                        <a
                          href={task.uploadedFileUrl}
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📄 View uploaded file
                        </a>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap mt-1">
                          ✍️ {task.uploadedFileUrl}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Submitted via: {task.submissionType}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
