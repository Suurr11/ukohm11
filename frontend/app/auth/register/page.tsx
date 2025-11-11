"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const [currentBg, setCurrentBg] = useState(0);
  const backgrounds = [
    "/images/bul.png",
    "/images/cota.png",
    "/images/start.png",
    "/images/bmwlemans.png",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden bg-black">
      {/* ✨ Crossfade Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBg}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${backgrounds[currentBg]}')` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* 🌙 Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/80" />

      {/* 🧩 Card */}
      <motion.div
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-10 w-full max-w-md relative z-10 border border-white/20"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* 🔥 Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/motasera.png"
            alt="Motasera Logo"
            className="w-20 h-auto object-contain drop-shadow-md"
          />
        </div>

        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 tracking-wide">
          Create Account
        </h2>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E50914] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E50914] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E50914] outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#E50914] text-white py-3 rounded-lg font-semibold tracking-wide hover:bg-black transition-all duration-300"
          >
            Register
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[#E50914] font-semibold hover:underline transition"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
