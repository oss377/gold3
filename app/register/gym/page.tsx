"use client";

import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { db, auth } from "../../fconfig";
import { createUserWithEmailAndPassword, onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useForm } from 'react-hook-form';
import { Loader2, Mail, User as UserIcon, Lock, Eye, EyeOff, ChevronLeft, ChevronRight, CheckCircle, Upload, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ThemeContext } from "../../../context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Cloudinary configuration
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'photoupload';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnqsoezfo';
const CLOUDINARY_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'photoss';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<{ global?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<FormData>({
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
      fields: ['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'address', 'city', 'country', 'jobType', 'gender', 'emergencyName', 'emergencyPhone', 'relationship'],
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
    if (!auth) {
      console.error('Firebase auth not initialized');
      setFormErrors({ global: 'Authentication service is not initialized.' });
      toast.error('Authentication service is not initialized.');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? user.uid : 'No user');
      setIsAuthenticated(!!user);
      setCurrentUser(user);
      if (user) {
        setValue('email', user.email || '');
        setValue('firstName', user.displayName?.split(' ')[0] || '');
        setValue('lastName', user.displayName?.split(' ')[1] || '');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setValue]);

  // Validate Cloudinary configuration
  useEffect(() => {
    console.log('Cloudinary Config Check:', {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      folder: CLOUDINARY_FOLDER,
    });
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error('Cloudinary configuration missing');
      setFormErrors({ global: 'Cloudinary configuration is missing. Please contact support.' });
      toast.error('Cloudinary configuration is missing.');
    }
  }, []);

  // Initialize and cleanup camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error('Unable to access camera. Please select an image instead.');
        setShowCamera(false);
      }
    };

    if (showCamera) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Photo input changed:', e.target.files);
    const file = e.target.files?.[0] || null;
    if (!file) {
      console.warn('No file selected');
      setPhotoPreview(null);
      setValue('photo', null, { shouldValidate: true });
      trigger('photo');
      toast.error('No photo selected.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isUnderSizeLimit = file.size <= 5 * 1024 * 1024; // 5MB limit
    if (!isImage) {
      console.warn(`Invalid file type for ${file.name}`);
      toast.error(`${file.name} is not a valid image file.`);
      setPhotoPreview(null);
      setValue('photo', null, { shouldValidate: true });
      trigger('photo');
      return;
    }
    if (!isUnderSizeLimit) {
      console.warn(`File size too large for ${file.name}`);
      toast.error(`${file.name} exceeds the 5MB size limit.`);
      setPhotoPreview(null);
      setValue('photo', null, { shouldValidate: true });
      trigger('photo');
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const newFileList = dataTransfer.files;

    setValue('photo', newFileList, { shouldValidate: true });
    trigger('photo');

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !fileInputRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          const newFileList = dataTransfer.files;

          if (fileInputRef.current) {
            fileInputRef.current.files = newFileList;
          }

          setValue('photo', newFileList, { shouldValidate: true });
          trigger('photo');

          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              setPhotoPreview(reader.result);
            }
          };
          reader.readAsDataURL(file);

          setShowCamera(false);
          toast.success('Photo captured successfully.');
        } else {
          toast.error('Failed to capture photo.');
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const uploadToCloudinary = async (file: File | null) => {
    if (!file) {
      console.error('No file provided for upload.');
      toast.error('No photo selected for upload.');
      return null;
    }
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
      formData.append('resource_type', 'image');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData, signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      setIsUploading(false);
      if (data.secure_url) {
        toast.success('Photo uploaded successfully.');
        return data.secure_url;
      } else {
        toast.error(`Failed to upload image: ${data.error?.message || 'Unknown error'}`);
        return null;
      }
    } catch (error: any) {
      setIsUploading(false);
      if (error.name === 'AbortError') {
        toast.error('Upload timeout.');
      } else {
        toast.error(`Failed to upload image: ${error.message}`);
      }
      return null;
    }
  };

  const completeRegistration = useCallback(async (user: User, formData: FormData) => {
    console.log('Starting completeRegistration with user:', user.uid);
    try {
      // Update user profile with display name
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      let photoURL = '';
      const photoFile = formData.photo?.[0];
      if (photoFile) {
        photoURL = await uploadToCloudinary(photoFile);
        if (!photoURL) throw new Error('Image upload failed.');
      } else {
        throw new Error('No photo provided.');
      }

      if (!db) {
        throw new Error('Firestore database not initialized.');
      }

      // Create user document in Firestore with user ID as document ID
      const userDocRef = doc(db, 'GYM', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        photoURL,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        jobType: formData.jobType,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        age: formData.age,
        bmi: formData.bmi,
        bloodType: formData.bloodType,
        goalWeight: formData.goalWeight,
        emergencyName: formData.emergencyName,
        emergencyPhone: formData.emergencyPhone,
        relationship: formData.relationship,
        medicalConditions: formData.medicalConditions,
        hasMedicalConditions: formData.hasMedicalConditions,
        membershipType: formData.membershipType,
        startDate: formData.startDate,
        signature: formData.signature,
        email: formData.email,
        role: formData.role,
        category: formData.category,
        payment: formData.payment,
        registrationDate: new Date().toISOString(),
      });

      console.log(`Firestore document created with ID: ${user.uid}`);
      sessionStorage.setItem('pendingUserId', user.uid);

      toast.success('Registration successful! Redirecting to payment...');
      setIsSubmitted(true);
      setTimeout(() => {
        setPhotoPreview(null);
        router.push('/payment');
      }, 3000);
    } catch (error: any) {
      console.error('Registration error:', error);
      setFormErrors({ global: `Registration failed: ${error.message || 'Unknown error'}` });
      toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }, [router]);

  const onSubmit = useCallback(async (data: FormData) => {
    console.log('onSubmit triggered with data:', data);
    setFormErrors({});

    if (!data.agreeTerms) {
      setFormErrors({ global: 'You must agree to the terms and conditions.' });
      toast.error('You must agree to the terms and conditions.');
      return;
    }

    if (!data.photo || data.photo.length === 0) {
      setFormErrors({ global: 'Please select or capture a photo.' });
      toast.error('Please select or capture a photo.');
      return;
    }

    if (!data.email || !data.password) {
      setFormErrors({ global: 'Email and password are required.' });
      toast.error('Email and password are required.');
      return;
    }

    try {
      if (!auth) {
        throw new Error('Auth not initialized.');
      }

      // Create user with email and password
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = credential.user;
      console.log(`User created with ID: ${user.uid}`);

      // Complete registration
      await completeRegistration(user, data);
    } catch (error: any) {
      console.error('Registration error:', error);
      let message = 'Registration failed.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please use a different email or log in.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use a stronger password (minimum 6 characters).';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Email/password accounts are not enabled. Please contact support.';
      }
      setFormErrors({ global: message });
      toast.error(message);
    }
  }, [completeRegistration]);

  const nextStep = async () => {
    const fieldsToValidate = steps[currentStep].fields;
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fill out all required fields correctly.');
    }
  };

  const prevStep = () => {
    console.log('Moving to previous step:', currentStep - 1);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  if (isLoading) {
    return (
      <div className={`${theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-900'} min-h-screen flex items-center justify-center`}>
        <Loader2 className="animate-spin h-8 w-8" /> Loading...
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className={`${theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-900'} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className={`${theme === 'light' ? 'text-zinc-800' : 'text-zinc-100'} text-lg`}>Registration successful!</p>
          <p className={`${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Redirecting to payment...</p>
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen flex items-center justify-center p-6 ${theme === "light" ? "bg-zinc-100" : "bg-zinc-900"}`}>
      <motion.div className={`w-full max-w-4xl rounded-2xl shadow-lg overflow-hidden ${theme === "light" ? "bg-gradient-to-br from-blue-50 to-purple-50" : "bg-gradient-to-br from-gray-800 to-gray-900"}`}>
        <div className="p-8">
          <h2 className={`text-3xl font-bold text-center ${theme === "light" ? "text-zinc-800" : "text-zinc-100"} mb-8`}>Create Your Gym Account</h2>

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
          {errors.photo && <p className={`text-center mb-6 p-3 rounded-md ${theme === 'light' ? 'bg-red-50 text-red-500' : 'bg-red-900/50 text-red-400'}`}>{errors.photo.message}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'address', 'city', 'country', 'jobType', 'gender', 'emergencyName', 'emergencyPhone', 'relationship'].map(field => (
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
                      ) : field === 'gender' ? (
                        <select
                          {...register('gender', { required: 'Gender is required.' })}
                          className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <input
                          {...register(field as keyof FormData, { required: true })}
                          type={field === 'email' ? 'email' : field === 'phoneNumber' || field === 'emergencyPhone' ? 'tel' : 'text'}
                          className={`mt-1 block w-full px-3 py-2 ${field === 'firstName' || field === 'lastName' || field === 'email' ? 'pl-10' : ''} border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                          placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        />
                      )}
                      {(field === 'firstName' || field === 'lastName') && <UserIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "light" ? "text-zinc-500" : "text-zinc-400"} w-5 h-5`} />}
                      {field === 'email' && <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "light" ? "text-zinc-500" : "text-zinc-400"} w-5 h-5`} />}
                    </div>
                    {errors[field as keyof FormData] && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors[field as keyof FormData]?.message || 'Required'}</p>}
                  </div>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Age</label>
                  <input {...register('age', { required: 'Age is required.' })} type="number" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                  {errors.age && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.age.message}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Height (cm)</label>
                  <input {...register('height', { required: 'Height is required.' })} type="number" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                  {errors.height && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.height.message}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Weight (kg)</label>
                  <input {...register('weight', { required: 'Weight is required.' })} type="number" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                  {errors.weight && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.weight.message}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>BMI</label>
                  <input {...register('bmi')} readOnly className={`mt-1 block w-full px-3 py-2 border rounded-lg ${theme === "light" ? "border-zinc-300 bg-gray-100" : "border-zinc-700 bg-gray-700"}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Blood Type</label>
                  <select {...register('bloodType', { required: 'Blood Type is required.' })} className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}>
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
                  {errors.bloodType && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.bloodType.message}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Goal Weight (kg)</label>
                  <input {...register('goalWeight', { required: 'Goal Weight is required.' })} type="number" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                  {errors.goalWeight && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.goalWeight.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Medical Conditions or Allergies</label>
                  <textarea {...register('medicalConditions')} className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} rows={3} />
                </div>
                <div className="flex items-center">
                  <input {...register('hasMedicalConditions')} type="checkbox" className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded`} />
                  <label className={`ml-2 text-sm ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Has Medical Conditions or Allergies</label>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Membership Type</label>
                  <select {...register('membershipType', { required: 'Membership Type is required.' })} className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}>
                    <option value="">Select Membership Type</option>
                    <option value="Monthly Membership">Monthly Membership</option>
                    <option value="Annual Membership">Annual Membership</option>
                    <option value="Day Pass">Day Pass</option>
                  </select>
                  {errors.membershipType && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.membershipType.message}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Preferred Start Date</label>
                  <input {...register('startDate', { required: 'Start Date is required.' })} type="date" className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`} />
                  {errors.startDate && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.startDate.message}</p>}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Photo (Required)</label>
                  <div className="flex gap-4">
                    <input
                      {...register('photo', {
                        required: 'AwriterA photo is required.',
                        validate: (files) => files && files.length > 0 ? true : 'A photo is required.'
                      })}
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className={`mt-1 block w-full px-4 py-2 rounded-lg border ${theme === "light" ? "bg-white border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" : "bg-gray-800 border-gray-700 text-gray-300 file:bg-gray-600 file:text-yellow-400 hover:file:bg-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"} transition-all duration-200`}
                      aria-label="Photo"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCamera(!showCamera)}
                      className={`mt-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${theme === "light" ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500" : "bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400"}`}
                    >
                      <Camera size={20} /> {showCamera ? 'Close Camera' : 'Take Photo'}
                    </button>
                  </div>
                  {showCamera && (
                    <div className="mt-4">
                      <video ref={videoRef} className="w-full max-w-md rounded-lg" autoPlay />
                      <canvas ref={canvasRef} className="hidden" />
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className={`mt-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${theme === "light" ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500" : "bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400"}`}
                      >
                        <Camera size={20} /> Capture
                      </button>
                    </div>
                  )}
                  {photoPreview && <img src={photoPreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />}
                  {isUploading && (
                    <p className={`text-sm flex items-center gap-2 ${theme === "light" ? "text-blue-500" : "text-yellow-400"}`}>
                      <Loader2 className="animate-spin h-5 w-5" /> Uploading...
                    </p>
                  )}
                  {errors.photo && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.photo.message}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Signature</label>
                  <input
                    {...register('signature', { required: 'Signature is required.' })}
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                    placeholder="Type your full name as signature"
                  />
                  {errors.signature && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.signature.message}</p>}
                </div>
                <div className="flex items-center">
                  <input
                    {...register('agreeTerms', { required: 'You must agree to the terms.' })}
                    type="checkbox"
                    className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded`}
                  />
                  <label className={`ml-2 text-sm ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>I agree to the terms and conditions</label>
                  {errors.agreeTerms && <p className={`text-xs mt-1 ${theme === "light" ? "text-red-500" : "text-red-400"}`}>{errors.agreeTerms.message}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded font-medium transition-colors duration-200 ${theme === "light" ? "bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-2 focus:ring-gray-500" : "bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400"} disabled:opacity-50`}
              >
                <ChevronLeft className="inline w-4 h-4 mr-1" /> Previous
              </button>
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={`px-4 py-2 rounded font-medium transition-colors duration-200 flex items-center gap-2 ${theme === "light" ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500" : "bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400"}`}
                >
                  Next <ChevronRight className="inline w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isUploading || showCamera}
                  className={`px-4 py-2 rounded font-medium transition-colors duration-200 flex items-center gap-2 ${theme === "light" ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500" : "bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400"} ${isUploading || showCamera ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={20} /> Register
                    </>
                  )}
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