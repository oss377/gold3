'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '../../fconfig';
import { ThemeContext } from '../../../context/ThemeContext';
import LanguageContext from '../../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, User, FileText, Tag } from 'lucide-react';

// Interfaces
interface ThemeContextType {
  theme: "light" | "dark";
}

interface LanguageContextType {
  t: { [key: string]: string };
}

interface ScheduleDate {
  day: string;
  time: string;
  timeSlot: string;
}

interface Schedule {
  id: string;
  category: string;
  createdAt: Timestamp;
  date: string;
  dates: ScheduleDate[];
  description: string;
  instructor: string;
  title: string;
  updatedAt: Timestamp;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useContext(ThemeContext) as ThemeContextType;
  const { t } = useContext(LanguageContext) as LanguageContextType;

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const schedulesQuery = query(
        collection(db, 'schedules'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(schedulesQuery);
      
      const schedulesData: Schedule[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Schedule));
      
      setSchedules(schedulesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(t?.failedToFetch || 'Failed to fetch schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const formatDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
      return timestamp.toDate().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const renderDates = (datesArray: ScheduleDate[] | undefined) => {
    if (!datesArray || !Array.isArray(datesArray)) {
      return (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {t?.noScheduleDates || 'No schedule dates'}
        </span>
      );
    }
    
    return (
      <div className="space-y-2">
        {datesArray.map((dateItem: ScheduleDate, index: number) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 shadow-sm"
          >
            <div className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${
                dateItem.timeSlot === 'Morning' 
                  ? 'bg-yellow-500'
                  : dateItem.timeSlot === 'Afternoon'
                  ? 'bg-orange-500'
                  : dateItem.timeSlot === 'Evening'
                  ? 'bg-purple-500'
                  : 'bg-blue-500'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {dateItem.day}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {dateItem.time}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  dateItem.timeSlot === 'Morning' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : dateItem.timeSlot === 'Afternoon'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    : dateItem.timeSlot === 'Evening'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {dateItem.timeSlot}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`min-h-screen flex items-center justify-center ${
          theme === "light" ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-gray-900 to-gray-800"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
            {t?.loadingSchedules || 'Loading schedules...'}
          </p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`min-h-screen py-8 ${
          theme === "light" ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-gray-900 to-gray-800"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-2xl p-8 text-center ${
            theme === "light" 
              ? "bg-white shadow-lg border border-red-200" 
              : "bg-gray-800 shadow-xl border border-red-500/30"
          }`}>
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${
              theme === "light" ? "text-gray-800" : "text-gray-100"
            }`}>
              {error}
            </h3>
            <button
              onClick={fetchSchedules}
              className={`mt-4 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                theme === "light" 
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl" 
                  : "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {t?.tryAgain || 'Try Again'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen p-4 md:p-8 ${
        theme === "light" ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-gray-900 to-gray-800"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-4"
        >
          <Link 
            href="/admin" 
            className={`p-3 rounded-xl transition-all duration-300 ${
              theme === "light" 
                ? "text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow-lg" 
                : "text-gray-200 hover:bg-gray-700 hover:text-yellow-400 hover:shadow-lg"
            }`}
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className={`text-3xl font-bold ${theme === "light" ? "text-gray-800" : "text-gray-100"}`}>
              {t?.classSchedules || 'Class Schedules'}
            </h1>
            <p className={`mt-2 text-lg ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
              {t?.viewAndManage || 'View and manage all class schedules in the system'}
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`rounded-2xl overflow-hidden ${
            theme === "light" 
              ? "bg-white shadow-lg border border-gray-200" 
              : "bg-gray-800 shadow-xl border border-gray-700/50"
          }`}
        >
          {/* Table Header */}
          <div className={`px-6 py-4 border-b ${
            theme === "light" ? "border-gray-200 bg-gray-50" : "border-gray-700 bg-gray-700/50"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${theme === "light" ? "text-gray-800" : "text-gray-100"}`}>
                  {t?.allSchedules || 'All Schedules'}
                </h2>
                <p className={`mt-1 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                  {t?.totalSchedules || 'Total schedules'}: <span className="font-semibold">{schedules.length}</span>
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl ${
                theme === "light" ? "bg-blue-50 text-blue-600" : "bg-blue-900/30 text-blue-400"
              }`}>
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          {schedules.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-12"
            >
              <div className={`mb-4 ${
                theme === "light" ? "text-gray-400" : "text-gray-500"
              }`}>
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className={`text-lg font-medium mb-2 ${
                theme === "light" ? "text-gray-900" : "text-gray-100"
              }`}>
                {t?.noSchedulesFound || 'No schedules found'}
              </h3>
              <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                {t?.noSchedulesAvailable || 'There are no schedules available at the moment.'}
              </p>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={theme === "light" ? "bg-gray-50" : "bg-gray-700/50"}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      <div className={`flex items-center gap-2 ${
                        theme === "light" ? "text-gray-500" : "text-gray-300"
                      }`}>
                        <FileText className="w-4 h-4" />
                        {t?.title || 'Title'}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      <div className={`flex items-center gap-2 ${
                        theme === "light" ? "text-gray-500" : "text-gray-300"
                      }`}>
                        <Tag className="w-4 h-4" />
                        {t?.category || 'Category'}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      <div className={`flex items-center gap-2 ${
                        theme === "light" ? "text-gray-500" : "text-gray-300"
                      }`}>
                        <User className="w-4 h-4" />
                        {t?.instructor || 'Instructor'}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      <div className={`flex items-center gap-2 ${
                        theme === "light" ? "text-gray-500" : "text-gray-300"
                      }`}>
                        <Calendar className="w-4 h-4" />
                        {t?.scheduleDates || 'Schedule Dates'}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      <div className={`flex items-center gap-2 ${
                        theme === "light" ? "text-gray-500" : "text-gray-300"
                      }`}>
                        <FileText className="w-4 h-4" />
                        {t?.description || 'Description'}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      {t?.created || 'Created'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      {t?.updated || 'Updated'}
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  theme === "light" ? "divide-gray-200 bg-white" : "divide-gray-700 bg-gray-800"
                }`}>
                  <AnimatePresence>
                    {schedules.map((schedule: Schedule, index) => (
                      <motion.tr
                        key={schedule.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group transition-all duration-300 ${
                          theme === "light" 
                            ? "hover:bg-gray-50" 
                            : "hover:bg-gray-700/50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {schedule.title || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            theme === "light"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-purple-900/30 text-purple-400"
                          } capitalize`}>
                            {schedule.category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-300">
                            {schedule.instructor || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-[250px]">
                            {renderDates(schedule.dates)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className={`text-sm truncate ${
                              theme === "light" ? "text-gray-900" : "text-gray-300"
                            }`} title={schedule.description}>
                              {schedule.description || (t?.noDescription || 'No description available')}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${
                            theme === "light" ? "text-gray-500" : "text-gray-400"
                          }`}>
                            {formatDate(schedule.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${
                            theme === "light" ? "text-gray-500" : "text-gray-400"
                          }`}>
                            {formatDate(schedule.updatedAt)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Info Card */}
        {schedules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`mt-6 rounded-2xl p-6 ${
              theme === "light" 
                ? "bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100/50" 
                : "bg-gradient-to-r from-gray-700 to-gray-600 border border-gray-600/50"
            }`}
          >
            <h3 className={`text-lg font-semibold mb-3 ${
              theme === "light" ? "text-gray-800" : "text-gray-100"
            }`}>
              📊 Schedule Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className={`p-3 rounded-xl ${
                theme === "light" ? "bg-white text-gray-600" : "bg-gray-600/30 text-gray-300"
              }`}>
                <div className="font-semibold">Total Classes</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{schedules.length}</div>
              </div>
              <div className={`p-3 rounded-xl ${
                theme === "light" ? "bg-white text-gray-600" : "bg-gray-600/30 text-gray-300"
              }`}>
                <div className="font-semibold">Categories</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Set(schedules.map(s => s.category)).size}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${
                theme === "light" ? "bg-white text-gray-600" : "bg-gray-600/30 text-gray-300"
              }`}>
                <div className="font-semibold">Instructors</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(schedules.map(s => s.instructor)).size}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}