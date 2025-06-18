"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GymRegistrationForm() {
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const data = new FormData();
    for (const [key, value] of Object.entries(formData)) {
      if (value instanceof File) {
        data.append(key, value);
      } else if (value !== null) {
        data.append(key, value.toString());
      }
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess('Registration submitted successfully!');
        router.push('/success');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Gym Registration Form</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-500 text-center">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">Photo</label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                onChange={handleChange}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
              <input
                id="country"
                name="country"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">Job Type</label>
              <input
                id="jobType"
                name="jobType"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <div className="mt-2 flex space-x-4">
              {['Male', 'Female', 'Other'].map((gender) => (
                <div key={gender} className="flex items-center">
                  <input
                    id={`gender-${gender}`}
                    name="gender"
                    type="radio"
                    value={gender.toLowerCase()}
                    required
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    onChange={handleChange}
                    checked={formData.gender === gender.toLowerCase()}
                  />
                  <label htmlFor={`gender-${gender}`} className="ml-2 block text-sm text-gray-900">{gender}</label>
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-900">BMI Score</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
              <input
                id="height"
                name="height"
                type="number"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.height}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                id="weight"
                name="weight"
                type="number"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.weight}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.age}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="bmi" className="block text-sm font-medium text-gray-700">BMI</label>
              <input
                id="bmi"
                name="bmi"
                type="number"
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.bmi}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">Blood Type</label>
              <input
                id="bloodType"
                name="bloodType"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.bloodType}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="goalWeight" className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
              <input
                id="goalWeight"
                name="goalWeight"
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.goalWeight}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-900">Emergency Contact Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700">Emergency Name</label>
              <input
                id="emergencyName"
                name="emergencyName"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.emergencyName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">Emergency Phone Number</label>
              <input
                id="emergencyPhone"
                name="emergencyPhone"
                type="tel"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.emergencyPhone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">Relationship</label>
              <input
                id="relationship"
                name="relationship"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.relationship}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-700">Medical Information</h3>
          <div>
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          <h3 className="text-lg font-medium text-gray-900">Membership Information</h3>
          <div>
            <label htmlFor="membershipType" className="block text-sm font-medium text-gray-700">Choose Membership Type</label>
            <select
              id="membershipType"
              name="membershipType"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.membershipType}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="monthly">Monthly Membership</option>
              <option value="annual">Annual Membership</option>
              <option value="day">Day Pass</option>
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Preferred Start Date</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Client Signature</label>
            <input
              id="signature"
              name="signature"
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.signature}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}