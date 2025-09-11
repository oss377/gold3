import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../app/fconfig'; // Assuming Firebase is initialized
import { toast } from 'react-toastify';

// Interface for Schedule
interface Schedule {
  title: string;
  time: string;
  instructor: string;
  date: string;
}

// Interface for Stats
interface Stats {
  activeMembers: number;
  classesToday: number;
  newSignups: number;
  revenue: number;
}

// Interface for Translation
interface Translation {
  permissionDenied?: string;
  fetchSchedulesError?: string;
  fetchStatsError?: string;
  todaysSchedule?: string;
  loading?: string;
  noSchedules?: string;
  instructor?: string;
  statsOverview?: string;
  activeMembers?: string;
  classesToday?: string;
  newSignups?: string;
  revenue?: string;
  changeMembers?: string;
  changeClasses?: string;
  changeSignups?: string;
  changeRevenue?: string;
}

// Props for ScheduleFetcher
interface ScheduleFetcherProps {
  refreshTrigger: number;
  theme: string;
  t: Translation;
  onSchedulesFetched: (schedules: Schedule[]) => void;
}

// Props for DataFetcher
interface DataFetcherProps {
  refreshTrigger: number;
  searchQuery: string;
  theme: string;
  t: Translation;
  onStatsFetched?: (stats: Stats) => void;
  onStatsStatus?: (hasStats: boolean) => void; // New callback for stats availability
}

// ScheduleFetcher Component (unchanged)
export function ScheduleFetcher({ refreshTrigger, theme, t, onSchedulesFetched }: ScheduleFetcherProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const today = new Date().toISOString().split('T')[0];
        console.log('Fetching schedules for date:', today);
        const schedulesRef = collection(db, 'schedules');
        const q = query(schedulesRef, where('date', '==', today));
        const querySnapshot = await getDocs(q);

        const fetchedSchedules: Schedule[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Schedule data:', data);
          fetchedSchedules.push({
            title: data.title || 'Untitled',
            time: data.time || 'N/A',
            instructor: data.instructor || 'Unknown',
            date: data.date || today,
          });
        });

        if (fetchedSchedules.length === 0) {
          console.log('No schedules found for today');
        }

        setSchedules(fetchedSchedules);
        onSchedulesFetched(fetchedSchedules);
      } catch (error: any) {
        console.error('Error fetching schedules:', error.message, error.stack);
        const errorMsg =
          error.code === 'permission-denied'
            ? t['permissionDenied'] || 'Permission denied: Please check your Firestore rules'
            : t['fetchSchedulesError'] || 'Failed to fetch schedules';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, [refreshTrigger, t, onSchedulesFetched]);

  return (
    <div
      className={`rounded-2xl shadow-xl p-8 mb-12 border ${
        theme === 'light' ? 'bg-white text-gray-900 border-gray-100' : 'bg-gray-800 text-white border-gray-700'
      }`}
    >
      <h3 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
        {t['todaysSchedule'] || "Today's Workout Schedule"}
      </h3>
      {errorMessage && (
        <div
          className={`mb-4 p-3 rounded-md ${
            theme === 'light' ? 'bg-red-100 text-red-700' : 'bg-red-900 text-red-200'
          }`}
        >
          {errorMessage}
        </div>
      )}
      {isLoading ? (
        <p className={`text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
          {t['loading'] || 'Loading schedules...'}
        </p>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-300`}>
          {schedules.length > 0 ? (
            schedules.map((schedule, index) => (
              <div
                key={index}
                className={`border rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                  theme === 'light'
                    ? 'border-gray-200 bg-gray-50 hover:bg-indigo-50'
                    : 'border-gray-700 bg-gray-900 hover:bg-indigo-900'
                }`}
              >
                <h4 className={`font-bold text-xl ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {schedule.title}
                </h4>
                <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {schedule.time}
                </p>
                <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {t['instructor'] || 'Instructor'}: {schedule.instructor}
                </p>
              </div>
            ))
          ) : (
            <p className={`text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              {t['noSchedules'] || 'No schedules available for today'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// DataFetcher Component
export function DataFetcher({ refreshTrigger, searchQuery, theme, t, onStatsFetched, onStatsStatus }: DataFetcherProps) {
  const [stats, setStats] = useState<Stats>({
    activeMembers: 0,
    classesToday: 0,
    newSignups: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasStats, setHasStats] = useState<boolean>(false); // Track if stats are available

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setErrorMessage('');
      setHasStats(false); // Reset stats availability
      try {
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);

        const membersRef = collection(db, 'members');
        const activeMembersQuery = query(membersRef, where('status', '==', 'active'));
        const activeMembersSnapshot = await getDocs(activeMembersQuery);
        const activeMembersCount = activeMembersSnapshot.size;

        const classesRef = collection(db, 'classes');
        const classesTodayQuery = query(classesRef, where('date', '==', today));
        const classesTodaySnapshot = await getDocs(classesTodayQuery);
        const classesTodayCount = classesTodaySnapshot.size;

        const newSignupsQuery = query(
          membersRef,
          where('signupDate', '>=', oneWeekAgo),
          where('signupDate', '<=', today)
        );
        const newSignupsSnapshot = await getDocs(newSignupsQuery);
        const newSignupsCount = newSignupsSnapshot.size;

        const revenueRef = collection(db, 'revenue');
        const revenueQuery = query(
          revenueRef,
          where('date', '>=', `${currentMonth}-01`),
          where('date', '<=', `${currentMonth}-31`)
        );
        const revenueSnapshot = await getDocs(revenueQuery);
        let totalRevenue = 0;
        revenueSnapshot.forEach((doc) => {
          const data = doc.data();
          totalRevenue += data.amount || 0;
        });

        const fetchedStats: Stats = {
          activeMembers: activeMembersCount,
          classesToday: classesTodayCount,
          newSignups: newSignupsCount,
          revenue: totalRevenue,
        };

        // Check if stats are meaningful (non-zero)
        const hasValidStats =
          fetchedStats.activeMembers > 0 ||
          fetchedStats.classesToday > 0 ||
          fetchedStats.newSignups > 0 ||
          fetchedStats.revenue > 0;

        setHasStats(hasValidStats);
        if (onStatsStatus) {
          onStatsStatus(hasValidStats);
        }

        console.log('Fetched stats:', fetchedStats);
        setStats(fetchedStats);
        if (onStatsFetched) {
          onStatsFetched(fetchedStats);
        }
      } catch (error: any) {
        console.error('Error fetching stats:', error.message, error.stack);
        const errorMsg =
          error.code === 'permission-denied'
            ? t['permissionDenied'] || 'Permission denied: Please check your Firestore rules'
            : t['fetchStatsError'] || 'Failed to fetch stats';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        if (onStatsStatus) {
          onStatsStatus(false); // No stats available on error
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [refreshTrigger, t, onStatsFetched, onStatsStatus]);

  if (!hasStats && !isLoading && errorMessage) {
    return null; // Let parent handle placeholders
  }

  return (
    <div
      className={`rounded-2xl shadow-xl p-8 mb-12 border ${
        theme === 'light' ? 'bg-white text-gray-900 border-gray-100' : 'bg-gray-800 text-white border-gray-700'
      }`}
    >
      <h3 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
        {t['statsOverview'] || 'Stats Overview'}
      </h3>
      {errorMessage && (
        <div
          className={`mb-4 p-3 rounded-md ${
            theme === 'light' ? 'bg-red-100 text-red-700' : 'bg-red-900 text-red-200'
          }`}
        >
          {errorMessage}
        </div>
      )}
      {isLoading ? (
        <p className={`text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
          {t['loading'] || 'Loading stats...'}
        </p>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 transition-all duration-300`}>
          {[
            {
              title: t['activeMembers'] || 'Active Members',
              value: stats.activeMembers.toLocaleString(),
              change: t['changeMembers'] || '+12% this month',
            },
            {
              title: t['classesToday'] || 'Classes Today',
              value: stats.classesToday.toString(),
              change: t['changeClasses'] || '+3 from yesterday',
            },
            {
              title: t['newSignups'] || 'New Signups',
              value: stats.newSignups.toString(),
              change: t['changeSignups'] || '+15% this week',
            },
            {
              title: t['revenue'] || 'Revenue',
              value: `$${stats.revenue.toLocaleString()}`,
              change: t['changeRevenue'] || '+7% this month',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`rounded-2xl shadow-xl p-6 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border ${
                theme === 'light'
                  ? 'bg-white text-gray-900 border-gray-100'
                  : 'bg-gray-800 text-white border-gray-700'
              }`}
            >
              <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {stat.title}
              </h3>
              <p
                className={`text-4xl font-extrabold mt-2 ${
                  theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'
                }`}
              >
                {stat.value}
              </p>
              <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}