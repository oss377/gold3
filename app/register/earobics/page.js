
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Listbox } from '@headlessui/react';

export default function RegistrationForm() {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [membershipType, setMembershipType] = useState('Basic');
  const [exerciseDays, setExerciseDays] = useState([]);
  const [exerciseTime, setExerciseTime] = useState('Mornings');
  const [startMonth, setStartMonth] = useState('September');

  const membershipOptions = ['Basic', 'Premium', 'Pro'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['Early Mornings', 'Mornings', 'Early Afternoons', 'Afternoons', 'Evenings'];
  const months = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
  const reasons = ['Stress', 'Depression', 'Boredom', 'Happiness', 'Habit', 'Annoyance'];
  const goals = ['Development of muscles', 'Reducing the stress', 'Losing body fat', 'Increasing the motivation', 'Training for an event/specific sport', 'Other'];

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, membershipType, exerciseDays, exerciseTime, startMonth }),
      });
      if (response.ok) {
        toast.success('Registration successful!');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center">Aerobics Fitness Registration</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Birth Date</label>
              <input
                type="date"
                {...register('birthDate', { required: 'Birth date is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.birthDate && <p className="text-red-500 text-xs">{errors.birthDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                {...register('streetAddress', { required: 'Street address is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.streetAddress && <p className="text-red-500 text-xs">{errors.streetAddress.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address 2</label>
              <input
                {...register('streetAddress2')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                {...register('city', { required: 'City is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State/Province</label>
              <input
                {...register('state', { required: 'State is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zip Code</label>
              <input
                {...register('zipCode', { required: 'Zip code is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.zipCode && <p className="text-red-500 text-xs">{errors.zipCode.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                {...register('phoneNumber', { required: 'Phone number is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber.message}</p>}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
              <input
                {...register('emergencyName', { required: 'Emergency contact name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.emergencyName && <p className="text-red-500 text-xs">{errors.emergencyName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
              <input
                type="tel"
                {...register('emergencyPhone', { required: 'Emergency phone is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.emergencyPhone && <p className="text-red-500 text-xs">{errors.emergencyPhone.message}</p>}
            </div>
          </div>

          {/* BMI and Health */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
              <input
                type="number"
                {...register('height', { required: 'Height is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.height && <p className="text-red-500 text-xs">{errors.height.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                {...register('weight', { required: 'Weight is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.weight && <p className="text-red-500 text-xs">{errors.weight.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Goal Weight (kg)</label>
              <input
                type="number"
                {...register('goalWeight')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Type</label>
              <input
                {...register('bloodType')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Health Issues</label>
              <textarea
                {...register('healthIssues')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medications</label>
              <textarea
                {...register('medications')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Health & Lifestyle */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Health & Lifestyle</h3>
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
                <input type="checkbox" {...register(q.name)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              </div>
            ))}
          </div>

          {/* Frequency Questions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Night Eating Frequency (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                {...register('nightEating', { required: 'Required', min: 0, max: 5 })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.nightEating && <p className="text-red-500 text-xs">{errors.nightEating.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Breakfast Frequency (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                {...register('breakfastFrequency', { required: 'Required', min: 0, max: 5 })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.breakfastFrequency && <p className="text-red-500 text-xs">{errors.breakfastFrequency.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nutrition Rating (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                {...register('nutritionRating', { required: 'Required', min: 0, max: 5 })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.nutritionRating && <p className="text-red-500 text-xs">{errors.nutritionRating.message}</p>}
            </div>
          </div>

          {/* Exercise Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Exercise Days</label>
            <div className="flex flex-wrap gap-4">
              {days.map((day) => (
                <div key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    value={day}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExerciseDays([...exerciseDays, day]);
                      } else {
                        setExerciseDays(exerciseDays.filter((d) => d !== day));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{day}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Exercise Time</label>
            <Listbox value={exerciseTime} onChange={setExerciseTime}>
              <Listbox.Button className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-left">
                {exerciseTime}
              </Listbox.Button>
              <Listbox.Options className="mt-1 bg-white border rounded-md shadow-lg">
                {times.map((time) => (
                  <Listbox.Option key={time} value={time} className="p-2 hover:bg-indigo-100 cursor-pointer">
                    {time}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Listbox>
          </div>

          {/* Training Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Training Goals</label>
            <div className="flex flex-wrap gap-4">
              {goals.map((goal) => (
                <div key={goal} className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('trainingGoals')}
                    value={goal}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{goal}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Eating Reasons */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Reasons for Eating (Besides Hunger)</label>
            <div className="flex flex-wrap gap-4">
              {reasons.map((reason) => (
                <div key={reason} className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('eatingReasons')}
                    value={reason}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{reason}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Membership and Duration */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Membership Type</label>
              <Listbox value={membershipType} onChange={setMembershipType}>
                <Listbox.Button className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-left">
                  {membershipType}
                </Listbox.Button>
                <Listbox.Options className="mt-1 bg-white border rounded-md shadow-lg">
                  {membershipOptions.map((option) => (
                    <Listbox.Option key={option} value={option} className="p-2 hover:bg-indigo-100 cursor-pointer">
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
                {...register('exerciseDuration', { required: 'Required', min: 1, max: 12 })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.exerciseDuration && <p className="text-red-500 text-xs">{errors.exerciseDuration.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Month</label>
              <Listbox
                value={startMonth}
                onChange={(value) => {
                  setStartMonth(value);
                  setValue('startMonth', value); // Sync with react-hook-form
                }}
              >
                <Listbox.Button className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white text-left">
                  {startMonth}
                </Listbox.Button>
                <Listbox.Options className="mt-1 bg-white border rounded-md shadow-lg">
                  {months.map((month) => (
                    <Listbox.Option key={month} value={month} className="p-2 hover:bg-indigo-100 cursor-pointer">
                      {month}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>
          </div>

          {/* Signature and Submit */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Signature</label>
            <input
              {...register('signature', { required: 'Signature is required' })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Type your full name as signature"
            />
            {errors.signature && <p className="text-red-500 text-xs">{errors.signature.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
}
