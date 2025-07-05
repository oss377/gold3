'use client';
import { useState, useEffect, useRef } from 'react';
import { db } from '../app/fconfig';
import { collection, getDocs } from 'firebase/firestore';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiArrowRight, FiArrowLeft, FiMonitor } from 'react-icons/fi';

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
    const [isSmallScreen, setIsSmallScreen] = useState(false); // State for small screen mode
    const videoRefs = useRef({});

    // Format view counts
    const getRandomViews = () => {
        const views = Math.floor(Math.random() * 1000000) + 1000;
        if (views > 1000000) {
            return `${(views / 1000000).toFixed(1)}M`;
        } else if (views > 1000) {
            return `${(views / 1000).toFixed(1)}K`;
        }
        return views.toString();
    };

    // Format duration
    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Fetch videos from Firebase
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, 'videos'));
                const fetchedVideos = querySnapshot.docs.map(doc => ({
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
                
                // Initialize states
                const initialStates = fetchedVideos.reduce((acc, video) => {
                    acc.playing[video.id] = false;
                    acc.volume[video.id] = 0.7;
                    acc.muted[video.id] = true; // Start muted for autoplay
                    acc.progress[video.id] = 0;
                    acc.loaded[video.id] = false;
                    return acc;
                }, { playing: {}, volume: {}, muted: {}, progress: {}, loaded: {} });

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

    // Handle video loaded event
    const handleVideoLoaded = (videoId) => {
        setVideoLoaded(prev => ({ ...prev, [videoId]: true }));
    };

    // Update progress bar
    const handleTimeUpdate = (videoId) => {
        const video = videoRefs.current[videoId];
        if (video) {
            const progressPercent = (video.currentTime / video.duration) * 100;
            setProgress(prev => ({ ...prev, [videoId]: progressPercent }));
        }
    };

    // Toggle play/pause
    const handlePlayPause = (videoId) => {
        const video = videoRefs.current[videoId];
        if (video) {
            if (playing[videoId]) {
                video.pause();
            } else {
                video.play().catch(error => console.error('Error playing video:', error));
            }
            setPlaying(prev => ({ ...prev, [videoId]: !prev[videoId] }));
        }
    };

    // Toggle full screen
    const handleFullScreen = (videoId, category) => {
        const videoElement = videoRefs.current[videoId];
        if (videoElement) {
            setCurrentFullScreenVideo({ id: videoId, category });
            setCurrentCategory(category);
            setIsFullScreen(true);
            setIsSmallScreen(false); // Reset small screen mode when entering fullscreen
            
            if (videoElement.requestFullscreen) {
                videoElement.requestFullscreen();
            } else if (videoElement.webkitRequestFullscreen) {
                videoElement.webkitRequestFullscreen();
            } else if (videoElement.msRequestFullscreen) {
                videoElement.msRequestFullscreen();
            }
            
            // Start playing when entering fullscreen
            setPlaying(prev => ({ ...prev, [videoId]: true }));
            videoElement.muted = false;
            setMuted(prev => ({ ...prev, [videoId]: false }));
            videoElement.play().catch(error => console.error('Error playing video:', error));
        }
    };

    // Exit full screen
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
        setIsSmallScreen(false); // Reset small screen mode
    };

    // Toggle small screen mode
    const handleToggleSmallScreen = () => {
        setIsSmallScreen(prev => !prev);
    };

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && currentFullScreenVideo) {
                setCurrentFullScreenVideo(null);
                setCurrentCategory(null);
                setIsFullScreen(false);
                setIsSmallScreen(false); // Reset small screen mode
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

    // Toggle mute
    const handleMuteToggle = (videoId) => {
        const video = videoRefs.current[videoId];
        if (video) {
            setMuted(prev => {
                video.muted = !prev[videoId];
                return { ...prev, [videoId]: !prev[videoId] };
            });
        }
    };

    // Adjust volume
    const handleVolumeChange = (videoId, value) => {
        const video = videoRefs.current[videoId];
        if (video) {
            const volumeValue = parseFloat(value);
            setVolume(prev => {
                video.volume = volumeValue;
                if (volumeValue > 0) {
                    video.muted = false;
                    setMuted(prev => ({ ...prev, [videoId]: false }));
                }
                return { ...prev, [videoId]: volumeValue };
            });
        }
    };

    // Navigate to next/previous video
    const handleNextVideo = () => {
        if (!currentFullScreenVideo || !currentCategory) return;
        const currentVideos = videos[currentCategory];
        const currentIndex = currentVideos.findIndex(video => video.id === currentFullScreenVideo.id);
        const nextIndex = (currentIndex + 1) % currentVideos.length;
        const nextVideo = currentVideos[nextIndex];
        
        // Pause current video
        setPlaying(prev => ({ ...prev, [currentFullScreenVideo.id]: false }));
        videoRefs.current[currentFullScreenVideo.id].pause();
        
        // Switch to next video
        setCurrentFullScreenVideo({ id: nextVideo.id, category: currentCategory });
        setPlaying(prev => ({ ...prev, [nextVideo.id]: true }));
        
        // Play next video
        const nextVideoElement = videoRefs.current[nextVideo.id];
        if (nextVideoElement) {
            nextVideoElement.currentTime = 0;
            nextVideoElement.muted = false;
            nextVideoElement.play().catch(error => console.error('Error playing next video:', error));
        }
    };

    // Navigate to previous video
    const handlePreviousVideo = () => {
        if (!currentFullScreenVideo || !currentCategory) return;
        const currentVideos = videos[currentCategory];
        const currentIndex = currentVideos.findIndex(video => video.id === currentFullScreenVideo.id);
        const prevIndex = (currentIndex - 1 + currentVideos.length) % currentVideos.length;
        const prevVideo = currentVideos[prevIndex];
        
        // Pause current video
        setPlaying(prev => ({ ...prev, [currentFullScreenVideo.id]: false }));
        videoRefs.current[currentFullScreenVideo.id].pause();
        
        // Switch to previous video
        setCurrentFullScreenVideo({ id: prevVideo.id, category: currentCategory });
        setPlaying(prev => ({ ...prev, [prevVideo.id]: true }));
        
        // Play previous video
        const prevVideoElement = videoRefs.current[prevVideo.id];
        if (prevVideoElement) {
            prevVideoElement.currentTime = 0;
            prevVideoElement.muted = false;
            prevVideoElement.play().catch(error => console.error('Error playing previous video:', error));
        }
    };

    // Handle video click (play/pause toggle)
    const handleVideoClick = (videoId) => {
        const video = videoRefs.current[videoId];
        if (video) {
            if (!videoLoaded[videoId]) {
                video.muted = true;
                video.play().catch(error => console.error('Error playing video:', error));
                setPlaying(prev => ({ ...prev, [videoId]: true }));
            } else {
                handlePlayPause(videoId);
            }
        }
    };

    // Handle progress bar click (seek)
    const handleProgressClick = (videoId, e) => {
        const video = videoRefs.current[videoId];
        if (video) {
            const rect = e.target.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        }
    };

    return (
        <div className="space-y-12 px-4 py-8 max-w-7xl mx-auto">
            {Object.keys(videos).map(category => (
                <section key={category} className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                            <span className="text-2xl mr-3">🎥</span>
                            {category.charAt(0).toUpperCase() + category.slice(1)} Workouts
                        </h2>
                        <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium transition">View All</a>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                                    <div className="bg-gray-200 h-48 w-full animate-pulse rounded-t-xl"></div>
                                    <div className="p-4">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {videos[category].map(video => (
                                <div
                                    key={video.id}
                                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="relative group">
                                        {/* Video Thumbnail (shown by default) */}
                                        {(!videoLoaded[video.id] || !playing[video.id]) && (
                                            <div 
                                                className="w-full h-48 bg-gray-200 rounded-t-xl flex items-center justify-center cursor-pointer"
                                                onClick={() => handleVideoClick(video.id)}
                                            >
                                                {video.thumbnail ? (
                                                    <img 
                                                        src={video.thumbnail} 
                                                        alt={video.title || 'Video thumbnail'} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-gray-500">
                                                        <FiPlay size={48} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <div className="bg-black/30 rounded-full p-4">
                                                        <FiPlay size={24} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Video Element (hidden until clicked) */}
                                        <video
                                            ref={el => (videoRefs.current[video.id] = el)}
                                            src={video.videoUrl}
                                            className={`w-full h-48 object-cover rounded-t-xl ${videoLoaded[video.id] && playing[video.id] ? 'block' : 'hidden'}`}
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
                                        
                                        {/* Play Button Overlay */}
                                        {videoLoaded[video.id] && (
                                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${playing[video.id] ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlayPause(video.id);
                                                    }}
                                                    className="text-white text-5xl hover:scale-110 transition-transform duration-200"
                                                >
                                                    {playing[video.id] ? <FiPause /> : <FiPlay />}
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Bottom Controls */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlayPause(video.id);
                                                    }}
                                                    className="text-white p-1 hover:text-gray-300"
                                                >
                                                    {playing[video.id] ? <FiPause size={16} /> : <FiPlay size={16} />}
                                                </button>
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMuteToggle(video.id);
                                                        }}
                                                        className="text-white p-1 hover:text-gray-300"
                                                    >
                                                        {muted[video.id] || volume[video.id] === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
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
                                                            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer sm:w-12"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isFullScreen) {
                                                            handleExitFullScreen();
                                                        } else {
                                                            handleFullScreen(video.id, category);
                                                        }
                                                    }}
                                                    className="text-white p-1 hover:text-gray-300"
                                                >
                                                    {isFullScreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div 
                                            className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300/30 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleProgressClick(video.id, e);
                                            }}
                                        >
                                            <div
                                                className="h-full bg-red-600 transition-all duration-200"
                                                style={{ width: `${progress[video.id] || 0}%` }}
                                            ></div>
                                        </div>
                                        
                                        {/* Duration Badge */}
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                                            {video.duration}
                                        </div>
                                    </div>
                                    
                                    {/* Video Info */}
                                    <div className="p-4 flex items-start space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                                            {video.title?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">{video.title || 'Untitled Video'}</h3>
                                            <p className="text-gray-500 text-sm truncate">
                                                {video.channel || 'Channel Name'} • {video.views} views • 2 days ago
                                            </p>
                                            <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                                                {video.description || 'No description available'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            ))}

            {/* Fullscreen Video Player */}
            {currentFullScreenVideo && (
                <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                    <div className="relative w-full h-full max-w-7xl mx-auto">
                        {/* Fullscreen Video */}
                        <video
                            ref={el => (videoRefs.current[currentFullScreenVideo.id] = el)}
                            src={videos[currentCategory].find(v => v.id === currentFullScreenVideo.id).videoUrl}
                            className={`mx-auto transition-all duration-200 object-contain ${isSmallScreen ? 'w-[80%] h-[80%]' : 'w-full h-full'}`}
                            poster={videos[currentCategory].find(v => v.id === currentFullScreenVideo.id).thumbnail || ''}
                            autoPlay
                            onTimeUpdate={() => handleTimeUpdate(currentFullScreenVideo.id)}
                            onClick={() => handlePlayPause(currentFullScreenVideo.id)}
                            preload="auto"
                            loop
                            muted={muted[currentFullScreenVideo.id]}
                            volume={volume[currentFullScreenVideo.id]}
                            controls={false}
                        />
                        
                        {/* Video Controls Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <button
                                onClick={() => handlePlayPause(currentFullScreenVideo.id)}
                                className={`text-white text-6xl hover:scale-110 transition-transform duration-200 sm:text-4xl ${playing[currentFullScreenVideo.id] ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
                            >
                                {playing[currentFullScreenVideo.id] ? <FiPause /> : <FiPlay />}
                            </button>
                        </div>
                        
                        {/* Bottom Controls Bar */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between sm:p-2 z-10">
                            <div className="flex items-center space-x-4 sm:space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayPause(currentFullScreenVideo.id);
                                    }}
                                    className="text-white p-2 hover:text-gray-300 sm:p-1 bg-black/50 rounded-full"
                                >
                                    {playing[currentFullScreenVideo.id] ? <FiPause size={20} /> : <FiPlay size={20} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviousVideo();
                                    }}
                                    className="text-white p-2 hover:text-gray-300 sm:p-1 bg-black/50 rounded-full"
                                >
                                    <FiArrowLeft size={20} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNextVideo();
                                    }}
                                    className="text-white p-2 hover:text-gray-300 sm:p-1 bg-black/50 rounded-full"
                                >
                                    <FiArrowRight size={20} />
                                </button>
                                <div className="flex items-center space-x-2 sm:space-x-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMuteToggle(currentFullScreenVideo.id);
                                        }}
                                        className="text-white p-2 hover:text-gray-300 sm:p-1 bg-black/50 rounded-full"
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
                                            className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer sm:w-16"
                                        />
                                    )}
                                </div>
                                <div className="text-white text-sm ml-2">
                                    {formatDuration(videoRefs.current[currentFullScreenVideo.id]?.currentTime || 0)} / {videos[currentCategory].find(v => v.id === currentFullScreenVideo.id).duration}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSmallScreen();
                                    }}
                                    className="text-white p-2 hover:text-gray-300 sm:p-1 bg-black/50 rounded-full"
                                    title={isSmallScreen ? "Maximize Video" : "Minimize Video"}
                                >
                                    {isSmallScreen ? <FiMaximize size={20} /> : <FiMonitor size={20} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleExitFullScreen();
                                    }}
                                    className="text-white p-2 hover:text-gray-300 sm:p-1 bg-black/50 rounded-full"
                                    title="Exit Fullscreen"
                                >
                                    <FiMinimize size={20} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div 
                            className="absolute bottom-14 left-0 right-0 h-2 bg-gray-300/30 cursor-pointer sm:bottom-12 z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleProgressClick(currentFullScreenVideo.id, e);
                            }}
                        >
                            <div
                                className="h-full bg-red-600 transition-all duration-200"
                                style={{ width: `${progress[currentFullScreenVideo.id] || 0}%` }}
                            ></div>
                        </div>
                        
                        {/* Video Title */}
                        <div className="absolute top-4 left-4 text-white text-xl font-semibold bg-black/60 px-3 py-2 rounded-md sm:text-base sm:px-2 sm:py-1 z-10">
                            {videos[currentCategory].find(v => v.id === currentFullScreenVideo.id).title || 'Untitled Video'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}