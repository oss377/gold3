'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { db } from '../app/fconfig'; // Adjust the path to your Firebase config
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ScheduleFetcher({ theme, t, setErrorMessage, userId, category }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!userId || !category) {
        toast.error(t.pleaseLogin || 'Please log in to access schedules');
        setErrorMessage(t.pleaseLogin || 'Please log in to access schedules');
        setLoading(false);
        return;
      }

      try {
        // Fetch schedules from schedules collection based on user category
        const schedulesQuery = query(
          collection(db, 'schedules'),
          where('category', '==', category)
        );
        const schedulesSnapshot = await getDocs(schedulesQuery);
        const schedulesData = schedulesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSchedules(schedulesData);
        setLoading(false);
      } catch (error) {
        toast.error(t.fetchError || 'An error occurred while fetching schedules');
        setErrorMessage(t.fetchError || 'An error occurred while fetching schedules');
        console.error('Error fetching schedules:', error);
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [t, setErrorMessage, userId, category]);

  if (loading) {
    return (
      <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>
        {t.loading || 'Loading schedules...'}
      </p>
    );
  }

  return (
    <div
      className={`grid ${
        theme === 'light' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      } gap-4 transition-all duration-300`}
    >
      {schedules.length > 0 ? (
        schedules.map((schedule, index) => (
          <div
            key={index}
            className={`border rounded-lg p-5 transition-all duration-200 ${
              theme === 'light'
                ? 'border-gray-200 hover:bg-blue-50'
                : 'border-gray-600 hover:bg-gray-700'
            }`}
          >
            <h4 className={`font-semibold text-lg ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              {schedule.title || t.unknownClass || 'Unknown Class'}
            </h4>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>
              {schedule.time || t.unknownTime || 'Unknown Time'}
            </p>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-200'}`}>
              {t.instructor || 'Instructor'}: {schedule.instructor || t.unknownInstructor || 'Unknown'}
            </p>
          </div>
        ))
      ) : (
        <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>
          {t.noSchedules || 'No schedules available for your category.'}
        </p>
      )}
    </div>
  );
}