"use client";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { X, Upload, AlertCircle } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  // Your Firebase configuration object here
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// TypeScript interface for video form data
interface VideoFormData {
  title: string;
  description: string;
  category: string;
  files: FileList;
}

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHighContrast: boolean;
}

export default function VideoUploadModal({ isOpen, onClose, isHighContrast }: VideoUploadModalProps) {
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "uploading";
    message: string;
    progress?: number;
  } | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VideoFormData>();

  // Handle video upload to Cloudinary and save URL to Firebase
  const onSubmit = useCallback(
    async (data: VideoFormData) => {
      setUploadStatus({ type: "uploading", message: "Uploading videos...", progress: 0 });
      const files = Array.from(data.files);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "gold1"); // Replace with your Cloudinary preset
          formData.append("resource_type", "video");

          // Upload to Cloudinary
          const response = await fetch("https://api.cloudinary.com/v1_1/dnqsoezfo/video/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error?.message || "Upload failed");
          }

          // Save video URL to Firebase
          await addDoc(collection(db, "videos"), {
            title: data.title,
            description: data.description,
            category: data.category,
            videoUrl: result.secure_url,
            uploadedAt: new Date(),
          });

          setUploadedVideos((prev) => [...prev, result.secure_url]);
          setUploadStatus({
            type: "uploading",
            message: `Uploading video ${i + 1} of ${files.length}`,
            progress: ((i + 1) / files.length) * 100,
          });
        }

        setUploadStatus({ type: "success", message: "All videos uploaded successfully!" });
        setTimeout(() => {
          onClose();
          reset();
          setUploadStatus(null);
          setUploadedVideos([]);
        }, 2000);
      } catch (error: any) {
        setUploadStatus({ type: "error", message: error.message || "Failed to upload videos" });
      }
    },
    [onClose, reset]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-300">
      <div
        className={`${
          isHighContrast ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        } rounded-2xl p-8 w-full max-w-lg shadow-2xl relative transform transition-all duration-300 scale-100`}
      >
        <button
          onClick={() => {
            onClose();
            reset();
            setUploadStatus(null);
            setUploadedVideos([]);
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Upload size={24} /> Upload Workout Videos
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Video Title</label>
            <input
              type="text"
              {...register("title", {
                required: "Title is required",
                maxLength: { value: 100, message: "Title must be under 100 characters" },
              })}
              className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
                isHighContrast
                  ? "bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-indigo-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500"
              } ${errors.title ? "border-red-500" : ""}`}
              placeholder="Enter video title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register("description", { required: "Description is required" })}
              rows={4}
              className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
                isHighContrast
                  ? "bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-indigo-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500"
              } ${errors.description ? "border-red-500" : ""}`}
              placeholder="Describe your workout video"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {errors.description.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              {...register("category", { required: "Category is required" })}
              className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
                isHighContrast
                  ? "bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-indigo-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500"
              } ${errors.category ? "border-red-500" : ""}`}
            >
              <option value="">Select a category</option>
              <option value="Karate">Karate</option>
              <option value="Gym">Gym</option>
              <option value="Aerobics">Aerobics</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {errors.category.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Video Files (Multiple)</label>
            <input
              type="file"
              multiple
              {...register("files", {
                required: "At least one video file is required",
                validate: {
                  acceptedFormats: (value) =>
                    Array.from(value).every((file) =>
                      ["video/mp4", "video/mov", "video/webm"].includes(file.type)
                    ) || "Only MP4, MOV, or WEBM formats are allowed",
                  sizeLimit: (value) =>
                    Array.from(value).every((file) => file.size <= 1000000000) ||
                    "Each file must be under 1GB",
                },
              })}
              accept="video/mp4,video/mov,video/webm"
              className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
                isHighContrast
                  ? "bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-indigo-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500"
              } ${errors.files ? "border-red-500" : ""}`}
            />
            {errors.files && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} /> {errors.files.message}
              </p>
            )}
          </div>
          {uploadStatus && (
            <div className="space-y-2">
              <p
                className={`text-sm flex items-center gap-2 ${
                  uploadStatus.type === "success"
                    ? "text-green-500"
                    : uploadStatus.type === "error"
                    ? "text-red-500"
                    : "text-indigo-500"
                }`}
              >
                <AlertCircle size={16} /> {uploadStatus.message}
              </p>
              {uploadStatus.type === "uploading" && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadStatus.progress || 0}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {uploadedVideos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded Videos:</p>
              <ul className="list-disc pl-5 text-sm">
                {uploadedVideos.map((url, index) => (
                  <li key={index}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                      Video {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                reset();
                setUploadStatus(null);
                setUploadedVideos([]);
              }}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isHighContrast
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                isHighContrast
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} /> Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}