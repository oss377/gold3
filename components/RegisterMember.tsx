"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { db } from "../app/fconfig";
import { addDoc, collection } from "firebase/firestore";

interface RegisterMemberProps {
  isOpen: boolean;
  onClose: () => void;
  isHighContrast: boolean;
}

export default function RegisterMember({ isOpen, onClose, isHighContrast }: RegisterMemberProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    membership: "Subadmin",
    status: "Active",
    statusColor: "text-green-500",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "members"), {
        ...formData,
        timestamp: new Date(),
      });
      await addDoc(collection(db, "notifications"), {
        text: `New member registered: ${formData.name}`,
        timestamp: new Date(),
      });
      setFormData({
        name: "",
        email: "",
        password: "",
        membership: "Subadmin",
        status: "Active",
        statusColor: "text-green-500",
      });
      onClose();
    } catch (error) {
      console.error("Error registering member:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`${
          isHighContrast ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } rounded-xl p-6 w-full max-w-md shadow-xl`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Register New Member</h3>
          <button
            onClick={onClose}
            className={`${
              isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full p-2 rounded-lg ${
                isHighContrast
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full p-2 rounded-lg ${
                isHighContrast
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full p-2 rounded-lg ${
                isHighContrast
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Membership Type</label>
            <select
              name="membership"
              value={formData.membership}
              onChange={handleInputChange}
              className={`w-full p-2 rounded-lg ${
                isHighContrast
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              required
            >
              <option value="">Select Membership</option>
              <option value="Subadmin">Subadmin</option>
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg ${
                isHighContrast
                  ? "bg-gray-600 text-white hover:bg-gray-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              } transition-colors duration-200`}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}