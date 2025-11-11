"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import Header from "../components/header";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import api from "@/app/api/api";

export default function ProfilePage() {
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    photo_url: "",
  });
  const [primaryAddress, setPrimaryAddress] = useState("Memuat alamat...");

  // 🔹 Ambil data profil user dan alamat utama
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        if (!mounted) return;
        setProfile({ name: "", email: "", photo_url: "" });
        setPrimaryAddress("Belum ada alamat utama");
        return;
      }

      try {
        const [userRes, addrRes] = await Promise.allSettled([
          api.get("/user"),
          api.get("/addresses/primary"),
        ]);

        if (mounted && userRes.status === "fulfilled") {
          const u = userRes.value.data?.user ?? null;
          if (u) {
            setProfile({
              name: u.name || "",
              email: u.email || "",
              photo_url: u.photo_url || "",
            });
          }
        }

        if (mounted && addrRes.status === "fulfilled") {
          const addr =
            addrRes.value.data?.address ?? addrRes.value.data?.data ?? null;
          if (!addr) {
            setPrimaryAddress("Belum ada alamat utama");
          } else if (typeof addr === "string") {
            setPrimaryAddress(addr);
          } else {
            const parts = [
              addr.street,
              addr.city,
              addr.postal_code,
              addr.country,
            ]
              .filter(Boolean)
              .join(", ");
            setPrimaryAddress(parts || "Belum ada alamat utama");
          }
        }
      } catch (err) {
        console.error("❌ Gagal memuat profil atau alamat utama:", err);
        if (mounted) {
          setPrimaryAddress("Belum ada alamat utama");
        }
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  // 🔹 Upload foto profil
  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("❌ Anda belum login!");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      setUploading(true);
      const res = await api.post("/user/photo", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile((prev) => ({ ...prev, photo_url: res.data.photo_url }));
      alert("✅ Foto profil berhasil diperbarui!");
    } catch (err) {
      console.error("❌ Upload foto gagal:", err);
      alert("❌ Upload foto gagal!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-[#F7F8FA] flex flex-col items-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header />

      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-2xl mt-28 border border-gray-100">
        <h1 className="text-4xl font-extrabold text-center text-black mb-10 tracking-wide">
          Account Details
        </h1>

        {/* FOTO PROFIL */}
        <div className="relative w-36 h-36 mx-auto mb-6">
          <img
            src={
              profile.photo_url && profile.photo_url.startsWith("http")
                ? profile.photo_url
                : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
            }
            alt="Profile"
            className="w-36 h-36 object-cover rounded-full border-4 border-gray-300 shadow-md"
          />
          <label
            htmlFor="photo-upload"
            className="absolute bottom-1 right-1 bg-black text-white rounded-full p-2 cursor-pointer hover:bg-gray-800 transition"
          >
            <Camera size={18} />
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        </div>

        {uploading && (
          <p className="text-center text-gray-600 text-sm mb-4 animate-pulse">
            ⏳ Uploading photo...
          </p>
        )}

        {/* TAMPILAN PROFIL */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-3 text-black">
          <p>
            <strong>Nama:</strong> {profile.name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Alamat Utama:</strong> {primaryAddress}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
