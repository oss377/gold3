"use client";

import { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { collection, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../../app/fconfig';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ThemeContext } from '../../../context/ThemeContext';
import { LanguageContext } from '../../../context/LanguageContext';

// Cloudinary configuration (use environment variables for security)
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'promotionvideo';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkifgcmpy';
const CLOUDINARY_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'video/promotionvideo';

export default function GymRegistrationForm() {
  const router = useRouter();
  const { t } = useContext(LanguageContext);
  const context = useContext(ThemeContext);
  const { theme } = context || { theme: 'light' }; // Fallback to light theme
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      photo: null,
      address: '',
      city: '',
      country: '',
      jobType: '',
      email: '',
      password: '',
      gender: '',
      height: '',
      weight: '',
      age: '',
      bmi: '',
      bloodType: '',
      goalWeight: '',
      emergencyName: '',
      emergencyPhone: '',
      relationship: '',
      medicalConditions: '',
      hasMedicalConditions: false,
      membershipType: '',
      startDate: '',
      signature: '',
      role: 'user',
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const steps = [
    { name: t.personalInfo || 'Personal Info', fields: ['firstName', 'lastName', 'phoneNumber', 'photo', 'address', 'city', 'country', 'jobType', 'email', 'password', 'gender'] },
    { name: t.healthInfo || 'Health Info', fields: ['height', 'weight', 'age', 'bmi', 'bloodType', 'goalWeight'] },
    { name: t.emergencyContact || 'Emergency Contact', fields: ['emergencyName', 'emergencyPhone', 'relationship', 'hasMedicalConditions', 'medicalConditions'] },
    { name: t.membership || 'Membership', fields: ['membershipType', 'startDate', 'signature'] },
    { name: t.review || 'Review', fields: [] },
  ];

  // Watch height and weight for BMI calculation
  const height = watch('height');
  const weight = watch('weight');

  useEffect(() => {
    if (height && weight && !isNaN(height) && !isNaN(weight) && height > 0 && weight > 0) {
      const heightInMeters = parseFloat(height) / 100;
      const weightInKg = parseFloat(weight);
      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
      setValue('bmi', bmi);
    } else {
      setValue('bmi', '');
    }
  }, [height, weight, setValue]);

  useEffect(() => {
    if (!auth || !db) {
      setFormErrors({ global: t.firebaseError || 'Firebase services are not initialized.' });
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    }, (error) => {
      console.error('Auth state error:', error);
      if (error.code === 'auth/invalid-api-key') {
        setFormErrors({ global: t.firebaseApiKeyError || 'Invalid Firebase API key. Please contact support.' });
      } else {
        setFormErrors({ global: t.authError || 'Authentication error occurred.' });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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
      if (err.code === 'auth/user-not-found') errorMessage = t.userNotFound || 'No account found with this email. Please sign up.';
      if (err.code === 'auth/email-already-in-use') errorMessage = t.emailInUse || 'Email already in use.';
      if (err.code === 'auth/invalid-email') errorMessage = t.invalidEmail || 'Invalid email format.';
      if (err.code === 'auth/weak-password') errorMessage = t.weakPassword || 'Password must be at least 6 characters.';
      if (err.code === 'auth/invalid-api-key') errorMessage = t.firebaseApiKeyError || 'Invalid Firebase API key. Please contact support.';
      throw new Error(errorMessage);
    }
  };

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
        toast.error(t.uploadError || 'Failed to upload image.');
        return null;
      }
    } catch (error) {
      setIsUploading(false);
      toast.error(t.uploadError || 'Failed to upload image: ' + error.message);
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

  const onSubmit = async (data) => {
    setFormErrors({});
    try {
      if (!isAuthenticated) {
        await handleAuth(data.email, data.password, true);
        if (!auth.currentUser) {
          throw new Error(t.authError || 'Authentication failed. Please try again.');
        }
      }

      if (!db) throw new Error(t.firestoreError || 'Firestore database is not initialized.');

      let photoURL = '';
      if (data.photo && data.photo[0]) {
        photoURL = await uploadToCloudinary(data.photo[0]);
        if (!photoURL) {
          throw new Error(t.uploadError || 'Image upload failed.');
        }
      }

      await addDoc(collection(db, 'gym'), {
        ...data,
        photo: null,
        photoURL,
        role: 'user',
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });
      toast.success(t.successMessage || 'Registration successful!');
      setIsSubmitted(true);
    } catch (err) {
      let errorMessage = err.message || t.unexpectedError || 'An unexpected error occurred.';
      if (err.code === 'permission-denied') {
        errorMessage = t.permissionError || 'Permission denied: Unable to save data.';
      } else if (err.code === 'unavailable') {
        errorMessage = t.firestoreError || 'Firestore service is unavailable.';
      } else if (err.code === 'auth/invalid-api-key') {
        errorMessage = t.firebaseApiKeyError || 'Invalid Firebase API key. Please contact support.';
      }
      toast.error(errorMessage);
      setFormErrors({ global: errorMessage });
    }
  };

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      const currentFields = steps[currentStep].fields;
      const hasErrors = currentFields.some((field) => errors[field]);
      if (!hasErrors) {
        if (currentStep === 0 && !isAuthenticated) {
          const { email, password } = watch();
          try {
            await handleAuth(email, password, true);
            setCurrentStep(currentStep + 1);
          } catch (err) {
            toast.error(err.message);
            setFormErrors({ global: err.message });
          }
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
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8`}>{t.successMessage || 'Thank you for registering with the Gym. Your information has been successfully saved.'}</p>
          <button
            onClick={handleGoToHome}
            className={`px-6 py-3 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'} transition-all duration-300`}
          >
            {t.goToHome || 'Go to Home Page'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <div className={`max-w-4xl w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-8 rounded-xl shadow-2xl border`}>
          <h2 className={`text-3xl font-extrabold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-8`}>{t.title || 'Gym Registration Form'}</h2>

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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      <img src={photoPreview} alt={t.photoPreview || 'Photo preview'} className="mt-2 w-32 h-32 object-cover rounded-lg" />
                    )}
                    {isUploading && <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-yellow-400' : 'text-blue-500'}`}>{t.uploading || 'Uploading image...'}</p>}
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
                      {...register('password', { required: t.passwordError || 'Password is required', minLength: { value: 6, message: t.passwordLength || 'Password must be at least 6 characters' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.passwordPlaceholder || 'Enter your password'}
                      aria-label="Password"
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    {errors.password && <p id="password-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.password.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.gender || 'Gender'}</label>
                    <div className="mt-2 flex space-x-4">
                      {['Male', 'Female', 'Other'].map((gender) => (
                        <div key={gender} className="flex items-center">
                          <input
                            type="radio"
                            {...register('gender', { required: t.genderError || 'Gender is required' })}
                            value={gender.toLowerCase()}
                            className={`h-4 w-4 ${theme === 'dark' ? 'text-yellow-400 focus:ring-yellow-400' : 'text-blue-600 focus:ring-blue-500'} border-gray-300`}
                            aria-label={t[gender.toLowerCase()] || gender}
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
                      {...register('height', { required: t.heightError || 'Height is required', min: { value: 0, message: t.heightPositive || 'Height must be positive' } })}
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
                      {...register('weight', { required: t.weightError || 'Weight is required', min: { value: 0, message: t.weightPositive || 'Weight must be positive' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.weightPlaceholder || 'Enter weight in kg'}
                      aria-label="Weight"
                      aria-describedby={errors.weight ? 'weight-error' : undefined}
                    />
                    {errors.weight && <p id="weight-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.weight.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.age || 'Age'}</label>
                    <input
                      type="number"
                      {...register('age', { required: t.ageError || 'Age is required', min: { value: 0, message: t.agePositive || 'Age must be positive' }, max: { value: 150, message: t.ageReasonable || 'Age must be reasonable' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.agePlaceholder || 'Enter your age'}
                      aria-label="Age"
                      aria-describedby={errors.age ? 'age-error' : undefined}
                    />
                    {errors.age && <p id="age-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.age.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.bmi || 'BMI'}</label>
                    <input
                      type="number"
                      {...register('bmi')}
                      readOnly
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} rounded-lg shadow-sm`}
                      placeholder={t.bmiPlaceholder || 'Calculated BMI'}
                      aria-label="BMI"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.bloodType || 'Blood Type'}</label>
                    <select
                      {...register('bloodType', { required: t.bloodTypeError || 'Blood type is required' })}
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
                      {...register('goalWeight', { required: t.goalWeightError || 'Goal weight is required', min: { value: 0, message: t.goalWeightPositive || 'Goal weight must be positive' } })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.goalWeightPlaceholder || 'Enter goal weight'}
                      aria-label="Goal Weight"
                      aria-describedby={errors.goalWeight ? 'goalWeight-error' : undefined}
                    />
                    {errors.goalWeight && <p id="goalWeight-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.goalWeight.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.emergencyContact || 'Emergency Contact Information'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.relationship || 'Relationship'}</label>
                    <input
                      {...register('relationship', { required: t.relationshipError || 'Relationship is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      placeholder={t.relationshipPlaceholder || 'Enter relationship'}
                      aria-label="Relationship"
                      aria-describedby={errors.relationship ? 'relationship-error' : undefined}
                    />
                    {errors.relationship && <p id="relationship-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.relationship.message}</p>}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.medicalConditionsQuestion || 'Do you have any medical conditions or allergies?'}</label>
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      {...register('hasMedicalConditions')}
                      className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-400 focus:ring-yellow-400' : 'text-blue-600 focus:ring-blue-500'} border-gray-300 rounded`}
                      aria-label="Has Medical Conditions"
                    />
                    <label className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.yes || 'Yes'}</label>
                  </div>
                  {formData.hasMedicalConditions && (
                    <div className="mt-4">
                      <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.medicalConditionsDetails || 'Please provide details'}</label>
                      <textarea
                        {...register('medicalConditions', { required: t.medicalConditionsError || 'Medical condition details are required' })}
                        className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                        rows="4"
                        placeholder={t.medicalConditionsPlaceholder || 'Describe any medical conditions or allergies'}
                        aria-label="Medical Conditions"
                        aria-describedby={errors.medicalConditions ? 'medicalConditions-error' : undefined}
                      />
                      {errors.medicalConditions && <p id="medicalConditions-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.medicalConditions.message}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.membership || 'Membership Information'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.membershipType || 'Membership Type'}</label>
                    <select
                      {...register('membershipType', { required: t.membershipTypeError || 'Membership type is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Membership Type"
                      aria-describedby={errors.membershipType ? 'membershipType-error' : undefined}
                    >
                      <option value="">{t.select || 'Select...'}</option>
                      <option value="monthly">{t.monthlyMembership || 'Monthly Membership'}</option>
                      <option value="annual">{t.annualMembership || 'Annual Membership'}</option>
                      <option value="day">{t.dayPass || 'Day Pass'}</option>
                    </select>
                    {errors.membershipType && <p id="membershipType-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.membershipType.message}</p>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.startDate || 'Preferred Start Date'}</label>
                    <input
                      type="date"
                      {...register('startDate', { required: t.startDateError || 'Start date is required' })}
                      className={`mt-1 block w-full px-4 py-3 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:border-yellow-400' : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm transition-all duration-300`}
                      aria-label="Start Date"
                      aria-describedby={errors.startDate ? 'startDate-error' : undefined}
                    />
                    {errors.startDate && <p id="startDate-error" className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{errors.startDate.message}</p>}
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
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t.review || 'Review Your Information'}</h3>
                <div className={`p-4 rounded-lg space-y-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.personalInfo || 'Personal Information'}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.name || 'Name'}: {formData.firstName || t.notProvided || 'Not provided'} {formData.lastName || t.notProvided || 'Not provided'}<br />
                      {t.phoneNumber || 'Phone'}: {formData.phoneNumber || t.notProvided || 'Not provided'}<br />
                      {t.email || 'Email'}: {formData.email || t.notProvided || 'Not provided'}<br />
                      {t.address || 'Address'}: {formData.address || t.notProvided || 'Not provided'}, {formData.city || t.notProvided || 'Not provided'}, {formData.country || t.notProvided || 'Not provided'}<br />
                      {t.jobType || 'Job Type'}: {formData.jobType || t.notProvided || 'Not provided'}<br />
                      {t.gender || 'Gender'}: {formData.gender ? (t[formData.gender] || formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)) : t.notProvided || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.healthInfo || 'Health Information'}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.height || 'Height'}: {formData.height || t.notProvided || 'Not provided'} cm<br />
                      {t.weight || 'Weight'}: {formData.weight || t.notProvided || 'Not provided'} kg<br />
                      {t.age || 'Age'}: {formData.age || t.notProvided || 'Not provided'}<br />
                      {t.bmi || 'BMI'}: {formData.bmi || t.notProvided || 'Not provided'}<br />
                      {t.bloodType || 'Blood Type'}: {formData.bloodType || t.notProvided || 'Not provided'}<br />
                      {t.goalWeight || 'Goal Weight'}: {formData.goalWeight || t.notProvided || 'Not provided'} kg
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.emergencyContact || 'Emergency Contact'}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.emergencyName || 'Name'}: {formData.emergencyName || t.notProvided || 'Not provided'}<br />
                      {t.emergencyPhone || 'Phone'}: {formData.emergencyPhone || t.notProvided || 'Not provided'}<br />
                      {t.relationship || 'Relationship'}: {formData.relationship || t.notProvided || 'Not provided'}<br />
                      {t.medicalConditions || 'Medical Conditions'}: {formData.hasMedicalConditions ? (formData.medicalConditions || t.notProvided || 'Not provided') : t.none || 'None'}
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.membership || 'Membership Information'}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t.membershipType || 'Membership Type'}: {formData.membershipType ? (t[formData.membershipType] || formData.membershipType.charAt(0).toUpperCase() + formData.membershipType.slice(1)) : t.notProvided || 'Not provided'}<br />
                      {t.startDate || 'Start Date'}: {formData.startDate || t.notProvided || 'Not provided'}<br />
                      {t.signature || 'Signature'}: {formData.signature || t.notProvided || 'Not provided'}
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
                  disabled={!isAuthenticated || isUploading}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${isAuthenticated && !isUploading ? (theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500') : (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-400 text-gray-500 cursor-not-allowed')}`}
                >
                  {t.submit || 'Submit'}
                </button>
              )}
            </div>
          </form>
          <ToastContainer position="top-right" autoClose={3000} theme={theme} />
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
}