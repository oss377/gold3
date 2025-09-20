'use client';

import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../../fconfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ThemeContext } from '../../../context/ThemeContext';
import { LanguageContext } from '../../../context/LanguageContext';

interface User {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface ErrorResponse {
  error?: string;
}

interface PasswordRequirement {
  id: number;
  text: string;
  valid: boolean;
  icon: React.ReactNode;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const { language } = useContext(LanguageContext);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordTouched, setCurrentPasswordTouched] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const t = {
    permissionDenied: language === 'en' ? 'Permission denied. Please log in to access this page.' : 'Acceso denegado. Por favor, inicia sesión.',
    updateSuccess: language === 'en' ? 'Profile updated successfully' : 'Perfil actualizado con éxito',
    passwordUpdateSuccess: language === 'en' ? 'Password updated successfully! Please log in again.' : 'Contraseña actualizada con éxito. Por favor, inicia sesión de nuevo.',
    updateError: language === 'en' ? 'Failed to update profile' : 'Error al actualizar el perfil',
  };

  // Password requirements
  const passwordRequirements = useMemo<PasswordRequirement[]>(
    () => [
      { id: 1, text: language === 'en' ? '8+ characters' : '8+ caracteres', valid: newPassword.length >= 8, icon: <Lock className="w-3 h-3" /> },
      { id: 2, text: language === 'en' ? 'Uppercase letter' : 'Letra mayúscula', valid: /(?=.*[A-Z])/.test(newPassword), icon: <Lock className="w-3 h-3" /> },
      { id: 3, text: language === 'en' ? 'Lowercase letter' : 'Letra minúscula', valid: /(?=.*[a-z])/.test(newPassword), icon: <Lock className="w-3 h-3" /> },
      { id: 4, text: language === 'en' ? 'Number' : 'Número', valid: /(?=.*[0-9])/.test(newPassword), icon: <Lock className="w-3 h-3" /> },
      { id: 5, text: language === 'en' ? 'Special character' : 'Carácter especial', valid: /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(newPassword), icon: <Lock className="w-3 h-3" /> },
    ],
    [newPassword, language]
  );

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const validCount = passwordRequirements.filter((req) => req.valid).length;
    if (validCount === 5) return { strength: 100, color: 'from-green-500 to-teal-500', label: language === 'en' ? 'Strong' : 'Fuerte' };
    if (validCount >= 3) return { strength: 60, color: 'from-yellow-400 to-orange-500', label: language === 'en' ? 'Medium' : 'Medio' };
    if (validCount >= 1) return { strength: 30, color: 'from-red-500 to-pink-500', label: language === 'en' ? 'Weak' : 'Débil' };
    return { strength: 0, color: 'from-gray-400 to-gray-500', label: language === 'en' ? 'None' : 'Ninguno' };
  }, [passwordRequirements, language]);

  // Validate current password
  const validateCurrentPassword = () => {
    if (!currentPasswordTouched) return '';
    if (!currentPassword.trim()) {
      const error = language === 'en' ? 'Current password is required' : 'Se requiere la contraseña actual';
      setCurrentPasswordError(error);
      return error;
    }
    setCurrentPasswordError('');
    return '';
  };

  // Validate new password
  const validateNewPassword = () => {
    if (!newPasswordTouched) return '';
    if (!newPassword.trim()) {
      const error = language === 'en' ? 'New password is required' : 'Se requiere una nueva contraseña';
      setPasswordError(error);
      return error;
    }
    if (newPassword.length < 8) {
      const error = language === 'en' ? 'Password must be at least 8 characters' : 'La contraseña debe tener al menos 8 caracteres';
      setPasswordError(error);
      return error;
    }
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      const error = language === 'en' ? 'Password requires an uppercase letter' : 'La contraseña requiere una letra mayúscula';
      setPasswordError(error);
      return error;
    }
    if (!/(?=.*[a-z])/.test(newPassword)) {
      const error = language === 'en' ? 'Password requires a lowercase letter' : 'La contraseña requiere una letra minúscula';
      setPasswordError(error);
      return error;
    }
    if (!/(?=.*[0-9])/.test(newPassword)) {
      const error = language === 'en' ? 'Password requires a number' : 'La contraseña requiere un número';
      setPasswordError(error);
      return error;
    }
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(newPassword)) {
      const error = language === 'en' ? 'Password requires a special character' : 'La contraseña requiere un carácter especial';
      setPasswordError(error);
      return error;
    }
    if (newPassword === currentPassword) {
      const error = language === 'en' ? 'New password cannot be the same as current password' : 'La nueva contraseña no puede ser igual a la actual';
      setPasswordError(error);
      return error;
    }
    setPasswordError('');
    return '';
  };

  // Validate confirm password
  const validateConfirmPassword = () => {
    if (!confirmPasswordTouched) return '';
    if (!confirmPassword.trim()) {
      const error = language === 'en' ? 'Please confirm your new password' : 'Por favor, confirma tu nueva contraseña';
      setConfirmPasswordError(error);
      return error;
    }
    if (newPassword !== confirmPassword) {
      const error = language === 'en' ? 'Passwords do not match' : 'Las contraseñas no coinciden';
      setConfirmPasswordError(error);
      return error;
    }
    setConfirmPasswordError('');
    return '';
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
      passwordRequirements.every((req) => req.valid) &&
      newPassword === confirmPassword
    );
  }, [currentPasswordError, passwordError, confirmPasswordError, currentPassword, newPassword, confirmPassword, passwordRequirements]);

  useEffect(() => {
    const validateSessionAndFetchUser = async () => {
      try {
        const response = await fetch('/api/adminvaldation', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const { error }: ErrorResponse = await response.json();
          console.error('Session validation failed:', error || t.permissionDenied);
          toast.error(error || t.permissionDenied);
          router.push('/login');
          return;
        }

        const userData: User = await response.json();
        setUser(userData);

        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'admin', userData.email));
        if (userDoc.exists()) {
          const { firstName, lastName } = userDoc.data();
          setFormData({ firstName: firstName || 'adminw', lastName: lastName || 'admin1' });
          setUser((prev) => ({ ...prev!, firstName, lastName }));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error during session validation:', error);
        toast.error(language === 'en' ? 'An unexpected error occurred' : 'Ocurrió un error inesperado');
        router.push('/login');
      }
    };

    validateSessionAndFetchUser();
  }, [router, t.permissionDenied, language]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateDoc(doc(db, 'admin', user.email), {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setUser((prev) => ({ ...prev!, ...formData }));
      setIsEditing(false);
      toast.success(t.updateSuccess);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t.updateError);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentError = validateCurrentPassword();
    const newError = validateNewPassword();
    const confirmError = validateConfirmPassword();

    if (currentError || newError || confirmError) {
      toast.error(language === 'en' ? 'Please fix the errors before submitting' : 'Por favor, corrige los errores antes de enviar');
      return;
    }

    if (!isFormValid) {
      toast.error(language === 'en' ? 'Please meet all password requirements' : 'Por favor, cumple con todos los requisitos de la contraseña');
      return;
    }

    setFormLoading(true);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: user?.email, currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || t.passwordUpdateSuccess);
        setSuccessMessage(t.passwordUpdateSuccess);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPasswordTouched(false);
        setNewPasswordTouched(false);
        setConfirmPasswordTouched(false);

        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setPasswordError(data.error || language === 'en' ? 'Failed to update password' : 'Error al actualizar la contraseña');
        toast.error(data.error || language === 'en' ? 'Failed to update password' : 'Error al actualizar la contraseña');
      }
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = language === 'en' ? 'An error occurred. Please try again.' : 'Ocurrió un error. Por favor, intenta de nuevo.';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const requirementVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (isValid: boolean) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, type: 'spring', stiffness: 300, damping: 20 },
    }),
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-gradient-to-br from-blue-50 via-white to-teal-50' : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700'}`}>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen py-12 px-4 ${theme === 'light' ? 'bg-gradient-to-br from-blue-50 via-white to-teal-50' : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700'}`}>
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
      <div className="max-w-2xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className={`text-4xl font-extrabold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>
              {language === 'en' ? 'User Profile' : 'Perfil de Usuario'}
            </h1>
            <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              {language === 'en' ? 'Manage your account details' : 'Gestiona los detalles de tu cuenta'}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border ${theme === 'light' ? 'border-gray-200/50' : 'border-gray-700/50'}`}>
            <div className="mb-8">
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>
                {language === 'en' ? 'User Information' : 'Información del Usuario'}
              </h3>
              <dl className="space-y-4">
                <div className="flex items-center gap-2">
                  <dt className={`text-sm font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{language === 'en' ? 'Email' : 'Correo Electrónico'}</dt>
                  <dd className="text-sm">{user.email}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className={`text-sm font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{language === 'en' ? 'First Name' : 'Nombre'}</dt>
                  <dd className="text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`border rounded px-2 py-1 w-full max-w-xs ${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-gray-100'}`}
                      />
                    ) : (
                      user.firstName || 'adminw'
                    )}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className={`text-sm font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{language === 'en' ? 'Last Name' : 'Apellido'}</dt>
                  <dd className="text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`border rounded px-2 py-1 w-full max-w-xs ${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-700 border-gray-600 text-gray-100'}`}
                      />
                    ) : (
                      user.lastName || 'admin1'
                    )}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={handleEditToggle}
                  className={`px-4 py-2 rounded ${theme === 'light' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'}`}
                >
                  {isEditing ? (language === 'en' ? 'Cancel' : 'Cancelar') : (language === 'en' ? 'Edit Profile' : 'Editar Perfil')}
                </button>
                {isEditing && (
                  <button
                    onClick={handleProfileUpdate}
                    className={`px-4 py-2 rounded ${theme === 'light' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-green-400 text-gray-900 hover:bg-green-500'}`}
                  >
                    {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>
                {language === 'en' ? 'Change Password' : 'Cambiar Contraseña'}
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                    {language === 'en' ? 'Current Password' : 'Contraseña Actual'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onBlur={() => {
                        setCurrentPasswordTouched(true);
                        validateCurrentPassword();
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
                        currentPasswordError
                          ? 'border-red-500 focus:ring-red-500'
                          : theme === 'light'
                          ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          : 'border-gray-600 bg-gray-700 focus:border-yellow-400 focus:ring-yellow-400'
                      } ${theme === 'light' ? 'bg-white text-gray-900 placeholder-gray-500' : 'bg-gray-700 text-gray-100 placeholder-gray-400'}`}
                      placeholder={language === 'en' ? 'Enter your current password' : 'Ingresa tu contraseña actual'}
                      disabled={formLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={formLoading}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                      ) : (
                        <Eye className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </button>
                  </div>
                  {currentPasswordError && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {currentPasswordError}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                    {language === 'en' ? 'New Password' : 'Nueva Contraseña'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onBlur={() => {
                        setNewPasswordTouched(true);
                        validateNewPassword();
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
                        passwordError
                          ? 'border-red-500 focus:ring-red-500'
                          : theme === 'light'
                          ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          : 'border-gray-600 bg-gray-700 focus:border-yellow-400 focus:ring-yellow-400'
                      } ${theme === 'light' ? 'bg-white text-gray-900 placeholder-gray-500' : 'bg-gray-700 text-gray-100 placeholder-gray-400'}`}
                      placeholder={language === 'en' ? 'Create a strong password' : 'Crea una contraseña fuerte'}
                      disabled={formLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={formLoading}
                    >
                      {showNewPassword ? (
                        <EyeOff className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                      ) : (
                        <Eye className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </button>
                  </div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: newPassword ? 1 : 0 }} className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          passwordStrength.strength === 100
                            ? 'bg-green-500'
                            : passwordStrength.strength >= 60
                            ? 'bg-yellow-500'
                            : passwordStrength.strength > 0
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          theme === 'light'
                            ? passwordStrength.strength === 100
                              ? 'text-green-600'
                              : passwordStrength.strength >= 60
                              ? 'text-yellow-600'
                              : passwordStrength.strength > 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                            : passwordStrength.strength === 100
                            ? 'text-green-400'
                            : passwordStrength.strength >= 60
                            ? 'text-yellow-400'
                            : passwordStrength.strength > 0
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {passwordStrength.label} Password
                      </span>
                    </div>
                    <div className={`h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.strength}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color} ${theme === 'dark' ? 'dark:bg-opacity-80' : ''}`}
                      />
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: newPassword ? 1 : 0 }} className="mt-4 space-y-1">
                    <div className={`grid grid-cols-1 gap-2 p-3 rounded-xl ${theme === 'light' ? 'bg-gradient-to-r from-blue-50/50 to-teal-50/50' : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50'}`}>
                      {passwordRequirements.map((req) => (
                        <motion.div
                          key={req.id}
                          variants={requirementVariants}
                          custom={req.valid}
                          initial="hidden"
                          animate="visible"
                          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            req.valid
                              ? theme === 'light'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-green-900/20 text-green-400'
                              : theme === 'light'
                              ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              : 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/30'
                          }`}
                        >
                          <motion.div
                            animate={{ scale: req.valid ? 1 : 0.8 }}
                            transition={{ duration: 0.2 }}
                            className={`flex-shrink-0 w-5 h-5 rounded-full ${req.valid ? 'bg-green-500 border-2 border-green-600' : 'bg-gray-300 dark:bg-gray-600 border-2 border-gray-400 dark:border-gray-500'}`}
                          >
                            {req.valid && <CheckCircle className={`w-3 h-3 m-auto text-white ${theme === 'dark' ? 'text-green-100' : ''}`} />}
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
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mt-2 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {passwordError}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                    {language === 'en' ? 'Confirm New Password' : 'Confirmar Nueva Contraseña'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => {
                        setConfirmPasswordTouched(true);
                        validateConfirmPassword();
                      }}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
                        confirmPasswordError
                          ? 'border-red-500 focus:ring-red-500'
                          : theme === 'light'
                          ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          : 'border-gray-600 bg-gray-700 focus:border-yellow-400 focus:ring-yellow-400'
                      } ${theme === 'light' ? 'bg-white text-gray-900 placeholder-gray-500' : 'bg-gray-700 text-gray-100 placeholder-gray-400'}`}
                      placeholder={language === 'en' ? 'Confirm your new password' : 'Confirma tu nueva contraseña'}
                      disabled={formLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={formLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                      ) : (
                        <Eye className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {confirmPasswordError}
                    </motion.p>
                  )}
                </motion.div>

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-green-900/20 border-green-800/50 text-green-400'}`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <button
                    type="submit"
                    disabled={!isFormValid || formLoading}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                      isFormValid && !formLoading
                        ? theme === 'light'
                          ? 'bg-gradient-to-r from-blue-600 via-green-500 to-teal-500 text-white hover:from-blue-700 hover:via-green-600 hover:to-teal-600 shadow-lg hover:shadow-xl'
                          : 'bg-gradient-to-r from-yellow-400 via-green-400 to-teal-400 text-gray-900 hover:from-yellow-500 hover:via-green-500 hover:to-teal-500 shadow-lg hover:shadow-xl'
                        : 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {formLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{language === 'en' ? 'Updating Password...' : 'Actualizando Contraseña...'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>{language === 'en' ? 'Change Password' : 'Cambiar Contraseña'}</span>
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;