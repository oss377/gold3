"use client";
import { useState, useContext } from "react";
import { db } from "../app/fconfig";
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { Calendar, X, Clock, ChevronDown, Plus, Trash2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeContext } from "../context/ThemeContext";

// TypeScript interface for schedule form data
interface ScheduleFormData {
  title: string;
  instructor: string;
  date: string;
  description: string;
  category: string;
  times: { [key: string]: string[] }; // e.g., { "Monday-Morning": ["9:00-10:00"], "Tuesday-Afternoon": ["14:00-15:00"] }
}

interface UploadScheduleProps {
  isOpen: boolean;
  onClose: () => void;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["Morning", "Afternoon"];
const categories = ["Aerobics", "Gym", "Karate"];

export default function UploadSchedule({ isOpen, onClose }: UploadScheduleProps) {
  const context = useContext(ThemeContext);
  const { theme } = context || { theme: 'light' }; // Fallback to light theme
  const [currentGridKey, setCurrentGridKey] = useState<string>("");
  const [currentTimeInput, setCurrentTimeInput] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
    setValue,
  } = useForm<ScheduleFormData>({
    defaultValues: {
      title: "",
      instructor: "",
      date: "",
      description: "",
      category: "",
      times: {},
    },
  });

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTimeInput(e.target.value);
  };

  const addTimeToGrid = (day: string, timeSlot: string) => {
    if (!currentTimeInput) {
      toast.error("Please enter a time range.");
      return;
    }
    // Validate time format (e.g., HH:MM-HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(currentTimeInput)) {
      toast.error("Invalid time format. Use HH:MM-HH:MM (e.g., 09:00-10:00).");
      return;
    }
    const gridKey = `${day}-${timeSlot}`;
    const currentTimes = getValues("times");
    setValue("times", {
      ...currentTimes,
      [gridKey]: [...(currentTimes[gridKey] || []), currentTimeInput],
    });
    setCurrentTimeInput("");
    setCurrentGridKey("");
  };

  const removeTimeFromGrid = (day: string, timeSlot: string, index: number) => {
    const gridKey = `${day}-${timeSlot}`;
    const currentTimes = getValues("times");
    setValue("times", {
      ...currentTimes,
      [gridKey]: currentTimes[gridKey].filter((_, i) => i !== index),
    });
  };

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      // Prepare the dates array from the times object
      const dates = Object.entries(data.times).flatMap(([gridKey, times]) =>
        times.map((time) => {
          const [day, timeSlot] = gridKey.split("-");
          return { day, timeSlot, time };
        })
      );

      // Query for existing document with the same category
      const schedulesCollection = collection(db, "schedules");
      const q = query(schedulesCollection, where("category", "==", data.category));
      const querySnapshot = await getDocs(q);

      // Prepare the document data
      const docData = {
        title: data.title,
        instructor: data.instructor,
        date: data.date,
        description: data.description,
        category: data.category,
        dates: dates.length > 0 ? dates : [], // Save empty array if no times are provided
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!querySnapshot.empty) {
        // Update existing document (overwrite)
        const existingDoc = querySnapshot.docs[0];
        await setDoc(existingDoc.ref, docData);
      } else {
        // Create new document
        await setDoc(doc(schedulesCollection), docData);
      }

      toast.success("Schedule uploaded successfully!");
      reset();
      setCurrentTimeInput("");
      setCurrentGridKey("");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to upload schedule.";
      toast.error(errorMessage);
      console.error("Error uploading schedule:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-black/60'} flex items-center justify-center z-50 transition-opacity duration-300`}>
        <div
          className={`max-w-4xl w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl p-8 border relative transition-all duration-300 max-h-[90vh] overflow-y-auto animate-fade-in`}
        >
          <button
            onClick={() => {
              onClose();
              reset();
              setCurrentTimeInput("");
              setCurrentGridKey("");
            }}
            className={`absolute top-4 right-4 ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'} transition-colors duration-200`}
            aria-label="Close modal"
          >
            <X size={28} />
          </button>
          <div className={`flex items-center space-x-3 mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Calendar size={28} className={theme === 'dark' ? 'text-yellow-400' : 'text-blue-600'} />
            <h2 className="text-3xl font-bold">Create Schedule</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`} htmlFor="title">
                  Class Title *
                </label>
                <input
                  type="text"
                  id="title"
                  {...register("title", { required: "Class title is required" })}
                  className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200 ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="e.g., Power Yoga Session"
                  aria-label="Class Title"
                  aria-describedby={errors.title ? "title-error" : undefined}
                />
                {errors.title && (
                  <p id="title-error" className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`} htmlFor="instructor">
                  Instructor *
                </label>
                <input
                  type="text"
                  id="instructor"
                  {...register("instructor", { required: "Instructor is required" })}
                  className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200 ${errors.instructor ? 'border-red-500' : ''}`}
                  placeholder="e.g., Sarah Johnson"
                  aria-label="Instructor"
                  aria-describedby={errors.instructor ? "instructor-error" : undefined}
                />
                {errors.instructor && (
                  <p id="instructor-error" className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                    {errors.instructor.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`} htmlFor="category">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  {...register("category", { required: "Category is required" })}
                  className={`w-full p-3 rounded-lg border appearance-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200 ${errors.category ? 'border-red-500' : ''}`}
                  aria-label="Category"
                  aria-describedby={errors.category ? "category-error" : undefined}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                  size={20}
                />
                {errors.category && (
                  <p id="category-error" className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Weekly Schedule (Optional)</label>
              <div className="grid grid-cols-8 gap-2 text-sm">
                <div></div>
                {daysOfWeek.map((day) => (
                  <div key={day} className={`text-center font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {day.slice(0, 3)}
                  </div>
                ))}
                {timeSlots.map((slot) => (
                  <div key={slot} className="contents">
                    <div className={`p-2 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {slot}
                    </div>
                    {daysOfWeek.map((day) => {
                      const gridKey = `${day}-${slot}`;
                      const times = getValues("times")[gridKey] || [];
                      return (
                        <div
                          key={gridKey}
                          className={`p-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'} min-h-[80px]`}
                        >
                          {times.map((time, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-1 mb-1 rounded ${theme === 'dark' ? 'bg-yellow-600 text-white' : 'bg-blue-100 text-blue-800'}`}
                            >
                              <span className="text-xs">{time}</span>
                              <button
                                type="button"
                                onClick={() => removeTimeFromGrid(day, slot, index)}
                                className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-red-500' : 'hover:bg-red-600'} text-white`}
                                aria-label={`Remove time ${time} from ${day} ${slot}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {currentGridKey === gridKey && (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="text"
                                value={currentTimeInput}
                                onChange={handleTimeInputChange}
                                className={`w-full p-1 text-xs rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200`}
                                placeholder="e.g., 09:00-10:00"
                                aria-label={`Time input for ${day} ${slot}`}
                              />
                              <button
                                type="button"
                                onClick={() => addTimeToGrid(day, slot)}
                                className={`p-1 rounded ${theme === 'dark' ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                aria-label={`Add time to ${day} ${slot}`}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                          {currentGridKey !== gridKey && (
                            <button
                              type="button"
                              onClick={() => setCurrentGridKey(gridKey)}
                              className={`w-full p-1 text-xs rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                              aria-label={`Add time to ${day} ${slot}`}
                            >
                              Add Time
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`} htmlFor="date">
                Specific Date (Optional)
              </label>
              <input
                type="date"
                id="date"
                {...register("date")}
                className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200`}
                aria-label="Specific Date"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`} htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                className={`w-full p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} transition-all duration-200`}
                placeholder="Optional description of the class"
                rows={4}
                aria-label="Description"
              />
            </div>
            {errors.title || errors.instructor || errors.category ? (
              <p className={`text-sm ${theme === 'dark' ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-500'} p-3 rounded-md`}>
                Please fix errors in the required fields.
              </p>
            ) : null}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  reset();
                  setCurrentTimeInput("");
                  setCurrentGridKey("");
                }}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Cancel schedule creation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Upload schedule"
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
                    <Clock size={20} />
                    Upload Schedule
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