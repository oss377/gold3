'use client';

import { useState, useEffect, useContext } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import VideoUploadModal from '../../components/VideoUploadModal';
import RegisterMember from '../../components/RegisterMember';
import UploadSchedule from '../../components/UploadSchedule';
import DataFetcher from '../../components/DataFetcher';
import Messages from '../../components/Messages';
import Notifications from '../../components/Notifications';
import SearchComponent from '../../components/SearchComponent';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

export default function GymDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<number>(0);
  const [messages, setMessages] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { language, toggleLanguage, t } = useContext(LanguageContext);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/adminvaldation", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const { error } = await response.json();
          toast.error(error || "Please log in to access this page");
          router.push("/");
          return;
        }

        setIsAuthorized(true);
      } catch (error: any) {
        toast.error("Please log in to access this page");
        router.push("/");
      }
    };

    validateSession();
  }, [router]);

  const navItems: NavItem[] = [
    { name: t.dashboard || 'Dashboard', href: '/admin', icon: BarChart },
    { name: t.members || 'Members', href: '/admin/members', icon: Users },
    { name: t.classes || 'Classes', href: '/admin/classes', icon: Calendar },
    { name: t.settings || 'Settings', href: '/admin/settings', icon: Settings },
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
        toast.success("Logged out successfully");
        router.push("/");
      } else {
        toast.error("Logout failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during logout.");
      console.error("Logout error:", error);
    }
  };
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const openRegisterModal = () => setIsRegisterModalOpen(true);
  const closeRegisterModal = () => setIsRegisterModalOpen(false);
  const openScheduleModal = () => setIsScheduleModalOpen(true);
  const closeScheduleModal = () => setIsScheduleModalOpen(false);
  const refreshData = () => setRefreshTrigger((prev) => prev + 1);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div
      className={`flex h-screen font-sans transition-colors duration-300 ${
        theme === 'light' ? 'bg-zinc-100 text-gray-900' : 'bg-zinc-900 text-white'
      }`}
    >
      {/* Sidebar */}
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
              {t.adminDashboard || 'ADMIN DASHBOARD'}
            </h1>
          </div>
          <button
            className={theme === 'light' ? 'text-zinc-700 hover:text-zinc-900' : 'text-white hover:text-gray-200'}
            onClick={toggleSidebar}
          >
            <XCircle size={24} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-3">
          {navItems.map((item) =>
            item.name === (t.logout || 'Logout') ? (
              <button
                key={item.name}
                onClick={handleLogout}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon
                  size={20}
                  className={`mr-3 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`}
                />
                <span>{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href ?? '#'}
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
            )
          )}
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
            <span>{t.darkMode || 'Dark Mode'}</span>
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

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
      >
        {/* Header */}
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
            >
              {isSidebarOpen ? <XCircle size={24} /> : <Menu size={24} />}
            </button>
            <h2
              className={`text-2xl font-semibold tracking-tight ${
                theme === 'light' ? 'text-zinc-800' : 'text-white'
              }`}
            >
              {t.adminDashboard || 'ADMIN DASHBOARD'}
            </h2>
          </div>
          <div className="flex items-center space-x-6">
            <Notifications
              notificationCount={notifications}
              setNotificationCount={setNotifications}
              theme={theme}
              t={t}
            />
            <Messages
              messageCount={messages}
              setMessageCount={setMessages}
              theme={theme}
              t={t}
            />
            <button
              onClick={openUploadModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <Upload size={20} className="mr-2" />
              {t.uploadVideo || 'Upload Video'}
            </button>
            <button
              onClick={openRegisterModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <UserPlus size={20} className="mr-2" />
              {t.registerMember || 'Register Member'}
            </button>
            <button
              onClick={openScheduleModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <Calendar size={20} className="mr-2" />
              {t.uploadSchedule || 'Upload Schedule'}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                theme === 'light' ? 'text-blue-600 hover:bg-blue-200/50' : 'text-yellow-400 hover:bg-gray-700/50'
              }`}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-lg transition-all ${
                theme === 'light' ? 'text-blue-600 hover:bg-blue-200/50' : 'text-yellow-400 hover:bg-gray-700/50'
              }`}
              aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Video Upload Modal */}
        <VideoUploadModal isOpen={isUploadModalOpen} onClose={closeUploadModal} theme={theme} t={t} />

        {/* Register Member Modal */}
        <RegisterMember isOpen={isRegisterModalOpen} onClose={closeRegisterModal} theme={theme} t={t} />

        {/* Schedule Upload Modal */}
        <UploadSchedule isOpen={isScheduleModalOpen} onClose={closeScheduleModal} theme={theme} t={t} />

        {/* Main Content Area */}
        <main
          className={`flex-1 p-8 overflow-y-auto ${
            theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900' : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white'
          }`}
        >
          {/* Search Component */}
          <SearchComponent searchQuery={searchQuery} setSearchQuery={setSearchQuery} theme={theme} t={t} />

          {/* Stats Cards */}
          <div
            className={`grid ${
              isSidebarOpen ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            } gap-6 mb-10 transition-all duration-300`}
          >
            {[
              { title: t.activeMembers || 'Active Members', value: '1,567', change: t.changeMembers || '+12% this month' },
              { title: t.classesToday || 'Classes Today', value: '24', change: t.changeClasses || '+3 from yesterday' },
              { title: t.newSignups || 'New Signups', value: '45', change: t.changeSignups || '+15% this week' },
              { title: t.revenue || 'Revenue', value: '$8,920', change: t.changeRevenue || '+7% this month' },
            ].map((stat, index) => (
              <div
                key={index}
                className={`rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border ${
                  theme === 'light'
                    ? 'bg-white text-gray-900 border-gray-200'
                    : 'bg-gray-800 text-white border-gray-700'
                }`}
              >
                <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                  {stat.title}
                </h3>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    theme === 'light' ? 'text-blue-600' : 'text-yellow-400'
                  }`}
                >
                  {stat.value}
                </p>
                <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          {/* Workout Schedule */}
          <div
            className={`rounded-xl shadow-lg p-6 mb-10 border ${
              theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700'
            }`}
          >
            <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              {t.todaysSchedule || "Today's Workout Schedule"}
            </h3>
            <div
              className={`grid ${
                isSidebarOpen ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              } gap-4 transition-all duration-300`}
            >
              {[
                { title: t.yogaClass || 'Yoga Class', time: '9:00 AM - 10:00 AM', instructor: t.instructorSarah || 'Sarah Johnson' },
                { title: t.strengthTraining || 'Strength Training', time: '11:00 AM - 12:00 PM', instructor: t.instructorMike || 'Mike Brown' },
                { title: t.spinClass || 'Spin Class', time: '6:00 PM - 7:00 PM', instructor: t.instructorEmily || 'Emily Davis' },
              ].map((schedule, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-5 transition-all duration-200 ${
                    theme === 'light'
                      ? 'border-gray-200 hover:bg-blue-50'
                      : 'border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <h4 className={`font-semibold text-lg ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                    {schedule.title}
                  </h4>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>
                    {schedule.time}
                  </p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-200'}`}>
                    {t.instructor || 'Instructor'}: {schedule.instructor}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Member Tables */}
          <DataFetcher refreshTrigger={refreshTrigger} searchQuery={searchQuery} theme={theme} t={t} />
        </main>
      </div>
    </div>
  );
}