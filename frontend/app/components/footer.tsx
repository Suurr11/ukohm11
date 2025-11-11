"use client";
import React from "react";
import { motion } from "framer-motion";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 pt-16 pb-10 border-t border-gray-800 relative overflow-hidden">
      {/* 🔥 Efek gradasi atas */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-70"></div>

      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
        {/* 🏎️ Kategori Produk */}
        <div>
          <h3 className="text-white font-bold uppercase mb-4 tracking-widest text-base">
            Products
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href="/products"
                className="hover:text-[#E50914] transition-all"
              >
                Collections
              </a>
            </li>
            <li>
              <a
                href="/products?limited=true"
                className="hover:text-[#E50914] transition-all"
              >
                Limited Editions
              </a>
            </li>
          </ul>
        </div>

        {/* 🏁 Scale Diecast */}
        <div>
          <h3 className="text-white font-bold uppercase mb-4 tracking-widest text-base">
            Scale Diecast
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href="/products?scale=1:64"
                className="hover:text-[#E50914] transition-all"
              >
                Scale 1:64
              </a>
            </li>
            <li>
              <a
                href="/products?scale=1:43"
                className="hover:text-[#E50914] transition-all"
              >
                Scale 1:43
              </a>
            </li>
            <li>
              <a
                href="/products?scale=1:18"
                className="hover:text-[#E50914] transition-all"
              >
                Scale 1:18
              </a>
            </li>
            <li>
              <a
                href="/products?scale=1:24"
                className="hover:text-[#E50914] transition-all"
              >
                Scale 1:24
              </a>
            </li>
            <li>
              <a
                href="/products?scale=1:12"
                className="hover:text-[#E50914] transition-all"
              >
                Scale 1:12
              </a>
            </li>
          </ul>
        </div>

        {/* 🧭 Company */}
        <div>
          <h3 className="text-white font-bold uppercase mb-4 tracking-widest text-base">
            Company
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href="/about"
                className="hover:text-[#E50914] transition-all"
              >
                About Motasera
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="hover:text-[#E50914] transition-all"
              >
                Contact Us
              </a>
            </li>
            <li>
              <a
                href="/philosophy"
                className="hover:text-[#E50914] transition-all"
              >
                Our Philosophy
              </a>
            </li>
          </ul>
        </div>

        {/* 🔥 Sosial Media */}
        <div className="flex flex-col items-start md:items-end">
          <h3 className="text-white font-bold uppercase mb-4 tracking-widest text-base">
            Follow Us
          </h3>
          <div className="flex gap-5">
            <motion.a
              whileHover={{ scale: 1.2 }}
              href="https://www.instagram.com/scuderiaferrari/"
              aria-label="Instagram"
              className="hover:text-[#E50914] transition-colors"
            >
              <Instagram className="w-6 h-6" />
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.2 }}
              href="https://www.facebook.com/Ferrari/"
              aria-label="Facebook"
              className="hover:text-[#E50914] transition-colors"
            >
              <Facebook className="w-6 h-6" />
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.2 }}
              href="https://twitter.com/scuderiaferrari/"
              aria-label="Twitter"
              className="hover:text-[#E50914] transition-colors"
            >
              <Twitter className="w-6 h-6" />
            </motion.a>
          </div>
        </div>
      </div>

      {/* 🔥 Garis bawah animasi */}
      <div className="mt-12 h-[1.5px] w-[85%] mx-auto bg-gradient-to-r from-transparent via-[#E50914] to-transparent animate-pulse rounded-full"></div>

      {/* 🔥 Logo bawah */}
      <div className="flex flex-col items-center mt-10 text-center">
        <img
          src="/images/whitelogo.png"
          alt="MOTASERA Logo"
          className="w-16 h-16 mb-2 opacity-80 hover:opacity-100 transition-all duration-300"
        />
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()}{" "}
          <span className="text-white font-semibold">MOTASERA</span>. All Rights
          Reserved.
        </p>
      </div>
    </footer>
  );
}
