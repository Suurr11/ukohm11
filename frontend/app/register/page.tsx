"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/api/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react"; // + import icon
import ReCAPTCHA from "react-google-recaptcha"; // + import

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showPwd, setShowPwd] = useState(false); // visibility toggle
  const [captchaToken, setCaptchaToken] = useState<string | null>(null); // + captcha state

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // hanya huruf dan spasi untuk name (dukung unicode)
    if (e.target.name === "name") {
      const v = e.target.value.replace(/[^\p{L}\s]/gu, "");
      setFormData({ ...formData, name: v });
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // + sitekey guard
  const rawSiteKey = (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "").trim();
  const siteKeyValid = rawSiteKey.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    // + validate captcha only when key exists
    if (siteKeyValid && !captchaToken) {
      setErrorMessage("Please verify the CAPTCHA before registering.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/register", {
        ...formData,
        ...(siteKeyValid ? { captcha: captchaToken } : {}), // + include captcha
      });
      router.push(`/otp?email=${encodeURIComponent(res.data.email)}`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Registration failed. Try again.");
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
          style={{
            backgroundImage: `url(${backgrounds[bgIndex]})`,
          }}
        ></motion.div>
      </AnimatePresence>

      {/* 🔥 Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* 🧾 Register Form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-[#111]/90 rounded-2xl p-8 shadow-2xl border border-gray-800"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Create Your Account
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
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              // batasi huruf dan spasi (pattern sederhana, sanitasi sudah unicode di onChange)
              pattern="^[A-Za-z\s]+$"
              title="Nama hanya boleh huruf dan spasi"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-white"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-white"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"} // toggle type
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-12 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-white"
                placeholder="Minimum 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-700"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 🧩 reCAPTCHA */}
          {siteKeyValid ? (
            <div className="flex justify-center">
              <div className="scale-[0.95] md:scale-100">
                <ReCAPTCHA
                  sitekey={rawSiteKey}
                  onChange={(token: string | null) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-yellow-300 text-center">
              NEXT_PUBLIC_RECAPTCHA_SITE_KEY tidak terbaca di frontend. Tambahkan ke frontend/.env.local lalu restart.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
