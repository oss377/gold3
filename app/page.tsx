
'use client';

import { useState, useEffect, useContext, useRef, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogIn, Home as HomeIcon, Video, Heart, Users, Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { db } from '../app/fconfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Login from '../components/login';
import VideoFetch from '../components/VideoFetch';
import { ThemeContext } from '../context/ThemeContext';
import LanguageContext from '../context/LanguageContext';
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

// Interface for Workout
interface Workout {
  id: string;
  soon?: boolean;
  [key: string]: any;
}

// Interface for Category
interface Category {
  id: string;
  name: string;
  icon: string;
}

// Interface for NavItem
interface NavItem {
  name: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  href?: string;
}

// Interface for Workouts State
interface Workouts {
  karate: Workout[];
  aerobics: Workout[];
  gym: Workout[];
}

// Interface for VideoFetch Props
interface VideoFetchProps {
  setWorkouts: Dispatch<SetStateAction<Workouts>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  categories: Category[];
  handleDelete: (categoryId: string, workoutId: string) => Promise<void>;
  handleTogglePending: (categoryId: string, workoutId: string, currentStatus: boolean) => Promise<void>;
}

// Interface for Login Props
interface LoginProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  toggleAuthType: Dispatch<SetStateAction<string>>;
  theme: string;
}

function WelcomeCard({ theme, t }: { theme: string; t: Translation }) {
  return (
    <div
      className={`relative rounded-3xl p-8 shadow-2xl transform hover:-translate-y-2 transition-all duration-500 ${
        theme === 'light'
          ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100'
          : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
      } border relative overflow-hidden`}
      style={{
        boxShadow: theme === 'light'
          ? '0 10px 30px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(59, 130, 246, 0.2)'
          : '0 10px 30px rgba(45, 212, 191, 0.3), 0 4px 10px rgba(45, 212, 191, 0.2)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z' fill='%23${theme === 'light' ? 'dbeafe' : '1e3a8a'}' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <div className="relative z-10 text-center">
        <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
          {t.welcome || 'Unleash Your Inner Strength'}
        </h1>
        <p
          className={`text-4xl font-extrabold mt-3 ${
            theme === 'light' ? 'text-teal-600' : 'text-teal-300'
          }`}
        >
          {t.getStarted || 'Start Your Transformation'}
        </p>
        <p className={`text-sm mt-3 ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
          {t.discoverWorkouts || 'Join our gym community and crush your fitness goals'}
        </p>
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={() => window.location.href = '/consultancy'}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
            }`}
          >
            {t.startConsultancy || 'Book a Free Consultation'}
          </button>
          <button
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' 
                ? 'border border-teal-600 text-teal-600 hover:bg-teal-100/50' 
                : 'border border-teal-400 text-teal-300 hover:bg-teal-800/50'
            }`}
          >
            {t.browseWorkouts || 'Explore Workout Plans'}
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinGroupChatCard({ theme, t }: { theme: string; t: Translation }) {
  return (
    <div
      className={`rounded-3xl shadow-2xl p-8 hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500 border relative overflow-hidden ${
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
      <div className="flex justify-center items-center mb-4">
        <Users className={`text-3xl mr-3 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`} />
        <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
          {t.joinCommunity || 'Join Our Fitness Tribe'}
        </h2>
      </div>
      <p className={`mb-6 text-center ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
        {t.connectCommunity || 'Connect with like-minded fitness enthusiasts and stay motivated'}
      </p>
      <div className="text-center">
        <button
          onClick={() => window.location.href = '/publicMessage'}
          className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
            theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
          }`}
        >
          {t.joinChat || 'Join the Community Chat'}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authType, setAuthType] = useState<string>('login');
  const [workouts, setWorkouts] = useState<Workouts>({
    karate: [],
    aerobics: [],
    gym: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const languageContext = useContext(LanguageContext);
  const { language = 'en', toggleLanguage = () => {}, t = {} as Translation } = languageContext || {};

  // Add a ref for the fallback icon
  const fallbackIconRef = useRef<SVGSVGElement | null>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    if (fallbackIconRef.current) {
      fallbackIconRef.current.style.display = 'block';
    }
  };

  const categories: Category[] = [
    { id: 'karate', name: 'Karate', icon: '🏃‍♂️' },
    { id: 'aerobics', name: 'Aerobics', icon: '💃' },
    { id: 'gym', name: 'Gym', icon: '🏋️‍♂️' },
  ];

  const navItems: NavItem[] = [
    { name: t.home || 'Home', icon: HomeIcon, href: '/' },
    { name: t.workouts || 'Workouts', icon: Video, href: '/workouts' },
    { name: t.favorites || 'Favorites', icon: Heart, href: '/favorites' },
    { name: t.login || 'Login', icon: LogIn },
    { name: t.register || 'Register', icon: User },
  ];

  // Fetch workouts from Firebase
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const fetchedWorkouts: Workouts = {
          karate: [],
          aerobics: [],
          gym: [],
        };
        for (const category of categories) {
          const querySnapshot = await getDocs(collection(db, category.id));
          fetchedWorkouts[category.id as keyof Workouts] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Workout[];
        }
        setWorkouts(fetchedWorkouts);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, []);

  // Delete a workout
  const handleDelete = async (categoryId: string, workoutId: string) => {
    try {
      await deleteDoc(doc(db, categoryId, workoutId));
      setWorkouts(prev => ({
        ...prev,
        [categoryId as keyof Workouts]: prev[categoryId as keyof Workouts].filter(workout => workout.id !== workoutId),
      }));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  // Toggle pending status
  const handleTogglePending = async (categoryId: string, workoutId: string, currentStatus: boolean) => {
    try {
      const workoutRef = doc(db, categoryId, workoutId);
      await updateDoc(workoutRef, { soon: !currentStatus });
      setWorkouts(prev => ({
        ...prev,
        [categoryId as keyof Workouts]: prev[categoryId as keyof Workouts].map(workout => 
          workout.id === workoutId ? { ...workout, soon: !currentStatus } : workout
        ),
      }));
    } catch (error) {
      console.error('Error toggling pending status:', error);
    }
  };

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
      className={`flex min-h-screen font-sans transition-colors duration-500 relative ${
        theme === 'light' ? 'bg-blue-50 bg-opacity-30' : 'bg-blue-950 bg-opacity-50'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M29 58C13.536 58 1 45.464 1 30 1 14.536 13.536 2 29 2c8.467 0 16.194 3.832 21.213 10.106C55.232 18.38 58 25.534 58 33c0 7.466-2.768 14.62-7.787 20.894C45.194 54.168 37.467 58 29 58z' fill='%23${theme === 'light' ? 'a3bffa' : '2a4365'}' fill-opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
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
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  theme === 'light' ? 'hover:bg-teal-100 hover:text-teal-600' : 'hover:bg-teal-800 hover:text-white'
                }`}
              >
                <item.icon
                  size={22}
                  className={`mr-4 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                />
                <span>{item.name}</span>
              </a>
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
        className={`flex-1 flex flex-col transition-all duration-500 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}
      >
        {/* Header */}
        <header
          className={`shadow-2xl p-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-blue-100 to-teal-100 text-blue-900'
              : 'bg-gradient-to-r from-blue-900 to-teal-900 text-white'
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
          className={`flex-1 p-8 overflow-y-auto ${
            theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-teal-50 text-blue-900' : 'bg-gradient-to-br from-blue-950 to-teal-950 text-white'
          }`}
        >
          {/* Full-Screen Background Image Section */}
          <section
            className="relative h-screen w-full bg-cover bg-center bg-no-repeat mb-12"
            style={{
              backgroundImage: theme === 'light' ? `url('/gym-background.jpg')` : `url('/gym.jpg')`,
              backgroundSize: '100% auto', // Adjusts image to match device width, maintaining aspect ratio
              backgroundPosition: 'center top', // Ensures image is centered and starts from top
            }}
          >
            <div className="relative flex flex-col items-center justify-center text-center h-full">
              <h1
                className={`text-5xl md:text-6xl font-extrabold tracking-tight mb-4 ${
                  theme === 'light' ? 'text-black drop-shadow-md' : 'text-white drop-shadow-md'
                }`}
              >
                {t.heroTitle || 'Transform Your Body, Transform Your Life'}
              </h1>
              <p
                className={`text-lg md:text-xl max-w-2xl mx-auto ${
                  theme === 'light' ? 'text-black drop-shadow-sm' : 'text-white drop-shadow-sm'
                }`}
              >
                {t.heroSubtitle || 'Join our gym, access world-class workouts, and become the strongest version of yourself.'}
              </p>
              <button
                onClick={() => toggleAuthModal('register')}
                className={`{ mt-6 px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${ theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'}`}
              >
                {t.getStartedButton || 'Join Now'}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <WelcomeCard theme={theme} t={t} />
            <JoinGroupChatCard theme={theme} t={t} />
          </div>

          <section className="mb-12">
            <VideoFetch
              setWorkouts={setWorkouts}
              setLoading={setLoading}
              loading={loading}
              categories={categories}
              handleDelete={handleDelete}
              handleTogglePending={handleTogglePending}
            />
          </section>

          <section
            className={`rounded-3xl shadow-2xl p-8 hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-500 border relative overflow-hidden ${
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
          className={`py-8 transition-colors duration-500 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-blue-100 to-teal-100 text-blue-900'
              : 'bg-gradient-to-r from-blue-900 to-teal-900 text-white'
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
      </div>
    </div> );}