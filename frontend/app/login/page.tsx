"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/api/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react"; // + import icon
import ReCAPTCHA from "react-google-recaptcha"; // + import

export default function LoginPage() {
  const router = useRouter();

  // 🧩 State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPwd, setShowPwd] = useState(false); // + visibility toggle
  const [successMessage, setSuccessMessage] = useState(""); // + state notifikasi sukses
  const [captchaToken, setCaptchaToken] = useState<string | null>(null); // + state captcha

  // Ganti cara baca siteKey
  const rawSiteKey = (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "").trim();
  const siteKeyValid = rawSiteKey.length > 0;

  // 🏞 Backgrounds
  const backgrounds = [
    "/images/bmwlemans.png",
    "/images/bmwwallpaper.png",
    "/images/bul.png",
    "/images/nurburgring.png",
  ];
  const [bgIndex, setBgIndex] = useState(0);

  // 🔁 Ganti background tiap 5 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // + auto hilangkan notifikasi
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  // 📩 Login manual (email & password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (siteKeyValid && !captchaToken) {
      setErrorMessage("Please verify the CAPTCHA before login.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      // + sertakan captcha ke payload
      const res = await api.post("/login", {
        email,
        password,
        ...(siteKeyValid ? { captcha: captchaToken } : {}),
      });

      // + jika response berisi token -> admin, langsung masuk
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("welcome_name", res.data.user?.name || "");
        window.dispatchEvent(new Event("authChanged"));
        router.push("/");
        return;
      }

      // + jika response berisi email -> OTP dikirim, arahkan ke halaman OTP
      if (res.data?.email) {
        router.push(`/otp?email=${encodeURIComponent(res.data.email)}`);
        return;
      }

      // fallback
      setErrorMessage(res.data?.message || "Login failed. Try again.");
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Email or password incorrect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage("Please enter your email first.");
      return;
    }

    try {
      await api.post("/forgot-password", { email });
      alert("Password reset link has been sent to your email.");
    } catch {
      setErrorMessage("Failed to send password reset email.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 🔁 Background transition */}
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

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md bg-[#111]/90 rounded-2xl p-8 shadow-2xl border border-gray-800"
        >
          <h2 className="text-3xl font-bold text-center mb-6 text-white">Welcome Back</h2>

          {/* + Notifikasi sukses */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 text-center bg-green-600 text-white text-sm font-semibold py-2 rounded-md shadow-md"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-center bg-red-600 text-white text-sm font-semibold py-2 rounded-md shadow-md"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-white"
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"} // + toggle type
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-12 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-white"
                  required
                  placeholder="Enter your password"
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

            {/* ReCAPTCHA */}
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
                NEXT_PUBLIC_RECAPTCHA_SITE_KEY tidak terbaca di frontend. Tambahkan ke frontend/.env.local lalu restart dev server.
              </p>
            )}

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/email-pass"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="px-3 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* Google Login */}
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const token = credentialResponse.credential;
                const res = await axios.post("http://127.0.0.1:8000/api/auth/google", { token });

                if (res.status === 200) {
                  localStorage.setItem("token", res.data.token);
                  localStorage.setItem("welcome_name", res.data.user?.name || ""); // + simpan nama
                  window.dispatchEvent(new Event("authChanged")); // + trigger
                  setSuccessMessage(`welcome ${res.data.user?.name || ""}`); // (opsional)
                  router.push("/");
                }
              } catch (err) {
                console.error(err);
                setErrorMessage("Google login failed. Please try again.");
              }
            }}
            onError={() => setErrorMessage("Google login failed. Please try again.")}
          />

          <p className="text-center text-sm text-gray-400 mt-6">
            Don’t have an account?{" "}
            <Link href="/register" className="text-white hover:underline">
              Register now
            </Link>
          </p>
        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
}
