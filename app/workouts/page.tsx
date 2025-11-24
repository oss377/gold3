'use client';

import { useState, useEffect, useContext } from 'react';
import { db } from '../fconfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiArrowRight, FiArrowLeft, FiMonitor, FiSquare, FiX, FiChevronDown, FiChevronUp, FiMenu } from 'react-icons/fi';
import { ThemeContext } from '../../context/ThemeContext';

// Define types for video data
interface Video {
  id: string;
  category: string;
  title?: string;
  description?: string;
  channel?: string;
  videoUrl: string;
  thumbnail?: string;
  views: string;
  duration: string;
}

export default function VideoFetch() {
  const [loading, setLoading] = useState<boolean>(true);
  const [videos, setVideos] = useState<Record<string, Video[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const { theme } = useContext(ThemeContext);

  const getRandomViews = (): string => {
    const views = Math.floor(Math.random() * 1000000) + 1000;
    return views > 1000000 ? `${(views / 1000000).toFixed(1)}M` :
           views > 1000 ? `${(views / 1000).toFixed(1)}K` : views.toString();
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'videos'));
        const fetchedVideos: Video[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          category: doc.data().category || 'uncategorized',
          views: getRandomViews(),
          duration: formatDuration(Math.floor(Math.random() * 300) + 60),
        } as Video));

        const groupedVideos = fetchedVideos.reduce((acc: Record<string, Video[]>, video: Video) => {
          const category = video.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(video);
          return acc;
        }, {});

        setVideos(groupedVideos);
        setCategories(Object.keys(groupedVideos).sort());

      } catch (error: unknown) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllVideos();
  }, []);

  const displayedVideos = currentCategory
    ? videos[currentCategory] || []
    : Object.values(videos).flat();


  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'} flex flex-col md:flex-row`}>
      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full w-64 ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        } transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 z-50 shadow-lg md:shadow-none`}
      >
        <div className="p-4">
          <button
            className="md:hidden mb-4 text-2xl"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FiX />
          </button>
          <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Categories
          </h2>
          <ul>
            {categories.map((category) => (
              <li key={category} className="mb-2">
                
                <button
                  onClick={() => {
                    setCurrentCategory(category);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    currentCategory === category
                      ? theme === 'light'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-blue-700 text-white'
                      : theme === 'light'
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {currentCategory
                ? `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Workouts`
                : 'All Workout Videos'}
            </h1>
            <button
              className="md:hidden text-2xl"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <FiMenu />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className={`w-full aspect-video rounded-lg ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'}`}></div>
                  <div className="mt-3 space-y-2">
                    <div className={`h-5 w-3/4 rounded ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'}`}></div>
                    <div className={`h-4 w-full rounded ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {(currentCategory ? [currentCategory] : categories).map((category) => (
                <div key={category} className="mb-8">
                  {!currentCategory && (
                    <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {(videos[category] || []).map((video: Video) => (
                      <div
                        key={video.id}
                        className={`rounded-xl overflow-hidden shadow-lg ${
                          theme === 'light' ? 'bg-white' : 'bg-gray-800'
                        }`}
                      >
                        <div className="relative w-full aspect-video bg-black">
                          <video
                            src={video.videoUrl}
                            className="w-full h-full object-contain"
                            poster={video.thumbnail || ''}
                            controls
                            preload="auto"
                          />
                        </div>

                        <div className="p-4">
                          <h3 className={`text-lg font-semibold ${
                            theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>{video.title || 'Untitled Video'}</h3>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {video.channel || 'Channel Name'} • {video.views} views • 2 days ago
                          </p>
                          {video.description && (
                            <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{video.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}