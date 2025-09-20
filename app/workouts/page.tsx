'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { db } from '../fconfig';
import { collection, getDocs } from 'firebase/firestore';
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

// Define types for component props
interface VideoFetchProps {
  setWorkouts?: React.Dispatch<React.SetStateAction<Record<string, Video[]>>>; // Made optional
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  loading?: boolean;
}

export default function VideoFetch({ setWorkouts, setLoading, loading }: VideoFetchProps) {
  const [videos, setVideos] = useState<Record<string, Video[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [volume, setVolume] = useState<Record<string, number>>({});
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [currentFullScreenVideo, setCurrentFullScreenVideo] = useState<{ id: string; category: string } | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState<Record<string, boolean>>({});
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [isNativeFullScreen, setIsNativeFullScreen] = useState<boolean>(false);
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

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
    const fetchVideos = async () => {
      try {
        setLoading?.(true);
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
          acc[category] = acc[category] || [];
          acc[category].push(video);
          return acc;
        }, {});

        setVideos(groupedVideos);
        setWorkouts?.(groupedVideos);

        const initialStates = fetchedVideos.reduce((acc: {
          playing: Record<string, boolean>;
          volume: Record<string, number>;
          muted: Record<string, boolean>;
          progress: Record<string, number>;
          loaded: Record<string, boolean>;
          videoLoading: Record<string, boolean>;
        }, video: Video) => ({
          playing: { ...acc.playing, [video.id]: false },
          volume: { ...acc.volume, [video.id]: 0.7 },
          muted: { ...acc.muted, [video.id]: false },
          progress: { ...acc.progress, [video.id]: 0 },
          loaded: { ...acc.loaded, [video.id]: false },
          videoLoading: { ...acc.videoLoading, [video.id]: false },
        }), {
          playing: {},
          volume: {},
          muted: {},
          progress: {},
          loaded: {},
          videoLoading: {},
        });

        setPlaying(initialStates.playing);
        setVolume(initialStates.volume);
        setMuted(initialStates.muted);
        setProgress(initialStates.progress);
        setVideoLoaded(initialStates.loaded);
        setVideoLoading(initialStates.videoLoading);
      } catch (error: unknown) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading?.(false);
      }
    };
    fetchVideos();
  }, [setWorkouts, setLoading]);

  const toggleCategoryExpansion = (category: string): void => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleVideoLoaded = (videoId: string): void => {
    setVideoLoaded((prev) => ({ ...prev, [videoId]: true }));
    setVideoLoading((prev) => ({ ...prev, [videoId]: false }));
  };

  const handleVideoLoadStart = (videoId: string): void => {
    setVideoLoading((prev) => ({ ...prev, [videoId]: true }));
  };

  const handleTimeUpdate = (videoId: string): void => {
    const video = videoRefs.current[videoId];
    if (video && !isNaN(video.duration)) {
      const progressPercent = (video.currentTime / video.duration) * 100;
      setProgress((prev) => ({ ...prev, [videoId]: progressPercent }));
    }
  };

  const handlePlayPause = (videoId: string): void => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (playing[videoId]) {
        video.pause();
      } else {
        Object.keys(videoRefs.current).forEach((id) => {
          if (id !== videoId && videoRefs.current[id]) {
            videoRefs.current[id]!.pause();
            setPlaying((prev) => ({ ...prev, [id]: false }));
          }
        });
        video.play().catch((error: unknown) => console.error('Error playing video:', error));
      }
      setPlaying((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
    }
  };

  const handleFullScreen = (videoId: string, category: string): void => {
    const videoElement = videoRefs.current[videoId];
    if (videoElement) {
      setCurrentFullScreenVideo({ id: videoId, category });
      setCurrentCategory(category);
      setIsFullScreen(true);
      setIsSmallScreen(false);
      setIsNativeFullScreen(false);
      setMuted((prev) => ({ ...prev, [videoId]: false }));
      setPlaying((prev) => ({ ...prev, [videoId]: true }));
      videoElement.muted = false;
      videoElement.play().catch((error: unknown) => console.error('Error playing video:', error));
    }
  };

  const handleEnterNativeFullScreen = (videoId: string): void => {
    const videoElement = videoRefs.current[videoId];
    if (videoElement && !document.fullscreenElement) {
      videoElement.requestFullscreen().catch((error: unknown) => console.error('Error entering fullscreen:', error));
      setIsNativeFullScreen(true);
    }
  };

  const handleExitFullScreen = (): void => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((error: unknown) => console.error('Error exiting fullscreen:', error));
    }
    setCurrentFullScreenVideo(null);
    setCurrentCategory(null);
    setIsFullScreen(false);
    setIsSmallScreen(false);
    setIsNativeFullScreen(false);
  };

  const handleToggleSmallScreen = (): void => {
    setIsSmallScreen((prev) => !prev);
  };

  useEffect(() => {
    const handleFullscreenChange = (): void => {
      const inFullscreen = !!document.fullscreenElement;
      setIsNativeFullScreen(inFullscreen);
      document.documentElement.style.cssText = inFullscreen 
        ? 'width: 100%; height: 100%'
        : '';
      
      if (!inFullscreen && currentFullScreenVideo) {
        setCurrentFullScreenVideo(null);
        setCurrentCategory(null);
        setIsFullScreen(false);
        setIsSmallScreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [currentFullScreenVideo]);

  const handleMuteToggle = (videoId: string): void => {
    const video = videoRefs.current[videoId];
    if (video) {
      setMuted((prev) => {
        video.muted = !prev[videoId];
        return { ...prev, [videoId]: !prev[videoId] };
      });
    }
  };

  const handleVolumeChange = (videoId: string, value: string): void => {
    const video = videoRefs.current[videoId];
    if (video) {
      const volumeValue = parseFloat(value);
      setVolume((prev) => {
        video.volume = volumeValue;
        if (volumeValue > 0) {
          video.muted = false;
          setMuted((prev) => ({ ...prev, [videoId]: false }));
        }
        return { ...prev, [videoId]: volumeValue };
      });
    }
  };

  const handleNextVideo = (): void => {
    if (!currentFullScreenVideo || !currentCategory) return;
    const currentVideos = videos[currentCategory];
    const currentIndex = currentVideos.findIndex((video: Video) => video.id === currentFullScreenVideo.id);
    const nextIndex = (currentIndex + 1) % currentVideos.length;
    const nextVideo = currentVideos[nextIndex];

    const currentVideoElement = videoRefs.current[currentFullScreenVideo.id];
    if (currentVideoElement) {
      currentVideoElement.pause();
      setPlaying((prev) => ({ ...prev, [currentFullScreenVideo.id]: false }));
    }

    setCurrentFullScreenVideo({ id: nextVideo.id, category: currentCategory });
    setPlaying((prev) => ({ ...prev, [nextVideo.id]: true }));

    const nextVideoElement = videoRefs.current[nextVideo.id];
    if (nextVideoElement) {
      nextVideoElement.currentTime = 0;
      nextVideoElement.muted = false;
      nextVideoElement.play().catch((error: unknown) => console.error('Error playing video:', error));
    }
  };

  const handlePreviousVideo = (): void => {
    if (!currentFullScreenVideo || !currentCategory) return;
    const currentVideos = videos[currentCategory];
    const currentIndex = currentVideos.findIndex((video: Video) => video.id === currentFullScreenVideo.id);
    const prevIndex = (currentIndex - 1 + currentVideos.length) % currentVideos.length;
    const prevVideo = currentVideos[prevIndex];

    const currentVideoElement = videoRefs.current[currentFullScreenVideo.id];
    if (currentVideoElement) {
      currentVideoElement.pause();
      setPlaying((prev) => ({ ...prev, [currentFullScreenVideo.id]: false }));
    }

    setCurrentFullScreenVideo({ id: prevVideo.id, category: currentCategory });
    setPlaying((prev) => ({ ...prev, [prevVideo.id]: true }));

    const prevVideoElement = videoRefs.current[prevVideo.id];
    if (prevVideoElement) {
      prevVideoElement.currentTime = 0;
      prevVideoElement.muted = false;
      prevVideoElement.play().catch((error: unknown) => console.error('Error playing video:', error));
    }
  };

  const handleVideoClick = (videoId: string): void => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (!videoLoaded[videoId]) {
        video.muted = false;
        setPlaying((prev) => ({ ...prev, [videoId]: true }));
        video.play().catch((error: unknown) => console.error('Error playing video:', error));
      } else {
        handlePlayPause(videoId);
      }
    }
  };

  const handleProgressClick = (videoId: string, e: React.MouseEvent<HTMLDivElement>): void => {
    const video = videoRefs.current[videoId];
    if (video && e.target instanceof HTMLElement) {
      const rect = e.target.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * video.duration;
    }
  };

  const handleVideoHover = (videoId: string, isHover: boolean): void => {
    const video = videoRefs.current[videoId];
    if (video && videoLoaded[videoId]) {
      if (isHover && !playing[videoId]) {
        video.muted = true;
        video.play().catch((error: unknown) => console.error('Error playing preview:', error));
        setPlaying((prev) => ({ ...prev, [videoId]: true }));
      } else if (!isHover && playing[videoId]) {
        video.pause();
        setPlaying((prev) => ({ ...prev, [videoId]: false }));
      }
    }
  };

  const getVideosToDisplay = (category: string): Video[] => {
    const isExpanded = expandedCategories[category];
    return isExpanded ? videos[category] : videos[category]?.slice(0, 4) || [];
  };

  const toggleSidebar = (): void => {
    setIsSidebarOpen((prev) => !prev);
  };

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
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <FiX />
          </button>
          <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Categories
          </h2>
          <ul>
            {Object.keys(videos).map((category) => (
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
                : 'Workout Videos'}
            </h1>
            <button
              className="md:hidden text-2xl"
              onClick={toggleSidebar}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(currentCategory ? getVideosToDisplay(currentCategory) : Object.values(videos).flat()).map((video: Video) => (
                <div
                  key={video.id}
                  className={`group rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg ${
                    theme === 'light' ? 'bg-white' : 'bg-gray-800'
                  }`}
                >
                  <div
                    className="relative aspect-video cursor-pointer"
                    onMouseEnter={() => handleVideoHover(video.id, true)}
                    onMouseLeave={() => handleVideoHover(video.id, false)}
                    onClick={() => handleVideoClick(video.id)}
                    role="button"
                    aria-label={`Play ${video.title || 'video'}`}
                  >
                    {videoLoading[video.id] && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                        <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${
                          theme === 'light' ? 'border-blue-600' : 'border-blue-300'
                        }`}></div>
                      </div>
                    )}

                    <video
                      ref={(el: HTMLVideoElement | null) => {
                        videoRefs.current[video.id] = el;
                      }}
                      src={video.videoUrl}
                      className={`w-full h-full object-cover rounded-t-lg ${
                        videoLoaded[video.id] && playing[video.id] ? 'block' : 'hidden'
                      }`}
                      poster={video.thumbnail || ''}
                      onTimeUpdate={() => handleTimeUpdate(video.id)}
                      onLoadedData={() => handleVideoLoaded(video.id)}
                      onLoadStart={() => handleVideoLoadStart(video.id)}
                      preload="metadata"
                      loop
                      muted={muted[video.id]}
                      controls={false}
                    />
                    {(!videoLoaded[video.id] || !playing[video.id]) && (
                      <div className="absolute inset-0 bg-black/20 rounded-t-lg">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title || 'Video thumbnail'}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FiPlay size={40} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'}`} />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 rounded-t-lg">
                          <FiPlay size={32} className="text-white" />
                        </div>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className={`text-base font-semibold line-clamp-2 ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>{video.title || 'Untitled Video'}</h3>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      {video.channel || 'Channel Name'}
                    </p>
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {video.views} views • 2 days ago
                    </p>
                    <button
                      onClick={() => handleFullScreen(video.id, video.category)}
                      className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                      aria-label="Watch in fullscreen"
                    >
                      Watch Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentFullScreenVideo && currentCategory && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90`} role="dialog" aria-modal="true">
          <div className="relative w-full max-w-6xl flex flex-col gap-4">
            <div className={`relative w-full transition-all duration-300 ${
              isSmallScreen ? 'max-w-3xl max-h-[50vh]' : 'aspect-video max-h-[80vh]'
            }`}>
              {videoLoading[currentFullScreenVideo.id] && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 rounded-xl">
                  <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin ${
                    theme === 'light' ? 'border-blue-600' : 'border-blue-300'
                  }`}></div>
                </div>
              )}

              <video
                ref={(el: HTMLVideoElement | null) => {
                  videoRefs.current[currentFullScreenVideo.id] = el;
                }}
                src={videos[currentCategory]?.find((v: Video) => v.id === currentFullScreenVideo.id)?.videoUrl}
                className="w-full h-full object-contain rounded-xl"
                poster={videos[currentCategory]?.find((v: Video) => v.id === currentFullScreenVideo.id)?.thumbnail || ''}
                onTimeUpdate={() => handleTimeUpdate(currentFullScreenVideo.id)}
                onLoadedData={() => handleVideoLoaded(currentFullScreenVideo.id)}
                onLoadStart={() => handleVideoLoadStart(currentFullScreenVideo.id)}
                onClick={() => handlePlayPause(currentFullScreenVideo.id)}
                preload="auto"
                loop
                muted={muted[currentFullScreenVideo.id]}
                controls={false}
              />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <button
                  onClick={() => handlePlayPause(currentFullScreenVideo.id)}
                  className="text-white text-6xl hover:scale-110 transition-transform duration-300"
                  aria-label={playing[currentFullScreenVideo.id] ? 'Pause video' : 'Play video'}
                >
                  {playing[currentFullScreenVideo.id] ? <FiPause /> : <FiPlay />}
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between z-10">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(currentFullScreenVideo.id);
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                    aria-label={playing[currentFullScreenVideo.id] ? 'Pause video' : 'Play video'}
                  >
                    {playing[currentFullScreenVideo.id] ? <FiPause size={28} /> : <FiPlay size={28} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousVideo();
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                    aria-label="Previous video"
                  >
                    <FiArrowLeft size={28} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextVideo();
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                    aria-label="Next video"
                  >
                    <FiArrowRight size={28} />
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMuteToggle(currentFullScreenVideo.id);
                      }}
                      className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                      aria-label={muted[currentFullScreenVideo.id] || volume[currentFullScreenVideo.id] === 0 ? 'Unmute video' : 'Mute video'}
                    >
                      {muted[currentFullScreenVideo.id] || volume[currentFullScreenVideo.id] === 0 ? (
                        <FiVolumeX size={28} />
                      ) : (
                        <FiVolume2 size={28} />
                      )}
                    </button>
                    {!muted[currentFullScreenVideo.id] && (
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume[currentFullScreenVideo.id] || 0.7}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleVolumeChange(currentFullScreenVideo.id, e.target.value);
                        }}
                        className="w-28 h-1 rounded-lg appearance-none cursor-pointer bg-gray-300"
                        aria-label="Volume control"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSmallScreen();
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                    aria-label={isSmallScreen ? 'Expand video' : 'Shrink video'}
                  >
                    {isSmallScreen ? <FiMaximize size={28} /> : <FiMonitor size={28} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isNativeFullScreen) {
                        handleExitFullScreen();
                      } else {
                        handleEnterNativeFullScreen(currentFullScreenVideo.id);
                      }
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                    aria-label={isNativeFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isNativeFullScreen ? <FiMinimize size={28} /> : <FiSquare size={28} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExitFullScreen();
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                    aria-label="Close video"
                  >
                    <FiX size={28} />
                  </button>
                </div>
              </div>
              <div
                className="absolute bottom-14 left-0 right-0 h-1.5 cursor-pointer bg-gray-300 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProgressClick(currentFullScreenVideo.id, e);
                }}
                role="slider"
                aria-label="Video progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress[currentFullScreenVideo.id] || 0}
              >
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${progress[currentFullScreenVideo.id] || 0}%` }}
                />
              </div>
              <div className="absolute top-4 left-4 text-white text-xl font-bold bg-black/70 px-4 py-2 rounded-lg z-10">
                {videos[currentCategory]?.find((v: Video) => v.id === currentFullScreenVideo.id)?.title || 'Untitled Video'}
              </div>
              <div className="absolute top-4 right-4 text-white text-sm font-semibold bg-black/70 px-3 py-1.5 rounded-lg z-10">
                {formatDuration(videoRefs.current[currentFullScreenVideo.id]?.currentTime || 0)} /{' '}
                {videos[currentCategory]?.find((v: Video) => v.id === currentFullScreenVideo.id)?.duration}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
              <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {videos[currentCategory]?.find((v: Video) => v.id === currentFullScreenVideo.id)?.title || 'Untitled Video'}
              </h3>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {videos[currentCategory]?.find((v: Video) => v.id === currentFullScreenVideo.id)?.channel || 'Channel Name'} • 
                {videos[currentCategory]?.find((v: Video) => v.id === currentFullScreenVideo.id)?.views} views • 2 days ago
              </p>
              {videos[currentCategory]?.find((v: Video) => v.id === currentFullScreenVideo.id)?.description && (
                <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {videos[currentCategory].find((v: Video) => v.id === currentFullScreenVideo.id)?.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}