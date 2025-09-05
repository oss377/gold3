"use client";

import { useState, useContext, useCallback } from "react";
import { db, auth } from "../../fconfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { Loader2, Mail, User, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ThemeContext } from "../../../context/ThemeContext";
import { toast } from "react-toastify";

// Types
interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  photo: File | null;
  address: string;
  city: string;
  country: string;
  jobType: string;
  email: string;
  password: string;
  emergencyName: string;
  emergencyPhone: string;
  gender: string;
  height: string;
  weight: string;
  age: string;
  bmi: string;
  relationship: string;
  yearsTraining: string;
  behavioral: string;
  healthIssues: string;
  rank: string;
  smoke: boolean;
  surgery: boolean;
  alcohol: boolean;
  heartDisease: boolean;
  hearingProblem: boolean;
  visionProblem: boolean;
  startDate: string;
  signature: string;
  role: string;
  category: string;
  payment: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    photo: null,
    address: "",
    city: "",
    country: "",
    jobType: "",
    email: "",
    password: "",
    emergencyName: "",
    emergencyPhone: "",
    gender: "",
    height: "",
    weight: "",
    age: "",
    bmi: "",
    relationship: "",
    yearsTraining: "",
    behavioral: "",
    healthIssues: "",
    rank: "",
    smoke: false,
    surgery: false,
    alcohol: false,
    heartDisease: false,
    hearingProblem: false,
    visionProblem: false,
    startDate: "",
    signature: "",
    role: "user",
    category: "karate",
    payment: "not payed",
  });
  const [errors, setErrors] = useState<{ general?: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("ThemeContext must be used within a ThemeProvider");
  }
  const { theme } = context;

  // Memoize completeRegistration to save user data to Firestore
  const completeRegistration = useCallback(
    async (userId: string) => {
      try {
        const docRef = await addDoc(collection(db, "GYM"), {
          uid: userId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          country: formData.country.trim(),
          jobType: formData.jobType.trim(),
          email: formData.email.trim(),
          emergencyName: formData.emergencyName.trim(),
          emergencyPhone: formData.emergencyPhone.trim(),
          gender: formData.gender.trim(),
          height: formData.height.trim(),
          weight: formData.weight.trim(),
          age: formData.age.trim(),
          bmi: formData.bmi.trim(),
          relationship: formData.relationship.trim(),
          yearsTraining: formData.yearsTraining.trim(),
          behavioral: formData.behavioral.trim(),
          healthIssues: formData.healthIssues.trim(),
          rank: formData.rank.trim(),
          smoke: formData.smoke,
          surgery: formData.surgery,
          alcohol: formData.alcohol,
          heartDisease: formData.heartDisease,
          hearingProblem: formData.hearingProblem,
          visionProblem: formData.visionProblem,
          startDate: formData.startDate.trim(),
          signature: formData.signature.trim(),
          role: formData.role,
          category: formData.category,
          payment: "not payed",
          registrationDate: new Date().toISOString(),
        });
        setFormData({
          firstName: "",
          lastName: "",
          phoneNumber: "",
          photo: null,
          address: "",
          city: "",
          country: "",
          jobType: "",
          email: "",
          password: "",
          emergencyName: "",
          emergencyPhone: "",
          gender: "",
          height: "",
          weight: "",
          age: "",
          bmi: "",
          relationship: "",
          yearsTraining: "",
          behavioral: "",
          healthIssues: "",
          rank: "",
          smoke: false,
          surgery: false,
          alcohol: false,
          heartDisease: false,
          hearingProblem: false,
          visionProblem: false,
          startDate: "",
          signature: "",
          role: "user",
          category: "karate",
          payment: "not payed",
        });
        toast.success("Registration successful! Redirecting to payment...", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        // Store document ID and user ID for payment update
        sessionStorage.setItem("pendingDocId", docRef.id);
        sessionStorage.setItem("pendingUserId", userId);
        setTimeout(() => {
          router.push("/payment");
        }, 3000);
      } catch (error: any) {
        console.error("Firestore error:", error);
        setErrors({ general: "Failed to save registration data. Please try again or contact support." });
        toast.error("Failed to save registration data. Please try again.", {
          position: "top-center",
          autoClose: 5000,
        });
        setIsLoading(false);
      }
    },
    [formData, router]
  );

  // Update payment status in Firestore
  const updatePaymentStatus = useCallback(
    async (docId: string, paymentStatus: string) => {
      try {
        const userDocRef = doc(db, "GYM", docId);
        await updateDoc(userDocRef, {
          payment: paymentStatus,
          paymentDate: paymentStatus === "payed" ? new Date().toISOString() : null,
        });
        toast.success(`Payment ${paymentStatus === "payed" ? "successful" : "not completed"}! Redirecting to login...`, {
          position: "top-center",
          autoClose: 3000,
        });
        sessionStorage.removeItem("pendingDocId");
        sessionStorage.removeItem("pendingUserId");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error: any) {
        console.error("Payment update error:", error);
        setErrors({ general: "Failed to update payment status. Please contact support." });
        toast.error("Failed to update payment status. Please try again.", {
          position: "top-center",
          autoClose: 5000,
        });
        setIsLoading(false);
      }
    },
    [router]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof FormData
  ) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [field]: value });
    setErrors({ general: "" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, photo: file });
    setErrors({ general: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      await completeRegistration(userCredential.user.uid);
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please try a different email or log in.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }
      setErrors({ general: errorMessage });
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = useCallback(async () => {
    const docId = sessionStorage.getItem("pendingDocId");
    const userId = sessionStorage.getItem("pendingUserId");
    if (docId && userId) {
      await updatePaymentStatus(docId, "payed");
    } else {
      setErrors({ general: "Payment data not found. Please try registering again." });
      toast.error("Payment data not found. Please try registering again.", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
    }
  }, [updatePaymentStatus]);

  // Handle payment failure or non-completion
  const handlePaymentFailure = useCallback(async () => {
    const docId = sessionStorage.getItem("pendingDocId");
    const userId = sessionStorage.getItem("pendingUserId");
    if (docId && userId) {
      await updatePaymentStatus(docId, "not payed");
    } else {
      setErrors({ general: "Payment data not found. Please try registering again." });
      toast.error("Payment data not found. Please try registering again.", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
    }
  }, [updatePaymentStatus]);

  const inputFields = [
    { name: "firstName", type: "text", placeholder: "First Name", icon: User, label: "First Name" },
    { name: "lastName", type: "text", placeholder: "Last Name", icon: User, label: "Last Name" },
    { name: "phoneNumber", type: "tel", placeholder: "Phone Number", icon: null, label: "Phone Number" },
    { name: "photo", type: "file", placeholder: "", icon: null, label: "Profile Photo" },
    { name: "address", type: "text", placeholder: "Address", icon: null, label: "Address" },
    { name: "city", type: "text", placeholder: "City", icon: null, label: "City" },
    { name: "country", type: "text", placeholder: "Country", icon: null, label: "Country" },
    { name: "jobType", type: "text", placeholder: "Job Type", icon: null, label: "Job Type" },
    { name: "email", type: "email", placeholder: "Email", icon: Mail, label: "Email" },
    { name: "password", type: "password", placeholder: "Password", icon: Lock, label: "Password", showToggle: true },
    { name: "emergencyName", type: "text", placeholder: "Emergency Contact Name", icon: null, label: "Emergency Contact Name" },
    { name: "emergencyPhone", type: "tel", placeholder: "Emergency Phone", icon: null, label: "Emergency Phone" },
    { name: "gender", type: "select", placeholder: "", icon: null, label: "Gender", options: ["Male", "Female", "Other"] },
    { name: "height", type: "text", placeholder: "Height (cm)", icon: null, label: "Height" },
    { name: "weight", type: "text", placeholder: "Weight (kg)", icon: null, label: "Weight" },
    { name: "age", type: "text", placeholder: "Age", icon: null, label: "Age" },
    { name: "bmi", type: "text", placeholder: "BMI", icon: null, label: "BMI" },
    { name: "relationship", type: "text", placeholder: "Relationship", icon: null, label: "Relationship" },
    { name: "yearsTraining", type: "text", placeholder: "Years of Training", icon: null, label: "Years of Training" },
    { name: "behavioral", type: "text", placeholder: "Behavioral Information", icon: null, label: "Behavioral Information" },
    { name: "healthIssues", type: "text", placeholder: "Health Issues", icon: null, label: "Health Issues" },
    { name: "rank", type: "text", placeholder: "Rank", icon: null, label: "Rank" },
    { name: "smoke", type: "checkbox", placeholder: "", icon: null, label: "Do you smoke?" },
    { name: "surgery", type: "checkbox", placeholder: "", icon: null, label: "Had surgery?" },
    { name: "alcohol", type: "checkbox", placeholder: "", icon: null, label: "Do you consume alcohol?" },
    { name: "heartDisease", type: "checkbox", placeholder: "", icon: null, label: "Heart Disease?" },
    { name: "hearingProblem", type: "checkbox", placeholder: "", icon: null, label: "Hearing Problem?" },
    { name: "visionProblem", type: "checkbox", placeholder: "", icon: null, label: "Vision Problem?" },
    { name: "startDate", type: "date", placeholder: "", icon: null, label: "Start Date" },
    { name: "signature", type: "text", placeholder: "Signature", icon: null, label: "Signature" },
  ];

  return (
    <main className={`min-h-screen flex items-center justify-center p-6 ${theme === "light" ? "bg-zinc-100" : "bg-zinc-900"}`}>
      <motion.div
        className={`w-full max-w-lg rounded-2xl shadow-lg overflow-hidden ${
          theme === "light" ? "bg-gradient-to-br from-blue-50 to-purple-50" : "bg-gradient-to-br from-gray-800 to-gray-900"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-8">
          <h2
            className={`text-3xl font-bold text-center ${theme === "light" ? "text-zinc-800" : "text-zinc-100"} mb-6`}
          >
            Create Your Account
          </h2>

          {errors.general && (
            <motion.div
              className="mb-6 p-4 rounded-lg bg-red-100 text-red-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {inputFields.map(({ name, type, placeholder, icon: Icon, label, showToggle, options }) => (
              <motion.div
                key={name}
                className={`p-4 rounded-xl shadow-sm ${
                  theme === "light"
                    ? "bg-gradient-to-br from-blue-100 to-purple-100"
                    : "bg-gradient-to-br from-gray-700 to-gray-800"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + inputFields.indexOf(inputFields.find((f) => f.name === name)!) * 0.1, duration: 0.4 }}
              >
                <label
                  htmlFor={name}
                  className={`block text-sm font-medium ${theme === "light" ? "text-zinc-700" : "text-zinc-300"} mb-1`}
                >
                  {label}
                </label>
                <div className="relative">
                  {type === "select" ? (
                    <select
                      id={name}
                      name={name}
                      value={formData[name as keyof FormData] as string}
                      onChange={(e) => handleInputChange(e, name as keyof FormData)}
                      className={`w-full p-3 border ${
                        theme === "light" ? "border-zinc-200" : "border-zinc-700"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === "light" ? "bg-white" : "bg-gray-800"
                      }`}
                    >
                      <option value="" disabled>
                        Select {label}
                      </option>
                      {options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : type === "checkbox" ? (
                    <input
                      type="checkbox"
                      id={name}
                      name={name}
                      checked={formData[name as keyof FormData] as boolean}
                      onChange={(e) => handleInputChange(e, name as keyof FormData)}
                      className={`p-3 border ${
                        theme === "light" ? "border-zinc-200" : "border-zinc-700"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === "light" ? "bg-white" : "bg-gray-800"
                      }`}
                    />
                  ) : type === "file" ? (
                    <input
                      type="file"
                      id={name}
                      name={name}
                      onChange={handleFileChange}
                      className={`w-full p-3 border ${
                        theme === "light" ? "border-zinc-200" : "border-zinc-700"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === "light" ? "bg-white" : "bg-gray-800"
                      }`}
                    />
                  ) : (
                    <input
                      type={showToggle ? (showPassword ? "text" : "password") : type}
                      id={name}
                      name={name}
                      placeholder={placeholder}
                      value={formData[name as keyof FormData] as string}
                      onChange={(e) => handleInputChange(e, name as keyof FormData)}
                      className={`w-full p-3 ${Icon ? "pl-10" : ""} ${showToggle ? "pr-10" : ""} border ${
                        theme === "light" ? "border-zinc-200" : "border-zinc-700"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === "light" ? "bg-white" : "bg-gray-800"
                      }`}
                    />
                  )}
                  {Icon && (
                    <Icon
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                        theme === "light" ? "text-zinc-500" : "text-zinc-400"
                      } w-5 h-5`}
                    />
                  )}
                  {showToggle && (
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-3 flex items-center hover:bg-gray-200/50 rounded-full p-1 transition-colors ${
                        theme === "light" ? "text-zinc-500" : "text-zinc-400"
                      }`}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            <motion.button
              type="submit"
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-md ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:from-blue-700 hover:to-purple-700"
              } transition-all flex items-center justify-center`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </motion.button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className={`text-sm ${theme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>
            Already have an account?{" "}
            <Link
              href="/login"
              className={`underline ${theme === "light" ? "text-blue-600" : "text-blue-400"} hover:text-blue-500`}
            >
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}