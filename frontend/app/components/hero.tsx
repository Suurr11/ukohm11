import React, { useRef, useState } from "react";


export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const videos = ["/images/car3.mp4", "/images/car4.mp4"];

  const handleEnded = () => {
    if (videoIndex < videos.length - 1) {
      setVideoIndex(videoIndex + 1);
    } else {
      // Ulang dari awal
      setVideoIndex(0);
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
      {/* 🎥 Background video */}
      <video
        key={videoIndex} // penting agar video reload saat berganti
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop={false}
        muted
        playsInline
        onEnded={handleEnded}
      >
        <source src={videos[videoIndex]} type="video/mp4" />
      </video>

      {/* Overlay dengan animasi */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/50 transition-all duration-[4000ms] ease-in-out"
      />

      {/* 📝 Konten teks */}
      <div className="relative z-10 px-4">
        <h1 className="text-4xl md:text-6xl font-semibold mb-6">
          Built for Performance. Designed for Life.
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-200">
          Innovation meets capability — explore our range of vehicles and services.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/products"
            className="border-2 border-white text-white px-6 py-3 rounded-md font-semibold bg-transparent hover:bg-white hover:text-black transition duration-300"
          >
            Explore More
          </a>
        </div>
      </div>
    </section>
  );
}
