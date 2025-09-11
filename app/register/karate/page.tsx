
"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { db, auth } from "../../fconfig";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { useForm } from 'react-hook-form';
import { Loader2, Mail, User, Lock, Eye, EyeOff, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ThemeContext } from "../../../context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'goldgold';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnqsoezfo';
const CLOUDINARY_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'videos';

// Types
interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  photo: FileList | null;
  address: string;
  city: string;
  country: string;
  jobType: string;
  gender: string;
  height: string;
  weight: string;
  age: string;
  bmi: string;
  bloodType: string;
  goalWeight: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  medicalConditions: string;
  hasMedicalConditions: boolean;
  membershipType: string;
  startDate: string;
  signature: string;
  email: string;
  password: string;
  role: string;
  category: string;
  payment: string;
  agreeTerms: boolean;
}

export default function GymRegisterForm() {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      photo: null,
      address: "",
      city: "",
      country: "",
      jobType: "",
      gender: "",
      height: "",
      weight: "",
      age: "",
      bmi: "",
      bloodType: "",
      goalWeight: "",
      emergencyName: "",
      emergencyPhone: "",
      relationship: "",
      medicalConditions: "",
      hasMedicalConditions: false,
      membershipType: "",
      startDate: "",
      signature: "",
      email: "",
      password: "",
      role: "user",
      category: "gym",
      payment: "not payed",
      agreeTerms: false,
    },
  });

  const steps = [
    {
      name: 'Personal Info',
      fields: ['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'address', 'city', 'country', 'jobType', 'emergencyName', 'emergencyPhone', 'relationship'],
    },
    {
      name: 'Health Info',
      fields: ['age', 'height', 'weight', 'bmi', 'bloodType', 'goalWeight', 'medicalConditions', 'hasMedicalConditions'],
    },
    {
      name: 'Membership',
      fields: ['membershipType', 'startDate'],
    },
    {
      name: 'Review',
      fields: ['photo', 'signature', 'agreeTerms'],
    },
  ];

  // Watch height and weight for BMI calculation
  const height = watch('height');
  const weight = watch('weight');

  useEffect(() => {
    if (height && weight && !isNaN(parseFloat(height)) && !isNaN(parseFloat(weight)) && parseFloat(height) > 0 && parseFloat(weight) > 0) {
      const heightInMeters = parseFloat(height) / 100;
      const weightInKg = parseFloat(weight);
      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
      setValue('bmi', bmi);
    } else {
      setValue('bmi', '');
    }
  }, [height, weight, setValue]);

  // Auth state listener
  useEffect(() => {
    if (!auth || !db) {
      setFormErrors({ global: 'Firebase services are not initialized.' });
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
    });

    return () => unsubscribe();
  }, [setValue]);

  const uploadToCloudinary = async (file: File) => {
    if (!file) return null;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit.');
      return null;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
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
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      setIsUploading(false);
      if (data.secure_url) {
        return data.secure_url;
      } else {
        toast.error('Failed to upload image.');
        return null;
      }
    } catch (error) {
      setIsUploading(false);
      toast.error(`Failed to upload image: ${error}`);
      return null;
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setValue('photo', { 0: file } as FileList);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const completeRegistration = useCallback(async (userId?: string) => {
    try {
      let photoURL = '';
      const photoFile = watch('photo')?.[0];
      if (photoFile) {
        photoURL = await uploadToCloudinary(photoFile);
        if (!photoURL) throw new Error('Image upload failed.');
      }

      const docRef = await addDoc(collection(db, 'GYM'), {
        uid: userId || currentUser?.uid,
        ...watch(),
        photoURL,
        photo: null,
        payment: 'not payed',
        registrationDate: new Date().toISOString(),
      });

      sessionStorage.setItem('pendingDocId', docRef.id);
      sessionStorage.setItem('pendingUserId', userId || currentUser?.uid || 'unknown');

      toast.success('Registration successful! Redirecting to payment...');
      setIsSubmitted(true);
      setTimeout(() => router.push('/payment'), 3000);
    } catch (error) {
      console.error('Firestore error:', error);
      setFormErrors({ global: 'Failed to save data.' });
      toast.error('Failed to save data.');
    }
  }, [watch, currentUser, router]);

  const onSubmit = useCallback(async (data: FormData) => {
    setFormErrors({});
    if (!db) {
      setFormErrors({ global: 'Database not initialized.' });
      return;
    }

    try {
      let userId = currentUser?.uid;
      if (!isAuthenticated) {
        if (!auth) throw new Error('Auth not initialized.');
        const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        userId = credential.user.uid;
      }

      await completeRegistration(userId);
    } catch (error: any) {
      let message = 'Registration failed.';
      if (error.code === 'auth/email-already-in-use') message = 'Email already in use.';
      else if (error.code === 'auth/weak-password') message = 'Weak password.';
      else if (error.code === 'auth/invalid-email') message = 'Invalid email.';
      setFormErrors({ global: message });
      toast.error(message);
    }
  }, [isAuthenticated, currentUser, completeRegistration]);

  const nextStep = () => {
    const currentFields = steps[currentStep].fields;
    const hasErrors = currentFields.some(field => errors[field]);
    if (!hasErrors) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fix errors before proceeding.');
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  if (isLoading) return <div className={`${theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-900'} min-h-screen flex items-center justify-center`}>Loading...</div>;
  if (isSubmitted) return <div className={`${theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-900'} min-h-screen flex items-center justify-center`}>Redirecting...</div>;

  return (
    <main className={`min-h-screen flex items-center justify-center p-6 ${theme === "light" ? "bg-zinc-100" : "bg-zinc-900"}`}>
      <motion.div className={`w-full max-w-4xl rounded-2xl shadow-lg overflow-hidden ${theme === "light" ? "bg-gradient-to-br from-blue-50 to-purple-50" : "bg-gradient-to-br from-gray-800 to-gray-900"}`}>
        <div className="p-8">
          <h2 className={`text-3xl font-bold text-center ${theme === "light" ? "text-zinc-800" : "text-zinc-100"} mb-8`}>Create Your Gym Account</h2>

          {/* Step Indicators */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.name} className="flex-1 text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${index <= currentStep ? (theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white') : (theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-gray-600 text-gray-300')}`}>
                  {index < currentStep ? <CheckCircle className="w-6 h-6" /> : index + 1}
                </div>
                <p className={`mt-2 text-sm font-medium ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>{step.name}</p>
              </div>
            ))}
          </div>

          {formErrors.global && <p className={`text-center mb-6 p-3 rounded-md ${theme === 'light' ? 'bg-red-50 text-red-500' : 'bg-red-900/50 text-red-400'}`}>{formErrors.global}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'address', 'city', 'country', 'jobType', 'emergencyName', 'emergencyPhone', 'relationship'].map(field => (
                  <div key={field}>
                    <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                    <div className="relative">
                      {field === 'password' ? (
                        <>
                          <input
                            {...register('password', { required: !isAuthenticated })}
                            type={showPassword ? 'text' : 'password'}
                            className={`mt-1 block w-full px-3 py-2 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                          />
                          <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "light" ? "text-zinc-500" : "text-zinc-400"} w-5 h-5`} />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute inset-y-0 right-3 flex items-center hover:bg-gray-200/50 rounded-full p-1 transition-colors ${theme === "light" ? "text-zinc-500" : "text-zinc-400"}`}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </>
                      ) : (
                        <input
                          {...register(field as keyof FormData, { required: true })}
                          type={field === 'email' ? 'email' : field === 'phoneNumber' || field === 'emergencyPhone' ? 'tel' : 'text'}
                          className={`mt-1 block w-full px-3 py-2 ${field === 'firstName' || field === 'lastName' || field === 'email' ? 'pl-10' : ''} border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                          placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        />
                      )}
                      {(field === 'firstName' || field === 'lastName') && <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "light" ? "text-zinc-500" : "text-zinc-400"} w-5 h-5`} />}
                      {field === 'email' && <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "light" ? "text-zinc-500" : "text-zinc-400"} w-5 h-5`} />}
                    </div>
                    {errors[field] && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>Required</p>}
                  </div>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Age</label>
                  <input {...register('age', { required: true })} type="number" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Height (cm)</label>
                  <input {...register('height', { required: true })} type="number" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Weight (kg)</label>
                  <input {...register('weight', { required: true })} type="number" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>BMI</label>
                  <input {...register('bmi')} readOnly className={`mt-1 block w-full px-3 py-2 border rounded-lg ${theme === "light" ? "border-zinc-300 bg-gray-100" : "border-zinc-700 bg-gray-700"}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Blood Type</label>
                  <select {...register('bloodType', { required: true })} className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}>
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Goal Weight (kg)</label>
                  <input {...register('goalWeight', { required: true })} type="number" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Medical Conditions</label>
                  <textarea {...register('medicalConditions')} className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} rows={3} />
                </div>
                <div className="flex items-center">
                  <input {...register('hasMedicalConditions')} type="checkbox" className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded`} />
                  <label className={`ml-2 text-sm ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Has Medical Conditions</label>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Membership Type</label>
                  <select {...register('membershipType', { required: true })} className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}>
                    <option value="">Select</option>
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Start Date</label>
                  <input {...register('startDate', { required: true })} type="date" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Photo</label>
                  <input {...register('photo')} type="file" accept="image/*" onChange={handlePhotoChange} className={`mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`} />
                  {photoPreview && <img src={photoPreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />}
                  {isUploading && <p className={`text-sm ${theme === "light" ? "text-blue-500" : "text-yellow-400"}`}>Uploading...</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Signature</label>
                  <input {...register('signature', { required: true })} type="text" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} placeholder="Type your full name as signature" />
                </div>
                <div className="flex items-center">
                  <input {...register('agreeTerms', { required: true })} type="checkbox" className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded`} />
                  <label className={`ml-2 text-sm ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>I agree to the terms and conditions</label>
                </div>
                {errors.agreeTerms && <p className={`text-xs ${theme === "light" ? "text-red-500" : "text-red-400"}`}>Required</p>}
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button type="button" onClick={prevStep} disabled={currentStep === 0} className={`px-4 py-2 rounded ${theme === "light" ? "bg-gray-300 text-gray-700" : "bg-gray-700 text-white"} disabled:opacity-50`}>
                <ChevronLeft className="inline w-4 h-4 mr-1" /> Previous
              </button>
              {currentStep < steps.length - 1 ? (
                <button type="button" onClick={nextStep} className={`px-4 py-2 rounded ${theme === "light" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}>
                  Next <ChevronRight className="inline w-4 h-4 ml-1" />
                </button>
              ) : (
                <button type="submit" disabled={isUploading} className={`px-4 py-2 rounded ${isUploading ? "opacity-50" : theme === "light" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}>
                  {isUploading ? 'Uploading...' : 'Register'}
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="mt-6 text-center">
          <p className={`text-sm ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>
            Already have an account?{" "}
            <Link href="/login" className={`underline ${theme === "light" ? "text-blue-600" : "text-blue-400"} hover:text-blue-500`}>
              Log In
            </Link>
          </p>
        </div>
        <ToastContainer position="top-center" autoClose={3000} theme={theme} />
      </motion.div>
    </main>
  );
}
