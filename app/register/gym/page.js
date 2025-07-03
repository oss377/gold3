"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { collection, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../../app/fconfig';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function GymRegistrationForm() {
  const router = useRouter();
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

  const steps = [
    { name: 'Personal Info', fields: ['firstName', 'lastName', 'phoneNumber', 'photo', 'address', 'city', 'country', 'jobType', 'email', 'password', 'gender'] },
    { name: 'Health Info', fields: ['height', 'weight', 'age', 'bmi', 'bloodType', 'goalWeight'] },
    { name: 'Emergency Contact', fields: ['emergencyName', 'emergencyPhone', 'relationship', 'hasMedicalConditions', 'medicalConditions'] },
    { name: 'Membership', fields: ['membershipType', 'startDate', 'signature'] },
    { name: 'Review', fields: [] },
  ];

  useEffect(() => {
    if (!auth || !db || !storage) {
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

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'height' || name === 'weight') {
        const heightInMeters = parseFloat(value.height) / 100;
        const weight = parseFloat(value.weight);
        if (heightInMeters > 0 && weight > 0) {
          const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
          setValue('bmi', bmi);
        } else {
          setValue('bmi', '');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

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
      if (err.code === 'auth/weak-password') errorMessage = 'Password must be at least 6 characters.';
      throw new Error(errorMessage);
    }
  };

  const onSubmit = async (data) => {
    setFormErrors({});
    if (!isAuthenticated || !auth.currentUser) {
      toast.error('User is not authenticated.');
      setFormErrors({ global: 'User is not authenticated.' });
      return;
    }

    try {
      if (!db) throw new Error('Firestore database is not initialized.');
      if (!storage) throw new Error('Firebase Storage is not initialized.');

      let photoURL = '';
      if (data.photo && data.photo[0]) {
        const storageRef = ref(storage, `gym_photos/${auth.currentUser.uid}_${Date.now()}_${data.photo[0].name}`);
        await uploadBytes(storageRef, data.photo[0]);
        photoURL = await getDownloadURL(storageRef);
      }

      const dataToStore = {
        ...data,
        photo: null,
        photoURL,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      const gymCollectionRef = collection(db, 'gym');
      await addDoc(gymCollectionRef, dataToStore);
      toast.success('Registration submitted successfully!');
      router.push('/success');
    } catch (err) {
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

  const formData = watch();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
        <div className="text-2xl font-semibold text-gray-700 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-8">Gym Registration Form</h2>

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
                    <label className="block text-sm font-medium text-gray-700">Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      {...register('photo')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-300"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      {...register('address', { required: 'Address is required' })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your address"
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
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
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      {...register('country', { required: 'Country is required' })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your country"
                    />
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Type</label>
                    <input
                      {...register('jobType')}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your job type"
                    />
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
                      {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your password"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <div className="mt-2 flex space-x-4">
                      {['Male', 'Female', 'Other'].map((gender) => (
                        <div key={gender} className="flex items-center">
                          <input
                            type="radio"
                            {...register('gender', { required: 'Gender is required' })}
                            value={gender.toLowerCase()}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <label className="ml-2 block text-sm text-gray-700">{gender}</label>
                        </div>
                      ))}
                    </div>
                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Health Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800">Health Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <input
                      type="number"
                      {...register('age', { required: 'Age is required', min: { value: 0, message: 'Age must be positive' } })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your age"
                    />
                    {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">BMI</label>
                    <input
                      type="number"
                      {...register('bmi')}
                      readOnly
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100"
                      placeholder="Calculated BMI"
                    />
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
                    <label className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
                    <input
                      type="number"
                      {...register('goalWeight', { min: { value: 0, message: 'Goal weight must be positive' } })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter goal weight"
                    />
                    {errors.goalWeight && <p className="text-red-500 text-xs mt-1">{errors.goalWeight.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Emergency Contact */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800">Emergency Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    <label className="block text-sm font-medium text-gray-700">Emergency Phone Number</label>
                    <input
                      type="tel"
                      {...register('emergencyPhone', { required: 'Emergency phone is required', pattern: { value: /^\+?[\d\s-]{10,}$/, message: 'Invalid phone number' } })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter emergency phone"
                    />
                    {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Relationship</label>
                    <input
                      {...register('relationship', { required: 'Relationship is required' })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter relationship"
                    />
                    {errors.relationship && <p className="text-red-500 text-xs mt-1">{errors.relationship.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Do you have any medical conditions or allergies?</label>
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      {...register('hasMedicalConditions')}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Yes</label>
                  </div>
                  {formData.hasMedicalConditions && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Please provide details</label>
                      <textarea
                        {...register('medicalConditions', { required: 'Medical condition details are required' })}
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                        rows="4"
                        placeholder="Describe any medical conditions or allergies"
                      />
                      {errors.medicalConditions && <p className="text-red-500 text-xs mt-1">{errors.medicalConditions.message}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Membership Information */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800">Membership Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Membership Type</label>
                    <select
                      {...register('membershipType', { required: 'Membership type is required' })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    >
                      <option value="">Select...</option>
                      <option value="monthly">Monthly Membership</option>
                      <option value="annual">Annual Membership</option>
                      <option value="day">Day Pass</option>
                    </select>
                    {errors.membershipType && <p className="text-red-500 text-xs mt-1">{errors.membershipType.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Start Date</label>
                    <input
                      type="date"
                      {...register('startDate', { required: 'Start date is required' })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    />
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Client Signature</label>
                    <input
                      {...register('signature', { required: 'Signature is required' })}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Type your full name as signature"
                    />
                    {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800">Review Your Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Personal Information</h4>
                    <p className="text-sm text-gray-600">
                      Name: {formData.firstName || 'Not provided'} {formData.lastName || 'Not provided'}<br />
                      Phone: {formData.phoneNumber || 'Not provided'}<br />
                      Email: {formData.email || 'Not provided'}<br />
                      Address: {formData.address || 'Not provided'}, {formData.city || 'Not provided'}, {formData.country || 'Not provided'}<br />
                      Job Type: {formData.jobType || 'Not provided'}<br />
                      Gender: {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Health Information</h4>
                    <p className="text-sm text-gray-600">
                      Height: {formData.height || 'Not provided'} cm<br />
                      Weight: {formData.weight || 'Not provided'} kg<br />
                      Age: {formData.age || 'Not provided'}<br />
                      BMI: {formData.bmi || 'Not provided'}<br />
                      Blood Type: {formData.bloodType || 'Not provided'}<br />
                      Goal Weight: {formData.goalWeight || 'Not provided'} kg
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Emergency Contact</h4>
                    <p className="text-sm text-gray-600">
                      Name: {formData.emergencyName || 'Not provided'}<br />
                      Phone: {formData.emergencyPhone || 'Not provided'}<br />
                      Relationship: {formData.relationship || 'Not provided'}<br />
                      Medical Conditions: {formData.hasMedicalConditions ? formData.medicalConditions || 'Not provided' : 'None'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Membership Information</h4>
                    <p className="text-sm text-gray-600">
                      Membership Type: {formData.membershipType ? formData.membershipType.charAt(0).toUpperCase() + formData.membershipType.slice(1) : 'Not provided'}<br />
                      Start Date: {formData.startDate || 'Not provided'}<br />
                      Signature: {formData.signature || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
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
                  disabled={!isAuthenticated}
                  className={`px-6 py-3 rounded-lg text-sm font-medium text-white transition-all duration-300 ${
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
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
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
    </>
  );
}