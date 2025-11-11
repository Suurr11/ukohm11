"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/app/api/api";

export default function OtpPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // 🔁 Background slideshow
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

  // 🧩 Handle OTP verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      // + normalisasi OTP sebelum kirim
      const cleanOtp = otp.replace(/\D/g, "").slice(0, 6);
      const res = await api.post("/verify-otp", { email, otp: cleanOtp });
      localStorage.setItem("token", res.data.token);
      router.push("/"); // redirect to home or dashboard
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Invalid or expired OTP code!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend OTP with cooldown
  const handleResend = async () => {
    if (!email || resendLoading || cooldown > 0) return;
    try {
      setResendLoading(true);
      setErrorMessage("");
      await api.post("/resend-otp", { email });
      // start cooldown (e.g., 30s)
      setCooldown(30);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Gagal mengirim ulang OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

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
          style={{
            backgroundImage: `url(${backgrounds[bgIndex]})`,
          }}
        ></motion.div>
      </AnimatePresence>

      {/* 🌑 Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* 🧾 OTP Verification Form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-[#111]/90 rounded-2xl p-8 shadow-2xl border border-gray-800"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Verify Your OTP
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

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">
              Enter OTP Code
            </label>
            <input
              type="text"
              inputMode="numeric" // + tampilkan keypad numeric di mobile
              autoComplete="one-time-code" // + dukung auto-fill OTP
              pattern="\d{6}" // + validasi 6 digit
              value={otp}
              onChange={(e) => {
                // + hanya digit, maksimal 6
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(v);
              }}
              onPaste={(e) => {
                // + bersihkan saat paste
                e.preventDefault();
                const text = e.clipboardData.getData("text") || "";
                const v = text.replace(/\D/g, "").slice(0, 6);
                setOtp(v);
              }}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-center text-lg focus:outline-none focus:border-white tracking-widest"
              placeholder="6-digit code"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Didn’t receive the code?{" "}
          <button
            onClick={handleResend}
            disabled={resendLoading || cooldown > 0}
            className={`underline ${
              resendLoading || cooldown > 0
                ? "text-gray-500 cursor-not-allowed"
                : "text-blue-400 hover:text-blue-300"
            }`}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
