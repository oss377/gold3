'use client';

import { useState, useEffect, useContext, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Dumbbell,
  Calendar,
  BarChart,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  Stethoscope,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import UserNotification from '../../components/UserNotification';
import Message from '../../components/Messages';
import { ThemeContext } from '../../context/ThemeContext';
import LanguageContext from '../../context/LanguageContext';
import ScheduleFetcher from '../../components/ScheduleFetcher';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../app/fconfig';
import { doc, getDoc } from 'firebase/firestore';

interface UserCredentials {
  userId: string;
  email: string;
  role: string;
  category?: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  category: string;
  membershipType: string;
  createdAt: string;
  [key: string]: any;
}

interface UserNotificationProps {
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  theme: string;
}

interface MessageProps {
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  onClick: () => void;
  theme: string;
}

interface LanguageContextValue {
  language: string;
  toggleLanguage: () => void;
  t: Record<string, string>;
}

export default function UserDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [messages, setMessages] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userCredentials, setUserCredentials] = useState<UserCredentials | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const themeContext = useContext(ThemeContext);
  const languageContext = useContext(LanguageContext) as LanguageContextValue | undefined;

  if (!themeContext) {
    throw new Error('UserDashboard must be used within a ThemeProvider');
  }

  const { theme, toggleTheme } = themeContext;
  const { language = 'en', toggleLanguage = () => {}, t = {} } = languageContext || {};

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('No user authenticated, redirecting to /');
        toast.error(t.pleaseLogin || 'Please log in to access this page');
        router.push('/');
        return;
      }

      try {
        console.log('Fetching /api/validate for user:', user.uid);
        const response = await fetch('/api/validate', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const { error } = await response.json();
          console.log('Validation failed:', error);
          toast.error(error || t.pleaseLogin || 'Please log in to access this page');
          router.push('/');
          return;
        }

        const credentials: UserCredentials = await response.json();
        console.log('Validation response:', credentials);
        if (credentials.userId !== user.uid) {
          console.log('Session mismatch: validate userId', credentials.userId, '!= auth userId', user.uid);
          toast.error(t.invalidSession || 'Session mismatch. Please log in again.');
          router.push('/');
          return;
        }

        setUserCredentials(credentials);
        setIsAuthorized(true);
        console.log('User authorized, credentials set:', credentials);

        // Fetch user profile from Firestore
        console.log('Fetching user profile from GYM collection for userId:', user.uid);
        const userDocRef = doc(db, 'GYM', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserProfile({
            id: userDocSnap.id,
            firstName: data.firstName || 'Unknown',
            lastName: data.lastName || 'Unknown',
            email: data.email || 'Unknown',
            category: data.category || 'Uncategorized',
            membershipType: data.membershipType || 'Unknown',
            createdAt: data.createdAt || 'Unknown',
            ...data,
          });
          console.log('User profile fetched:', data);
        } else {
          console.warn('User document not found in GYM collection for userId:', user.uid);
          setErrorMessage(t.userNotFound || 'User profile not found. Please contact support.');
        }
      } catch (error) {
        console.error('Validation or profile fetch error:', error);
        toast.error(t.pleaseLogin || 'Please log in to access this page');
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, t]);

  const navItems = [
    { name: t.dashboard || 'Dashboard', icon: BarChart, href: '/user' },
    { name: t.schedules || 'Schedules', icon: Calendar, href: '/user/schedules' },
    { name: t.workouts || 'Workouts', icon: Dumbbell, href: '/user/workouts' },
    { name: t.settings || 'Settings', icon: Settings, href: '/user/settings' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(t.loggedOut || 'Logged out successfully');
        router.push('/');
      } else {
        toast.error(t.logoutFailed || 'Logout failed. Please try again.');
      }
    } catch (error) {
      toast.error(t.logoutError || 'An error occurred during logout.');
      console.error('Logout error:', error);
    }
  };

  const handleConsultancy = () => router.push('/consultancy');

  const handleMessageClick = async () => {
    console.log('Message icon clicked! Navigating to messages...');
    try {
      await router.push('/messages');
    } catch (error) {
      setErrorMessage(t.errorMessage || 'Messages page is currently unavailable. Please try again later.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  if (!isAuthorized) {
    console.log('Rendering null, isAuthorized is false');
    return null;
  }

  return (
    <div
      className={`flex h-screen font-sans transition-colors duration-300 ${
        theme === 'light' ? 'bg-zinc-100 text-gray-900' : 'bg-zinc-900 text-white'
      }`}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          theme === 'light'
            ? 'bg-gradient-to-b from-blue-100 to-purple-100 text-zinc-800'
            : 'bg-gradient-to-b from-gray-800 to-gray-900 text-white'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex items-center justify-between p-5 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Dumbbell
              size={30}
              className={theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}
            />
            <h1
              className={`text-xl font-bold tracking-tight ${
                theme === 'light' ? 'text-zinc-800' : 'text-white'
              }`}
            >
              {t.appTitle || 'Gym House'}
            </h1>
          </div>
          <button
            className={theme === 'light' ? 'text-zinc-700 hover:text-zinc-900' : 'text-white hover:text-gray-200'}
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-3">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon
                size={20}
                className={`mr-3 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`}
              />
              <span>{item.name}</span>
            </Link>
          ))}
          <button
            key="logout"
            onClick={handleLogout}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
            }`}
          >
            <LogOut
              size={20}
              className={`mr-3 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`}
            />
            <span>{t.logout || 'Logout'}</span>
          </button>
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
            }`}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon size={20} className="mr-3 text-blue-600" />
            ) : (
              <Sun size={20} className="mr-3 text-yellow-400" />
            )}
            <span>{theme === 'light' ? (t.darkMode || 'Dark Mode') : (t.lightMode || 'Light Mode')}</span>
          </button>
          <button
            onClick={toggleLanguage}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
            }`}
            aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
          >
            <Globe size={20} className={`mr-3 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
        </nav>
      </aside>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
      >
        <header
          className={`shadow-md p-5 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-zinc-800'
              : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
          }`}
        >
          <div className="flex items-center">
            <button
              className={theme === 'light' ? 'text-blue-600 hover:text-blue-800 mr-4' : 'text-yellow-400 hover:text-yellow-300 mr-4'}
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2
              className={`text-2xl font-semibold tracking-tight ${
                theme === 'light' ? 'text-zinc-800' : 'text-white'
              }`}
            >
              {t.dashboard || 'User Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search
                size={24}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                }`}
              />
              <input
                type="text"
                placeholder={t.searchPlaceholder || 'Search classes, trainers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-900'
                    : 'bg-gray-700 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
              />
            </div>
            <UserNotification
              count={notifications}
              setCount={setNotifications}
              theme={theme}
            />
            <Message
              count={messages}
              setCount={setMessages}
              onClick={handleMessageClick}
              theme={theme}
            />
            <button
              onClick={handleConsultancy}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <Stethoscope size={20} className="mr-2" />
              {t.getConsultancy || 'Get Consultancy'}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div
            className={`mx-8 mt-4 p-4 rounded-lg ${
              theme === 'light' ? 'bg-red-100 text-red-700' : 'bg-red-900 text-red-200'
            }`}
          >
            {errorMessage}
          </div>
        )}

        <main
          className={`flex-1 p-8 overflow-y-auto ${
            theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900' : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white'
          }`}
        >
          {/* User Profile Section */}
          {userProfile && (
            <div
              className={`rounded-xl shadow-lg p-6 mb-10 border ${
                theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700'
              }`}
            >
              <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                {t.userProfile || 'Your Profile'}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`font-medium ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                    {t.firstName || 'First Name'}:
                  </span>
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-200'}>
                    {userProfile.firstName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-medium ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                    {t.lastName || 'Last Name'}:
                  </span>
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-200'}>
                    {userProfile.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-medium ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                    {t.email || 'Email'}:
                  </span>
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-200'}>
                    {userProfile.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-medium ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                    {t.category || 'Category'}:
                  </span>
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-200'}>
                    {userProfile.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-medium ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                    {t.membershipType || 'Membership Type'}:
                  </span>
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-200'}>
                    {userProfile.membershipType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-medium ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                    {t.createdAt || 'Joined'}:
                  </span>
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-200'}>
                    {userProfile.createdAt}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div
            className={`grid ${
              isSidebarOpen ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            } gap-6 mb-10 transition-all duration-300`}
          >
            {[
              { title: t.workoutsCompleted || 'Workouts Completed', value: '128', change: t.changeWorkouts || '+5 this week' },
              { title: t.classesAttended || 'Classes Attended', value: '12', change: t.changeClasses || '+2 this month' },
              { title: t.nextSession || 'Next Session', value: t.nextSessionTime || 'Today, 6 PM', change: t.nextSessionClass || 'Spin Class' },
              { title: t.progress || 'Progress', value: '78%', change: t.changeProgress || '+10% this month' },
            ].map((stat, index) => (
              <div
                key={index}
                className={`rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border ${
                  theme === 'light'
                    ? 'bg-white text-gray-900 border-gray-200'
                    : 'bg-gray-800 text-white border-gray-700'
                }`}
              >
                <h3
                  className={`text-lg font-semibold ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}
                >
                  {stat.title}
                </h3>
                <p
                  className={`text-3xl font-bold mt-2 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`}
                >
                  {stat.value}
                </p>
                <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          <div
            className={`rounded-xl shadow-lg p-6 mb-10 border ${
              theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700'
            }`}
          >
            <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              {t.workoutSchedule || 'Your Workout Schedule'}
            </h3>
            <ScheduleFetcher
              theme={theme}
              t={t}
              setErrorMessage={setErrorMessage}
              userId={userCredentials?.userId}
              category={userCredentials?.category}
            />
          </div>

          <div
            className={`rounded-xl shadow-lg p-6 border ${
              theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700'
            }`}
          >
            <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              {t.recentActivities || 'Recent Activities'}
            </h3>
            <table className="w-full text-left">
              <thead>
                <tr
                  className={`border-b ${theme === 'light' ? 'border-gray-200 text-gray-600' : 'border-gray-600 text-gray-300'}`}
                >
                  <th className="py-4 px-2">{t.activity || 'Activity'}</th>
                  <th className="py-4 px-2">{t.date || 'Date'}</th>
                  <th className="py-4 px-2">{t.trainer || 'Trainer'}</th>
                  <th className="py-4 px-2">{t.status || 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    activity: t.yogaClass || 'Yoga Class',
                    date: '2025-06-24',
                    trainer: t.yogaInstructor || 'Sarah Johnson',
                    status: t.completed || 'Completed',
                    statusColor: theme === 'light' ? 'text-green-500' : 'text-green-400',
                  },
                  {
                    activity: t.strengthTraining || 'Strength Training',
                    date: '2025-06-23',
                    trainer: t.strengthInstructor || 'Mike Brown',
                    status: t.completed || 'Completed',
                    statusColor: theme === 'light' ? 'text-green-500' : 'text-green-400',
                  },
                  {
                    activity: t.spinClass || 'Spin Class',
                    date: '2025-06-25',
                    trainer: t.spinInstructor || 'Emily Davis',
                    status: t.upcoming || 'Upcoming',
                    statusColor: theme === 'light' ? 'text-yellow-500' : 'text-yellow-400',
                  },
                ].map((activity, index) => (
                  <tr
                    key={index}
                    className={`border-b ${
                      theme === 'light' ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-600 hover:bg-gray-700'
                    } transition-colors duration-200`}
                  >
                    <td className="py-4 px-2">{activity.activity}</td>
                    <td className="py-4 px-2">{activity.date}</td>
                    <td className="py-4 px-2">{activity.trainer}</td>
                    <td className="py-4 px-2">
                      <span className={activity.statusColor}>{activity.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}