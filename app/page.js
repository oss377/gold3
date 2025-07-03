'use client';
import { useState, useEffect } from 'react';
import { FiUser, FiLogIn, FiMenu, FiX, FiHome, FiVideo, FiHeart, FiTrash2, FiClock } from 'react-icons/fi';
import { db } from '../app/fconfig'; // Adjust the path to your Firebase config
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Login from '../components/login';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [workouts, setWorkouts] = useState({
    karate: [],
    aerobics: [],
    gym: [],
  });
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'karate', name: 'Karate', icon: '🏃‍♂️' },
    { id: 'aerobics', name: 'Aerobics', icon: '💃' },
    { id: 'gym', name: 'Gym', icon: '🏋️‍♂️' },
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

  // Toggle auth modal
  const toggleAuthModal = (type) => {
    setAuthType(type);
    setAuthModalOpen(!authModalOpen);
  };

  // Handle login form submission
  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    // Mock admin credentials check (replace with actual authentication logic)
    const isAdmin = email === 'awekeadisie@gmail.com' && password === '123456';

    if (isAdmin) {
      setAuthModalOpen(false);
      window.location.href = '/admin';
    } else {
      setAuthModalOpen(false);
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Workout App</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-700 hover:text-indigo-600 flex items-center">
                <FiHome className="mr-1" /> Home
              </a>
              <a href="#" className="text-gray-700 hover:text-indigo-600 flex items-center">
                <FiVideo className="mr-1" /> Workouts
              </a>
              <a href="#" className="text-gray-700 hover:text-indigo-600 flex items-center">
                <FiHeart className="mr-1" /> Favorites
              </a>
            </nav>
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => toggleAuthModal('login')}
                className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
              >
                <FiLogIn className="inline mr-1" /> Login
              </button>
              <button
                onClick={() => toggleAuthModal('register')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <FiUser className="inline mr-1" /> Register
              </button>
            </div>
            <button
              className="md:hidden text-gray-700 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3">
              <a href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                <FiHome className="inline mr-2" /> Home
              </a>
              <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                <FiVideo className="inline mr-2" /> Workouts
              </a>
              <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                <FiHeart className="inline mr-2" /> Favorites
              </a>
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => toggleAuthModal('login')}
                  className="w-full px-4 py-2 text-left text-indigo-600 hover:bg-indigo-50 rounded"
                >
                  <FiLogIn className="inline mr-2" /> Login
                </button>
                <button
                  onClick={() => toggleAuthModal('register')}
                  className="w-full px-4 py-2 text-left mt-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  <FiUser className="inline mr-2" /> Register
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Your Fitness Journey <br className="hidden md:block" />
            <span className="text-indigo-600">Get Started Today</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Discover a variety of workouts tailored to your fitness goals.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/consultancy'}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg"
            >
              Start Consultancy
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              Browse Workouts
            </button>
          </div>
        </section>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Popular Categories</h2>
          <div className="flex overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                className="flex-shrink-0 px-6 py-3 mx-2 bg-white rounded-full shadow-sm hover:shadow-md transition"
              >
                <span className="text-xl mr-2">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {categories.map(category => (
            <section key={category.id}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="text-2xl mr-2">{category.icon}</span>
                  {category.name} Workouts
                </h2>
                <a href="#" className="text-indigo-600 hover:underline">View All</a>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                      <div className="bg-gray-200 h-48 w-full animate-pulse"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        <div className="flex justify-between items-center mt-4">
                          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {workouts[category.id].map(workout => (
                    <div key={workout.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                      <div className="bg-gray-200 h-48 w-full" style={{ backgroundImage: `url(${workout.thumbnail || '/placeholder.jpg'})`, backgroundSize: 'cover' }}></div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-800">{workout.title || 'Untitled Workout'}</h3>
                        <p className="text-gray-600 text-sm">{workout.description || 'No description available'}</p>
                        <div className="flex justify-between items-center mt-4">
                          <button
                            onClick={() => handleTogglePending(category.id, workout.id, workout.pending || false)}
                            className={`px-3 py-1 rounded-lg ${workout.pending ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-yellow-600 transition`}
                          >
                            <FiClock className="inline mr-1" />
                            {workout.pending ? 'Mark Active' : 'Mark Pending'}
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, workout.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                          >
                            <FiTrash2 className="inline mr-1" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <section className="mt-16 bg-indigo-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Sign up today to access personalized workouts and expert guidance.
          </p>
          <button
            onClick={() => toggleAuthModal('register')}
            className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg"
          >
            Get Started
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
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
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Help</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Cookies</a></li>
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
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {authType === 'login HEADINGlogin' ? 'Welcome Back' : 'Choose Your Program'}
              </h3>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            {authType === 'login' ? (
              <Login onSubmit={handleLogin} toggleAuthType={setAuthType} />
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/register/earobics'}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Register for Aerobics
                </button>
                <button
                  onClick={() => window.location.href = '/register/gym'}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Register for Gym
                </button>
                <button
                  onClick={() => window.location.href = '/register/karate'}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Register for Karate
                </button>
                <div className="mt-4 text-center text-gray-600">
                  <p>
                    Already have an account?{' '}
                    <button
                      onClick={() => setAuthType('login')}
                      className="text-indigo-600 hover:underline"
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
  );
}