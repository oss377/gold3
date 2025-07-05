
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiLogIn, FiHome, FiVideo, FiHeart, FiUsers, FiMenu, FiX, FiSunset, FiMoon, FiClock, FiTrash2 } from 'react-icons/fi';
import { db } from '../app/fconfig'; // Adjust the path to your Firebase config
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Login from '../components/login';
import VideoFetch from '../components/VideoFetch';

function WelcomeCard() {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-transform duration-300 overflow-hidden hover:shadow-3xl">
      <div className="absolute inset-0 bg-[url('https://source.unsplash.com/random/800x600?fitness')] opacity-20 bg-cover bg-center rounded-2xl"></div>
      <div className="relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in">
          Welcome to Your Fitness Journey <br className="hidden md:block" />
          <span className="text-white animate-pulse">Get Started Today</span>
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Discover a variety of workouts tailored to your fitness goals.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.href = '/consultancy'}
            className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Start Consultancy
          </button>
          <button className="px-6 py-3 border border-white text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 hover:shadow-xl">
            Browse Workouts
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinGroupChatCard() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg transform hover:scale-105 transition-transform duration-300 border border-gray-100 hover:shadow-3xl text-center">
      <div className="flex justify-center items-center mb-4">
        <FiUsers className="text-indigo-600 text-3xl mr-3 animate-bounce" />
        <h2 className="text-2xl font-bold text-gray-800">Join Our Fitness Community</h2>
      </div>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Connect with others, share tips, and stay motivated in our group chat.
      </p>
      <button
        onClick={() => window.location.href = '/components/Messages'}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 hover:shadow-xl"
      >
        Join Chat
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
  const [isHighContrast, setIsHighContrast] = useState(false);
  const router = useRouter();

  const categories = [
    { id: 'karate', name: 'Karate', icon: '🏃‍♂️' },
    { id: 'aerobics', name: 'Aerobics', icon: '💃' },
    { id: 'gym', name: 'Gym', icon: '🏋️‍♂️' },
  ];

  const navItems = [
    { name: 'Home', icon: FiHome, href: '/' },
    { name: 'Workouts', icon: FiVideo, href: '/workouts' },
    { name: 'Favorites', icon: FiHeart, href: '/favorites' },
    { name: 'Login', icon: FiLogIn },
    { name: 'Register', icon: FiUser },
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
      await updateDoc(workoutRef, { pending: !currentStatus });
      setWorkouts(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].map(workout =>
          workout.id === workoutId ? { ...workout, pending: !currentStatus } : workout
        ),
      }));
    } catch (error) {
      console.error('Error toggling pending status:', error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleAuthModal = (type) => {
    setAuthType(type);
    setAuthModalOpen(!authModalOpen);
  };

  const toggleContrast = () => setIsHighContrast(!isHighContrast);

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
      className={
        `flex min-h-screen font-sans transition-colors duration-300 ` +
        (isHighContrast ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100')
      }
    >
      {/* Sidebar */}
      <aside
        className={
          `fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-300 ease-in-out ` +
          (isHighContrast ? 'bg-gray-800' : 'bg-gradient-to-b from-indigo-800 to-indigo-600') +
          (isSidebarOpen ? ' translate-x-0' : ' -translate-x-full')
        }
      >
        <div className="flex items-center justify-between p-5 border-b border-indigo-500/50">
          <div className="flex items-center space-x-3">
            <FiHome size={30} className="text-white" />
            <h1 className="text-xl font-bold tracking-tight text-white">Workout App</h1>
          </div>
          <button className="text-white hover:text-indigo-200" onClick={toggleSidebar}>
            <FiX size={24} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-3">
          {navItems.map((item) =>
            item.name === 'Login' || item.name === 'Register' ? (
              <button
                key={item.name}
                onClick={() => toggleAuthModal(item.name.toLowerCase())}
                className={
                  `flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ` +
                  (isHighContrast ? 'hover:bg-gray-700 hover:text-white' : 'hover:bg-indigo-700 hover:text-white')
                }
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.name}</span>
              </button>
            ) : (
              <a
                key={item.name}
                href={item.href}
                className={
                  `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ` +
                  (isHighContrast ? 'hover:bg-gray-700 hover:text-white' : 'hover:bg-indigo-700 hover:text-white')
                }
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.name}</span>
              </a>
            )
          )}
          <button
            onClick={toggleContrast}
            className={
              `flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ` +
              (isHighContrast ? 'hover:bg-gray-700' : 'hover:bg-indigo-700')
            }
          >
            {isHighContrast ? <FiSunset size={20} className="mr-3" /> : <FiMoon size={20} className="mr-3" />}
            <span>{isHighContrast ? 'Light Mode' : 'High Contrast'}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
      >
        {/* Header */}
        <header
          className={
            `shadow-md p-5 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 ` +
            (isHighContrast ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')
          }
        >
          <div className="flex items-center">
            <button
              className={
                `mr-4 ` +
                (isHighContrast ? 'text-gray-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-800')
              }
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <h2 className="text-2xl font-semibold tracking-tight">Workout App</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleAuthModal('login')}
              className={
                `px-4 py-2 rounded-lg font-medium transition-colors duration-200 ` +
                (isHighContrast ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'text-indigo-600 border border-indigo-600 hover:bg-indigo-50')
              }
            >
              <FiLogIn className="inline mr-1" /> Login
            </button>
            <button
              onClick={() => toggleAuthModal('register')}
              className={
                `px-4 py-2 rounded-lg font-medium transition-colors duration-200 ` +
                (isHighContrast ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700')
              }
            >
              <FiUser className="inline mr-1" /> Register
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <section className="mb-12">
            <WelcomeCard />
          </section>

          <section className="mb-12">
            <JoinGroupChatCard />
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

          <section className="bg-indigo-600 rounded-xl p-8 text-center text-white shadow-lg transform hover:scale-105 transition-transform duration-300 hover:shadow-3xl">
            <h2 className="text-3xl font-bold mb-4 animate-fade-in">Join Our Community</h2>
            <p className="text-xl mb-6 max-w-2xl mx-auto">
              Sign up today to access personalized workouts and expert guidance.
            </p>
            <button
              onClick={() => toggleAuthModal('register')}
              className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </section>
        </main>

        {/* Footer */}
        <footer
          className={
            `py-12 transition-colors duration-300 ` +
            (isHighContrast ? 'bg-gray-800 text-white' : 'bg-gray-800 text-white')
          }
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Workout App</h3>
                <p className="text-gray-400">
                  Your go-to platform for fitness and wellness.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      Blog
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      Help
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>© {new Date().getFullYear()} Workout App. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        {authModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={
                `rounded-xl max-w-md w-full p-6 animate-fade-in shadow-lg transform hover:scale-105 transition-transform duration-300 ` +
                (isHighContrast ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')
              }
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">
                  {authType === 'login' ? 'Welcome Back' : 'Choose Your Program'}
                </h3>
                <button
                  onClick={() => setAuthModalOpen(false)}
                  className={
                    `transition-colors duration-200 ` +
                    (isHighContrast ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700')
                  }
                >
                  <FiX size={24} />
                </button>
              </div>
              {authType === 'login' ? (
                <Login onSubmit={handleLogin} toggleAuthType={setAuthType} />
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/register/aerobics')}
                    className={
                      `w-full py-3 rounded-lg transition-colors duration-200 font-medium ` +
                      (isHighContrast ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white')
                    }
                  >
                    Register for Aerobics
                  </button>
                  <button
                    onClick={() => router.push('/register/gym')}
                    className={
                      `w-full py-3 rounded-lg transition-colors duration-200 font-medium ` +
                      (isHighContrast ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white')
                    }
                  >
                    Register for Gym
                  </button>
                  <button
                    onClick={() => router.push('/register/karate')}
                    className={
                      `w-full py-3 rounded-lg transition-colors duration-200 font-medium ` +
                      (isHighContrast ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white')
                    }
                  >
                    Register for Karate
                  </button>
                  <div className="mt-4 text-center">
                    <p>
                      Already have an account?{' '}
                      <button
                        onClick={() => setAuthType('login')}
                        className={
                          `transition-colors duration-200 ` +
                          (isHighContrast ? 'text-indigo-300 hover:underline' : 'text-indigo-600 hover:underline')
                        }
                      >
                        Login
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