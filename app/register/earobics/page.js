"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Listbox } from '@headlessui/react';
import { collection, addDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../../app/fconfig';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function RegistrationForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  const [membershipType, setMembershipType] = useState('Basic');
  const [exerciseDays, setExerciseDays] = useState([]);
  const [exerciseTime, setExerciseTime] = useState('Mornings');
  const [startMonth, setStartMonth] = useState('September');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  const membershipOptions = ['Basic', 'Premium', 'Pro'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['Early Mornings', 'Mornings', 'Early Afternoons', 'Afternoons', 'Evenings'];
  const months = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
  const reasons = ['Stress', 'Depression', 'Boredom', 'Happiness', 'Habit', 'Annoyance'];
  const goals = ['Development of muscles', 'Reducing the stress', 'Losing body fat', 'Increasing the motivation', 'Training for an event/specific sport', 'Other'];

  const steps = [
    { name: 'Personal Info', fields: ['firstName', 'lastName', 'birthDate', 'email'] },
    { name: 'Contact Info', fields: ['streetAddress', 'streetAddress2', 'city', 'state', 'zipCode', 'phoneNumber', 'emergencyName', 'emergencyPhone'] },
    { name: 'Health Info', fields: ['height', 'weight', 'goalWeight', 'bloodType', 'healthIssues', 'medications', 'smoke', 'surgery', 'alcohol', 'supplements', 'foodTracking', 'proSport', 'exercisePain', 'nightEating', 'breakfastFrequency', 'nutritionRating'] },
    { name: 'Preferences', fields: ['exerciseDays', 'exerciseTime', 'trainingGoals', 'eatingReasons', 'membershipType', 'exerciseDuration', 'startMonth'] },
    { name: 'Review & Submit', fields: ['signature'] },
  ];

  useEffect(() => {
    if (!auth || !db) {
      console.error('Firebase services not initialized:', { auth, db });
      setFormErrors({ global: 'Firebase services are not initialized. Please check configuration.' });
      setIsLoading(false);
      return;
    }

    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    const attemptSignIn = async () => {
      try {
        await signInAnonymously(auth);
        if (mounted) console.log('Signed in anonymously');
      } catch (err) {
        if (mounted) {
          console.error('Anonymous sign-in failed:', {
            code: err.code || 'N/A',
            message: err.message,
            retryCount,
          });
          let errorMessage = err.message;
          if (err.code === 'auth/configuration-not-found') {
            errorMessage = 'Firebase Authentication is not properly configured.';
          }
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptSignIn, retryDelay);
          } else {
            setFormErrors({ global: `Authentication failed: ${errorMessage}` });
            setIsLoading(false);
          }
        }
      }
    };

    const initializeAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!mounted) return;
          if (user) {
            setIsAuthenticated(true);
            setIsLoading(false);
            console.log('User is signed in:', user.uid);
          } else {
            attemptSignIn();
          }
        });
        return () => {
          mounted = false;
          unsubscribe();
        };
      } catch (err) {
        if (mounted) {
          setFormErrors({ global: `Authentication setup failed: ${err.message}` });
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (data) => {
    setFormErrors({});
    if (!isAuthenticated || !auth.currentUser) {
      toast.error('User is not authenticated. Please wait or try again.');
      setFormErrors({ global: 'User is not authenticated.' });
      return;
    }

    try {
      if (!db) throw new Error('Firestore database is not initialized.');
      const dataToStore = {
        ...data,
        membershipType,
        exerciseDays,
        exerciseTime,
        startMonth,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      const aerobicsCollectionRef = collection(db, 'aerobics');
      await addDoc(aerobicsCollectionRef, dataToStore);
      toast.success('Registration successful!');
      router.push('/success');
    } catch (err) {
      console.error('Firestore error:', {
        code: err.code || 'N/A',
        message: err.message || 'Unknown error occurred',
      });
      let errorMessage = 'An error occurred while saving your registration.';
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied: Unable to save data.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firestore service is unavailable.';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      toast.error(errorMessage);
      setFormErrors({ global: errorMessage });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const currentFields = steps[currentStep].fields;
      const hasErrors = currentFields.some((field) => errors[field]);
      if (!hasErrors) setCurrentStep(currentStep + 1);
      else toast.error('Please fix errors before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const formData = watch();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-gray-200">
        <div className="text-2xl font-semibold text-gray-700 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-gray-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        {/* Progress Bar */}
        <div className="relative">
          <div className="flex justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.name} className="flex-1 text-center">
                <div className={`flex items-center justify-center w-10 h-10 mx-auto rounded-full ${index <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
                  {index < currentStep ? <CheckCircleIcon className="w-6 h-6" /> : index + 1}
                </div>
                <p className={`mt-2 text-sm font-medium ${index <= currentStep ? 'text-indigo-600' : 'text-gray-500'}`}>{step.name}</p>
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-indigo-600" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 text-center">Aerobics Fitness Registration</h2>
        {formErrors.global && <p className="text-red-500 text-center bg-red-50 p-3 rounded-md">{formErrors.global}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                <input
                  type="date"
                  {...register('birthDate', { required: 'Birth date is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                <input
                  {...register('streetAddress', { required: 'Street address is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.streetAddress && <p className="text-red-500 text-xs mt-1">{errors.streetAddress.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address 2</label>
                <input
                  {...register('streetAddress2')}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  {...register('city', { required: 'City is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State/Province</label>
                <input
                  {...register('state', { required: 'State is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                <input
                  {...register('zipCode', { required: 'Zip code is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  {...register('phoneNumber', { required: 'Phone number is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                <input
                  {...register('emergencyName', { required: 'Emergency contact name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.emergencyName && <p className="text-red-500 text-xs mt-1">{errors.emergencyName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                <input
                  type="tel"
                  {...register('emergencyPhone', { required: 'Emergency phone is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                />
                {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone.message}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Health Information */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input
                    type="number"
                    {...register('height', { required: 'Height is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                  {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="number"
                    {...register('weight', { required: 'Weight is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                  {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
                  <input
                    type="number"
                    {...register('goalWeight')}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                  <input
                    {...register('bloodType')}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Health Issues</label>
                  <textarea
                    {...register('healthIssues')}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medications</label>
                  <textarea
                    {...register('medications')}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Health & Lifestyle</h3>
                {[
                  { label: 'Do you smoke?', name: 'smoke' },
                  { label: 'Had surgery in the last year?', name: 'surgery' },
                  { label: 'Do you drink alcohol?', name: 'alcohol' },
                  { label: 'Using vitamins/supplements?', name: 'supplements' },
                  { label: 'Tracking daily food intake?', name: 'foodTracking' },
                  { label: 'Done sport professionally?', name: 'proSport' },
                  { label: 'Feel pain during exercise?', name: 'exercisePain' },
                ].map((q) => (
                  <div key={q.name} className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">{q.label}</label>
                    <input
                      type="checkbox"
                      {...register(q.name)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Night Eating Frequency (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('nightEating', { required: 'Required', min: 0, max: 5 })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                  {errors.nightEating && <p className="text-red-500 text-xs mt-1">{errors.nightEating.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Breakfast Frequency (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('breakfastFrequency', { required: 'Required', min: 0, max: 5 })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                  {errors.breakfastFrequency && <p className="text-red-500 text-xs mt-1">{errors.breakfastFrequency.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nutrition Rating (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('nutritionRating', { required: 'Required', min: 0, max: 5 })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                  {errors.nutritionRating && <p className="text-red-500 text-xs mt-1">{errors.nutritionRating.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700">Exercise Days</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {days.map((day) => (
                    <div key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        value={day}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExerciseDays([...exerciseDays, day]);
                          } else {
                            setExerciseDays(exerciseDays.filter((d) => d !== day));
                          }
                        }}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">{day}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Exercise Time</label>
                <Listbox value={exerciseTime} onChange={setExerciseTime}>
                  <Listbox.Button className="mt-1 block w-full border border-gray-300 rounded-lg p-3 bg-white text-left focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200">
                    {exerciseTime}
                  </Listbox.Button>
                  <Listbox.Options className="mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {times.map((time) => (
                      <Listbox.Option key={time} value={time} className="p-3 hover:bg-indigo-100 cursor-pointer">
                        {time}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Listbox>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Training Goals</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {goals.map((goal) => (
                    <div key={goal} className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('trainingGoals')}
                        value={goal}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">{goal}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reasons for Eating (Besides Hunger)</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {reasons.map((reason) => (
                    <div key={reason} className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('eatingReasons')}
                        value={reason}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">{reason}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Membership Type</label>
                  <Listbox value={membershipType} onChange={setMembershipType}>
                    <Listbox.Button className="mt-1 block w-full border border-gray-300 rounded-lg p-3 bg-white text-left focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200">
                      {membershipType}
                    </Listbox.Button>
                    <Listbox.Options className="mt-1 bg-white border rounded-lg shadow-lg">
                      {membershipOptions.map((option) => (
                        <Listbox.Option key={option} value={option} className="p-3 hover:bg-indigo-100 cursor-pointer">
                          {option}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Exercise Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    {...register('exerciseDuration', { required: 'Required', min: 1, max: 12 })}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  />
                  {errors.exerciseDuration && <p className="text-red-500 text-xs mt-1">{errors.exerciseDuration.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Month</label>
                  <Listbox
                    value={startMonth}
                    onChange={(value) => {
                      setStartMonth(value);
                      setValue('startMonth', value);
                    }}
                  >
                    <Listbox.Button className="mt-1 block w-full border border-gray-300 rounded-lg p-3 bg-white text-left focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200">
                      {startMonth}
                    </Listbox.Button>
                    <Listbox.Options className="mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                      {months.map((month) => (
                        <Listbox.Option key={month} value={month} className="p-3 hover:bg-indigo-100 cursor-pointer">
                          {month}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-medium text-gray-900">Review Your Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Personal Information</h4>
                  <p>First Name: {formData.firstName || 'Not provided'}</p>
                  <p>Last Name: {formData.lastName || 'Not provided'}</p>
                  <p>Birth Date: {formData.birthDate || 'Not provided'}</p>
                  <p>Email: {formData.email || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Contact Information</h4>
                  <p>Street Address: {formData.streetAddress || 'Not provided'}</p>
                  <p>Street Address 2: {formData.streetAddress2 || 'Not provided'}</p>
                  <p>City: {formData.city || 'Not provided'}</p>
                  <p>State: {formData.state || 'Not provided'}</p>
                  <p>Zip Code: {formData.zipCode || 'Not provided'}</p>
                  <p>Phone Number: {formData.phoneNumber || 'Not provided'}</p>
                  <p>Emergency Contact: {formData.emergencyName || 'Not provided'} - {formData.emergencyPhone || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Health Information</h4>
                  <p>Height: {formData.height || 'Not provided'} cm</p>
                  <p>Weight: {formData.weight || 'Not provided'} kg</p>
                  <p>Goal Weight: {formData.goalWeight || 'Not provided'} kg</p>
                  <p>Blood Type: {formData.bloodType || 'Not provided'}</p>
                  <p>Health Issues: {formData.healthIssues || 'Not provided'}</p>
                  <p>Medications: {formData.medications || 'Not provided'}</p>
                  <p>Health & Lifestyle: {[
                    formData.smoke && 'Smokes',
                    formData.surgery && 'Recent Surgery',
                    formData.alcohol && 'Drinks Alcohol',
                    formData.supplements && 'Uses Supplements',
                    formData.foodTracking && 'Tracks Food',
                    formData.proSport && 'Professional Sport',
                    formData.exercisePain && 'Exercise Pain',
                  ].filter(Boolean).join(', ') || 'None'}</p>
                  <p>Night Eating Frequency: {formData.nightEating || 'Not provided'}</p>
                  <p>Breakfast Frequency: {formData.breakfastFrequency || 'Not provided'}</p>
                  <p>Nutrition Rating: {formData.nutritionRating || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Preferences</h4>
                  <p>Exercise Days: {exerciseDays.length > 0 ? exerciseDays.join(', ') : 'Not provided'}</p>
                  <p>Exercise Time: {exerciseTime}</p>
                  <p>Training Goals: {formData.trainingGoals?.join(', ') || 'Not provided'}</p>
                  <p>Eating Reasons: {formData.eatingReasons?.join(', ') || 'Not provided'}</p>
                  <p>Membership Type: {membershipType}</p>
                  <p>Exercise Duration: {formData.exerciseDuration || 'Not provided'} months</p>
                  <p>Start Month: {startMonth}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Signature</label>
                <input
                  {...register('signature', { required: 'Signature is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Type your full name as signature"
                />
                {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature.message}</p>}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Previous
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 ml-auto"
              >
                Next
                <ChevronRightIcon className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isAuthenticated}
                className={`flex items-center px-4 py-2 rounded-lg text-white transition duration-200 ml-auto ${
                  isAuthenticated
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Submit
              </button>
            )}
          </div>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
}