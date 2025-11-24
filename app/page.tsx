'use client';

import { useState, useEffect, useContext, useRef, Dispatch, SetStateAction, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogIn, Home as HomeIcon, Video, Heart, Users, Menu, X, Sun, Moon, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiArrowRight, FiArrowLeft, FiMonitor, FiSquare, FiDownload, FiX as FiXIcon, FiCamera } from 'react-icons/fi';
import { db } from '../app/fconfig';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, limit } from 'firebase/firestore';
import Login from '../components/login';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import LanguageContext from '../context/LanguageContext';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

// Interface for Translation
interface Translation {
  welcome?: string;
  getStarted?: string;
  discoverWorkouts?: string;
  startConsultancy?: string;
  browseWorkouts?: string;
  joinCommunity?: string;
  connectCommunity?: string;
  joinChat?: string;
  home?: string;
  workouts?: string;
  favorites?: string;
  login?: string;
  register?: string;
  darkMode?: string;
  appTitle?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  getStartedButton?: string;
  joinNow?: string;
  signUpText?: string;
  welcomeBack?: string;
  chooseProgram?: string;
  registerAerobics?: string;
  registerGym?: string;
  registerKarate?: string;
  registerconsultancy?: string;
  alreadyAccount?: string;
  company?: string;
  about?: string;
  careers?: string;
  blog?: string;
  support?: string;
  help?: string;
  contact?: string;
  faq?: string;
  legal?: string;
  terms?: string;
  privacy?: string;
  cookies?: string;
  footerText?: string;
}

// Interface for Video
interface VideoType {
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

// Interface for NavItem
interface NavItem {
  name: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  href?: string;
}

// Interface for Login Props
interface LoginProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  toggleAuthType: Dispatch<SetStateAction<string>>;
  theme: string;
}

interface Photo {
  id: string;
  photoUrl: string;
  fileName: string;
}

function WelcomeCard({ theme, t, photos }: { theme: string; t: Translation; photos: Photo[] }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const imageIndex = photos.length > 0 ? page % photos.length : 0;

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  useEffect(() => {
    if (photos.length > 1) {
      const timer = setTimeout(() => paginate(1), 2000); // 2-second interval
      return () => clearTimeout(timer);
    }
  }, [page, paginate, photos.length]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative rounded-3xl shadow-2xl hover:-translate-y-2 transition-all duration-500 border-transparent overflow-hidden min-h-[300px] flex flex-col justify-center items-center p-8"
    >
      {photos.length > 0 && (
        <>
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={page}
              src={photos[imageIndex].photoUrl}
              alt={photos[imageIndex].fileName || 'Welcome background'}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/50"></div>
        </>
      )}
      <div className="relative z-10 text-center text-white">
        <h1 className="text-3xl font-bold drop-shadow-lg">
          {t.welcome || 'Unleash Your Inner Strength'}
        </h1>
        <p className="text-4xl font-extrabold mt-3 text-teal-300 drop-shadow-md">
          {t.getStarted || 'Start Your Transformation'}
        </p>
        <p className="text-sm mt-3 text-teal-100 drop-shadow-sm">
          {t.discoverWorkouts || 'Join our gym community and crush your fitness goals'}
        </p>
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={() => window.location.href = '/consultancy'}
            className="px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t.startConsultancy || 'Book a Free Consultation'}
          </button>
          <button
            className="px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border border-teal-400 text-teal-300 hover:bg-teal-800/50"
          >
            {t.browseWorkouts || 'Explore Workout Plans'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function JoinGroupChatCard({ theme, t, photos }: { theme: string; t: Translation; photos: Photo[] }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const imageIndex = photos.length > 0 ? page % photos.length : 0;

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  useEffect(() => {
    if (photos.length > 1) {
      const timer = setTimeout(() => paginate(1), 2000); // 2-second interval
      return () => clearTimeout(timer);
    }
  }, [page, paginate, photos.length]);

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative rounded-3xl shadow-2xl hover:-translate-y-2 transition-all duration-500 border-transparent overflow-hidden min-h-[300px] flex flex-col justify-center items-center p-8"
    >
      {photos.length > 0 && (
        <>
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={page}
              src={photos[imageIndex].photoUrl}
              alt={photos[imageIndex].fileName || 'Group chat background'}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/50"></div>
        </>
      )}
      <div className="relative z-10 text-center text-white">
        <h2 className="text-xl font-bold drop-shadow-lg flex justify-center items-center mb-4">
          <Users className="text-3xl mr-3 text-teal-300" />
          {t.joinCommunity || 'Join Our Fitness Tribe'}
        </h2>
        <p className="mb-6 text-center text-teal-100 drop-shadow-sm">
        {t.connectCommunity || 'Connect with like-minded fitness enthusiasts and stay motivated'}
        </p>
        <button
          onClick={() => window.location.href = '/publicMessage'}
          className="px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg bg-teal-600 hover:bg-teal-700 text-white"
        >
          {t.joinChat || 'Join the Community Chat'}
        </button>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authType, setAuthType] = useState<string>('login');
  const [featuredVideos, setFeaturedVideos] = useState<Record<string, VideoType[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const languageContext = useContext(LanguageContext);

  if (!languageContext) {
    // This can happen during server-side rendering or if the provider is missing.
    return null; // or a loading spinner
  }
  const { language, toggleLanguage, t } = languageContext;

  // Add a ref for the fallback icon
  const fallbackIconRef = useRef<SVGSVGElement | null>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    if (fallbackIconRef.current) {
      fallbackIconRef.current.style.display = 'block';
    }
  };

  const navItems: NavItem[] = [
    { name: t.home || 'Home', icon: HomeIcon, href: '/' },
    { name: t.workouts || 'Workouts', icon: Video, href: '/workouts' },
    { name: t.favorites || 'Favorites', icon: Heart, href: '/favorites' },
    { name: t.login || 'Login', icon: LogIn },
    { name: t.register || 'Register', icon: User },
  ];

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

  // Fetch featured videos from Firebase
  useEffect(() => {
    const fetchFeaturedVideos = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'videos'));
        const fetchedVideos: VideoType[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          category: doc.data().category || 'uncategorized',
          views: getRandomViews(),
          duration: formatDuration(Math.floor(Math.random() * 300) + 60),
        } as VideoType));

        // Group videos by category
        const groupedVideos = fetchedVideos.reduce((acc: Record<string, VideoType[]>, video: VideoType) => {
          const category = video.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(video);
          return acc;
        }, {});

        setFeaturedVideos(groupedVideos);
      } catch (error) {
        console.error("Error fetching featured videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedVideos();

    const fetchPhotos = async () => {
      try {
        const photosSnapshot = await getDocs(collection(db, 'photos'));
        const fetchedPhotos = photosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Photo));
        setPhotos(fetchedPhotos);
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    };
    fetchPhotos();
  }, []);

  // Add keyboard accessibility for auth modal
  useEffect(() => {
    if (authModalOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setAuthModalOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [authModalOpen]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleAuthModal = (type: string) => {
    setAuthType(type);
    setAuthModalOpen(!authModalOpen);
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const isAdmin = email === 'awekeadisie@gmail.com' && password === '123456';

    if (isAdmin) {
      setAuthModalOpen(false);
      router.push('/admin');
    } else {
      setAuthModalOpen(false);
      router.push('/dashboard');
    }
  };

  return (
    <div
      className={`flex min-h-screen font-sans transition-colors duration-500 relative`}
    >
      <Head>
        <title>{t.appTitle || 'Workout App'} - {t.welcome || 'Unleash Your Inner Strength'}</title>
        <meta name="description" content={t.discoverWorkouts || 'Join our gym community and crush your fitness goals'} />
      </Head>

      {/* Sidebar */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transform transition-transform duration-500 ease-in-out ${
          theme === 'light'
            ? 'bg-gradient-to-b from-blue-100 to-teal-100 text-blue-900'
            : 'bg-gradient-to-b from-blue-900 to-teal-900 text-white'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === 'light' ? 'border-blue-200' : 'border-blue-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image 
                src="/logo.png" 
                alt="Workout App Logo" 
                fill
                className="object-contain rounded-full"
                onError={handleImageError}
              />
              <HomeIcon 
                ref={fallbackIconRef}
                size={30} 
                className={`${theme === 'light' ? 'text-teal-600' : 'text-teal-300'} hidden`}
              />
            </div>
            <h1
              className={`text-2xl font-extrabold tracking-tight ${
                theme === 'light' ? 'text-blue-900' : 'text-white'
              }`}
            >
              {t.appTitle || 'Workout App'}
            </h1>
          </div>
          <button
            className={theme === 'light' ? 'text-blue-600 hover:text-blue-900' : 'text-blue-300 hover:text-white'}
            onClick={toggleSidebar}
          >
            <X size={28} />
          </button>
        </div>
        <nav className="mt-8 space-y-3 px-4">
          {navItems.map((item) =>
            item.name === (t.login || 'Login') || item.name === (t.register || 'Register') ? (
              <button
                key={item.name}
                onClick={() => toggleAuthModal(item.name.toLowerCase())}
                className={`flex items-center w-full px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
                }`}
              >
                <item.icon
                  size={22}
                  className={`mr-4 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                />
                <span>{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href || '#'}
                className={`flex items-center px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
                }`}
              >
                <item.icon
                  size={22}
                  className={`mr-4 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                />
                <span>{item.name}</span>
              </Link>
            )
          )}
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
            }`}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon size={22} className="mr-4 text-teal-600" />
            ) : (
              <Sun size={22} className="mr-4 text-teal-300" />
            )}
            <span>{t.darkMode || 'Dark Mode'}</span>
          </button>
          <button
            onClick={toggleLanguage}
            className={`flex items-center w-full px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
            }`}
            aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
          >
            <Globe size={22} className={`mr-4 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`relative z-10 flex-1 flex flex-col transition-all duration-500 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}
      >
        {/* Header */}
        <header
          className={`shadow-2xl p-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500 backdrop-blur-sm ${
            theme === 'light' ? 'bg-gray-50/80 text-blue-900' : 'bg-gray-900/80 text-white'
          }`}
        >
          <div className="flex items-center space-x-4">
            <button
              className={theme === 'light' ? 'text-teal-600 hover:text-teal-800' : 'text-teal-300 hover:text-teal-200'}
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                <Image 
                  src="/logo.png" 
                  alt="Workout App Logo" 
                  fill
                  className="object-contain rounded-full"
                  onError={handleImageError}
                />
                <HomeIcon 
                  ref={fallbackIconRef}
                  size={30} 
                  className={`${theme === 'light' ? 'text-teal-600' : 'text-teal-300'} hidden`}
                />
              </div>
              <h2
                className={`text-3xl font-extrabold tracking-tight ${
                  theme === 'light' ? 'text-blue-900' : 'text-white'
                }`}
              >
                {t.appTitle || 'Workout App'}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleAuthModal('login')}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
              }`}
            >
              <LogIn size={20} className="mr-2" />
              {t.login || 'Login'}
            </button>
            <button
              onClick={() => toggleAuthModal('register')}
              className={`flex items-center px-5 py-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
              }`}
            >
              <User size={20} className="mr-2" />
              {t.register || 'Register'}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-2xl transition-all hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'text-teal-600 hover:bg-teal-100' : 'text-teal-300 hover:bg-teal-800'
              }`}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            </button>
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-2xl transition-all hover:scale-105 hover:shadow-lg ${
                theme === 'light' ? 'text-teal-600 hover:bg-teal-100' : 'text-teal-300 hover:bg-teal-800'
              }`}
              aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Globe className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className={`flex-1 p-8 overflow-y-auto backdrop-blur-sm ${
            theme === 'light' ? 'bg-gray-50/80 text-blue-900' : 'bg-gray-900/80 text-white'
          }`}
        >
          {/* Full-Screen Background Image Section */}
          <section
            className="relative h-screen w-full bg-cover bg-center bg-no-repeat mb-12 flex items-center justify-center"
            style={{
              backgroundImage: photos.length > 0 ? `url(${photos[0].photoUrl})` : (theme === 'light' ? `url('/gym-background.jpg')` : `url('/gym.jpg')`),
            }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative flex flex-col items-center justify-center text-center h-full z-10 p-4"
            >
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`text-5xl md:text-6xl font-extrabold tracking-tight mb-4 ${
                  'text-white drop-shadow-lg'
                }`}
              >
                {t.heroTitle || 'Transform Your Body, Transform Your Life'}
              </motion.h1>
              <motion.p
                className={`text-lg md:text-xl max-w-2xl mx-auto ${
                  'text-gray-200 drop-shadow-md'
                }`}
              >
                {t.heroSubtitle || 'Join our gym, access world-class workouts, and become the strongest version of yourself.'}
              </motion.p>
              <button
                onClick={() => toggleAuthModal('register')}
                className={`mt-6 px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
                }`}
              >
                {t.getStartedButton || 'Join Now'}
              </button>
            </motion.div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <WelcomeCard theme={theme} t={t} photos={photos} />
            <JoinGroupChatCard theme={theme} t={t} photos={photos} />
          </div>

          <section className="mb-12">
            <FeaturedVideos videos={featuredVideos} loading={loading} theme={theme} />
          </section>

          <section
            className={`rounded-3xl shadow-2xl p-8 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 border relative overflow-hidden ${
              theme === 'light'
                ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100'
                : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
            }`}
            style={{
              boxShadow: theme === 'light'
                ? '0 10px 30px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(59, 130, 246, 0.2)'
                : '0 10px 30px rgba(45, 212, 191, 0.3), 0 4px 10px rgba(45, 212, 191, 0.2)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z' fill='%23${theme === 'light' ? 'dbeafe' : '1e3a8a'}' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                {t.joinNow || 'Become a Member Today'}
              </h2>
              <p className={`text-lg mt-3 ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                {t.signUpText || 'Sign up now and start your journey to a stronger, healthier you'}
              </p>
              <button
                onClick={() => toggleAuthModal('register')}
                className={`mt-6 px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
                }`}
              >
                {t.getStartedButton || 'Get Started'}
              </button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer
          className={`py-8 transition-colors duration-500 backdrop-blur-sm ${
            theme === 'light' ? 'bg-gray-50/80 text-blue-900' : 'bg-gray-900/80 text-white'
          }`}
        >
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative w-10 h-10">
                    <Image 
                      src="/logo.png" 
                      alt="Workout App Logo" 
                      fill
                      className="object-contain rounded-full"
                      onError={handleImageError}
                    />
                    <HomeIcon 
                      size={30} 
                      className={`${theme === 'light' ? 'text-teal-600' : 'text-teal-300'} hidden`}
                    />
                  </div>
                  <h3 className="text-lg font-bold">{t.appTitle || 'Workout App'}</h3>
                </div>
                <p className={theme === 'light' ? 'text-blue-700' : 'text-teal-300'}>
                  {t.discoverWorkouts || 'Join our gym community and crush your fitness goals'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t.company || 'Company'}</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.about || 'About'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.careers || 'Careers'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.blog || 'Blog'}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t.support || 'Support'}</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.help || 'Help'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.contact || 'Contact'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.faq || 'FAQ'}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t.legal || 'Legal'}</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.terms || 'Terms'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.privacy || 'Privacy'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-blue-700 hover:text-teal-600' : 'text-teal-300 hover:text-white'}`}
                    >
                      {t.cookies || 'Cookies'}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div
              className={`border-t mt-8 pt-8 text-center ${
                theme === 'light' ? 'border-blue-200 text-blue-700' : 'border-teal-800 text-teal-300'
              }`}
            >
              <p>{t.footerText || '© 2025 Workout App. All rights reserved.'}</p>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        {authModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-xl max-w-md w-full p-6 shadow-lg ${
                theme === 'light' 
                  ? 'bg-gradient-to-br from-blue-100 to-teal-100 text-blue-900' 
                  : 'bg-gradient-to-br from-blue-900 to-teal-900 text-white'
              }`}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                  {authType === 'login' ? (t.welcomeBack || 'Welcome Back') : (t.chooseProgram || 'Choose Your Program')}
                </h3>
                <button
                  onClick={() => setAuthModalOpen(false)}
                  className={`transition-colors duration-200 ${
                    theme === 'light' ? 'text-blue-600 hover:text-blue-900' : 'text-teal-300 hover:text-white'
                  }`}
                >
                  <X size={24} />
                </button>
              </div>
              {authType === 'login' ? (
                <Login onSubmit={handleLogin} toggleAuthType={setAuthType} theme={theme} />
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/register/earobics')}
                    className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {t.registerAerobics || 'Register for Aerobics'}
                  </button>
                  <button
                    onClick={() => router.push('/register/gym')}
                    className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {t.registerGym || 'Register for Gym'}
                  </button>
                  <button
                    onClick={() => router.push('/register/karate')}
                    className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {t.registerKarate || 'Register for Karate'}
                  </button>
                  <button
                    onClick={() => router.push('/register/consultancy')}
                    className={`w-full py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {t.registerconsultancy || 'Register for Personal Training'}
                  </button>
                  <div className="mt-4 text-center">
                    <p className={theme === 'light' ? 'text-blue-700' : 'text-teal-300'}>
                      {t.alreadyAccount || 'Already have an account?'}{' '}
                      <button
                        onClick={() => setAuthType('login')}
                        className={`transition-colors duration-200 ${
                          theme === 'light' ? 'text-teal-600 hover:underline' : 'text-teal-300 hover:underline'
                        }`}
                      >
                        {t.login || 'Login'}
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div> {/* End of Main Content wrapper */}
    </div>
    
  );
}

function FeaturedVideos({ videos, loading, theme }: { videos: Record<string, VideoType[]>, loading: boolean, theme: string }) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const categories = Object.keys(videos);
  const groupedVideos = videos;

  if (loading) {
    return (
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
    );
  }

  return (
    <div className="space-y-12">
      {categories.map(category => {
        const videosForCategory = groupedVideos[category] || [];
        const isExpanded = expandedCategories[category];
        const videosToShow = isExpanded ? videosForCategory : videosForCategory.slice(0, 4);

        return (
          <div key={category} className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{category.charAt(0).toUpperCase() + category.slice(1)}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {videosToShow.map((video, index) => (
                <motion.div 
                  key={video.id} 
                  className={`rounded-xl overflow-hidden shadow-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
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
                    <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{video.title || 'Untitled Video'}</h3>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      {video.channel || 'Channel Name'} • {video.views} views • 2 days ago
                    </p>
                    {video.description && (
                      <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{video.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            {videosForCategory.length > 4 && (
              <div className="text-center mt-4">
                <button onClick={() => toggleCategoryExpansion(category)} className={`px-4 py-2 rounded-lg font-semibold ${theme === 'light' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                  {isExpanded ? 'Show Less' : 'Show More'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}