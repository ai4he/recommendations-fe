import { StaticImageData } from "next/image";
import { Task as TaskType } from "@/hooks/useAppStore";

export type Task = TaskType & {
  cycle?: 'beginner' | 'intermediate' | 'advanced';
};

export type TaskImage = StaticImageData | string | null;

export interface TaskState {
  // UI State
  uploading: boolean;
  success: boolean;
  feedback: {
    comment: string;
    rating: number;
  };
  filePreviewUrl: string | null;
  
  // Random elements state
  displayedSentences: string[];
  selectedColor: string;
  selectedReceipt: TaskImage;
  selectedProduct: TaskImage;
  selectedMedicalImage: TaskImage;
  selectedProductIntermediate: TaskImage;
  selectedColorIntermediate: string;
  selectedAudio: number | null;
  hasInitializedRandom: boolean;
}

export interface TaskHandlers {
  transcription: () => void;
  image_labeling: () => void;
  selection: () => void;
  [key: string]: () => void;
}

export interface TaskResources {
  shortSentences: string[];
  colors: string[];
  products: StaticImageData[];
  medicalImages: StaticImageData[];
  productsIntermediate: StaticImageData[];
  receipts: StaticImageData[];
  audios: number[];
}

export type TaskTypeKey = 'transcription' | 'image_labeling' | 'selection';
