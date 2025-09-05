"use client";
export const dynamic = "force-dynamic";

import { useAppStore } from "@/hooks/useAppStore";
import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { StaticImageData } from "next/image";
import { motion } from "framer-motion";
import { UploadIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
// import all images from assets/tickets
import receipt from "@/assets/tickets/1.jpg";
import receipt2 from "@/assets/tickets/2.jpg";
import receipt3 from "@/assets/tickets/3.webp";
import receipt4 from "@/assets/tickets/4.jpg";
import receipt5 from "@/assets/tickets/5.jpg";

import product1 from "@/assets/products/1.jpg";
import product2 from "@/assets/products/2.webp";
import product3 from "@/assets/products/3.jpg";
import product4 from "@/assets/products/4.jpg";
import product5 from "@/assets/products/5.jpg";

import color1 from "@/assets/intermediate/colors/1.jpg";
import color2 from "@/assets/intermediate/colors/2.jpg";
import color3 from "@/assets/intermediate/colors/3.jpg";
import color4 from "@/assets/intermediate/colors/4.jpg";
import color5 from "@/assets/intermediate/colors/5.jpg";
import color6 from "@/assets/intermediate/colors/6.jpg";
import color7 from "@/assets/intermediate/colors/7.jpg";
import color8 from "@/assets/intermediate/colors/8.jpg";
import color9 from "@/assets/intermediate/colors/9.jpg";
import color10 from "@/assets/intermediate/colors/10.jpg";
import color11 from "@/assets/intermediate/colors/11.jpg";
import color12 from "@/assets/intermediate/colors/12.jpg";
import color13 from "@/assets/intermediate/colors/13.jpg";

import medicalImage1 from "@/assets/intermediate/medical/1.jpg";
import medicalImage2 from "@/assets/intermediate/medical/2.jpg";
import medicalImage3 from "@/assets/intermediate/medical/3.jpg";
import medicalImage4 from "@/assets/intermediate/medical/4.jpg";
import medicalImage5 from "@/assets/intermediate/medical/5.jpg";
import medicalImage6 from "@/assets/intermediate/medical/6.jpg";
import medicalImage7 from "@/assets/intermediate/medical/7.jpg";
import medicalImage8 from "@/assets/intermediate/medical/8.jpg";
import medicalImage9 from "@/assets/intermediate/medical/9.jpg";
import medicalImage10 from "@/assets/intermediate/medical/10.jpg";
import medicalImage11 from "@/assets/intermediate/medical/11.jpg";
import medicalImage12 from "@/assets/intermediate/medical/12.jpg";

import productI1 from "@/assets/intermediate/products/1.jpg";
import productI2 from "@/assets/intermediate/products/2.jpg";
import productI3 from "@/assets/intermediate/products/3.jpg";
import productI4 from "@/assets/intermediate/products/4.jpg";
import productI5 from "@/assets/intermediate/products/5.jpg";

const hexColor = [
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "brown",
  "gray",
  "black",
  "white",
];

const audios = [1, 2, 3, 4, 5];

const products = [product1, product2, product3, product4, product5];

const medicalImages = [
  medicalImage1,
  medicalImage2,
  medicalImage3,
  medicalImage4,
  medicalImage5,
  medicalImage6,
  medicalImage7,
  medicalImage8,
  medicalImage9,
  medicalImage10,
  medicalImage11,
  medicalImage12,
];

const colorsIntermediate = [
  color1,
  color2,
  color3,
  color4,
  color5,
  color6,
  color7,
  color8,
  color9,
  color10,
  color11,
  color12,
  color13,
];

const productsIntermediate = [
  productI1,
  productI2,
  productI3,
  productI4,
  productI5,
];

const receipts = [receipt, receipt2, receipt3, receipt4, receipt5];

const tasksWithUpload = ["Upload a Color Picture"];
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
  const [displayedSentences, setDisplayedSentences] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedReceipt, setSelectedReceipt] =
    useState<StaticImageData | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<StaticImageData | null>(null);
  const [selectedMedicalImage, setSelectedMedicalImage] =
    useState<StaticImageData | null>(null);

  const [selectedProductIntermediate, setSelectedProductIntermediate] =
    useState<StaticImageData | null>(null);

  const [selectedColorIntermediate, setSelectedColorIntermediate] =
    useState<StaticImageData | null>(null);

  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);
  const [hasInitializedRandom, setHasInitializedRandom] = useState(false);

  const [selectedSentences, setSelectedSentences] = useState<string[]>([]);

  const [selectedSurveyQuestion, setSelectedSurveyQuestion] =
    useState<string>("");

  const shortSentences = useMemo(
    () => [
      "No parking",
      "Keep off the grass",
      "Beware of the dog",
      "Please do not disturb",
      "No trespassing",
      "Private property",
      "Do not enter",
      "Caution wet floor",
      "Slippery when wet",
      "Yield to pedestrians",
      "Do not block intersection",
      "Do not park in front of hydrant",
      "No smoking",
      "Do not litter",
      "Clean up after your pet",
      "Do not make loud noises",
      "Do not make excessive noise",
      "Do not disturb the peace",
      "Do not trespass",
      "Do not loiter",
      "Do not solicit",
      "Do not panhandle",
      "Do not beg",
      "Do not vandalize",
      "Do not pollute",
      "Do not make a disturbance",
      "Do not cause a disturbance",
      "Do not make a nuisance",
      "Do not cause a nuisance",
      "Do not create a disturbance",
      "Do not create a nuisance",
      "Do not make a noise disturbance",
      "Do not make a noise nuisance",
      "Do not cause a noise disturbance",
      "Do not cause a noise nuisance",
      "Do not create a noise disturbance",
      "Do not create a noise nuisance",
    ],
    []
  );

  const positiveSentences = useMemo(
    () => [
      "I am so happy",
      "You're so kind",
      "I love you",
      "You're so smart",
      "You're so beautiful",
      "You're so handsome",
      "You're so cute",
      "You're so funny",
      "I love tacos!",
      "I love pizza!",
      "You're my best friend!",
      "You're so sweet!",
    ],
    []
  );

  const negativeSentences = useMemo(
    () => [
      "I am so sad",
      "You're so mean",
      "I don't like you",
      "You're so lazy",
      "I don't like this place",
      "I don't like tacos!",
      "I don't like pizza!",
      "You're not my best friend!",
      "You're so sweet!",
    ],
    []
  );

  const surveyQuestions = useMemo(
    () => [
      "What is your favorite color?",
      "What is your favorite food?",
      "What is your favorite animal?",
      "What is your favorite sport?",
      "What is your favorite movie?",
    ],
    []
  );

  // Función para obtener un elemento aleatorio
  const getRandomItem = useCallback(<T,>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
  }, []);

  // Efecto para limpiar los estados cuando cambia la tarea
  useEffect(() => {
    // Resetear estados cuando cambia la tarea
    setHasInitializedRandom(false);
    setDisplayedSentences([]);
    setSelectedColor("");
    setSelectedReceipt(null);
    setSelectedProduct(null);
    setSelectedMedicalImage(null);
    setSelectedProductIntermediate(null);
    setSelectedColorIntermediate(null);
    setSelectedAudio(null);
    setFilePreviewUrl(null);
    setSuccess(false);
    setSelectedSentences([]);
    setSelectedSurveyQuestion("");
  }, [taskId]);

  // Efecto para inicializar los elementos aleatorios
  useEffect(() => {
    if (!task || hasInitializedRandom) return;

    switch (task.name) {
      case "Transcription Sample":
        setDisplayedSentences([
          getRandomItem(shortSentences),
          getRandomItem(shortSentences),
        ]);
        break;
      case "Upload a Color Picture":
        setSelectedColor(getRandomItem(hexColor));
        break;
      case "Data Entry from Receipt":
      case "Receipt Sample":
      case "Document Transcription":
      case "Ticket Analysis":
        setSelectedReceipt(getRandomItem(receipts));
        break;
      case "Product Categorization":
      case "Image Labeling":
      case "General Images":
      case "Research Images":
        setSelectedProduct(getRandomItem(products));
        break;
      case "Audio Sample":
      case "Audio Recording":
      case "Voice Recording":
      case "Audio Transcription":
        setSelectedAudio(getRandomItem(audios));
        break;
      case "Medical Image Labeling":
      case "Medical Images":
      case "Medical Equipment Categorization":
      case "Medical Transcription":
      case "High-Resolution Image Annotation":
      case "Medical Image Identification":
        setSelectedMedicalImage(getRandomItem(medicalImages));
        break;
      case "Survey: Product Preference":
        setSelectedProductIntermediate(getRandomItem(productsIntermediate));
        break;
      case "Color Identification":
      case "Object Annotation":
      case "Product Image Categorization":
      case "Research Image Annotation":
        setSelectedColorIntermediate(getRandomItem(colorsIntermediate));
        break;
      case "Sentiment Analysis of Social Media Data":
        setSelectedSentences([
          getRandomItem(
            Math.random() > 0.5 ? positiveSentences : negativeSentences
          ),
        ]);
        break;
      case "Survey Response":
        setSelectedSurveyQuestion(getRandomItem(surveyQuestions));
        break;
      default:
        break;
    }

    // Marcar como inicializado
    setHasInitializedRandom(true);
  }, [
    task,
    shortSentences,
    getRandomItem,
    hasInitializedRandom,
    positiveSentences,
    negativeSentences,
    surveyQuestions,
  ]);

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
    const currentCycleIndex = useAppStore
      .getState()
      .getCurrentCycle(); 

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
      uploadTaskFile(task.id, task.numId, url, "file");
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

      {(task.name === "Data Entry from Receipt" ||
        task.name === "Receipt Sample" ||
        task.name === "Document Transcription" ||
        task.name === "Ticket Analysis") && (
        <div className="flex items-center justify-center">
          {selectedReceipt && (
            <Image
              src={selectedReceipt}
              alt="Receipt"
              width={400}
              height={200}
              className="object-contain"
            />
          )}
        </div>
      )}
      {(task.name === "Product Categorization" ||
        task.name === "Image Labeling" ||
        task.name === "General Images" ||
        task.name === "Research Images") && (
        <div className="flex items-center justify-center">
          {selectedProduct && (
            <Image
              src={selectedProduct}
              alt="Product"
              width={400}
              height={200}
              className="object-contain"
            />
          )}
        </div>
      )}

      {task.name === "Survey: Product Preference" && (
        <div className="flex items-center justify-center">
          {selectedProductIntermediate && (
            <Image
              src={selectedProductIntermediate}
              alt="Product"
              width={400}
              height={200}
              className="object-contain"
            />
          )}
        </div>
      )}

      {(task.name === "Color Identification" ||
        task.name === "Object Annotation" ||
        task.name === "Product Image Categorization" ||
        task.name === "Research Image Annotation") && (
        <div className="flex items-center justify-center">
          {selectedColorIntermediate && (
            <Image
              src={selectedColorIntermediate}
              alt="Product"
              width={400}
              height={200}
              className="object-contain"
            />
          )}
        </div>
      )}

      {(task.name === "Medical Image Labeling" ||
        task.name === "Medical Images" ||
        task.name === "Medical Image Categorization" ||
        task.name === "Medical Equipment Categorization" ||
        task.name === "Medical Transcription" ||
        task.name === "High-Resolution Image Annotation" ||
        task.name === "Medical Image Identification") && (
        <div className="flex items-center justify-center">
          {selectedMedicalImage && (
            <Image
              src={selectedMedicalImage}
              alt="Product"
              width={400}
              height={200}
              className="object-contain"
            />
          )}
        </div>
      )}

      {task.name === "Transcription Sample" && (
        <p className="text-lg text-gray-600">
          {displayedSentences[0]}
          <br />
          {displayedSentences[1]}
        </p>
      )}

      {task.name === "Sentiment Analysis of Social Media Data" && (
        <p className="text-lg text-gray-600">{selectedSentences}</p>
      )}

      {task.name === "Survey Response" && (
        <p className="text-lg text-gray-600">{selectedSurveyQuestion}</p>
      )}

      {task.name === "Upload a Color Picture" && (
        <div className="flex items-center justify-center">
          <div
            style={{
              backgroundColor: selectedColor,
            }}
            className="w-48 h-48 rounded-full"
          ></div>
        </div>
      )}

      {(task.name === "Audio Sample" ||
        task.name === "Audio Recording" ||
        task.name === "Voice Recording" ||
        task.name === "Audio Transcription") &&
        selectedAudio !== null && (
          <div className="flex items-center justify-center">
            <audio controls>
              <track kind="captions" />
              <source src={`/audios/${selectedAudio}.mp3`} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

      {/* Subida o texto */}
      <div className="mt-4 space-y-4">
        {!success && (
          <>
            {/* Subir archivo */}
            {tasksWithUpload.includes(task.name) && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept={task.acceptedFormats
                    .map((ext) => `.${ext}`)
                    .join(",")}
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
            )}

            {/* Ingreso de texto */}
            {!tasksWithUpload.includes(task.name) && (
              <div className="space-y-2">
                <textarea
                  placeholder="Write your response here..."
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
            )}

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
                  router.back();
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
