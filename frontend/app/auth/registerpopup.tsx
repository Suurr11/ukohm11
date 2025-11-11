"use client";
import { motion } from "framer-motion";

interface RegisterPopupProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
}

export default function RegisterPopup({ onSwitchToLogin, onClose }: RegisterPopupProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle register logic here
    console.log("Register submitted");
  };

  return (
    <motion.div
      className="absolute right-0 top-full mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-2xl font-bold text-gray-800">Register</h3>
        <div className="w-10 h-10 bg-[#E50914]/10 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="#E50914"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
            />
          </svg>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            placeholder="Choose a username"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent text-gray-800 transition"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent text-gray-800 transition"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="Create a password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent text-gray-800 transition"
            required
          />
        </div>
        
        <label className="flex items-start gap-2 cursor-pointer text-sm">
          <input 
            type="checkbox" 
            className="w-4 h-4 mt-0.5 accent-[#E50914]" 
            required 
          />
          <span className="text-gray-600">
            I agree to the{" "}
            <button type="button" className="text-[#E50914] font-semibold hover:underline">
              Terms & Conditions
            </button>
          </span>
        </label>

        <button
          type="submit"
          className="w-full bg-[#E50914] text-white py-3 rounded-lg font-semibold hover:bg-[#c50812] transition shadow-md hover:shadow-lg"
        >
          Create Account
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">OR</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 text-center">
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          className="text-[#E50914] font-bold hover:underline"
        >
          Login
        </button>
      </p>
    </motion.div>
  );
}