'use client';

import { useState, useCallback } from 'react';
import { db } from '../app/fconfig';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { Calendar, X, Clock, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// TypeScript interface for translation, aligned with LanguageContext
interface Translation {
  instructorPlaceholder?: string;
  timePlaceholder?: string;
  addTime?: string;
  descriptionPlaceholder?: string;
  fixErrors?: string;
  titlePlaceholder?: string;
  uploadSchedule?: string;
  title?: string;
  titleRequired?: string;
  instructor?: string;
  instructorRequired?: string;
  date?: string;
  description?: string;
  category?: string;
  categoryRequired?: string;
  selectCategory?: string;
  weeklySchedule?: string;
  timeInvalid?: string;
  timeRequired?: string;
  upload?: string;
  uploading?: string;
  cancel?: string;
  close?: string;
  success?: string;
  error?: string;
}

// TypeScript interface for schedule form data
interface ScheduleFormData {
  title: string;
  instructor: string;
  date: string;
  description: string;
  category: string;
  times: { [key: string]: string[] }; // e.g., { "Monday-Morning": ["9:00-10:00"], "Tuesday-Afternoon": ["14:00-15:00"] }
}

// Interface for UploadSchedule props
interface UploadScheduleProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  t: Translation;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = ['Morning', 'Afternoon'];
const categories = ['Aerobics', 'Gym', 'Karate'];

export default function UploadSchedule({ isOpen, onClose, theme, t }: UploadScheduleProps) {
  const [currentGridKey, setCurrentGridKey] = useState<string>('');
  const [currentTimeInput, setCurrentTimeInput] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    getValues,
    setValue,
    trigger,
  } = useForm<ScheduleFormData>({
    defaultValues: {
      title: '',
      instructor: '',
      date: '',
      description: '',
      category: '',
      times: {},
    },
  });

  const handleTimeInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTimeInput(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  const addTimeToGrid = useCallback(
    (day: string, timeSlot: string) => {
      if (!currentTimeInput) {
        toast.error(t.timeRequired || 'Time is required');
        return;
      }
      // Validate time format (e.g., HH:MM-HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(currentTimeInput)) {
        toast.error(t.timeInvalid || 'Invalid time format');
        return;
      }
      const gridKey = `${day}-${timeSlot}`;
      const currentTimes = getValues('times');
      setValue('times', {
        ...currentTimes,
        [gridKey]: [...(currentTimes[gridKey] || []), currentTimeInput],
      });
      setCurrentTimeInput('');
      setCurrentGridKey('');
      setHasUnsavedChanges(true);
    },
    [currentTimeInput, getValues, setValue, t]
  );

  const removeTimeFromGrid = useCallback(
    (day: string, timeSlot: string, index: number) => {
      const gridKey = `${day}-${timeSlot}`;
      const currentTimes = getValues('times');
      setValue('times', {
        ...currentTimes,
        [gridKey]: currentTimes[gridKey].filter((_, i) => i !== index),
      });
      setHasUnsavedChanges(true);
    },
    [getValues, setValue]
  );

  const validateTimes = useCallback(
    (times: { [key: string]: string[] }) => {
      return Object.keys(times).length > 0 || !!getValues('date');
    },
    [getValues]
  );

  const onSubmit = useCallback(
    async (data: ScheduleFormData) => {
      if (!validateTimes(data.times) && !data.date) {
        toast.error(t.fixErrors || 'Please fix the errors');
        return;
      }
      try {
        // Prepare the dates array from the times object
        const dates = Object.entries(data.times).flatMap(([gridKey, times]) =>
          times.map((time) => {
            const [day, timeSlot] = gridKey.split('-');
            return { day, timeSlot, time };
          })
        );

        // Query for existing document with the same category
        const schedulesCollection = collection(db, 'schedules');
        const q = query(schedulesCollection, where('category', '==', data.category));
        const querySnapshot = await getDocs(q);

        // Prepare the document data
        const docData = {
          title: data.title,
          instructor: data.instructor,
          date: data.date || '',
          description: data.description || '',
          category: data.category,
          dates: dates.length > 0 ? dates : [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (!querySnapshot.empty) {
          // Update existing document
          const existingDoc = querySnapshot.docs[0];
          await setDoc(existingDoc.ref, docData);
        } else {
          // Create new document with addDoc
          await addDoc(schedulesCollection, docData);
        }

        // Add notification to Firestore
        await addDoc(collection(db, 'notifications'), {
          text: (t.success || 'Schedule {title} uploaded successfully').replace('{title}', data.title),
          timestamp: new Date(),
        });

        toast.success(t.success || 'Schedule uploaded successfully');
        reset();
        setCurrentTimeInput('');
        setCurrentGridKey('');
        setHasUnsavedChanges(false);
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (err: any) {
        toast.error(t.error || 'Error uploading schedule');
        console.error('Error uploading schedule:', err);
      }
    },
    [onClose, reset, t]
  );

  const handleClose = () => {
    if (hasUnsavedChanges || isDirty) {
      if (confirm(t.close || 'You have unsaved changes. Are you sure you want to close?')) {
        reset();
        setCurrentTimeInput('');
        setCurrentGridKey('');
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      reset();
      setCurrentTimeInput('');
      setCurrentGridKey('');
      setHasUnsavedChanges(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300`}
        onClick={handleClose}
      >
        <div
          className={`max-w-4xl w-full rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto transition-all duration-500 ${
            theme === 'light'
              ? 'bg-gradient-to-br from-white to-blue-50 text-blue-900 border border-blue-100'
              : 'bg-gradient-to-br from-blue-900 to-teal-900 text-white border border-teal-800'
          } animate-fade-in`}
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: theme === 'light'
              ? '0 15px 40px rgba(59, 130, 246, 0.4)'
              : '0 15px 40px rgba(45, 212, 191, 0.4)',
          }}
        >
          <button
            onClick={handleClose}
            className={`absolute top-4 right-4 ${
              theme === 'light' ? 'text-teal-600 hover:text-teal-800' : 'text-teal-300 hover:text-teal-200'
            } transition-colors duration-200`}
            aria-label={t.close || 'Close'}
          >
            <X size={28} />
          </button>
          <div className="flex items-center space-x-3 mb-6">
            <Calendar
              size={28}
              className={theme === 'light' ? 'text-teal-600' : 'text-teal-300'}
            />
            <h2 className="text-3xl font-bold">{t.uploadSchedule || 'Upload Schedule'}</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-blue-900' : 'text-white'
                  } mb-2`}
                  htmlFor="title"
                >
                  {t.title || 'Title'} *
                </label>
                <input
                  type="text"
                  id="title"
                  {...register('title', { required: t.titleRequired || 'Title is required' })}
                  className={`w-full p-3 rounded-lg border ${
                    theme === 'light'
                      ? 'bg-white border-blue-200 text-blue-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                      : 'bg-blue-800 border-teal-800 text-white focus:ring-2 focus:ring-teal-300 focus:border-teal-300'
                  } transition-all duration-200 ${errors.title ? 'border-red-500' : ''}`}
                  placeholder={t.titlePlaceholder || 'Enter schedule title'}
                  aria-label={t.title || 'Title'}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                  onChange={() => setHasUnsavedChanges(true)}
                />
                {errors.title && (
                  <p
                    id="title-error"
                    className={`text-sm mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}
                  >
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-blue-900' : 'text-white'
                  } mb-2`}
                  htmlFor="instructor"
                >
                  {t.instructor || 'Instructor'} *
                </label>
                <input
                  type="text"
                  id="instructor"
                  {...register('instructor', { required: t.instructorRequired || 'Instructor is required' })}
                  className={`w-full p-3 rounded-lg border ${
                    theme === 'light'
                      ? 'bg-white border-blue-200 text-blue-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                      : 'bg-blue-800 border-teal-800 text-white focus:ring-2 focus:ring-teal-300 focus:border-teal-300'
                  } transition-all duration-200 ${errors.instructor ? 'border-red-500' : ''}`}
                  placeholder={t.instructorPlaceholder || 'Enter instructor name'}
                  aria-label={t.instructor || 'Instructor'}
                  aria-describedby={errors.instructor ? 'instructor-error' : undefined}
                  onChange={() => setHasUnsavedChanges(true)}
                />
                {errors.instructor && (
                  <p
                    id="instructor-error"
                    className={`text-sm mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}
                  >
                    {errors.instructor.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-blue-900' : 'text-white'
                } mb-2`}
                htmlFor="category"
              >
                {t.category || 'Category'} *
              </label>
              <div className="relative">
                <select
                  id="category"
                  {...register('category', { required: t.categoryRequired || 'Category is required' })}
                  className={`w-full p-3 rounded-lg border appearance-none ${
                    theme === 'light'
                      ? 'bg-white border-blue-200 text-blue-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                      : 'bg-blue-800 border-teal-800 text-white focus:ring-2 focus:ring-teal-300 focus:border-teal-300'
                  } transition-all duration-200 ${errors.category ? 'border-red-500' : ''}`}
                  aria-label={t.category || 'Category'}
                  aria-describedby={errors.category ? 'category-error' : undefined}
                  onChange={() => setHasUnsavedChanges(true)}
                >
                  <option value="" disabled>
                    {t.selectCategory || 'Select a category'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    theme === 'light' ? 'text-teal-600' : 'text-teal-300'
                  }`}
                  size={20}
                />
                {errors.category && (
                  <p
                    id="category-error"
                    className={`text-sm mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}
                  >
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-blue-900' : 'text-white'
                } mb-2`}
              >
                {t.weeklySchedule || 'Weekly Schedule'}
              </label>
              <div className="grid grid-cols-8 gap-2 text-sm">
                <div></div>
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className={`text-center font-medium ${
                      theme === 'light' ? 'text-blue-900' : 'text-white'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </div>
                ))}
                {timeSlots.map((slot) => (
                  <div key={slot} className="contents">
                    <div
                      className={`p-2 font-medium ${
                        theme === 'light' ? 'text-blue-900' : 'text-white'
                      }`}
                    >
                      {slot}
                    </div>
                    {daysOfWeek.map((day) => {
                      const gridKey = `${day}-${slot}`;
                      const times = getValues('times')[gridKey] || [];
                      return (
                        <div
                          key={gridKey}
                          className={`p-2 border rounded-lg ${
                            theme === 'light'
                              ? 'bg-white border-blue-200 hover:bg-blue-50'
                              : 'bg-blue-800 border-teal-800 hover:bg-teal-900'
                          } min-h-[80px]`}
                        >
                          {times.map((time, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-1 mb-1 rounded ${
                                theme === 'light'
                                  ? 'bg-teal-100 text-blue-900'
                                  : 'bg-teal-700 text-white'
                              }`}
                            >
                              <span className="text-xs">{time}</span>
                              <button
                                type="button"
                                onClick={() => removeTimeFromGrid(day, slot, index)}
                                className={`p-1 rounded ${
                                  theme === 'light'
                                    ? 'hover:bg-red-500'
                                    : 'hover:bg-red-600'
                                } text-white`}
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
                                className={`w-full p-1 text-xs rounded border ${
                                  theme === 'light'
                                    ? 'bg-white border-blue-200 text-blue-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                                    : 'bg-blue-800 border-teal-800 text-white focus:ring-2 focus:ring-teal-300 focus:border-teal-300'
                                } transition-all duration-200`}
                                placeholder={t.timePlaceholder || 'HH:MM-HH:MM'}
                                aria-label={`Time input for ${day} ${slot}`}
                              />
                              <button
                                type="button"
                                onClick={() => addTimeToGrid(day, slot)}
                                className={`p-1 rounded ${
                                  theme === 'light'
                                    ? 'bgteal-600 hover:bg-teal-700 text-white'
                                    : 'bg-teal-700 hover:bg-teal-600 text-white'
                                }`}
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
                              className={`w-full p-1 text-xs rounded ${
                                theme === 'light'
                                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-900'
                                  : 'bg-teal-800 hover:bg-teal-700 text-white'
                              }`}
                              aria-label={`Add time to ${day} ${slot}`}
                            >
                              {t.addTime || 'Add Time'}
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
              <label
                className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-blue-900' : 'text-white'
                } mb-2`}
                htmlFor="date"
              >
                {t.date || 'Date'}
              </label>
              <input
                type="date"
                id="date"
                {...register('date')}
                className={`w-full p-3 rounded-lg border ${
                  theme === 'light'
                    ? 'bg-white border-blue-200 text-blue-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                    : 'bg-blue-800 border-teal-800 text-white focus:ring-2 focus:ring-teal-300 focus:border-teal-300'
                } transition-all duration-200`}
                aria-label={t.date || 'Date'}
                onChange={() => setHasUnsavedChanges(true)}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-blue-900' : 'text-white'
                } mb-2`}
                htmlFor="description"
              >
                {t.description || 'Description'}
              </label>
              <textarea
                id="description"
                {...register('description')}
                className={`w-full p-3 rounded-lg border ${
                  theme === 'light'
                    ? 'bg-white border-blue-200 text-blue-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                    : 'bg-blue-800 border-teal-800 text-white focus:ring-2 focus:ring-teal-300 focus:border-teal-300'
                } transition-all duration-200`}
                placeholder={t.descriptionPlaceholder || 'Enter description'}
                rows={4}
                aria-label={t.description || 'Description'}
                onChange={() => setHasUnsavedChanges(true)}
              />
            </div>
            {errors.title || errors.instructor || errors.category ? (
              <p
                className={`text-sm ${
                  theme === 'light' ? 'bg-red-50 text-red-500' : 'bg-red-900/50 text-red-400'
                } p-3 rounded-lg`}
              >
                {t.fixErrors || 'Please fix the errors in the form'}
              </p>
            ) : null}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  theme === 'light'
                    ? 'bg-blue-100 text-blue-900 hover:bg-blue-200 focus:ring-2 focus:ring-teal-500'
                    : 'bg-teal-800 text-white hover:bg-teal-700 focus:ring-2 focus:ring-teal-300'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={t.cancel || 'Cancel'}
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                  theme === 'light'
                    ? 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-2 focus:ring-teal-500'
                    : 'bg-teal-700 text-white hover:bg-teal-600 focus:ring-2 focus:ring-teal-300'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={t.upload || 'Upload'}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t.uploading || 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Clock size={20} />
                    {t.upload || 'Upload'}
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
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}