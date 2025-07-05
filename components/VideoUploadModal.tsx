"use client";
import { useState, useCallback, useContext } from "react";
import { useForm } from "react-hook-form";
import { X, Upload, AlertCircle } from "lucide-react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "../app/fconfig";
import { ThemeContext } from "../context/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Initialize Firestore
const db = getFirestore(app);

// Cloudinary configuration (use environment variables for security)
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'gold';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnqsoezfo';
const CLOUDINARY_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'gymVideo';

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
}

export default function VideoUploadModal({ isOpen, onClose }: VideoUploadModalProps) {
  const context = useContext(ThemeContext);
  const { theme } = context || { theme: 'light' }; // Fallback to light theme
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "uploading";
    message: string;
    progress?: number;
    fileName?: string;
  } | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<{ url: string; fileName: string }[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VideoFormData>({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      files: undefined,
    },
  });

  const onSubmit = useCallback(
    async (data: VideoFormData) => {
      const files = Array.from(data.files);
      // Limit to 5 files
      if (files.length > 5) {
        setUploadStatus({
          type: "error",
          message: "You can upload a maximum of 5 videos at a time.",
        });
        toast.error("You can upload a maximum of 5 videos at a time.");
        return;
      }

      setUploadStatus({ type: "uploading", message: "Starting video upload...", progress: 0 });
      const newUploadedVideos: { url: string; fileName: string }[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadStatus({
            type: "uploading",
            message: `Uploading ${file.name} (${i + 1} of ${files.length})`,
            progress: (i / files.length) * 100,
            fileName: file.name,
          });

          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          formData.append("folder", CLOUDINARY_FOLDER);
          formData.append("resource_type", "video");

          const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            setUploadStatus({
              type: "error",
              message: `Failed to upload ${file.name}: ${result.error?.message || "Upload failed"}`,
              fileName: file.name,
            });
            toast.error(`Failed to upload ${file.name}: ${result.error?.message || "Upload failed"}`);
            continue; // Continue with the next file
          }

          await addDoc(collection(db, "videos"), {
            title: data.title,
            description: data.description,
            category: data.category,
            videoUrl: result.secure_url,
            fileName: file.name,
            uploadedAt: new Date(),
          });

          newUploadedVideos.push({ url: result.secure_url, fileName: file.name });
          setUploadedVideos((prev) => [...prev, { url: result.secure_url, fileName: file.name }]);
          setUploadStatus({
            type: "uploading",
            message: `Uploaded ${file.name} (${i + 1} of ${files.length})`,
            progress: ((i + 1) / files.length) * 100,
            fileName: file.name,
          });
        }

        if (newUploadedVideos.length === files.length) {
          setUploadStatus({ type: "success", message: "All videos uploaded successfully!" });
          toast.success("All videos uploaded successfully!");
        } else {
          setUploadStatus({
            type: "success",
            message: `${newUploadedVideos.length} of ${files.length} videos uploaded successfully.`,
          });
          toast.success(`${newUploadedVideos.length} of ${files.length} videos uploaded successfully.`);
        }

        setTimeout(() => {
          onClose();
          reset();
          setUploadStatus(null);
          setUploadedVideos([]);
        }, 2000);
      } catch (error: any) {
        const errorMessage = `Upload error: ${error.message || "Failed to upload videos"}`;
        setUploadStatus({
          type: "error",
          message: errorMessage,
        });
        toast.error(errorMessage);
      }
    },
    [onClose, reset]
  );

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-black/60'} flex items-center justify-center z-50 transition-opacity duration-300`}>
        <div
          className={`max-w-lg w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} rounded-2xl p-8 shadow-2xl border relative transform transition-all duration-300 scale-100`}
        >
          <button
            onClick={() => {
              onClose();
              reset();
              setUploadStatus(null);
              setUploadedVideos([]);
            }}
            className={`absolute top-4 right-4 ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'} transition-colors duration-200`}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Upload size={24} /> Upload Workout Videos
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Video Title</label>
              <input
                type="text"
                {...register("title", {
                  required: "Title is required",
                  maxLength: { value: 100, message: "Title must be under 100 characters" },
                })}
                className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200 ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter video title"
                aria-label="Video Title"
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className={`text-sm mt-1 flex items-center gap-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                  <AlertCircle size={16} /> {errors.title.message}
                </p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Description</label>
              <textarea
                {...register("description", { required: "Description is required" })}
                rows={4}
                className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200 ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe your workout video"
                aria-label="Description"
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              {errors.description && (
                <p id="description-error" className={`text-sm mt-1 flex items-center gap-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                  <AlertCircle size={16} /> {errors.description.message}
                </p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Category</label>
              <select
                {...register("category", { required: "Category is required" })}
                className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200 ${errors.category ? 'border-red-500' : ''}`}
                aria-label="Category"
                aria-describedby={errors.category ? "category-error" : undefined}
              >
                <option value="">Select a category</option>
                <option value="Karate">Karate</option>
                <option value="Gym">Gym</option>
                <option value="Aerobics">Aerobics</option>
              </select>
              {errors.category && (
                <p id="category-error" className={`text-sm mt-1 flex items-center gap-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                  <AlertCircle size={16} /> {errors.category.message}
                </p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Video Files (Up to 5)</label>
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
                    maxFiles: (value) =>
                      value.length <= 5 || "You can upload a maximum of 5 videos at a time",
                  },
                })}
                accept="video/mp4,video/mov,video/webm"
                className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 file:bg-gray-600 file:text-yellow-400 hover:file:bg-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200 ${errors.files ? 'border-red-500' : ''}`}
                aria-label="Video Files"
                aria-describedby={errors.files ? "files-error" : undefined}
              />
              {errors.files && (
                <p id="files-error" className={`text-sm mt-1 flex items-center gap-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                  <AlertCircle size={16} /> {errors.files.message}
                </p>
              )}
            </div>
            {uploadStatus && (
              <div className="space-y-2">
                <p
                  className={`text-sm flex items-center gap-2 ${uploadStatus.type === "success" ? (theme === 'dark' ? 'text-green-400' : 'text-green-500') : uploadStatus.type === "error" ? (theme === 'dark' ? 'text-red-400' : 'text-red-500') : (theme === 'dark' ? 'text-yellow-400' : 'text-blue-500')}`}
                >
                  <AlertCircle size={16} /> {uploadStatus.message}
                </p>
                {uploadStatus.type === "uploading" && (
                  <div className={`w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5`}>
                    <div
                      className={`${theme === 'dark' ? 'bg-yellow-400' : 'bg-blue-600'} h-2.5 rounded-full transition-all duration-300`}
                      style={{ width: `${uploadStatus.progress || 0}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            {uploadedVideos.length > 0 && (
              <div className="space-y-2">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Uploaded Videos:</p>
                <ul className={`list-disc pl-5 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {uploadedVideos.map((video, index) => (
                    <li key={index}>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${theme === 'dark' ? 'text-yellow-400 hover:underline' : 'text-blue-500 hover:underline'}`}
                      >
                        {video.fileName}
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Cancel upload"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Upload videos"
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
          <ToastContainer position="top-right" autoClose={3000} theme={theme} />
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}