"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { db, auth } from "../app/fconfig";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

// TypeScript interface for member registration form data
interface MemberFormData {
  name: string;
  email: string;
  membership: string;
  phone: string;
  role: string;
  password: string;
}

interface RegisterMemberProps {
  isOpen: boolean;
  onClose: () => void;
  isHighContrast: boolean;
}

export default function RegisterMember({ isOpen, onClose, isHighContrast }: RegisterMemberProps) {
  const [registerStatus, setRegisterStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MemberFormData>();

  // Map role to Firestore collection
  const roleToCollection = (role: string): string => {
    switch (role.toLowerCase()) {
      case "admin":
        return "consult";
      case "guest":
        return "aerobics";
      case "karate":
        return "karate";
      case "member":
      default:
        return "gym";
    }
  };

  // Handle member registration form submission
  const onSubmit = async (data: MemberFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Determine Firestore collection based on role
      const collectionName = roleToCollection(data.role);

      // Save user data to Firestore
      const memberRef = doc(db, collectionName, user.uid);
      await setDoc(memberRef, {
        name: data.name,
        email: data.email,
        membership: data.membership,
        phone: data.phone,
        role: data.role,
        status: "Pending",
        statusColor: "text-yellow-500",
        createdAt: new Date().toISOString(),
      });

      setRegisterStatus({ type: "success", message: "Member registered successfully!" });
      setTimeout(() => {
        onClose();
        reset();
        setRegisterStatus(null);
        setIsSubmitting(false);
      }, 2000);
    } catch (error: any) {
      let errorMessage = "Failed to register member";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email is already in use";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setRegisterStatus({ type: "error", message: errorMessage });
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`${
          isHighContrast ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } rounded-xl p-8 w-full max-w-md shadow-2xl relative transition-colors duration-300`}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            reset();
            setRegisterStatus(null);
          }}
          className={`absolute top-4 right-4 ${
            isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-semibold mb-6">Register New Member</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              {...register("name", {
                required: "Name is required",
                maxLength: { value: 50, message: "Name must be under 50 characters" },
              })}
              className={`w-full px-3 py-2 rounded-lg ${
                isHighContrast ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-200 border-gray-600 text-gray-900"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Invalid email address",
                },
              })}
              className={`w-full px-3 py-2 rounded-lg ${
                isHighContrast ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-200 border-gray-600 text-gray-900"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Membership Type</label>
            <select
              {...register("membership", { required: "Membership type is required" })}
              className={`w-full px-3 py-2 rounded-lg ${
                isHighContrast ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-200 border-gray-600 text-gray-900"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isSubmitting}
            >
              <option value="">Select a membership type</option>
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="Elite">Elite</option>
            </select>
            {errors.membership && <p className="text-red-500 text-sm mt-1">{errors.membership.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^\+?[1-9]\d{1,14}$/,
                  message: "Invalid phone number format",
                },
              })}
              className={`w-full px-3 py-2 rounded-lg ${
                isHighContrast ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-200 border-gray-600 text-gray-900"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isSubmitting}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              {...register("role", { required: "Role is required" })}
              className={`w-full px-3 py-2 rounded-lg ${
                isHighContrast ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-200 border-gray-600 text-gray-900"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isSubmitting}
            >
              <option value="">Select a role</option>
              <option value="Member">Gym Member</option>
              <option value="Admin">Consult Admin</option>
              <option value="Guest">Aerobics Guest</option>
              <option value="Karate">Karate Member</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
                },
              })}
              className={`w-full px-3 py-2 rounded-lg ${
                isHighContrast ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-200 border-gray-600 text-gray-900"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          {registerStatus && (
            <p
              className={`text-sm ${
                registerStatus.type === "success" ? "text-green-500" : "text-red-500"
              }`}
            >
              {registerStatus.message}
            </p>
          )}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                reset();
                setRegisterStatus(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                isHighContrast ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              } transition-colors duration-200`}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg font-medium ${
                isHighContrast ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } transition-colors duration-200`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}