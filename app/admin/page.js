"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, UserPlus, Menu, X, Dumbbell, Users, Calendar, BarChart, Settings, LogOut, Sun, Moon, Search, Upload } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

const navItems = [
  { name: 'Dashboard', icon: BarChart, href: '/admin' },
  { name: 'Members', icon: Users, href: '/members' },
  { name: 'Schedules', icon: Calendar, href: '/schedules' },
  { name: 'Workouts', icon: Dumbbell, href: '/workouts' },
  { name: 'Settings', icon: Settings, href: '/settings' },
  { name: 'Logout', icon: LogOut },
];

interface VideoFormData {
  title: string;
  description: string;
  category: string;
  file: FileList;
}

export default function GymDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(4);
  const [messages, setMessages] = useState(7);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<VideoFormData>();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleContrast = () => setIsHighContrast(!isHighContrast);
  const handleLogout = () => {
    router.push('/');
  };

  const openUploadModal = () => {
    setIsUploadModalOpen(true);
    setUploadStatus(null);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    reset();
    setUploadStatus(null);
  };

  const onSubmit = async (data: VideoFormData) => {
    const formData = new FormData();
    formData.append('file', data.file[0]);
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);

    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadStatus({ type: 'success', message: 'Video uploaded successfully!' });
      setTimeout(closeUploadModal, 2000);
    } catch (error) {
      setUploadStatus({ type: 'error', message: error.message || 'Failed to upload video' });
    }
  };

  return (
    <div className={`flex h-screen ${isHighContrast ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} font-sans transition-colors duration-300`}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 ${
          isHighContrast ? 'bg-gray-800' : 'bg-gradient-to-b from-indigo-800 to-indigo-600'
        } text-white shadow-2xl transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-5 border-b border-indigo-500/50">
          <div className="flex items-center space-x-3">
            <Dumbbell size={30} className="text-white" />
            <h1 className="text-xl font-bold tracking-tight">Gym House Admin</h1>
          </div>
          <button className="text-white hover:text-indigo-200" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-3">
          {navItems.map((item) => (
            item.name === 'Logout' ? (
              <button
                key={item.name}
                onClick={handleLogout}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isHighContrast ? 'hover:bg-gray-700 hover:text-white' : 'hover:bg-indigo-700 hover:text-white'
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
                  isHighContrast ? 'hover:bg-gray-700 hover:text-white' : 'hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.name}</span>
              </Link>
            )
          ))}
          <button
            onClick={toggleContrast}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isHighContrast ? 'hover:bg-gray-700' : 'hover:bg-indigo-700'
            }`}
          >
            {isHighContrast ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
            <span>{isHighContrast ? 'Light Mode' : 'High Contrast'}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header
          className={`${
            isHighContrast ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } shadow-md p-5 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300`}
        >
          <div className="flex items-center">
            <button
              className={`mr-4 ${isHighContrast ? 'text-gray-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-2xl font-semibold tracking-tight">Gym Dashboard</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search
                size={24}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isHighContrast ? 'text-gray-300' : 'text-gray-600'
                }`}
              />
              <input
                type="text"
                placeholder="Search members, classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg ${
                  isHighContrast ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
              />
            </div>
            <div className="relative group">
              <Bell
                size={24}
                className={`${
                  isHighContrast ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
                } cursor-pointer transition-colors duration-200`}
              />
              {notifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {notifications}
                </span>
              )}
              <div
                className={`absolute right-0 mt-3 w-64 ${
                  isHighContrast ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'
                } rounded-lg shadow-xl hidden group-hover:block z-10 transition-opacity duration-200`}
              >
                <div className="p-3 text-sm border-b">New member registrations</div>
                <div className="p-3 text-sm">Equipment maintenance alert</div>
              </div>
            </div>
            <div className="relative group">
              <MessageSquare
                size={24}
                className={`${
                  isHighContrast ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
                } cursor-pointer transition-colors duration-200`}
              />
              {messages > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {messages}
                </span>
              )}
              <div
                className={`absolute right-0 mt-3 w-64 ${
                  isHighContrast ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'
                } rounded-lg shadow-xl hidden group-hover:block z-10 transition-opacity duration-200`}
              >
                <div className="p-3 text-sm border-b">New message from trainer</div>
                <div className="p-3 text-sm">Member feedback</div>
              </div>
            </div>
            <button
              onClick={openUploadModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isHighContrast ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Upload size={20} className="mr-2" />
              Upload Video
            </button>
            <Link href="/register">
              <button
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isHighContrast ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <UserPlus size={20} className="mr-2" />
                Register Member
              </button>
            </Link>
          </div>
        </header>

        {/* Upload Video Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`${
                isHighContrast ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } rounded-xl p-8 w-full max-w-md shadow-2xl relative transition-colors duration-300`}
            >
              <button
                onClick={closeUploadModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-semibold mb-6">Upload Workout Video</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Video Title</label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required', maxLength: { value: 100, message: 'Title must be under 100 characters' } })}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isHighContrast ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={4}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isHighContrast ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isHighContrast ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
                    <option value="">Select a category</option>
                    <option value="Karate">Karate</option>
                    <option value="Gym">Gym</option>
                    <option value="Aerobics">Aerobics</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video File</label>
                  <input
                    type="file"
                    {...register('file', {
                      required: 'Video file is required',
                      validate: {
                        acceptedFormats: (value) =>
                          ['video/mp4', 'video/mov', 'video/webm'].includes(value[0]?.type) ||
                          'Only MP4, MOV, or WEBM formats are allowed',
                        sizeLimit: (value) => value[0]?.size <= 1000000000 || 'File size must be under 1GB',
                      },
                    })}
                    accept="video/mp4,video/mov,video/webm"
                    className={`w-full px-3 py-2 rounded-lg ${
                      isHighContrast ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.file && (
                    <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>
                  )}
                </div>
                {uploadStatus && (
                  <p className={`text-sm ${uploadStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {uploadStatus.message}
                  </p>
                )}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isHighContrast ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    } transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isHighContrast ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    } transition-colors duration-200`}
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Stats Cards */}
          <div
            className={`grid ${
              isSidebarOpen ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            } gap-6 mb-10 transition-all duration-300`}
          >
            {[
              { title: 'Active Members', value: '1,567', change: '+12% this month' },
              { title: 'Classes Today', value: '24', change: '+3 from yesterday' },
              { title: 'New Signups', value: '45', change: '+15% this week' },
              { title: 'Revenue', value: '$8,920', change: '+7% this month' },
            ].map((stat, index) => (
              <div
                key={index}
                className={`${
                  isHighContrast ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
                } rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border`}
              >
                <h3 className="text-lg font-semibold">{stat.title}</h3>
                <p
                  className={`text-3xl font-bold mt-2 ${isHighContrast ? 'text-indigo-300' : 'text-indigo-600'}`}
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
              isHighContrast ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
            } rounded-xl shadow-lg p-6 mb-10 transition-colors duration-300 border`}
          >
            <h3 className="text-xl font-semibold mb-6">Today’s Workout Schedule</h3>
            <div
              className={`grid ${
                isSidebarOpen ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              } gap-4 transition-all duration-300`}
            >
              {[
                { title: 'Yoga Class', time: '9:00 AM - 10:00 AM', instructor: 'Sarah Johnson' },
                { title: 'Strength Training', time: '11:00 AM - 12:00 PM', instructor: 'Mike Brown' },
                { title: 'Spin Class', time: '6:00 PM - 7:00 PM', instructor: 'Emily Davis' },
              ].map((schedule, index) => (
                <div
                  key={index}
                  className={`${
                    isHighContrast ? 'border-gray-600' : 'border-gray-200'
                  } border rounded-lg p-5 hover:bg-opacity-10 hover:bg-indigo-500 transition-all duration-200`}
                >
                  <h4 className="font-semibold text-lg">{schedule.title}</h4>
                  <p className="text-sm text-gray-500">{schedule.time}</p>
                  <p className="text-sm text-gray-600">Instructor: {schedule.instructor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Members Table */}
          <div
            className={`${
              isHighContrast ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
            } rounded-xl shadow-lg p-6 transition-colors duration-300 border`}
          >
            <h3 className="text-xl font-semibold mb-6">Recent Members</h3>
            <table className="w-full text-left">
              <thead>
                <tr
                  className={`border-b ${
                    isHighContrast ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <th className="py-4 px-2">Name</th>
                  <th className="py-4 px-2">Email</th>
                  <th className="py-4 px-2">Membership</th>
                  <th className="py-4 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: 'Alex Carter',
                    email: 'alex@example.com',
                    membership: 'Premium',
                    status: 'Active',
                    statusColor: 'text-green-500',
                  },
                  {
                    name: 'Lisa Wong',
                    email: 'lisa@example.com',
                    membership: 'Basic',
                    status: 'Pending',
                    statusColor: 'text-yellow-500',
                  },
                  {
                    name: 'Tom Harris',
                    email: 'tom@example.com',
                    membership: 'Premium',
                    status: 'Active',
                    statusColor: 'text-green-500',
                  },
                ].map((member, index) => (
                  <tr
                    key={index}
                    className={`border-b ${
                      isHighContrast ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                    } transition-colors duration-200`}
                  >
                    <td className="py-4 px-2">{member.name}</td>
                    <td className="py-4 px-2">{member.email}</td>
                    <td className="py-4 px-2">{member.membership}</td>
                    <td className="py-4 px-2">
                      <span className={member.statusColor}>{member.status}</span>
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