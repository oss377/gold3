'use client';

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDLnWumpMzRswx9AkjJOv6Rw3xAhOvqr0c",
  authDomain: "gold-57e14.firebaseapp.com",
  projectId: "gold-57e14",
  storageBucket: "gold-57e14.firebasestorage.app",
  messagingSenderId: "1026627253984",
  appId: "1:1026627253984:web:c6e298ef472e640542c285",
  measurementId: "G-F8W74RCHJ3"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export default function RegistrationForm() {
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
    relationship: '',
    yearsTraining: '',
    behavioral: '',
    healthIssues: '',
    rank: '',
    smoke: false,
    surgery: false,
    alcohol: false,
    heartDisease: false,
    hearingProblem: false,
    visionProblem: false,
    startDate: '',
    signature: '',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const steps = [
    'Personal Information',
    'Emergency Contact',
    'Personal Details',
    'Health & Lifestyle',
    'Signature',
  ];

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 0) {
      if (!formData.firstName) newErrors.firstName = 'First Name is required';
      if (!formData.lastName) newErrors.lastName = 'Last Name is required';
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone Number is required';
      if (!formData.address) newErrors.address = 'Address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.email) newErrors.email = 'Email is required';
    } else if (currentStep === 1) {
      if (!formData.emergencyName) newErrors.emergencyName = 'Emergency Contact Name is required';
      if (!formData.emergencyPhone) newErrors.emergencyPhone = 'Emergency Contact Phone is required';
    } else if (currentStep === 2) {
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.height) newErrors.height = 'Height is required';
      if (!formData.weight) newErrors.weight = 'Weight is required';
      if (!formData.age) newErrors.age = 'Age is required';
      if (!formData.rank) newErrors.rank = 'Rank is required';
    } else if (currentStep === 3) {
      if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    } else if (currentStep === 4) {
      if (!formData.signature) newErrors.signature = 'Signature is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const target = e.target;
    const { name, value, type } = target;
    let updatedValue = value;

    if (type === 'checkbox') {
      updatedValue = target.checked;
    } else if (type === 'file') {
      updatedValue = target.files?.[0] || null;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      let photoURL = null;
      if (formData.photo) {
        const photoRef = ref(storage, `photos/${formData.photo.name}_${Date.now()}`);
        await uploadBytes(photoRef, formData.photo);
        photoURL = await getDownloadURL(photoRef);
      }

      const dataToSave = {
        ...formData,
        photo: photoURL,
        timestamp: new Date().toISOString(),
      };

      await addDoc(collection(db, 'karate'), dataToSave);

      setSuccess('Registration submitted successfully!');
      setFormData({
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
        relationship: '',
        yearsTraining: '',
        behavioral: '',
        healthIssues: '',
        rank: '',
        smoke: false,
        surgery: false,
        alcohol: false,
        heartDisease: false,
        hearingProblem: false,
        visionProblem: false,
        startDate: '',
        signature: '',
      });
      setCurrentStep(0);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit the form. Please try again.');
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.firstName && <p className="text-red-600 text-sm">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.lastName && <p className="text-red-600 text-sm">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.phoneNumber && <p className="text-red-600 text-sm">{errors.phoneNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Photo</label>
                <input
                  type="file"
                  name="photo"
                  onChange={handleChange}
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.address && <p className="text-red-600 text-sm">{errors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.city && <p className="text-red-600 text-sm">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.country && <p className="text-red-600 text-sm">{errors.country}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Type</label>
                <input
                  type="text"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Emergency Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.emergencyName && <p className="text-red-600 text-sm">{errors.emergencyName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.emergencyPhone && <p className="text-red-600 text-sm">{errors.emergencyPhone}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-red-600 text-sm">{errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.height && <p className="text-red-600 text-sm">{errors.height}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.weight && <p className="text-red-600 text-sm">{errors.weight}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.age && <p className="text-red-600 text-sm">{errors.age}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                <input
                  type="text"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Training</label>
                <input
                  type="number"
                  name="yearsTraining"
                  value={formData.yearsTraining}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Behavioral Notes</label>
                <textarea
                  name="behavioral"
                  value={formData.behavioral}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Health Issues</label>
                <textarea
                  name="healthIssues"
                  value={formData.healthIssues}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rank</label>
                <select
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Rank</option>
                  <option value="White Belt - No Stripe">White Belt - No Stripe</option>
                  <option value="Yellow Belt - No Stripe">Yellow Belt - No Stripe</option>
                  <option value="Yellow Belt - One Stripe">Yellow Belt - One Stripe</option>
                  <option value="Green Belt - No Stripe">Green Belt - No Stripe</option>
                  <option value="Green Belt - One Stripe">Green Belt - One Stripe</option>
                  <option value="Blue Belt - No Stripe">Blue Belt - No Stripe</option>
                  <option value="Blue Belt - One Stripe">Blue Belt - One Stripe</option>
                  <option value="Red Belt - No Stripe">Red Belt - No Stripe</option>
                  <option value="Red Belt - One Stripe">Red Belt - One Stripe</option>
                  <option value="Brown Belt - No Stripe">Brown Belt - No Stripe</option>
                  <option value="Brown Belt - One Stripe">Brown Belt - One Stripe</option>
                  <option value="Black Belt">Black Belt (Any Dan Level)</option>
                </select>
                {errors.rank && <p className="text-red-600 text-sm">{errors.rank}</p>}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Health & Lifestyle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-4">Do you smoke?</label>
                <input
                  type="checkbox"
                  name="smoke"
                  checked={formData.smoke}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-4">Had surgery in the past year?</label>
                <input
                  type="checkbox"
                  name="surgery"
                  checked={formData.surgery}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-4">Do you drink alcohol?</label>
                <input
                  type="checkbox"
                  name="alcohol"
                  checked={formData.alcohol}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-4">Do you have heart disease?</label>
                <input
                  type="checkbox"
                  name="heartDisease"
                  checked={formData.heartDisease}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-4">Do you have hearing problems?</label>
                <input
                  type="checkbox"
                  name="hearingProblem"
                  checked={formData.hearingProblem}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-4">Do you have vision problems?</label>
                <input
                  type="checkbox"
                  name="visionProblem"
                  checked={formData.visionProblem}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.startDate && <p className="text-red-600 text-sm">{errors.startDate}</p>}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Signature</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Signature</label>
              <input
                type="text"
                name="signature"
                value={formData.signature}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type your name as signature"
                required
              />
              {errors.signature && <p className="text-red-600 text-sm">{errors.signature}</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">3 JKS Karate Registration Form</h1>
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md animate-fade-in">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md animate-fade-in">
            {error}
          </div>
        )}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={index} className="flex-1 text-center">
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <p className="text-sm mt-2 text-gray-600">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <div>{renderStep()}</div>
        <div className="flex justify-between mt-6">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Previous
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ml-auto"
            >
              Submit
            </button>
          )}
        </div>
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}