'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Users,
  Calendar,
  BarChart,
  Settings,
  LogOut,
  Upload,
  UserPlus,
  Menu,
  XCircle,
  Sun,
  Moon,
  Globe,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../fconfig';
import VideoUploadModal from '../../components/VideoUploadModal';
import RegisterMember from '../../components/RegisterMember';
import UploadSchedule from '../../components/UploadSchedule';
import { ScheduleFetcher } from '../../components/adminschedual';
import DataFetcher from '../../components/DataFetcher';
import Notifications from '../../components/Notifications';
import SearchComponent from '../../components/SearchComponent';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

// Interface for Translation
interface Translation {
  dashboard?: string;
  members?: string;
  classes?: string;
  settings?: string;
  logout?: string;
  adminDashboard?: string;
  darkMode?: string;
  uploadVideo?: string;
  registerMember?: string;
  uploadSchedule?: string;
  activeMembers?: string;
  classesToday?: string;
  newSignups?: string;
  revenue?: string;
  changeMembers?: string;
  changeClasses?: string;
  changeSignups?: string;
  changeRevenue?: string;
  permissionDenied?: string;
  fetchSchedulesError?: string;
  fetchStatsError?: string;
  todaysSchedule?: string;
  loading?: string;
  noSchedules?: string;
  instructor?: string;
  statsOverview?: string;
  welcome?: string;
}

// Interface for Schedule
interface Schedule {
  title: string;
  time: string;
  instructor: string;
  date: string;
}

// Interface for NavItem
interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

export default function GymDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [hasStats, setHasStats] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('Admin');
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { language, toggleLanguage, t } = useContext(LanguageContext);

  const fallbackRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const validateSessionAndFetchUser = async () => {
      try {
        const response = await fetch('/api/adminvaldation', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const { error } = await response.json();
          console.error('Session validation failed:', error || t.permissionDenied || 'Please log in to access this page');
          toast.error(error || t.permissionDenied || 'Please log in to access this page');
          router.push('/login');
          return;
        }

        const data = await response.json();
        const email = data.email || 'Unknown';
        setIsAuthorized(true);

        // Fetch user data from GYM collection
        const userRef = doc(db, 'GYM', email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.firstName || 'Admin');
          console.log('User firstName fetched:', userData.firstName);
        } else {
          console.warn('User data not found in GYM collection for:', email);
          setUserName('Admin');
          toast.warn(t.userDataNotFound || 'User data not found. Please contact support.');
        }
      } catch (error: any) {
        console.error('Session validation or user data fetch error:', error.message);
        toast.error(t.permissionDenied || 'Please log in to access this page');
        router.push('/login');
      }
    };

    validateSessionAndFetchUser();
  }, [router, t]);

  const navItems: NavItem[] = [
    { name: t['dashboard'] || 'Dashboard', href: '/admin', icon: BarChart },
    { name: t['members'] || 'Members', href: '/admin/members', icon: Users },
    { name: t['classes'] || 'Classes', href: '/admin/classes', icon: Calendar },
    { name: t['settings'] || 'Settings', href: '/admin/settings', icon: Settings },
    { name: t['logout'] || 'Logout', icon: LogOut },
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
        toast.success(t.logoutSuccess || 'Logged out successfully');
        router.push('/');
      } else {
        toast.error(t.logoutError || 'Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t.logoutError || 'An error occurred during logout.');
    }
  };

  const handleMessageClick = () => {
    router.push('/adminMessage');
  };

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const openRegisterModal = () => setIsRegisterModalOpen(true);
  const closeRegisterModal = () => setIsRegisterModalOpen(false);
  const openScheduleModal = () => setIsScheduleModalOpen(true);
  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    refreshData();
  };
  const refreshData = () => setRefreshTrigger((prev) => prev + 1);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-100 bg-opacity-50">
        <div className="text-center">
          <p className="text-lg text-blue-700">{t.loading || 'Validating session...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen font-sans transition-colors duration-500 relative ${
        theme === 'light' ? 'bg-blue-50 bg-opacity-30' : 'bg-blue-950 bg-opacity-50'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M29 58C13.536 58 1 45.464 1 30 1 14.536 13.536 2 29 2c8.467 0 16.194 3.832 21.213 10.106C55.232 18.38 58 25.534 58 33c0 7.466-2.768 14.62-7.787 20.894C45.194 54.168 37.467 58 29 58z' fill='%23${theme === 'light' ? 'a3bffa' : '2a4365'}' fill-opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transform transition-transform duration-500 ease-in-out ${
          theme === 'light'
            ? 'bg-gradient-to-b from-blue-100 to-teal-100 text-blue-900'
            : 'bg-gradient-to-b from-blue-900 to-teal-900 text-white'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === 'light' ? 'border-blue-200' : 'border-blue-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <img
                src="/gym-logo.png"
                alt="Gym Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (fallbackRef.current) fallbackRef.current.style.display = 'block';
                }}
              />
              <Dumbbell
                ref={fallbackRef}
                size={32}
                className={`${theme === 'light' ? 'text-teal-600' : 'text-teal-300'} hidden`}
              />
            </div>
            <h1
              className={`text-2xl font-extrabold tracking-tight ${
                theme === 'light' ? 'text-blue-900' : 'text-white'
              }`}
            >
              Workout App
            </h1>
          </div>
          <button
            className={theme === 'light' ? 'text-blue-600 hover:text-blue-900' : 'text-blue-300 hover:text-white'}
            onClick={toggleSidebar}
          >
            <XCircle size={28} />
          </button>
        </div>
        <nav className="mt-8 space-y-3 px-4">
          {navItems.map((item) =>
            item.name === (t['logout'] || 'Logout') ? (
              <button
                key={item.name}
                onClick={handleLogout}
                className={`flex items-center w-full px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
                }`}
              >
                <item.icon
                  size={22}
                  className={`mr-4 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                />
                <span>{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href ?? '#'}
                className={`flex items-center px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon
                  size={22}
                  className={`mr-4 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                />
                <span>{item.name}</span>
              </Link>
            )
          )}
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
            }`}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon size={22} className="mr-4 text-teal-600" />
            ) : (
              <Sun size={22} className="mr-4 text-teal-300" />
            )}
            <span>{t['darkMode'] || 'Dark Mode'}</span>
          </button>
          <button
            onClick={toggleLanguage}
            className={`flex items-center w-full px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
            }`}
            aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
          >
            <Globe size={22} className={`mr-4 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-500 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}
      >
        {/* Header */}
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
            >
              {isSidebarOpen ? <XCircle size={28} /> : <Menu size={28} />}
            </button>
            <h2
              className={`text-3xl font-extrabold tracking-tight ${
                theme === 'light' ? 'text-blue-900' : 'text-white'
              }`}
            >
              {t['adminDashboard'] || 'Gym Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {/* @ts-ignore */}
            <Notifications
              notificationCount={notifications}
              setNotificationCount={setNotifications}
              theme={theme}
              t={t}
            />
            <button
              onClick={handleMessageClick}
              className={`p-2 rounded-2xl transition-all hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'text-teal-600 hover:bg-teal-100' : 'text-teal-300 hover:bg-teal-800'
              }`}
              aria-label={t.messages || 'Messages'}
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button
              onClick={openUploadModal}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
              }`}
            >
              <Upload size={20} className="mr-2" />
              {t['uploadVideo'] || 'Upload Video'}
            </button>
            <button
              onClick={openRegisterModal}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
              }`}
            >
              <UserPlus size={20} className="mr-2" />
              {t['registerMember'] || 'Register Member'}
            </button>
            <button
              onClick={openScheduleModal}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
              }`}
            >
              <Calendar size={20} className="mr-2" />
              {t['uploadSchedule'] || 'Upload Schedule'}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-2xl transition-all hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'text-teal-600 hover:bg-teal-100' : 'text-teal-300 hover:bg-teal-800'
              }`}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            </button>
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-2xl transition-all hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'text-teal-600 hover:bg-teal-100' : 'text-teal-300 hover:bg-teal-800'
              }`}
              aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Globe className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Modals */}
        {/* @ts-ignore */}
        <VideoUploadModal isOpen={isUploadModalOpen} onClose={closeUploadModal} theme={theme} t={t} />
        {/* @ts-ignore */}
        <RegisterMember isOpen={isRegisterModalOpen} onClose={closeRegisterModal} theme={theme} t={t} />
        {/* @ts-ignore */}
        <UploadSchedule
          isOpen={isScheduleModalOpen}
          onClose={closeScheduleModal}
          theme={theme}
          t={t}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 p-8 overflow-y-auto ${
            theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-teal-50 text-blue-900' : 'bg-gradient-to-br from-blue-950 to-teal-950 text-white'
          }`}
        >
          {/* Welcome Card with Background Image */}
          <div
            className={`rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden ${
              theme === 'light' ? 'bg-blue-900 text-white' : 'bg-blue-800 text-white'
            }`}
            style={{
              backgroundImage: `url('/fitness-journey-bg.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: theme === 'light' ? 'overlay' : 'soft-light',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-teal-700/70 z-0"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">{t.welcome || 'Welcome'}, {userName}!</h2>
              <p className="text-lg opacity-90">{t.welcomeMessage || 'Track progress, manage members, and grow your fitness community'}</p>
              <button className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded-2xl transition-all duration-300 hover:scale-105">
                {t.getStarted || 'Get Started'}
              </button>
            </div>
          </div>

          {/* Search Component */}
          {/* @ts-ignore */}
          <SearchComponent searchQuery={searchQuery} setSearchQuery={setSearchQuery} theme={theme} t={t} />

          {/* Stats Cards or Placeholder */}
          {hasStats ? (
          
            <DataFetcher
              refreshTrigger={refreshTrigger}
              searchQuery={searchQuery}
              theme={theme}
              t={t}
              onStatsFetched={(stats: any) => {
                console.log('Fetched stats:', stats);
              }}
              onStatsStatus={setHasStats}
            />
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12 transition-all duration-500 relative`}
            >
              {[
                { title: t['activeMembers'] || 'Active Members', value: '1,567', change: t['changeMembers'] || '+12% this month', rotation: '-2deg' },
                { title: t['classesToday'] || 'Classes Today', value: '24', change: t['changeClasses'] || '+3 from yesterday', rotation: '2deg' },
                { title: t['newSignups'] || 'New Signups', value: '45', change: t['changeSignups'] || '+15% this week', rotation: '-1deg' },
                { title: t['revenue'] || 'Revenue', value: '$8,920', change: t['changeRevenue'] || '+7% this month', rotation: '1deg' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`rounded-3xl shadow-2xl p-8 hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500 border relative overflow-hidden ${
                    theme === 'light'
                      ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100'
                      : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
                  }`}
                  style={{
                    transform: `rotate(${stat.rotation})`,
                    boxShadow: theme === 'light'
                      ? '0 10px 30px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(59, 130, 246, 0.2)'
                      : '0 10px 30px rgba(45, 212, 191, 0.3), 0 4px 10px rgba(45, 212, 191, 0.2)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z' fill='%23${theme === 'light' ? 'dbeafe' : '1e3a8a'}' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                >
                  <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                    {stat.title}
                  </h3>
                  <p
                    className={`text-4xl font-extrabold mt-3 ${
                      theme === 'light' ? 'text-teal-600' : 'text-teal-300'
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p className={`text-sm mt-3 ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                    {stat.change}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Workout Schedule */}
          <ScheduleFetcher
            refreshTrigger={refreshTrigger}
            theme={theme}
            t={t}
            onSchedulesFetched={setSchedules}
          />

          {/* Quick Actions Section */}
          <div className="mt-12">
            <h3 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
              {t.quickActions || 'Quick Actions'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={openUploadModal}
                className={`p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ${
                  theme === 'light'
                    ? 'bg-white text-blue-900 hover:bg-teal-50'
                    : 'bg-blue-800 text-white hover:bg-blue-700'
                }`}
              >
                <Upload size={40} className="mb-4" />
                <span className="font-semibold">{t['uploadVideo'] || 'Upload Video'}</span>
              </button>
              <button
                onClick={openRegisterModal}
                className={`p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ${
                  theme === 'light'
                    ? 'bg-white text-blue-900 hover:bg-teal-50'
                    : 'bg-blue-800 text-white hover:bg-blue-700'
                }`}
              >
                <UserPlus size={40} className="mb-4" />
                <span className="font-semibold">{t['registerMember'] || 'Register Member'}</span>
              </button>
              <button
                onClick={openScheduleModal}
                className={`p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ${
                  theme === 'light'
                    ? 'bg-white text-blue-900 hover:bg-teal-50'
                    : 'bg-blue-800 text-white hover:bg-blue-700'
                }`}
              >
                <Calendar size={40} className="mb-4" />
                <span className="font-semibold">{t['uploadSchedule'] || 'Upload Schedule'}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}