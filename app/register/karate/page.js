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

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      let photoURL = null;

      // Handle photo upload to Firebase Storage if a photo is provided
      if (formData.photo) {
        const photoRef = ref(storage, `photos/${formData.photo.name}_${Date.now()}`);
        await uploadBytes(photoRef, formData.photo);
        photoURL = await getDownloadURL(photoRef);
      }

      // Prepare data for Firestore, excluding the file object
      const dataToSave = {
        ...formData,
        photo: photoURL, // Store the download URL instead of the file
        timestamp: new Date().toISOString(), // Add a timestamp for record-keeping
      };

      // Save to Firestore "karate" collection
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
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit the form. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">3 JKS Karate Registration Form</h1>
      {success && <p className="text-green-600 mb-4">{success}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Photo</label>
              <input
                type="file"
                name="photo"
                onChange={handleChange}
                accept="image/*"
                className="mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Job Type</label>
              <input
                type="text"
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Information */}
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold mb-4">Emergency Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyName"
                value={formData.emergencyName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Relationship</label>
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Years of Training</label>
              <input
                type="number"
                name="yearsTraining"
                value={formData.yearsTraining}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Behavioral Notes</label>
              <textarea
                name="behavioral"
                value={formData.behavioral}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Health Issues</label>
              <textarea
                name="healthIssues"
                value={formData.healthIssues}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Rank</label>
              <select
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
            </div>
          </div>
        </div>

        {/* Health & Lifestyle */}
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold mb-4">Health & Lifestyle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <label className="block text-sm font-medium mr-4">Do you smoke?</label>
              <input
                type="checkbox"
                name="smoke"
                checked={formData.smoke}
                onChange={handleChange}
                className="h-5 w-5"
              />
            </div>
            <div className="flex items-center">
              <label className="block text-sm font-medium mr-4">Had surgery in the past year?</label>
              <input
                type="checkbox"
                name="surgery"
                checked={formData.surgery}
                onChange={handleChange}
                className="h-5 w-5"
              />
            </div>
            <div className="flex items-center">
              <label className="block text-sm font-medium mr-4">Do you drink alcohol?</label>
              <input
                type="checkbox"
                name="alcohol"
                checked={formData.alcohol}
                onChange={handleChange}
                className="h-5 w-5"
              />
            </div>
            <div className="flex items-center">
              <label className="block text-sm font-medium mr-4">Do you have heart disease?</label>
              <input
                type="checkbox"
                name="heartDisease"
                checked={formData.heartDisease}
                onChange={handleChange}
                className="h-5 w-5"
              />
            </div>
            <div className="flex items-center">
              <label className="block text-sm font-medium mr-4">Do you have hearing problems?</label>
              <input
                type="checkbox"
                name="hearingProblem"
                checked={formData.hearingProblem}
                onChange={handleChange}
                className="h-5 w-5"
              />
            </div>
            <div className="flex items-center">
              <label className="block text-sm font-medium mr-4">Do you have vision problems?</label>
              <input
                type="checkbox"
                name="visionProblem"
                checked={formData.visionProblem}
                onChange={handleChange}
                className="h-5 w-5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Preferred Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Signature */}
        <div>
          <label className="block text-sm font-medium">Client Signature</label>
          <input
            type="text"
            name="signature"
            value={formData.signature}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="Type your name as signature"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
}