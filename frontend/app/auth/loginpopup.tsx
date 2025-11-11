"use client";
import { motion } from "framer-motion";
import Link from "next/link";

interface LoginPopupProps {
  onClose: () => void;
}

export default function LoginPopup({ onClose }: LoginPopupProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login submitted");
  };

  return (
    <motion.div
      className="absolute right-0 top-full w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-2xl font-bold text-gray-800">Login</h3>
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
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
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
            placeholder="Enter your username"
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
            placeholder="Enter your password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent text-gray-800 transition"
            required
          />
        </div>
        
        <div className="flex items-center justify-between text-sm mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-[#E50914]" />
            <span className="text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            className="text-[#E50914] font-semibold hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-[#E50914] text-white py-3 rounded-lg font-semibold hover:bg-[#c50812] transition shadow-md hover:shadow-lg mt-2"
        >
          Login
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
        Don't have an account?{" "}
        <Link 
          href="/auth/register" 
          className="text-[#E50914] font-bold hover:underline"
          onClick={onClose}
        >
          Register
        </Link>
      </p>
    </motion.div>
  );
}