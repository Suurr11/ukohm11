"use client";
import React from "react";
import { motion } from "framer-motion";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

export default function PhilosophyPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />

      {/* Our Philosophy */}
      <section className="relative flex flex-col md:flex-row items-center justify-center py-24 overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
          className="relative w-full md:w-1/2 h-96 md:h-[600px] overflow-hidden"
        >
          <motion.img
            src="/images/headlight.png"
            alt="Headlight"
            className="absolute inset-0 w-full h-full object-cover object-left brightness-[1.3]"
            initial={{ scale: 1.12, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <motion.div
            className="absolute left-[15%] top-[60%] w-24 h-12 bg-white/40 blur-3xl rounded-full"
            animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/70 to-black" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 text-center md:text-left px-8 md:pl-16 z-10"
        >
          <motion.h1
            className="text-4xl font-bold mb-6 text-[#E50914] uppercase tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            Our Philosophy
          </motion.h1>
          <motion.p
            className="text-gray-300 text-lg leading-relaxed max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Setiap detail di Motasera dirancang dengan semangat otomotif sejati.
            Kami percaya bahwa diecast bukan sekadar miniatur — melainkan karya seni
            yang menghidupkan performa, presisi, dan warisan motorsport dalam skala kecil.
            Di setiap lekukan logamnya, ada jiwa kecepatan yang nyata.
          </motion.p>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
