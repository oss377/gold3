"use client";
import { useState } from "react";
import { db } from "../app/fconfig"; // Adjust the import path based on your Firebase config
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { Calendar, X, Clock, ChevronDown, Plus, Trash2 } from "lucide-react";

interface UploadScheduleProps {
  isOpen: boolean;
  onClose: () => void;
  isHighContrast: boolean;
}

interface Schedule {
  title: string;
  instructor: string;
  date: string;
  description: string;
  category: string;
  times: { [key: string]: string[] }; // e.g., { "Monday-Morning": ["9:00-10:00"], "Tuesday-Afternoon": ["14:00-15:00"] }
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["Morning", "Afternoon"];
const categories = ["Aerobics", "Gym", "Karate"];

export default function UploadSchedule({ isOpen, onClose, isHighContrast }: UploadScheduleProps) {
  const [schedule, setSchedule] = useState<Schedule>({
    title: "",
    instructor: "",
    date: "",
    description: "",
    category: "",
    times: {},
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [currentGridKey, setCurrentGridKey] = useState<string>("");
  const [currentTimeInput, setCurrentTimeInput] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSchedule((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTimeInput(e.target.value);
  };

  const addTimeToGrid = (day: string, timeSlot: string) => {
    if (!currentTimeInput) return;
    const gridKey = `${day}-${timeSlot}`;
    setSchedule((prev) => ({
      ...prev,
      times: {
        ...prev.times,
        [gridKey]: [...(prev.times[gridKey] || []), currentTimeInput],
      },
    }));
    setCurrentTimeInput("");
    setCurrentGridKey("");
  };

  const removeTimeFromGrid = (day: string, timeSlot: string, index: number) => {
    const gridKey = `${day}-${timeSlot}`;
    setSchedule((prev) => ({
      ...prev,
      times: {
        ...prev.times,
        [gridKey]: prev.times[gridKey].filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation: Only title, instructor, and category are required
    if (!schedule.title || !schedule.instructor || !schedule.category) {
      setError("Please fill in all required fields (Title, Instructor, Category).");
      return;
    }

    try {
      // Prepare the dates array from the times object
      const dates = Object.entries(schedule.times).flatMap(([gridKey, times]) =>
        times.map((time) => {
          const [day, timeSlot] = gridKey.split("-");
          return { day, timeSlot, time };
        })
      );

      // Query for existing document with the same category
      const schedulesCollection = collection(db, "schedules");
      const q = query(schedulesCollection, where("category", "==", schedule.category));
      const querySnapshot = await getDocs(q);

      // Prepare the document data
      const docData = {
        title: schedule.title,
        instructor: schedule.instructor,
        date: schedule.date,
        description: schedule.description,
        category: schedule.category,
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

      setSuccess("Schedule uploaded successfully!");
      setSchedule({ title: "", instructor: "", date: "", description: "", category: "", times: {} });
      setCurrentTimeInput("");
      setCurrentGridKey("");
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to upload schedule. Please try again.");
      console.error("Error uploading schedule:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        className={`${
          isHighContrast ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        } rounded-2xl shadow-2xl p-8 w-full max-w-4xl relative transition-all duration-300 max-h-[90vh] overflow-y-auto`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${
            isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-800"
          } transition-colors`}
        >
          <X size={28} />
        </button>
        <div className="flex items-center space-x-3 mb-6">
          <Calendar size={28} className={isHighContrast ? "text-indigo-300" : "text-indigo-600"} />
          <h2 className="text-3xl font-bold">Create Schedule</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="title">
                Class Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={schedule.title}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-lg border ${
                  isHighContrast
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                placeholder="e.g., Power Yoga Session"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="instructor">
                Instructor *
              </label>
              <input
                type="text"
                id="instructor"
                name="instructor"
                value={schedule.instructor}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-lg border ${
                  isHighContrast
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                placeholder="e.g., Sarah Johnson"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="category">
              Category *
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={schedule.category}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-lg border appearance-none ${
                  isHighContrast
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
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
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isHighContrast ? "text-gray-300" : "text-gray-600"
                }`}
                size={20}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Weekly Schedule (Optional)</label>
            <div className="grid grid-cols-8 gap-2 text-sm">
              <div></div>
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center font-medium">
                  {day.slice(0, 3)}
                </div>
              ))}
              {timeSlots.map((slot) => (
                <div key={slot} className="contents">
                  <div className={`p-2 ${isHighContrast ? "text-gray-300" : "text-gray-600"} font-medium`}>
                    {slot}
                  </div>
                  {daysOfWeek.map((day) => {
                    const gridKey = `${day}-${slot}`;
                    return (
                      <div
                        key={gridKey}
                        className={`p-2 border rounded-lg ${
                          isHighContrast
                            ? "bg-gray-800 border-gray-600 hover:bg-gray-700"
                            : "bg-gray-50 border-gray-300 hover:bg-gray-100"
                        } min-h-[80px]`}
                      >
                        {(schedule.times[gridKey] || []).map((time, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-1 mb-1 rounded ${
                              isHighContrast ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-800"
                            }`}
                          >
                            <span className="text-xs">{time}</span>
                            <button
                              type="button"
                              onClick={() => removeTimeFromGrid(day, slot, index)}
                              className="p-1 hover:bg-red-500 rounded"
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
                              className={`w-full p-1 text-xs rounded border ${
                                isHighContrast
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                              placeholder="e.g., 9:00-10:00"
                            />
                            <button
                              type="button"
                              onClick={() => addTimeToGrid(day, slot)}
                              className={`p-1 rounded ${
                                isHighContrast ? "bg-indigo-600 hover:bg-indigo-500" : "bg-indigo-600 hover:bg-indigo-700"
                              } text-white`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                        {currentGridKey !== gridKey && (
                          <button
                            type="button"
                            onClick={() => setCurrentGridKey(gridKey)}
                            className={`w-full p-1 text-xs rounded ${
                              isHighContrast ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                            }`}
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
            <label className="block text-sm font-medium mb-2" htmlFor="date">
              Specific Date (Optional)
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={schedule.date}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-lg border ${
                isHighContrast
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={schedule.description}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-lg border ${
                isHighContrast
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
              placeholder="Optional description of the class"
              rows={4}
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          {success && <p className="text-green-500 text-sm font-medium">{success}</p>}
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isHighContrast
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            <Clock size={20} />
            Upload Schedule
          </button>
        </form>
      </div>
    </div>
  );
}