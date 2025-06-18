"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiLogIn, FiMenu, FiX, FiHome, FiVideo, FiHeart, FiShoppingCart } from 'react-icons/fi';

export default function HomeClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState('login');
  const router = useRouter();

  const categories = [
    { id: 'cardio', name: 'karate', icon: '🏃‍♂️' },
    { id: 'aerobics', name: 'Aerobics', icon: '💃' },
    { id: 'gym', name: 'Gym Workouts', icon: '🏋️‍♂️' },
  ];

  // Toggle auth modal
  const toggleAuthModal = (type) => {
    setAuthType(type);
    setAuthModalOpen(!authModalOpen);
  };

  // Navigate to the selected category page
  const handleRegisterNavigation = (path) => {
    setAuthModalOpen(false);
    router.push(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">FitFlex</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-indigo-600 flex items-center">
                <FiHome className="mr-1" /> Home
              </a>
              <a href="#" className="text-gray-700 hover:text-indigo-600 flex items-center">
                <FiVideo className="mr-1" /> Workouts
              </a>
              <a href="#" className="text-gray-700 hover:text-indigo-600 flex items-center">
                <FiHeart className="mr-1" /> Favorites
              </a>
            </nav>

            {/* Auth Buttons - Desktop */}
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

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-700 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3">
              <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
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
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Transform Your Body <br className="hidden md:block" />
            <span className="text-indigo-600">With Expert Guidance</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Access hundreds of professional workout videos tailored to your fitness level and goals.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => router.push('../../consultancy')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg"
            >
              Start Consultancy
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              Browse Workouts
            </button>
          </div>
        </section>

        {/* Category Selector */}
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

        {/* Video Sections */}
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
            </section>
          ))}
        </div>

        {/* CTA Section */}
        <section className="mt-16 bg-indigo-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform?</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Join thousands of members achieving their fitness goals with our programs.
          </p>
          <button className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg">
            Get Started Today
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">FitFlex</h3>
              <p className="text-gray-400">
                Your complete fitness solution with professional guidance and workout plans.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
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
            <p>© {new Date().getFullYear()} FitFlex. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {authType === 'login' ? 'Welcome Back' : 'Choose Your Program'}
              </h3>
              <button 
                onClick={() => setAuthModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {authType === 'login' ? (
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    name="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your password"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded text-indigo-600" />
                    <span className="ml-2 text-gray-700">Remember me</span>
                  </label>
                  <a href="#" className="text-indigo-600 hover:underline">Forgot password?</a>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Login
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => handleRegisterNavigation('/register/earobics')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Register to Aerobics
                </button>
                <button 
                  onClick={() => handleRegisterNavigation('/register/gym')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Register to Gym
                </button>
                <button 
                  onClick={() => handleRegisterNavigation('/register/karate')}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Register to Karate
                </button>
              </div>
            )}
            
            <div className="mt-4 text-center text-gray-600">
              {authType === 'login' ? (
                <p>Don't have an account?{' '}
                  <button 
                    onClick={() => setAuthType('register')}
                    className="text-indigo-600 hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>Already have an account?{' '}
                  <button 
                    onClick={() => setAuthType('login')}
                    className="text-indigo-600 hover:underline"
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}