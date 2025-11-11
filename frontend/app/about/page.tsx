"use client";
import React from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { motion } from "framer-motion";

export default function AboutPage() {
  const features = [
    {
      title: "Misi Kami",
      desc:
        "Menciptakan karya yang akurat dan tahan lama agar kolektor merasa bangga setiap kali memajangnya.",
    },
    {
      title: "Craftsmanship",
      desc:
        "Proses terkurasi: pemilihan material, pengecatan, hingga inspeksi akhir untuk kualitas konsisten.",
    },
    {
      title: "Sustainability",
      desc:
        "Mengupayakan proses efisien dan pengemasan yang ramah lingkungan tanpa kompromi kualitas.",
    },
  ];

  const values = ["Detail-Oriented", "Authentic", "Premium", "Collectible"];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8F9] text-black">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-14">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-[#E50914]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-black/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              About Motasera
            </h1>
            <p className="mt-4 text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              Kami merancang diecast berkualitas dengan fokus pada presisi, material premium,
              dan pengalaman koleksi yang memuaskan. Setiap detail merepresentasikan semangat motorsport.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="pb-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats + Values */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-white border border-gray-200 p-6 md:p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-extrabold text-gray-900">+5</p>
                <p className="text-xs text-gray-500 mt-1">Tahun Berkarya</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-gray-900">200+</p>
                <p className="text-xs text-gray-500 mt-1">Model Dirilis</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-gray-900">98%</p>
                <p className="text-xs text-gray-500 mt-1">Kepuasan Pelanggan</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-gray-900">30+</p>
                <p className="text-xs text-gray-500 mt-1">Kolaborasi Brand</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {values.map((v) => (
                <span
                  key={v}
                  className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {v}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-gradient-to-br from-black to-gray-900 p-8 md:p-10 text-white text-center"
          >
            <h3 className="text-2xl md:text-3xl font-bold">Jelajahi Koleksi Kami</h3>
            <p className="mt-2 text-sm md:text-base text-white/80">
              Temukan model yang paling merepresentasikan gaya dan semangat Anda.
            </p>
            <a
              href="/products"
              className="inline-block mt-5 px-6 py-3 rounded-md bg-[#E50914] hover:bg-white hover:text-black transition font-semibold"
            >
              Lihat Produk
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
