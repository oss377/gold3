"use client";

import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { db, auth } from "../../fconfig";
import { createUserWithEmailAndPassword, onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore";
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
  birthDate: string;
  email: string;
  password: string;
  streetAddress: string;
  streetAddress2: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  height: string;
  weight: string;
  bmi: string;
  bloodType: string;
  goalWeight: string;
  healthIssues: string;
  medications: string;
  smoke: boolean;
  surgery: boolean;
  alcohol: boolean;
  supplements: boolean;
  foodTracking: boolean;
  proSport: boolean;
  exercisePain: boolean;
  nightEating: string;
  breakfastFrequency: string;
  nutritionRating: string;
  exerciseDays: string[];
  exerciseTime: string;
  trainingGoals: string[];
  eatingReasons: string[];
  membershipType: string;
  exerciseDuration: string;
  exerciseMonths: string;
  startMonth: string;
  photos: FileList | null;
  signature: string;
  role: string;
  category: string;
  payment: string;
  agreeTerms: boolean;
  age: string;
  jobType: string;
}

export default function RegisterForm() {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "uploading";
    message: string;
    progress?: number;
    fileName?: string;
  } | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ url: string; fileName: string }[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<{ global?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, reset, trigger, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      email: '',
      password: '',
      streetAddress: '',
      streetAddress2: '',
      city: '',
      state: '',
      zipCode: '',
      phoneNumber: '',
      emergencyName: '',
      emergencyPhone: '',
      height: '',
      weight: '',
      bmi: '',
      bloodType: '',
      goalWeight: '',
      healthIssues: '',
      medications: '',
      smoke: false,
      surgery: false,
      alcohol: false,
      supplements: false,
      foodTracking: false,
      proSport: false,
      exercisePain: false,
      nightEating: '',
      breakfastFrequency: '',
      nutritionRating: '',
      exerciseDays: [],
      exerciseTime: '',
      trainingGoals: [],
      eatingReasons: [],
      membershipType: '',
      exerciseDuration: '',
      exerciseMonths: '',
      startMonth: '',
      photos: null,
      signature: '',
      role: "user",
      category: "aerobics",
      payment: "not paid",
      agreeTerms: false,
      age: '',
      jobType: '',
    },
  });

  const steps = [
    {
      name: 'Personal Info',
      fields: ['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'streetAddress', 'streetAddress2', 'city', 'state', 'zipCode', 'emergencyName', 'emergencyPhone', 'age', 'jobType'],
    },
    {
      name: 'Health Info',
      fields: ['birthDate', 'height', 'weight', 'bmi', 'bloodType', 'goalWeight', 'healthIssues', 'medications', 'smoke', 'surgery', 'alcohol'],
    },
    {
      name: 'Lifestyle',
      fields: ['supplements', 'foodTracking', 'proSport', 'exercisePain', 'nightEating', 'breakfastFrequency', 'nutritionRating', 'exerciseDays', 'exerciseTime'],
    },
    {
      name: 'Training Goals',
      fields: ['trainingGoals', 'eatingReasons', 'membershipType', 'exerciseDuration', 'exerciseMonths', 'startMonth'],
    },
    {
      name: 'Review',
      fields: ['photos', 'signature', 'agreeTerms'],
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
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.warn('No files selected');
      setPhotoPreviews([]);
      setValue('photos', null, { shouldValidate: true });
      trigger('photos');
      toast.error('No photos selected.');
      return;
    }

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnderSizeLimit = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isImage) {
        console.warn(`Invalid file type for ${file.name}`);
        toast.error(`${file.name} is not a valid image file.`);
        return false;
      }
      if (!isUnderSizeLimit) {
        console.warn(`File size too large for ${file.name}`);
        toast.error(`${file.name} exceeds the 10MB size limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setPhotoPreviews([]);
      setValue('photos', null, { shouldValidate: true });
      trigger('photos');
      toast.error('No valid photos selected.');
      return;
    }

    const previews: string[] = [];
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          previews.push(reader.result);
          if (previews.length === validFiles.length) {
            setPhotoPreviews(previews);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    const dataTransfer = new DataTransfer();
    validFiles.forEach(file => dataTransfer.items.add(file));
    const newFileList = dataTransfer.files;

    setValue('photos', newFileList, { shouldValidate: true });
    trigger('photos');
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
          
          setValue('photos', newFileList, { shouldValidate: true });
          trigger('photos');

          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              setPhotoPreviews([reader.result]);
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

  const uploadToCloudinary = async (data: FormData) => {
    console.log('uploadToCloudinary called with data:', data);
    const files = Array.from(data.photos || []);
    if (files.length === 0) {
      console.error('No photos selected for upload.');
      throw new Error('At least one photo is required.');
    }

    setUploadStatus({ type: 'uploading', message: 'Starting photo upload...', progress: 0 });
    const newUploadedPhotos: { url: string; fileName: string }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          setUploadStatus({
            type: 'error',
            message: `${file.name} is not a valid image file.`,
            fileName: file.name,
          });
          toast.error(`${file.name} is not a valid image file.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setUploadStatus({
            type: 'error',
            message: `${file.name} exceeds the 10MB size limit.`,
            fileName: file.name,
          });
          toast.error(`${file.name} exceeds the 10MB size limit.`);
          continue;
        }

        console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        setUploadStatus({
          type: 'uploading',
          message: `Uploading ${file.name} (${i + 1} of ${files.length})`,
          progress: (i / files.length) * 100,
          fileName: file.name,
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', CLOUDINARY_FOLDER);
        formData.append('resource_type', 'image');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: 'POST',
              body: formData,
              signal: controller.signal
            }
          );
          clearTimeout(timeoutId);
          const result = await response.json();
          console.log(`Cloudinary response for ${file.name}:`, result);

          if (!response.ok) {
            setUploadStatus({
              type: 'error',
              message: `Failed to upload ${file.name}: ${result.error?.message || 'Upload failed'}`,
              fileName: file.name

            });
            toast.error(`Failed to upload ${file.name}: ${result.error?.message || 'Upload failed'}`);
            continue;
          }

          newUploadedPhotos.push({ url: result.secure_url, fileName: file.name });
          setUploadedPhotos((prev) => [...prev, { url: result.secure_url, fileName: file.name }]);
          setUploadStatus({
            type: 'uploading',
            message: `Uploaded ${file.name} (${i + 1} of ${files.length})`,
            progress: ((i + 1) / files.length) * 100,
            fileName: file.name,
          });
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            setUploadStatus({
              type: 'error',
              message: `Upload timeout for ${file.name}`,
              fileName: file.name,
            });
            toast.error(`Upload timeout for ${file.name}`);
          } else {
            setUploadStatus({
              type: 'error',
              message: `Network error uploading ${file.name}: ${fetchError.message}`,
              fileName: file.name,
            });
            toast.error(`Network error uploading ${file.name}: ${fetchError.message}`);
          }
          continue;
        }
      }

      if (newUploadedPhotos.length === 0) {
        throw new Error('No photos were uploaded successfully.');
      }

      setUploadStatus({
        type: 'success',
        message: `${newUploadedPhotos.length} of ${files.length} photos uploaded successfully.`
      });
      toast.success(`${newUploadedPhotos.length} of ${files.length} photos uploaded successfully.`);
      return newUploadedPhotos.map((photo) => photo.url);
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = `Upload error: ${error.message || 'Failed to upload photos'}`;
      setUploadStatus({
        type: 'error',
        message: errorMessage,
      });
      toast.error(errorMessage);
      throw error;
    } finally {
      if (newUploadedPhotos.length !== files.length) {
        setUploadStatus(null);
      }
    }
  };

  const completeRegistration = useCallback(async (user: User, formData: FormData) => {
    console.log('Starting completeRegistration with user:', user.uid);
    try {
      // Update user profile with display name
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      const photoURLs = await uploadToCloudinary(formData);

      if (!db) {
        throw new Error('Firestore database not initialized.');
      }

      // Create user document in Firestore with user ID as document ID
      const userDocRef = doc(db, 'GYM', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        streetAddress: formData.streetAddress,
        streetAddress2: formData.streetAddress2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phoneNumber: formData.phoneNumber,
        emergencyName: formData.emergencyName,
        emergencyPhone: formData.emergencyPhone,
        height: formData.height,
        weight: formData.weight,
        bmi: formData.bmi,
        bloodType: formData.bloodType,
        goalWeight: formData.goalWeight,
        healthIssues: formData.healthIssues,
        medications: formData.medications,
        smoke: formData.smoke,
        surgery: formData.surgery,
        alcohol: formData.alcohol,
        supplements: formData.supplements,
        foodTracking: formData.foodTracking,
        proSport: formData.proSport,
        exercisePain: formData.exercisePain,
        nightEating: formData.nightEating,
        breakfastFrequency: formData.breakfastFrequency,
        nutritionRating: formData.nutritionRating,
        exerciseDays: formData.exerciseDays,
        exerciseTime: formData.exerciseTime,
        trainingGoals: formData.trainingGoals,
        eatingReasons: formData.eatingReasons,
        membershipType: formData.membershipType,
        exerciseDuration: formData.exerciseDuration,
        exerciseMonths: formData.exerciseMonths,
        startMonth: formData.startMonth,
        photoURLs,
        signature: formData.signature,
        role: formData.role,
        category: formData.category,
        payment: formData.payment,
        registrationDate: new Date().toISOString(),
        age: formData.age,
        jobType: formData.jobType,
      });

      console.log(`Firestore document created with ID: ${user.uid}`);
      sessionStorage.setItem('pendingUserId', user.uid);

      toast.success('Registration successful! Redirecting to payment...');
      setIsSubmitted(true);
      setTimeout(() => {
        reset();
        setUploadedPhotos([]);
        setPhotoPreviews([]);
        setUploadStatus(null);
        router.push('/payment');
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      setFormErrors({ global: `Registration failed: ${error.message || 'Unknown error'}` });
      toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }, [router, reset]);

  const onSubmit = useCallback(async (data: FormData) => {
    console.log('onSubmit triggered with data:', data);
    setFormErrors({});

    if (!data.agreeTerms) {
      setFormErrors({ global: 'You must agree to the terms and conditions.' });
      toast.error('You must agree to the terms and conditions.');
      return;
    }

    if (!data.photos || data.photos.length === 0) {
      console.error('No photos selected');
      setFormErrors({ global: 'At least one photo is required.' });
      toast.error('Please select at least one photo.');
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

  const handleReset = () => {
    reset();
    setUploadedPhotos([]);
    setPhotoPreviews([]);
    setUploadStatus(null);
    setCurrentStep(0);
    toast.info('Form has been reset.');
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
          <h2 className={`text-3xl font-bold text-center ${theme === "light" ? "text-zinc-800" : "text-zinc-100"} mb-8`}>Create Your Aerobics Account</h2>

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

          {formErrors.global && (
            <p className={`text-center mb-6 p-3 rounded-md ${theme === 'light' ? 'bg-red-50 text-red-500' : 'bg-red-900/50 text-red-400'}`}>
              {formErrors.global}
            </p>
          )}
          {errors.photos && (
            <p className={`text-center mb-6 p-3 rounded-md ${theme === 'light' ? 'bg-red-50 text-red-500' : 'bg-red-900/50 text-red-400'}`}>
              {errors.photos.message}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'streetAddress', 'streetAddress2', 'city', 'state', 'zipCode', 'emergencyName', 'emergencyPhone', 'age', 'jobType'].map(field => (
                  <div key={field}>
                    <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      {(field === 'firstName' || field === 'lastName' || field === 'email' || field === 'password') && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      {field === 'password' ? (
                        <>
                          <input
                            {...register('password', {
                              required: 'Password is required',
                              minLength: { value: 6, message: 'Password must be at least 6 characters' }
                            })}
                            type={showPassword ? 'text' : 'password'}
                            className={`mt-1 block w-full px-3 py-2 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"} ${errors.password ? 'border-red-500' : ''}`}
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
                          {...register(field as keyof FormData, {
                            required: field === 'firstName' || field === 'lastName' || field === 'email' ? `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required` : false,
                            pattern: field === 'email' ? {
                              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                              message: 'Invalid email format'
                            } : undefined
                          })}
                          type={field === 'email' ? 'email' : field === 'phoneNumber' || field === 'emergencyPhone' ? 'tel' : field === 'age' ? 'number' : 'text'}
                          className={`mt-1 block w-full px-3 py-2 ${field === 'firstName' || field === 'lastName' || field === 'email' ? 'pl-10' : ''} border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"} ${errors[field as keyof FormData] ? 'border-red-500' : ''}`}
                          placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        />
                      )}
                      {(field === 'firstName' || field === 'lastName') && (
                        <UserIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "light" ? "text-zinc-500" : "text-zinc-400"} w-5 h-5`} />
                      )}
                      {field === 'email' && (
                        <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "light" ? "text-zinc-500" : "text-zinc-400"} w-5 h-5`} />
                      )}
                    </div>
                    {errors[field as keyof FormData] && (
                      <p className="text-red-500 text-xs mt-1">{errors[field as keyof FormData]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Birth Date <span className="text-red-500">*</span></label>
                  <input
                    {...register('birthDate', { required: 'Birth date is required' })}
                    type="date"
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"} ${errors.birthDate ? 'border-red-500' : ''}`}
                  />
                  {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>}
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Height (cm) <span className="text-red-500">*</span></label>
                  <input
                    {...register('height', { required: 'Height is required' })}
                    type="number"
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"} ${errors.height ? 'border-red-500' : ''}`}
                  />
                  {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height.message}</p>}
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Weight (kg) <span className="text-red-500">*</span></label>
                  <input
                    {...register('weight', { required: 'Weight is required' })}
                    type="number"
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"} ${errors.weight ? 'border-red-500' : ''}`}
                  />
                  {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>}
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>BMI</label>
                  <input
                    {...register('bmi')}
                    readOnly
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg ${theme === "light" ? "border-zinc-300 bg-gray-100" : "border-zinc-700 bg-gray-700"}`}
                  />
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Blood Type</label>
                  <select
                    {...register('bloodType')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                  >
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
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Goal Weight (kg)</label>
                  <input
                    {...register('goalWeight')}
                    type="number"
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Health Issues</label>
                  <textarea
                    {...register('healthIssues')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Medications</label>
                  <textarea
                    {...register('medications')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                    rows={3}
                  />
                </div>
                {['smoke', 'surgery', 'alcohol'].map(field => (
                  <div key={field} className="flex items-center">
                    <input
                      {...register(field as keyof FormData)}
                      type="checkbox"
                      className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded`}
                    />
                    <label className={`${theme === "light" ? "text-gray-700" : "text-gray-300"} ml-2 text-sm`}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['supplements', 'foodTracking', 'proSport', 'exercisePain'].map(field => (
                  <div key={field} className="flex items-center">
                    <input
                      {...register(field as keyof FormData)}
                      type="checkbox"
                      className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded`}
                    />
                    <label className={`${theme === "light" ? "text-gray-700" : "text-gray-300"} ml-2 text-sm`}>
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                  </div>
                ))}
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Night Eating</label>
                  <select
                    {...register('nightEating')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                  >
                    <option value="">Select</option>
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Breakfast Frequency</label>
                  <select
                    {...register('breakfastFrequency')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                  >
                    <option value="">Select</option>
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Nutrition Rating</label>
                  <select
                    {...register('nutritionRating')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                  >
                    <option value="">Select</option>
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Exercise Days</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div key={day} className="flex items-center">
                        <input
                          {...register('exerciseDays')}
                          type="checkbox"
                          value={day}
                          className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded`}
                        />
                        <label className={`${theme === "light" ? "text-gray-700" : "text-gray-300"} ml-2 text-sm`}>{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Best Time to Exercise</label>
                  <select
                    {...register('exerciseTime')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                  >
                    <option value="">Select</option>
                    <option value="Early Mornings">Early Mornings</option>
                    <option value="Mornings">Mornings</option>
                    <option value="Early Afternoons">Early Afternoons</option>
                    <option value="Afternoons">Afternoons</option>
                    <option value="Evenings">Evenings</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Training Goals (select all that apply) <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Development of muscles', 'Reducing the stress', 'Losing body fat', 'Increasing the motivation', 'Training for an event/specific sport', 'Other'].map(goal => (
                      <div key={goal} className="flex items-center">
                        <input
                          {...register('trainingGoals', { required: 'At least one training goal is required' })}
                          type="checkbox"
                          value={goal}
                          className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded ${errors.trainingGoals ? 'border-red-500' : ''}`}
                        />
                        <label className={`${theme === "light" ? "text-gray-700" : "text-gray-300"} ml-2 text-sm`}>{goal}</label>
                      </div>
                    ))}
                  </div>
                  {errors.trainingGoals && <p className="text-red-500 text-xs mt-1">{errors.trainingGoals.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Reasons for Eating (select all that apply)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Stress', 'Depression', 'Boredom', 'Happiness', 'Habit', 'Annoyance'].map(reason => (
                      <div key={reason} className="flex items-center">
                        <input
                          {...register('eatingReasons')}
                          type="checkbox"
                          value={reason}
                          className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded`}
                        />
                        <label className={`${theme === "light" ? "text-gray-700" : "text-gray-300"} ml-2 text-sm`}>{reason}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Membership Type <span className="text-red-500">*</span></label>
                  <select
                    {...register('membershipType', { required: 'Membership type is required' })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"} ${errors.membershipType ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select</option>
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                  {errors.membershipType && <p className="text-red-500 text-xs mt-1">{errors.membershipType.message}</p>}
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Exercise Duration</label>
                  <input
                    {...register('exerciseDuration')}
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                  />
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Exercise Months</label>
                  <select
                    {...register('exerciseMonths')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"}`}
                  >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Start Month <span className="text-red-500">*</span></label>
                  <input
                    {...register('startMonth', { required: 'Start month is required' })}
                    type="month"
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"} ${errors.startMonth ? 'border-red-500' : ''}`}
                  />
                  {errors.startMonth && <p className="text-red-500 text-xs mt-1">{errors.startMonth.message}</p>}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Photos (Required) <span className="text-red-500">*</span></label>
                  <div className="flex gap-4">
                    <input
                      {...register('photos', {
                        required: 'At least one photo is required.',
                        validate: (files) => files && files.length > 0 ? true : 'At least one photo is required.'
                      })}
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className={`mt-1 block w-full px-4 py-2 rounded-lg border ${theme === "light" ? "bg-white border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" : "bg-gray-800 border-gray-700 text-gray-300 file:bg-gray-600 file:text-yellow-400 hover:file:bg-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"} transition-all duration-200`}
                      aria-label="Photos"
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
                  {photoPreviews.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {photoPreviews.map((preview, index) => (
                        <img key={index} src={preview} alt={`Preview ${index + 1}`} className="w-24 h-24 object-cover rounded" />
                      ))}
                    </div>
                  )}
                  {errors.photos && <p className="text-red-500 text-xs mt-1">{errors.photos.message}</p>}
                </div>
                {uploadStatus && (
                  <div className="space-y-2">
                    <p
                      className={`text-sm flex items-center gap-2 ${uploadStatus.type === "success" ? (theme === 'light' ? 'text-green-500' : 'text-green-400') : uploadStatus.type === "error" ? (theme === 'light' ? 'text-red-500' : 'text-red-400') : (theme === 'light' ? 'text-blue-500' : 'text-yellow-400')}`}
                    >
                      <CheckCircle size={16} /> {uploadStatus.message}
                    </p>
                    {uploadStatus.type === "uploading" && (
                      <div className={`w-full ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded-full h-2.5`}>
                        <div
                          className={`${theme === 'light' ? 'bg-blue-600' : 'bg-yellow-400'} h-2.5 rounded-full transition-all duration-300`}
                          style={{ width: `${uploadStatus.progress || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {uploadedPhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium`}>Uploaded Photos:</p>
                    <ul className={`list-disc pl-5 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                      {uploadedPhotos.map((photo, index) => (
                        <li key={index}>
                          <a
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${theme === 'light' ? 'text-blue-500 hover:underline' : 'text-yellow-400 hover:underline'}`}
                          >
                            {photo.fileName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <label className={`${theme === "light" ? "text-zinc-700" : "text-zinc-300"} block text-sm font-medium`}>Signature <span className="text-red-500">*</span></label>
                  <input
                    {...register('signature', { required: 'Signature is required' })}
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === "light" ? "border-zinc-300 bg-white focus:ring-blue-500" : "border-zinc-700 bg-gray-800 focus:ring-yellow-400"} ${errors.signature ? 'border-red-500' : ''}`}
                    placeholder="Type your full name as signature"
                  />
                  {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature.message}</p>}
                </div>
                <div className="flex items-center">
                  <input
                    {...register('agreeTerms', { required: 'You must agree to the terms and conditions' })}
                    type="checkbox"
                    className={`h-4 w-4 ${theme === "light" ? "text-blue-600 focus:ring-blue-500" : "text-yellow-400 focus:ring-yellow-400"} border-gray-300 rounded ${errors.agreeTerms ? 'border-red-500' : ''}`}
                  />
                  <label className={`${theme === "light" ? "text-gray-700" : "text-gray-300"} ml-2 text-sm`}>
                    I agree to the terms and conditions <span className="text-red-500">*</span>
                  </label>
                  {errors.agreeTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeTerms.message}</p>}
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
              <button
                type="button"
                onClick={handleReset}
                className={`px-4 py-2 rounded font-medium transition-colors duration-200 ${theme === "light" ? "bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-2 focus:ring-gray-500" : "bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400"}`}
              >
                Reset
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
                  disabled={uploadStatus?.type === "uploading" || showCamera}
                  className={`px-4 py-2 rounded font-medium transition-colors duration-200 flex items-center gap-2 ${theme === "light" ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500" : "bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-yellow-400"} ${uploadStatus?.type === "uploading" || showCamera ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadStatus?.type === "uploading" ? (
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