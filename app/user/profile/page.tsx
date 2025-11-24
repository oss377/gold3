"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast, ToastContainer } from 'react-toastify'; // Import react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import react-toastify styles
import { ThemeContext } from '../../../context/ThemeContext';
import LanguageContext from '../../../context/LanguageContext';
import { Eye, EyeOff, ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";

interface ThemeContextType {
  theme: "light" | "dark";
}

interface LanguageContextType {
  t: { [key: string]: string };
}

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
}

interface PasswordRequirement {
  id: number;
  text: string;
  valid: boolean;
  icon: React.ReactNode;
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext) as ThemeContextType;
  const { t } = useContext(LanguageContext) as LanguageContextType;

  // State for profile page
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // State for change password form
  const [formLoading, setFormLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordTouched, setCurrentPasswordTouched] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Password requirements
  const passwordRequirements = useMemo<PasswordRequirement[]>(
    () => [
      { id: 1, text: t?.eightCharacters || "8+ characters", valid: newPassword.length >= 8, icon: <Lock className="w-3 h-3" /> },
      { id: 2, text: t?.uppercaseLetter || "Uppercase letter", valid: /(?=.*[A-Z])/.test(newPassword), icon: <Lock className="w-3 h-3" /> },
      { id: 3, text: t?.lowercaseLetter || "Lowercase letter", valid: /(?=.*[a-z])/.test(newPassword), icon: <Lock className="w-3 h-3" /> },
      { id: 4, text: t?.number || "Number", valid: /(?=.*[0-9])/.test(newPassword), icon: <Lock className="w-3 h-3" /> },
      { id: 5, text: t?.specialCharacter || "Special character", valid: /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(newPassword), icon: <Lock className="w-3 h-3" /> },
    ],
    [newPassword, t]
  );

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const validCount = passwordRequirements.filter(req => req.valid).length;
    if (validCount === 5) return { strength: 100, color: "from-green-500 to-teal-500", label: t?.strong || "Strong" };
    if (validCount >= 3) return { strength: 60, color: "from-yellow-400 to-orange-500", label: t?.medium || "Medium" };
    if (validCount >= 1) return { strength: 30, color: "from-red-500 to-pink-500", label: t?.weak || "Weak" };
    return { strength: 0, color: "from-gray-400 to-gray-500", label: t?.none || "None" };
  }, [passwordRequirements, t]);

  // Validate current password
  const validateCurrentPassword = () => {
    if (!currentPasswordTouched) return "";
    if (!currentPassword.trim()) {
      setCurrentPasswordError(t?.currentPasswordRequired || "Current password is required");
      return t?.currentPasswordRequired || "Current password is required";
    }
    setCurrentPasswordError("");
    return "";
  };

  // Validate new password
  const validateNewPassword = () => {
    if (!newPasswordTouched) return "";
    if (!newPassword.trim()) {
      setPasswordError(t?.newPasswordRequired || "New password is required");
      return t?.newPasswordRequired || "New password is required";
    }
    if (newPassword.length < 8) {
      setPasswordError(t?.passwordLength || "Password must be at least 8 characters");
      return t?.passwordLength || "Password must be at least 8 characters";
    }
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      setPasswordError(t?.uppercaseRequired || "Password requires an uppercase letter");
      return t?.uppercaseRequired || "Password requires an uppercase letter";
    }
    if (!/(?=.*[a-z])/.test(newPassword)) {
      setPasswordError(t?.lowercaseRequired || "Password requires a lowercase letter");
      return t?.lowercaseRequired || "Password requires a lowercase letter";
    }
    if (!/(?=.*[0-9])/.test(newPassword)) {
      setPasswordError(t?.numberRequired || "Password requires a number");
      return t?.numberRequired || "Password requires a number";
    }
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(newPassword)) {
      setPasswordError(t?.specialCharRequired || "Password requires a special character");
      return t?.specialCharRequired || "Password requires a special character";
    }
    if (newPassword === currentPassword) {
      setPasswordError(t?.passwordSame || "New password cannot be the same as current password");
      return t?.passwordSame || "New password cannot be the same as current password";
    }
    setPasswordError("");
    return "";
  };

  // Validate confirm password
  const validateConfirmPassword = () => {
    if (!confirmPasswordTouched) return "";
    if (!confirmPassword.trim()) {
      setConfirmPasswordError(t?.confirmPasswordRequired || "Please confirm your new password");
      return t?.confirmPasswordRequired || "Please confirm your new password";
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t?.passwordsNotMatch || "Passwords do not match");
      return t?.passwordsNotMatch || "Passwords do not match";
    }
    setConfirmPasswordError("");
    return "";
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      !currentPasswordError &&
      !passwordError &&
      !confirmPasswordError &&
      currentPassword.trim() &&
      newPassword.trim() &&
      confirmPassword.trim() &&
      passwordRequirements.every(req => req.valid) &&
      newPassword === confirmPassword
    );
  }, [currentPasswordError, passwordError, confirmPasswordError, currentPassword, newPassword, confirmPassword, passwordRequirements]);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/validate", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const { error } = await response.json();
          toast.error(error || t?.pleaseLogin || "Please log in to access this page");
          router.push("/");
          return;
        }

        const data: UserData = await response.json();
        setIsAuthorized(true);
        setUserData(data);
        console.log('User authorized:', data.email);
      } catch (error) {
        console.error('Session validation error:', error);
        toast.error(t?.pleaseLogin || "Please log in to access this page");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [router, t]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentError = validateCurrentPassword();
    const newError = validateNewPassword();
    const confirmError = validateConfirmPassword();

    if (currentError || newError || confirmError) {
      toast.error(t?.fixErrors || "Please fix the errors before submitting");
      return;
    }

    if (!isFormValid) {
      toast.error(t?.meetRequirements || "Please meet all password requirements");
      return;
    }

    setFormLoading(true);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userData?.email, currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || t?.passwordUpdated || "Password updated successfully!");
        setSuccessMessage(t?.passwordUpdated || "Password updated successfully! Please log in again.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPasswordTouched(false);
        setNewPasswordTouched(false);
        setConfirmPasswordTouched(false);
        setTimeout(async () => {
          await fetch("/api/logout", { method: "POST", credentials: "include" });
          router.push("/");
        }, 3000);
      } else {
        setPasswordError(data.error || t?.passwordUpdateFailed || "Failed to update password");
        toast.error(data.error || t?.passwordUpdateFailed || "Failed to update password. Please check your current password.");
      }
    } catch (error) {
      console.error("Password change error:", error);
      let errorMessage = t?.errorOccurred || "An error occurred. Please try again.";
      // Check if the error is due to a server misconfiguration (e.g., 500 error with non-JSON response)
      if (error instanceof SyntaxError) {
        errorMessage = t?.serverMisconfigured || "Server misconfigured. Could not process the response.";
      }
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { 
        method: "POST",
        credentials: "include",
      });
      toast.success(t?.loggedOut || "Logged out successfully");
      router.push("/");
    } catch (error) {
      toast.error(t?.logoutFailed || "Logout failed");
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const requirementVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (isValid: boolean) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, type: "spring", stiffness: 300, damping: 20 }
    })
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`min-h-screen flex items-center justify-center ${
          theme === "light" ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-gray-900 to-gray-800"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
            {t?.verifyingSession || 'Verifying your session...'}
          </p>
        </div>
      </motion.div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect via useEffect
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen p-4 md:p-8 ${
        theme === "light" ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-gray-900 to-gray-800"
      }`}
    >
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`text-center mb-8 ${theme === "light" ? "text-gray-800" : "text-white"}`}
        >
          <h1 className="text-4xl font-bold mb-2">
            {t?.profile || 'Profile'}
          </h1>
          <p className="text-xl opacity-80">
            {t?.welcomeBack || 'Welcome back! Here are your account details.'}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showChangePassword ? (
            <motion.div
              key="profile"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
              className={`max-w-md mx-auto ${
                theme === "light" ? "bg-white shadow-lg" : "bg-gray-800 shadow-xl border border-gray-700/50"
              } rounded-2xl p-8`}
            >
              {/* User Info */}
              {userData && (
                <motion.div
                  variants={itemVariants}
                  className={`text-center mb-6 p-6 rounded-2xl ${
                    theme === "light" ? "bg-gradient-to-r from-blue-50 to-teal-50" : "bg-gradient-to-r from-gray-700 to-gray-600"
                  }`}
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    theme === "light" ? "bg-gradient-to-br from-blue-600 via-green-500 to-teal-500" : "bg-gradient-to-br from-yellow-400 via-green-400 to-teal-400"
                  }`}>
                    {userData.profilePicture ? (
                      <img src={userData.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-white text-xl font-bold">{userData.email?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <h2 className={`text-xl font-bold mb-1 ${theme === "light" ? "text-gray-800" : "text-gray-100"}`}>
                    {userData.firstName} {userData.lastName}
                  </h2>
                  <p className={`text-sm capitalize ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                    {userData.role} Account
                  </p>
                </motion.div>
              )}

              {/* Email Display */}
              <motion.div variants={itemVariants} className="text-center mb-6">
                <div className={`text-sm font-medium uppercase tracking-wider mb-2 ${
                  theme === "light" ? "text-gray-500" : "text-gray-400"
                }`}>
                  {t?.emailAddress || 'Email Address'}
                </div>
                <div className={`text-2xl font-bold break-all px-4 py-2 rounded-lg ${
                  theme === "light" ? "bg-blue-50 text-gray-800" : "bg-gray-700 text-white"
                }`}>
                  {userData?.email || 'Unknown'}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowChangePassword(true)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    theme === "light" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl" : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {t?.changePassword || 'Change Password'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    theme === "light" ? "text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200" : "text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-800/50"
                  }`}
                >
                  {t?.signOut || 'Sign Out'}
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="change-password"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
              className={`max-w-md mx-auto ${
                theme === "light" ? "bg-white shadow-lg" : "bg-gray-800 shadow-xl border border-gray-700/50"
              } rounded-2xl p-8`}
            >
              {/* Change Password Header */}
              <motion.div variants={itemVariants} className="mb-6">
                <button
                  onClick={() => setShowChangePassword(false)}
                  className={`flex items-center gap-2 mb-4 p-3 rounded-xl transition-all duration-300 ${
                    theme === "light" ? "text-gray-700 hover:bg-gray-100 hover:text-blue-600" : "text-gray-200 hover:bg-gray-700 hover:text-yellow-400"
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t?.back || 'Back'}
                </button>
                <h2 className={`text-2xl font-bold text-center ${theme === "light" ? "text-gray-800" : "text-gray-100"}`}>
                  {t?.changePassword || 'Change Password'}
                </h2>
                <p className={`text-center text-sm mt-2 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                  {t?.updatePassword || 'Update your password to keep your account secure'}
                </p>
              </motion.div>

              {/* Change Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Password Field */}
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-semibold mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-200"}`}>
                    {t?.currentPassword || 'Current Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onBlur={() => {
                        setCurrentPasswordTouched(true);
                        validateCurrentPassword();
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
                        currentPasswordError
                          ? "border-red-500 focus:ring-red-500"
                          : theme === "light"
                          ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          : "border-gray-600 bg-gray-700 focus:border-yellow-400 focus:ring-yellow-400"
                      } ${theme === "light" ? "bg-white text-gray-900 placeholder-gray-500" : "bg-gray-700 text-gray-100 placeholder-gray-400"}`}
                      placeholder={t?.enterCurrentPassword || "Enter your current password"}
                      disabled={formLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={formLoading}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                      ) : (
                        <Eye className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                      )}
                    </button>
                  </div>
                  {currentPasswordError && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mt-1 flex items-center gap-1 text-sm text-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {currentPasswordError}
                    </motion.p>
                  )}
                </motion.div>

                {/* New Password Field */}
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-semibold mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-200"}`}>
                    {t?.newPassword || 'New Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onBlur={() => {
                        setNewPasswordTouched(true);
                        validateNewPassword();
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
                        passwordError
                          ? "border-red-500 focus:ring-red-500"
                          : theme === "light"
                          ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          : "border-gray-600 bg-gray-700 focus:border-yellow-400 focus:ring-yellow-400"
                      } ${theme === "light" ? "bg-white text-gray-900 placeholder-gray-500" : "bg-gray-700 text-gray-100 placeholder-gray-400"} `}
                      placeholder={t?.createStrongPassword || "Create a strong password"}
                      disabled={formLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={formLoading}
                    >
                      {showNewPassword ? (
                        <EyeOff className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                      ) : (
                        <Eye className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: newPassword ? 1 : 0 }}
                    className="mt-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        passwordStrength.strength === 100 ? "bg-green-500" :
                        passwordStrength.strength >= 60 ? "bg-yellow-500" :
                        passwordStrength.strength > 0 ? "bg-red-500" : "bg-gray-400"
                      }`} />
                      <span className={`text-sm font-medium ${
                        theme === "light"
                          ? passwordStrength.strength === 100 ? "text-green-600" :
                            passwordStrength.strength >= 60 ? "text-yellow-600" :
                            passwordStrength.strength > 0 ? "text-red-600" : "text-gray-500"
                          : passwordStrength.strength === 100 ? "text-green-400" :
                            passwordStrength.strength >= 60 ? "text-yellow-400" :
                            passwordStrength.strength > 0 ? "text-red-400" : "text-gray-400"
                      }`}>
                        {passwordStrength.label} Password
                      </span>
                    </div>
                    <div className={`h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.strength}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color} ${theme === "dark" ? "dark:bg-opacity-80" : ""}`}
                      />
                    </div>
                  </motion.div>

                  {/* Password Requirements */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: newPassword ? 1 : 0 }}
                    className="mt-4 space-y-1"
                  >
                    <div className={`grid grid-cols-1 gap-2 p-3 rounded-xl ${
                      theme === "light" ? "bg-gradient-to-r from-blue-50/50 to-teal-50/50" : "bg-gradient-to-r from-gray-700/50 to-gray-600/50"
                    }`}>
                      {passwordRequirements.map((req) => (
                        <motion.div
                          key={req.id}
                          variants={requirementVariants}
                          custom={req.valid}
                          initial="hidden"
                          animate="visible"
                          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            req.valid
                              ? theme === "light" ? "bg-green-50 text-green-700" : "bg-green-900/20 text-green-400"
                              : theme === "light" ? "bg-gray-50 text-gray-600 hover:bg-gray-100" : "bg-gray-700/30 text-gray-400 hover:bg-gray-600/30"
                          }`}
                        >
                          <motion.div
                            animate={{ scale: req.valid ? 1 : 0.8 }}
                            transition={{ duration: 0.2 }}
                            className={`flex-shrink-0 w-5 h-5 rounded-full ${
                              req.valid
                                ? "bg-green-500 border-2 border-green-600"
                                : "bg-gray-300 dark:bg-gray-600 border-2 border-gray-400 dark:border-gray-500"
                            }`}
                          >
                            {req.valid && (
                              <CheckCircle className={`w-3 h-3 m-auto text-white ${theme === "dark" ? "text-green-100" : ""}`} />
                            )}
                          </motion.div>
                          <div className="flex items-center gap-2">
                            {req.icon}
                            <span className="text-sm">{req.text}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mt-2 flex items-center gap-1 text-sm text-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {passwordError}
                    </motion.p>
                  )}
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-semibold mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-200"}`}>
                    {t?.confirmNewPassword || 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => {
                        setConfirmPasswordTouched(true);
                        validateConfirmPassword();
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
                        confirmPasswordError
                          ? "border-red-500 focus:ring-red-500"
                          : theme === "light"
                          ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          : "border-gray-600 bg-gray-700 focus:border-yellow-400 focus:ring-yellow-400"
                      } ${theme === "light" ? "bg-white text-gray-900 placeholder-gray-500" : "bg-gray-700 text-gray-100 placeholder-gray-400"} `}
                      placeholder={t?.confirmYourPassword || "Confirm your new password"}
                      disabled={formLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={formLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                      ) : (
                        <Eye className={`w-5 h-5 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mt-1 flex items-center gap-1 text-sm text-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {confirmPasswordError}
                    </motion.p>
                  )}
                </motion.div>

                {/* Success Message */}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${
                      theme === "light" ? "bg-green-50 border-green-200 text-green-800" : "bg-green-900/20 border-green-800/50 text-green-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="flex gap-4">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setCurrentPasswordTouched(false);
                      setNewPasswordTouched(false);
                      setConfirmPasswordTouched(false);
                      setCurrentPasswordError("");
                      setPasswordError("");
                      setConfirmPasswordError("");
                    }}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                      theme === "light" ? "text-gray-600 hover:text-gray-700 hover:bg-gray-100 border border-gray-200" : "text-gray-400 hover:text-gray-300 hover:bg-gray-700 border border-gray-600"
                    }`}
                  >
                    {t?.cancel || 'Cancel'}
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={!isFormValid || formLoading}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                      isFormValid && !formLoading
                        ? theme === "light"
                          ? "bg-gradient-to-r from-blue-600 via-green-500 to-teal-500 text-white hover:from-blue-700 hover:via-green-600 hover:to-teal-600 shadow-lg hover:shadow-xl"
                          : "bg-gradient-to-r from-yellow-400 via-green-400 to-teal-400 text-gray-900 hover:from-yellow-500 hover:via-green-500 hover:to-teal-500 shadow-lg hover:shadow-xl"
                        : "bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed"
                    }`}
                  >
                    {formLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t?.updatingPassword || 'Updating Password...'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>{t?.changePassword || 'Change Password'}</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>

              {/* Security Tips */}
              <motion.div
                variants={itemVariants}
                className={`mt-6 p-6 rounded-2xl ${
                  theme === "light" ? "bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100/50" : "bg-gradient-to-r from-gray-700 to-gray-600 border border-gray-600/50"
                }`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === "light" ? "text-gray-800" : "text-gray-100"}`}>
                  {t?.securityTips || '💡 Security Tips'}
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className={`flex items-start gap-2 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                    <span className="mt-0.5 text-green-500">✓</span>
                    {t?.useCombination || 'Use a combination of letters, numbers, and symbols'}
                  </li>
                  <li className={`flex items-start gap-2 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                    <span className="mt-0.5 text-green-500">✓</span>
                    {t?.avoidGuessable || 'Avoid using easily guessable information (birthdays, names, etc.)'}
                  </li>
                  <li className={`flex items-start gap-2 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                    <span className="mt-0.5 text-green-500">✓</span>
                    {t?.usePasswordManager || 'Consider using a password manager for better security'}
                  </li>
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}