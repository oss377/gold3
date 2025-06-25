"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../../app/fconfig'; // Adjust path to your fconfig file

export default function GymRegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    photo: null,
    photoURL: '',
    address: '',
    city: '',
    country: '',
    jobType: '',
    email: '',
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
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
      if (!formData.phoneNumber.match(/^\+?[\d\s-]{10,}$/)) newErrors.phoneNumber = 'Valid phone number is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
    } else if (currentStep === 2) {
      if (!formData.height || formData.height <= 0) newErrors.height = 'Valid height is required';
      if (!formData.weight || formData.weight <= 0) newErrors.weight = 'Valid weight is required';
      if (!formData.age || formData.age <= 0) newErrors.age = 'Valid age is required';
    } else if (currentStep === 3) {
      if (!formData.emergencyName.trim()) newErrors.emergencyName = 'Emergency contact name is required';
      if (!formData.emergencyPhone.match(/^\+?[\d\s-]{10,}$/)) newErrors.emergencyPhone = 'Valid emergency phone is required';
      if (!formData.relationship.trim()) newErrors.relationship = 'Relationship is required';
      if (formData.hasMedicalConditions && !formData.medicalConditions.trim()) {
        newErrors.medicalConditions = 'Please provide medical condition details';
      }
    } else if (currentStep === 4) {
      if (!formData.membershipType) newErrors.membershipType = 'Membership type is required';
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.signature.trim()) newErrors.signature = 'Signature is required';
    }
    return newErrors;
  };

  // Calculate BMI automatically
  useEffect(() => {
    if (formData.height && formData.weight) {
      const heightInMeters = formData.height / 100;
      const bmi = (formData.weight / (heightInMeters * heightInMeters)).toFixed(1);
      setFormData((prev) => ({ ...prev, bmi }));
    }
  }, [formData.height, formData.weight]);

  // Handle Firebase Authentication
  useEffect(() => {
    if (!auth || !db || !storage) {
      console.error('Firebase services not initialized:', { auth, db, storage });
      setErrors({ global: 'Firebase services are not initialized. Please check configuration.' });
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
            errorMessage = 'Firebase Authentication is not properly configured. Please ensure anonymous sign-in is enabled in the Firebase Console.';
          }
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptSignIn, retryDelay);
          } else {
            setErrors({ global: `Authentication failed: ${errorMessage}` });
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
          setErrors({ global: `Authentication setup failed: ${err.message}` });
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: e.target.checked });
    } else if (type === 'file') {
      const files = e.target.files;
      setFormData({ ...formData, [name]: files ? files[0] : null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!isAuthenticated || !auth.currentUser) {
      setErrors({ global: 'User is not authenticated. Please wait or try again.' });
      return;
    }

    try {
      if (!db) throw new Error('Firestore database is not initialized.');
      let photoURL = '';
      if (formData.photo) {
        if (!storage) throw new Error('Firebase Storage is not initialized.');
        const storageRef = ref(storage, `gym_photos/${auth.currentUser.uid}_${formData.photo.name}`);
        await uploadBytes(storageRef, formData.photo);
        photoURL = await getDownloadURL(storageRef);
      }

      const dataToStore = {
        ...formData,
        photoURL,
        photo: null,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      const gymCollectionRef = collection(db, 'gym');
      await addDoc(gymCollectionRef, dataToStore);

      setSuccess('Registration submitted successfully!');
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
        errorMessage = 'Permission denied: Unable to save data. Please ensure anonymous users have write access to the gym collection.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firestore service is unavailable. Please check your network connection and try again.';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      setErrors({ global: errorMessage });
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    } else {
      setErrors(validationErrors);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { name: 'Personal Info', fields: ['firstName', 'lastName', 'phoneNumber', 'photo', 'address', 'city', 'country', 'jobType', 'email', 'gender'] },
    { name: 'Health Info', fields: ['height', 'weight', 'age', 'bmi', 'bloodType', 'goalWeight'] },
    { name: 'Emergency Contact', fields: ['emergencyName', 'emergencyPhone', 'relationship', 'hasMedicalConditions', 'medicalConditions'] },
    { name: 'Membership', fields: ['membershipType', 'startDate', 'signature'] },
    { name: 'Review', fields: [] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-2xl p-8 transition-all duration-300">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">Gym Registration Form</h2>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            ~

            {steps.map((step, index) => (
              <div key={index} className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > index + 1 ? 'bg-indigo-600 text-white' : 
                  currentStep === index + 1 ? 'bg-indigo-400 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <p className="text-xs mt-1 text-gray-600">{step.name}</p>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {errors.global && <p className="text-red-500 text-center mb-4 animate-pulse">{errors.global}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}

        <form onSubmit={currentStep === 5 ? handleSubmit : handleNext} className="space-y-6">
          {currentStep === 1 && (
            <>
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm<text-sm transition duration-200"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                </div>
                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700">Photo</label>
                  <input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition duration-200"
                    onChange={handleChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.address}
                    onChange={handleChange}
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.city}
                    onChange={handleChange}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.country}
                    onChange={handleChange}
                  />
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                </div>
                <div>
                  <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">Job Type</label>
                  <input
                    id="jobType"
                    name="jobType"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.jobType}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <div className="mt-2 flex space-x-4">
                    {['Male', 'Female', 'Other'].map((gender) => (
                      <div key={gender} className="flex items-center">
                        <input
                          id={`gender-${gender}`}
                          name="gender"
                          type="radio"
                          value={gender.toLowerCase()}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          onChange={handleChange}
                          checked={formData.gender === gender.toLowerCase()}
                        />
                        <label htmlFor={`gender-${gender}`} className="ml-2 block text-sm text-gray-900">{gender}</label>
                      </div>
                    ))}
                  </div>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h3 className="text-lg font-medium text-gray-900">Health Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input
                    id="height"
                    name="height"
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.height}
                    onChange={handleChange}
                  />
                  {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.weight}
                    onChange={handleChange}
                  />
                  {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.age}
                    onChange={handleChange}
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label htmlFor="bmi" className="block text-sm font-medium text-gray-700">BMI</label>
                  <input
                    id="bmi"
                    name="bmi"
                    type="number"
                    step="0.1"
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm"
                    value={formData.bmi}
                  />
                </div>
                <div>
                  <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">Blood Type</label>
                  <input
                    id="bloodType"
                    name="bloodType"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.bmi}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="goalWeight" className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
                  <input
                    id="goalWeight"
                    name="goalWeight"
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.goalWeight}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h3 className="text-lg font-medium text-gray-900">Emergency Contact Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700">Emergency Name</label>
                  <input
                    id="emergencyName"
                    name="emergencyName"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.emergencyName}
                    onChange={handleChange}
                  />
                  {errors.emergencyName && <p className="text-red-500 text-xs mt-1">{errors.emergencyName}</p>}
                </div>
                <div>
                  <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">Emergency Phone Number</label>
                  <input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                  />
                  {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone}</p>}
                </div>
                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">Relationship</label>
                  <input
                    id="relationship"
                    name="relationship"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.relationship}
                    onChange={handleChange}
                  />
                  {errors.relationship && <p className="text-red-500 text-xs mt-1">{errors.relationship}</p>}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Do you have any medical conditions or allergies?</label>
                <div className="mt-2 flex space-x-4">
                  <div className="flex items-center">
                    <input
                      id="hasMedicalConditions-yes"
                      name="hasMedicalConditions"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={formData.hasMedicalConditions}
                      onChange={handleChange}
                    />
                    <label htmlFor="hasMedicalConditions-yes" className="ml-2 block text-sm text-gray-900">Yes</label>
                  </div>
                </div>
                {formData.hasMedicalConditions && (
                  <div className="mt-4">
                    <label htmlFor="medicalConditions" className="block text-sm font-medium text-gray-700">Please provide details</label>
                    <textarea
                      id="medicalConditions"
                      name="medicalConditions"
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                      value={formData.medicalConditions}
                      onChange={handleChange}
                    />
                    {errors.medicalConditions && <p className="text-red-500 text-xs mt-1">{errors.medicalConditions}</p>}
                  </div>
                )}
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <h3 className="text-lg font-medium text-gray-900">Membership Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="membershipType" className="block text-sm font-medium text-gray-700">Choose Membership Type</label>
                  <select
                    id="membershipType"
                    name="membershipType"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.membershipType}
                    onChange={handleChange}
                  >
                    <option value="">Select...</option>
                    <option value="monthly">Monthly Membership</option>
                    <option value="annual">Annual Membership</option>
                    <option value="day">Day Pass</option>
                  </select>
                  {errors.membershipType && <p className="text-red-500 text-xs mt-1">{errors.membershipType}</p>}
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Preferred Start Date</label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Client Signature</label>
                  <input
                    id="signature"
                    name="signature"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-200"
                    value={formData.signature}
                    onChange={handleChange}
                  />
                  {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature}</p>}
                </div>
              </div>
            </>
          )}

          {currentStep === 5 && (
            <>
              <h3 className="text-lg font-medium text-gray-900">Review Your Information</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Personal Information</h4>
                  <p className="text-sm text-gray-600">
                    Name: {formData.firstName} {formData.lastName}<br />
                    Phone: {formData.phoneNumber}<br />
                    Email: {formData.email}<br />
                    Address: {formData.address}, {formData.city}, {formData.country}<br />
                    Job Type: {formData.jobType || 'N/A'}<br />
                    Gender: {formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Health Information</h4>
                  <p className="text-sm text-gray-600">
                    Height: {formData.height} cm<br />
                    Weight: {formData.weight} kg<br />
                    Age: {formData.age}<br />
                    BMI: {formData.bmi}<br />
                    Blood Type: {formData.bloodType || 'N/A'}<br />
                    Goal Weight: {formData.goalWeight || 'N/A'} kg
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Emergency Contact</h4>
                  <p className="text-sm text-gray-600">
                    Name: {formData.emergencyName}<br />
                    Phone: {formData.emergencyPhone}<br />
                    Relationship: {formData.relationship}<br />
                    Medical Conditions: {formData.hasMedicalConditions ? formData.medicalConditions : 'None'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Membership Information</h4>
                  <p className="text-sm text-gray-600">
                    Membership Type: {formData.membershipType.charAt(0).toUpperCase() + formData.membershipType.slice(1)}<br />
                    Start Date: {formData.startDate}<br />
                    Signature: {formData.signature}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
              >
                Previous
              </button>
            )}
            <button
              type="submit"
              disabled={!isAuthenticated}
              className={`ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isAuthenticated
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  : 'bg-gray-400 cursor-not-allowed'
              } transition duration-200`}
            >
              {currentStep === 5 ? 'Submit' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}