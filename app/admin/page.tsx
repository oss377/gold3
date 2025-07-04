"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Users,
  Calendar,
  BarChart,
  Settings,
  LogOut,
  Sun,
  Moon,
  Upload,
  UserPlus,
  Menu,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import VideoUploadModal from "../../components/VideoUploadModal";
import RegisterMember from "../../components/RegisterMember";
import DataFetcher from "../../components/DataFetcher";
import Messages from "../../components/Messages";
import Notifications from "../../components/Notifications";
import SearchComponent from "../../components/SearchComponent";
import UploadSchedule from "../../components/UploadSchedule";

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

export default function GymDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<number>(0);
  const [messages, setMessages] = useState<number>(0);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const router = useRouter();

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/admin", icon: BarChart },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Classes", href: "/admin/classes", icon: Calendar },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Logout", icon: LogOut },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleContrast = () => setIsHighContrast(!isHighContrast);
  const handleLogout = () => router.push("/");
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const openRegisterModal = () => setIsRegisterModalOpen(true);
  const closeRegisterModal = () => setIsRegisterModalOpen(false);
  const openScheduleModal = () => setIsScheduleModalOpen(true);
  const closeScheduleModal = () => setIsScheduleModalOpen(false);
  const refreshData = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div
      className={`flex h-screen ${
        isHighContrast ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } font-sans transition-colors duration-300`}
    >
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 ${
          isHighContrast ? "bg-gray-800" : "bg-gradient-to-b from-indigo-800 to-indigo-600"
        } text-white shadow-2xl transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-5 border-b border-indigo-500/50">
          <div className="flex items-center space-x-3">
            <Dumbbell size={30} className="text-white" />
            <h1 className="text-xl font-bold tracking-tight">ADMIN DASHBOARD</h1>
          </div>
          <button className="text-white hover:text-indigo-200" onClick={toggleSidebar}>
            <XCircle size={24} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-3">
          {navItems.map((item) =>
            item.name === "Logout" ? (
              <button
                key={item.name}
                onClick={handleLogout}
                className={`flex items-center w-64 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isHighContrast ? "hover:bg-gray-700 hover:text-white" : "hover:bg-indigo-700 hover:text-white"
                }`}
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href ?? "#"}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isHighContrast ? "hover:bg-gray-700 hover:text-white" : "hover:bg-indigo-700 hover:text-white"
                }`}
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.name}</span>
              </Link>
            )
          )}
          <button
            onClick={toggleContrast}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isHighContrast ? "hover:bg-gray-700" : "hover:bg-indigo-700"
            }`}
          >
            {isHighContrast ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
            <span>{isHighContrast ? "Light Mode" : "High Contrast"}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header */}
        <header
          className={`${
            isHighContrast ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          } shadow-md p-5 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300`}
        >
          <div className="flex items-center">
            <button
              className={`mr-4 ${
                isHighContrast ? "text-gray-300 hover:text-white" : "text-indigo-600 hover:text-indigo-800"
              }`}
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <XCircle size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-2xl font-semibold tracking-tight">ADMIN DASHBOARD</h2>
          </div>
          <div className="flex items-center space-x-6">
            <Notifications
              isHighContrast={isHighContrast}
              notificationCount={notifications}
              setNotificationCount={setNotifications}
            />
            <Messages
              isHighContrast={isHighContrast}
              messageCount={messages}
              setMessageCount={setMessages}
            />
            <button
              onClick={openUploadModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isHighContrast ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Upload size={20} className="mr-2" />
              Upload Video
            </button>
            <button
              onClick={openRegisterModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isHighContrast ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <UserPlus size={20} className="mr-2" />
              Register Member
            </button>
            <button
              onClick={openScheduleModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isHighContrast ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Calendar size={20} className="mr-2" />
              Upload Schedule
            </button>
          </div>
        </header>

        {/* Video Upload Modal */}
        <VideoUploadModal isOpen={isUploadModalOpen} onClose={closeUploadModal} isHighContrast={isHighContrast} />

        {/* Register Member Modal */}
        <RegisterMember isOpen={isRegisterModalOpen} onClose={closeRegisterModal} isHighContrast={isHighContrast} />

        {/* Schedule Upload Modal */}
        <UploadSchedule isOpen={isScheduleModalOpen} onClose={closeScheduleModal} isHighContrast={isHighContrast} />

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Search Component */}
          <SearchComponent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isHighContrast={isHighContrast}
          />

          {/* Stats Cards */}
          <div
            className={`grid ${
              isSidebarOpen ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            } gap-6 mb-10 transition-all duration-300`}
          >
            {[
              { title: "Active Members", value: "1,567", change: "+12% this month" },
              { title: "Classes Today", value: "24", change: "+3 from yesterday" },
              { title: "New Signups", value: "45", change: "+15% this week" },
              { title: "Revenue", value: "$8,920", change: "+7% this month" },
            ].map((stat, index) => (
              <div
                key={index}
                className={`${
                  isHighContrast ? "bg-gray-800 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"
                } rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border`}
              >
                <h3 className="text-lg font-semibold">{stat.title}</h3>
                <p
                  className={`text-3xl font-bold mt-2 ${isHighContrast ? "text-indigo-300" : "text-indigo-600"}`}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Workout Schedule */}
          <div
            className={`${
              isHighContrast ? "bg-gray-800 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"
            } rounded-xl shadow-lg p-6 mb-10 transition-colors duration-300 border`}
          >
            <h3 className="text-xl font-semibold mb-6">Today's Workout Schedule</h3>
            <div
              className={`grid ${
                isSidebarOpen ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              } gap-4 transition-all duration-300`}
            >
              {[
                { title: "Yoga Class", time: "9:00 AM - 10:00 AM", instructor: "Sarah Johnson" },
                { title: "Strength Training", time: "11:00 AM - 12:00 PM", instructor: "Mike Brown" },
                { title: "Spin Class", time: "6:00 PM - 7:00 PM", instructor: "Emily Davis" },
              ].map((schedule, index) => (
                <div
                  key={index}
                  className={`${
                    isHighContrast ? "border-gray-600" : "border-gray-200"
                  } border rounded-lg p-5 hover:bg-opacity-10 hover:bg-indigo-500 transition-all duration-200`}
                >
                  <h4 className="font-semibold text-lg">{schedule.title}</h4>
                  <p className="text-sm text-gray-500">{schedule.time}</p>
                  <p className="text-sm text-gray-600">Instructor: {schedule.instructor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Member Tables */}
          <DataFetcher
            refreshTrigger={refreshTrigger}
            searchQuery={searchQuery}
            isHighContrast={isHighContrast}
          />
        </main>
      </div>
    </div>
  );
}