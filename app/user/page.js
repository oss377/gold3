"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageSquare,
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
} from "lucide-react";
import Link from "next/link";

// Navigation items for user dashboard
const navItems = [
  { name: "Dashboard", icon: BarChart, href: "/user" },
  { name: "Schedules", icon: Calendar, href: "/user/schedules" },
  { name: "Workouts", icon: Dumbbell, href: "/user/workouts" },
  { name: "Settings", icon: Settings, href: "/user/settings" },
  { name: "Logout", icon: LogOut },
];

export default function UserDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [messages, setMessages] = useState(5);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Toggle sidebar visibility
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Toggle high contrast mode
  const toggleContrast = () => setIsHighContrast(!isHighContrast);

  // Handle logout
  const handleLogout = () => {
    router.push("/");
  };

  // Handle get consultancy button click
  const handleConsultancy = () => {
    router.push("/consultancy");
  };

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
            <h1 className="text-xl font-bold tracking-tight">Gym House</h1>
          </div>
          <button className="text-white hover:text-indigo-200" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-3">
          {navItems.map((item) =>
            item.name === "Logout" ? (
              <button
                key={item.name}
                onClick={handleLogout}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isHighContrast ? "hover:bg-gray-700 hover:text-white" : "hover:bg-indigo-700 hover:text-white"
                }`}
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
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
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-2xl font-semibold tracking-tight">User Dashboard</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search
                size={24}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isHighContrast ? "text-gray-300" : "text-gray-600"
                }`}
              />
              <input
                type="text"
                placeholder="Search classes, trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg ${
                  isHighContrast
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-gray-900 border-gray-300"
                } border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
              />
            </div>
            <div className="relative group">
              <Bell
                size={24}
                className={`${
                  isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-indigo-600"
                } cursor-pointer transition-colors duration-200`}
              />
              {notifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {notifications}
                </span>
              )}
              <div
                className={`absolute right-0 mt-3 w-64 ${
                  isHighContrast ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                } rounded-lg shadow-xl hidden group-hover:block z-10 transition-opacity duration-200`}
              >
                <div className="p-3 text-sm border-b">New class schedule added</div>
                <div className="p-3 text-sm">Trainer feedback received</div>
              </div>
            </div>
            <div className="relative group">
              <MessageSquare
                size={24}
                className={`${
                  isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-indigo-600"
                } cursor-pointer transition-colors duration-200`}
              />
              {messages > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {messages}
                </span>
              )}
              <div
                className={`absolute right-0 mt-3 w-64 ${
                  isHighContrast ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                } rounded-lg shadow-xl hidden group-hover:block z-10 transition-opacity duration-200`}
              >
                <div className="p-3 text-sm border-b">Message from trainer</div>
                <div className="p-3 text-sm">Class reminder</div>
              </div>
            </div>
            <button
              onClick={handleConsultancy}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isHighContrast ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Stethoscope size={20} className="mr-2" />
              Get Consultancy
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Stats Cards */}
          <div
            className={`grid ${
              isSidebarOpen ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            } gap-6 mb-10 transition-all duration-300`}
          >
            {[
              { title: "Workouts Completed", value: "128", change: "+5 this week" },
              { title: "Classes Attended", value: "12", change: "+2 this month" },
              { title: "Next Session", value: "Today, 6 PM", change: "Spin Class" },
              { title: "Progress", value: "78%", change: "+10% this month" },
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
            <h3 className="text-xl font-semibold mb-6">Your Workout Schedule</h3>
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

          {/* Recent Activities */}
          <div
            className={`${
              isHighContrast ? "bg-gray-800 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"
            } rounded-xl shadow-lg p-6 transition-colors duration-300 border`}
          >
            <h3 className="text-xl font-semibold mb-6">Recent Activities</h3>
            <table className="w-full text-left">
              <thead>
                <tr
                  className={`border-b ${
                    isHighContrast ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"
                  }`}
                >
                  <th className="py-4 px-2">Activity</th>
                  <th className="py-4 px-2">Date</th>
                  <th className="py-4 px-2">Trainer</th>
                  <th className="py-4 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    activity: "Yoga Class",
                    date: "2025-06-24",
                    trainer: "Sarah Johnson",
                    status: "Completed",
                    statusColor: "text-green-500",
                  },
                  {
                    activity: "Strength Training",
                    date: "2025-06-23",
                    trainer: "Mike Brown",
                    status: "Completed",
                    statusColor: "text-green-500",
                  },
                  {
                    activity: "Spin Class",
                    date: "2025-06-25",
                    trainer: "Emily Davis",
                    status: "Upcoming",
                    statusColor: "text-yellow-500",
                  },
                ].map((activity, index) => (
                  <tr
                    key={index}
                    className={`border-b ${
                      isHighContrast ? "border-gray-600 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
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