'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { db } from '../app/fconfig';
import { collection, getDocs } from 'firebase/firestore';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiArrowRight, FiArrowLeft, FiMonitor } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';

export default function VideoFetch({ setWorkouts, setLoading, loading }) {
  const [videos, setVideos] = useState({});
  const [playing, setPlaying] = useState({});
  const [volume, setVolume] = useState({});
  const [muted, setMuted] = useState({});
  const [progress, setProgress] = useState({});
  const [currentFullScreenVideo, setCurrentFullScreenVideo] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const videoRefs = useRef({});
  const { theme } = useContext(ThemeContext);

  const getRandomViews = () => {
    const views = Math.floor(Math.random() * 1000000) + 1000;
    if (views > 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views > 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'videos'));
        const fetchedVideos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          views: getRandomViews(),
          duration: formatDuration(Math.floor(Math.random() * 300) + 60),
        }));

        const groupedVideos = fetchedVideos.reduce((acc, video) => {
          const category = video.category || 'uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(video);
          return acc;
        }, {});

        setVideos(groupedVideos);
        setWorkouts(groupedVideos);

        const initialStates = fetchedVideos.reduce(
          (acc, video) => {
            acc.playing[video.id] = false;
            acc.volume[video.id] = 0.7;
            acc.muted[video.id] = true;
            acc.progress[video.id] = 0;
            acc.loaded[video.id] = false;
            return acc;
          },
          { playing: {}, volume: {}, muted: {}, progress: {}, loaded: {} }
        );

        setPlaying(initialStates.playing);
        setVolume(initialStates.volume);
        setMuted(initialStates.muted);
        setProgress(initialStates.progress);
        setVideoLoaded(initialStates.loaded);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [setWorkouts, setLoading]);

  const handleVideoLoaded = (videoId) => {
    setVideoLoaded((prev) => ({ ...prev, [videoId]: true }));
  };

  const handleTimeUpdate = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      const progressPercent = (video.currentTime / video.duration) * 100;
      setProgress((prev) => ({ ...prev, [videoId]: progressPercent }));
    }
  };

  const handlePlayPause = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (playing[videoId]) {
        video.pause();
      } else {
        video.play().catch((error) => console.error('Error playing video:', error));
      }
      setPlaying((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
    }
  };

  const handleFullScreen = (videoId, category) => {
    const videoElement = videoRefs.current[videoId];
    if (videoElement) {
      setCurrentFullScreenVideo({ id: videoId, category });
      setCurrentCategory(category);
      setIsFullScreen(true);
      setIsSmallScreen(false);

      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
      }

      setPlaying((prev) => ({ ...prev, [videoId]: true }));
      videoElement.muted = false;
      setMuted((prev) => ({ ...prev, [videoId]: false }));
      videoElement.play().catch((error) => console.error('Error playing video:', error));
    }
  };

  const handleExitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setCurrentFullScreenVideo(null);
    setCurrentCategory(null);
    setIsFullScreen(false);
    setIsSmallScreen(false);
  };

  const handleToggleSmallScreen = () => {
    setIsSmallScreen((prev) => !prev);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && currentFullScreenVideo) {
        setCurrentFullScreenVideo(null);
        setCurrentCategory(null);
        setIsFullScreen(false);
        setIsSmallScreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [currentFullScreenVideo]);

  const handleMuteToggle = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      setMuted((prev) => {
        video.muted = !prev[videoId];
        return { ...prev, [videoId]: !prev[videoId] };
      });
    }
  };

  const handleVolumeChange = (videoId, value) => {
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

  const handleNextVideo = () => {
    if (!currentFullScreenVideo || !currentCategory) return;
    const currentVideos = videos[currentCategory];
    const currentIndex = currentVideos.findIndex((video) => video.id === currentFullScreenVideo.id);
    const nextIndex = (currentIndex + 1) % currentVideos.length;
    const nextVideo = currentVideos[nextIndex];

    setPlaying((prev) => ({ ...prev, [currentFullScreenVideo.id]: false }));
    videoRefs.current[currentFullScreenVideo.id].pause();

    setCurrentFullScreenVideo({ id: nextVideo.id, category: currentCategory });
    setPlaying((prev) => ({ ...prev, [nextVideo.id]: true }));

    const nextVideoElement = videoRefs.current[nextVideo.id];
    if (nextVideoElement) {
      nextVideoElement.currentTime = 0;
      nextVideoElement.muted = false;
      nextVideoElement.play().catch((error) => console.error('Error playing next video:', error));
    }
  };

  const handlePreviousVideo = () => {
    if (!currentFullScreenVideo || !currentCategory) return;
    const currentVideos = videos[currentCategory];
    const currentIndex = currentVideos.findIndex((video) => video.id === currentFullScreenVideo.id);
    const prevIndex = (currentIndex - 1 + currentVideos.length) % currentVideos.length;
    const prevVideo = currentVideos[prevIndex];

    setPlaying((prev) => ({ ...prev, [currentFullScreenVideo.id]: false }));
    videoRefs.current[currentFullScreenVideo.id].pause();

    setCurrentFullScreenVideo({ id: prevVideo.id, category: currentCategory });
    setPlaying((prev) => ({ ...prev, [prevVideo.id]: true }));

    const prevVideoElement = videoRefs.current[prevVideo.id];
    if (prevVideoElement) {
      prevVideoElement.currentTime = 0;
      prevVideoElement.muted = false;
      prevVideoElement.play().catch((error) => console.error('Error playing previous video:', error));
    }
  };

  const handleVideoClick = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (!videoLoaded[videoId]) {
        video.muted = true;
        video.play().catch((error) => console.error('Error playing video:', error));
        setPlaying((prev) => ({ ...prev, [videoId]: true }));
      } else {
        handlePlayPause(videoId);
      }
    }
  };

  const handleProgressClick = (videoId, e) => {
    const video = videoRefs.current[videoId];
    if (video) {
      const rect = e.target.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * video.duration;
    }
  };

  return (
    <div className={`space-y-10 px-6 py-8 max-w-7xl mx-auto ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900' 
        : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white'
    }`}>
      {Object.keys(videos).map((category) => (
        <section key={category} className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2
              className={`text-2xl font-semibold flex items-center ${
                theme === 'light' ? 'text-zinc-800' : 'text-white'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)} Workouts
            </h2>
            <a
              href="#"
              className={`text-sm font-medium transition ${
                theme === 'light' ? 'text-blue-600 hover:text-blue-800' : 'text-blue-400 hover:text-blue-300'
              }`}
            >
              See All
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`rounded-lg overflow-hidden shadow-lg ${
                    theme === 'light' 
                      ? 'bg-white text-gray-900 border-gray-200' 
                      : 'bg-gray-800 text-white border-gray-700'
                  } border`}
                >
                  <div
                    className={`h-40 w-full animate-pulse rounded-t-lg ${
                      theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                    }`}
                  ></div>
                  <div className="p-3">
                    <div
                      className={`h-4 rounded w-3/4 mb-2 animate-pulse ${
                        theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                      }`}
                    ></div>
                    <div
                      className={`h-3 rounded w-1/2 animate-pulse ${
                        theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos[category].map((video) => (
                <div
                  key={video.id}
                  className={`rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border ${
                    theme === 'light' 
                      ? 'bg-white text-gray-900 border-gray-200' 
                      : 'bg-gray-800 text-white border-gray-700'
                  }`}
                >
                  <div className="relative group">
                    <video
                      ref={(el) => (videoRefs.current[video.id] = el)}
                      src={video.videoUrl}
                      className={`w-full h-40 object-cover rounded-t-lg ${
                        videoLoaded[video.id] && playing[video.id] ? 'block' : 'hidden'
                      } ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}
                      poster={video.thumbnail || ''}
                      onTimeUpdate={() => handleTimeUpdate(video.id)}
                      onLoadedData={() => handleVideoLoaded(video.id)}
                      onClick={() => handleVideoClick(video.id)}
                      preload="metadata"
                      loop
                      muted={muted[video.id]}
                      volume={volume[video.id]}
                      controls={false}
                    />
                    {(!videoLoaded[video.id] || !playing[video.id]) && (
                      <div
                        className={`w-full h-40 rounded-t-lg flex items-center justify-center cursor-pointer ${
                          theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'
                        }`}
                        onClick={() => handleVideoClick(video.id)}
                      >
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title || 'Video thumbnail'}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>
                            <FiPlay size={40} />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                          <FiPlay
                            size={32}
                            className={theme === 'light' ? 'text-white' : 'text-blue-400'}
                          />
                        </div>
                      </div>
                    )}
                    {videoLoaded[video.id] && (
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                          playing[video.id] ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                        } bg-black/40`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPause(video.id);
                          }}
                          className="text-white text-4xl hover:scale-110 transition-transform duration-200"
                        >
                          {playing[video.id] ? <FiPause /> : <FiPlay />}
                        </button>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPause(video.id);
                          }}
                          className="text-white p-1 hover:text-gray-200"
                        >
                          {playing[video.id] ? <FiPause size={16} /> : <FiPlay size={16} />}
                        </button>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMuteToggle(video.id);
                            }}
                            className="text-white p-1 hover:text-gray-200"
                          >
                            {muted[video.id] || volume[video.id] === 0 ? (
                              <FiVolumeX size={16} />
                            ) : (
                              <FiVolume2 size={16} />
                            )}
                          </button>
                          {!muted[video.id] && (
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume[video.id] || 0.7}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleVolumeChange(video.id, e.target.value);
                              }}
                              className={`w-12 h-1 rounded-lg appearance-none cursor-pointer ${
                                theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFullScreen) {
                            handleExitFullScreen();
                          } else {
                            handleFullScreen(video.id, category);
                          }
                        }}
                        className="text-white p-1 hover:text-gray-200"
                      >
                        {isFullScreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
                      </button>
                    </div>
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-1 cursor-pointer ${
                        theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProgressClick(video.id, e);
                      }}
                    >
                      <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${progress[video.id] || 0}%` }}
                      ></div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-3 flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {video.title?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-base font-medium truncate ${
                          theme === 'light' ? 'text-zinc-800' : 'text-white'
                        }`}
                      >
                        {video.title || 'Untitled Video'}
                      </h3>
                      <p
                        className={`text-xs ${
                          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        {video.channel || 'Channel Name'} • {video.views} views • 2 days ago
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      {currentFullScreenVideo && (
        <div className={`fixed inset-0 ${theme === 'light' ? 'bg-white' : 'bg-black'} flex items-center justify-center z-50`}>
          <div className="relative w-full h-full max-w-[90%] mx-auto">
            <video
              ref={(el) => (videoRefs.current[currentFullScreenVideo.id] = el)}
              src={videos[currentCategory].find((v) => v.id === currentFullScreenVideo.id).videoUrl}
              className={`mx-auto transition-all duration-300 object-contain rounded-lg ${
                isSmallScreen ? 'w-[70%] h-[70%]' : 'w-full h-full'
              } ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}
              poster={videos[currentCategory].find((v) => v.id === currentFullScreenVideo.id).thumbnail || ''}
              autoPlay
              onTimeUpdate={() => handleTimeUpdate(currentFullScreenVideo.id)}
              onClick={() => handlePlayPause(currentFullScreenVideo.id)}
              preload="auto"
              loop
              muted={muted[currentFullScreenVideo.id]}
              volume={volume[currentFullScreenVideo.id]}
              controls={false}
            />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button
                onClick={() => handlePlayPause(currentFullScreenVideo.id)}
                className={`text-white text-5xl hover:scale-110 transition-transform duration-300 sm:text-4xl ${
                  playing[currentFullScreenVideo.id] ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                }`}
              >
                {playing[currentFullScreenVideo.id] ? <FiPause /> : <FiPlay />}
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between sm:p-2 z-10">
              <div className="flex items-center space-x-3 sm:space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause(currentFullScreenVideo.id);
                  }}
                  className="text-white p-1.5 hover:text-gray-200 sm:p-1 bg-black/50 rounded-full"
                >
                  {playing[currentFullScreenVideo.id] ? <FiPause size={18} /> : <FiPlay size={18} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousVideo();
                  }}
                  className="text-white p-1.5 hover:text-gray-200 sm:p-1 bg-black/50 rounded-full"
                >
                  <FiArrowLeft size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextVideo();
                  }}
                  className="text-white p-1.5 hover:text-gray-200 sm:p-1 bg-black/50 rounded-full"
                >
                  <FiArrowRight size={18} />
                </button>
                <div className="flex items-center space-x-2 sm:space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMuteToggle(currentFullScreenVideo.id);
                    }}
                    className="text-white p-1.5 hover:text-gray-200 sm:p-1 bg-black/50 rounded-full"
                  >
                    {muted[currentFullScreenVideo.id] || volume[currentFullScreenVideo.id] === 0 ? (
                      <FiVolumeX size={18}/>
                      
                    ) : (
                      <FiVolume2 size={18} />
                    )}
                  </button>
                  {!muted[currentFullScreenVideo.id] && (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume[currentFullScreenVideo.id] || 0.7}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleVolumeChange(currentFullScreenVideo.id, e.target.value);
                      }}
                      className={`w-20 h-1 rounded-lg appearance-none cursor-pointer sm:w-14 ${
                        theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'
                      }`}
                    />
                  )}
                </div>
                <div className="text-white text-xs font-medium ml-2 sm:ml-1">
                  {formatDuration(videoRefs.current[currentFullScreenVideo.id]?.currentTime || 0)} /{' '}
                  {videos[currentCategory].find((v) => v.id === currentFullScreenVideo.id).duration}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSmallScreen();
                  }}
                  className="text-white p-1.5 hover:text-gray-200 sm:p-1 bg-black/50 rounded-full"
                  title={isSmallScreen ? 'Maximize Video' : 'Minimize Video'}
                >
                  {isSmallScreen ? <FiMaximize size={18} /> : <FiMonitor size={18} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExitFullScreen();
                  }}
                  className="text-white p-1.5 hover:text-gray-200 sm:p-1 bg-black/50 rounded-full"
                  title="Exit Fullscreen"
                >
                  <FiMinimize size={18} />
                </button>
              </div>
            </div>
            <div
              className={`absolute bottom-10 left-0 right-0 h-1.5 cursor-pointer sm:bottom-8 z-10 ${
                theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleProgressClick(currentFullScreenVideo.id, e);
              }}
            >
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${progress[currentFullScreenVideo.id] || 0}%` }}
              ></div>
            </div>
            <div className="absolute top-4 left-4 text-white text-lg font-medium bg-black/60 px-2 py-1 rounded sm:text-base sm:px-1.5 sm:py-0.5 z-10">
              {videos[currentCategory].find((v) => v.id === currentFullScreenVideo.id).title || 'Untitled Video'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}