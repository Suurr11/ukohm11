'use client'

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/api/api"; // pastikan sudah ada endpoint forgot-password
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Background images animasi
  const backgrounds = [
    "images/bmwlemans.png",
    "images/bmwwallpaper.png",
    "images/bul.png",
    "images/nurburgring.png",
  ];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await api.post("/forgot-password", { email });
      // redirect ke halaman reset-password (OTP)
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Gagal mengirim OTP. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 🔁 Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bgIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
        />
      </AnimatePresence>

      {/* 🔥 Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* 🧾 Forgot Password Form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-[#111]/90 rounded-2xl p-8 shadow-2xl border border-gray-800"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Reset Password
        </h2>

        {/* 🔴 Error Notification */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center bg-red-600 text-white text-sm font-semibold py-2 rounded-md shadow-md"
          >
            {errorMessage}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-white"
              placeholder="Masukkan email Anda"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all"
          >
            {loading ? "Mengirim OTP..." : "Kirim OTP"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
