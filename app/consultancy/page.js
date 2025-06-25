
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { collection, addDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../fconfig';

export default function PersonalTrainingForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    photo: null,
    address: '',
    city: '',
    country: '',
    jobType: '',
    email: '',
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
    preferredTrainingTime: [],
    trainerExpectations: '',
    agreeTerms: false,
    preferredStartDate: '',
    signature: '',
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: 'Personal Information' },
    { id: 2, title: 'Health Information' },
    { id: 3, title: 'Lifestyle' },
    { id: 4, title: 'Training Goals' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox' && name === 'preferredTrainingTime') {
      setFormData({
        ...formData,
        preferredTrainingTime: checked
          ? [...formData.preferredTrainingTime, value]
          : formData.preferredTrainingTime.filter((t) => t !== value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
      });
    }
  };

  const calculateBMI = () => {
    const heightInMeters = parseFloat(formData.height) / 100;
    const weight = parseFloat(formData.weight);
    if (heightInMeters > 0 && weight > 0) {
      const bmi = weight / (heightInMeters * heightInMeters);
      setFormData({ ...formData, bmi: bmi.toFixed(1) });
    } else {
      setFormData({ ...formData, bmi: '' });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    } else if (step === 2) {
      if (formData.height && isNaN(formData.height)) newErrors.height = 'Height must be a number';
      if (formData.weight && isNaN(formData.weight)) newErrors.weight = 'Weight must be a number';
      if (formData.age && isNaN(formData.age)) newErrors.age = 'Age must be a number';
      if (formData.goalWeight && isNaN(formData.goalWeight)) newErrors.goalWeight = 'Goal weight must be a number';
    } else if (step === 4) {
      if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!auth || !db || !storage) {
      setFormErrors({ global: 'Firebase services are not initialized.' });
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
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptSignIn, retryDelay);
          } else {
            setFormErrors({ global: `Authentication failed: ${err.message || 'Unknown error'}` });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    if (!isAuthenticated || !auth.currentUser) {
      toast.error('User is not authenticated.');
      return;
    }

    setUploading(true);
    setFormErrors({});
    let photoUrl = '';

    try {
      if (!db || !storage) throw new Error('Firebase Firestore or Storage is not initialized.');

      if (formData.photo) {
        const photoRef = ref(storage, `photos/${formData.email}_${formData.photo.name}`);
        await uploadBytes(photoRef, formData.photo);
        photoUrl = await getDownloadURL(photoRef);
      }

      const sanitizedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          key === 'preferredTrainingTime' ? value : value ?? ''
        ])
      );

      if (!sanitizedData.bmi) calculateBMI();

      const dataToStore = {
        ...sanitizedData,
        photo: null,
        photoUrl,
        bmi: sanitizedData.bmi || formData.bmi,
        preferredTrainingTime: sanitizedData.preferredTrainingTime || [],
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      const personalTrainingCollectionRef = collection(db, 'personalTraining');
      await addDoc(personalTrainingCollectionRef, dataToStore);

      toast.success('Registration successful!');
      router.push('/success');
    } catch (err) {
      let errorMessage = 'An error occurred while saving your registration.';
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied: Unable to save data.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firebase service is unavailable.';
      } else if (err.code === 'invalid-argument') {
        errorMessage = 'Invalid data provided.';
      } else if (err.code === 'storage/unauthorized') {
        errorMessage = 'Storage permission denied.';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      toast.error(errorMessage);
      setFormErrors({ global: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
        <div className="text-2xl font-semibold text-gray-700 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Personal Training Consultation Form</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-8">Personal Training Consultation</h2>
          
          {/* Stepper */}
          <div className="flex justify-between mb-8">
            {steps.map((step) => (
              <div key={step.id} className="flex-1 text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${currentStep >= step.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {step.id}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">{step.title}</p>
              </div>
            ))}
          </div>

          {formErrors.global && (
            <p className="text-red-500 text-center mb-6 bg-red-50 p-3 rounded-md">{formErrors.global}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your phone number"
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Photo Upload</label>
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      onChange={handleChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Type</label>
                    <input
                      type="text"
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your job type"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergencyName"
                      value={formData.emergencyName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Health Information */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800">Health Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <div className="mt-2 flex space-x-6">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <label key={g} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value={g.toLowerCase()}
                          checked={formData.gender === g.toLowerCase()}
                          onChange={handleChange}
                          className="form-radio h-5 w-5 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      onBlur={calculateBMI}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter height in cm"
                    />
                    {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      onBlur={calculateBMI}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter weight in kg"
                    />
                    {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your age"
                    />
                    {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">BMI</label>
                    <input
                      type="text"
                      name="bmi"
                      value={formData.bmi}
                      readOnly
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100"
                      placeholder="BMI will be calculated"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                    <input
                      type="text"
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter your blood type"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
                    <input
                      type="number"
                      name="goalWeight"
                      value={formData.goalWeight}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="Enter goal weight"
                    />
                    {errors.goalWeight && <p className="text-red-500 text-xs mt-1">{errors.goalWeight}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Status</label>
                  <input
                    type="text"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter relationship status"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current/Previous Health Issues</label>
                  <textarea
                    name="healthIssues"
                    value={formData.healthIssues}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    rows="4"
                    placeholder="Describe any health issues"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medications</label>
                  <textarea
                    name="medications"
                    value={formData.medications}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    rows="4"
                    placeholder="List any medications"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Lifestyle */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800">Lifestyle</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Schedule</label>
                  <select
                    name="workSchedule"
                    value={formData.workSchedule}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  >
                    <option value="">Select...</option>
                    <option value="days">Days</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="nights">Nights</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Travel Frequency</label>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {['Rarely', 'A few times a year', 'A few times a month', 'Weekly'].map((freq) => (
                      <label key={freq} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="travelFrequency"
                          value={freq.toLowerCase()}
                          checked={formData.travelFrequency === freq.toLowerCase()}
                          onChange={handleChange}
                          className="form-radio h-5 w-5 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">{freq}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Physical Activities Outside Gym/Work</label>
                  <textarea
                    name="physicalActivities"
                    value={formData.physicalActivities}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    rows="4"
                    placeholder="Describe your physical activities"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medical Conditions (Diabetes, Asthma, Blood Pressure)</label>
                  <div className="mt-2 flex space-x-6">
                    {['Yes', 'No'].map((condition) => (
                      <label key={condition} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="medicalConditions"
                          value={condition.toLowerCase()}
                          checked={formData.medicalConditions === condition.toLowerCase()}
                          onChange={handleChange}
                          className="form-radio h-5 w-5 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                  {formData.medicalConditions === 'yes' && (
                    <textarea
                      name="medicalConditionsDetails"
                      value={formData.medicalConditionsDetails}
                      onChange={handleChange}
                      className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      rows="4"
                      placeholder="List conditions..."
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Diet</label>
                  <select
                    name="dietType"
                    value={formData.dietType}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  >
                    <option value="">Select...</option>
                    <option value="low-fat">Low-fat</option>
                    <option value="low-carb">Low-carb</option>
                    <option value="high-protein">High-protein</option>
                    <option value="vegetarian-vegan">Vegetarian/Vegan</option>
                    <option value="no-special-diet">No special diet</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Training Goals */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800">Training Goals</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Training Goal</label>
                  <textarea
                    name="trainingGoal"
                    value={formData.trainingGoal}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    rows="4"
                    placeholder="Describe your training goal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Why This Goal?</label>
                  <textarea
                    name="goalReason"
                    value={formData.goalReason}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    rows="4"
                    placeholder="Explain why you chose this goal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Goal Timeline</label>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {['8 weeks', '16 weeks', '24 weeks', '32 weeks', '40 weeks', '1 year'].map((time) => (
                      <label key={time} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="goalTimeline"
                          value={time}
                          checked={formData.goalTimeline === time}
                          onChange={handleChange}
                          className="form-radio h-5 w-5 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Previous Training with Personal Trainer</label>
                  <div className="mt-2 flex space-x-6">
                    {['Yes', 'No'].map((training) => (
                      <label key={training} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="previousTraining"
                          value={training.toLowerCase()}
                          checked={formData.previousTraining === training.toLowerCase()}
                          onChange={handleChange}
                          className="form-radio h-5 w-5 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">{training}</span>
                      </label>
                    ))}
                  </div>
                  {formData.previousTraining === 'yes' && (
                    <textarea
                      name="trainingType"
                      value={formData.trainingType}
                      onChange={handleChange}
                      className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      rows="4"
                      placeholder="Describe the type of training..."
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Training Time</label>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {['Morning', 'Midday', 'Afternoon', 'Evening'].map((time) => (
                      <label key={time} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="preferredTrainingTime"
                          value={time.toLowerCase()}
                          checked={formData.preferredTrainingTime.includes(time.toLowerCase())}
                          onChange={handleChange}
                          className="form-checkbox h-5 w-5 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expectations of Personal Trainer</label>
                  <textarea
                    name="trainerExpectations"
                    value={formData.trainerExpectations}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    rows="4"
                    placeholder="Describe your expectations"
                  />
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-indigo-600"
                    />
                    <span className="ml-2 text-gray-700">I agree to the terms & conditions</span>
                  </label>
                  {errors.agreeTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Start Date</label>
                  <input
                    type="date"
                    name="preferredStartDate"
                    value={formData.preferredStartDate}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Signature</label>
                  <input
                    type="text"
                    name="signature"
                    value={formData.signature}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Type your full name as signature"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentStep === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500'
                }`}
              >
                Previous
              </button>
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={uploading || !isAuthenticated}
                  className={`px-6 py-3 rounded-lg text-sm font-medium text-white transition-all duration-300 ${
                    uploading || !isAuthenticated
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500'
                  }`}
                >
                  {uploading ? 'Submitting...' : 'Submit'}
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
