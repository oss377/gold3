// app/page.js
'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogIn, Home as HomeIcon, Video, Heart, Users, Menu, X, Sun, Moon, Trash2, Globe } from 'lucide-react';
import { db } from '../app/fconfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Login from '../components/login';
import VideoFetch from '../components/VideoFetch';
import { ThemeContext } from '../context/ThemeContext';
import LanguageContext from '../context/LanguageContext';
import Head from 'next/head';

function WelcomeCard({ theme, t }) {
  return (
    <div
      className={`relative rounded-2xl p-8 shadow-2xl transform hover:scale-105 transition-transform duration-300 hover:shadow-3xl ${
        theme === 'light' ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-zinc-800' : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
      }`}
    >
      <div className="relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in">
          {t.welcome || 'Welcome'} <br className="hidden md:block" />
          <span className={`animate-pulse ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`}>
            {t.getStarted || 'Get Started'}
          </span>
        </h1>
        <p className={`text-xl mb-8 max-w-2xl mx-auto ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
          {t.discoverWorkouts || 'Discover amazing workouts'}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.href = '/consultancy'}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl ${
              theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {t.startConsultancy || 'Start Consultancy'}
          </button>
          <button
            className={`px-6 py-3 border rounded-lg transition-colors duration-200 hover:shadow-xl ${
              theme === 'light' ? 'border-blue-600 text-blue-600 hover:bg-blue-100/50' : 'border-gray-500 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {t.browseWorkouts || 'Browse Workouts'}
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinGroupChatCard({ theme, t }) {
  return (
    <div
      className={`rounded-2xl p-8 shadow-lg transform hover:scale-105 transition-transform duration-300 border hover:shadow-3xl text-center ${
        theme === 'light' ? 'bg-gradient-to-br from-blue-100 to-purple-100 border-gray-100 text-zinc-800' : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-700 text-white'
      }`}
    >
      <div className="flex justify-center items-center mb-4">
        <Users className={`text-3xl mr-3 animate-bounce ${theme === 'light' ? 'text-blue-500' : 'text-yellow-400'}`} />
        <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
          {t.joinCommunity || 'Join Our Community'}
        </h2>
      </div>
      <p className={`mb-6 max-w-md mx-auto ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
        {t.connectCommunity || 'Connect with others in our community'}
      </p>
      <button
        onClick={() => window.location.href = '/components/Messages'}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 hover:shadow-xl ${
          theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
      >
        {t.joinChat || 'Join Chat'}
      </button>
    </div>
  );
}

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [workouts, setWorkouts] = useState({
    karate: [],
    aerobics: [],
    gym: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { language = 'en', toggleLanguage = () => {}, t = {} } = useContext(LanguageContext) || {};

  console.log({ language, toggleLanguage, t }); // Debug context values

  const categories = [
    { id: 'karate', name: 'Karate', icon: '🏃‍♂️' },
    { id: 'aerobics', name: 'Aerobics', icon: '💃' },
    { id: 'gym', name: 'Gym', icon: '🏋️‍♂️' },
  ];

  const navItems = [
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
        const fetchedWorkouts = {};
        for (const category of categories) {
          const querySnapshot = await getDocs(collection(db, category.id));
          fetchedWorkouts[category.id] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
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
  const handleDelete = async (categoryId, workoutId) => {
    try {
      await deleteDoc(doc(db, categoryId, workoutId));
      setWorkouts(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].filter(workout => workout.id !== workoutId),
      }));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  // Toggle pending status
  const handleTogglePending = async (categoryId, workoutId, currentStatus) => {
    try {
      const workoutRef = doc(db, categoryId, workoutId);
      await updateDoc(workoutRef, { soon: !currentStatus });
      setWorkouts(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].map(workout => 
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
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setAuthModalOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [authModalOpen]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleAuthModal = (type) => {
    setAuthType(type);
    setAuthModalOpen(!authModalOpen);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

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
      className={`flex min-h-screen font-sans transition-colors duration-300 ${
        theme === 'light' ? 'bg-zinc-100 text-gray-900' : 'bg-zinc-900 text-white'
      }`}
    >
      <Head>
        <title>{t.appTitle || 'Fitness App'} - {t.welcome || 'Welcome'}</title>
        <meta name="description" content={t.discoverWorkouts || 'Discover amazing workouts'} />
      </Head>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          theme === 'light' ? 'bg-gradient-to-b from-blue-100 to-purple-100 text-zinc-800' : 'bg-gradient-to-b from-gray-800 to-gray-900 text-white'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center justify-between p-5 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
          <div className="flex items-center space-x-3">
            <HomeIcon size={30} className={theme === 'light' ? 'text-blue-600' : 'text-yellow-400'} />
            <h1 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              {t.appTitle || 'Fitness App'}
            </h1>
          </div>
          <button
            className={theme === 'light' ? 'text-zinc-700 hover:text-zinc-900' : 'text-white hover:text-gray-200'}
            onClick={toggleSidebar}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-3">
          {navItems.map((item) =>
            item.name === (t.login || 'Login') || item.name === (t.register || 'Register') ? (
              <button
                key={item.name}
                onClick={() => toggleAuthModal(item.name.toLowerCase())}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon size={20} className={`mr-3 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`} />
                <span>{item.name}</span>
              </button>
            ) : (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon size={20} className={`mr-3 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`} />
                <span>{item.name}</span>
              </a>
            )
          )}
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
            }`}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon size={20} className="mr-3 text-blue-600" />
            ) : (
              <Sun size={20} className="mr-3 text-yellow-400" />
            )}
            <span>{t.darkMode || 'Dark Mode'}</span>
          </button>
          <button
            onClick={toggleLanguage}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              theme === 'light' ? 'hover:bg-blue-100 hover:text-blue-600' : 'hover:bg-gray-700 hover:text-white'
            }`}
            aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
          >
            <Globe size={20} className={`mr-3 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}`} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header
          className={`shadow-md p-5 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 ${
            theme === 'light' ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-zinc-800' : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
          }`}
        >
          <div className="flex items-center">
            <button
              className={theme === 'light' ? 'text-blue-600 hover:text-blue-800 mr-4' : 'text-yellow-400 hover:text-yellow-300 mr-4'}
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className={`text-2xl font-semibold tracking-tight ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              {t.appTitle || 'Fitness App'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleAuthModal('login')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <LogIn className="inline mr-1" /> {t.login || 'Login'}
            </button>
            <button
              onClick={() => toggleAuthModal('register')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <User className="inline mr-1" /> {t.register || 'Register'}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                theme === 'light' ? 'text-blue-600 hover:bg-blue-200/50' : 'text-yellow-400 hover:bg-gray-700/50'
              }`}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-lg transition-all ${
                theme === 'light' ? 'text-blue-600 hover:bg-blue-200/50' : 'text-yellow-400 hover:bg-gray-700/50'
              }`}
              aria-label={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className={`flex-1 container mx-auto px-4 py-8 ${
            theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900' : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white'
          }`}
        >
          <section className="mb-12">
            <WelcomeCard theme={theme} t={t} />
          </section>

          <section className="mb-12">
            <JoinGroupChatCard theme={theme} t={t} />
          </section>

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
            className={`rounded-xl p-8 text-center shadow-lg transform hover:scale-105 transition-transform duration-300 hover:shadow-3xl ${
              theme === 'light' ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-zinc-800' : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
            }`}
          >
            <h2 className={`text-3xl font-bold mb-4 animate-fade-in ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              {t.joinNow || 'Join Now'}
            </h2>
            <p className={`text-xl mb-6 max-w-2xl mx-auto ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
              {t.signUpText || 'Sign up to start your fitness journey'}
            </p>
            <button
              onClick={() => toggleAuthModal('register')}
              className={`px-8 py-3 rounded-lg font-bold transition-colors duration-200 shadow-lg hover:shadow-xl ${
                theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {t.getStartedButton || 'Get Started'}
            </button>
          </section>
        </main>

        {/* Footer */}
        <footer
          className={`py-12 transition-colors duration-300 ${
            theme === 'light' ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-zinc-800' : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{t.appTitle || 'Fitness App'}</h3>
                <p className={theme === 'light' ? 'text-zinc-700' : 'text-gray-200'}>
                  {t.discoverWorkouts || 'Discover amazing workouts'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t.company || 'Company'}</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
                    >
                      {t.about || 'About'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
                    >
                      {t.careers || 'Careers'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
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
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
                    >
                      {t.help || 'Help'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
                    >
                      {t.contact || 'Contact'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
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
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
                    >
                      {t.terms || 'Terms'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
                    >
                      {t.privacy || 'Privacy'}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors duration-200 ${theme === 'light' ? 'text-zinc-700 hover:text-blue-600' : 'text-gray-200 hover:text-white'}`}
                    >
                      {t.cookies || 'Cookies'}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div
              className={`border-t mt-8 pt-8 text-center ${
                theme === 'light' ? 'border-gray-200 text-zinc-700' : 'border-gray-700 text-gray-200'
              }`}
            >
              <p>{t.footerText || '© 2025 Fitness App. All rights reserved.'}</p>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        {authModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-xl max-w-md w-full p-6 animate-fade-in shadow-lg transform hover:scale-105 transition-transform duration-300 ${
                theme === 'light' ? 'bg-gradient-to-br from-blue-100 to-purple-100 text-zinc-800' : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
              }`}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                  {authType === 'login' ? (t.welcomeBack || 'Welcome Back') : (t.chooseProgram || 'Choose Your Program')}
                </h3>
                <button
                  onClick={() => setAuthModalOpen(false)}
                  className={`transition-colors duration-200 ${
                    theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 hover:text-white'
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
                    className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                      theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {t.registerAerobics || 'Register for Aerobics'}
                  </button>
                  <button
                    onClick={() => router.push('/register/gym')}
                    className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                      theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {t.registerGym || 'Register for Gym'}
                  </button>
                  <button
                    onClick={() => router.push('/register/karate')}
                    className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                      theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {t.registerKarate || 'Register for Karate'}
                  </button>
                  <div className="mt-4 text-center">
                    <p className={theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}>
                      {t.alreadyAccount || 'Already have an account?'}{' '}
                      <button
                        onClick={() => setAuthType('login')}
                        className={`transition-colors duration-200 ${
                          theme === 'light' ? 'text-blue-600 hover:underline' : 'text-yellow-400 hover:underline'
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
    </div>
  );
}