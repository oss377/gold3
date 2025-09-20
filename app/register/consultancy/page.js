"use client";

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../fconfig';
import { LanguageContext } from '../../../context/LanguageContext';
import { ThemeContext } from '../../../context/ThemeContext';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'photoupload';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnqsoezfo';
const CLOUDINARY_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'photoss';


const GYMForm = () => {
  const { t } = useContext(LanguageContext);
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      password: '',
      photo: null,
      address: '',
      city: '',
      country: '',
      jobType: '',
      emergencyName: '',
      emergencyPhone: '',
      gender: '',
      height: '',
      weight: '',
      age: '',
      bmi: '',
      bloodType: '',
      goalWeight: '',
      relationship: '',
      healthIssues: '',
      medications: '',
      workSchedule: '',
      travelFrequency: '',
      physicalActivities: '',
      medicalConditions: '',
      medicalConditionsDetails: '',
      dietType: '',
      trainingGoal: '',
      goalReason: '',
      goalTimeline: '',
      previousTraining: '',
      trainingType: '',
      preferredTrainingTime: '',
      trainerExpectations: '',
      agreeTerms: false,
      preferredStartDate: '',
      signature: '',
      role: "user",
      category: "personalTraining",
      payment: "not payed",
    },
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const router = useRouter();

  const steps = [
    {
      name: t.personalInfo || 'Personal Info',
      fields: ['firstName', 'lastName', 'phoneNumber', 'email', 'password', 'address', 'city', 'country', 'jobType', 'emergencyName', 'emergencyPhone', 'gender'],
    },
    {
      name: t.healthInfo || 'Health Info',
      fields: ['height', 'weight', 'age', 'bmi', 'bloodType', 'goalWeight', 'medicalConditions', 'medicalConditionsDetails', 'healthIssues', 'medications'],
    },
    {
      name: t.lifestyle || 'Lifestyle',
      fields: ['workSchedule', 'travelFrequency', 'physicalActivities', 'dietType', 'relationship'],
    },
    {
      name: t.trainingGoals || 'Training Goals',
      fields: ['trainingGoal', 'goalReason', 'goalTimeline', 'previousTraining', 'trainingType', 'preferredTrainingTime', 'trainerExpectations'],
    },
    {
      name: t.review || 'Review',
      fields: ['photo', 'preferredStartDate', 'signature', 'agreeTerms'],
    },
  ];

  // Watch height and weight for BMI calculation
  const height = watch('height');
  const weight = watch('weight');

  useEffect(() => {
    const calculateBMI = () => {
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);
      if (heightNum > 0 && weightNum > 0 && heightNum <= 300 && weightNum <= 500) {
        const heightInMeters = heightNum / 100;
        const bmi = (weightNum / (heightInMeters * heightInMeters)).toFixed(2);
        setValue('bmi', bmi, { shouldValidate: true });
      } else {
        setValue('bmi', '', { shouldValidate: true });
      }
    };
    calculateBMI();
  }, [height, weight, setValue]);

  // Validate Firebase services and authentication
  useEffect(() => {
    if (!auth || !db) {
      setFormErrors({ global: t.serviceError || 'Firebase services are not initialized.' });
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setCurrentUser(user);
      if (user) {
        setValue('email', user.email || '');
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Auth state error:', error);
      if (error.code === 'auth/invalid-api-key') {
        setFormErrors({ global: t.serviceError || 'Invalid Firebase API key. Please contact support.' });
      } else {
        setFormErrors({ global: t.authError || 'Authentication error occurred.' });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [t, setValue]);

  const uploadToCloudinary = async (file) => {
    if (!file) return null;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(t.fileSizeError || 'File size exceeds 5MB limit.');
      return null;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(t.fileTypeError || 'Please upload a valid image file.');
      return null;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
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
        toast.error(t.storageError || 'Failed to upload image.');
        return null;
      }
    } catch (error) {
      setIsUploading(false);
      toast.error(t.storageError || `Failed to upload image: ${error.message}`);
      return null;
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('photo', e.target.files);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const submitRegistration = useCallback(
    async (data) => {
      setFormErrors({});
      if (!db) {
        setFormErrors({ global: t.serviceError || 'Firestore database is not initialized.' });
        toast.error(t.serviceError || 'Firestore database is not initialized.', {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }

      try {
        let userId = currentUser?.uid;
        let photoURL = '';

        if (data.photo && data.photo[0]) {
          photoURL = await uploadToCloudinary(data.photo[0]);
          if (!photoURL) {
            throw new Error(t.storageError || 'Image upload failed.');
          }
        }

        if (!isAuthenticated) {
          if (!auth) {
            throw new Error(t.serviceError || 'Firebase authentication is not initialized.');
          }
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          userId = userCredential.user.uid;
        }

        const docRef = await addDoc(collection(db, 'GYM'), {
          ...data,
          photo: null,
          photoURL,
          userId: userId || 'unknown',
          timestamp: new Date().toISOString(),
          payment: "not payed",
          registrationDate: new Date().toISOString(),
        });

        sessionStorage.setItem("pendingDocId", docRef.id);
        sessionStorage.setItem("pendingUserId", userId || 'unknown');

        toast.success(t.registrationComplete || 'Registration successful! Redirecting to payment...', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        setIsSubmitted(true);
        setTimeout(() => {
          router.push("/payment");
        }, 3000);
      } catch (error) {
        console.error('Submission error:', error);
        let errorMessage = error.message || t.saveError || 'An error occurred while registering.';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = t.emailInUse || 'This email is already registered. Please use a different email or log in.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = t.weakPassword || 'Password is too weak. Please use a stronger password (at least 6 characters).';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = t.emailInvalid || 'Invalid email address.';
        } else if (error.code === 'permission-denied') {
          errorMessage = t.permissionError || 'Permission denied: Unable to save data.';
        } else if (error.code === 'unavailable') {
          errorMessage = t.serviceError || 'Firestore service is unavailable.';
        } else if (error.code === 'auth/invalid-api-key') {
          errorMessage = t.serviceError || 'Invalid Firebase API key. Please contact support.';
        }
        toast.error(errorMessage, {
          position: "top-center",
          autoClose: 5000,
        });
        setFormErrors({ global: errorMessage });
      }
    },
    [isAuthenticated, currentUser, t, router]
  );

  const updatePaymentStatus = useCallback(
    async (docId, paymentStatus) => {
      try {
        const userDocRef = doc(db, "GYM", docId);
        await updateDoc(userDocRef, {
          payment: paymentStatus,
          paymentDate: paymentStatus === "payed" ? new Date().toISOString() : null,
        });
        toast.success(`Payment ${paymentStatus === "payed" ? "successful" : "not completed"}! Redirecting to home...`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        sessionStorage.removeItem("pendingDocId");
        sessionStorage.removeItem("pendingUserId");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } catch (error) {
        console.error("Payment update error:", error);
        setFormErrors({ global: t.paymentUpdateError || 'Failed to update payment status. Please contact support.' });
        toast.error(t.paymentUpdateError || 'Failed to update payment status. Please try again.', {
          position: "top-center",
          autoClose: 5000,
        });
      }
    },
    [t, router]
  );

  const handlePaymentSuccess = useCallback(async () => {
    const docId = sessionStorage.getItem("pendingDocId");
    const userId = sessionStorage.getItem("pendingUserId");
    if (docId && userId) {
      await updatePaymentStatus(docId, "payed");
    } else {
      setFormErrors({ global: t.paymentDataError || 'Payment data not found. Please try registering again.' });
      toast.error(t.paymentDataError || 'Payment data not found. Please try registering again.', {
        position: "top-center",
        autoClose: 5000,
      });
    }
  }, [updatePaymentStatus, t]);

  const handlePaymentFailure = useCallback(async () => {
    const docId = sessionStorage.getItem("pendingDocId");
    const userId = sessionStorage.getItem("pendingUserId");
    if (docId && userId) {
      await updatePaymentStatus(docId, "not payed");
    } else {
      setFormErrors({ global: t.paymentDataError || 'Payment data not found. Please try registering again.' });
      toast.error(t.paymentDataError || 'Payment data not found. Please try registering again.', {
        position: "top-center",
        autoClose: 5000,
      });
    }
  }, [updatePaymentStatus, t]);

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      const currentFields = steps[currentStep].fields;
      const hasErrors = currentFields.some((field) => errors[field]);
      if (!hasErrors) {
        setCurrentStep(currentStep + 1);
      } else {
        toast.error(t.validationError || 'Please fix errors before proceeding.', {
          position: "top-center",
          autoClose: 3000,
        });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const formData = watch();

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <div className={`text-2xl font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} animate-pulse`}>{t.loading || 'Loading...'}</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <div className={`max-w-4xl w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-8 rounded-xl shadow-2xl text-center border`}>
          <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>{t.registrationComplete || 'Registration Complete!'}</h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8`}>{t.registrationMessage || 'Thank you for registering with the Gym. Your information has been successfully saved. You will be redirected to the payment page.'}</p>
          <button
            onClick={() => router.push('/payment')}
            className={`px-6 py-3 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'} transition-all duration-300`}
          >
            {t.proceedToPayment || 'Proceed to Payment'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <div className={`max-w-4xl w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-8 rounded-xl shadow-2xl border`}>
          <h2 className={`text-3xl font-extrabold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-8`}>{t.title || 'Personal Training Registration'}</h2>

          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.name} className="flex-1 text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${index <= currentStep ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>
                  {index < currentStep ? <CheckCircleIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-blue-600'}`} /> : index + 1}
                </div>
                <p className={`mt-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{step.name}</p>
              </div>
            ))}
          </div>

          {formErrors.global && (
            <p className={`text-center mb-6 ${theme === 'dark' ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-500'} p-3 rounded-md`}>{formErrors.global}</p>
          )}

          <form onSubmit={handleSubmit(submitRegistration)} className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.personalInfo || 'Personal Information'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.firstName || 'First Name'}</label>
                    <input
                      {...register('firstName', { required: t.firstNameError || 'First name is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.firstNamePlaceholder || 'Enter your first name'}
                      aria-label="First Name"
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    />
                    {errors.firstName && <p id="firstName-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.lastName || 'Last Name'}</label>
                    <input
                      {...register('lastName', { required: t.lastNameError || 'Last name is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.lastNamePlaceholder || 'Enter your last name'}
                      aria-label="Last Name"
                      aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    />
                    {errors.lastName && <p id="lastName-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.lastName.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.phoneNumber || 'Phone Number'}</label>
                    <input
                      type="tel"
                      {...register('phoneNumber', { required: t.phoneNumberError || 'Phone number is required', pattern: { value: /^\+?[\d\s-]{10,}$/, message: t.phoneNumberInvalid || 'Invalid phone number' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.phoneNumberPlaceholder || 'Enter your phone number'}
                      aria-label="Phone Number"
                      aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
                    />
                    {errors.phoneNumber && <p id="phoneNumber-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.phoneNumber.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.email || 'Email'}</label>
                    <input
                      type="email"
                      {...register('email', { required: t.emailError || 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: t.emailInvalid || 'Invalid email' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.emailPlaceholder || 'Enter your email'}
                      aria-label="Email"
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && <p id="email-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.password || 'Password'}</label>
                    <input
                      type="password"
                      {...register('password', { 
                        required: !isAuthenticated ? (t.passwordError || 'Password is required') : false,
                        minLength: !isAuthenticated ? { value: 6, message: t.passwordMinLength || 'Password must be at least 6 characters' } : undefined
                      })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.passwordPlaceholder || 'Enter your password'}
                      aria-label="Password"
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    {errors.password && <p id="password-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.password.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.address || 'Address'}</label>
                    <input
                      {...register('address', { required: t.addressError || 'Address is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.addressPlaceholder || 'Enter your address'}
                      aria-label="Address"
                      aria-describedby={errors.address ? 'address-error' : undefined}
                    />
                    {errors.address && <p id="address-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.address.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.city || 'City'}</label>
                    <input
                      {...register('city', { required: t.cityError || 'City is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.cityPlaceholder || 'Enter your city'}
                      aria-label="City"
                      aria-describedby={errors.city ? 'city-error' : undefined}
                    />
                    {errors.city && <p id="city-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.country || 'Country'}</label>
                    <input
                      {...register('country', { required: t.countryError || 'Country is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.countryPlaceholder || 'Enter your country'}
                      aria-label="Country"
                      aria-describedby={errors.country ? 'country-error' : undefined}
                    />
                    {errors.country && <p id="country-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.country.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.jobType || 'Job Type'}</label>
                    <input
                      {...register('jobType')}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.jobTypePlaceholder || 'Enter your job type'}
                      aria-label="Job Type"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.emergencyName || 'Emergency Contact Name'}</label>
                    <input
                      {...register('emergencyName', { required: t.emergencyNameError || 'Emergency contact name is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.emergencyNamePlaceholder || 'Enter emergency contact name'}
                      aria-label="Emergency Contact Name"
                      aria-describedby={errors.emergencyName ? 'emergencyName-error' : undefined}
                    />
                    {errors.emergencyName && <p id="emergencyName-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.emergencyName.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.emergencyPhone || 'Emergency Phone Number'}</label>
                    <input
                      type="tel"
                      {...register('emergencyPhone', { required: t.emergencyPhoneError || 'Emergency phone is required', pattern: { value: /^\+?[\d\s-]{10,}$/, message: t.emergencyPhoneInvalid || 'Invalid phone number' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.emergencyPhonePlaceholder || 'Enter emergency phone'}
                      aria-label="Emergency Phone Number"
                      aria-describedby={errors.emergencyPhone ? 'emergencyPhone-error' : undefined}
                    />
                    {errors.emergencyPhone && <p id="emergencyPhone-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.emergencyPhone.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.gender || 'Gender'}</label>
                    <div className="mt-2 flex space-x-4">
                      {['Male', 'Female', 'Other'].map((gender) => (
                        <div key={gender} className="flex items-center">
                          <input
                            type="radio"
                            {...register('gender', { required: t.genderError || 'Gender is required' })}
                            value={gender}
                            className={`h-4 w-4 ${theme === 'dark' ? 'text-yellow-400 focus:ring-yellow-400' : 'text-blue-600 focus:ring-blue-500'} border-gray-300`}
                            aria-label={gender}
                          />
                          <label className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t[gender.toLowerCase()] || gender}</label>
                        </div>
                      ))}
                    </div>
                    {errors.gender && <p id="gender-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.gender.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.healthInfo || 'Health Information'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.height || 'Height (cm)'}</label>
                    <input
                      type="number"
                      {...register('height', { 
                        required: t.heightError || 'Height is required', 
                        min: { value: 50, message: t.heightMin || 'Height must be at least 50 cm' },
                        max: { value: 300, message: t.heightMax || 'Height must be less than 300 cm' }
                      })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.heightPlaceholder || 'Enter height in cm'}
                      aria-label="Height"
                      aria-describedby={errors.height ? 'height-error' : undefined}
                    />
                    {errors.height && <p id="height-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.height.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.weight || 'Weight (kg)'}</label>
                    <input
                      type="number"
                      {...register('weight', { 
                        required: t.weightError || 'Weight is required', 
                        min: { value: 20, message: t.weightMin || 'Weight must be at least 20 kg' },
                        max: { value: 500, message: t.weightMax || 'Weight must be less than 500 kg' }
                      })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.weightPlaceholder || 'Enter weight in kg'}
                      aria-label="Weight"
                      aria-describedby={errors.weight ? 'weight-error' : undefined}
                    />
                    {errors.weight && <p id="weight-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.weight.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.bmi || 'BMI'}</label>
                    <input
                      type="text"
                      value={formData.bmi || ''}
                      readOnly
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.bmiPlaceholder || 'Calculated BMI'}
                      aria-label="BMI"
                      aria-describedby={formData.bmi ? 'bmi-info' : undefined}
                    />
                    {formData.bmi && (
                      <p id="bmi-info" className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formData.bmi < 18.5 ? t.bmiUnderweight || 'Underweight' :
                         formData.bmi < 25 ? t.bmiNormal || 'Normal' :
                         formData.bmi < 30 ? t.bmiOverweight || 'Overweight' : t.bmiObese || 'Obese'}
                      </p>
                    )}
                    {!formData.bmi && height && weight && (
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                        {t.bmiInvalid || 'Invalid height or weight for BMI calculation'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.age || 'Age'}</label>
                    <input
                      type="number"
                      {...register('age', { required: t.ageError || 'Age is required', min: { value: 0, message: t.agePositive || 'Age must be positive' }, max: { value: 120, message: t.ageReasonable || 'Age must be reasonable' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.agePlaceholder || 'Enter your age'}
                      aria-label="Age"
                      aria-describedby={errors.age ? 'age-error' : undefined}
                    />
                    {errors.age && <p id="age-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.age.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.bloodType || 'Blood Type'}</label>
                    <select
                      {...register('bloodType')}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Blood Type"
                      aria-describedby={errors.bloodType ? 'bloodType-error' : undefined}
                    >
                      <option value="">{t.bloodTypePlaceholder || 'Select Blood Type'}</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {errors.bloodType && <p id="bloodType-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.bloodType.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.goalWeight || 'Goal Weight (kg)'}</label>
                    <input
                      type="number"
                      {...register('goalWeight', { min: { value: 20, message: t.goalWeightPositive || 'Goal weight must be at least 20 kg' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.goalWeightPlaceholder || 'Enter goal weight'}
                      aria-label="Goal Weight"
                      aria-describedby={errors.goalWeight ? 'goalWeight-error' : undefined}
                    />
                    {errors.goalWeight && <p id="goalWeight-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.goalWeight.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.medicalConditions || 'Medical Conditions'}</label>
                    <select
                      {...register('medicalConditions', { required: t.medicalConditionsError || 'Please specify if you have medical conditions' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Medical Conditions"
                      aria-describedby={errors.medicalConditions ? 'medicalConditions-error' : undefined}
                    >
                      <option value="">{t.select || 'Select...'}</option>
                      <option value="Yes">{t.yes || 'Yes'}</option>
                      <option value="No">{t.no || 'No'}</option>
                    </select>
                    {errors.medicalConditions && <p id="medicalConditions-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.medicalConditions.message}</p>}
                  </div>
                  {formData.medicalConditions === 'Yes' && (
                    <div className="sm:col-span-2">
                      <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.medicalConditionsDetails || 'Medical Conditions Details'}</label>
                      <textarea
                        {...register('medicalConditionsDetails', { required: t.medicalConditionsDetailsError || 'Medical condition details are required' })}
                        className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                        rows="4"
                        placeholder={t.medicalConditionsDetailsPlaceholder || 'Describe any medical conditions'}
                        aria-label="Medical Conditions Details"
                        aria-describedby={errors.medicalConditionsDetails ? 'medicalConditionsDetails-error' : undefined}
                      />
                      {errors.medicalConditionsDetails && <p id="medicalConditionsDetails-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.medicalConditionsDetails.message}</p>}
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.healthIssues || 'Health Issues'}</label>
                    <textarea
                      {...register('healthIssues')}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      rows="4"
                      placeholder={t.healthIssuesPlaceholder || 'Describe any health issues'}
                      aria-label="Health Issues"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.medications || 'Medications'}</label>
                    <textarea
                      {...register('medications')}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      rows="4"
                      placeholder={t.medicationsPlaceholder || 'List any medications'}
                      aria-label="Medications"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.lifestyle || 'Lifestyle Information'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.workSchedule || 'Work Schedule'}</label>
                    <select
                      {...register('workSchedule', { required: t.workScheduleError || 'Work schedule is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Work Schedule"
                      aria-describedby={errors.workSchedule ? 'workSchedule-error' : undefined}
                    >
                      <option value="">{t.workSchedulePlaceholder || 'Select...'}</option>
                      <option value="Full-time">{t.fullTime || 'Full-time'}</option>
                      <option value="Part-time">{t.partTime || 'Part-time'}</option>
                      <option value="Flexible">{t.flexible || 'Flexible'}</option>
                    </select>
                    {errors.workSchedule && <p id="workSchedule-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.workSchedule.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.travelFrequency || 'Travel Frequency'}</label>
                    <select
                      {...register('travelFrequency', { required: t.travelFrequencyError || 'Travel frequency is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Travel Frequency"
                      aria-describedby={errors.travelFrequency ? 'travelFrequency-error' : undefined}
                    >
                      <option value="">{t.select || 'Select...'}</option>
                      <option value="Never">{t.never || 'Never'}</option>
                      <option value="Occasionally">{t.occasionally || 'Occasionally'}</option>
                      <option value="Frequently">{t.frequently || 'Frequently'}</option>
                    </select>
                    {errors.travelFrequency && <p id="travelFrequency-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.travelFrequency.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.physicalActivities || 'Physical Activities'}</label>
                    <textarea
                      {...register('physicalActivities')}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      rows="4"
                      placeholder={t.physicalActivitiesPlaceholder || 'Describe your physical activities'}
                      aria-label="Physical Activities"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.dietType || 'Diet Type'}</label>
                    <select
                      {...register('dietType')}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Diet Type"
                    >
                      <option value="">{t.dietTypePlaceholder || 'Select...'}</option>
                      <option value="Omnivore">{t.omnivore || 'Omnivore'}</option>
                      <option value="Vegetarian">{t.vegetarian || 'Vegetarian'}</option>
                      <option value="Vegan">{t.vegan || 'Vegan'}</option>
                      <option value="Other">{t.other || 'Other'}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.relationship || 'Relationship'}</label>
                    <input
                      {...register('relationship')}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.relationshipPlaceholder || 'Enter relationship status'}
                      aria-label="Relationship"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.trainingGoals || 'Training Goals'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.trainingGoal || 'Training Goal'}</label>
                    <textarea
                      {...register('trainingGoal', { required: t.trainingGoalError || 'Training goal is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      rows="4"
                      placeholder={t.trainingGoalPlaceholder || 'Describe your training goal'}
                      aria-label="Training Goal"
                      aria-describedby={errors.trainingGoal ? 'trainingGoal-error' : undefined}
                    />
                    {errors.trainingGoal && <p id="trainingGoal-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.trainingGoal.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.goalReason || 'Reason for Goal'}</label>
                    <textarea
                      {...register('goalReason', { required: t.goalReasonError || 'Reason for goal is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      rows="4"
                      placeholder={t.goalReasonPlaceholder || 'Why do you want to achieve this goal?'}
                      aria-label="Goal Reason"
                      aria-describedby={errors.goalReason ? 'goalReason-error' : undefined}
                    />
                    {errors.goalReason && <p id="goalReason-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.goalReason.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.goalTimeline || 'Goal Timeline'}</label>
                    <input
                      {...register('goalTimeline', { required: t.goalTimelineError || 'Goal timeline is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.goalTimeline || 'Enter goal timeline'}
                      aria-label="Goal Timeline"
                      aria-describedby={errors.goalTimeline ? 'goalTimeline-error' : undefined}
                    />
                    {errors.goalTimeline && <p id="goalTimeline-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.goalTimeline.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.previousTraining || 'Previous Training'}</label>
                    <select
                      {...register('previousTraining', { required: t.previousTrainingError || 'Please specify if you have previous training' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Previous Training"
                      aria-describedby={errors.previousTraining ? 'previousTraining-error' : undefined}
                    >
                      <option value="">{t.select || 'Select...'}</option>
                      <option value="Yes">{t.yes || 'Yes'}</option>
                      <option value="No">{t.no || 'No'}</option>
                    </select>
                    {errors.previousTraining && <p id="previousTraining-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.previousTraining.message}</p>}
                  </div>
                  {formData.previousTraining === 'Yes' && (
                    <div className="sm:col-span-2">
                      <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.trainingType || 'Training Type'}</label>
                      <textarea
                        {...register('trainingType', { required: t.trainingTypeError || 'Training type is required' })}
                        className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                        rows="4"
                        placeholder={t.trainingTypePlaceholder || 'Describe previous training type'}
                        aria-label="Training Type"
                        aria-describedby={errors.trainingType ? 'trainingType-error' : undefined}
                      />
                      {errors.trainingType && <p id="trainingType-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.trainingType.message}</p>}
                    </div>
                  )}
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.preferredTrainingTime || 'Preferred Training Time'}</label>
                    <input
                      {...register('preferredTrainingTime')}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.preferredTrainingTime || 'Enter preferred training time'}
                      aria-label="Preferred Training Time"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.trainerExpectations || 'Trainer Expectations'}</label>
                    <textarea
                      {...register('trainerExpectations', { required: t.trainerExpectationsError || 'Trainer expectations are required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      rows="4"
                      placeholder={t.trainerExpectationsPlaceholder || 'Describe your expectations from the trainer'}
                      aria-label="Trainer Expectations"
                      aria-describedby={errors.trainerExpectations ? 'trainerExpectations-error' : undefined}
                    />
                    {errors.trainerExpectations && <p id="trainerExpectations-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.trainerExpectations.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.review || 'Review Your Information'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.photo || 'Photo'}</label>
                    <input
                      type="file"
                      accept="image/*"
                      {...register('photo')}
                      onChange={handlePhotoChange}
                      className={`mt-1 block w-full text-sm ${theme === 'dark' ? 'text-gray-300 file:bg-gray-600 file:text-yellow-400 hover:file:bg-gray-500' : 'text-gray-500 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold transition-all duration-300`}
                      aria-label="Photo Upload"
                    />
                    {photoPreview && (
                      <img src={photoPreview} alt="Photo preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                    )}
                    {isUploading && <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-yellow-400' : 'text-blue-500'}`}>{t.uploading || 'Uploading image...'}</p>}
                    {errors.photo && <p id="photo-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.photo.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.preferredStartDate || 'Preferred Start Date'}</label>
                    <input
                      type="date"
                      {...register('preferredStartDate', { required: t.preferredStartDateError || 'Preferred start date is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Preferred Start Date"
                      aria-describedby={errors.preferredStartDate ? 'preferredStartDate-error' : undefined}
                    />
                    {errors.preferredStartDate && <p id="preferredStartDate-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.preferredStartDate.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.signature || 'Client Signature'}</label>
                    <input
                      {...register('signature', { required: t.signatureError || 'Signature is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.signaturePlaceholder || 'Type your full name as signature'}
                      aria-label="Signature"
                      aria-describedby={errors.signature ? 'signature-error' : undefined}
                    />
                    {errors.signature && <p id="signature-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.signature.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('agreeTerms', { required: t.agreeTermsError || 'You must agree to the terms' })}
                        className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-400 focus:ring-yellow-400' : 'text-blue-600 focus:ring-blue-500'} border-gray-300 rounded`}
                        aria-label="Agree to Terms"
                      />
                      <label className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.agreeTerms || 'I agree to the terms and conditions'}</label>
                    </div>
                    {errors.agreeTerms && <p id="agreeTerms-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.agreeTerms.message}</p>}
                  </div>
                </div>
                <div className={`p-4 rounded-lg space-y-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.personalInfo || 'Personal Information'}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.firstName || 'First Name'}: {formData.firstName || 'Not provided'}<br />
                      {t.lastName || 'Last Name'}: {formData.lastName || 'Not provided'}<br />
                      {t.phoneNumber || 'Phone Number'}: {formData.phoneNumber || 'Not provided'}<br />
                      {t.email || 'Email'}: {formData.email || 'Not provided'}<br />
                      {t.address || 'Address'}: {formData.address || 'Not provided'}<br />
                      {t.city || 'City'}: {formData.city || 'Not provided'}<br />
                      {t.country || 'Country'}: {formData.country || 'Not provided'}<br />
                      {t.jobType || 'Job Type'}: {formData.jobType || 'Not provided'}<br />
                      {t.emergencyName || 'Emergency Contact Name'}: {formData.emergencyName || 'Not provided'}<br />
                      {t.emergencyPhone || 'Emergency Phone'}: {formData.emergencyPhone || 'Not provided'}<br />
                      {t.gender || 'Gender'}: {formData.gender || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.healthInfo || 'Health Information'}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.height || 'Height'}: {formData.height || 'Not provided'} cm<br />
                      {t.weight || 'Weight'}: {formData.weight || 'Not provided'} kg<br />
                      {t.bmi || 'BMI'}: {formData.bmi || 'Not provided'} {formData.bmi ? `(${formData.bmi < 18.5 ? t.bmiUnderweight || 'Underweight' : formData.bmi < 25 ? t.bmiNormal || 'Normal' : formData.bmi < 30 ? t.bmiOverweight || 'Overweight' : t.bmiObese || 'Obese'})` : ''}<br />
                      {t.age || 'Age'}: {formData.age || 'Not provided'}<br />
                      {t.bloodType || 'Blood Type'}: {formData.bloodType || 'Not provided'}<br />
                      {t.goalWeight || 'Goal Weight'}: {formData.goalWeight || 'Not provided'} kg<br />
                      {t.medicalConditions || 'Medical Conditions'}: {formData.medicalConditions || 'Not provided'}<br />
                      {t.medicalConditionsDetails || 'Medical Conditions Details'}: {formData.medicalConditionsDetails || 'Not provided'}<br />
                      {t.healthIssues || 'Health Issues'}: {formData.healthIssues || 'Not provided'}<br />
                      {t.medications || 'Medications'}: {formData.medications || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.lifestyle || 'Lifestyle'}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.workSchedule || 'Work Schedule'}: {formData.workSchedule || 'Not provided'}<br />
                      {t.travelFrequency || 'Travel Frequency'}: {formData.travelFrequency || 'Not provided'}<br />
                      {t.physicalActivities || 'Physical Activities'}: {formData.physicalActivities || 'Not provided'}<br />
                      {t.dietType || 'Diet Type'}: {formData.dietType || 'Not provided'}<br />
                      {t.relationship || 'Relationship'}: {formData.relationship || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.trainingGoals || 'Training Goals'}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.trainingGoal || 'Training Goal'}: {formData.trainingGoal || 'Not provided'}<br />
                      {t.goalReason || 'Reason for Goal'}: {formData.goalReason || 'Not provided'}<br />
                      {t.goalTimeline || 'Goal Timeline'}: {formData.goalTimeline || 'Not provided'}<br />
                      {t.previousTraining || 'Previous Training'}: {formData.previousTraining || 'Not provided'}<br />
                      {t.trainingType || 'Training Type'}: {formData.trainingType || 'Not provided'}<br />
                      {t.preferredTrainingTime || 'Preferred Training Time'}: {formData.preferredTrainingTime || 'Not provided'}<br />
                      {t.trainerExpectations || 'Trainer Expectations'}: {formData.trainerExpectations || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${currentStep === 0 ? (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : (theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500')}`}
              >
                <ChevronLeftIcon className="w-5 h-5 inline mr-1" /> {t.previous || 'Previous'}
              </button>
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={`px-6 py-3 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'} transition-all duration-300`}
                >
                  {t.next || 'Next'} <ChevronRightIcon className="w-5 h-5 inline ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${!isUploading ? (theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500') : (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-400 text-gray-500 cursor-not-allowed')}`}
                >
                  {t.submit || 'Submit'}
                </button>
              )}
            </div>
          </form>
          <ToastContainer position="top-center" autoClose={3000} theme={theme} />
        </div>
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
    </>
  );
};

export default GYMForm;