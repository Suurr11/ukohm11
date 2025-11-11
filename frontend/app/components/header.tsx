"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import api from "@/app/api/api"; // ✅ untuk fetch produk suggestion
import toast, { Toaster } from "react-hot-toast"; // + toast global

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]); // ✅ hasil pencarian
  const [userName, setUserName] = useState<string | null>(null); // + nama user

  const router = useRouter();
  const pathname = usePathname();
  const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8000"; // + base URL

  // ✅ sinkronisasi login state
  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("token")));
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setIsLoggedIn(Boolean(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  // + Ambil nama user saat login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserName(null);
      return;
    }
    (async () => {
      try {
        const res = await api.get("/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const u = res.data?.user;
        setUserName(u?.name || null);
      } catch {
        setUserName(null);
      }
    })();
  }, [isLoggedIn, pathname]);

  // + Tampilkan toast welcome setelah login
  useEffect(() => {
    const showWelcome = () => {
      const name = localStorage.getItem("welcome_name");
      if (name) {
        toast.success(`welcome ${name}`, { duration: 3000 });
        localStorage.removeItem("welcome_name");
      }
    };
    showWelcome(); // cek saat mount (mis. setelah redirect dari login)
    const handler = () => showWelcome();
    window.addEventListener("authChanged", handler);
    return () => window.removeEventListener("authChanged", handler);
  }, []);

  // ✅ fungsi cari produk
  const handleSearch = () => {
    if (searchQuery.trim() === "") return;
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    setSearchMode(false);
    setSuggestions([]); // hilangkan suggestion setelah enter
  };

  // ✅ auto-suggestion: muncul sesuai huruf yang diketik
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await api.get(`/products`);
        const allProducts = res.data;
        const filtered = allProducts.filter((p: any) =>
          p.nama_product.toLowerCase().startsWith(searchQuery.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 5)); // maksimal 5 hasil
      } catch (err) {
        console.error("Gagal memuat saran:", err);
      }
    };

    const delayDebounce = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <>
      {/* 🔝 HEADER UTAMA */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#ECECEC]/90 text-black backdrop-blur-sm shadow-sm h-[72px] flex items-center">
        <nav className="container mx-auto flex items-center justify-between px-6 relative">
          {/* ☰ SIDEBAR BUTTON */}
          <button
            className="text-3xl font-bold absolute left-6 md:left-10 cursor-pointer transition hover:scale-110"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          {/* 🔥 LOGO */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl uppercase mx-auto relative overflow-visible"
          >
            <img
              src="/images/motasera.png"
              alt="Logo"
              className="w-22 h-22 object-contain -mt-2"
            />
          </Link>

          {/* 🧭 IKON KANAN */}
          <div className="absolute right-6 md:right-10 flex items-center gap-5">
            {/* 🔍 SEARCH */}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setSearchMode(!searchMode)}
                aria-label="Search"
                className="cursor-pointer hover:text-[#E50914] transition hover:scale-110"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.6}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35"
                  />
                </svg>
              </button>

              {/* 🔤 SEARCH INPUT ANIMASI */}
              <AnimatePresence>
                {searchMode && (
                  <motion.div
                    className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center w-[200px] md:w-[280px] bg-white rounded-full shadow px-3 py-1 border border-gray-300 focus-within:ring-2 focus-within:ring-black-800 relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm caret-black"
                        autoFocus
                      />
                      <button
                        onClick={handleSearch}
                        className="text-lg hover:text-[#E50914] transition cursor-pointer mr-2"
                        aria-label="Search"
                      >
                        
                      </button>
                      <button
                        onClick={() => {
                          setSearchMode(false);
                          setSuggestions([]);
                        }}
                        className="text-lg hover:text-[#E50914] transition cursor-pointer"
                        aria-label="Close search"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 🧠 DAFTAR SARAN PRODUK (dengan gambar & lebih besar) */}
                    {suggestions.length > 0 && (
                      <ul className="absolute top-full mt-3 w-[280px] bg-white border border-gray-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {suggestions.map((item) => (
                          <li
                            key={item.id}
                            onClick={() => {
                              router.push(`/products/${item.id}`);
                              setSearchMode(false);
                              setSuggestions([]);
                            }}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer transition-all"
                          >
                            <img
                              src={`${APP_BASE_URL}/storage/images/${item.foto}`}
                              alt={item.nama_product}
                              className="w-12 h-12 object-cover rounded-md border border-gray-200"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.onerror = null;
                                img.src = "/no-image.png";
                              }}
                            />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-semibold text-gray-800 truncate">
                                {item.nama_product}
                              </span>
                              <span className="text-xs text-gray-500 truncate">
                                {new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  maximumFractionDigits: 0,
                                }).format(item.harga)}
                              </span>
                              {/* + deskripsi singkat di bawah nama */}
                              {item.deskripsi && (
                                <span className="text-[11px] text-gray-400 truncate">
                                  {item.deskripsi}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 👤 PROFIL DROPDOWN */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {/* Bungkus ikon jadi anchor relatif */}
              <div className="relative flex items-center">
                <button
                  aria-label="Profile"
                  className="cursor-pointer hover:scale-110 transition flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.6}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          Account
                        </h3>
                      </div>
                      <ul className="flex flex-col text-sm text-gray-700">
                        {isLoggedIn ? (
                          <>
                            <li className="hover:bg-gray-100 px-4 py-2 cursor-pointer">
                              <Link href="/orders">Your Orders</Link>
                            </li>
                            <li className="hover:bg-gray-100 px-4 py-2 cursor-pointer">
                              <Link href="/accountsettings">Account Settings</Link>
                            </li>
                            <li
                              onClick={() => {
                                localStorage.removeItem("token");
                                setIsLoggedIn(false);
                                router.push("/");
                              }}
                              className="hover:bg-gray-100 px-4 py-2 cursor-pointer text-red-600 font-medium border-t border-gray-100"
                            >
                              Logout
                            </li>
                          </>
                        ) : (
                          <li
                            onClick={() => router.push("/login")}
                            className="hover:bg-gray-100 px-4 py-2 cursor-pointer text-[#E50914] font-medium"
                          >
                            Login
                          </li>
                        )}
                      </ul>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
              {/* Nama user tetap di samping ikon */}
              {isLoggedIn && userName && (
                <span className="ml-2 text-sm font-medium text-gray-700 truncate max-w-[110px]">
                  {userName}
                </span>
              )}
            </div>

            {/* 🛒 CART */}
            <Link
              href="/cart"
              aria-label="Cart"
              className="hover:scale-110 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
            </Link>
          </div>
        </nav>
      </header>

      {/* + Toaster global pojok kanan atas */}
      <Toaster position="top-right" containerStyle={{ top: 80 }} />

      {/* 🔲 SIDEBAR KIRI */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed top-0 left-0 w-72 h-full bg-[#020403] z-50 flex flex-col p-6 shadow-2xl text-white"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold tracking-wide">MENU</h2>
                <button
                  className="text-2xl font-bold hover:text-[#E50914] transition"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <SidebarMenu setOpen={setOpen} router={router} />

              <div className="mt-auto text-sm text-gray-500 border-t border-gray-700 pt-4">
                © {new Date().getFullYear()} Motasera. All Rights Reserved.
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* 🔻 SIDEBAR MENU */
const SidebarMenu = ({
  setOpen,
  router,
}: {
  setOpen: (v: boolean) => void;
  router: ReturnType<typeof useRouter>;
}) => {
  const [active, setActive] = React.useState<string | null>(null);
  const [showCategory, setShowCategory] = React.useState(false);

  const menuItems = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    {
      name: "Category",
      href: "#",
      sub: [
        { name: "1:64", scale: "1-64" },
        { name: "1:43", scale: "1-43" },
        { name: "1:18", scale: "1-18" },
        { name: "1:24", scale: "1-24" },
      ],
    },
    { name: "About Us", href: "/about" },
  ];

  return (
    <nav className="flex flex-col gap-6 text-lg font-semibold">
      {menuItems.map((item) => (
        <div key={item.name} className="relative group">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="relative cursor-pointer group"
          >
            <Link
              href={item.href}
              onClick={(e) => {
                if (item.sub) {
                  e.preventDefault();
                  const isClosing = showCategory && active === item.name;
                  setShowCategory(!isClosing);
                  setActive(isClosing ? null : item.name);
                } else {
                  setShowCategory(false);
                  setOpen(false);
                  router.push(item.href);
                }
              }}
              className={`block transition relative pb-1 ${
                active === item.name
                  ? "text-[#E50914]"
                  : "hover:text-[#E50914]"
              }`}
            >
              {item.name}
              <span
                className={`absolute left-0 bottom-0 h-[2px] bg-[#E50914] transition-all duration-900 ease-out ${
                  active === item.name ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
          </motion.div>

          {item.sub && (
            <AnimatePresence>
              {showCategory && active === item.name && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="ml-4 mt-2 flex flex-col gap-3 text-base text-gray-400"
                >
                  {item.sub.map((sub) => (
                    <Link
                      key={sub.name}
                      href={`/products?scale=${sub.scale}`}
                      onClick={() => setOpen(false)}
                      className="hover:text-white transition"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      ))}
    </nav>
  );
};
