"use client";

import { useAppStore } from "@/hooks/useAppStore";
import { useState } from "react";
import { suggestedSkills } from "@/data/suggestedSkills";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

interface Task {
  id: string;
  numId: number;
  topic: string;
  name: string;
  description: string;
  instructions: string;
  price: number;
  type:
    | "audio"
    | "document"
    | "image"
    | "transcription"
    | "video_recording"
    | "voice_recording";
  acceptedFormats: string[];
  locked: boolean;
  dependsOn?: string;
  completed: boolean;
}

function SuggestedSkillsPage() {
  const replaceTasks = useAppStore((s) => s.replaceTasks);
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const setUserSkills = useAppStore((s) => s.setUserSkills);

  const handleSubmit = () => {
    if (selected.length === 0) {
      alert("Please select at least one skill to continue.");
      return;
    }

    const generatedTasks = selected.flatMap((skill) => {
      const taskIds = [uuidv4(), uuidv4(), uuidv4()];

      return taskIds.map(
        (id, index): Task => ({
          id,
          numId: index + 1,
          topic: skill,
          name: `Skill Task ${index + 1} (${skill})`,
          description: `Practice task for ${skill}`,
          instructions: `Do something related to ${skill}`,
          price: Math.random() * (2 - 0.2) + 0.2,
          type: (() => {
            const mediaTypes = [
              "audio",
              "document",
              "image",
              "transcription",
              "video_recording",
              "voice_recording",
            ] as const;
            type MediaType = (typeof mediaTypes)[number];
            return mediaTypes[
              Math.floor(Math.random() * mediaTypes.length)
            ] as MediaType;
          })(),
          acceptedFormats: ["pdf", "txt"],
          locked: index !== 0,
          dependsOn: index > 0 ? taskIds[index - 1] : undefined,
          completed: false,
        })
      );
    });

    setUserSkills(selected);
    replaceTasks(generatedTasks);
    router.push("/sites/tasks");
  };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-4xl font-bold text-gray-900">
        Suggested Skills for You
      </h1>
      <p className="text-gray-600 text-lg">
        Based on your recent responses, here are some skills you might be
        interested in. Choose any that you’d like to develop further.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {suggestedSkills.map((skill) => (
          <motion.div
            key={skill.id}
            onClick={() => handleSelect(skill.id)}
            whileHover={{ scale: 1.02 }}
            className={`cursor-pointer border rounded-lg p-5 shadow-sm transition ${
              selected.includes(skill.id)
                ? "border-black bg-gray-50"
                : "border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-2">{skill.title}</h2>
            <p className="text-sm text-gray-600">{skill.description}</p>
            {selected.includes(skill.id) && (
              <p className="mt-3 text-xs text-green-600 font-medium">
                ✅ Selected
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="text-right pt-4">
        <button
          onClick={handleSubmit}
          className="bg-black text-white py-2 px-6 rounded-md hover:bg-neutral-800 transition"
        >
          Continue with selected skills
        </button>
      </div>
    </div>
  );
}

export default SuggestedSkillsPage;
