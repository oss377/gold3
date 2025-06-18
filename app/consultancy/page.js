"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Head from 'next/head';



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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to terms';
    if (formData.height && isNaN(formData.height)) newErrors.height = 'Height must be a number';
    if (formData.weight && isNaN(formData.weight)) newErrors.weight = 'Weight must be a number';
    if (formData.age && isNaN(formData.age)) newErrors.age = 'Age must be a number';
    if (formData.goalWeight && isNaN(formData.goalWeight)) newErrors.goalWeight = 'Goal weight must be a number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUploading(true);
    let photoUrl = '';

    try {
      // Upload photo to Firebase Storage
      if (formData.photo) {
        const photoRef = ref(storage, `photos/${formData.email}_${formData.photo.name}`);
        await uploadBytes(photoRef, formData.photo);
        photoUrl = await getDownloadURL(photoRef);
      }

      // Prepare form data for API
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'photo') return; // Skip photo as it's uploaded separately
        if (key === 'preferredTrainingTime') {
          formDataToSend.append(key, formData[key].join(',')); // Convert array to string
        } else if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });
      formDataToSend.append('photoUrl', photoUrl);
      if (!formData.bmi) calculateBMI();
      formDataToSend.append('bmi', formData.bmi);

      // Send form data to API route
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      router.push('/success');
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ submit: error.message || 'Failed to submit form. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Personal Training Consultation Form</title>
      </Head>
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Personal Training Consultation Form</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Photo Upload</label>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handleChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Type</label>
                <input
                  type="text"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Health Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <div className="mt-2 flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Male</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Female</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={formData.gender === 'other'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Other</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  onBlur={calculateBMI}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.height && <p className="text-red-500 text-xs">{errors.height}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  onBlur={calculateBMI}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.weight && <p className="text-red-500 text-xs">{errors.weight}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.age && <p className="text-red-500 text-xs">{errors.age}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">BMI</label>
                <input
                  type="text"
                  name="bmi"
                  value={formData.bmi}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                <input
                  type="text"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
                <input
                  type="number"
                  name="goalWeight"
                  value={formData.goalWeight}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.goalWeight && <p className="text-red-500 text-xs">{errors.goalWeight}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship Status</label>
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current/Previous Health Issues</label>
              <textarea
                name="healthIssues"
                value={formData.healthIssues}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medications</label>
              <textarea
                name="medications"
                value={formData.medications}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="4"
              />
            </div>

            {/* Lifestyle Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Work Schedule</label>
              <select
                name="workSchedule"
                value={formData.workSchedule}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select...</option>
                <option value="days">Days</option>
                <option value="afternoon">Afternoon</option>
                <option value="nights">Nights</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Travel Frequency</label>
              <div className="mt-2 flex flex-col space-y-2">
                {['Rarely', 'A few times a year', 'A few times a month', 'Weekly'].map((freq) => (
                  <label key={freq} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="travelFrequency"
                      value={freq.toLowerCase()}
                      checked={formData.travelFrequency === freq.toLowerCase()}
                      onChange={handleChange}
                      className="form-radio"
                    />
                    <span className="ml-2">{freq}</span>
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medical Conditions (Diabetes, Asthma, Blood Pressure)</label>
              <div className="mt-2 flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="medicalConditions"
                    value="yes"
                    checked={formData.medicalConditions === 'yes'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="medicalConditions"
                    value="no"
                    checked={formData.medicalConditions === 'no'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
              {formData.medicalConditions === 'yes' && (
                <textarea
                  name="medicalConditionsDetails"
                  value={formData.medicalConditionsDetails}
                  onChange={handleChange}
                  className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select...</option>
                <option value="low-fat">Low-fat</option>
                <option value="low-carb">Low-carb</option>
                <option value="high-protein">High-protein</option>
                <option value="vegetarian-vegan">Vegetarian/Vegan</option>
                <option value="no-special-diet">No special diet</option>
              </select>
            </div>

            {/* Training Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Training Goal</label>
              <textarea
                name="trainingGoal"
                value={formData.trainingGoal}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Why This Goal?</label>
              <textarea
                name="goalReason"
                value={formData.goalReason}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="4"
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
                      className="form-radio"
                    />
                    <span className="ml-2">{time}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Previous Training with Personal Trainer</label>
              <div className="mt-2 flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="previousTraining"
                    value="yes"
                    checked={formData.previousTraining === 'yes'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="previousTraining"
                    value="no"
                    checked={formData.previousTraining === 'no'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
              {formData.previousTraining === 'yes' && (
                <textarea
                  name="trainingType"
                  value={formData.trainingType}
                  onChange={handleChange}
                  className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="form-checkbox"
                    />
                    <span className="ml-2">{time}</span>
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="4"
              />
            </div>

            {/* Terms and Signature */}
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <span className="ml-2">I agree to the terms & conditions</span>
              </label>
              {errors.agreeTerms && <p className="text-red-500 text-xs">{errors.agreeTerms}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Start Date</label>
              <input
                type="date"
                name="preferredStartDate"
                value={formData.preferredStartDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Signature</label>
              <input
                type="text"
                name="signature"
                value={formData.signature}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Type your full name as signature"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={uploading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Submitting...' : 'Submit'}
              </button>
              {errors.submit && <p className="text-red-500 text-xs mt-2">{errors.submit}</p>}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}