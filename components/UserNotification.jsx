import { Bell } from "lucide-react";

function UserNotification({ count, isHighContrast }) {
  return (
    <div className="relative group">
      <Bell
        size={24}
        className={`${
          isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-indigo-600"
        } cursor-pointer transition-colors duration-200`}
      />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {count}
        </span>
      )}
      <div
        className={`absolute right-0 mt-3 w-64 ${
          isHighContrast ? "bg-gray-700 text-white" : "bg-white text-gray-700"
        } rounded-lg shadow-xl hidden group-hover:block z-10 transition-opacity duration-200`}
      >
        <div className="p-3 text-sm border-b">New class schedule added</div>
        <div className="p-3 text-sm">Trainer feedback received</div>
      </div>
    </div>
  );
}

export default UserNotification;