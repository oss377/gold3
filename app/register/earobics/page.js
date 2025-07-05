"use client";

import { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Listbox } from '@headlessui/react';
import { collection, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../../app/fconfig';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ThemeContext } from '../../../context/ThemeContext';
import { LanguageContext } from '../../../context/LanguageContext';

export default function AerobicsRegistrationForm() {
  const router = useRouter();
  const { t } = useContext(LanguageContext);
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(t.themeProviderError || 'AerobicsRegistrationForm must be used within a ThemeProvider');
  }
  const { theme } = context;

  const membershipOptions = [
    t.membershipBasic || 'Basic',
    t.membershipPremium || 'Premium',
    t.membershipPro || 'Pro',
  ];
  const days = [
    t.monday || 'Monday',
    t.tuesday || 'Tuesday',
    t.wednesday || 'Wednesday',
    t.thursday || 'Thursday',
    t.friday || 'Friday',
    t.saturday || 'Saturday',
    t.sunday || 'Sunday',
  ];
  const times = [
    t.earlyMornings || 'Early Mornings',
    t.mornings || 'Mornings',
    t.earlyAfternoons || 'Early Afternoons',
    t.afternoons || 'Afternoons',
    t.evenings || 'Evenings',
  ];
  const months = [
    t.september || 'September',
    t.october || 'October',
    t.november || 'November',
    t.december || 'December',
    t.january || 'January',
    t.february || 'February',
    t.march || 'March',
    t.april || 'April',
    t.may || 'May',
    t.june || 'June',
    t.july || 'July',
    t.august || 'August',
  ];
  const reasons = [
    t.stress || 'Stress',
    t.depression || 'Depression',
    t.boredom || 'Boredom',
    t.happiness || 'Happiness',
    t.habit || 'Habit',
    t.annoyance || 'Annoyance',
  ];
  const goals = [
    t.developmentMuscles || 'Development of muscles',
    t.reducingStress || 'Reducing the stress',
    t.losingBodyFat || 'Losing body fat',
    t.increasingMotivation || 'Increasing the motivation',
    t.trainingEvent || 'Training for an event/specific sport',
    t.other || 'Other',
  ];

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      email: '',
      password: '',
      streetAddress: '',
      streetAddress2: '',
      city: '',
      state: '',
      zipCode: '',
      phoneNumber: '',
      emergencyName: '',
      emergencyPhone: '',
      height: '',
      weight: '',
      goalWeight: '',
      bloodType: '',
      healthIssues: '',
      medications: '',
      smoke: false,
      surgery: false,
      alcohol: false,
      supplements: false,
      foodTracking: false,
      proSport: false,
      exercisePain: false,
      nightEating: '',
      breakfastFrequency: '',
      nutritionRating: '',
      exerciseDays: [],
      exerciseTime: '',
      trainingGoals: [],
      eatingReasons: [],
      membershipType: '',
      exerciseDuration: '',
      startMonth: '',
      signature: '',
      role: 'user',
    }
  });
  const [membershipType, setMembershipType] = useState(t.membershipBasic || 'Basic');
  const [exerciseDays, setExerciseDays] = useState([]);
  const [exerciseTime, setExerciseTime] = useState(t.mornings || 'Mornings');
  const [startMonth, setStartMonth] = useState(t.september || 'September');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const steps = [
    { name: t.personalInfo || 'Personal Info', fields: ['firstName', 'lastName', 'birthDate', 'email', 'password', 'role'] },
    { name: t.contactInfo || 'Contact Info', fields: ['streetAddress', 'streetAddress2', 'city', 'state', 'zipCode', 'phoneNumber', 'emergencyName', 'emergencyPhone'] },
    { name: t.healthInfo || 'Health Info', fields: ['height', 'weight', 'goalWeight', 'bloodType', 'healthIssues', 'medications', 'smoke', 'surgery', 'alcohol', 'supplements', 'foodTracking', 'proSport', 'exercisePain', 'nightEating', 'breakfastFrequency', 'nutritionRating'] },
    { name: t.preferences || 'Preferences', fields: ['exerciseDays', 'exerciseTime', 'trainingGoals', 'eatingReasons', 'membershipType', 'exerciseDuration', 'startMonth'] },
    { name: t.reviewSubmit || 'Review & Submit', fields: ['signature'] },
  ];

  useEffect(() => {
    if (!auth || !db) {
      setFormErrors({ global: t.firebaseError || 'Firebase services are not initialized.' });
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!mounted) return;
          if (user) {
            setIsAuthenticated(true);
            setIsLoading(false);
          } else {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        }, (error) => {
          if (!mounted) return;
          setFormErrors({ global: t.firebaseApiKeyError || `Authentication setup failed: ${error.message || 'Unknown error'}` });
          setIsLoading(false);
        });
        return () => {
          mounted = false;
          unsubscribe();
        };
      } catch (err) {
        if (mounted) {
          setFormErrors({ global: t.firebaseApiKeyError || `Authentication setup failed: ${err.message || 'Unknown error'}` });
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, [t]);

  const handleAuth = async (email, password, isSignUp = false) => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 'auth/wrong-password') errorMessage = t.wrongPassword || 'Incorrect password.';
      if (err.code === 'auth/user-not-found') errorMessage = t.userNotFound || 'No account found with this email.';
      if (err.code === 'auth/email-already-in-use') errorMessage = t.emailInUse || 'Email already in use.';
      if (err.code === 'auth/invalid-email') errorMessage = t.invalidEmail || 'Invalid email format.';
      if (err.code === 'auth/weak-password') errorMessage = t.weakPassword || 'Password must be at least 6 characters.';
      if (err.code === 'auth/invalid-api-key') errorMessage = t.firebaseApiKeyError || 'Invalid Firebase API key. Please contact support.';
      throw new Error(errorMessage);
    }
  };

  const onSubmit = async (data) => {
    setFormErrors({});
    if (!isAuthenticated || !auth.currentUser) {
      try {
        await handleAuth(data.email, data.password, true);
      } catch (err) {
        toast.error(err.message);
        setFormErrors({ global: err.message });
        return;
      }
    }

    try {
      await addDoc(collection(db, 'aerobics'), {
        ...data,
        exerciseDays,
        exerciseTime,
        membershipType,
        startMonth,
        role: 'user',
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });
      toast.success(t.successMessage || 'Registration successful!');
      setIsSubmitted(true);
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 'permission-denied') {
        errorMessage = t.permissionError || 'Permission denied: Unable to save data.';
      } else if (err.code === 'unavailable') {
        errorMessage = t.firestoreError || 'Firestore service is unavailable.';
      } else if (err.code === 'auth/invalid-api-key') {
        errorMessage = t.firebaseApiKeyError || 'Invalid Firebase API key. Please contact support.';
      } else if (err.message) {
        errorMessage = t.unexpectedError || `Error: ${err.message}`;
      }
      toast.error(errorMessage);
      setFormErrors({ global: errorMessage });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const currentFields = steps[currentStep].fields;
      const hasErrors = currentFields.some((field) => errors[field]);
      if (!hasErrors) {
        if (currentStep === 0 && !isAuthenticated) {
          const { email, password } = watch();
          handleAuth(email, password, true).catch((err) => {
            toast.error(err.message);
            setFormErrors({ global: err.message });
          });
        } else {
          setCurrentStep(currentStep + 1);
        }
      } else {
        toast.error(t.validationError || 'Please fix errors before proceeding.');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleGoToHome = () => {
    router.push('/');
  };

  const formData = watch();

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === 'light' ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'bg-gradient-to-r from-gray-700 to-gray-800'
        }`}
      >
        <div
          className={`text-2xl font-semibold animate-pulse ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}
        >
          {t.loading || 'Loading...'}
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === 'light' ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'bg-gradient-to-r from-gray-700 to-gray-800'
        }`}
      >
        <div
          className={`max-w-4xl w-full p-8 rounded-xl shadow-2xl text-center ${
            theme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}
        >
          <h2
            className={`text-3xl font-extrabold mb-6 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}
          >
            {t.registrationComplete || 'Registration Complete!'}
          </h2>
          <p
            className={`mb-8 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}
          >
            {t.successMessage || 'Thank you for registering with Aerobics Fitness. Your information has been successfully saved.'}
          </p>
          <button
            onClick={handleGoToHome}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              theme === 'light'
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400'
            }`}
          >
            {t.goToHome || 'Go to Home Page'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
        theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-900'
      }`}
    >
      <div
        className={`max-w-4xl w-full p-8 rounded-xl shadow-2xl ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'
        }`}
      >
        <h2
          className={`text-3xl font-extrabold text-center mb-8 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}
        >
          {t.title || 'Aerobics Fitness Registration'}
        </h2>

        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.name} className="flex-1 text-center">
              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                  index <= currentStep
                    ? theme === 'light'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                    : theme === 'light'
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  index + 1
                )}
              </div>
              <p
                className={`mt-2 text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}
              >
                {step.name}
              </p>
            </div>
          ))}
        </div>

        {formErrors.global && (
          <p
            className={`text-center mb-6 p-3 rounded-md ${
              theme === 'light' ? 'text-red-500 bg-red-50' : 'text-red-400 bg-red-900/50'
            }`}
          >
            {formErrors.global}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <h3
                className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}
              >
                {t.personalInfo || 'Personal Information'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.firstName || 'First Name'}
                  </label>
                  <input
                    {...register('firstName', { required: t.firstNameError || 'First name is required' })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.firstNamePlaceholder || 'Enter your first name'}
                    aria-label={t.firstName || 'First Name'}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.lastName || 'Last Name'}
                  </label>
                  <input
                    {...register('lastName', { required: t.lastNameError || 'Last name is required' })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.lastNamePlaceholder || 'Enter your last name'}
                    aria-label={t.lastName || 'Last Name'}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.birthDate || 'Birth Date'}
                  </label>
                  <input
                    type="date"
                    {...register('birthDate', { required: t.birthDateError || 'Birth date is required' })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.birthDatePlaceholder || 'Select your birth date'}
                    aria-label={t.birthDate || 'Birth Date'}
                    aria-describedby={errors.birthDate ? 'birthDate-error' : undefined}
                  />
                  {errors.birthDate && (
                    <p id="birthDate-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.birthDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.email || 'Email'}
                  </label>
                  <input
                    type="email"
                    {...register('email', {
                      required: t.emailError || 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: t.emailInvalid || 'Invalid email' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.emailPlaceholder || 'Enter your email'}
                    aria-label={t.email || 'Email'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.password || 'Password'}
                  </label>
                  <input
                    type="password"
                    {...register('password', {
                      required: t.passwordError || 'Password is required',
                      minLength: { value: 6, message: t.passwordLength || 'Password must be at least 6 characters' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.passwordPlaceholder || 'Enter your password'}
                    aria-label={t.password || 'Password'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  {errors.password && (
                    <p id="password-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.role || 'Role'}
                  </label>
                  <input
                    {...register('role')}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.rolePlaceholder || 'User role'}
                    readOnly
                    aria-label={t.role || 'Role'}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3
                className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}
              >
                {t.contactInfo || 'Contact Information'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.streetAddress || 'Street Address'}
                  </label>
                  <input
                    {...register('streetAddress', { required: t.streetAddressError || 'Street address is required' })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.streetAddressPlaceholder || 'Enter your street address'}
                    aria-label={t.streetAddress || 'Street Address'}
                    aria-describedby={errors.streetAddress ? 'streetAddress-error' : undefined}
                  />
                  {errors.streetAddress && (
                    <p id="streetAddress-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.streetAddress.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.streetAddress2 || 'Street Address 2'}
                  </label>
                  <input
                    {...register('streetAddress2')}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.streetAddress2Placeholder || 'Apartment, suite, etc. (optional)'}
                    aria-label={t.streetAddress2 || 'Street Address 2'}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.city || 'City'}
                  </label>
                  <input
                    {...register('city', { required: t.cityError || 'City is required' })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.cityPlaceholder || 'Enter your city'}
                    aria-label={t.city || 'City'}
                    aria-describedby={errors.city ? 'city-error' : undefined}
                  />
                  {errors.city && (
                    <p id="city-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.state || 'State/Province'}
                  </label>
                  <input
                    {...register('state', { required: t.stateError || 'State is required' })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.statePlaceholder || 'Enter your state'}
                    aria-label={t.state || 'State/Province'}
                    aria-describedby={errors.state ? 'state-error' : undefined}
                  />
                  {errors.state && (
                    <p id="state-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.state.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.zipCode || 'Zip Code'}
                  </label>
                  <input
                    {...register('zipCode', { required: t.zipCodeError || 'Zip code is required' })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.zipCodePlaceholder || 'Enter your zip code'}
                    aria-label={t.zipCode || 'Zip Code'}
                    aria-describedby={errors.zipCode ? 'zipCode-error' : undefined}
                  />
                  {errors.zipCode && (
                    <p id="zipCode-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.zipCode.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.phoneNumber || 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    {...register('phoneNumber', {
                      required: t.phoneNumberError || 'Phone number is required',
                      pattern: { value: /^\+?[\d\s-]{10,}$/, message: t.phoneNumberInvalid || 'Invalid phone number' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.phoneNumberPlaceholder || 'Enter your phone number'}
                    aria-label={t.phoneNumber || 'Phone Number'}
                    aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
                  />
                  {errors.phoneNumber && (
                    <p id="phoneNumber-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.emergencyName || 'Emergency Contact Name'}
                  </label>
                  <input
                    {...register('emergencyName', { required: t.emergencyNameError || 'Emergency contact name is required' })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.emergencyNamePlaceholder || 'Enter emergency contact name'}
                    aria-label={t.emergencyName || 'Emergency Contact Name'}
                    aria-describedby={errors.emergencyName ? 'emergencyName-error' : undefined}
                  />
                  {errors.emergencyName && (
                    <p id="emergencyName-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.emergencyName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.emergencyPhone || 'Emergency Contact Phone'}
                  </label>
                  <input
                    type="tel"
                    {...register('emergencyPhone', {
                      required: t.emergencyPhoneError || 'Emergency phone is required',
                      pattern: { value: /^\+?[\d\s-]{10,}$/, message: t.emergencyPhoneInvalid || 'Invalid phone number' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.emergencyPhonePlaceholder || 'Enter emergency contact phone'}
                    aria-label={t.emergencyPhone || 'Emergency Contact Phone'}
                    aria-describedby={errors.emergencyPhone ? 'emergencyPhone-error' : undefined}
                  />
                  {errors.emergencyPhone && (
                    <p id="emergencyPhone-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.emergencyPhone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3
                className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}
              >
                {t.healthInfo || 'Health Information'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.height || 'Height (cm)'}
                  </label>
                  <input
                    type="number"
                    {...register('height', {
                      required: t.heightError || 'Height is required',
                      min: { value: 0, message: t.heightPositive || 'Height must be positive' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.heightPlaceholder || 'Enter height in cm'}
                    aria-label={t.height || 'Height'}
                    aria-describedby={errors.height ? 'height-error' : undefined}
                  />
                  {errors.height && (
                    <p id="height-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.height.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.weight || 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    {...register('weight', {
                      required: t.weightError || 'Weight is required',
                      min: { value: 0, message: t.weightPositive || 'Weight must be positive' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.weightPlaceholder || 'Enter weight in kg'}
                    aria-label={t.weight || 'Weight'}
                    aria-describedby={errors.weight ? 'weight-error' : undefined}
                  />
                  {errors.weight && (
                    <p id="weight-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.weight.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.goalWeight || 'Goal Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    {...register('goalWeight', {
                      min: { value: 0, message: t.goalWeightPositive || 'Goal weight must be positive' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.goalWeightPlaceholder || 'Enter goal weight'}
                    aria-label={t.goalWeight || 'Goal Weight'}
                    aria-describedby={errors.goalWeight ? 'goalWeight-error' : undefined}
                  />
                  {errors.goalWeight && (
                    <p id="goalWeight-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.goalWeight.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.bloodType || 'Blood Type'}
                  </label>
                  <input
                    {...register('bloodType')}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.bloodTypePlaceholder || 'Enter your blood type'}
                    aria-label={t.bloodType || 'Blood Type'}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.healthIssues || 'Health Issues'}
                  </label>
                  <textarea
                    {...register('healthIssues')}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    rows="4"
                    placeholder={t.healthIssuesPlaceholder || 'Describe any health issues'}
                    aria-label={t.healthIssues || 'Health Issues'}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.medications || 'Medications'}
                  </label>
                  <textarea
                    {...register('medications')}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    rows="4"
                    placeholder={t.medicationsPlaceholder || 'List any medications'}
                    aria-label={t.medications || 'Medications'}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3
                  className={`text-lg font-medium ${
                    theme === 'light' ? 'text-gray-800' : 'text-white'
                  }`}
                >
                  {t.healthLifestyle || 'Health & Lifestyle'}
                </h3>
                {[
                  { label: t.smoke || 'Do you smoke?', name: 'smoke' },
                  { label: t.surgery || 'Had surgery in the last year?', name: 'surgery' },
                  { label: t.alcohol || 'Do you drink alcohol?', name: 'alcohol' },
                  { label: t.supplements || 'Using vitamins/supplements?', name: 'supplements' },
                  { label: t.foodTracking || 'Tracking daily food intake?', name: 'foodTracking' },
                  { label: t.proSport || 'Done sport professionally?', name: 'proSport' },
                  { label: t.exercisePain || 'Feel pain during exercise?', name: 'exercisePain' },
                ].map((q) => (
                  <div key={q.name} className="flex items-center space-x-4">
                    <label
                      className={`text-sm font-medium ${
                        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}
                    >
                      {q.label}
                    </label>
                    <input
                      type="checkbox"
                      {...register(q.name)}
                      className={`h-5 w-5 rounded ${
                        theme === 'light'
                          ? 'text-blue-600 focus:ring-blue-500 border-gray-300'
                          : 'text-yellow-400 focus:ring-yellow-400 border-gray-600'
                      }`}
                      aria-label={q.label}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.nightEating || 'Night Eating Frequency (0-5)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('nightEating', {
                      required: t.nightEatingError || 'Required',
                      min: { value: 0, message: t.nightEatingMin || 'Must be at least 0' },
                      max: { value: 5, message: t.nightEatingMax || 'Must be at most 5' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.nightEatingPlaceholder || 'Enter 0-5'}
                    aria-label={t.nightEating || 'Night Eating Frequency'}
                    aria-describedby={errors.nightEating ? 'nightEating-error' : undefined}
                  />
                  {errors.nightEating && (
                    <p id="nightEating-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.nightEating.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.breakfastFrequency || 'Breakfast Frequency (0-5)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('breakfastFrequency', {
                      required: t.breakfastFrequencyError || 'Required',
                      min: { value: 0, message: t.breakfastFrequencyMin || 'Must be at least 0' },
                      max: { value: 5, message: t.breakfastFrequencyMax || 'Must be at most 5' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.breakfastFrequencyPlaceholder || 'Enter 0-5'}
                    aria-label={t.breakfastFrequency || 'Breakfast Frequency'}
                    aria-describedby={errors.breakfastFrequency ? 'breakfastFrequency-error' : undefined}
                  />
                  {errors.breakfastFrequency && (
                    <p id="breakfastFrequency-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.breakfastFrequency.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.nutritionRating || 'Nutrition Rating (0-5)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('nutritionRating', {
                      required: t.nutritionRatingError || 'Required',
                      min: { value: 0, message: t.nutritionRatingMin || 'Must be at least 0' },
                      max: { value: 5, message: t.nutritionRatingMax || 'Must be at most 5' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.nutritionRatingPlaceholder || 'Enter 0-5'}
                    aria-label={t.nutritionRating || 'Nutrition Rating'}
                    aria-describedby={errors.nutritionRating ? 'nutritionRating-error' : undefined}
                  />
                  {errors.nutritionRating && (
                    <p id="nutritionRating-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.nutritionRating.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3
                className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}
              >
                {t.preferences || 'Preferences'}
              </h3>
              <div>
                <label
                  className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  {t.exerciseDays || 'Exercise Days'}
                </label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {days.map((day) => (
                    <div key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        value={day}
                        onChange={(e) => {
                          const updatedDays = e.target.checked
                            ? [...exerciseDays, day]
                            : exerciseDays.filter((d) => d !== day);
                          setExerciseDays(updatedDays);
                          setValue('exerciseDays', updatedDays);
                        }}
                        className={`h-5 w-5 rounded ${
                          theme === 'light'
                            ? 'text-blue-600 focus:ring-blue-500 border-gray-300'
                            : 'text-yellow-400 focus:ring-yellow-400 border-gray-600'
                        }`}
                        aria-label={day}
                      />
                      <span
                        className={`ml-2 ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  {t.exerciseTime || 'Preferred Exercise Time'}
                </label>
                <Listbox
                  value={exerciseTime}
                  onChange={(value) => {
                    setExerciseTime(value);
                    setValue('exerciseTime', value);
                  }}
                >
                  <Listbox.Button
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 text-left ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                  >
                    {exerciseTime}
                  </Listbox.Button>
                  <Listbox.Options
                    className={`mt-1 border rounded-lg shadow-lg max-h-60 overflow-auto ${
                      theme === 'light'
                        ? 'bg-white border-gray-300'
                        : 'bg-gray-800 border-gray-600'
                    }`}
                  >
                    {times.map((time) => (
                      <Listbox.Option
                        key={time}
                        value={time}
                        className={`p-3 cursor-pointer ${
                          theme === 'light'
                            ? 'hover:bg-blue-100 text-gray-700'
                            : 'hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        {time}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Listbox>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  {t.trainingGoals || 'Training Goals'}
                </label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {goals.map((goal) => (
                    <div key={goal} className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('trainingGoals')}
                        value={goal}
                        className={`h-5 w-5 rounded ${
                          theme === 'light'
                            ? 'text-blue-600 focus:ring-blue-500 border-gray-300'
                            : 'text-yellow-400 focus:ring-yellow-400 border-gray-600'
                        }`}
                        aria-label={goal}
                      />
                      <span
                        className={`ml-2 ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        {goal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  {t.eatingReasons || 'Reasons for Eating (Besides Hunger)'}
                </label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {reasons.map((reason) => (
                    <div key={reason} className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('eatingReasons')}
                        value={reason}
                        className={`h-5 w-5 rounded ${
                          theme === 'light'
                            ? 'text-blue-600 focus:ring-blue-500 border-gray-300'
                            : 'text-yellow-400 focus:ring-yellow-400 border-gray-600'
                        }`}
                        aria-label={reason}
                      />
                      <span
                        className={`ml-2 ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        {reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.membershipType || 'Membership Type'}
                  </label>
                  <Listbox
                    value={membershipType}
                    onChange={(value) => {
                      setMembershipType(value);
                      setValue('membershipType', value);
                    }}
                  >
                    <Listbox.Button
                      className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 text-left ${
                        theme === 'light'
                          ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                      }`}
                    >
                      {membershipType}
                    </Listbox.Button>
                    <Listbox.Options
                      className={`mt-1 border rounded-lg shadow-lg ${
                        theme === 'light'
                          ? 'bg-white border-gray-300'
                          : 'bg-gray-800 border-gray-600'
                      }`}
                    >
                      {membershipOptions.map((option) => (
                        <Listbox.Option
                          key={option}
                          value={option}
                          className={`p-3 cursor-pointer ${
                            theme === 'light'
                              ? 'hover:bg-blue-100 text-gray-700'
                              : 'hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          {option}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.exerciseDuration || 'Exercise Duration (Months)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    {...register('exerciseDuration', {
                      required: t.exerciseDurationError || 'Required',
                      min: { value: 1, message: t.exerciseDurationMin || 'Must be at least 1' },
                      max: { value: 12, message: t.exerciseDurationMax || 'Must be at most 12' },
                    })}
                    className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                    }`}
                    placeholder={t.exerciseDurationPlaceholder || 'Enter 1-12'}
                    aria-label={t.exerciseDuration || 'Exercise Duration'}
                    aria-describedby={errors.exerciseDuration ? 'exerciseDuration-error' : undefined}
                  />
                  {errors.exerciseDuration && (
                    <p id="exerciseDuration-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                      {errors.exerciseDuration.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.startMonth || 'Start Month'}
                  </label>
                  <Listbox
                    value={startMonth}
                    onChange={(value) => {
                      setStartMonth(value);
                      setValue('startMonth', value);
                    }}
                  >
                    <Listbox.Button
                      className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 text-left ${
                        theme === 'light'
                          ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                      }`}
                    >
                      {startMonth}
                    </Listbox.Button>
                    <Listbox.Options
                      className={`mt-1 border rounded-lg shadow-lg max-h-60 overflow-auto ${
                        theme === 'light'
                          ? 'bg-white border-gray-300'
                          : 'bg-gray-800 border-gray-600'
                      }`}
                    >
                      {months.map((month) => (
                        <Listbox.Option
                          key={month}
                          value={month}
                          className={`p-3 cursor-pointer ${
                            theme === 'light'
                              ? 'hover:bg-blue-100 text-gray-700'
                              : 'hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          {month}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h3
                className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}
              >
                {t.reviewSubmit || 'Review Your Information'}
              </h3>
              <div
                className={`p-4 rounded-lg space-y-4 ${
                  theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'
                }`}
              >
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.personalInfo || 'Personal Information'}
                  </h4>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.firstName || 'First Name'}: {formData.firstName || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.lastName || 'Last Name'}: {formData.lastName || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.birthDate || 'Birth Date'}: {formData.birthDate || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.email || 'Email'}: {formData.email || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.role || 'Role'}: {formData.role || (t.user || 'user')}
                  </p>
                </div>
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.contactInfo || 'Contact Information'}
                  </h4>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.streetAddress || 'Street Address'}: {formData.streetAddress || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.streetAddress2 || 'Street Address 2'}: {formData.streetAddress2 || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.city || 'City'}: {formData.city || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.state || 'State'}: {formData.state || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.zipCode || 'Zip Code'}: {formData.zipCode || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.phoneNumber || 'Phone Number'}: {formData.phoneNumber || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.emergencyContact || 'Emergency Contact'}: {formData.emergencyName || (t.notProvided || 'Not provided')} -{' '}
                    {formData.emergencyPhone || (t.notProvided || 'Not provided')}
                  </p>
                </div>
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.healthInfo || 'Health Information'}
                  </h4>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.height || 'Height'}: {formData.height || (t.notProvided || 'Not provided')} cm
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.weight || 'Weight'}: {formData.weight || (t.notProvided || 'Not provided')} kg
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.goalWeight || 'Goal Weight'}: {formData.goalWeight || (t.notProvided || 'Not provided')} kg
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.bloodType || 'Blood Type'}: {formData.bloodType || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.healthIssues || 'Health Issues'}: {formData.healthIssues || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.medications || 'Medications'}: {formData.medications || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.healthLifestyle || 'Health & Lifestyle'}:{' '}
                    {[
                      formData.smoke && (t.smoke || 'Smokes'),
                      formData.surgery && (t.surgery || 'Recent Surgery'),
                      formData.alcohol && (t.alcohol || 'Drinks Alcohol'),
                      formData.supplements && (t.supplements || 'Uses Supplements'),
                      formData.foodTracking && (t.foodTracking || 'Tracks Food'),
                      formData.proSport && (t.proSport || 'Professional Sport'),
                      formData.exercisePain && (t.exercisePain || 'Exercise Pain'),
                    ]
                      .filter(Boolean)
                      .join(', ') || (t.none || 'None')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.nightEating || 'Night Eating Frequency'}: {formData.nightEating || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.breakfastFrequency || 'Breakfast Frequency'}: {formData.breakfastFrequency || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.nutritionRating || 'Nutrition Rating'}: {formData.nutritionRating || (t.notProvided || 'Not provided')}
                  </p>
                </div>
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    {t.preferences || 'Preferences'}
                  </h4>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.exerciseDays || 'Exercise Days'}: {exerciseDays.length > 0 ? exerciseDays.join(', ') : (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.exerciseTime || 'Exercise Time'}: {exerciseTime}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.trainingGoals || 'Training Goals'}: {formData.trainingGoals?.join(', ') || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.eatingReasons || 'Eating Reasons'}: {formData.eatingReasons?.join(', ') || (t.notProvided || 'Not provided')}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.membershipType || 'Membership Type'}: {membershipType}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.exerciseDuration || 'Exercise Duration'}: {formData.exerciseDuration || (t.notProvided || 'Not provided')} {t.months || 'months'}
                  </p>
                  <p
                    className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                  >
                    {t.startMonth || 'Start Month'}: {startMonth}
                  </p>
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  {t.signature || 'Signature'}
                </label>
                <input
                  {...register('signature', { required: t.signatureError || 'Signature is required' })}
                  className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm transition-all duration-300 ${
                    theme === 'light'
                      ? 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 text-white'
                  }`}
                  placeholder={t.signaturePlaceholder || 'Type your full name as signature'}
                  aria-label={t.signature || 'Signature'}
                  aria-describedby={errors.signature ? 'signature-error' : undefined}
                />
                {errors.signature && (
                  <p id="signature-error" className={`text-xs mt-1 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`}>
                    {errors.signature.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                currentStep === 0
                  ? theme === 'light'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : theme === 'light'
                  ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500'
                  : 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5 inline mr-1" /> {t.previous || 'Previous'}
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                    : 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400'
                }`}
              >
                {t.next || 'Next'} <ChevronRightIcon className="w-5 h-5 inline ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isAuthenticated}
                className={`px-6 py-3 rounded-lg text-sm font-medium text-white transition-all duration-300 ${
                  isAuthenticated
                    ? theme === 'light'
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                      : 'bg-gray-700 hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400'
                    : theme === 'light'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {t.submit || 'Submit'}
              </button>
            )}
          </div>
        </form>
        <ToastContainer position="top-right" autoClose={3000} theme={theme} />
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}