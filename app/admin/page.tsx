'use client';

import { useState, useEffect, useContext, useRef, Dispatch, SetStateAction, useCallback } from 'react';
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
  User,
  ChevronLeft,
  ChevronRight,
  Lock,
  RefreshCw,
  Video,
} from 'lucide-react';
import Link from 'next/link'; 
import { toast } from 'react-toastify';
import { doc, getDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
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
import { Translation } from '../../context/LanguageContext';

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
  subItems?: NavItem[];
  onClick?: () => void;
}

// Interface for Modal Props
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  t: Translation;
}

// Interface for Notifications props
interface NotificationsProps {
  notificationCount: number;
  setNotificationCount: Dispatch<SetStateAction<number>>;
  theme: string;
  t: Translation;
}

// Interface for Video
interface Video {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
}

// Interface for Stats
interface Stats {
  activeMembers: number;
  classesToday: number;
  newSignups: number;
  revenue: number;
}

export default function GymDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<number>(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isMessageOptionsOpen, setIsMessageOptionsOpen] = useState<boolean>(false);
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [activeView, setActiveView] = useState<'dashboard' | 'users' | 'videos'>('dashboard');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    activeMembers: 0,
    classesToday: 3, // Default value
    newSignups: 0,
    revenue: 0, // Placeholder
  });
  const [hasStats, setHasStats] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('Admin');
  const [userEmail, setUserEmail] = useState<string>('');
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
        setUserEmail(email);
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const gymCollectionRef = collection(db, 'GYM');
        const querySnapshot = await getDocs(gymCollectionRef);

        const totalMembers = querySnapshot.size;

        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        let newSignupsCount = 0;
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.registrationDate) {
            const registrationDate = new Date(data.registrationDate);
            if (registrationDate >= fiveDaysAgo) {
              newSignupsCount++;
            }
          }
        });

        setStats(prevStats => ({ ...prevStats, activeMembers: totalMembers, newSignups: newSignupsCount }));
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load dashboard stats.");
      }
    };
    fetchStats();
  }, []);

  const navItems: NavItem[] = [
    { name: t['dashboard'] || 'Dashboard', href: '/admin', icon: BarChart },
    { name: t['profile'] || 'Profile', href: '/admin/profile', icon: User },
    { 
      name: t['members'] || 'Members', 
      icon: Users, 
      href: '#', 
      onClick: () => setActiveView('users') 
    },
    { name: t.classes || 'Classes', href: '/admin/classes', icon: Calendar },
    { 
      name: t.settings || 'Settings', 
      icon: Settings,
      subItems: [
        { name: theme === 'light' ? (t.darkMode || 'Dark Mode') : (t.lightMode || 'Light Mode'), icon: theme === 'light' ? Moon : Sun },
        { name: language === 'en' ? 'አማርኛ' : 'English', icon: Globe },
      ]
    },
    { name: t['logout'] || 'Logout', icon: LogOut },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleSettingsClick = () => setOpenSettings(!openSettings);
  const toggleSidebarCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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
    setIsMessageOptionsOpen(true);
  };

  const handlePublicMessage = () => {
    try {
      const userData = encodeURIComponent(JSON.stringify({ name: userName, email: userEmail }));
      router.push(`/publicMessage?userData=${userData}`);
      setIsMessageOptionsOpen(false);
    } catch (error) {
      console.error('Navigation to /publicMessage failed:', error);
      toast.error(t.navigationError || 'Failed to navigate to public messages. Please try again.');
    }
  };

  const handlePersonalMessage = () => {
    try {
      router.push('/adminMessage');
      setIsMessageOptionsOpen(false);
    } catch (error) {
      console.error('Navigation to /adminMessage failed:', error);
      toast.error(t.navigationError || 'Failed to navigate to personal messages. Please try again.');
    }
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
        theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${theme === 'light' ? 'dbeafe' : '1e3a8a'}' fill-opacity='0.1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 shadow-2xl transform transition-transform duration-500 ease-in-out ${
          theme === 'light'
            ? 'bg-white text-gray-800'
            : 'bg-gray-800 text-gray-200'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}
        >
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
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
                className={`${theme === 'light' ? 'text-blue-600' : 'text-blue-400'} hidden`}
              />
            </div>
            {!isSidebarCollapsed && (
              <h1
                className={`text-2xl font-extrabold tracking-tight ${
                  theme === 'light' ? 'text-blue-900' : 'text-white'
                }`}
              >
                {t.appTitle || 'Gym Admin'}
              </h1>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={theme === 'light' ? 'text-gray-500 hover:text-gray-800' : 'text-gray-400 hover:text-white'}
              onClick={toggleSidebar}
            >
              <XCircle size={28} />
            </button>
            <button
              className={`p-2 rounded-full transition-all duration-300 hover:scale-105 ${
                theme === 'light' ? 'text-blue-600 hover:bg-gray-100' : 'text-blue-400 hover:bg-gray-700'
              }`}
              onClick={toggleSidebarCollapse}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={24} className="animate-pulse" />
              ) : (
                <ChevronLeft size={24} className="animate-pulse" />
              )}
            </button>
          </div>
        </div>
        <nav
          className={`mt-4 space-y-2 px-2 overflow-y-auto max-h-[calc(100vh-80px)] scrollbar-thin ${
            theme === 'light'
              ? 'scrollbar-thumb-gray-300 scrollbar-track-gray-100'
              : 'scrollbar-thumb-gray-600 scrollbar-track-gray-800'
          }`}
        >
          {navItems.map((item) =>
            item.name === (t['logout'] || 'Logout') ? (
              <button
                key={item.name}
                onClick={handleLogout}
                className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white transform hover:-translate-y-0.5 hover:shadow-lg ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon
                  size={22}
                  className={`${
                    isSidebarCollapsed ? '' : 'mr-3'
                  } transition-colors duration-300 group-hover:text-white ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}
                />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </button>
            ) : item.subItems ? (
              <div key={item.name}>
                <button
                  onClick={handleSettingsClick}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group hover:bg-gradient-to-r hover:from-teal-500 hover:to-blue-500 hover:text-white transform hover:-translate-y-0.5 hover:shadow-lg ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <div className="flex items-center">
                    <item.icon
                      size={22}
                      className={`${
                        isSidebarCollapsed ? '' : 'mr-3'
                      } transition-colors duration-300 group-hover:text-white ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}
                    />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-300 ${openSettings ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>
                {!isSidebarCollapsed && openSettings && (
                  <div className="mt-2 space-y-2 pl-8">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.name}
                        onClick={subItem.name.includes('Mode') ? toggleTheme : toggleLanguage}
                        className={`flex items-center w-full px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group hover:bg-blue-500 hover:text-white ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}
                      >
                        <subItem.icon size={18} className="mr-3" />
                        <span>{subItem.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href ?? '#'}
                className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group hover:bg-gradient-to-r hover:from-teal-500 hover:to-blue-500 hover:text-white transform hover:-translate-y-0.5 hover:shadow-lg ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  setIsSidebarOpen(false);
                }}
              >
                <item.icon
                  size={22}
                  className={`${
                    isSidebarCollapsed ? '' : 'mr-3'
                  } transition-colors duration-300 group-hover:text-white ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}
                />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-500 ${
          isSidebarOpen
            ? isSidebarCollapsed
              ? 'ml-20'
              : 'ml-72'
            : 'ml-0'
        }`}
      >
        {/* Header */}
        <header
          className={`shadow-2xl p-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500 ${
            theme === 'light' 
              ? 'bg-white/80 backdrop-blur-sm text-gray-800' 
              : 'bg-gray-800/80 backdrop-blur-sm text-gray-200'
          }`}
        >
          <div className="flex items-center space-x-4">
            <button
              className={theme === 'light' ? 'text-gray-500 hover:text-gray-800' : 'text-gray-400 hover:text-white'}
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <XCircle size={28} /> : <Menu size={28} />}
            </button>
            <h2
              className={`text-3xl font-extrabold tracking-tight ${
                theme === 'light' ? 'text-blue-900' : 'text-white'
              }`}
            >
              {t.adminDashboard || 'Admin Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <Notifications
              notificationCount={notifications}
              setNotificationCount={setNotifications}
              theme={theme}
              t={t}
            />
            <button
              onClick={handleMessageClick}
              className={`relative p-2 rounded-full transition-all duration-300 ${
                theme === 'light' ? 'text-teal-600 hover:bg-teal-100' : 'text-teal-300 hover:bg-teal-800'
              }`}
              aria-label={t.messages || 'Messages'}
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button
              onClick={openUploadModal}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Upload size={20} className="mr-2" />
              {t.uploadVideo || 'Upload Video'}
            </button>
            <button
              onClick={openRegisterModal}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <UserPlus size={20} className="mr-2" />
              {t.registerMember || 'Register Member'}
            </button>
            <button
              onClick={openScheduleModal}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Calendar size={20} className="mr-2" />
              {t.uploadSchedule || 'Upload Schedule'}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-300 ${
                theme === 'light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-700'
              }`}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            </button>
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-full transition-all duration-300 ${
                theme === 'light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-700'
              }`}
              aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Globe className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Modals */}
        <VideoUploadModal isOpen={isUploadModalOpen} onClose={closeUploadModal} theme={theme} t={t} />
        <RegisterMember isOpen={isRegisterModalOpen} onClose={closeRegisterModal} theme={theme} t={t} />
        <UploadSchedule
          isOpen={isScheduleModalOpen}
          onClose={closeScheduleModal}
          theme={theme}
          t={t}
        />

        {/* Message Options Modal */}
        {isMessageOptionsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMessageOptionsOpen(false)}
          >
            <div
              className={`rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 ${
                theme === 'light'
                  ? 'bg-white text-gray-800'
                  : 'bg-gray-800 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{t.chooseMessageType || 'Choose Message Type'}</h3>
                <button
                  onClick={() => setIsMessageOptionsOpen(false)}
                  className={`${theme === 'light' ? 'text-blue-600 hover:text-blue-900' : 'text-teal-300 hover:text-white'}`}
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handlePublicMessage}
                  className={`flex items-center justify-center p-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-md ${
                    theme === 'light'
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  <Globe size={24} className="mr-3" />
                  {t.publicMessage || 'Public Message'}
                </button>
                <button
                  onClick={handlePersonalMessage}
                  className={`flex items-center justify-center p-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-md ${
                    theme === 'light'
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  <Lock size={24} className="mr-3" />
                  {t.personalMessage || 'Personal Message'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 p-8 overflow-y-auto scroll-smooth ${
            theme === 'light' ? 'text-gray-800' : 'text-gray-200'
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
          <SearchComponent searchQuery={searchQuery} setSearchQuery={setSearchQuery} theme={theme} t={t} />


          {/* Stats Cards or Placeholder */}
          {activeView === 'dashboard' && (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12 transition-all duration-500 relative`}
            >
              {[
                { title: t.activeMembers || 'Active Members', value: stats.activeMembers.toLocaleString(), change: t.changeMembers || '+12% this month' },
                { title: t.classesToday || 'Classes Today', value: stats.classesToday.toString(), change: t.changeClasses || '+3 from yesterday' },
                { title: t.newSignups || 'New Signups', value: stats.newSignups.toString(), change: t.changeSignups || '+15% this week' },
                { title: t.revenue || 'Revenue', value: `$${stats.revenue.toLocaleString()}`, change: t.changeRevenue || '+7% this month' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className={`rounded-2xl shadow-lg p-6 border relative overflow-hidden ${
                    theme === 'light'
                      ? 'bg-white text-gray-800 border-gray-200'
                      : 'bg-gray-800 text-gray-200 border-gray-700'
                  }`}
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
                  <p className={`text-sm mt-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {stat.change}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick Actions Section */}
          <div className="mt-12">
            <h3 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {t.quickActions || 'Quick Actions'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setActiveView('videos')}
                className={`p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ${
                  theme === 'light'
                    ? 'bg-white text-gray-900 hover:bg-gray-50'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                <Video size={40} className="mb-4" />
                <span className="font-semibold">{t.manageVideos || 'Manage Videos'}</span>
              </button>
              <button
                onClick={() => setActiveView('users')}
                className={`p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ${
                  theme === 'light'
                    ? 'bg-white text-gray-900 hover:bg-gray-50'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                <Users size={40} className="mb-4" />
                <span className="font-semibold">{t.manageUsers || 'Manage Users'}</span>
              </button>
            </div>
          </div>

          {/* Conditional content based on activeView */}
          <div className="mt-8">
            {activeView === 'users' && (
              <DataFetcher
                refreshTrigger={refreshTrigger}
                searchQuery={searchQuery}
                theme={theme}
                t={t}
                onStatsFetched={() => {}}
                onStatsStatus={() => {}}
              />
            )}

            {activeView === 'videos' && <ManageVideos theme={theme} t={t} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function ManageVideos({ theme, t }: { theme: 'light' | 'dark'; t: Translation }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'videos'));
      const fetchedVideos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
      setVideos(fetchedVideos);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(t.fetchError || 'Failed to fetch videos.');
      toast.error(t.fetchError || 'Failed to fetch videos.');
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDelete = async (videoId: string) => {
    if (!window.confirm(t.confirmDeleteVideo || 'Are you sure you want to delete this video?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      setVideos(prev => prev.filter(video => video.id !== videoId));
      toast.success(t.deleteSuccessVideo || 'Video deleted successfully.');
    } catch (err) {
      console.error("Error deleting video:", err);
      toast.error(t.deleteErrorVideo || 'Failed to delete video.');
    }
  };

  const handleUpdate = (video: Video) => {
    setEditingVideo(video);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setEditingVideo(null);
  }

  if (isLoading) {
    return <div className="text-center p-8">{t.loading || 'Loading...'}</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <>
      <div className={`rounded-xl shadow-lg p-6 mb-10 border ${theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">{t.manageVideos || 'Manage Videos'}</h3>
          <button
            onClick={fetchVideos}
            className={`flex items-center px-3 py-1 rounded-lg text-sm ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            <RefreshCw size={16} className="mr-1" />
            {t.refresh || 'Refresh'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b ${theme === 'light' ? 'border-gray-200 text-gray-600' : 'border-gray-700 text-gray-400'}`}>
                <th className="py-4 px-2">{t.thumbnail || 'Thumbnail'}</th>
                <th className="py-4 px-2">{t.title || 'Title'}</th>
                <th className="py-4 px-2">{t.category || 'Category'}</th>
                <th className="py-4 px-2">{t.actions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video.id} className={`border-b ${theme === 'light' ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-700/50'} transition-colors duration-200`}>
                  <td className="py-4 px-2">
                    <img src={video.thumbnail || '/placeholder.png'} alt={video.title} className="w-24 h-14 object-cover rounded-md" />
                  </td>
                  <td className="py-4 px-2 font-medium">{video.title}</td>
                  <td className="py-4 px-2">{video.category}</td>
                  <td className="py-4 px-2 flex space-x-2">
                    <button
                      onClick={() => handleUpdate(video)}
                      className={`px-3 py-1 rounded-lg text-sm ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                      {t.update || 'Update'}
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className={`px-3 py-1 rounded-lg text-sm ${theme === 'light' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
                    >
                      {t.delete || 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isUpdateModalOpen && (
        <VideoUploadModal
          isOpen={isUpdateModalOpen}
          onClose={closeUpdateModal}
          theme={theme}
          t={t}
          videoToEdit={editingVideo}
          onVideoUpdated={fetchVideos}
        />
      )}
    </>
  );
}