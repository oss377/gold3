"use client";

import { useState, useContext, useCallback } from "react";
import { db, auth } from "../../fconfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
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
  goalWeight: string;
  bloodType: string;
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
  startMonth: string;
  signature: string;
  role: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    birthDate: "",
    email: "",
    password: "",
    streetAddress: "",
    streetAddress2: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: "",
    emergencyName: "",
    emergencyPhone: "",
    height: "",
    weight: "",
    goalWeight: "",
    bloodType: "",
    healthIssues: "",
    medications: "",
    smoke: false,
    surgery: false,
    alcohol: false,
    supplements: false,
    foodTracking: false,
    proSport: false,
    exercisePain: false,
    nightEating: "",
    breakfastFrequency: "",
    nutritionRating: "",
    exerciseDays: [],
    exerciseTime: "",
    trainingGoals: [],
    eatingReasons: [],
    membershipType: "",
    exerciseDuration: "",
    startMonth: "",
    signature: "",
    role: "user",
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

  // Memoize completeRegistration to prevent unnecessary re-renders
  const completeRegistration = useCallback(
    async (userId: string) => {
      try {
        await addDoc(collection(db, "GYM"), {
          uid: userId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          birthDate: formData.birthDate.trim(),
          email: formData.email.trim(),
          streetAddress: formData.streetAddress.trim(),
          streetAddress2: formData.streetAddress2.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          emergencyName: formData.emergencyName.trim(),
          emergencyPhone: formData.emergencyPhone.trim(),
          height: formData.height.trim(),
          weight: formData.weight.trim(),
          goalWeight: formData.goalWeight.trim(),
          bloodType: formData.bloodType.trim(),
          healthIssues: formData.healthIssues.trim(),
          medications: formData.medications.trim(),
          smoke: formData.smoke,
          surgery: formData.surgery,
          alcohol: formData.alcohol,
          supplements: formData.supplements,
          foodTracking: formData.foodTracking,
          proSport: formData.proSport,
          exercisePain: formData.exercisePain,
          nightEating: formData.nightEating.trim(),
          breakfastFrequency: formData.breakfastFrequency.trim(),
          nutritionRating: formData.nutritionRating.trim(),
          exerciseDays: formData.exerciseDays,
          exerciseTime: formData.exerciseTime.trim(),
          trainingGoals: formData.trainingGoals,
          eatingReasons: formData.eatingReasons,
          membershipType: formData.membershipType.trim(),
          exerciseDuration: formData.exerciseDuration.trim(),
          startMonth: formData.startMonth.trim(),
          signature: formData.signature.trim(),
          role: formData.role,
        });

        setFormData({
          firstName: "",
          lastName: "",
          birthDate: "",
          email: "",
          password: "",
          streetAddress: "",
          streetAddress2: "",
          city: "",
          state: "",
          zipCode: "",
          phoneNumber: "",
          emergencyName: "",
          emergencyPhone: "",
          height: "",
          weight: "",
          goalWeight: "",
          bloodType: "",
          healthIssues: "",
          medications: "",
          smoke: false,
          surgery: false,
          alcohol: false,
          supplements: false,
          foodTracking: false,
          proSport: false,
          exercisePain: false,
          nightEating: "",
          breakfastFrequency: "",
          nutritionRating: "",
          exerciseDays: [],
          exerciseTime: "",
          trainingGoals: [],
          eatingReasons: [],
          membershipType: "",
          exerciseDuration: "",
          startMonth: "",
          signature: "",
          role: "user",
        });
        toast.success("Registration successful! Redirecting to login...");
        router.push("/login");
      } catch (error: any) {
        console.error("Firestore error:", error);
        setErrors({ general: "Failed to save registration data. Please try again or contact support." });
        toast.error("Failed to save registration data. Please try again.");
        setIsLoading(false);
      }
    },
    [formData, router]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: keyof FormData
  ) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [field]: value });
    setErrors({ general: "" });
  };

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    const value = e.target.value.split(",").map((item) => item.trim());
    setFormData({ ...formData, [field]: value });
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
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  console.log("handleSubmit defined:", typeof handleSubmit); // Moved after handleSubmit declaration

  const inputFields = [
    { name: "firstName", type: "text", placeholder: "First Name", icon: User, label: "First Name" },
    { name: "lastName", type: "text", placeholder: "Last Name", icon: User, label: "Last Name" },
    { name: "birthDate", type: "date", placeholder: "", icon: null, label: "Birth Date" },
    { name: "email", type: "email", placeholder: "Email", icon: Mail, label: "Email" },
    { name: "password", type: "password", placeholder: "Password", icon: Lock, label: "Password", showToggle: true },
    { name: "streetAddress", type: "text", placeholder: "Street Address", icon: null, label: "Street Address" },
    { name: "streetAddress2", type: "text", placeholder: "Street Address 2", icon: null, label: "Street Address 2" },
    { name: "city", type: "text", placeholder: "City", icon: null, label: "City" },
    { name: "state", type: "text", placeholder: "State", icon: null, label: "State" },
    { name: "zipCode", type: "text", placeholder: "Zip Code", icon: null, label: "Zip Code" },
    { name: "phoneNumber", type: "tel", placeholder: "Phone Number", icon: null, label: "Phone Number" },
    { name: "emergencyName", type: "text", placeholder: "Emergency Contact Name", icon: null, label: "Emergency Contact Name" },
    { name: "emergencyPhone", type: "tel", placeholder: "Emergency Phone", icon: null, label: "Emergency Phone" },
    { name: "height", type: "text", placeholder: "Height (cm)", icon: null, label: "Height" },
    { name: "weight", type: "text", placeholder: "Weight (kg)", icon: null, label: "Weight" },
    { name: "goalWeight", type: "text", placeholder: "Goal Weight (kg)", icon: null, label: "Goal Weight" },
    { name: "bloodType", type: "text", placeholder: "Blood Type", icon: null, label: "Blood Type" },
    { name: "healthIssues", type: "text", placeholder: "Health Issues", icon: null, label: "Health Issues" },
    { name: "medications", type: "text", placeholder: "Medications", icon: null, label: "Medications" },
    { name: "smoke", type: "checkbox", placeholder: "", icon: null, label: "Do you smoke?" },
    { name: "surgery", type: "checkbox", placeholder: "", icon: null, label: "Had surgery?" },
    { name: "alcohol", type: "checkbox", placeholder: "", icon: null, label: "Do you consume alcohol?" },
    { name: "supplements", type: "checkbox", placeholder: "", icon: null, label: "Do you take supplements?" },
    { name: "foodTracking", type: "checkbox", placeholder: "", icon: null, label: "Do you track food intake?" },
    { name: "proSport", type: "checkbox", placeholder: "", icon: null, label: "Participate in professional sports?" },
    { name: "exercisePain", type: "checkbox", placeholder: "", icon: null, label: "Pain during exercise?" },
    { name: "nightEating", type: "text", placeholder: "Night Eating Habits", icon: null, label: "Night Eating Habits" },
    {
      name: "breakfastFrequency",
      type: "select",
      placeholder: "",
      icon: null,
      label: "Breakfast Frequency",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    },
    {
      name: "nutritionRating",
      type: "select",
      placeholder: "",
      icon: null,
      label: "Nutrition Rating",
      options: ["Poor", "Fair", "Good", "Very Good", "Excellent"],
    },
    {
      name: "exerciseDays",
      type: "text",
      placeholder: "Exercise Days (comma-separated, e.g., Monday, Wednesday)",
      icon: null,
      label: "Exercise Days",
    },
    { name: "exerciseTime", type: "text", placeholder: "Exercise Time (e.g., 7:00 AM)", icon: null, label: "Exercise Time" },
    {
      name: "trainingGoals",
      type: "text",
      placeholder: "Training Goals (comma-separated, e.g., Strength, Endurance)",
      icon: null,
      label: "Training Goals",
    },
    {
      name: "eatingReasons",
      type: "text",
      placeholder: "Eating Reasons (comma-separated, e.g., Hunger, Stress)",
      icon: null,
      label: "Eating Reasons",
    },
    {
      name: "membershipType",
      type: "select",
      placeholder: "",
      icon: null,
      label: "Membership Type",
      options: ["Basic", "Premium", "VIP"],
    },
    {
      name: "exerciseDuration",
      type: "text",
      placeholder: "Exercise Duration (e.g., 1 hour)",
      icon: null,
      label: "Exercise Duration",
    },
    { name: "startMonth", type: "text", placeholder: "Start Month (e.g., January 2025)", icon: null, label: "Start Month" },
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
                  ) : name === "exerciseDays" || name === "trainingGoals" || name === "eatingReasons" ? (
                    <input
                      type="text"
                      id={name}
                      name={name}
                      placeholder={placeholder}
                      value={(formData[name as keyof FormData] as string[]).join(", ")}
                      onChange={(e) => handleArrayInputChange(e, name as keyof FormData)}
                      className={`w-full p-3 ${Icon ? "pl-10" : ""} border ${
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