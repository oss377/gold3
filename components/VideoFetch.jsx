'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { db } from '../app/fconfig';
import { collection, getDocs } from 'firebase/firestore';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiArrowRight, FiArrowLeft, FiMonitor, FiSquare, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';

export default function VideoFetch({ setWorkouts, setLoading, loading }) {
  const [videos, setVideos] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [playing, setPlaying] = useState({});
  const [volume, setVolume] = useState({});
  const [muted, setMuted] = useState({});
  const [progress, setProgress] = useState({});
  const [currentFullScreenVideo, setCurrentFullScreenVideo] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isNativeFullScreen, setIsNativeFullScreen] = useState(false);
  const [videoLoading, setVideoLoading] = useState({});
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
            acc.muted[video.id] = false;
            acc.progress[video.id] = 0;
            acc.loaded[video.id] = false;
            acc.videoLoading[video.id] = false;
            return acc;
          },
          { playing: {}, volume: {}, muted: {}, progress: {}, loaded: {}, videoLoading: {} }
        );

        setPlaying(initialStates.playing);
        setVolume(initialStates.volume);
        setMuted(initialStates.muted);
        setProgress(initialStates.progress);
        setVideoLoaded(initialStates.loaded);
        setVideoLoading(initialStates.videoLoading);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [setWorkouts, setLoading]);

  const toggleCategoryExpansion = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleVideoLoaded = (videoId) => {
    setVideoLoaded((prev) => ({ ...prev, [videoId]: true }));
    setVideoLoading((prev) => ({ ...prev, [videoId]: false }));
  };

  const handleVideoLoadStart = (videoId) => {
    setVideoLoading((prev) => ({ ...prev, [videoId]: true }));
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
      setIsNativeFullScreen(false);

      setMuted((prev) => ({ ...prev, [videoId]: false }));
      setPlaying((prev) => ({ ...prev, [videoId]: true }));
      
      videoElement.muted = false;
      videoElement.play().catch((error) => console.error('Error playing video:', error));
    }
  };

  const handleEnterNativeFullScreen = (videoId) => {
    const videoElement = videoRefs.current[videoId];
    if (videoElement && !document.fullscreenElement) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
      }
      setIsNativeFullScreen(true);
    }
  };

  const handleExitFullScreen = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setCurrentFullScreenVideo(null);
    setCurrentCategory(null);
    setIsFullScreen(false);
    setIsSmallScreen(false);
    setIsNativeFullScreen(false);
  };

  const handleToggleSmallScreen = () => {
    setIsSmallScreen((prev) => !prev);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsNativeFullScreen(inFullscreen);
      
      if (inFullscreen) {
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
      } else {
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
      }
      
      if (!inFullscreen && currentFullScreenVideo) {
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
      nextVideoElement.play().catch((error) => console.error('Error playing video:', error));
    }
  };

  const handlePreviousVideo = () => {
    if (!currentFullScreenVideo || !currentCategory) return;
    const currentVideos = videos[currentCategory];
    const currentIndex = currentVideos.findIndex((video) => video.id === currentFullScreenVideo.id);
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
      prevVideoElement.play().catch((error) => console.error('Error playing video:', error));
    }
  };

  const handleVideoClick = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (!videoLoaded[videoId]) {
        video.muted = false;
        setPlaying((prev) => ({ ...prev, [videoId]: true }));
        video.play().catch((error) => console.error('Error playing video:', error));
      } else {
        handlePlayPause(videoId);
      }
    }
  };

  const handleProgressClick = (videoId, e) => {
    const video = videoRefs.current[videoId];
    if (video && e.target) {
      const rect = e.target.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * video.duration;
    }
  };

  const handleVideoHover = (videoId, isHover) => {
    const video = videoRefs.current[videoId];
    if (video && videoLoaded[videoId]) {
      if (isHover && !playing[videoId]) {
        video.muted = true;
        video.play().catch((error) => console.error('Error playing preview:', error));
        setPlaying((prev) => ({ ...prev, [videoId]: true }));
      } else if (!isHover && playing[videoId]) {
        video.pause();
        setPlaying((prev) => ({ ...prev, [videoId]: false }));
      }
    }
  };

  const getVideosToDisplay = (category) => {
    const isExpanded = expandedCategories[category];
    return isExpanded ? videos[category] : [videos[category][0]];
  };

  const cardStyle = {
    boxShadow: theme === 'light'
      ? '0 10px 30px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(59, 130, 246, 0.2)'
      : '0 10px 30px rgba(45, 212, 191, 0.3), 0 4px 10px rgba(45, 212, 191, 0.2)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z' fill='%23${theme === 'light' ? 'dbeafe' : '1e3a8a'}' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
  };

  return (
    <div
      className={`space-y-10 px-6 py-8 max-w-6xl mx-auto ${
        theme === 'light' ? 'bg-blue-50 bg-opacity-30' : 'bg-blue-950 bg-opacity-50'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M29 58C13.536 58 1 45.464 1 30 1 14.536 13.536 2 29 2c8.467 0 16.194 3.832 21.213 10.106C55.232 18.38 58 25.534 58 33c0 7.466-2.768 14.62-7.787 20.894C45.194 54.168 37.467 58 29 58z' fill='%23${theme === 'light' ? 'a3bffa' : '2a4365'}' fill-opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {Object.keys(videos).map((category) => (
        <section key={category} className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2
              className={`text-2xl font-bold flex items-center ${
                theme === 'light' ? 'text-blue-900' : 'text-white'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)} Workouts
            </h2>
            <button
              onClick={() => toggleCategoryExpansion(category)}
              className={`text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-1 ${
                theme === 'light' 
                  ? 'text-teal-600 hover:text-teal-700' 
                  : 'text-teal-300 hover:text-teal-200'
              }`}
            >
              {expandedCategories[category] ? (
                <>
                  Show Less <FiChevronUp size={16} />
                </>
              ) : (
                <>
                  Show More <FiChevronDown size={16} />
                </>
              )}
            </button>
          </div>
          {loading ? (
            <div className="space-y-6">
              {[1].map((i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className={`w-full aspect-[16/10] rounded-3xl overflow-hidden animate-pulse ${
                      theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                    }`}></div>
                  </div>
                  <div className="space-y-2">
                    <div className={`h-5 rounded w-3/4 animate-pulse ${
                      theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                    }`}></div>
                    <div className={`h-4 rounded w-full animate-pulse ${
                      theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                    }`}></div>
                    <div className={`h-3 rounded w-1/2 animate-pulse ${
                      theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {getVideosToDisplay(category).map((video) => (
                <div key={video.id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div 
                      className={`relative w-full aspect-[16/10] cursor-pointer group rounded-3xl overflow-hidden border hover:-translate-y-2 transition-all duration-500 ${
                        theme === 'light' 
                          ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100' 
                          : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
                      }`}
                      style={cardStyle}
                      onMouseEnter={() => handleVideoHover(video.id, true)}
                      onMouseLeave={() => handleVideoHover(video.id, false)}
                      onClick={() => handleVideoClick(video.id)}
                    >
                      {videoLoading[video.id] && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                          <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin ${
                            theme === 'light' ? 'border-teal-600' : 'border-teal-300'
                          }`}></div>
                        </div>
                      )}
                      
                      <video
                        ref={(el) => (videoRefs.current[video.id] = el)}
                        src={video.videoUrl}
                        className={`w-full h-full object-contain rounded-3xl absolute inset-0 ${
                          videoLoaded[video.id] && playing[video.id] ? 'block' : 'hidden'
                        }`}
                        poster={video.thumbnail || ''}
                        onTimeUpdate={() => handleTimeUpdate(video.id)}
                        onLoadedData={() => handleVideoLoaded(video.id)}
                        onLoadStart={() => handleVideoLoadStart(video.id)}
                        preload="metadata"
                        loop
                        muted={muted[video.id]}
                        volume={volume[video.id]}
                        controls={false}
                      />
                      {(!videoLoaded[video.id] || !playing[video.id]) && (
                        <div className={`w-full h-full flex items-center justify-center rounded-3xl ${
                          theme === 'light' ? 'bg-white bg-opacity-90' : 'bg-blue-800 bg-opacity-90'
                        }`}>
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt={video.title || 'Video thumbnail'}
                              className="w-full h-full object-contain rounded-3xl"
                            />
                          ) : (
                            <div className={`${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                              <FiPlay size={40} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 rounded-3xl">
                            <FiPlay
                              size={32}
                              className="text-white"
                            />
                          </div>
                        </div>
                      )}
                      {videoLoaded[video.id] && (
                        <div
                          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-black/40 rounded-3xl ${
                            playing[video.id] ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                          }`}
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
                                  theme === 'light' ? 'bg-blue-100' : 'bg-teal-800'
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
                          theme === 'light' ? 'bg-blue-100' : 'bg-teal-800'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProgressClick(video.id, e);
                        }}
                      >
                        <div
                          className="h-full bg-teal-600 transition-all duration-300"
                          style={{ width: `${progress[video.id] || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-3xl border relative overflow-hidden hover:-translate-y-2 transition-all duration-500 ${
                    theme === 'light' 
                      ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100' 
                      : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
                  }`}
                  style={cardStyle}>
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-teal-800 text-teal-300'
                        }`}
                      >
                        {video.title?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-lg font-medium ${
                            theme === 'light' ? 'text-blue-900' : 'text-white'
                          }`}
                        >
                          {video.title || 'Untitled Video'}
                        </h3>
                        <p
                          className={`text-sm leading-relaxed ${
                            theme === 'light' ? 'text-blue-500' : 'text-teal-400'
                          }`}
                        >
                          {video.description || 'No description available'}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            theme === 'light' ? 'text-blue-500' : 'text-teal-400'
                          }`}
                        >
                          {video.channel || 'Channel Name'} • {video.views} views • 2 days ago
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                      {video.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      {currentFullScreenVideo && (
        <div className={`fixed inset-0 ${theme === 'light' ? 'bg-white bg-opacity-90' : 'bg-blue-800 bg-opacity-90'} flex items-center justify-center z-50 p-4 border relative overflow-hidden`}
        style={cardStyle}>
          <div className="relative w-full max-w-6xl mx-auto flex flex-col">
            <div className={`relative w-full ${isSmallScreen ? 'max-w-[70%] max-h-[70%] mx-auto' : 'aspect-[16/10] max-h-[70vh]'}`}>
              {videoLoading[currentFullScreenVideo.id] && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 rounded-3xl">
                  <div className={`w-16 h-16 rounded-full border-4 border-t-transparent animate-spin ${
                    theme === 'light' ? 'border-teal-600' : 'border-teal-300'
                  }`}></div>
                </div>
              )}
              
              <video
                ref={(el) => (videoRefs.current[currentFullScreenVideo.id] = el)}
                src={videos[currentCategory]?.find((v) => v.id === currentFullScreenVideo.id)?.videoUrl}
                className={`w-full h-full object-contain rounded-3xl transition-all duration-300 ${
                  theme === 'light' ? 'bg-white bg-opacity-90' : 'bg-blue-800 bg-opacity-90'
                }`}
                poster={videos[currentCategory]?.find((v) => v.id === currentFullScreenVideo.id)?.thumbnail || ''}
                onTimeUpdate={() => handleTimeUpdate(currentFullScreenVideo.id)}
                onLoadedData={() => handleVideoLoaded(currentFullScreenVideo.id)}
                onLoadStart={() => handleVideoLoadStart(currentFullScreenVideo.id)}
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
                  className={`text-white text-6xl hover:scale-110 transition-transform duration-300 ${
                    playing[currentFullScreenVideo.id] ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                  }`}
                >
                  {playing[currentFullScreenVideo.id] ? <FiPause /> : <FiPlay />}
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between z-10">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(currentFullScreenVideo.id);
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                  >
                    {playing[currentFullScreenVideo.id] ? <FiPause size={20} /> : <FiPlay size={20} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousVideo();
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                  >
                    <FiArrowLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextVideo();
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                  >
                    <FiArrowRight size={20} />
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMuteToggle(currentFullScreenVideo.id);
                      }}
                      className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                    >
                      {muted[currentFullScreenVideo.id] || volume[currentFullScreenVideo.id] === 0 ? (
                        <FiVolumeX size={20} />
                      ) : (
                        <FiVolume2 size={20} />
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
                        className={`w-24 h-1 rounded-lg appearance-none cursor-pointer ${
                          theme === 'light' ? 'bg-blue-100' : 'bg-teal-800'
                        }`}
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
                    title={isSmallScreen ? 'Expand Video' : 'Shrink Video'}
                  >
                    {isSmallScreen ? <FiMaximize size={20} /> : <FiMonitor size={20} />}
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
                    title={isNativeFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isNativeFullScreen ? <FiMinimize size={20} /> : <FiSquare size={20} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExitFullScreen();
                    }}
                    className="text-white p-2 hover:text-gray-200 bg-black/50 rounded-full"
                    title="Close"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>
              <div
                className={`absolute bottom-16 left-0 right-0 h-1.5 cursor-pointer z-10 ${
                  theme === 'light' ? 'bg-blue-100' : 'bg-teal-800'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProgressClick(currentFullScreenVideo.id, e);
                }}
              >
                <div
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${progress[currentFullScreenVideo.id] || 0}%` }}
                ></div>
              </div>
              <div className="absolute top-4 left-4 text-white text-xl font-bold bg-black/60 px-3 py-1 rounded-2xl z-10">
                {videos[currentCategory]?.find((v) => v.id === currentFullScreenVideo.id)?.title || 'Untitled Video'}
              </div>
            </div>
            {videos[currentCategory]?.find((v) => v.id === currentFullScreenVideo.id)?.description && (
              <div className={`p-4 rounded-3xl border mt-4 relative overflow-hidden ${
                theme === 'light' 
                  ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100' 
                  : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
              }`}
              style={cardStyle}>
                <h3
                  className={`text-lg font-bold mb-2 ${
                    theme === 'light' ? 'text-blue-900' : 'text-white'
                  }`}
                >
                  Description
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    theme === 'light' ? 'text-blue-500' : 'text-teal-400'
                  }`}
                >
                  {videos[currentCategory].find((v) => v.id === currentFullScreenVideo.id).description}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    theme === 'light' ? 'text-blue-500' : 'text-teal-400'
                  }`}
                >
                  {videos[currentCategory].find((v) => v.id === currentFullScreenVideo.id).channel || 'Channel Name'} • 
                  {videos[currentCategory].find((v) => v.id === currentFullScreenVideo.id).views} views • 2 days ago
                </p>
              </div>
            )}
            <div className="absolute top-4 right-4 text-white text-sm font-bold bg-black/60 px-2 py-1 rounded-2xl z-10">
              {formatDuration(videoRefs.current[currentFullScreenVideo.id]?.currentTime || 0)} /{' '}
              {videos[currentCategory]?.find((v) => v.id === currentFullScreenVideo.id)?.duration}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}