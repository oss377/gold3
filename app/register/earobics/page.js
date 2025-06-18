"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Listbox } from '@headlessui/react';
import { collection, addDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../../app/fconfig'; // Adjust path to your fconfig file
import { useRouter } from 'next/navigation';

export default function RegistrationForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [membershipType, setMembershipType] = useState('Basic');
  const [exerciseDays, setExerciseDays] = useState([]);
  const [exerciseTime, setExerciseTime] = useState('Mornings');
  const [startMonth, setStartMonth] = useState('September');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  const membershipOptions = ['Basic', 'Premium', 'Pro'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['Early Mornings', 'Mornings', 'Early Afternoons', 'Afternoons', 'Evenings'];
  const months = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
  const reasons = ['Stress', 'Depression', 'Boredom', 'Happiness', 'Habit', 'Annoyance'];
  const goals = ['Development of muscles', 'Reducing the stress', 'Losing body fat', 'Increasing the motivation', 'Training for an event/specific sport', 'Other'];

  // Handle Firebase Authentication
  useEffect(() => {
    if (!auth || !db) {
      console.error('Firebase services not initialized:', { auth, db });
      setFormErrors({ global: 'Firebase services are not initialized. Please check configuration.' });
      setIsLoading(false);
      return;
    }

    console.log('Firebase auth initialized, starting authentication process');

    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const attemptSignIn = async () => {
      try {
        console.log(`Attempting anonymous sign-in (retry ${retryCount})`);
        await signInAnonymously(auth);
        if (mounted) {
          console.log('Signed in anonymously');
        }
      } catch (err) {
        if (mounted) {
          console.error('Anonymous sign-in failed:', {
            code: err.code || 'N/A',
            message: err.message,
            retryCount,
          });
          let errorMessage = err.message;
          if (err.code === 'auth/configuration-not-found') {
            errorMessage = 'Firebase Authentication is not properly configured. Please ensure anonymous sign-in is enabled in the Firebase Console.';
          }
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying sign-in after ${retryDelay}ms`);
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
            console.log('No user signed in, attempting anonymous sign-in');
            attemptSignIn();
          }
        });

        return () => {
          mounted = false;
          unsubscribe();
        };
      } catch (err) {
        if (mounted) {
          console.error('Authentication setup error:', {
            code: err.code || 'N/A',
            message: err.message,
            stack: err.stack,
          });
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
      setFormErrors({ global: 'User is not authenticated. Please wait or try again.' });
      return;
    }

    try {
      // Verify Firestore is initialized
      if (!db) {
        throw new Error('Firestore database is not initialized.');
      }

      const dataToStore = {
        ...data,
        membershipType,
        exerciseDays,
        exerciseTime,
        startMonth,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      // Attempt to write to Firestore
      const aerobicsCollectionRef = collection(db, 'aerobics');
      await addDoc(aerobicsCollectionRef, dataToStore);

      toast.success('Registration successful!');
      router.push('/success');
    } catch (err) {
      console.error('Firestore error:', {
        code: err.code || 'N/A',
        message: err.message || 'Unknown error occurred',
        stack: err.stack || 'No stack trace available',
        details: err.details || 'No additional details',
      });
      let errorMessage = 'An error occurred while saving your registration.';
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied: Unable to save data. Please ensure anonymous users have write access to the aerobics collection.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firestore service is unavailable. Please check your network connection and try again.';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      toast.error(errorMessage);
      setFormErrors({ global: errorMessage });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">Aerobics Fitness Registration</h2>
        {formErrors.global && <p className="text-red-500 text-center">{formErrors.global}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Birth Date</label>
              <input
                type="date"
                {...register('birthDate', { required: 'Birth date is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.birthDate && <p className="text-red-500 text-xs">{errors.birthDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                {...register('streetAddress', { required: 'Street address is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.streetAddress && <p className="text-red-500 text-xs">{errors.streetAddress.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address 2</label>
              <input
                {...register('streetAddress2')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                {...register('city', { required: 'City is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State/Province</label>
              <input
                {...register('state', { required: 'State is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zip Code</label>
              <input
                {...register('zipCode', { required: 'Zip code is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.zipCode && <p className="text-red-500 text-xs">{errors.zipCode.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                {...register('phoneNumber', { required: 'Phone number is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber.message}</p>}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
              <input
                {...register('emergencyName', { required: 'Emergency contact name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.emergencyName && <p className="text-red-500 text-xs">{errors.emergencyName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
              <input
                type="tel"
                {...register('emergencyPhone', { required: 'Emergency phone is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.emergencyPhone && <p className="text-red-500 text-xs">{errors.emergencyPhone.message}</p>}
            </div>
          </div>

          {/* BMI and Health */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
              <input
                type="number"
                {...register('height', { required: 'Height is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.height && <p className="text-red-500 text-xs">{errors.height.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                {...register('weight', { required: 'Weight is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.weight && <p className="text-red-500 text-xs">{errors.weight.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
              <input
                type="number"
                {...register('goalWeight')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Type</label>
              <input
                {...register('bloodType')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Health Issues</label>
              <textarea
                {...register('healthIssues')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medications</label>
              <textarea
                {...register('medications')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Health & Lifestyle */}
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
                <input type="checkbox" {...register(q.name)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              </div>
            ))}
          </div>

          {/* Frequency Questions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Night Eating Frequency (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                {...register('nightEating', { required: 'Required', min: 0, max: 5 })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.nightEating && <p className="text-red-500 text-xs">{errors.nightEating.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Breakfast Frequency (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                {...register('breakfastFrequency', { required: 'Required', min: 0, max: 5 })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.breakfastFrequency && <p className="text-red-500 text-xs">{errors.breakfastFrequency.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nutrition Rating (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                {...register('nutritionRating', { required: 'Required', min: 0, max: 5 })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.nutritionRating && <p className="text-red-500 text-xs">{errors.nutritionRating.message}</p>}
            </div>
          </div>

          {/* Exercise Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Exercise Days</label>
            <div className="flex flex-wrap gap-4">
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
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{day}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Exercise Time</label>
            <Listbox value={exerciseTime} onChange={setExerciseTime}>
              <Listbox.Button className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-left">
                {exerciseTime}
              </Listbox.Button>
              <Listbox.Options className="mt-1 bg-white border rounded-md shadow-lg">
                {times.map((time) => (
                  <Listbox.Option key={time} value={time} className="p-2 hover:bg-indigo-100 cursor-pointer">
                    {time}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Listbox>
          </div>

          {/* Training Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Training Goals</label>
            <div className="flex flex-wrap gap-4">
              {goals.map((goal) => (
                <div key={goal} className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('trainingGoals')}
                    value={goal}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{goal}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Eating Reasons */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Reasons for Eating (Besides Hunger)</label>
            <div className="flex flex-wrap gap-4">
              {reasons.map((reason) => (
                <div key={reason} className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('eatingReasons')}
                    value={reason}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{reason}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Membership and Duration */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Membership Type</label>
              <Listbox value={membershipType} onChange={setMembershipType}>
                <Listbox.Button className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-left">
                  {membershipType}
                </Listbox.Button>
                <Listbox.Options className="mt-1 bg-white border rounded-md shadow-lg">
                  {membershipOptions.map((option) => (
                    <Listbox.Option key={option} value={option} className="p-2 hover:bg-indigo-100 cursor-pointer">
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.exerciseDuration && <p className="text-red-500 text-xs">{errors.exerciseDuration.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Month</label>
              <Listbox
                value={startMonth}
                onChange={(value) => {
                  setStartMonth(value);
                  setValue('startMonth', value); // Sync with react-hook-form
                }}
              >
                <Listbox.Button className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-left">
                  {startMonth}
                </Listbox.Button>
                <Listbox.Options className="mt-1 bg-white border rounded-md shadow-lg">
                  {months.map((month) => (
                    <Listbox.Option key={month} value={month} className="p-2 hover:bg-indigo-100 cursor-pointer">
                      {month}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>
          </div>

          {/* Signature and Submit */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Signature</label>
            <input
              {...register('signature', { required: 'Signature is required' })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Type your full name as signature"
            />
            {errors.signature && <p className="text-red-500 text-xs">{errors.signature.message}</p>}
          </div>

          <button
            type="submit"
            disabled={!isAuthenticated}
            className={`w-full py-2 px-4 rounded-md text-white ${
              isAuthenticated
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
}