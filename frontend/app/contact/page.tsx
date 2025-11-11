"use client";
import React from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#ECECEC] text-black">
      <Header />
      <main className="flex-grow flex items-center justify-center px-6 py-20">
        <motion.div
          className="max-w-2xl w-full bg-white shadow-lg rounded-2xl p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-6 text-center">Contact Us</h1>
          <p className="text-lg text-center text-gray-700 mb-8">
            Hubungi kami untuk pertanyaan, kolaborasi, atau dukungan pelanggan.
          </p>

          <form className="space-y-4">
            <input
              type="text"
              placeholder="Nama Anda"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="email"
              placeholder="Email Anda"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <textarea
              placeholder="Pesan Anda"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Kirim Pesan
            </button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
