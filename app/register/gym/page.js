"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Listbox } from '@headlessui/react';
import { collection, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../../app/fconfig';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = 'promotionvideo';
const CLOUDINARY_CLOUD_NAME = 'dkifgcmpy';
const CLOUDINARY_FOLDER = 'earobics_photos';

export default function EarobicsRegistrationForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      role: 'user'
    }
  });
  const [membershipType, setMembershipType] = useState('Basic');
  const [exerciseDays, setExerciseDays] = useState([]);
  const [exerciseTime, setExerciseTime] = useState('Mornings');
  const [startMonth, setStartMonth] = useState('September');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const membershipOptions = ['Basic', 'Premium', 'Pro'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['Early Mornings', 'Mornings', 'Early Afternoons', 'Afternoons', 'Evenings'];
  const months = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
  const reasons = ['Stress', 'Depression', 'Boredom', 'Happiness', 'Habit', 'Annoyance'];
  const goals = ['Development of muscles', 'Reducing the stress', 'Losing body fat', 'Increasing the motivation', 'Training for an event/specific sport', 'Other'];

  const steps = [
    { name: 'Personal Info', fields: ['firstName', 'lastName', 'birthDate', 'email', 'password', 'role'] },
    { name: 'Contact Info', fields: ['streetAddress', 'streetAddress2', 'city', 'state', 'zipCode', 'phoneNumber', 'emergencyName', 'emergencyPhone'] },
    { name: 'Health Info', fields: ['height', 'weight', 'goalWeight', 'bloodType', 'healthIssues', 'medications', 'smoke', 'surgery', 'alcohol', 'supplements', 'foodTracking', 'proSport', 'exercisePain', 'nightEating', 'breakfastFrequency', 'nutritionRating', 'photo'] },
    { name: 'Preferences', fields: ['exerciseDays', 'exerciseTime', 'trainingGoals', 'eatingReasons', 'membershipType', 'exerciseDuration', 'startMonth'] },
    { name: 'Review & Submit', fields: ['signature'] },
  ];

  useEffect(() => {
    if (!auth || !db) {
      setFormErrors({ global: 'Firebase services are not initialized.' });
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
        });
        return () => {
          mounted = false;
          unsubscribe();
        };
      } catch (err) {
        if (mounted) {
          setFormErrors({ global: `Authentication setup failed: ${err.message || 'Unknown error'}` });
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

  // Calculate BMI when height or weight changes
  useEffect(() => {
    const height = watch('height');
    const weight = watch('weight');
    if (height && weight && height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      setBmi(calculatedBmi);
      setValue('bmi', calculatedBmi);
    } else {
      setBmi(null);
      setValue('bmi', null);
    }
  }, [watch('height'), watch('weight'), setValue]);

  const handleAuth = async (email, password, isSignUp = false) => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
      if (err.code === 'auth/user-not-found') errorMessage = 'No account found with this email.';
      if (err.code === 'auth/email-already-in-use') errorMessage = 'Email already in use.';
      if (err.code === 'auth/invalid-email') errorMessage = 'Invalid email format.';
      throw new Error(errorMessage);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Only JPEG or PNG images are allowed');
        return;
      }
      setPhoto(file);
      setValue('photo', file.name);
    }
  };

  const uploadToCloudinary = async (file) => {
    setIsUploading(true);
    try {
      let formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', CLOUDINARY_FOLDER);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const responseJson = await response.json();
      setIsUploading(false);

      if (responseJson.secure_url) {
        return responseJson.secure_url;
      } else {
        toast.error('Failed to upload image.');
        return null;
      }
    } catch (error) {
      setIsUploading(false);
      toast.error('Failed to upload image.');
      return null;
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
      let photoUrl = null;
      if (photo) {
        photoUrl = await uploadToCloudinary(photo);
        if (!photoUrl) {
          throw new Error('Image upload failed.');
        }
      }

      await addDoc(collection(db, 'earobics'), {
        ...data,
        bmi,
        photoUrl,
        exerciseDays,
        exerciseTime,
        membershipType,
        startMonth,
        role: 'user',
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });
      toast.success('Registration successful!');
      setIsSubmitted(true);
    } catch (err) {
      let errorMessage = err.message;
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
        toast.error('Please fix errors before proceeding.');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleGoToHome = () => {
    window.location.href = 'http://localhost:3000/';
  };

  const formData = watch();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
        <div className="text-2xl font-semibold text-gray-700 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
        <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-2xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Registration Complete!</h2>
          <p className="text-gray-600 mb-8">Thank you for registering with Aerobics Fitness. Your information has been successfully saved.</p>
          <button
            onClick={handleGoToHome}
            className="px-6 py-3 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-8">Aerobics Fitness Registration</h2>

        {/* Stepper */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.name} className="flex-1 text-center">
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {index < currentStep ? <CheckCircleIcon className="w-6 h-6" /> : index + 1}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">{step.name}</p>
            </div>
          ))}
        </div>

        {formErrors.global && (
          <p className="text-red-500 text-center mb-6 bg-red-50 p-3 rounded-md">{formErrors.global}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                  <input
                    type="date"
                    {...register('birthDate', { required: 'Birth date is required' })}
                    className="mt-1 block w-full pxヶ4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Select your birth date"
                  />
                  {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    {...register('password', { 
                      required: 'Password is required', 
                      minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                    })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your password"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    {...register('role')}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="User role"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    {...register('streetAddress', { required: 'Street address is required' })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your street address"
                  />
                  {errors.streetAddress && <p className="text-red-500 text-xs mt-1">{errors.streetAddress.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address 2</label>
                  <input
                    {...register('streetAddress2')}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    {...register('city', { required: 'City is required' })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your city"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State/Province</label>
                  <input
                    {...register('state', { required: 'State is required' })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your state"
                  />
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                  <input
                    {...register('zipCode', { required: 'Zip code is required' })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your zip code"
                  />
                  {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    {...register('phoneNumber', { required: 'Phone number is required', pattern: { value: /^\+?[\d\s-]{10,}$/, message: 'Invalid phone number' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your phone number"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                  <input
                    {...register('emergencyName', { required: 'Emergency contact name is required' })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter emergency contact name"
                  />
                  {errors.emergencyName && <p className="text-red-500 text-xs mt-1">{errors.emergencyName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    {...register('emergencyPhone', { required: 'Emergency phone is required', pattern: { value: /^\+?[\d\s-]{10,}$/, message: 'Invalid phone number' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter emergency contact phone"
                  />
                  {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Health Information */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800">Health Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input
                    type="number"
                    {...register('height', { required: 'Height is required', min: { value: 0, message: 'Height must be positive' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter height in cm"
                  />
                  {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="number"
                    {...register('weight', { required: 'Weight is required', min: { value: 0, message: 'Weight must be positive' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter weight in kg"
                  />
                  {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">BMI</label>
                  <input
                    type="text"
                    value={bmi || ''}
                    readOnly
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100"
                    placeholder="Calculated BMI"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
                  <input
                    type="number"
                    {...register('goalWeight', { min: { value: 0, message: 'Goal weight must be positive' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter goal weight"
                  />
                  {errors.goalWeight && <p className="text-red-500 text-xs mt-1">{errors.goalWeight.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  />
                  {photo && <p className="text-sm text-gray-600 mt-1">Selected: {photo.name}</p>}
                  {isUploading && <p className="text-blue-500 text-xs mt-1">Uploading image...</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                  <input
                    {...register('bloodType')}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your blood type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Health Issues</label>
                  <textarea
                    {...register('healthIssues')}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    rows="4"
                    placeholder="Describe any health issues"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medications</label>
                  <textarea
                    {...register('medications')}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    rows="4"
                    placeholder="List any medications"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Health & Lifestyle</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Night Eating Frequency (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('nightEating', { required: 'Required', min: { value: 0, message: 'Must be at least 0' }, max: { value: 5, message: 'Must be at most 5' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter 0-5"
                  />
                  {errors.nightEating && <p className="text-red-500 text-xs mt-1">{errors.nightEating.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Breakfast Frequency (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('breakfastFrequency', { required: 'Required', min: { value: 0, message: 'Must be at least 0' }, max: { value: 5, message: 'Must be at most 5' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter 0-5"
                  />
                  {errors.breakfastFrequency && <p className="text-red-500 text-xs mt-1">{errors.breakfastFrequency.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nutrition Rating (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    {...register('nutritionRating', { required: 'Required', min: { value: 0, message: 'Must be at least 0' }, max: { value: 5, message: 'Must be at most 5' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter 0-5"
                  />
                  {errors.nutritionRating && <p className="text-red-500 text-xs mt-1">{errors.nutritionRating.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800">Preferences</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Exercise Days</label>
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
                        className="form-checkbox h-5 w-5 text-indigo-600"
                      />
                      <span className="ml-2 text-gray-700">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Exercise Time</label>
                <Listbox value={exerciseTime} onChange={(value) => { setExerciseTime(value); setValue('exerciseTime', value); }}>
                  <Listbox.Button className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-left">
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
                        className="form-checkbox h-5 w-5 text-indigo-600"
                      />
                      <span className="ml-2 text-gray-700">{goal}</span>
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
                        className="form-checkbox h-5 w-5 text-indigo-600"
                      />
                      <span className="ml-2 text-gray-700">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Membership Type</label>
                  <Listbox value={membershipType} onChange={(value) => { setMembershipType(value); setValue('membershipType', value); }}>
                    <Listbox.Button className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-left">
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
                    {...register('exerciseDuration', { required: 'Required', min: { value: 1, message: 'Must be at least 1' }, max: { value: 12, message: 'Must be at most 12' } })}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter 1-12"
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
                    <Listbox.Button className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-left">
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
              <h3 className="text-xl font-semibold text-gray-800">Review Your Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Personal Information</h4>
                  <p>First Name: {formData.firstName || 'Not provided'}</p>
                  <p>Last Name: {formData.lastName || 'Not provided'}</p>
                  <p>Birth Date: {formData.birthDate || 'Not provided'}</p>
                  <p>Email: {formData.email || 'Not provided'}</p>
                  <p>Role: {formData.role || 'user'}</p>
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
                  <p>BMI: {bmi || 'Not calculated'}</p>
                  <p>Goal Weight: {formData.goalWeight || 'Not provided'} kg</p>
                  <p>Profile Photo: {photo ? photo.name : 'Not uploaded'}</p>
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
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  placeholder="Type your full name as signature"
                />
                {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature.message}</p>}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all蓷all duration-300 ${
                currentStep === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500'
              }`}
            >
              Previous
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isAuthenticated || isUploading}
                className={`px-6 py-3 rounded-lg text-sm font-medium text-white transition-all duration-300 ${
                  isAuthenticated && !isUploading
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Submit
              </button>
            )}
          </div>
        </form>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>

      {/* Custom CSS for animations */}
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