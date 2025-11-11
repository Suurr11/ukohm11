"use client";
import Header from "./components/header";
import Hero from "./components/hero";
import Footer from "./components/footer";
import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const features = [
    {
      name: "Unmatched Precision",
      desc: "Setiap detail dibuat dengan akurasi tinggi, merepresentasikan performa nyata di lintasan.",
      image: "/images/senna1.png",
    },
    {
      name: "Exclusive Editions",
      desc: "Diproduksi dalam jumlah terbatas, setiap unit membawa nilai koleksi yang istimewa.",
      image: "/images/nissanr34.png",
    },
    {
      name: "Authentic Craftsmanship",
      desc: "Dari bahan hingga finishing, setiap karya Motasera dibuat untuk sempurna.",
      image: "/images/porsche911.png",
    },
  ];

  // 🔁 Pastikan video selalu play dan loop dengan benar
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.loop = true;
      video.play().catch((err) => console.error("Video autoplay error:", err));
    }
  }, []);

  return (
    <main className="bg-black text-white overflow-hidden">
      <Header />
      <Hero />

      {/* 🎬 WHERE ARTS MEET AUTOMOTIVE */}
      <section className="relative py-40 text-center px-6 overflow-hidden">
        {/* 🔥 Background Video looping terus tanpa berhenti */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          loop
        >
          <source src="/images/f1nyoba.mp4" type="video/mp4" />
        </video>

        {/* Overlay gelap agar teks tetap terbaca */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Konten depan */}
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold mb-6 uppercase text-[#E50914] tracking-wide"
          >
            WHERE ARTS MEET AUTOMOTIVE
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-gray-300 max-w-4xl mx-auto mb-16 text-xl leading-relaxed"
          >
            
          </motion.p>

          {/* 🔻 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative group overflow-hidden rounded-2xl cursor-pointer bg-[#111]/80 backdrop-blur-sm"
              >
                <motion.img
                  src={f.image}
                  alt={f.name}
                  className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-[#E50914]/70 transition-all duration-500"></div>

                <motion.div
                  className="absolute bottom-8 left-8 right-8 text-left"
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  <h3 className="text-2xl font-semibold mb-2 group-hover:text-[#E50914] transition-colors duration-500">
                    {f.name}
                  </h3>
                  <p className="text-base text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {f.desc}
                  </p>
                </motion.div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 ring-1 ring-[#E50914]/40 blur-sm"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🏁 MOTASERA PHILOSOPHY */}
      <section className="relative flex flex-col md:flex-row items-center justify-center py-24 bg-black overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="relative w-full md:w-1/2 h-96 md:h-[600px] overflow-hidden"
        >
          <motion.img
            src="/images/headlight.png"
            alt="Headlight"
            className="absolute inset-0 w-full h-full object-cover object-left brightness-[1.3]"
            initial={{ scale: 1.15, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
          <motion.div
            className="absolute left-[15%] top-[60%] w-24 h-12 bg-white/40 blur-3xl rounded-full"
            animate={{
              opacity: [0.6, 0.9, 0.6],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/70 to-black"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="md:w-1/2 text-center md:text-left px-8 md:pl-16 z-10"
        >
          <motion.h2
            className="text-4xl font-bold mb-6 text-[#E50914] uppercase tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          >
            Motasera Philosophy
          </motion.h2>
          <motion.p
            className="text-gray-300 text-lg leading-relaxed max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Setiap detail di Motasera dirancang dengan semangat otomotif sejati.
            Kami percaya bahwa diecast bukan sekadar miniatur — melainkan karya seni
            yang menghidupkan performa, presisi, dan warisan motorsport dalam
            skala kecil. Di setiap lekukan logamnya, ada jiwa kecepatan yang nyata.
          </motion.p>
        </motion.div>
      </section>

      

      <Footer />
    </main>
  );
}
