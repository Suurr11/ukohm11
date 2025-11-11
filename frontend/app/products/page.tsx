"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/header";
import SidebarFilter from "../components/sidebarfilter";
import api from "@/app/api/api";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8000"; // + base URL

// 🧩 Interface produk
interface Product {
  id: number;
  product_code?: string; // + add
  nama_product: string;
  harga: number;
  scale_diecast: string;
  foto: string;
  limited?: number | boolean; // tinyint(1) dari database
  sold_count?: number;           // + added
  rating_avg?: number;           // + added
  rating_count?: number;         // + added
}

// 🧩 Card produk tunggal
function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/products/${product.id}`);
  };

  // 🔍 Konversi aman ke boolean
  const isLimited = Boolean(Number(product.limited));
  const rating = Number(product.rating_avg ?? 0);
  const filled = Math.round(rating);
  const stars = Array.from({ length: 5 }).map((_, i) => (
    <span key={i} className={i < filled ? "text-yellow-500" : "text-gray-300"}>
      ★
    </span>
  ));

  return (
    <div
      onClick={handleClick}
      className="relative bg-white rounded-lg shadow-md hover:shadow-xl transition-transform hover:scale-105 cursor-pointer overflow-hidden border border-gray-200"
    >
      {/* 🔥 Banner LIMITED */}
      {isLimited && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow">
          LIMITED
        </div>
      )}

      {/* 🖼️ Gambar Produk */}
      <img
        src={`${APP_BASE_URL}/storage/images/${product.foto}`} // + pakai storage/images
        alt={product.nama_product}
        className="w-full h-44 object-cover"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          img.onerror = null;
          img.src = `${APP_BASE_URL}/images/${product.foto}`; // + fallback
        }}
      />

      {/* 🧾 Informasi Produk */}
      <div className="p-3 text-center">
        <h3 className="text-gray-900 font-semibold text-sm truncate">
          {product.nama_product}
        </h3>
        <p className="text-gray-500 text-xs mt-1">
          Scale {product.scale_diecast}
        </p>
        <p className="text-[#E50914] font-bold text-sm mt-1">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(product.harga)}
        </p>

        {/* + Rating & Terjual */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="flex">{stars}</span>
            <span className="text-gray-600 ml-1">
              {rating.toFixed(1)}{product.rating_count ? ` (${product.rating_count})` : ""}
            </span>
          </div>
          <div className="text-gray-600">
            Terjual {product.sold_count ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🧩 Daftar Produk
function ProductList({
  selectedScale,
  limitedOnly,
  sortKey, // + terima sortKey
}: {
  selectedScale: string;
  limitedOnly: boolean;
  sortKey: "recommended" | "price_asc" | "price_desc" | "best_selling";
}) {
  const [products, setProducts] = useState<Product[]>([]);

  // Ambil produk dari API
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Gagal memuat produk:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter produk berdasarkan scale dan limited
  const filteredProducts = products.filter((p) => {
    const matchScale =
      selectedScale === "All" || p.scale_diecast === selectedScale;
    const isLimited = Boolean(Number(p.limited));
    const matchLimited = !limitedOnly || isLimited;
    return matchScale && matchLimited;
  });

  // + Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortKey === "price_asc") return Number(a.harga) - Number(b.harga);
    if (sortKey === "price_desc") return Number(b.harga) - Number(a.harga);
    if (sortKey === "best_selling") return Number(b.sold_count ?? 0) - Number(a.sold_count ?? 0);
    return 0; // recommended: no sorting change
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {sortedProducts.length > 0 ? (
        sortedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          Tidak ada produk ditemukan.
        </p>
      )}
    </div>
  );
}

// 🧩 Halaman Utama Produk
export default function ProductsPage() {
  const searchParams = useSearchParams();
  const scaleFromQuery = searchParams.get("scale");
  const [selectedScale, setSelectedScale] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [limitedOnly, setLimitedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<"recommended" | "price_asc" | "price_desc" | "best_selling">("recommended"); // + state sort

  useEffect(() => {
    if (scaleFromQuery) setSelectedScale(scaleFromQuery);
    else setSelectedScale("All");
  }, [scaleFromQuery]);

  return (
    <main className="bg-gray-50 min-h-screen">
      <Header />

      <div className="pt-28 px-6 md:px-16 pb-12 flex flex-col md:flex-row gap-8">
        {/* 📱 Tombol Filter (Mobile) */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="px-4 py-2 border border-gray-400 rounded-md bg-white text-sm font-medium hover:bg-gray-100 transition cursor-pointer"
          >
            {showFilter ? "Close Filter" : "Filter"}
          </button>
        </div>

        {/* 🧭 Sidebar Filter */}
        <div
          className={`${showFilter ? "block" : "hidden"} md:block md:w-1/4 w-full`}
        >
          <SidebarFilter
            selectedScale={selectedScale}
            onScaleChange={setSelectedScale}
            limitedOnly={limitedOnly}
            onLimitedChange={setLimitedOnly}
          />
        </div>

        {/* 🛍️ Product Grid */}
        <div className="flex-1">
          <div className="mb-6 hidden md:flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              Products{" "}
              {selectedScale !== "All" && (
                <span className="text-gray-500 text-lg ml-2">
                  (Scale {selectedScale})
                </span>
              )}
            </h1>

            {/* + Sort By (desktop) */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-black">Sort by:</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
                className="cursor-pointer border border-gray-300 bg-white rounded-md px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="best_selling">Produk Terlaris</option>
              </select>
            </div>
          </div>

          {/* + Mobile Sort Bar */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Products</h1>
            <div className="flex items-center gap-2">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
                className="cursor-pointer border border-gray-300 bg-white rounded-md px-3 py-1.5 text-sm text-black"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="best_selling">Produk Terlaris</option>
              </select>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="px-3 py-1.5 border border-gray-400 rounded-md bg-white text-sm font-medium hover:bg-gray-100 transition cursor-pointer"
              >
                {showFilter ? "Close" : "Filter"}
              </button>
            </div>
          </div>

          <ProductList
            selectedScale={selectedScale}
            limitedOnly={limitedOnly}
            sortKey={sortKey} // + kirim sort key
          />
        </div>
      </div>
    </main>
  );
}
