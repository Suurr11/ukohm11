"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/app/api/api";
import ReCAPTCHA from "react-google-recaptcha"; // + import reCAPTCHA

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bgIndex, setBgIndex] = useState(0);

  // + reCAPTCHA state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // 🖼️ Background slideshow
  const backgrounds = [
    "/images/bmwlemans.png",
    "/images/bmwwallpaper.png",
    "/images/bul.png",
    "/images/nurburgring.png",
  ];

  // 🎞️ Ganti background tiap 6 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // + site key (sama seperti login user)
  const rawSiteKey = (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "").trim();
  const siteKeyValid = rawSiteKey.length > 0;

  // 🔐 Login handler (khusus admin)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // + validasi reCAPTCHA
    if (siteKeyValid && !captchaToken) {
      setError("Please verify the CAPTCHA first.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/login", {
        email,
        password,
        ...(siteKeyValid ? { captcha: captchaToken } : {}),
      });

      const { user, token } = res.data;
      if (!token) throw new Error("Please verify your OTP before logging in.");
      if (!user || user.role !== "admin") throw new Error("Access denied: You are not an admin.");

      // 🔑 Simpan token admin
      localStorage.setItem("token_admin", token);

      // ❌ Pastikan tidak bentrok dengan token user biasa
      localStorage.removeItem("token");
      router.replace("/admin");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed");
      // + reset token bila gagal
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 🎬 Background Transition */}
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

      {/* 🌫️ Dark overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />

      {/* 🧊 Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-[#0f0f0f]/90 border border-gray-800/60 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
      >
        <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-wide">
          Admin Login
        </h1>
        <p className="text-center text-gray-400 mb-6">
          Sign in to access your control panel
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-600/90 text-white text-sm font-semibold py-2 px-3 rounded-lg text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/70 border border-gray-700 text-gray-200 focus:outline-none focus:border-red-500 transition-all"
              required
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/70 border border-gray-700 text-gray-200 focus:outline-none focus:border-red-500 transition-all"
              required
              placeholder="••••••••"
            />
          </div>

          {/* + reCAPTCHA (replace image captcha) */}
          {siteKeyValid ? (
            <div className="flex justify-center">
              <div className="scale-[0.95] md:scale-100">
                <ReCAPTCHA
                  sitekey={rawSiteKey}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-yellow-400 text-center">
              NEXT_PUBLIC_RECAPTCHA_SITE_KEY belum di-set. Tambahkan ke .env dan restart.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:opacity-90 transition-all duration-200"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Restricted access for{" "}
          <span className="text-white font-semibold">administrators only</span>.
        </p>
      </motion.div>
    </div>
  );
}
