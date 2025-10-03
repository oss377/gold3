'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';

// Define the Translation interface to include required properties
interface Translation {
  basic: string;
  premium: string;
  vip: string;
  error: string;
  fetchUsersError: string;
  fetchConversationUsersError: string;
  fetchError: string;
  emptyMessage: string;
  selectUser: string;
  messageSent: string;
  sendError: string;
  noContent: string;
  noTimestamp: string;
  noMessages: string;
  backToChats: string;
  messagePlaceholder: string;
  searchPlaceholder: string;
  conversationUsers: string;
  noConversationUsers: string;
  allUsers: string;
  noUsers: string;
  newConversation: string;
  [key: string]: string | undefined; // Allow additional properties
  dashboard?: string;
  members?: string;
  classes?: string;
  settings?: string;
  logout?: string;
  profile?: string;
  adminDashboard?: string;
  darkMode?: string;
  uploadVideo?: string;
  registerMember?: string;
  uploadSchedule?: string;
  activeMembers?: string;
  classesToday?: string;
  newSignups?: string;
  revenue?: string;
  changeMembers?: string;
  changeClasses?: string;
  changeSignups?: string;
  changeRevenue?: string;
  permissionDenied?: string;
  fetchSchedulesError?: string;
  fetchStatsError?: string;
  todaysSchedule?: string;
  loading?: string;
  noSchedules?: string;
  instructor?: string;
  statsOverview?: string;
  welcome?: string;
  chooseMessageType?: string;
  publicMessage?: string;
  personalMessage?: string;
  messages?: string;
  navigationError?: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  subadmin?: string;
  phonePlaceholder?: string;
  addressPlaceholder?: string;
  registerButton?: string;
  registrationSuccess?: string;
  registrationError?: string;
  userDataNotFound?: string;
  logoutSuccess?: string;
  logoutError?: string;
  welcomeMessage?: string;
  getStarted?: string;
  quickActions?: string;
  enlargedProfile?: string;
  timePlaceholder?: string;
  addTime?: string;
  descriptionPlaceholder?: string;
  titlePlaceholder?: string;
  datePlaceholder?: string;
  errorMessage?: string;
  fixErrors?: string;
  title: string;
  titleRequired: string;
  instructorRequired: string;
  date: string;
  description: string;
  instructorPlaceholder?: string;
  category: string;
  categoryRequired: string;
  selectCategory: string;
  weeklySchedule: string;
  timeInvalid: string;
  timeRequired: string;
  upload: string;
  uploading: string;
  cancel: string;
  close: string;
  success: string;
  

}

// Define the shape of the context using TypeScript
type LanguageContextType = {
  language: 'en' | 'am';
  toggleLanguage: () => void;
  t: Translation;
};

// Create the context with a default value
export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
  t: {
    basic: "",
    premium: "",
    vip: "",
    error: "",
    fetchUsersError: "",
    fetchConversationUsersError: "",
    fetchError: "",
    emptyMessage: "",
    selectUser: "",
    messageSent: "",
    sendError: "",
    noContent: "",
    noTimestamp: "",
    noMessages: "",
    backToChats: "",
    messagePlaceholder: "",
    searchPlaceholder: "",
    conversationUsers: "",
    noConversationUsers: "",
    allUsers: "",
    noUsers: "",
    newConversation: "",
    enlargedProfile: "Enlarged Profile",
    fixErrors: "Please fix the errors above.",
    title: '',
    titleRequired: '',
    instructorRequired: '',
    date: '',
    description: '',
    category: '',
    categoryRequired: '',
    selectCategory: '',
    weeklySchedule: '',
    timeInvalid: '',
    timeRequired: '',
    upload: '',
    uploading: '',
    cancel: '',
    close: '',
    success: ''
  },
});

// Combined translation dictionary with all required terms
const translations: { [key: string]: { en: string; am: string } } = {
  // Existing translations
  
  welcome: { en: "Welcome to Your Fitness Journey", am: "ወደ እርስዎ የአካል ብቃት ጉዞ እንኳን ደህና መጡ" },
  getStarted: { en: "Get Started Today", am: "ዛሬ ይጀምሩ" },
  enlargedProfile: { en: "Enlarged Profile", am: "የታሸገ መገለጫ" },
  discoverWorkouts: { en: "Discover a variety of workouts tailored to your fitness goals.", am: "ለእርስዎ የአካል ብቃት ግቦች የተዘጋጁ የተለያዩ የአካል ብቃት እንቅስቃሴዎችን ያግኙ።" },
  startConsultancy: { en: "Start Consultancy", am: "ምክክር ጀምር" },
  browseWorkouts: { en: "Browse Workouts", am: "የአካል ብቃት እንቅስቃሴዎችን ያስሱ" },
  joinCommunity: { en: "Join Our Fitness Community", am: "የእኛን የአካል ብቃት ማህበረሰብ ይቀላቀሉ" },
  connectCommunity: { en: "Connect with others, share tips, and stay motivated in our group chat.", am: "ከሌሎች ጋር ይገናኙ፣ ምክሮችን ያካፍሉ እና በቡድን ውይይታችን ተነሳሽነትን ይጠብቁ።" },
  joinChat: { en: "Join Chat", am: "ውይይት ይቀላቀሉ" },
  appTitle: { en: "Workout App", am: "የአካል ብቃት መተግበሪያ" },
  home: { en: "Home", am: "መነሻ" },
  fixErrors: { en: "Please fix the errors above.", am: "እባክዎ ላይ ያሉትን ስህተቶች ያስተካክሉ።" },
  workouts: { en: "Workouts", am: "የአካል ብቃት እንቅስቃሴዎች" },
  favorites: { en: "Favorites", am: "ተወዳጆች" },
  login: { en: "Login", am: "መግባት" },
  register: { en: "Register", am: "መመዝገብ" },
  instructorPlaceholder: { en: "Select an instructor", am: "አሰልጣኝ ይምረጡ" },
  timePlaceholder: { en: "Select time range", am: "የጊዜ ክልል ይምረጡ" },
  addTime: { en: "Add Time Slot", am: "የጊዜ ክፍል አክል" },
  descriptionPlaceholder: { en: "Enter class description", am: "የክፍል መግለጫ ያስገቡ" },
titlePlaceholder: { en: "Class Title", am: "የክፍል ርዕስ" },
datePlaceholder: { en: "Select a date", am: "ቀን ይምረጡ" },
errorMessage: { en: "Please fill out all required fields.", am: "እባክዎ ሁሉንም ያስፈልጉ መስኮቶች ይሙሉ." },


  darkMode: { en: "Dark Mode", am: "ጨለማ ሁነታ" },
  lightMode: { en: "Light Mode", am: "ብርሃን ሁነታ" },
  joinNow: { en: "Join Our Community", am: "አሁን ይቀላቀሉ" },
  signUpText: { en: "Sign up today to access personalized workouts and expert guidance.", am: "ዛሬ ይመዝገቡ ግላዊ የአካል ብቃት እንቅስቃሴዎችን እና የባለሙያ መመሪያ ለመድረስ።" },
  getStartedButton: { en: "Get Started", am: "ጀምር" },
  about: { en: "About", am: "ስለ" },
  careers: { en: "Careers", am: "ሙያዎች" },
  blog: { en: "Blog", am: "ብሎግ" },
  help: { en: "Help", am: "እገዛ" },
  contact: { en: "Contact", am: "እውቂያ" },
  faq: { en: "FAQ", am: "ተደጋጋሚ ጥያቄዎች" },
  terms: { en: "Terms", am: "ውሎች" },
  privacy: { en: "Privacy", am: "ግላዊነት" },
  cookies: { en: "Cookies", am: "ኩኪዎች" },
  footerText: { en: `© ${new Date().getFullYear()} Workout App. All rights reserved.`, am: `© ${new Date().getFullYear()} የአካል ብቃት መተግበሪያ። ሁሉም መብቶች የተጠበቁ ናቸው።` },
  welcomeBack: { en: "Welcome Back", am: "እንኳን ተመለሱ" },
  chooseProgram: { en: "Choose Your Program", am: "ፕሮግራምዎን ይምረጡ" },
  registerAerobics: { en: "Register for Aerobics", am: "ለኤሮቢክስ መመዝገብ" },
  registerGym: { en: "Register for Gym", am: "ለጂም መመዝገብ" },
  registerKarate: { en: "Register for Karate", am: "ለካራቴ መመዝገብ" },
  alreadyAccount: { en: "Already have an account?", am: "ቀድሞውኑ መለያ አለዎት?" },
  adminDashboard: { en: "Admin Dashboard", am: "አስተዳዳሪ ዳሽቦርድ" },
  uploadVideo: { en: "Upload Video", am: "ቪዲዮ ጫን" },
  registerMember: { en: "Register Member", am: "አባል መዝግብ" },
  uploadSchedule: { en: "Upload Schedule", am: "መርሃ ግብር ጫን" },
  activeMembers: { en: "Active Members", am: "ንቁ አባላት" },
  classesToday: { en: "Classes Today", am: "ዛሬ ክፍሎች" },
  newSignups: { en: "New Signups", am: "አዲስ ምዝገባዎች" },
  revenue: { en: "Revenue", am: "ገቢ" },
  todaysWorkoutSchedule: { en: "Today's Workout Schedule", am: "የዛሬ የአካል ብቃት መርሃ ግብር" },
  yogaClass: { en: "Yoga Class", am: "ዮጋ ክፍል" },
  strengthTraining: { en: "Strength Training", am: "ጥንካሬ ስልጠና" },
  spinClass: { en: "Spin Class", am: "ስፒን ክፍል" },
  members: { en: "Members", am: "አባላት" },
  classes: { en: "Classes", am: "ክፍሎች" },
  settings: { en: "Settings", am: "ቅንብሮች" },
  logout: { en: "Logout", am: "ውጣ" },
  searchPlaceholder: { en: "Search classes, trainers...", am: "ክፍሎችን፣ አሰልጣኞችን ፈልግ..." },
  userDashboard: { en: "User Dashboard", am: "ተጠቃሚ ዳሽቦርድ" },
  schedules: { en: "Schedules", am: "መርሃ ግብሮች" },
  workoutsCompleted: { en: "Workouts Completed", am: "የተጠናቀቁ የአካል ብቃት እንቅስቃሴዎች" },
  classesAttended: { en: "Classes Attended", am: "የተገኙ ክፍሎች" },
  nextSession: { en: "Next Session", am: "ቀጣይ ክፍለ ጊዜ" },
  progress: { en: "Progress", am: "እድገት" },
  yourWorkoutSchedule: { en: "Your Workout Schedule", am: "የእርስዎ የአካል ብቃት መርሃ ግብር" },
  recentActivities: { en: "Recent Activities", am: "የቅርብ ጊዜ እንቅስቃሴዎች" },
  activity: { en: "Activity", am: "እንቅስቃሴ" },
  date: { en: "Date", am: "ቀን" },
  trainer: { en: "Trainer", am: "አሰልጣኝ" },
  status: { en: "Status", am: "ሁኔታ" },
  completed: { en: "Completed", am: "ተጠናቀቀ" },
  upcoming: { en: "Upcoming", am: "መጪ" },
  consultMembers: { en: "Consult Members", am: "የምክክር አባላት" },
  gymMembers: { en: "Gym Members", am: "የጂም አባላት" },
  karateMembers: { en: "Karate Members", am: "የካራቴ አባላት" },
  personalTrainingMembers: { en: "Personal Training Members", am: "የግል ስልጠና አባላት" },
  registrationsMembers: { en: "Registrations Members", am: "የምዝገባ አባላት" },
  videosMembers: { en: "Videos Members", am: "የቪዲዮዎች አባላት" },
  aerobicsMembers: { en: "Aerobics Members", am: "የኤሮቢክስ አባላት" },
  refresh: { en: "Refresh", am: "አድስ" },
  loading: { en: "Loading", am: "በመጫን ላይ" },
  noMembersFound: { en: "No members found", am: "ምንም አባላት አልተገኙም" },
  name: { en: "Name", am: "ስም" },
  email: { en: "Email", am: "ኢሜይል" },
  membership: { en: "Membership", am: "አባልነት" },
  payed: { en: "Paid", am: "ተከፍሏል" },
  actions: { en: "Actions", am: "ተግባራት" },
  detail: { en: "Detail", am: "ዝርዝር" },
  delete: { en: "Delete", am: "ሰርዝ" },
  memberDetails: { en: "Member Details", am: "የአባል ዝርዝሮች" },
  close: { en: "Close", am: "ዝጋ" },
  invalidEmailFormat: { en: "Invalid email format", am: "ልክ ያልሆነ ኢሜይል ቅርጸት" },
  passwordRequired: { en: "Password is required", am: "የይለፍ ቃል ያስፈልጋል" },
  invalidEmailOrPassword: { en: "Invalid email or password", am: "ልክ ያልሆነ ኢሜይል ወይም የይለፍ ቃል" },
  noAccountFound: { en: "No account found with this email", am: "በዚህ ኢሜይል ምንም መለያ አልተገኘም" },
  tooManyAttempts: { en: "Too many attempts", am: "በጣም ብዙ ሙከራዎች" },
  forgotPassword: { en: "Forgot Password?", am: "የይለፍ ቃል ረሱ?" },
  signUp: { en: "Sign Up", am: "መመዝገብ" },
  createSchedule: { en: "Create Schedule", am: "መርሃ ግብር ፍጠር" },
  classTitle: { en: "Class Title", am: "የክፍል ርዕስ" },
  instructor: { en: "Instructor", am: "አሰልጣኝ" },
  category: { en: "Category", am: "ምድብ" },
  weeklySchedule: { en: "Weekly Schedule", am: "ሳምንታዊ መርሃ ግብር" },
  specificDate: { en: "Specific Date", am: "የተወሰነ ቀን" },
  description: { en: "Description", am: "መግለጫ" },
  classTitleRequired: { en: "Class title is required", am: "የክፍል ርዕስ ያስፈልጋል" },
  instructorRequired: { en: "Instructor is required", am: "አሰልጣኝ ያስፈልጋል" },
  categoryRequired: { en: "Category is required", am: "ምድብ ያስፈልጋል" },
  pleaseEnterTimeRange: { en: "Please enter a time range", am: "እባክዎ የጊዜ ክልል ያስገቡ" },
  invalidTimeFormat: { en: "Invalid time format", am: "ልክ ያልሆነ የጊዜ ቅርጸት" },
  cancel: { en: "Cancel", am: "ሰርዝ" },
  scheduleUploadedSuccessfully: { en: "Schedule uploaded successfully", am: "መርሃ ግብር በተሳካ ሁኔታ ተጭኗል" },
  uploadWorkoutVideos: { en: "Upload Workout Videos", am: "የአካል ብቃት ቪዲዮዎችን ጫን" },
  videoTitle: { en: "Video Title", am: "የቪዲዮ ርዕስ" },
  titleRequired: { en: "Title is required", am: "ርዕስ ያስፈልጋል" },
  titleMaxLength: { en: "Title must be under 100 characters", am: "ርዕስ ከ100 ቁምፊዎች በታች መሆን አለበት" },
  descriptionRequired: { en: "Description is required", am: "መግለጪ ያስፈልጋል" },
  videoFiles: { en: "Video Files (Up to 5)", am: "የቪዲዮ ፋይሎች (እስከ 5)" },
  videoFileRequired: { en: "At least one video file is required", am: "ቢያንስ አንድ የቪዲዮ ፋይል ያስፈልጋል" },
  videoFormat: { en: "Only MP4, MOV, or WEBM formats are allowed", am: "ብቻ MP4፣ MOV ወይም WEBM ቅርጸቶች ተፈቅደዋል" },
  fileSizeLimit: { en: "Each file must be under 1GB", am: "እያንዳንዱ ፋይል ከ1GB በታች መሆን አለበት" },
  maxVideos: { en: "You can upload a maximum of 5 videos at a time", am: "በአንድ ጊዜ እስከ 5 ቪዲዮዎች መጫን ይችላሉ" },
  uploadedVideos: { en: "Uploaded Videos", am: "የተጫኑ ቪዲዮዎች" },
  allVideosUploaded: { en: "All videos uploaded successfully", am: "ሁሉም ቪዲዮዎች በተሳካ ሁኔታ ተጭነዋል" },
  upload: { en: "Upload", am: "ጫን" },
  categoryPlaceholder: { en: "Select a category", am: "ምድብ ይምረጡ" },
  timePlaceholder24: { en: "Select time (24-hour format)", am: "ጊዜ ይምረጡ (24-ሰዓት ቅርጸት)" },
  addTimeSlot: { en: "Add Time Slot", am: "የጊዜ ክፍል አክል" },
  // New translations for the multi-step form
  
  title: { en: "Personal Training Consultation Form", am: "የግል ስልጠና ምክክር ቅጽ" },
  heading: { en: "Personal Training Consultation", am: "የግል ስልጠና ምክክር" },
  registrationComplete: { en: "Registration Complete!", am: "ምዝገባ ተጠናቀቀ!" },
  registrationMessage: { en: "Thank you for registering for personal training. Your information has been successfully saved.", am: "ለግል ስልጠና ምዝገባ ስለተመዘገቡ እናመሰግናለን። መረጃዎ በተሳካ ሁኔታ ተቀምጧል።" },
  goToHome: { en: "Go to Home Page", am: "ወደ መነሻ ገፅ ይሂዱ" },
  submit: { en: "Submit", am: "አስገባ" },
  previous: { en: "Previous", am: "ቀዳሚ" },
  next: { en: "Next", am: "ቀጣይ" },
  personalInfo: { en: "Personal Information", am: "የግል መረጃ" },
  healthInfo: { en: "Health Information", am: "የጤና መረጃ" },
  lifestyle: { en: "Lifestyle", am: "የኑሮ ዘይቤ" },
  trainingGoals: { en: "Training Goals", am: "የስልጠና ግቦች" },
  review: { en: "Review Your Information", am: "መረጃዎን ይገምጉ" },
  firstName: { en: "First Name", am: "የመጀመሪያ ስም" },
  lastName: { en: "Last Name", am: "የአባት ስም" },
  phoneNumber: { en: "Phone Number", am: "ስልክ ቁጥር" },
  photo: { en: "Photo", am: "ፎቶ" },
  address: { en: "Address", am: "አድራሻ" },
  city: { en: "City", am: "ከተማ" },
  country: { en: "Country", am: "ሀገር" },
  jobType: { en: "Job Type", am: "የሥራ ዓይነት" },
  emergencyName: { en: "Emergency Contact Name", am: "የድንገተኛ ግንኙነት ስም" },
  emergencyPhone: { en: "Emergency Phone Number", am: "የድንገተኛ ስልክ ቁጥር" },
  gender: { en: "Gender", am: "ጾታ" },
  height: { en: "Height (cm)", am: "ቁመት (ሴ.ሜ)" },
  weight: { en: "Weight (kg)", am: "ክብደት (ኪ.ግ)" },
  age: { en: "Age", am: "ዕድሜ" },
  bmi: { en: "BMI", am: "ቢኤምአይ" },
  bloodType: { en: "Blood Type", am: "የደም ዓይነት" },
  goalWeight: { en: "Goal Weight (kg)", am: "የግብ ክብደት (ኪ.ግ)" },
  relationship: { en: "Relationship Status", am: "የግንኙነት ሁኔታ" },
  healthIssues: { en: "Current/Previous Health Issues", am: "የአሁኑ/ያለፈ የጤና ችግሮች" },
  medications: { en: "Medications", am: "መድሃኒቶች" },
  workSchedule: { en: "Work Schedule", am: "የሥራ መርሃ ግብር" },
  travelFrequency: { en: "Travel Frequency", am: "የጉዞ ድግግሞሽ" },
  physicalActivities: { en: "Physical Activities Outside Gym/Work", am: "ከጂም/ሥራ ውጭ ያሉ አካላዊ እንቅስቃሴዎች" },
  medicalConditions: { en: "Medical Conditions (Diabetes, Asthma, Blood Pressure)", am: "የሕክምና ሁኔታዎች (ስኳር፣ አስም፣ የደም ግፊት)" },
  medicalConditionsDetails: { en: "Please provide details", am: "እባክዎ ዝርዝሮችን ያቅርቡ" },
  dietType: { en: "Current Diet", am: "የአሁኑ አመጋገብ" },
  trainingGoal: { en: "Training Goal", am: "የስልጠና ግብ" },
  goalReason: { en: "Why This Goal?", am: "ለምን ይህ ግብ?" },
  goalTimeline: { en: "Goal Timeline", am: "የግብ ጊዜ ሰሌዳ" },
  previousTraining: { en: "Previous Training with Personal Trainer", am: "ከግል አሰልጣኝ ጋር ያለፈ ስልጠና" },
  trainingType: { en: "Describe the type of training", am: "የስልጠናውን ዓይነት ይግለፁ" },
  preferredTrainingTime: { en: "Preferred Training Time", am: "ተመራጭ የስልጠና ጊዜ" },
  trainerExpectations: { en: "Expectations of Personal Trainer", am: "የግል አሰልጣኝ ተስፋዎች" },
  agreeTerms: { en: "I agree to the terms & conditions", am: "ውሎችን እስማማለሁ" },
  preferredStartDate: { en: "Preferred Start Date", am: "ተመራጭ የመጀመሪያ ቀን" },
  signature: { en: "Client Signature", am: "የደንበኛ ፊርማ" },
  firstNamePlaceholder: { en: "Enter your first name", am: "የመጀመሪያ ስምዎን ያስገቡ" },
  lastNamePlaceholder: { en: "Enter your last name", am: "የአባት ስምዎን ያስገቡ" },
  phoneNumberPlaceholder: { en: "Enter your phone number", am: "ስልክ ቁጥርዎን ያስገቡ" },
  addressPlaceholder: { en: "Enter your address", am: "አድራሻዎን ያስገቡ" },
  cityPlaceholder: { en: "Enter your city", am: "ከተማዎን ያስገቡ" },
  countryPlaceholder: { en: "Enter your country", am: "ሀገርዎን ያስገቡ" },
  jobTypePlaceholder: { en: "Enter your job type", am: "የሥራ ዓይነትዎን ያስገቡ" },
  emailPlaceholder: { en: "Enter your email", am: "ኢሜይልዎን ያስገቡ" },
  emergencyNamePlaceholder: { en: "Enter emergency contact name", am: "የድንገተኛ ግንኙነት ስም ያስገቡ" },
  emergencyPhonePlaceholder: { en: "Enter emergency phone", am: "የድንገተኛ ስልክ ያስገቡ" },
  heightPlaceholder: { en: "Enter height in cm", am: "ቁመትዎን በሴ.ሜ ያስገቡ" },
  weightPlaceholder: { en: "Enter weight in kg", am: "ክብደትዎን በኪ.ግ ያስገቡ" },
  agePlaceholder: { en: "Enter your age", am: "ዕድሜዎን ያስገቡ" },
  bmiPlaceholder: { en: "Calculated BMI", am: "የተሰላ ቢኤምአይ" },
  bloodTypePlaceholder: { en: "Select Blood Type", am: "የደም ዓይነት ይምረጡ" },
  goalWeightPlaceholder: { en: "Enter goal weight", am: "የግብ ክብደት ያስገቡ" },
  relationshipPlaceholder: { en: "Enter relationship status", am: "የግንኙነት ሁኔታ ያስገቡ" },
  healthIssuesPlaceholder: { en: "Describe any health issues", am: "ማንኛውንም የጤና ችግሮች ይግለፁ" },
  medicationsPlaceholder: { en: "List any medications", am: "ማንኛውንም መድሃኒቶች ይዘርዝሩ" },
  workSchedulePlaceholder: { en: "Select...", am: "ይምረጡ..." },
  physicalActivitiesPlaceholder: { en: "Describe your physical activities", am: "አካላዊ እንቅስቃሴዎችዎን ይግለፁ" },
  medicalConditionsDetailsPlaceholder: { en: "List conditions...", am: "ሁኔታዎችን ይዘርዝሩ..." },
  dietTypePlaceholder: { en: "Select...", am: "ይምረጡ..." },
  trainingGoalPlaceholder: { en: "Describe your training goal", am: "የስልጠና ግብዎን ይግለፁ" },
  goalReasonPlaceholder: { en: "Explain why you chose this goal", am: "ለምን ይህን ግብ እንደመረጡ ያብራሩ" },
  trainingTypePlaceholder: { en: "Describe the type of training...", am: "የስልጠናውን ዓይነት ይግለፁ..." },
  trainerExpectationsPlaceholder: { en: "Describe your expectations", am: "ተስፋዎችዎን ይግለፁ" },
  signaturePlaceholder: { en: "Type your full name as signature", am: "ሙሉ ስምዎን እንደ ፊርማ ያስገቡ" },
  firstNameError: { en: "First name is required", am: "የመጀመሪያ ስም ያስፈልጋል" },
  lastNameError: { en: "Last name is required", am: "የአባት ስም ያስፈልጋል" },
  phoneNumberError: { en: "Phone number is required", am: "ስልክ ቁጥር ያስፈልጋል" },
  phoneNumberInvalid: { en: "Invalid phone number", am: "ልክ ያልሆነ ስልክ ቁጥር" },
  addressError: { en: "Address is required", am: "አድራሻ ያስፈልጋል" },
  cityError: { en: "City is required", am: "ከተማ ያስፈልጋል" },
  countryError: { en: "Country is required", am: "ሀገር ያስፈልጋል" },
  emailError: { en: "Email is required", am: "ኢሜይል ያስፈልጋል" },
  emailInvalid: { en: "Invalid email", am: "ልክ ያልሆነ ኢሜይል" },
  emergencyNameError: { en: "Emergency contact name is required", am: "የድንገተኛ ግንኙነት ስም ያስፈልጋል" },
  emergencyPhoneError: { en: "Emergency phone is required", am: "የድንገተኛ ስልክ ያስፈልጋል" },
  emergencyPhoneInvalid: { en: "Invalid phone number", am: "ልክ ያልሆነ ስልክ ቁጥር" },
  genderError: { en: "Gender is required", am: "ጾታ ያስፈልጋል" },
  heightError: { en: "Height is required", am: "ቁመት ያስፈልጋል" },
  heightPositive: { en: "Height must be positive", am: "ቁመት አዎንታዊ መሆን አለበት" },
  weightError: { en: "Weight is required", am: "ክብደት ያሸፈልጋል" },
  weightPositive: { en: "Weight must be positive", am: "ክብደት አዎንታዊ መሆን አለበት" },
  ageError: { en: "Age is required", am: "ዕድሜ ያስፈልጋል" },
  agePositive: { en: "Age must be positive", am: "ዕድሜ አዎንታዊ መሆን አለበት" },
  ageReasonable: { en: "Age must be reasonable", am: "ዕድሜ ምክንያታዊ መሆን አለበት" },
  goalWeightPositive: { en: "Goal weight must be positive", am: "የግብ ክብደት አዎንታዊ መሆን አለበት" },
  workScheduleError: { en: "Work schedule is required", am: "የሥራ መርሃ ግብር ያሸፈልጋል" },
  travelFrequencyError: { en: "Travel frequency is required", am: "የጉዞ ድግግሞሽ ያስፈልጋል" },
  medicalConditionsError: { en: "Medical conditions selection is required", am: "የሕክምና ሁኔታዎች ምርጫ ያሸፈልጋል" },
  medicalConditionsDetailsError: { en: "Medical condition details are required", am: "የሕክምና ሁኔታዎች ዝርዝሮች ያሸፈልጋል" },
  trainingGoalError: { en: "Training goal is required", am: "የስልጠና ግብ ያስፈልጋል" },
  goalReasonError: { en: "Goal reason is required", am: "የግብ ምክንያት ያስፈልጋል" },
  goalTimelineError: { en: "Goal timeline is required", am: "የግብ ጊዜ ሰሌዳ ያሸፈልጋል" },
  previousTrainingError: { en: "Previous training selection is required", am: "ያለፈ ስልጠና ምርጫ ያስፈልጋል" },
  trainingTypeError: { en: "Training type is required", am: "የስልጠና ዓይነት ያሸፈልጋል" },
  trainerExpectationsError: { en: "Trainer expectations are required", am: "የአሰልጣኝ ተስፋዎች ያሸፈልጋል" },
  agreeTermsError: { en: "You must agree to terms", am: "ውሎችን መቀበል አለብዎት" },
  preferredStartDateError: { en: "Start date is required", am: "የመጀመሪያ ቀን ያሸፈልጋል" },
  signatureError: { en: "Signature is required", am: "ፊርማ ያሸፈልጋል" },
  fileSizeError: { en: "File size exceeds 5MB limit.", am: "የፋይል መጠን ከ5ሜባ በላይ ነው።" },
  fileTypeError: { en: "Please upload a valid image file.", am: "እባክዎ ትክክለኛ የምስል ፋይል ይጫኑ።" },
  uploadError: { en: "Failed to upload image.", am: "ምስል መጫን አልተሳካም።" },
  authError: { en: "User is not authenticated.", am: "ተጠቃሚ አልተረጋገጠም።" },
  firebaseError: { en: "Firebase services are not initialized.", am: "የፋየርቤዝ አገልግሎቶች አልተጀመሩም።" },
  saveError: { en: "An unexpected error occurred.", am: "ያልተጠበቀ ስህተት ተከስቷል።" },
  permissionError: { en: "Permission denied: Unable to save data.", am: "ፍቃድ ተከልክሏል፡ መረጃ መቆጠብ አልተቻለም።" },
  serviceError: { en: "Firebase service is unavailable.", am: "የፋየርቤዝ አገልግሎት አይገኝም።" },
  invalidDataError: { en: "Invalid data provided.", am: "ልክ ያልሆነ መረጃ ቀርቧል።" },
  storageError: { en: "Storage permission denied.", am: "የማከማቻ ፍቃድ ተከልክሏል።" },
  namePlaceholder: { en: "Enter member's name", am: "የአባል ስም ያስገቡ" },
  passwordPlaceholder: { en: "Enter password", am: "የይለፍ ቃል ያስገቡ" },
  subadmin: { en: "Subadmin", am: "ንዑስ አስተዳዳሪ" },
  phonePlaceholder: { en: "Enter phone number", am: "ስልክ ቁጥር ያስገቡ" },
  registerButton: { en: "Register Member", am: "አባል መዝግብ" },
  registrationSuccess: { en: "Member registered successfully", am: "አባል በተሳካ ሁኔታ ተመዝግቧል" },
  registrationError: { en: "Failed to register member", am: "አባል መመዝገብ አልተሳካም" },
  userDataNotFound: { en: "User data not found", am: "የተጠቃሚ መረጃ አልተገኘም" },
  logoutSuccess: { en: "Logged out successfully", am: "በተሳካ ሁኔታ ወጥቷል" },
  logoutError: { en: "Logout failed", am: "መውጣት አልተሳካም" },
  success: { en: "Success", am: "ስኬት" },
  time: { en: "Time", am: "ጊዜ" },
  timeRequired: { en: "Time is required", am: "ጊዜ ያስፈልጋል" },
  dateRequired: { en: "Date is required", am: "ቀን ያስፈልጋል" },
  submitSuccess: { en: "Schedule submitted successfully", am: "መርሃ ግብር በተሳካ ሁኔታ ተልኳል" },
  selectCategory: { en: "Select Category", am: "ምድብ ይምረጡ" },
  selectTime: { en: "Select Time", am: "ጊዜ ይምረጡ" },
  selectDate: { en: "Select Date", am: "ቀን ይምረጡ" },
  edit: { en: "Edit", am: "አርትዕ" },
  confirmDelete: { en: "Are you sure you want to delete this schedule?", am: "እርግጠኛ ነዎት ይህን መርሃ ግብር ማስወገድ ይፈልጋሉ?" },
  deleteSuccess: { en: "Schedule deleted successfully", am: "መርሃ ግብር በተሳካ ሁኔታ ተሰርዟል" },
  deleteError: { en: "Failed to delete schedule", am: "መርሃ ግብር ማስወገድ አልተሳካም" },
  uploading: { en: "Uploading...", am: "በማጫን ላይ..." },
  timeInvalid: { en: "Invalid time format", am: "ልክ ያልሆነ የጊዜ ቅርጸት" },
 


  permissionDenied: { en: "Permission denied: Please log in", am: "ፍቃድ ተከልክሏል፡ እባክዎ ይግቡ" },
  fetchSchedulesError: { en: "Failed to fetch schedules", am: "መርሃ ግብሮችን መግኘት አልተሳካም" },
  fetchStatsError: { en: "Failed to fetch stats", am: "ስታቲስቲክስ መግኘት አልተሳካም" },
  todaysSchedule: { en: "Today's Schedule", am: "የዛሬ መርሃ ግብር" },
  noSchedules: { en: "No schedules available", am: "ምንም መርሃ ግብሮች የሉም" },
  statsOverview: { en: "Stats Overview", am: "የስታቲስቲክስ አጠቃላይ እይታ" },
  chooseMessageType: { en: "Choose Message Type", am: "የመልእክት አይነት ይምረጡ" },
  publicMessage: { en: "Public Message", am: "የህዝብ መልእክት" },
  personalMessage: { en: "Personal Message", am: "የግል መልእክት" },
  messages: { en: "Messages", am: "መልእክቶች" },
  navigationError: { en: "Failed to navigate", am: "መጓዝ አልተሳካም" },
  welcomeMessage: { en: "Track progress, manage members, and grow your fitness community", am: "እድገትን ይከታተሉ፣ አባላትን ያስተዳድሩ፣ እና የአካል ብቃት ማህበረሰብዎን ያሳድጉ" },
  quickActions: { en: "Quick Actions", am: "ፈጣን ተግባራት" },
  profile: { en: "Profile", am: "መገለጫ" },
  changeMembers: { en: "+12% this month", am: "+12% በዚህ ወር" },
  changeClasses: { en: "+3 from yesterday", am: "+3 ከትናንት" },
  changeSignups: { en: "+15% this week", am: "+15% በዚህ ሳምንት" },
  changeRevenue: { en: "+7% this month", am: "+7% በዚህ ወር" },
  basic: { en: "Basic", am: "መሠረታዊ" },
  standard: { en: "Standard", am: "መደበኛ" },
  premium: { en: "Premium", am: "ፕሪሚየም" },
  vip: { en: "VIP", am: "ቪአይፒ" },
  error: { en: "an error", am: "ስህተት" },
  info: { en: "Info", am: "መረጃ" },
  warning: { en: "Warning", am: "ማስጠንቀቂያ" },
  // New translations for adminMessage/page.tsx
  fetchUsersError: { en: "Failed to fetch users", am: "ተጠቃሚዎችን መግኘት አልተሳካም" },
  fetchConversationUsersError: { en: "Failed to fetch conversations", am: "ውይይቶችን መግኘት አልተሳካም" },
  fetchError: { en: "Failed to fetch messages", am: "መልእክቶችን መግኘት አልተሳካም" },
  emptyMessage: { en: "Message cannot be empty", am: "መልእክት ባዶ መሆን አይችልም" },
  selectUser: { en: "Please select a user to message", am: "እባክዎ መልእክት ለመላክ ተጠቃሚ ይምረጡ" },
  messageSent: { en: "Message sent successfully", am: "መልእክት በተሳካ ሁኔታ ተልኳል" },
  sendError: { en: "Failed to send message", am: "መልእክት መላክ አልተሳካም" },
  noContent: { en: "No content", am: "ምንም ይዘት የለም" },
  noTimestamp: { en: "No timestamp", am: "ምንም የጊዜ ማህተም የለም" },
  noMessages: { en: "No messages yet. Start the conversation!", am: "ገና ምንም መልእክቶች የሉም። ውይይቱን ይጀምሩ!" },
  backToChats: { en: "Back to Chats", am: "ወደ ውይይቶች ተመለስ" },
  messagePlaceholder: { en: "Type a message...", am: "መልእክት ይተይቡ..." },
  conversationUsers: { en: "Conversations", am: "ውይይቶች" },
  noConversationUsers: { en: "No active conversations.", am: "ምንም ንቁ ውይይቶች የሉም።" },
  allUsers: { en: "All Users", am: "ሁሉም ተጠቃሚዎች" },
  noUsers: { en: "No users found.", am: "ምንም ተጠቃሚዎች አልተገኙም።" },
  newConversation: { en: "Start new conversation", am: "አዲስ ውይይት ጀምር" },
};

// Default translations to ensure all required keys are present
const defaultTranslations: Translation = {
  basic: "Basic",
  premium: "Premium",
  vip: "VIP",
  error: "an error",
  fetchUsersError: "Failed to fetch users",
  fetchConversationUsersError: "Failed to fetch conversations",
  fetchError: "Failed to fetch messages",
  emptyMessage: "Message cannot be empty",
  selectUser: "Please select a user to message",
  messageSent: "Message sent successfully",
  sendError: "Failed to send message",
  noContent: "No content",
  noTimestamp: "No timestamp",
  noMessages: "No messages yet. Start the conversation!",
  backToChats: "Back to Chats",
  messagePlaceholder: "Type a message...",
  searchPlaceholder: "Search conversations...",
  conversationUsers: "Conversations",
  noConversationUsers: "No active conversations.",
  allUsers: "All Users",
  noUsers: "No users found.",
  newConversation: "Start new conversation",
  dashboard: "Dashboard",
  members: "Members",
  classes: "Classes",
  settings: "Settings",
  logout: "Logout",
  profile: "Profile",
  adminDashboard: "Admin Dashboard",
  darkMode: "Dark Mode",
  uploadVideo: "Upload Video",
  registerMember: "Register Member",
  uploadSchedule: "Upload Schedule",
  activeMembers: "Active Members",
  classesToday: "Classes Today",
  newSignups: "New Signups",
  revenue: "Revenue",
  changeMembers: "+12% this month",
  changeClasses: "+3 from yesterday",
  changeSignups: "+15% this week",
  changeRevenue: "+7% this month",
  permissionDenied: "Please log in to access this page",
  fetchSchedulesError: "Failed to fetch schedules",
  fetchStatsError: "Failed to fetch stats",
  todaysSchedule: "Today's Schedule",
  loading: "Loading",
  noSchedules: "No schedules available",
  instructor: "Instructor",
  statsOverview: "Stats Overview",
  welcome: "Welcome",
  chooseMessageType: "Choose Message Type",
  publicMessage: "Public Message",
  personalMessage: "Personal Message",
  messages: "Messages",
  navigationError: "Failed to navigate",
  namePlaceholder: "Enter member's name",
  emailPlaceholder: "Enter your email",
  passwordPlaceholder: "Enter password",
  subadmin: "Subadmin",
  phonePlaceholder: "Enter phone number",
  addressPlaceholder: "Enter your address",
  registerButton: "Register Member",
  registrationSuccess: "Member registered successfully",
  registrationError: "Failed to register member",
  userDataNotFound: "User data not found",
  logoutSuccess: "Logged out successfully",
  logoutError: "Logout failed",
  welcomeMessage: "Track progress, manage members, and grow your fitness community",
  getStarted: "Get Started",
  quickActions: "Quick Actions",
  fixErrors: "Please fix the errors in the form",
  title: '',
  titleRequired: '',
  instructorRequired: '',
  date: '',
  description: '',
  category: '',
  categoryRequired: '',
  selectCategory: '',
  weeklySchedule: '',
  timeInvalid: '',
  timeRequired: '',
  upload: '',
  uploading: '',
  cancel: '',
  close: '',
  success: ''
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'am'>('en');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage === 'en' || storedLanguage === 'am') {
      setLanguage(storedLanguage);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const newLanguage = prev === 'en' ? 'am' : 'en';
      localStorage.setItem('language', newLanguage);
      return newLanguage;
    });
  };

  // Transform translations to a flat object based on the selected language
  const t: Translation = {
    ...defaultTranslations,
    ...Object.keys(translations).reduce((acc, key) => {
      acc[key] = translations[key][language];
      return acc;
    }, {} as Translation),
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageContext;
export type { Translation };