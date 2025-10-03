'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Loader2,
  CreditCard,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../fconfig';
import UserNotification from '../../components/UserNotification';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

// Define interfaces for type safety
interface Schedule {
  id: string;
  title: string;
  time: string;
  instructor: string;
  category: string;
}

interface Activity {
  id: string;
  activity: string;
  date: string;
  trainer: string;
  status: string;
  userEmail: string;
}

interface NextSession {
  time: string;
  class: string;
}

interface Stats {
  workoutsCompleted: number;
  classesAttended: number;
  progress: number;
}

interface NavItem {
  name: string;
  icon: React.ElementType;
  href?: string;
}

// Define interface for translations
interface Translations {
  pleaseLogin?: string;
  userDataNotFound?: string;
  nextSessionTime?: string;
  nextSessionClass?: string;
  indexError?: string;
  fetchError?: string;
  dashboard?: string;
  profile?: string;
  schedules?: string;
  workouts?: string;
  settings?: string;
  logout?: string;
  logoutSuccess?: string;
  logoutFailed?: string;
  logoutError?: string;
  errorMessage?: string;
  loading?: string;
  appTitle?: string;
  closeSidebar?: string;
  openSidebar?: string;
  darkMode?: string;
  lightMode?: string;
  switchAmharic?: string;
  switchEnglish?: string;
  welcome?: string;
  category?: string;
  searchPlaceholder?: string;
  messages?: string;
  selectMessageType?: string;
  personalMessage?: string;
  personalMessageDesc?: string;
  publicMessage?: string;
  publicMessageDesc?: string;
  pay?: string;
  getConsultancy?: string;
  workoutsCompleted?: string;
  changeWorkouts?: string;
  classesAttended?: string;
  changeClasses?: string;
  nextSession?: string;
  progress?: string;
  changeProgress?: string;
  workoutSchedule?: string;
  schedulesFound?: string;
  yogaClass?: string;
  yogaTime?: string;
  instructor?: string;
  yogaInstructor?: string;
  noSchedules?: string;
  recentActivities?: string;
  activity?: string;
  date?: string;
  trainer?: string;
  status?: string;
  completed?: string;
  noActivities?: string;
}

// Define interface for LanguageContext
interface LanguageContextType {
  language: string;
  toggleLanguage: () => void;
  t: Translations;
}

export default function UserDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [messages, setMessages] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [userCategory, setUserCategory] = useState('');
  const [stats, setStats] = useState<Stats>({
    workoutsCompleted: 0,
    classesAttended: 0,
    progress: 0,
  });
  const [nextSession, setNextSession] = useState<NextSession>({ time: '', class: '' });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const themeContext = useContext(ThemeContext);
  const languageContext = useContext(LanguageContext);
  const messageOptionsRef = useRef<HTMLDivElement>(null);

  // Refs for logo image fallbacks
  const sidebarIconRef = useRef<SVGSVGElement>(null) as React.RefObject<SVGSVGElement>;
  const headerIconRef = useRef<SVGSVGElement>(null) as React.RefObject<SVGSVGElement>;

  // Check for ThemeContext
  if (!themeContext) {
    throw new Error('UserDashboard must be used within a ThemeProvider');
  }

  // Check for LanguageContext
  if (!languageContext) {
    throw new Error('UserDashboard must be used within a LanguageProvider');
  }

  const { theme, toggleTheme } = themeContext;
  const { language = 'en', toggleLanguage = () => {}, t } = languageContext as LanguageContextType; // Cast to correct type

  // Handle image load errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, ref: React.RefObject<SVGSVGElement>) => {
    e.currentTarget.style.display = 'none';
    if (ref.current) ref.current.style.display = 'block';
  };

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/validate", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const { error } = await response.json();
          toast.error(error || t.pleaseLogin || "Please log in to access this page");
          router.push("/");
          return;
        }

        const data = await response.json();
        setIsAuthorized(true);
        setUserEmail(data.email || 'Unknown');
        console.log('User authorized:', data.email);

        // Fetch user data from GYM collection
        const gymRef = doc(db, 'GYM', data.email);
        const gymSnap = await getDoc(gymRef);
        
        if (gymSnap.exists()) {
          const gymData = gymSnap.data();
          setUserName(gymData.firstName || 'Unknown');
          setUserCategory(gymData.category ? gymData.category.toLowerCase().trim() : 'general');
          console.log('GYM collection data:', gymData);
        } else {
          console.warn('User data not found in GYM collection for:', data.email);
          toast.warn(t.userDataNotFound || 'User data not found in GYM collection');
        }
      } catch (error) {
        console.error('Session validation error:', error);
        toast.error(t.pleaseLogin || "Please log in to access this page");
        router.push("/");
      }
    };

    validateSession();
  }, [router, t]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthorized || !userEmail) {
        console.log('Not authorized or no user email, skipping data fetch');
        return;
      }
      
      setLoading(true);
      console.log('Starting data fetch for user:', userEmail);
      
      try {
        // Fetch all unique categories from schedules collection (normalized)
        const schedulesSnap = await getDocs(collection(db, 'schedules'));
        console.log('Total schedules documents:', schedulesSnap.docs.length);
        
        const allCategories = [...new Set(
          schedulesSnap.docs.map(doc => {
            const categoryData = doc.data();
            const category = categoryData.category;
            console.log('Raw category from document:', category, 'from doc:', doc.id);
            return category ? category.toLowerCase().trim() : 'general';
          })
        )];
        
        console.log('All Available Categories in Schedules:', allCategories);

        // Fetch schedules matching user's category (with case-insensitive comparison)
        const allSchedulesSnap = await getDocs(collection(db, 'schedules'));
        const fetchedSchedules: Schedule[] = [];
        
        allSchedulesSnap.docs.forEach((docSnap) => {
          const scheduleData = docSnap.data();
          const scheduleCategory = scheduleData.category ? scheduleData.category.toLowerCase().trim() : 'general';
          
          console.log('Checking schedule:', docSnap.id, 'with category:', scheduleCategory, 'against user category:', userCategory);
          
          if (scheduleCategory === userCategory) {
            fetchedSchedules.push({
              id: docSnap.id,
              title: scheduleData.title,
              time: scheduleData.date,
              instructor: scheduleData.instructor,
              category: scheduleCategory,
            });
          }
        });
        
        setSchedules(fetchedSchedules);
        console.log('Matching Schedules Found:', fetchedSchedules.length);
        console.log('Matching Schedules Details:', fetchedSchedules);

        // Determine next session
        const now = new Date();
        const upcoming = fetchedSchedules
          .filter((s: Schedule) => new Date(s.time) > now)
          .sort((a: Schedule, b: Schedule) => new Date(a.time).getTime() - new Date(b.time).getTime())[0];
        
        if (upcoming) {
          setNextSession({
            time: new Date(upcoming.time).toLocaleString() || t.nextSessionTime || 'Today, 6 PM',
            class: upcoming.title || t.nextSessionClass || 'Spin Class',
          });
        }

        // Fetch recent activities with enhanced error handling
        try {
          const activitiesQ = query(
            collection(db, 'activities'),
            where('userEmail', '==', userEmail),
            orderBy('date', 'desc'),
            limit(3)
          );
          const activitiesSnap = await getDocs(activitiesQ);
          const fetchedActivities: Activity[] = activitiesSnap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Activity[];
          setRecentActivities(fetchedActivities);
          console.log('Recent activities found:', fetchedActivities.length);
        } catch (error: any) {
          console.error('Error fetching activities:', error);
          if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
            const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0] || 'Firebase Console';
            toast.error(
              t.indexError || 
              `Unable to fetch activities due to a missing database index. Please create it in the Firebase Console: ${indexUrl}`
            );
            console.error('Index creation required. Visit:', indexUrl);
            setRecentActivities([]);
          } else {
            toast.error(t.fetchError || 'Failed to fetch recent activities');
            setRecentActivities([]);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error(t.fetchError || 'Failed to fetch dashboard data');
        setRecentActivities([]);
      } finally {
        setLoading(false);
        console.log('Data loading completed');
      }
    };

    fetchData();
  }, [isAuthorized, userEmail, userCategory, t]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageOptionsRef.current && !messageOptionsRef.current.contains(event.target as Node)) {
        setShowMessageOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems: NavItem[] = [
    { name: t.dashboard || 'Dashboard', icon: BarChart, href: '/user' },
    { name: t.profile || 'Profile', icon: User, href: '/user/profile' },
    { name: t.schedules || 'Schedules', icon: Calendar, href: '/user/schedules' },
    { name: t.workouts || 'Workouts', icon: Dumbbell, href: '/user/workouts' },
    { name: t.settings || 'Settings', icon: Settings, href: '/user/settings' },
    { name: t.logout || 'Logout', icon: LogOut },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success(t.logoutSuccess || "Logged out successfully");
        router.push("/");
      } else {
        toast.error(t.logoutFailed || "Logout failed. Please try again.");
      }
    } catch (error) {
      toast.error(t.logoutError || "An error occurred during logout.");
      console.error("Logout error:", error);
    }
  };

  const handleConsultancy = () => router.push('/consultancy');

  const handlePay = () => router.push('/payment');

  const handleMessageClick = () => {
    console.log('Message icon clicked! Navigating to messages...');
    setShowMessageOptions((prev) => !prev);
  };

  const handleMessageNavigation = async (type: string) => {
    try {
      await router.push(
        type === 'personal'
          ? `/userMessage?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}`
          : `/publicMessage?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}`
      );
      setShowMessageOptions(false);
    } catch (error) {
      setErrorMessage(t.errorMessage || `${type.charAt(0).toUpperCase() + type.slice(1)} messages page is currently unavailable. Please try again later.`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const cardStyle = {
    boxShadow: theme === 'light'
      ? '0 10px 30px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(59, 130, 246, 0.2)'
      : '0 10px 30px rgba(45, 212, 191, 0.3), 0 4px 10px rgba(45, 212, 191, 0.2)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z' fill='%23${theme === 'light' ? 'dbeafe' : '1e3a8a'}' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
  };

  if (!isAuthorized) {
    console.log('Not authorized, rendering null');
    return null;
  }

  if (loading) {
    console.log('Loading state, showing loader');
    return (
      <div
        className={`flex h-screen items-center justify-center ${
          theme === 'light' ? 'bg-blue-50 bg-opacity-30' : 'bg-blue-950 bg-opacity-50'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M29 58C13.536 58 1 45.464 1 30 1 14.536 13.536 2 29 2c8.467 0 16.194 3.832 21.213 10.106C55.232 18.38 58 25.534 58 33c0 7.466-2.768 14.62-7.787 20.894C45.194 54.168 37.467 58 29 58z' fill='%23${theme === 'light' ? 'a3bffa' : '2a4365'}' fill-opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <Loader2 className={`h-8 w-8 animate-spin mr-2 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`} />
        <span className={theme === 'light' ? 'text-blue-900' : 'text-white'}>{t.loading || 'Loading dashboard...'}</span>
      </div>
    );
  }

  console.log('Rendering dashboard with:', {
    userEmail,
    userName,
    userCategory,
    schedulesCount: schedules.length,
    activitiesCount: recentActivities.length
  });

  return (
    <div
      className={`flex min-h-screen font-sans transition-colors duration-500 ${
        theme === 'light' ? 'bg-blue-50 bg-opacity-30' : 'bg-blue-950 bg-opacity-50'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M29 58C13.536 58 1 45.464 1 30 1 14.536 13.536 2 29 2c8.467 0 16.194 3.832 21.213 10.106C55.232 18.38 58 25.534 58 33c0 7.466-2.768 14.62-7.787 20.894C45.194 54.168 37.467 58 29 58z' fill='%23${theme === 'light' ? 'a3bffa' : '2a4365'}' fill-opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-500 ease-in-out ${
          theme === 'light'
            ? 'bg-gradient-to-b from-blue-100 to-teal-100 text-blue-900'
            : 'bg-gradient-to-b from-blue-900 to-teal-900 text-white'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === 'light' ? 'border-blue-200' : 'border-teal-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt={t.appTitle || 'Gym House Logo'}
                fill
                className="object-contain rounded-full"
                onError={(e) => handleImageError(e, sidebarIconRef)}
              />
              <Dumbbell
                ref={sidebarIconRef}
                size={30}
                className={`${theme === 'light' ? 'text-teal-600' : 'text-teal-300'} hidden`}
              />
            </div>
            <h1
              className={`text-xl font-extrabold tracking-tight ${
                theme === 'light' ? 'text-blue-900' : 'text-white'
              }`}
            >
              {t.appTitle || 'Gym House'}
            </h1>
          </div>
          <button
            className={theme === 'light' ? 'text-teal-600 hover:text-teal-800' : 'text-teal-300 hover:text-teal-200'}
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? t.closeSidebar || 'Close sidebar' : t.openSidebar || 'Open sidebar'}
          >
            <X size={28} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-4">
          {navItems.map((item, index) =>
            item.href ? (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group hover:bg-gradient-to-r hover:from-teal-500 hover:to-blue-500 hover:text-white transform hover:-translate-y-0.5 hover:shadow-lg ${
                  theme === 'light' ? 'text-blue-900' : 'text-teal-200'
                } ${pathname === item.href ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md' : ''} ${
                  isSidebarOpen ? 'animate-slide-in' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                aria-label={item.name}
              >
                <item.icon
                  size={20}
                  className={`mr-3 transition-colors duration-300 group-hover:text-white ${
                    pathname === item.href
                      ? 'text-white'
                      : theme === 'light'
                      ? 'text-teal-600'
                      : 'text-teal-300'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            ) : (
              <button
                key={item.name}
                onClick={handleLogout}
                className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group hover:bg-gradient-to-r hover:from-teal-500 hover:to-blue-500 hover:text-white transform hover:-translate-y-0.5 hover:shadow-lg ${
                  theme === 'light' ? 'text-blue-900' : 'text-teal-200'
                } ${isSidebarOpen ? 'animate-slide-in' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
                aria-label={t.logout || 'Logout'}
              >
                <item.icon
                  size={20}
                  className={`mr-3 transition-colors duration-300 group-hover:text-white ${
                    theme === 'light' ? 'text-teal-600' : 'text-teal-300'
                  }`}
                />
                <span>{item.name}</span>
              </button>
            )
          )}
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group hover:bg-gradient-to-r hover:from-teal-500 hover:to-blue-500 hover:text-white transform hover:-translate-y-0.5 hover:shadow-lg ${
              theme === 'light' ? 'text-blue-900' : 'text-teal-200'
            } ${isSidebarOpen ? 'animate-slide-in' : ''}`}
            style={{ animationDelay: `${(navItems.length) * 50}ms` }}
            aria-label={theme === 'light' ? t.darkMode || 'Switch to dark mode' : t.lightMode || 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon size={20} className="mr-3 text-teal-600 group-hover:text-white" />
            ) : (
              <Sun size={20} className="mr-3 text-teal-300 group-hover:text-white" />
            )}
            <span>{theme === 'light' ? (t.darkMode || 'Dark Mode') : (t.lightMode || 'Light Mode')}</span>
          </button>
          <button
            onClick={toggleLanguage}
            className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group hover:bg-gradient-to-r hover:from-teal-500 hover:to-blue-500 hover:text-white transform

 hover:-translate-y-0.5 hover:shadow-lg ${
              theme === 'light' ? 'text-blue-900' : 'text-teal-200'
            } ${isSidebarOpen ? 'animate-slide-in' : ''}`}
            style={{ animationDelay: `${(navItems.length + 1) * 50}ms` }}
            aria-label={language === 'en' ? t.switchAmharic || 'Switch to Amharic' : t.switchEnglish || 'Switch to English'}
          >
            <Globe size={20} className={`mr-3 ${theme === 'light' ? 'text-teal-600 group-hover:text-white' : 'text-teal-300 group-hover:text-white'}`} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
        </nav>
      </aside>

      <div
        className={`flex-1 flex flex-col transition-all duration-500 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
      >
        <header
          className={`shadow-2xl p-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-blue-100 to-teal-100 text-blue-900'
              : 'bg-gradient-to-r from-blue-900 to-teal-900 text-white'
          }`}
        >
          <div className="flex items-center space-x-4">
            <button
              className={theme === 'light' ? 'text-teal-600 hover:text-teal-800' : 'text-teal-300 hover:text-teal-200'}
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? t.closeSidebar || 'Close sidebar' : t.openSidebar || 'Open sidebar'}
            >
              {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt={t.appTitle || 'Gym House Logo'}
                  fill
                  className="object-contain rounded-full"
                  onError={(e) => handleImageError(e, headerIconRef)}
                />
                <Dumbbell
                  ref={headerIconRef}
                  size={30}
                  className={`${theme === 'light' ? 'text-teal-600' : 'text-teal-300'} hidden`}
                />
              </div>
              <div>
                <h2
                  className={`text-3xl font-extrabold tracking-tight ${
                    theme === 'light' ? 'text-blue-900' : 'text-white'
                  }`}
                >
                  {t.dashboard || 'User Dashboard'}
                </h2>
                <p
                  className={`text-sm ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}
                >
                  {t.welcome || 'Welcome'}: {userEmail} | {t.category || 'Category'}: {userCategory}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search
                size={24}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  theme === 'light' ? 'text-blue-500' : 'text-teal-400'
                }`}
              />
              <input
                type="text"
                placeholder={t.searchPlaceholder || 'Search classes, trainers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-2xl border ${
                  theme === 'light'
                    ? 'bg-white bg-opacity-90 border-blue-100 text-blue-900'
                    : 'bg-blue-800 bg-opacity-90 border-teal-800 text-white'
                } focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all duration-300`}
                aria-label={t.searchPlaceholder || 'Search classes, trainers'}
              />
            </div>
            <UserNotification count={notifications} isHighContrast={theme === 'dark'} />
            <div className="relative">
              <button
                onClick={handleMessageClick}
                className={`relative p-2 rounded-full transition-all duration-300 ${
                  theme === 'light' ? 'text-teal-600 hover:bg-teal-100' : 'text-teal-300 hover:bg-teal-800'
                }`}
                aria-label={t.messages || 'Messages'}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                {messages > 0 && (
                  <span
                    className={`absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full ${
                      theme === 'light' ? 'bg-teal-600' : 'bg-teal-300'
                    }`}
                  >
                    {messages}
                  </span>
                )}
              </button>
              {showMessageOptions && (
                <div
                  ref={messageOptionsRef}
                  className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-300 transform origin-top-right ${
                    theme === 'light' ? 'bg-white bg-opacity-95 text-blue-900 border border-blue-100' : 'bg-blue-800 bg-opacity-95 text-white border border-teal-800'
                  }`}
                  style={cardStyle}
                >
                  <div className="p-4">
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                      {t.selectMessageType || 'Select Message Type'}
                    </h3>
                    <div className="space-y-3">
                      <div
                        className={`flex items-start p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md ${
                          theme === 'light' ? 'bg-teal-50 hover:bg-teal-100' : 'bg-teal-900 hover:bg-teal-800'
                        }`}
                        onClick={() => handleMessageNavigation('personal')}
                      >
                        <User size={24} className={`mr-3 flex-shrink-0 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`} />
                        <div>
                          <h4 className={`font-semibold text-base ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                            {t.personalMessage || 'Personal Message'}
                          </h4>
                          <p className={`text-sm ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                            {t.personalMessageDesc || 'Send a private message to a specific user or trainer.'}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-start p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md ${
                          theme === 'light' ? 'bg-teal-50 hover:bg-teal-100' : 'bg-teal-900 hover:bg-teal-800'
                        }`}
                        onClick={() => handleMessageNavigation('public')}
                      >
                        <Users size={24} className={`mr-3 flex-shrink-0 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`} />
                        <div>
                          <h4 className={`font-semibold text-base ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                            {t.publicMessage || 'Public Message'}
                          </h4>
                          <p className={`text-sm ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                            {t.publicMessageDesc || 'Post a message visible to all users in the community.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handlePay}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
              }`}
              aria-label={t.pay || 'Make a Payment'}
            >
              <CreditCard size={20} className="mr-2" />
              {t.pay || 'Pay'}
            </button>
            <button
              onClick={handleConsultancy}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
              }`}
            >
              <Stethoscope size={20} className="mr-2" />
              {t.getConsultancy || 'Get Consultancy'}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div
            className={`mx-8 mt-4 p-4 rounded-2xl relative overflow-hidden ${
              theme === 'light' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-red-900 text-red-200 border-red-800'
            }`}
            style={cardStyle}
          >
            {errorMessage}
          </div>
        )}

        <main
          className={`flex-1 p-8 overflow-y-auto ${
            theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-teal-50 text-blue-900' : 'bg-gradient-to-br from-blue-950 to-teal-950 text-white'
          }`}
        >
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 transition-all duration-500`}
          >
            {[
              { 
                title: t.workoutsCompleted || 'Workouts Completed', 
                value: stats.workoutsCompleted.toString(), 
                change: t.changeWorkouts || '+5 this week'
              },
              { 
                title: t.classesAttended || 'Classes Attended', 
                value: stats.classesAttended.toString(), 
                change: t.changeClasses || '+2 this month'
              },
              { 
                title: t.nextSession || 'Next Session', 
                value: nextSession.time, 
                change: nextSession.class 
              },
              { 
                title: t.progress || 'Progress', 
                value: `${stats.progress}%`, 
                change: t.changeProgress || '+10% this month'
              },
            ].map((stat, index) => (
              <div
                key={index}
                className={`rounded-3xl shadow-2xl p-6 hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500 border relative overflow-hidden ${
                  theme === 'light'
                    ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100'
                    : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
                }`}
                style={cardStyle}
              >
                {stat.title === (t.progress || 'Progress') && (
                  <div className={`w-full h-2 rounded-full mt-4 mb-2 ${theme === 'light' ? 'bg-blue-100' : 'bg-teal-800'}`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-teal-600' : 'bg-teal-300'}`}
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                )}
                <h3
                  className={`text-lg font-bold ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}
                >
                  {stat.title}
                </h3>
                <p
                  className={`text-3xl font-extrabold mt-2 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                >
                  {stat.value || 0}
                </p>
                <p className={`text-sm mt-1 ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          <div
            className={`rounded-3xl shadow-2xl p-8 mb-12 border relative overflow-hidden ${
              theme === 'light' ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100' : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
            }`}
            style={cardStyle}
          >
            <h3 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
              {t.workoutSchedule || 'Your Workout Schedule'} ({schedules.length} {t.schedulesFound || 'found'})
            </h3>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500`}
            >
              {schedules.length > 0 ? (
                schedules.slice(0, 3).map((schedule: Schedule) => (
                  <div
                    key={schedule.id}
                    className={`border rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg ${
                      theme === 'light'
                        ? 'border-blue-100 hover:bg-teal-50'
                        : 'border-teal-800 hover:bg-teal-900'
                    }`}
                    onClick={() => router.push(`/user/schedules/${schedule.id}`)}
                  >
                    <h4 className={`font-semibold text-lg ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                      {schedule.title || t.yogaClass || 'Yoga Class'}
                    </h4>
                    <p className={`text-sm ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                      {schedule.time ? new Date(schedule.time).toLocaleDateString() : t.yogaTime || '2025-07-11'}
                    </p>
                    <p className={`text-sm ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                      {t.instructor || 'Instructor'}: {schedule.instructor || t.yogaInstructor || 'Sarah Johnson'}
                    </p>
                  </div>
                ))
              ) : (
                <p className={`col-span-full text-center ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                  {t.noSchedules || 'No schedules available for your category.'}
                </p>
              )}
            </div>
          </div>

          <div
            className={`rounded-3xl shadow-2xl p-8 border relative overflow-hidden ${
              theme === 'light' ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100' : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
            }`}
            style={cardStyle}
          >
            <h3 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
              {t.recentActivities || 'Recent Activities'} ({recentActivities.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-max">
                <thead>
                  <tr
                    className={`border-b ${theme === 'light' ? 'border-blue-100 text-blue-500' : 'border-teal-800 text-teal-400'}`}
                  >
                    <th className="py-4 px-2">{t.activity || 'Activity'}</th>
                    <th className="py-4 px-2">{t.date || 'Date'}</th>
                    <th className="py-4 px-2">{t.trainer || 'Trainer'}</th>
                    <th className="py-4 px-2">{t.status || 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity: Activity) => {
                      const statusColor = activity.status === (t.completed || 'Completed') 
                        ? (theme === 'light' ? 'text-teal-600' : 'text-teal-300')
                        : (theme === 'light' ? 'text-yellow-500' : 'text-yellow-400');
                      return (
                        <tr
                          key={activity.id}
                          className={`border-b ${
                            theme === 'light' ? 'border-blue-100 hover:bg-teal-50' : 'border-teal-800 hover:bg-teal-900'
                          } transition-colors duration-300`}
                        >
                          <td className="py-4 px-2">{activity.activity || t.yogaClass || 'Yoga Class'}</td>
                          <td className="py-4 px-2">{activity.date ? new Date(activity.date).toLocaleDateString() : '2025-06-24'}</td>
                          <td className="py-4 px-2">{activity.trainer || t.yogaInstructor || 'Sarah Johnson'}</td>
                          <td className="py-4 px-2">
                            <span className={statusColor}>{activity.status || t.completed || 'Completed'}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className={`py-8 text-center ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                        {t.noActivities || 'No recent activities found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}